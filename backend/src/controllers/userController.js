// backend/src/controllers/userController.js

const User = require('../models/userModel');
const Document = require('../models/documentModel');
const Address = require('../models/addressModel');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const nodemailer = require('nodemailer'); 
// ✅ IMPORTANTE: Importamos la nueva función generateRegisterTemplate
const { generateRegisterTemplate, getBrandingAttachments } = require('../utils/emailTemplates');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
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
        filePathDB = `/uploads/documents/${documentFile.filename}`;
        await Document.create({
          owner_type: 'user',
          owner_id: newUser.id,
          document_type: 'license',
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

      // --- 5. CORREO AL ADMIN (CON NUEVO TEMPLATE) ---
      // Preparamos los datos para el template bonito
      const registerEmailData = {
        fullName: full_name,
        roleName: roleFriendlyName,
        email: email,
        phone: cleanPhone,
        company: cleanCompany,
        taxId: cleanTaxId,
        fullAddress: fullAddress.replace(/\n/g, '<br>') // Formato HTML para dirección
      };

      // Generamos el HTML usando la nueva función
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

  getAllUsers: async (req, res) => { try { const users = await User.findAll(); res.json(users); } catch (e) { res.status(500).json({error: 'Error'}); } },
  getUserById: async (req, res) => { try { const {id} = req.params; const user = await User.findById(id); if(!user) return res.status(404).json({error: 'No found'}); res.json(user); } catch (e) { res.status(500).json({error: 'Error'}); } }
};

module.exports = userController;