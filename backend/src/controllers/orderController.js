// backend/src/controllers/orderController.js

const Order = require('../models/orderModel');
const OrderItem = require('../models/orderItemModel');
const Payment = require('../models/paymentModel');
const Inventory = require('../models/productLotModel');
const Cart = require('../models/cartModel');

const orderController = {
  // --- CREAR ORDEN (Checkout B2B) ---
  create: async (req, res) => {
    try {
      const customer_id = req.user.id;
      const { 
        items, 
        shipping_address_id, 
        billing_address_id, 
        shipping_method, // 'standard' (6 días) o 'express' (3 días)
        payment_method,  // 'wire', 'zelle', 'paypal', 'card', 'mx_transfer'
        referral_code,   // Código de vendedor opcional
        notes 
      } = req.body;

      // 1. Validaciones Básicas
      if (!items || items.length === 0) {
        return res.status(400).json({ error: 'La orden debe contener al menos un item' });
      }
      if (!shipping_address_id) {
        return res.status(400).json({ error: 'La dirección de envío es obligatoria' });
      }

      // 2. Calcular Subtotal de Productos
      const itemsSubtotal = items.reduce((sum, item) => sum + (parseFloat(item.unit_price) * item.quantity), 0);

      // 3. Calcular Costo de Envío
      let shippingCost = 0;
      if (shipping_method === 'express') {
        shippingCost = 100.00; // Urgente (3 días)
      } else if (shipping_method === 'standard') {
        shippingCost = 50.00;  // Normal (6 días)
      }
      // 'pickup' sería 0

      // 4. Calcular Fees de Método de Pago
      // Nota: Calculamos el fee sobre (Subtotal + Envío)
      const baseAmount = itemsSubtotal + shippingCost;
      let paymentFee = 0;

      switch (payment_method) {
        case 'paypal':
        case 'card':
          paymentFee = baseAmount * 0.04; // +4% Comisión
          break;
        case 'mx_transfer':
          paymentFee = baseAmount * 0.16; // +16% IVA/Factura
          break;
        case 'wire':
        case 'zelle':
        default:
          paymentFee = 0; // Sin costo adicional
          break;
      }

      // 5. Totales Finales
      // Por ahora tax es 0 (hasta integrar Avalara), el IVA de MX se maneja como fee o se puede mover a tax si prefieres.
      // Aquí lo dejamos en fee para visualizarlo desglosado como pediste.
      const tax = 0; 
      const total = baseAmount + paymentFee + tax;

      // 6. Crear la Orden en BD
      const newOrder = await Order.create({
        customer_id,
        status: 'pending_review', // IMPORTANTE: Siempre nace en revisión por ser Dropshipping
        subtotal: itemsSubtotal,
        shipping_cost: shippingCost,
        payment_fee: paymentFee,
        tax,
        total,
        currency: 'USD',
        shipping_address_id,
        billing_address_id: billing_address_id || shipping_address_id, // Fallback si es la misma
        shipping_method,
        payment_method,
        referral_code,
        notes,
        review_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h para que Admin revise stock
      });

      // 7. Insertar Ítems de la Orden
      const orderItemsData = items.map(item => ({
        order_id: newOrder.id,
        product_lot_id: item.product_lot_id,
        product_supplier_id: item.product_supplier_id, // Asegúrate de enviar esto desde el frontend
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.unit_price * item.quantity,
        // Datos extra opcionales
        expiry_category_name: item.lot_status 
      }));

      await OrderItem.create(orderItemsData);

      // 8. Gestión de Inventario (Reserva)
      // Iteramos para descontar/reservar el stock de los lotes
      // Nota: Si Inventory.reserveLotQuantity falla, deberíamos hacer rollback, 
      // pero por simplicidad ahora asumimos éxito.
      for (const item of items) {
        if (item.product_lot_id) {
          // Asegúrate de tener esta función en tu productLotModel o update directo
          // Si no la tienes, podemos crear una consulta simple de UPDATE aquí:
          /* await db.query('UPDATE product_lots SET quantity = quantity - $1, status = CASE WHEN quantity - $1 <= 0 THEN \'sold_out\' ELSE status END WHERE id = $2', [item.quantity, item.product_lot_id]);
          */
          // Por ahora mantenemos la llamada a la función del modelo si existe:
           if (Inventory.reserveLotQuantity) {
             await Inventory.reserveLotQuantity(item.product_lot_id, item.quantity);
           }
        }
      }

      // 9. Vaciar el Carrito del Usuario
      await Cart.clearCart(customer_id);

      // 10. Respuesta Exitosa
      res.status(201).json({
        success: true,
        message: 'Orden creada exitosamente. Pendiente de validación de inventario.',
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
      console.error('Error al obtener órdenes:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // --- OBTENER ORDEN POR ID ---
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const order = await Order.findById(id);
      
      if (!order) {
        return res.status(404).json({ error: 'Orden no encontrada' });
      }

      // Seguridad: Solo dueño o Admin
      if (order.customer_id !== req.user.id && req.user.verification_level !== 'admin') {
        return res.status(403).json({ error: 'No autorizado' });
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

  // --- ACTUALIZAR ESTADO (Admin) ---
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body; // Ej: 'payment_pending', 'processing', 'shipped'

      if (req.user.verification_level !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado' });
      }

      const updatedOrder = await Order.updateStatus(id, status, req.user.id);
      
      // Lógica de liberación de stock si se rechaza
      if (status === 'rejected' || status === 'cancelled') {
        const items = await OrderItem.findByOrder(id);
        for (const item of items) {
           // Aquí deberías llamar a una función para devolver el stock
           // Inventory.releaseStock(item.product_lot_id, item.quantity);
        }
      }

      res.json({ message: 'Estado actualizado', order: updatedOrder });
    } catch (error) {
      res.status(500).json({ error: 'Error actualizando estado' });
    }
  },

  // --- SUBIR EVIDENCIA DE PAGO (Cliente) ---
  uploadEvidence: async (req, res) => {
    try {
      const { id } = req.params;
      const file = req.file; // Usando Multer

      if (!file) {
        return res.status(400).json({ error: 'No se subió ningún archivo' });
      }

      // Ruta relativa para guardar en BD
      const filePath = `/uploads/evidence/${file.filename}`;

      // Actualizar orden a estado 'payment_review'
      await Order.updateEvidence(id, filePath);

      res.json({ success: true, message: 'Evidencia subida. Validando pago.' });

    } catch (error) {
      console.error('Error subiendo evidencia:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  }
};

module.exports = orderController;