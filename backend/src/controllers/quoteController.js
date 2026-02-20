// backend/src/controllers/quoteController.js

const Quote = require('../models/quoteModel');
const Order = require('../models/orderModel');       // ✅ Conexión con Órdenes
const OrderItem = require('../models/orderItemModel'); // ✅ Conexión con Ítems
const Address = require('../models/addressModel');   // ✅ Para buscar dirección default
const User = require('../models/userModel');         // ✅ Para obtener código de vendedor
const NotificationService = require('../services/notificationService');

const quoteController = {
  
  // 1. CREAR SOLICITUD (Cliente)
  createRequest: async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Debes iniciar sesión para solicitar una cotización.' });
      }

      const userId = req.user.id;
      const { product_name, sku, quantity_asked, notes, quote_context } = req.body;

      const productRequest = {
        product_name,
        sku,
        quantity_asked,
        notes,
        quote_context: quote_context || null 
      };

      const newQuote = await Quote.create(userId, null, productRequest);

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
      if (req.user.verification_level !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado' });
      }
      const quotes = await Quote.findAll();
      res.json(quotes);
    } catch (error) {
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

  // 5. ENVIAR PROPUESTA (Admin)
  sendProposal: async (req, res) => {
    try {
      if (req.user.verification_level !== 'admin') {
        return res.status(403).json({ error: 'Solo administradores pueden enviar propuestas' });
      }

      const { id } = req.params;
      const currentQuote = await Quote.findById(id);
      
      if (!currentQuote) return res.status(404).json({ error: 'Cotización no encontrada' });
      if (currentQuote.status === 'accepted') return res.status(400).json({ error: 'Cotización ya aceptada.' });
      if (currentQuote.status === 'proposal_sent') return res.status(400).json({ error: 'Propuesta ya enviada. Espera respuesta.' });

      const { quantity_found, expiry_date, lot_type, unit_price, admin_notes } = req.body;

      const proposalData = {
        quantity_found,
        expiry_date,
        lot_type,
        unit_price,
        admin_notes,
        proposal_date: new Date()
      };

      const updatedQuote = await Quote.updateProposal(id, proposalData);

      NotificationService.notifyQuoteProposalSent(id).catch(console.error);

      res.json({ success: true, message: 'Propuesta enviada', quote: updatedQuote });

    } catch (error) {
      console.error('Error enviando propuesta:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  },

  // 6. ✅ RESPONDER PROPUESTA (EL PUENTE MÁGICO)
  respondToProposal: async (req, res) => {
    try {
      const { id } = req.params;
      const { action } = req.body; // 'accepted' | 'rejected'

      if (!['accepted', 'rejected'].includes(action)) return res.status(400).json({ error: 'Acción inválida' });

      const quote = await Quote.findById(id);
      if (!quote) return res.status(404).json({ error: 'Cotización no encontrada' });
      if (quote.user_id !== req.user.id) return res.status(403).json({ error: 'No autorizado' });
      
      // Validar estado previo
      if (['accepted', 'rejected'].includes(quote.status)) {
        return res.status(400).json({ error: `Esta cotización ya fue ${quote.status}.` });
      }

      // --- LOGICA DE ACEPTACIÓN (CREAR ORDEN) ---
      let newOrder = null;

      if (action === 'accepted') {
        const proposal = quote.admin_proposal;
        const request = quote.product_request;
        
        // A. Obtener dirección por defecto del usuario
        const userAddresses = await Address.findByUser(req.user.id);
        const defaultAddress = userAddresses.find(a => a.is_default) || userAddresses[0];
        
        // B. Obtener datos del usuario para Referral Code (Comisiones)
        // Esto asegura que si el cliente tiene un vendedor asignado, la orden lo herede.
        const userProfile = await User.findById(req.user.id); // Asumiendo que User tiene findById expuesto o usamos query directa
        // Si no tienes User.findById en el modelo, usaremos null por seguridad, pero idealmente lo traemos.
        
        const subtotal = parseFloat(proposal.unit_price) * parseInt(proposal.quantity_found);

        // C. Crear la Orden (Estado: pending_valuation para que Admin ponga envío/tax)
        newOrder = await Order.create({
          customer_id: req.user.id,
          subtotal: subtotal,
          currency: 'USD',
          shipping_address_id: defaultAddress ? defaultAddress.id : null, 
          billing_address_id: defaultAddress ? defaultAddress.id : null,
          referral_code: userProfile ? userProfile.referral_code : null, // ✅ Vincula la comisión
          notes: `Orden generada desde Cotización #${quote.id.slice(0, 8)}. \nNota Admin: ${proposal.admin_notes || 'N/A'}`,
          quote_id: quote.id // ✅ El vínculo en BD
        });

        // D. Crear los Items de la Orden
        // Intentamos recuperar IDs del contexto si existen (para ligar a inventario real)
        const context = request.quote_context || {};
        
        await OrderItem.create([{
          order_id: newOrder.id,
          // Si tenemos IDs reales del contexto, los usamos. Si no, NULL (es un ítem "ad-hoc")
          product_lot_id: context.lotId || null, 
          product_supplier_id: context.supplierId || null,
          quantity: proposal.quantity_found,
          unit_price: proposal.unit_price,
          line_total: subtotal,
          // Guardamos info descriptiva por si no hay ID de lote
          expiry_category_name: `${proposal.lot_type} (Vence: ${proposal.expiry_date ? proposal.expiry_date.toString().slice(0,10) : 'N/A'})`
        }]);
      }

      // Actualizar estado de la cotización
      const updatedQuote = await Quote.updateStatus(id, action);

      // Notificaciones
      if (action === 'accepted' && newOrder) {
        // Notificar Admin que se creó una orden
        NotificationService.notifyOrderCreated(newOrder.id).catch(console.error);
        // Notificar Cliente que su orden se generó
        NotificationService.notifyQuoteAccepted(id).catch(console.error);
      } else {
        NotificationService.notifyQuoteRejected(id).catch(console.error);
      }

      res.json({ 
        success: true, 
        message: action === 'accepted' 
          ? '¡Oferta aceptada! Se ha generado tu orden de compra.' 
          : 'Oferta rechazada.', 
        quote: updatedQuote,
        orderId: newOrder ? newOrder.id : null // Retornamos ID para redirigir en frontend
      });

    } catch (error) {
      console.error('Error respondiendo propuesta:', error);
      res.status(500).json({ error: 'Error interno al procesar tu respuesta' });
    }
  },

  // 7. ELIMINAR COTIZACIÓN
  delete: async (req, res) => {
    try {
      if (req.user.verification_level !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado' });
      }
      const { id } = req.params;
      const deletedQuote = await Quote.delete(id);
      if (!deletedQuote) return res.status(404).json({ error: 'Cotización no encontrada' });
      res.json({ success: true, message: 'Cotización eliminada' });
    } catch (error) {
      res.status(500).json({ error: 'Error interno' });
    }
  }
};

module.exports = quoteController;