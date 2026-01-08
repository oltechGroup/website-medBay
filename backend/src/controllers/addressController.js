// backend/src/controllers/addressController.js

const Address = require('../models/addressModel');

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

  // --- ELIMINAR DIRECCIÓN ---
  deleteAddress: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const deletedAddress = await Address.deleteById(id, userId);

      if (!deletedAddress) {
        return res.status(404).json({ error: 'Dirección no encontrada o no tienes permiso para eliminarla' });
      }

      res.json({ message: 'Dirección eliminada correctamente' });

    } catch (error) {
      console.error('Error al eliminar dirección:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = addressController;