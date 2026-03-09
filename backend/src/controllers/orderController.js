// backend/src/controllers/orderController.js

const Order = require('../models/orderModel');
const OrderItem = require('../models/orderItemModel');
const Inventory = require('../models/productLotModel');
const Cart = require('../models/cartModel');
const NotificationService = require('../services/notificationService');
const Document = require('../models/documentModel');

const orderController = {

  // --- 1. CREAR SOLICITUD (Paso 1 del Flujo B2B) ---
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

      // ✅ MAGIA DE INVENTARIO: Reservar stock para todos los ítems que tengan lote físico
      for (const item of items) {
        if (item.product_lot_id && Inventory.reserveLotQuantity) {
           await Inventory.reserveLotQuantity(item.product_lot_id, item.quantity);
        }
      }

      // Limpiar Carrito
      await Cart.clearCart(customer_id);

      // Notificar
      NotificationService.notifyOrderCreated(newOrder.id).catch(err => console.error('Error email create:', err));

      res.status(201).json({
        success: true,
        message: 'Solicitud recibida. Esperando cotización de envío.',
        order_id: newOrder.id
      });

    } catch (error) {
      console.error('Error al crear solicitud:', error);
      // Si falla por falta de stock, enviamos el mensaje al frontend
      if(error.message.includes("Stock insuficiente")) {
         return res.status(409).json({ error: 'No hay suficiente inventario disponible para completar la orden.' });
      }
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

      const updatedOrder = await Order.updateTaxAndStatus(id, tax_amount);

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

      const order = await Order.findById(id);
      if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
      if (order.customer_id !== req.user.id) return res.status(403).json({ error: 'No autorizado' });

      const finalOrder = await Order.selectShippingOption(id, shipping_option_id);

      res.json({ success: true, order: finalOrder });
    } catch (error) {
      console.error('Error seleccionando envío:', error);
      res.status(500).json({ error: 'Error al procesar selección' });
    }
  },

  // --- OBTENER DETALLE ---
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const order = await Order.findById(id);
      
      if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

      if (order.customer_id !== req.user.id && req.user.verification_level !== 'admin') {
        return res.status(403).json({ error: 'No autorizado' });
      }

      const items = await OrderItem.findByOrder(id);
      const shippingOptions = await Order.getShippingOptions(id);

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
        shippingOptions, 
        suppliers: uniqueSuppliers 
      });

    } catch (error) {
      console.error('Error al obtener detalle:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  },

  // --- MÉTODOS ESTÁNDAR ---

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

      // ✅ BLINDAJE CONTRA DOBLE DEVOLUCIÓN:
      // 1. Obtenemos el estado actual de la orden ANTES de cambiarlo
      const currentOrder = await Order.findById(id);
      if (!currentOrder) return res.status(404).json({ error: 'Orden no encontrada' });

      const wasAlreadyCancelledOrRejected = currentOrder.status === 'cancelled' || currentOrder.status === 'rejected';
      const isCancellingOrRejecting = status === 'cancelled' || status === 'rejected';

      // 2. Solo devolvemos stock si es la PRIMERA vez que se marca como rechazada/cancelada
      if (isCancellingOrRejecting && !wasAlreadyCancelledOrRejected) {
         const items = await OrderItem.findByOrder(id);
         for (const item of items) {
           if (item.product_lot_id && Inventory.releaseLotQuantity) {
              await Inventory.releaseLotQuantity(item.product_lot_id, item.quantity);
           }
         }
      }

      const updatedOrder = await Order.updateStatus(id, status, req.user.id);
      
      if (status === 'shipped' && tracking_number) {
         if (Order.updateTracking) await Order.updateTracking(id, tracking_number);
      }

      // Notificaciones
      try {
        if (status === 'rejected') await NotificationService.notifyOrderRejected(id);
        else if (status === 'shipped') await NotificationService.notifyOrderShipped(id, tracking_number);
        else if (status === 'delivered') {
            if(NotificationService.notifyOrderDelivered) await NotificationService.notifyOrderDelivered(id);
        }
      } catch (e) { console.error(e); }

      res.json({ message: 'Estado actualizado', order: updatedOrder });

    } catch (error) {
      console.error(error);
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
  },

  // Enviar mensaje de seguimiento (Concierge)
  sendUpdateMessage: async (req, res) => {
    try {
      if (req.user.verification_level !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });

      const { id } = req.params; // Order ID
      const { message } = req.body; 

      if (!message) return res.status(400).json({ error: "El mensaje no puede estar vacío" });

      const order = await Order.findById(id);
      if (!order) return res.status(404).json({ error: "Orden no encontrada" });

      // 1. Guardar en Timeline
      await Order.addTimelineEntry(
        id, 
        req.user.id, 
        order.status, 
        message,
        "Actualización de Seguimiento"
      );

      // 2. Enviar Correo
      try {
        if(NotificationService.sendCustomEmail) {
            await NotificationService.sendCustomEmail(
                order.customer_email, 
                `Actualización sobre tu pedido #${id.slice(0,8)}`,
                message,
                `Hola ${order.customer_name}, actualización de tu envío:`
            );
        } else {
            console.log("⚠️ NotificationService.sendCustomEmail no implementado. Mensaje solo guardado en BD.");
        }
      } catch (err) {
        console.error("Error enviando email manual:", err);
      }

      res.json({ success: true, message: "Mensaje enviado y registrado." });

    } catch (error) {
      console.error("Error enviando mensaje:", error);
      res.status(500).json({ error: "Error interno" });
    }
  }
};

module.exports = orderController;