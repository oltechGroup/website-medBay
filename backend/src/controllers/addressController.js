// backend/src/controllers/addressController.js

const Address = require('../models/addressModel');
const db = require('../config/database'); // Necesario para consultas directas y notificaciones
const transporter = require('../config/mailer');
const { 
  generateFiscalAddressChangeTemplate, 
  getBrandingAttachments 
} = require('../utils/emailTemplates');

const addressController = {
  // --- OBTENER TODAS LAS DIRECCIONES DEL USUARIO ---
  getAddresses: async (req, res) => {
    try {
      const userId = req.user.id; // Viene del token
      const addresses = await Address.findAllByUserId(userId);
      res.json(addresses);
    } catch (error) {
      console.error('Error al obtener direcciones:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // --- CREAR NUEVA DIRECCIÓN ---
  createAddress: async (req, res) => {
    try {
      const userId = req.user.id;
      const {
        street,
        street_number,
        suite_number,
        colony,
        city,
        state,
        country,
        postal_code,
        between_streets,
        reference_point,
        address_type // 'shipping' o 'billing'
      } = req.body;

      // Validaciones básicas
      if (!street || !street_number || !city || !state || !country || !postal_code) {
        return res.status(400).json({ error: 'Faltan campos obligatorios (Calle, Número, Ciudad, Estado, País, CP)' });
      }

      const newAddress = await Address.create({
        user_id: userId,
        street,
        street_number,
        suite_number,
        colony,
        city,
        state,
        country,
        postal_code,
        between_streets,
        reference_point,
        address_type,
        is_fiscal: false // Las direcciones creadas en checkout no son fiscales por defecto
      });

      res.status(201).json({
        message: 'Dirección guardada exitosamente',
        address: newAddress
      });

    } catch (error) {
      console.error('Error al crear dirección:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // --- ACTUALIZAR DIRECCIÓN (CON ALERTA DE SEGURIDAD) ---
  updateAddress: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const {
        street, street_number, suite_number, colony, city, 
        state, country, postal_code, between_streets, reference_point
      } = req.body;

      // 1. Verificar existencia y si es fiscal antes de actualizar
      const checkQuery = 'SELECT * FROM addresses WHERE id = $1 AND user_id = $2';
      const checkResult = await db.query(checkQuery, [id, userId]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Dirección no encontrada' });
      }

      const oldAddress = checkResult.rows[0];

      // 2. Ejecutar la actualización en BD
      const updateQuery = `
        UPDATE addresses 
        SET street = $1, street_number = $2, suite_number = $3, colony = $4, 
            city = $5, state = $6, country = $7, postal_code = $8, 
            between_streets = $9, reference_point = $10
        WHERE id = $11
        RETURNING *
      `;

      const values = [
        street, street_number, suite_number, colony, city, 
        state, country, postal_code, between_streets, reference_point, 
        id
      ];

      const updateResult = await db.query(updateQuery, values);
      const updatedAddress = updateResult.rows[0];

      // 3. 🚨 LÓGICA DE ALERTA: Si la dirección es Fiscal, avisar al Admin
      if (oldAddress.is_fiscal) {
        
        // A) Obtener datos del usuario para el reporte
        const userQuery = 'SELECT full_name, email, company_name FROM users WHERE id = $1';
        const userRes = await db.query(userQuery, [userId]);
        const user = userRes.rows[0];

        // B) Formatear la nueva dirección para el correo
        const addressString = `
          ${updatedAddress.street} #${updatedAddress.street_number} ${updatedAddress.suite_number ? 'Int. ' + updatedAddress.suite_number : ''}<br>
          Col. ${updatedAddress.colony || 'N/A'}<br>
          ${updatedAddress.city}, ${updatedAddress.state}, ${updatedAddress.postal_code}<br>
          ${updatedAddress.country}
        `;

        // C) Generar Template HTML
        const htmlContent = generateFiscalAddressChangeTemplate({
          userId: userId,
          userName: user.full_name,
          userEmail: user.email,
          companyName: user.company_name,
          newAddress: addressString
        });

        // D) Insertar Notificación en Dashboard Admin
        await db.query(
          'INSERT INTO notifications (type, sender_name, sender_email, subject, content) VALUES ($1, $2, $3, $4, $5)',
          [
            'security_alert', 
            user.full_name, 
            user.email, 
            '⚠️ Cambio de Dirección Fiscal', 
            JSON.stringify({ 
              message: 'El usuario ha modificado sus datos de facturación.',
              old_address_id: id 
            })
          ]
        );

        // E) Enviar Correo al Admin
        await transporter.sendMail({
          from: `"Seguridad MedBay" <${process.env.EMAIL_USER}>`,
          to: "medbay.info02@gmail.com", // Correo del Admin
          subject: `⚠️ Alerta: Cambio de Dirección Fiscal - ${user.full_name}`,
          html: htmlContent,
          attachments: getBrandingAttachments()
        });

        console.log(`[Audit] Cambio de dirección fiscal reportado para usuario ${userId}`);
      }

      res.json({
        message: 'Dirección actualizada correctamente',
        address: updatedAddress,
        audit_alert: oldAddress.is_fiscal // Flag para debug en frontend si se desea
      });

    } catch (error) {
      console.error('Error al actualizar dirección:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // --- ELIMINAR DIRECCIÓN ---
  deleteAddress: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      // Primero verificamos si es fiscal
      const checkQuery = 'SELECT is_fiscal FROM addresses WHERE id = $1 AND user_id = $2';
      const checkResult = await db.query(checkQuery, [id, userId]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Dirección no encontrada' });
      }

      // No permitir eliminar la dirección fiscal (debe ser reemplazada o editada, no borrada)
      if (checkResult.rows[0].is_fiscal) {
        return res.status(400).json({ error: 'No puedes eliminar tu dirección fiscal principal. Edítala en su lugar.' });
      }

      const deletedAddress = await Address.deleteById(id, userId);
      res.json({ message: 'Dirección eliminada correctamente' });

    } catch (error) {
      console.error('Error al eliminar dirección:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = addressController;