// backend/src/controllers/userController.js

const User = require('../models/userModel');
const Document = require('../models/documentModel');
const Address = require('../models/addressModel');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const nodemailer = require('nodemailer'); 
const { generateRegisterTemplate, getBrandingAttachments } = require('../utils/emailTemplates');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false
  }
});

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const userController = {
  
  // --- REGISTRO PÚBLICO (Clientes) ---
  register: async (req, res) => {
    try {
      const { 
        email, password, full_name, company_name, tax_id, verification_level, phone,
        country, postal_code, state, city, colony, street, street_number, 
        suite_number, between_streets, reference_point
      } = req.body;

      const documentFile = req.file; 

      // Limpieza de datos
      const clean = (val) => (val && val !== 'null' && val !== 'undefined' && val.trim() !== '') ? val : null;

      const cleanCompany = clean(company_name);
      const cleanTaxId = clean(tax_id);
      const cleanPhone = clean(phone);
      const cleanSuite = clean(suite_number);
      const cleanBetween = clean(between_streets);
      const cleanRef = clean(reference_point);

      if (!email || !password || !full_name) {
        return res.status(400).json({ error: 'Faltan datos obligatorios de la cuenta.' });
      }

      const rolesRequireDoc = ['medical_professional', 'business_verified'];
      if (rolesRequireDoc.includes(verification_level) && !documentFile) {
        return res.status(400).json({ error: 'Es obligatorio adjuntar el documento probatorio (Cédula/Acta).' });
      }

      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'Este correo electrónico ya está registrado.' });
      }

      const roleFriendlyName = verification_level === 'medical_professional' 
        ? 'Profesional de Salud' 
        : verification_level === 'business_verified' 
          ? 'Cuenta Empresarial'
          : 'Consumidor Básico';

      const password_hash = await bcrypt.hash(password, 12);

      // --- 1. CREAR USUARIO ---
      const newUser = await User.create({
        email,
        password_hash,
        full_name,
        company_name: cleanCompany,
        tax_id: cleanTaxId,
        country,
        verification_level: verification_level || 'consumer_basic',
        phone: cleanPhone
      });

      // --- 2. CREAR DIRECCIÓN ---
      await Address.create({
        user_id: newUser.id,
        address_type: 'billing',
        street,
        street_number,
        suite_number: cleanSuite,
        colony,
        city,
        state,
        country,
        postal_code,
        between_streets: cleanBetween,
        reference_point: cleanRef,
        is_fiscal: true
      });

      // --- 3. CREAR DOCUMENTO ---
      let filePathDB = null;
      if (documentFile) {
        filePathDB = `/uploads/evidence/${documentFile.filename}`;
        
        await Document.create({
          owner_type: 'user',
          owner_id: newUser.id,
          document_type: 'license', // Es registro, así que es licencia/acta
          file_path: filePathDB,
          status: 'uploaded',
          notes: `Registro inicial: ${roleFriendlyName}`
        });
      }

      const fullAddress = [
        `${street} #${street_number} ${cleanSuite ? 'Int. ' + cleanSuite : ''}`,
        `Col. ${colony}, CP: ${postal_code}`,
        `${city}, ${state}, ${country}`,
        cleanBetween ? `Entre calles: ${cleanBetween}` : null,
        cleanRef ? `Ref: ${cleanRef}` : null
      ].filter(Boolean).join('\n');

      // --- 4. NOTIFICACIÓN DASHBOARD ---
      const notifContent = {
        mensaje: `Nueva solicitud de registro recibida para validación.`,
        extra_data: {
          user_id: newUser.id,
          role_name: roleFriendlyName,
          company: cleanCompany || 'N/A',
          tax_id: cleanTaxId || 'N/A',
          phone: cleanPhone || 'N/A',
          address: fullAddress,
          file_path: filePathDB 
        }
      };
      
      await pool.query(
        'INSERT INTO notifications (type, sender_name, sender_email, subject, content) VALUES ($1, $2, $3, $4, $5)',
        [
          'Registro Usuario', 
          full_name, 
          email, 
          `Validación: ${roleFriendlyName}`, 
          JSON.stringify(notifContent)
        ]
      );

      // --- 5. CORREO AL ADMIN ---
      const registerEmailData = {
        fullName: full_name,
        roleName: roleFriendlyName,
        email: email,
        phone: cleanPhone,
        company: cleanCompany,
        taxId: cleanTaxId,
        fullAddress: fullAddress.replace(/\n/g, '<br>')
      };

      const adminHtml = generateRegisterTemplate(registerEmailData);

      await transporter.sendMail({
        from: `"Sistema MedBay" <${process.env.EMAIL_USER}>`,
        to: "medbay.info02@gmail.com",
        subject: `🔔 Nueva Solicitud: ${full_name} (${roleFriendlyName})`,
        html: adminHtml, 
        attachments: getBrandingAttachments()
      });

      res.status(201).json({
        success: true,
        message: 'Registro recibido exitosamente. En espera de validación.',
        user: { id: newUser.id }
      });

    } catch (error) {
      console.error('🔥 Error crítico en registro:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor al procesar el registro.',
        details: error.message 
      });
    }
  },

  // --- GESTIÓN DE USUARIOS (Admin Dashboard) ---

  // ✅ 1. OBTENER TODOS (Con Filtros y Paginación)
  getAllUsers: async (req, res) => { 
    try { 
      const { page = 1, limit = 10, search = '', role = 'all' } = req.query;
      const offset = (page - 1) * limit;

      // Construcción dinámica del Query
      let query = `
        SELECT id, email, full_name, company_name, verification_level, account_status, phone, created_at, referral_code
        FROM users
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 0;

      // Filtro por Rol
      if (role !== 'all') {
        paramCount++;
        query += ` AND verification_level = $${paramCount}`;
        params.push(role);
      }

      // Filtro de Búsqueda (Nombre, Email, Empresa)
      if (search) {
        paramCount++;
        query += ` AND (
          full_name ILIKE $${paramCount} OR 
          email ILIKE $${paramCount} OR 
          company_name ILIKE $${paramCount} OR
          referral_code ILIKE $${paramCount}
        )`;
        params.push(`%${search}%`);
      }

      // Ordenamiento y Paginación
      query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      // Ejecutar Query Principal
      const result = await pool.query(query, params);

      // Contar total para paginación (Query separado simplificado)
      let countQuery = `SELECT COUNT(*) FROM users WHERE 1=1`;
      const countParams = [];
      let countParamIdx = 0;

      if (role !== 'all') {
        countParamIdx++;
        countQuery += ` AND verification_level = $${countParamIdx}`;
        countParams.push(role);
      }
      if (search) {
        countParamIdx++;
        countQuery += ` AND (full_name ILIKE $${countParamIdx} OR email ILIKE $${countParamIdx} OR company_name ILIKE $${countParamIdx})`;
        countParams.push(`%${search}%`);
      }

      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);

      res.json({
        data: result.rows,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
      });

    } catch (e) { 
      console.error('Error en getAllUsers:', e);
      res.status(500).json({error: 'Error al obtener usuarios'}); 
    } 
  },

  // ✅ 2. CREAR STAFF (Vendedores/Admin) - Cuenta Activa Directa
  createStaff: async (req, res) => {
    try {
      const { full_name, email, password, phone, role, referral_code } = req.body;

      // Validar que quien crea sea admin (Extra check, aunque el middleware ya lo hace)
      if (req.user.verification_level !== 'admin') {
        return res.status(403).json({ error: 'No autorizado' });
      }

      const existing = await User.findByEmail(email);
      if (existing) return res.status(409).json({ error: 'Email ya registrado' });

      const password_hash = await bcrypt.hash(password, 10);
      
      // Generar código de referencia si no viene uno
      const finalReferralCode = referral_code || `REF-${Math.floor(Math.random() * 10000)}`;

      // Insertar directo con estado 'active'
      const query = `
        INSERT INTO users (email, password_hash, full_name, phone, verification_level, account_status, referral_code)
        VALUES ($1, $2, $3, $4, $5, 'active', $6)
        RETURNING id, email, full_name, verification_level, referral_code
      `;
      
      const result = await pool.query(query, [email, password_hash, full_name, phone, role, finalReferralCode]);

      res.status(201).json({
        message: 'Usuario staff creado exitosamente',
        user: result.rows[0]
      });

    } catch (error) {
      console.error('Error creating staff:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  },

  // ✅ 3. OBTENER DETALLE USUARIO
  getUserById: async (req, res) => { 
    try { 
      const {id} = req.params; 
      
      // Traemos usuario + documentos + dirección principal
      const userQuery = `
        SELECT u.*, 
          (SELECT json_agg(d.*) FROM documents d WHERE d.owner_id = u.id) as documents,
          (SELECT json_agg(a.*) FROM addresses a WHERE a.user_id = u.id) as addresses
        FROM users u 
        WHERE u.id = $1
      `;
      
      const result = await pool.query(userQuery, [id]);
      
      if(result.rows.length === 0) return res.status(404).json({error: 'Usuario no encontrado'}); 
      
      res.json(result.rows[0]); 
    } catch (e) { 
      res.status(500).json({error: 'Error'}); 
    } 
  },

  // ✅ 4. ACTUALIZAR PERFIL (Usuario Propio) - SOLO TELÉFONO
  updateProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      // 🔒 SEGURIDAD: Solo extraemos 'phone' del body.
      // Si el usuario intenta enviar 'verification_level', 'tax_id', etc., se ignora.
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({ error: 'El teléfono es requerido para actualizar.' });
      }

      const query = `
        UPDATE users 
        SET phone = $1, updated_at = NOW() 
        WHERE id = $2 
        RETURNING id, full_name, email, phone, verification_level, company_name
      `;

      const result = await pool.query(query, [phone, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json({
        message: 'Información de contacto actualizada',
        user: result.rows[0]
      });

    } catch (error) {
      console.error('Error actualizando perfil:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // ✅ 5. ACTUALIZAR ESTADO (Aprobar/Rechazar)
  updateUserStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body; // 'active', 'rejected', 'suspended'

      const result = await pool.query(
        'UPDATE users SET account_status = $1 WHERE id = $2 RETURNING id, email, account_status',
        [status, id]
      );

      if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

      // Opcional: Enviar email de notificación al usuario sobre el cambio de estado
      // NotificationService.notifyStatusChange(...) 

      res.json({ message: 'Estado actualizado', user: result.rows[0] });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error actualizando estado' });
    }
  },

  // ✅ 6. ELIMINAR USUARIO
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      await User.delete(id); // Asumiendo que tu modelo User tiene delete()
      res.json({ message: 'Usuario eliminado' });
    } catch (error) {
      res.status(500).json({ error: 'Error eliminando usuario' });
    }
  }
};

module.exports = userController;