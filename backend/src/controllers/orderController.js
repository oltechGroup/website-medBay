// backend/src/controllers/orderController.js

const Order = require('../models/orderModel');
const OrderItem = require('../models/orderItemModel');
const Inventory = require('../models/productLotModel');
const Cart = require('../models/cartModel');
const NotificationService = require('../services/notificationService');
const Document = require('../models/documentModel');

const orderController = {

  // --- 1. CREAR SOLICITUD (Paso 1 del Flujo B2B) ---
  // Cliente envía productos + dirección. SIN envío ni pago aún.
  create: async (req, res) => {
    try {
      const customer_id = req.user.id;
      const { 
        items, 
        shipping_address_id, 
        billing_address_id, 
        referral_code, 
        notes 
      } = req.body;

      // Validaciones básicas
      if (!items || items.length === 0) return res.status(400).json({ error: 'La orden debe contener items' });
      if (!shipping_address_id) return res.status(400).json({ error: 'Dirección de envío obligatoria' });

      // Cálculo SOLO de productos (Subtotal)
      const itemsSubtotal = items.reduce((sum, item) => sum + (parseFloat(item.unit_price) * item.quantity), 0);
      
      // Creamos la orden en estado 'pending_valuation'
      // Nota: Shipping cost y Tax inician en 0
      const newOrder = await Order.create({
        customer_id,
        subtotal: itemsSubtotal,
        currency: 'USD',
        shipping_address_id,
        billing_address_id: billing_address_id || shipping_address_id,
        referral_code,
        notes
      });

      // Insertar Ítems
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

      // Reservar Inventario
      for (const item of items) {
        if (item.product_lot_id && Inventory.reserveLotQuantity) {
           await Inventory.reserveLotQuantity(item.product_lot_id, item.quantity);
        }
      }

      // Limpiar Carrito
      await Cart.clearCart(customer_id);

      // Notificar (Email de "Solicitud Recibida")
      NotificationService.notifyOrderCreated(newOrder.id).catch(err => console.error('Error email create:', err));

      res.status(201).json({
        success: true,
        message: 'Solicitud recibida. Esperando cotización de envío.',
        order_id: newOrder.id
      });

    } catch (error) {
      console.error('Error al crear solicitud:', error);
      res.status(500).json({ error: 'Error interno', details: error.message });
    }
  },

  // --- 2. GESTIÓN DE COTIZACIÓN (Admin) ---

  // A) Agregar una opción de envío a la orden
  addShippingOption: async (req, res) => {
    try {
      const { id } = req.params; // Order ID
      const { name, description, estimated_days, cost } = req.body;

      if (req.user.verification_level !== 'admin') return res.status(403).json({ error: 'No autorizado' });

      const option = await Order.createShippingOption({
        order_id: id,
        name, 
        description, 
        estimated_days, 
        cost
      });

      res.status(201).json(option);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al agregar opción de envío' });
    }
  },

  // B) Enviar Propuesta al Cliente (Finalizar Valuación)
  submitValuation: async (req, res) => {
    try {
      const { id } = req.params; // Order ID
      const { tax_amount } = req.body;

      if (req.user.verification_level !== 'admin') return res.status(403).json({ error: 'No autorizado' });

      // Actualizar Tax y cambiar estado a 'waiting_customer_approval'
      const updatedOrder = await Order.updateTaxAndStatus(id, tax_amount);

      // TODO: Notificar al cliente "Tu cotización está lista"
      // NotificationService.notifyValuationReady(id); 

      res.json({ success: true, order: updatedOrder });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al enviar valuación' });
    }
  },

  // --- 3. SELECCIÓN DEL CLIENTE (Paso 2 del Flujo B2B) ---

  selectShippingMethod: async (req, res) => {
    try {
      const { id } = req.params; // Order ID
      const { shipping_option_id } = req.body;

      // Seguridad: Verificar que la orden pertenezca al usuario
      const order = await Order.findById(id);
      if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
      if (order.customer_id !== req.user.id) return res.status(403).json({ error: 'No autorizado' });

      // Lógica en Modelo: Fija el costo, actualiza el total y cambia a 'payment_pending'
      const finalOrder = await Order.selectShippingOption(id, shipping_option_id);

      // Notificar al cliente (Confirmación de total a pagar)
      // NotificationService.notifyOrderApproved(id); // Reusamos este template o creamos uno nuevo

      res.json({ success: true, order: finalOrder });
    } catch (error) {
      console.error('Error seleccionando envío:', error);
      res.status(500).json({ error: 'Error al procesar selección' });
    }
  },

  // --- OBTENER DETALLE (Modificado para incluir opciones) ---
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
      
      // ✅ NUEVO: Obtener opciones de envío (si existen)
      const shippingOptions = await Order.getShippingOptions(id);

      // Lógica de Proveedores
      const suppliersMap = new Map();
      items.forEach(item => {
        if (item.supplier_name) {
          suppliersMap.set(item.supplier_id, {
            id: item.supplier_id,
            name: item.supplier_name,
            contact_info: item.supplier_contact || 'Sin contacto',
            country: item.supplier_country || 'Intl'
          });
        }
      });
      const uniqueSuppliers = Array.from(suppliersMap.values());

      res.json({ 
        order, 
        items, 
        shippingOptions, // Agregado a la respuesta
        suppliers: uniqueSuppliers 
      });

    } catch (error) {
      console.error('Error al obtener detalle:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  },

  // --- MÉTODOS EXISTENTES (Mantener compatibilidad) ---

  getAll: async (req, res) => {
    try {
      const orders = await Order.findAll();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener órdenes' });
    }
  },

  getMyOrders: async (req, res) => {
    try {
      const customer_id = req.user.id;
      const orders = await Order.findByCustomer(customer_id);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener mis órdenes' });
    }
  },

  // Actualizar Estado (Bitácora / Admin General)
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, tracking_number } = req.body;

      if (req.user.verification_level !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });

      const updatedOrder = await Order.updateStatus(id, status, req.user.id);
      
      if (status === 'shipped' && tracking_number) {
         if (Order.updateTracking) await Order.updateTracking(id, tracking_number);
      }

      // Notificaciones (Compatibilidad)
      try {
        if (status === 'rejected') await NotificationService.notifyOrderRejected(id);
        else if (status === 'shipped') await NotificationService.notifyOrderShipped(id, tracking_number);
      } catch (e) { console.error(e); }

      res.json({ message: 'Estado actualizado', order: updatedOrder });

    } catch (error) {
      res.status(500).json({ error: 'Error actualizando estado' });
    }
  },

  uploadEvidence: async (req, res) => {
    try {
      const { id } = req.params;
      const file = req.file; 
      if (!file) return res.status(400).json({ error: 'Falta el archivo' });
      const filePath = `/uploads/evidence/${file.filename}`;

      await Document.create({
        owner_type: 'user',
        owner_id: req.user.id,
        document_type: 'payment_evidence',
        file_path: filePath,
        status: 'under_review',
        notes: `Comprobante de pago para Orden #${id}`,
        reference_id: id
      });

      await Order.updateEvidence(id, filePath);
      NotificationService.notifyPaymentUploaded(id).catch(console.error);

      res.json({ success: true, message: 'Evidencia recibida' });
    } catch (error) {
      res.status(500).json({ error: 'Error interno' });
    }
  }
};

module.exports = orderController;