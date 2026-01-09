// backend/src/controllers/orderController.js

const Order = require('../models/orderModel');
const OrderItem = require('../models/orderItemModel');
const Payment = require('../models/paymentModel');
const Inventory = require('../models/productLotModel');
const Cart = require('../models/cartModel');
// ✅ IMPORTANTE: Importamos el servicio de notificaciones
const NotificationService = require('../services/notificationService');

const orderController = {
  // --- CREAR ORDEN (Solicitud de Stock) ---
  create: async (req, res) => {
    try {
      const customer_id = req.user.id;
      const { 
        items, 
        shipping_address_id, 
        billing_address_id, 
        shipping_method, 
        payment_method, 
        referral_code, 
        notes 
      } = req.body;

      // 1. Validaciones Básicas
      if (!items || items.length === 0) {
        return res.status(400).json({ error: 'La orden debe contener al menos un item' });
      }
      if (!shipping_address_id) {
        return res.status(400).json({ error: 'La dirección de envío es obligatoria' });
      }

      // 2. Calcular Subtotal
      const itemsSubtotal = items.reduce((sum, item) => sum + (parseFloat(item.unit_price) * item.quantity), 0);

      // 3. Calcular Envío
      let shippingCost = 0;
      if (shipping_method === 'express') shippingCost = 100.00;
      else if (shipping_method === 'standard') shippingCost = 50.00;

      // 4. Calcular Fees
      const baseAmount = itemsSubtotal + shippingCost;
      let paymentFee = 0;

      switch (payment_method) {
        case 'paypal':
        case 'card':
          paymentFee = baseAmount * 0.04;
          break;
        case 'mx_transfer':
          paymentFee = baseAmount * 0.16;
          break;
        default:
          paymentFee = 0;
          break;
      }

      const tax = 0; 
      const total = baseAmount + paymentFee + tax;

      // 5. Crear la Orden en BD (Estado Inicial: pending_review)
      const newOrder = await Order.create({
        customer_id,
        status: 'pending_review', // Siempre nace en revisión
        subtotal: itemsSubtotal,
        shipping_cost: shippingCost,
        payment_fee: paymentFee,
        tax,
        total,
        currency: 'USD',
        shipping_address_id,
        billing_address_id: billing_address_id || shipping_address_id,
        shipping_method,
        payment_method,
        referral_code,
        notes,
        review_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      // 6. Insertar Ítems
      const orderItemsData = items.map(item => ({
        order_id: newOrder.id,
        product_lot_id: item.product_lot_id,
        product_supplier_id: item.product_supplier_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.unit_price * item.quantity,
        expiry_category_name: item.lot_status 
      }));

      await OrderItem.create(orderItemsData);

      // 7. Reservar Inventario
      for (const item of items) {
        if (item.product_lot_id && Inventory.reserveLotQuantity) {
           await Inventory.reserveLotQuantity(item.product_lot_id, item.quantity);
        }
      }

      // 8. Vaciar Carrito
      await Cart.clearCart(customer_id);

      // ✅ 9. NOTIFICAR POR CORREO (Async para no bloquear respuesta)
      NotificationService.notifyOrderCreated(newOrder.id).catch(err => {
        console.error('Error enviando correo de creación:', err);
      });

      // 10. Respuesta
      res.status(201).json({
        success: true,
        message: 'Solicitud recibida. Pendiente de revisión.',
        order_id: newOrder.id,
        total: total
      });

    } catch (error) {
      console.error('Error al crear orden:', error);
      res.status(500).json({ error: 'Error interno al procesar la orden', details: error.message });
    }
  },

  // --- OBTENER TODAS (Admin) ---
  getAll: async (req, res) => {
    try {
      const orders = await Order.findAll();
      res.json(orders);
    } catch (error) {
      console.error('Error al obtener órdenes:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // --- OBTENER MIS ÓRDENES (Cliente) ---
  getMyOrders: async (req, res) => {
    try {
      const customer_id = req.user.id;
      const orders = await Order.findByCustomer(customer_id);
      res.json(orders);
    } catch (error) {
      console.error('Error al obtener mis órdenes:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // --- OBTENER ORDEN POR ID ---
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const order = await Order.findById(id);
      
      if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

      // Seguridad
      if (order.customer_id !== req.user.id && req.user.verification_level !== 'admin') {
        return res.status(403).json({ error: 'No autorizado' });
      }

      const items = await OrderItem.findByOrder(id);
      const payments = await Payment.findByOrder(id); // Si existe tu modelo Payment

      res.json({ order, items, payments });

    } catch (error) {
      console.error('Error al obtener detalle de orden:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // --- ACTUALIZAR ESTADO (Admin) ---
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, tracking_number } = req.body; // Recibimos tracking opcional

      if (req.user.verification_level !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado' });
      }

      // Actualizar en BD
      const updatedOrder = await Order.updateStatus(id, status, req.user.id);
      
      // Si se envió tracking, actualizarlo (asumiendo que Order tiene método para esto)
      if (status === 'shipped' && tracking_number) {
         // Si tienes una columna tracking_number en orders, actualízala aquí
         // await Order.updateTracking(id, tracking_number); 
      }

      // Lógica de devolución de stock si se cancela
      if (status === 'rejected' || status === 'cancelled') {
        const items = await OrderItem.findByOrder(id);
        // Aquí deberías liberar el stock si tienes la función implementada
        // for (const item of items) { Inventory.releaseStock(...) }
      }

      // ✅ NOTIFICAR AL CLIENTE SEGÚN EL ESTADO
      try {
        if (status === 'payment_pending') {
          await NotificationService.notifyOrderApproved(id);
        } else if (status === 'rejected') {
          await NotificationService.notifyOrderRejected(id);
        } else if (status === 'shipped') {
          await NotificationService.notifyOrderShipped(id, tracking_number);
        }
      } catch (notifyError) {
        console.error('Error enviando notificación de estado:', notifyError);
        // No fallamos la petición HTTP si falla el correo, solo logueamos
      }

      res.json({ message: 'Estado actualizado y cliente notificado', order: updatedOrder });

    } catch (error) {
      console.error('Error actualizando estado:', error);
      res.status(500).json({ error: 'Error actualizando estado' });
    }
  },

  // --- SUBIR EVIDENCIA DE PAGO (Cliente) ---
  uploadEvidence: async (req, res) => {
    try {
      const { id } = req.params;
      const file = req.file; 

      if (!file) return res.status(400).json({ error: 'No se subió ningún archivo' });

      const filePath = `/uploads/evidence/${file.filename}`;

      // Actualizar orden a 'payment_review'
      await Order.updateEvidence(id, filePath);

      // ✅ NOTIFICAR AL ADMIN (Hay dinero esperando revisión)
      NotificationService.notifyPaymentUploaded(id).catch(err => {
        console.error('Error notificando pago:', err);
      });

      res.json({ success: true, message: 'Evidencia subida. Validando pago.' });

    } catch (error) {
      console.error('Error subiendo evidencia:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  }
};

module.exports = orderController;