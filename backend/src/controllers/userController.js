// backend/src/controllers/userController.js

const User = require('../models/userModel');
const Document = require('../models/documentModel');
const Address = require('../models/addressModel');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const nodemailer = require('nodemailer'); 
const { generateHtml, getBrandingAttachments } = require('../utils/emailTemplates');

// Pool para notificaciones DB
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Configuración Nodemailer
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
  
  register: async (req, res) => {
    try {
      // 1. Extraer TODOS los datos
      const { 
        email, password, full_name, company_name, tax_id, verification_level, phone,
        country, postal_code, state, city, colony, street, street_number, 
        suite_number, between_streets, reference_point
      } = req.body;

      const documentFile = req.file; 

      // Validaciones básicas
      if (!email || !password || !full_name) {
        return res.status(400).json({ error: 'Faltan datos obligatorios de la cuenta.' });
      }

      const rolesRequireDoc = ['medical_professional', 'business_verified'];
      if (rolesRequireDoc.includes(verification_level) && !documentFile) {
        return res.status(400).json({ error: 'Debes adjuntar un documento probatorio.' });
      }

      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
      }

      // TRADUCCIÓN DE ROL (Para que se vea bonito en Dash y Email)
      const roleFriendlyName = verification_level === 'medical_professional' 
        ? 'Profesional de Salud' 
        : 'Cuenta Empresarial';

      const password_hash = await bcrypt.hash(password, 12);

      // --- PASO 1: CREAR USUARIO ---
      const newUser = await User.create({
        email,
        password_hash,
        full_name,
        company_name: company_name || null,
        tax_id: tax_id || null,
        country,
        verification_level: verification_level || 'consumer_basic',
        phone: phone || null
      });

      // --- PASO 2: CREAR DIRECCIÓN ---
      await Address.create({
        user_id: newUser.id,
        address_type: 'billing',
        street,
        street_number,
        suite_number: suite_number || null,
        colony,
        city,
        state,
        country,
        postal_code,
        between_streets: between_streets || null,
        reference_point: reference_point || null,
        is_fiscal: true
      });

      // --- PASO 3: CREAR DOCUMENTO ---
      if (documentFile) {
        await Document.create({
          owner_type: 'user',
          owner_id: newUser.id,
          document_type: 'license',
          file_path: `/uploads/documents/${documentFile.filename}`,
          status: 'uploaded',
          notes: `Registro inicial: ${roleFriendlyName}`
        });
      }

      // --- CONSTRUCCIÓN DE DIRECCIÓN COMPLETA (Para Dash y Email) ---
      const fullAddress = `
        ${street} #${street_number} ${suite_number ? 'Int. ' + suite_number : ''}
        Col. ${colony}, CP: ${postal_code}
        ${city}, ${state}, ${country}
        ${between_streets ? `\nEntre calles: ${between_streets}` : ''}
        ${reference_point ? `\nRef: ${reference_point}` : ''}
      `.trim();

      // --- PASO 4: NOTIFICACIÓN EN DASHBOARD ---
      const notifContent = {
        mensaje: `Nueva solicitud de registro recibida.`,
        extra_data: {
          user_id: newUser.id,
          role_name: roleFriendlyName, // Guardamos el nombre bonito
          company: company_name || 'N/A',
          tax_id: tax_id || 'N/A',
          phone: phone || 'N/A',
          address: fullAddress, // Dirección completa sin recortes
          file_path: documentFile ? `/uploads/documents/${documentFile.filename}` : null
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

      // --- PASO 5: ENVÍO DE CORREO AL ADMIN ---
      const adminMessage = `
        <p>Se ha recibido una nueva solicitud de registro que requiere tu aprobación.</p>
        
        <h3>Datos del Solicitante</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; border: 1px solid #e2e8f0;">
          <tr style="background: #f8f9fa;"><td style="padding: 10px; font-weight: bold; width: 140px;">Nombre:</td><td style="padding: 10px;">${full_name}</td></tr>
          <tr><td style="padding: 10px; font-weight: bold;">Perfil Solicitado:</td><td style="padding: 10px; color: #2563eb; font-weight: bold;">${roleFriendlyName}</td></tr>
          <tr style="background: #f8f9fa;"><td style="padding: 10px; font-weight: bold;">Empresa:</td><td style="padding: 10px;">${company_name || 'N/A'}</td></tr>
          <tr><td style="padding: 10px; font-weight: bold;">RFC/Tax ID:</td><td style="padding: 10px;">${tax_id || 'N/A'}</td></tr>
          <tr style="background: #f8f9fa;"><td style="padding: 10px; font-weight: bold;">Correo:</td><td style="padding: 10px;">${email}</td></tr>
          <tr><td style="padding: 10px; font-weight: bold;">Teléfono:</td><td style="padding: 10px;">${phone || '-'}</td></tr>
        </table>
        
        <h3>Domicilio Fiscal Registrado</h3>
        <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; font-size: 14px; line-height: 1.6; color: #334155; border: 1px solid #cbd5e1;">
          <strong>Calle:</strong> ${street} #${street_number} ${suite_number ? 'Int. ' + suite_number : ''}<br>
          <strong>Colonia:</strong> ${colony} &nbsp; | &nbsp; <strong>CP:</strong> ${postal_code}<br>
          <strong>Ubicación:</strong> ${city}, ${state}, ${country}<br>
          ${between_streets ? `<br><strong>Entre Calles:</strong> ${between_streets}` : ''}
          ${reference_point ? `<br><strong>Referencias:</strong> ${reference_point}` : ''}
        </div>

        <p style="margin-top: 20px; text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
             style="background: #0f172a; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
             Revisar en Dashboard
          </a>
        </p>
      `;

      const adminHtml = generateHtml(
        'Nueva Solicitud de Registro', 
        {}, 
        adminMessage
      );

      await transporter.sendMail({
        from: `"Sistema MedBay" <${process.env.EMAIL_USER}>`,
        to: "medbay.info02@gmail.com",
        subject: `🔔 Nueva Solicitud: ${full_name} (${roleFriendlyName})`,
        html: adminHtml,
        attachments: getBrandingAttachments()
      });

      res.status(201).json({
        success: true,
        message: 'Registro recibido exitosamente.',
        user: { id: newUser.id }
      });

    } catch (error) {
      console.error('Error al registrar usuario:', error);
      res.status(500).json({ error: 'Error interno del servidor.' });
    }
  },

  getAllUsers: async (req, res) => { try { const users = await User.findAll(); res.json(users); } catch (e) { res.status(500).json({error: 'Error'}); } },
  getUserById: async (req, res) => { try { const {id} = req.params; const user = await User.findById(id); if(!user) return res.status(404).json({error: 'No found'}); res.json(user); } catch (e) { res.status(500).json({error: 'Error'}); } }
};

module.exports = userController;