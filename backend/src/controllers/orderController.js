const Order = require('../models/orderModel');
const OrderItem = require('../models/orderItemModel');
const Payment = require('../models/paymentModel');
const Inventory = require('../models/inventoryModel');

const orderController = {
  // Crear nueva orden
  create: async (req, res) => {
    try {
      const { items, payment, ...orderData } = req.body;
      const customer_id = req.user.id;

      // Validaciones básicas
      if (!items || items.length === 0) {
        return res.status(400).json({ error: 'La orden debe contener al menos un item' });
      }

      // Calcular totales
      const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
      const tax = subtotal * 0.16; // Ejemplo: 16% de IVA
      const total = subtotal + tax;

      // Crear la orden
      const newOrder = await Order.create({
        ...orderData,
        customer_id,
        status: 'pending_review',
        subtotal,
        tax,
        total,
        currency: 'MXN', // Por defecto
        review_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas para revisión
      });

      // Crear items de la orden
      const orderItems = items.map(item => ({
        ...item,
        order_id: newOrder.id,
        line_total: item.unit_price * item.quantity
      }));

      const createdItems = await OrderItem.create(orderItems);

      // Crear intento de pago si se proporciona
      let paymentIntent = null;
      if (payment) {
        paymentIntent = await Payment.create({
          order_id: newOrder.id,
          ...payment,
          status: 'authorized'
        });
      }

      // Reservar el inventario
      for (const item of items) {
        if (item.product_lot_id) {
          await Inventory.reserveLotQuantity(item.product_lot_id, item.quantity);
        }
      }

      res.status(201).json({
        message: 'Orden creada exitosamente',
        order: newOrder,
        items: createdItems,
        payment: paymentIntent
      });

    } catch (error) {
      console.error('Error al crear orden:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener todas las órdenes (solo admin)
  getAll: async (req, res) => {
    try {
      const orders = await Order.findAll();
      res.json(orders);
    } catch (error) {
      console.error('Error al obtener órdenes:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener órdenes del usuario actual
  getMyOrders: async (req, res) => {
    try {
      const customer_id = req.user.id;
      const orders = await Order.findByCustomer(customer_id);
      res.json(orders);
    } catch (error) {
      console.error('Error al obtener órdenes:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener orden por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const order = await Order.findById(id);
      
      if (!order) {
        return res.status(404).json({ error: 'Orden no encontrada' });
      }

      // Verificar que el usuario es el dueño o es admin
      if (order.customer_id !== req.user.id && req.user.verification_level !== 'admin') {
        return res.status(403).json({ error: 'No tienes permisos para ver esta orden' });
      }

      const items = await OrderItem.findByOrder(id);
      const payments = await Payment.findByOrder(id);

      res.json({
        order,
        items,
        payments
      });

    } catch (error) {
      console.error('Error al obtener orden:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Actualizar estado de orden
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Solo admin puede cambiar el estado
      if (req.user.verification_level !== 'admin') {
        return res.status(403).json({ error: 'Solo administradores pueden cambiar el estado de las órdenes' });
      }

      const updatedOrder = await Order.updateStatus(id, status, req.user.id);
      
      if (!updatedOrder) {
        return res.status(404).json({ error: 'Orden no encontrada' });
      }

      // Si se aprueba la orden, capturar el pago
      if (status === 'approved') {
        const payments = await Payment.findByOrder(id);
        if (payments.length > 0) {
          const payment = payments[0];
          await Payment.updateStatus(payment.id, 'captured', new Date());
        }
      }

      // Si se rechaza o cancela, liberar el inventario
      if (status === 'rejected' || status === 'cancelled') {
        const items = await OrderItem.findByOrder(id);
        for (const item of items) {
          if (item.product_lot_id) {
            await Inventory.releaseLotQuantity(item.product_lot_id, item.quantity);
          }
        }
      }

      res.json({
        message: 'Estado de orden actualizado exitosamente',
        order: updatedOrder
      });

    } catch (error) {
      console.error('Error al actualizar estado de orden:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = orderController;