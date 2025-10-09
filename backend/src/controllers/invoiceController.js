const Invoice = require('../models/invoiceModel');
const Order = require('../models/orderModel');

const invoiceController = {
  // Crear nueva factura
  create: async (req, res) => {
    try {
      const invoiceData = {
        ...req.body,
        created_by: req.user.id
      };

      // Validaciones básicas
      if (!invoiceData.order_id) {
        return res.status(400).json({ error: 'order_id es requerido' });
      }

      // Verificar que la orden existe
      const order = await Order.findById(invoiceData.order_id);
      if (!order) {
        return res.status(404).json({ error: 'Orden no encontrada' });
      }

      // Verificar que la orden esté aprobada
      if (order.status !== 'approved') {
        return res.status(400).json({ error: 'Solo se pueden facturar órdenes aprobadas' });
      }

      const newInvoice = await Invoice.create(invoiceData);
      res.status(201).json({
        message: 'Factura creada exitosamente',
        invoice: newInvoice
      });

    } catch (error) {
      console.error('Error al crear factura:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener todas las facturas (solo admin)
  getAll: async (req, res) => {
    try {
      const invoices = await Invoice.findAll();
      res.json(invoices);
    } catch (error) {
      console.error('Error al obtener facturas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener factura por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const invoice = await Invoice.findById(id);
      
      if (!invoice) {
        return res.status(404).json({ error: 'Factura no encontrada' });
      }

      // Verificar permisos: admin o el dueño de la orden
      const order = await Order.findById(invoice.order_id);
      if (order.customer_id !== req.user.id && req.user.verification_level !== 'admin') {
        return res.status(403).json({ error: 'No tienes permisos para ver esta factura' });
      }

      res.json(invoice);
    } catch (error) {
      console.error('Error al obtener factura:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener factura por order_id
  getByOrderId: async (req, res) => {
    try {
      const { orderId } = req.params;
      const invoice = await Invoice.findByOrderId(orderId);
      
      if (!invoice) {
        return res.status(404).json({ error: 'Factura no encontrada' });
      }

      // Verificar permisos: admin o el dueño de la orden
      const order = await Order.findById(orderId);
      if (order.customer_id !== req.user.id && req.user.verification_level !== 'admin') {
        return res.status(403).json({ error: 'No tienes permisos para ver esta factura' });
      }

      res.json(invoice);
    } catch (error) {
      console.error('Error al obtener factura:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = invoiceController;