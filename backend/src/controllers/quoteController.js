// backend/src/controllers/quoteController.js

const Quote = require('../models/quoteModel');
const NotificationService = require('../services/notificationService');

const quoteController = {
  
  // 1. CREAR SOLICITUD (Cliente)
  createRequest: async (req, res) => {
    try {
      // 🔒 VALIDACIÓN ESTRICTA: Solo usuarios logueados
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Debes iniciar sesión para solicitar una cotización.' });
      }

      const userId = req.user.id;
      
      const { 
        product_name, 
        sku, 
        quantity_asked, 
        notes,
        quote_context // Recibimos el contexto inteligente del frontend
      } = req.body;

      // Estructuramos lo que pidió el cliente para guardarlo en la BD (JSONB)
      const productRequest = {
        product_name,
        sku,
        quantity_asked,
        notes,
        quote_context: quote_context || null 
      };

      const newQuote = await Quote.create(userId, null, productRequest);

      // 🔔 Notificar (Async)
      NotificationService.notifyQuoteCreated(newQuote.id).catch(err => 
        console.error('Error enviando notificación cotización:', err)
      );

      res.status(201).json({ 
        success: true, 
        message: 'Solicitud de cotización enviada correctamente.',
        quoteId: newQuote.id 
      });

    } catch (error) {
      console.error('Error creando cotización:', error);
      res.status(500).json({ error: 'Error interno al procesar la solicitud.' });
    }
  },

  // 2. OBTENER TODAS (Dashboard Admin)
  getAll: async (req, res) => {
    try {
      // Verificar permisos de admin
      if (req.user.verification_level !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado' });
      }
      const quotes = await Quote.findAll();
      res.json(quotes);
    } catch (error) {
      console.error('Error obteniendo cotizaciones:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  },

  // 3. OBTENER MIS COTIZACIONES (Cliente)
  getMyQuotes: async (req, res) => {
    try {
      const quotes = await Quote.findByUser(req.user.id);
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ error: 'Error interno' });
    }
  },

  // 4. OBTENER DETALLE
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const quote = await Quote.findById(id);

      if (!quote) return res.status(404).json({ error: 'Cotización no encontrada' });

      // Seguridad: Solo dueño o Admin
      const isOwner = req.user && req.user.id === quote.user_id;
      const isAdmin = req.user && req.user.verification_level === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'No autorizado' });
      }

      res.json(quote);
    } catch (error) {
      res.status(500).json({ error: 'Error interno' });
    }
  },

  // 5. ENVIAR PROPUESTA (Admin responde con datos reales)
  sendProposal: async (req, res) => {
    try {
      // Verificar permisos
      if (req.user.verification_level !== 'admin') {
        return res.status(403).json({ error: 'Solo administradores pueden enviar propuestas' });
      }

      const { id } = req.params;
      
      // ✅ VALIDACIÓN DE ESTADO: Evitar sobreescribir propuestas
      const currentQuote = await Quote.findById(id);
      if (!currentQuote) return res.status(404).json({ error: 'Cotización no encontrada' });

      if (currentQuote.status === 'accepted') {
        return res.status(400).json({ error: 'No puedes modificar una cotización que ya fue aceptada.' });
      }
      
      // Si ya enviaste una propuesta y no ha sido respondida (sigue en 'proposal_sent'), bloqueamos.
      // Solo permitimos reenviar si estaba 'pending' o si fue 'rejected' (contraoferta).
      if (currentQuote.status === 'proposal_sent') {
        return res.status(400).json({ error: 'Ya enviaste una propuesta. Espera la respuesta del cliente.' });
      }

      const { 
        quantity_found, 
        expiry_date, 
        lot_type, 
        unit_price,
        admin_notes 
      } = req.body;

      // Construimos el objeto de propuesta
      const proposalData = {
        quantity_found,
        expiry_date,
        lot_type,
        unit_price,
        admin_notes,
        proposal_date: new Date()
      };

      const updatedQuote = await Quote.updateProposal(id, proposalData);

      // 🔔 Notificar al Cliente con la propuesta
      NotificationService.notifyQuoteProposalSent(id).catch(err => 
        console.error('Error enviando notificación propuesta:', err)
      );

      res.json({ 
        success: true, 
        message: 'Propuesta enviada al cliente', 
        quote: updatedQuote 
      });

    } catch (error) {
      console.error('Error enviando propuesta:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  },

  // 6. RESPONDER PROPUESTA (Cliente Acepta/Rechaza)
  respondToProposal: async (req, res) => {
    try {
      const { id } = req.params;
      const { action } = req.body; // 'accepted' | 'rejected'

      if (!['accepted', 'rejected'].includes(action)) {
        return res.status(400).json({ error: 'Acción inválida' });
      }

      // Validar que sea el dueño
      const quote = await Quote.findById(id);
      if (!quote) return res.status(404).json({ error: 'Cotización no encontrada' });
      
      if (quote.user_id !== req.user.id) {
        return res.status(403).json({ error: 'No autorizado' });
      }

      // ✅ VALIDACIÓN DE ESTADO: No permitir cambiar decisión final
      if (['accepted', 'rejected'].includes(quote.status)) {
        return res.status(400).json({ error: `Esta cotización ya fue ${quote.status === 'accepted' ? 'aceptada' : 'rechazada'}.` });
      }

      const updatedQuote = await Quote.updateStatus(id, action);

      // 🔔 Notificar al Admin de la decisión del cliente
      if (action === 'accepted') {
        NotificationService.notifyQuoteAccepted(id).catch(err => console.error(err));
      } else {
        NotificationService.notifyQuoteRejected(id).catch(err => console.error(err));
      }

      res.json({ 
        success: true, 
        message: `Has ${action === 'accepted' ? 'aceptado' : 'rechazado'} la propuesta.`, 
        quote: updatedQuote 
      });

    } catch (error) {
      console.error('Error respondiendo propuesta:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  },

  // 7. ✅ ELIMINAR COTIZACIÓN (Admin)
  delete: async (req, res) => {
    try {
      // Verificar permisos de admin
      if (req.user.verification_level !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado' });
      }

      const { id } = req.params;
      const deletedQuote = await Quote.delete(id);

      if (!deletedQuote) {
        return res.status(404).json({ error: 'Cotización no encontrada' });
      }

      res.json({ 
        success: true, 
        message: 'Cotización eliminada correctamente' 
      });

    } catch (error) {
      console.error('Error eliminando cotización:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  }
};

module.exports = quoteController;