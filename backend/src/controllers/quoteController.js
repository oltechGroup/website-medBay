// backend/src/controllers/quoteController.js

const db = require('../config/database'); // ✅ IMPORTANTE: Añadido para consultas directas
const Quote = require('../models/quoteModel');
const Order = require('../models/orderModel');       
const OrderItem = require('../models/orderItemModel'); 
const Inventory = require('../models/productLotModel'); // ✅ IMPORTANTE: Para lógica de lotes
const Address = require('../models/addressModel');   
const User = require('../models/userModel');         
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

  // 6. ✅ RESPONDER PROPUESTA (EL PUENTE MÁGICO BLINDADO)
  respondToProposal: async (req, res) => {
    try {
      const { id } = req.params;
      const { action } = req.body; 

      if (!['accepted', 'rejected'].includes(action)) return res.status(400).json({ error: 'Acción inválida' });

      const quote = await Quote.findById(id);
      if (!quote) return res.status(404).json({ error: 'Cotización no encontrada' });
      if (quote.user_id !== req.user.id) return res.status(403).json({ error: 'No autorizado' });
      
      // Validar estado previo
      if (['accepted', 'rejected'].includes(quote.status)) {
        return res.status(400).json({ error: `Esta cotización ya fue ${quote.status}.` });
      }

      // --- LOGICA DE ACEPTACIÓN (CREAR ORDEN E INVENTARIO) ---
      let newOrder = null;

      if (action === 'accepted') {
        const proposal = quote.admin_proposal;
        const request = quote.product_request;
        const context = request.quote_context || {};
        
        // ✅ A. Consultas directas y seguras a la base de datos
        // Dirección
        const addressRes = await db.query('SELECT id FROM addresses WHERE user_id = $1 LIMIT 1', [req.user.id]);
        const defaultAddressId = addressRes.rows.length > 0 ? addressRes.rows[0].id : null;
        
        // Vendedor (Comisiones)
        const userRes = await db.query('SELECT referral_code FROM users WHERE id = $1', [req.user.id]);
        const referralCode = userRes.rows.length > 0 ? userRes.rows[0].referral_code : null;
        
        const subtotal = parseFloat(proposal.unit_price) * parseInt(proposal.quantity_found);

        // ✅ B. LÓGICA INTELIGENTE DE LOTES
        let finalLotId = context.lotId || null;
        let finalProductSupplierId = context.supplierId || null;

        // Si la cotización se hizo sobre un producto en general sin lote específico,
        // necesitamos crear un "Lote Puente" para cuadrar el inventario.
        if (!finalLotId && context.productId) {
           const newLot = await Inventory.createSourcedLot(
             context.productId,
             proposal.quantity_found,
             proposal.unit_price,
             proposal.expiry_date,
             proposal.lot_type
           );
           finalLotId = newLot.id;
           finalProductSupplierId = newLot.product_supplier_id;
        }

        // ✅ C. RESERVAR STOCK (Asegurar que nadie más lo tome)
        if (finalLotId) {
           try {
             await Inventory.reserveLotQuantity(finalLotId, proposal.quantity_found);
           } catch (reserveError) {
             return res.status(409).json({ error: 'El stock ya no está disponible o el lote expiró. Por favor contacta a soporte.' });
           }
        }

        // D. Crear la Orden
        newOrder = await Order.create({
          customer_id: req.user.id,
          subtotal: subtotal,
          currency: 'USD',
          shipping_address_id: defaultAddressId, 
          billing_address_id: defaultAddressId,
          referral_code: referralCode, 
          notes: `Orden generada desde Cotización #${quote.id.slice(0, 8)}. Producto: ${request.product_name}. \nNota Admin: ${proposal.admin_notes || 'N/A'}`,
          quote_id: quote.id 
        });

        // E. Crear los Items de la Orden
        await OrderItem.create([{
          order_id: newOrder.id,
          product_lot_id: finalLotId, 
          product_supplier_id: finalProductSupplierId,
          quantity: proposal.quantity_found,
          unit_price: proposal.unit_price,
          line_total: subtotal
        }]);
      }

      // Actualizar estado de la cotización
      const updatedQuote = await Quote.updateStatus(id, action);

      // Notificaciones con protección extra
      if (action === 'accepted' && newOrder) {
        if(NotificationService.notifyOrderCreated) NotificationService.notifyOrderCreated(newOrder.id).catch(console.error);
        if(NotificationService.notifyQuoteAccepted) NotificationService.notifyQuoteAccepted(id).catch(console.error);
      } else {
        if(NotificationService.notifyQuoteRejected) NotificationService.notifyQuoteRejected(id).catch(console.error);
      }

      res.json({ 
        success: true, 
        message: action === 'accepted' 
          ? '¡Oferta aceptada! Se ha generado tu orden de compra.' 
          : 'Oferta rechazada.', 
        quote: updatedQuote,
        orderId: newOrder ? newOrder.id : null 
      });

    } catch (error) {
      console.error('🔥 Error respondiendo propuesta:', error);
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