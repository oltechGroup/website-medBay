// backend/src/controllers/userController.js

const User = require('../models/userModel');
const Document = require('../models/documentModel');
const Address = require('../models/addressModel');
const Order = require('../models/orderModel'); 
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
  
  // --- REGISTRO PÚBLICO (Clientes y Proveedores) ---
  register: async (req, res) => {
    try {
      const { 
        email, password, full_name, company_name, tax_id, verification_level, phone,
        country, postal_code, state, city, colony, street, street_number, 
        suite_number, between_streets, reference_point
      } = req.body;

      const documentFile = req.file; 

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

      // ✅ MODIFICADO: Agregamos 'supplier' a la lista de los que requieren documento
      const rolesRequireDoc = ['medical_professional', 'business_verified', 'supplier'];
      if (rolesRequireDoc.includes(verification_level) && !documentFile) {
        return res.status(400).json({ error: 'Es obligatorio adjuntar el documento probatorio (Cédula/Acta).' });
      }

      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'Este correo electrónico ya está registrado.' });
      }

      // ✅ MODIFICADO: Agregamos el nombre amigable para el Proveedor
      const roleFriendlyName = verification_level === 'medical_professional' 
        ? 'Profesional de Salud' 
        : verification_level === 'business_verified' 
          ? 'Cuenta Empresarial'
          : verification_level === 'supplier'
            ? 'Proveedor B2B'
            : 'Consumidor Básico';

      const password_hash = await bcrypt.hash(password, 12);

      // --- 1. PROCESO CRÍTICO: BASE DE DATOS ---
      
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

      // ✅ NUEVO: Si es proveedor, crear su registro en suppliers y vincularlo
      if (verification_level === 'supplier') {
        const supplierName = cleanCompany || full_name;
        // Se crea inactivo por defecto, hasta que el Admin apruebe sus documentos
        const supRes = await pool.query(
          'INSERT INTO suppliers (name, country_code, is_active) VALUES ($1, $2, false) RETURNING id',
          [supplierName, country]
        );
        const newSupplierId = supRes.rows[0].id;

        // Actualizamos el usuario recién creado para vincularle el supplier_id
        await pool.query('UPDATE users SET supplier_id = $1 WHERE id = $2', [newSupplierId, newUser.id]);
      }

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

      let filePathDB = null;
      if (documentFile) {
        filePathDB = `/uploads/evidence/${documentFile.filename}`;
        
        await Document.create({
          owner_type: 'user',
          owner_id: newUser.id,
          document_type: 'license', 
          file_path: filePathDB,
          status: 'uploaded',
          notes: `Registro inicial: ${roleFriendlyName}`
        });
      }

      // --- 2. PROCESO SECUNDARIO: NOTIFICACIONES ---
      try {
        const fullAddress = [
          `${street} #${street_number} ${cleanSuite ? 'Int. ' + cleanSuite : ''}`,
          `Col. ${colony}, CP: ${postal_code}`,
          `${city}, ${state}, ${country}`,
          cleanBetween ? `Entre calles: ${cleanBetween}` : null,
          cleanRef ? `Ref: ${cleanRef}` : null
        ].filter(Boolean).join('\n');

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
          'INSERT INTO notifications (type, sender_name, sender_email, subject, content, source, source_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [
            'Registro Usuario', 
            full_name, 
            email, 
            `Validación: ${roleFriendlyName}`, 
            JSON.stringify(notifContent),
            'notification', 
            newUser.id      
          ]
        );

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

      } catch (notificationError) {
        console.error('⚠️ Advertencia: Usuario creado, pero falló el envío de correo o notificación:', notificationError);
      }

      // --- 3. RESPUESTA AL FRONTEND ---
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

  getAllUsers: async (req, res) => { 
    try { 
      const { page = 1, limit = 10, search = '', role = 'all' } = req.query;
      const offset = (page - 1) * limit;

      // ✅ MODIFICADO: Agregamos supplier_id a la consulta por si se necesita en el frontend
      let query = `
        SELECT id, email, full_name, company_name, verification_level, account_status, phone, created_at, referral_code, supplier_id
        FROM users
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 0;

      if (role !== 'all') {
        paramCount++;
        query += ` AND verification_level = $${paramCount}`;
        params.push(role);
      }

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

      query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

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

  // ✅ MODIFICADO: Ahora soporta la creación manual de Proveedores
  createStaff: async (req, res) => {
    try {
      const { full_name, email, password, phone, role, referral_code, company_name, country } = req.body;

      if (req.user.verification_level !== 'admin') {
        return res.status(403).json({ error: 'No autorizado' });
      }

      const existing = await User.findByEmail(email);
      if (existing) return res.status(409).json({ error: 'Email ya registrado' });

      const password_hash = await bcrypt.hash(password, 10);
      
      // Solo generar referral code aleatorio si es agente de ventas y no envió uno
      const finalReferralCode = (role === 'sales_agent' && !referral_code) 
        ? `REF-${Math.floor(Math.random() * 10000)}` 
        : (referral_code || null);

      let newSupplierId = null;

      // Si el rol que se está creando es un proveedor, creamos su perfil automáticamente
      if (role === 'supplier') {
        const supName = company_name || full_name;
        const supCountry = country || 'MX'; // Por defecto MX si no se especifica
        
        // Lo creamos como ACTIVO de una vez, ya que lo está haciendo un Admin
        const supRes = await pool.query(
          'INSERT INTO suppliers (name, country_code, is_active) VALUES ($1, $2, true) RETURNING id',
          [supName, supCountry]
        );
        newSupplierId = supRes.rows[0].id;
      }

      const query = `
        INSERT INTO users (email, password_hash, full_name, phone, verification_level, account_status, referral_code, supplier_id)
        VALUES ($1, $2, $3, $4, $5, 'active', $6, $7)
        RETURNING id, email, full_name, verification_level, referral_code, supplier_id
      `;
      
      const result = await pool.query(query, [email, password_hash, full_name, phone, role, finalReferralCode, newSupplierId]);

      res.status(201).json({
        message: 'Usuario creado exitosamente',
        user: result.rows[0]
      });

    } catch (error) {
      console.error('Error creating staff/supplier:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  },

  getUserById: async (req, res) => { 
    try { 
      const {id} = req.params; 
      
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

  updateProfile: async (req, res) => {
    try {
      const userId = req.user.id;
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

  updateUserStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const result = await pool.query(
        'UPDATE users SET account_status = $1 WHERE id = $2 RETURNING id, email, account_status',
        [status, id]
      );

      if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

      res.json({ message: 'Estado actualizado', user: result.rows[0] });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error actualizando estado' });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      await User.delete(id); 
      res.json({ message: 'Usuario eliminado' });
    } catch (error) {
      res.status(500).json({ error: 'Error eliminando usuario' });
    }
  },

  // --- GESTIÓN DE COMISIONES ---

  getCommissionsSummary: async (req, res) => {
    try {
      if (req.user.verification_level !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado' });
      }
      
      const report = await Order.getUnpaidCommissions();
      res.json(report);
    } catch (error) {
      console.error('Error obteniendo comisiones:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  },

  payUserCommissions: async (req, res) => {
    try {
      if (req.user.verification_level !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado' });
      }

      const { id } = req.params; 

      const userRes = await pool.query('SELECT referral_code, full_name FROM users WHERE id = $1', [id]);
      
      if (userRes.rows.length === 0) return res.status(404).json({ error: 'Vendedor no encontrado' });
      
      const { referral_code, full_name } = userRes.rows[0];
      
      if (!referral_code) {
        return res.status(400).json({ error: 'Este usuario no tiene código de vendedor asignado.' });
      }

      const result = await Order.markCommissionsAsPaid(referral_code);

      if (result.updatedCount === 0) {
        return res.json({ 
          success: false, 
          message: 'No se encontraron ventas entregadas pendientes de pago para este vendedor.' 
        });
      }

      res.json({
        success: true,
        message: `Corte de caja exitoso para ${full_name}.`,
        details: {
          sales_processed: result.updatedCount,
          orders_ids: result.orderIds
        }
      });

    } catch (error) {
      console.error('Error pagando comisiones:', error);
      res.status(500).json({ error: 'Error interno al procesar el pago' });
    }
  }
};

module.exports = userController;