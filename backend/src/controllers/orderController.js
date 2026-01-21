// backend/src/controllers/orderController.js

const Order = require('../models/orderModel');
const OrderItem = require('../models/orderItemModel');
const Payment = require('../models/paymentModel');
const Inventory = require('../models/productLotModel');
const Cart = require('../models/cartModel');
const NotificationService = require('../services/notificationService');
const Document = require('../models/documentModel'); // ✅ IMPORTACIÓN NUEVA

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

      // 1. Validaciones
      if (!items || items.length === 0) return res.status(400).json({ error: 'La orden debe contener items' });
      if (!shipping_address_id) return res.status(400).json({ error: 'Dirección de envío obligatoria' });

      // 2. Cálculos (Subtotal, Envío, Fees)
      const itemsSubtotal = items.reduce((sum, item) => sum + (parseFloat(item.unit_price) * item.quantity), 0);

      let shippingCost = 0;
      if (shipping_method === 'express') shippingCost = 100.00;
      else if (shipping_method === 'standard') shippingCost = 50.00;

      const baseAmount = itemsSubtotal + shippingCost;
      let paymentFee = 0;

      // Fee simple para simulación (ajustar según lógica real de negocio)
      if (payment_method === 'card' || payment_method === 'paypal') {
        paymentFee = baseAmount * 0.04;
      } else if (payment_method === 'mx_transfer') {
        paymentFee = baseAmount * 0.16; // Ejemplo de IVA si aplica
      }

      const total = baseAmount + paymentFee;

      // 3. Crear Orden (Estado inicial: pending_review)
      const newOrder = await Order.create({
        customer_id,
        status: 'pending_review',
        subtotal: itemsSubtotal,
        shipping_cost: shippingCost,
        payment_fee: paymentFee,
        tax: 0,
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

      // 4. Insertar Ítems
      const orderItemsData = items.map(item => ({
        order_id: newOrder.id,
        product_lot_id: item.product_lot_id,
        product_supplier_id: item.product_supplier_id, // Importante para el botón de proveedores
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.unit_price * item.quantity,
        expiry_category_name: item.lot_status 
      }));

      await OrderItem.create(orderItemsData);

      // 5. Reservar Inventario (Si aplica lógica de reserva inmediata)
      for (const item of items) {
        if (item.product_lot_id && Inventory.reserveLotQuantity) {
           await Inventory.reserveLotQuantity(item.product_lot_id, item.quantity);
        }
      }

      // 6. Limpiar Carrito
      await Cart.clearCart(customer_id);

      // 7. Notificar
      NotificationService.notifyOrderCreated(newOrder.id).catch(err => console.error('Error email create:', err));

      res.status(201).json({
        success: true,
        message: 'Solicitud recibida. Pendiente de revisión.',
        order_id: newOrder.id,
        total: total
      });

    } catch (error) {
      console.error('Error al crear orden:', error);
      res.status(500).json({ error: 'Error interno', details: error.message });
    }
  },

  // --- OBTENER TODAS (Admin) ---
  getAll: async (req, res) => {
    try {
      const orders = await Order.findAll();
      res.json(orders);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener órdenes' });
    }
  },

  // --- OBTENER MIS ÓRDENES (Cliente) ---
  getMyOrders: async (req, res) => {
    try {
      const customer_id = req.user.id;
      const orders = await Order.findByCustomer(customer_id);
      res.json(orders);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener mis órdenes' });
    }
  },

  // --- OBTENER ORDEN POR ID (Detalle Completo) ---
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      
      // 1. Obtener datos base de la orden
      // NOTA: Order.findById debe hacer JOIN con users y addresses para traer nombres reales
      const order = await Order.findById(id);
      
      if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

      // Seguridad: Solo el dueño o el admin pueden verla
      if (order.customer_id !== req.user.id && req.user.verification_level !== 'admin') {
        return res.status(403).json({ error: 'No autorizado' });
      }

      // 2. Obtener items con detalles de proveedor
      const items = await OrderItem.findByOrder(id);
      
      // 3. Obtener pagos
      // const payments = await Payment.findByOrder(id); 

      // ✅ 4. LÓGICA DE PROVEEDORES (Para el botón mágico)
      // Extraemos proveedores únicos de los items para facilitar la UI
      const suppliersMap = new Map();
      items.forEach(item => {
        if (item.supplier_name) { // Asumiendo que OrderItem.findByOrder hace join con suppliers
          suppliersMap.set(item.supplier_id, {
            id: item.supplier_id,
            name: item.supplier_name,
            contact_info: item.supplier_contact || 'Sin contacto', // Email o Teléfono
            country: item.supplier_country || 'Intl'
          });
        }
      });
      const uniqueSuppliers = Array.from(suppliersMap.values());

      res.json({ 
        order, 
        items, 
        suppliers: uniqueSuppliers, // Enviamos lista limpia de proveedores
        // payments 
      });

    } catch (error) {
      console.error('Error al obtener detalle:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  },

  // --- ACTUALIZAR ESTADO (Admin) ---
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, tracking_number } = req.body;

      if (req.user.verification_level !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado' });
      }

      // 1. Actualizar Estado Base
      const updatedOrder = await Order.updateStatus(id, status, req.user.id);
      
      // 2. Si es envío, guardar Tracking Number
      if (status === 'shipped' && tracking_number) {
         // Asegúrate que tu modelo tenga este método, si no, lo crearemos en el sig paso
         if (Order.updateTracking) {
            await Order.updateTracking(id, tracking_number);
         }
      }

      // 3. Notificaciones automáticas
      try {
        if (status === 'payment_pending') {
          // Admin aprobó stock -> Cliente recibe "Pagar ahora"
          await NotificationService.notifyOrderApproved(id);
        } else if (status === 'rejected') {
          // Admin rechazó -> Cliente recibe aviso
          await NotificationService.notifyOrderRejected(id);
        } else if (status === 'shipped') {
          // Admin envió -> Cliente recibe tracking
          await NotificationService.notifyOrderShipped(id, tracking_number);
        }
      } catch (notifyError) {
        console.error('Error enviando notificación de estado:', notifyError);
      }

      res.json({ message: 'Estado actualizado', order: updatedOrder });

    } catch (error) {
      console.error('Error actualizando estado:', error);
      res.status(500).json({ error: 'Error actualizando estado' });
    }
  },

  // --- SUBIR EVIDENCIA (Cliente) ---
  // ✅ MODIFICADO: Ahora crea un registro en DOCUMENTS vinculado a la orden
  uploadEvidence: async (req, res) => {
    try {
      const { id } = req.params; // ID de la Orden
      const file = req.file; 

      if (!file) return res.status(400).json({ error: 'Falta el archivo' });

      // Ruta relativa para guardar en BD
      const filePath = `/uploads/evidence/${file.filename}`;

      // 1. ✅ CREAR DOCUMENTO DE EVIDENCIA
      // Esto permite que aparezca en el Dashboard de Documentos con su tipo correcto
      await Document.create({
        owner_type: 'user',
        owner_id: req.user.id,
        document_type: 'payment_evidence', // Nuevo tipo habilitado en BD
        file_path: filePath,
        status: 'under_review', // Pendiente de revisión
        notes: `Comprobante de pago para Orden #${id}`,
        reference_id: id // ✅ Vinculamos con la Orden
      });

      // 2. ACTUALIZAR ESTADO DE LA ORDEN
      // Seguimos usando esto para cambiar el estado de la orden a 'payment_review'
      // y mantener compatibilidad con la vista actual de "Mis Pedidos"
      await Order.updateEvidence(id, filePath);

      // 3. NOTIFICAR AL ADMIN
      NotificationService.notifyPaymentUploaded(id).catch(console.error);

      res.json({ success: true, message: 'Evidencia recibida y vinculada correctamente' });

    } catch (error) {
      console.error('Error subiendo evidencia:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  }
};

module.exports = orderController;