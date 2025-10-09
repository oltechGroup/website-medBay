const Compliance = require('../models/complianceModel');
const Order = require('../models/orderModel');

const complianceController = {
  // Crear tarea de cumplimiento
  createTask: async (req, res) => {
    try {
      const taskData = {
        ...req.body,
        status: 'pending'
      };

      const newTask = await Compliance.createTask(taskData);
      res.status(201).json({
        message: 'Tarea de cumplimiento creada exitosamente',
        task: newTask
      });

    } catch (error) {
      console.error('Error al crear tarea de cumplimiento:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener todas las tareas (solo admin/compliance)
  getAllTasks: async (req, res) => {
    try {
      const tasks = await Compliance.findAllTasks();
      res.json(tasks);
    } catch (error) {
      console.error('Error al obtener tareas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener mis tareas asignadas
  getMyTasks: async (req, res) => {
    try {
      const tasks = await Compliance.findTasksByUser(req.user.id);
      res.json(tasks);
    } catch (error) {
      console.error('Error al obtener mis tareas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Actualizar estado de tarea
  updateTaskStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const completed_at = status === 'completed' ? new Date() : null;
      const updatedTask = await Compliance.updateTaskStatus(id, status, completed_at);
      
      if (!updatedTask) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }

      res.json({
        message: 'Estado de tarea actualizado exitosamente',
        task: updatedTask
      });

    } catch (error) {
      console.error('Error al actualizar estado de tarea:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Crear revisión de orden
  createOrderReview: async (req, res) => {
    try {
      const { orderId } = req.params;
      const { action, comments } = req.body;

      // Verificar que la orden existe
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Orden no encontrada' });
      }

      const reviewData = {
        order_id: orderId,
        reviewer_id: req.user.id,
        action,
        comments
      };

      const newReview = await Compliance.createOrderReview(reviewData);
      
      // Si la acción es aprobar o rechazar, actualizar el estado de la orden
      if (action === 'approved' || action === 'rejected') {
        await Order.updateStatus(orderId, action, req.user.id);
      }

      res.status(201).json({
        message: 'Revisión de orden creada exitosamente',
        review: newReview
      });

    } catch (error) {
      console.error('Error al crear revisión de orden:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener revisiones por orden
  getOrderReviews: async (req, res) => {
    try {
      const { orderId } = req.params;
      const reviews = await Compliance.findReviewsByOrder(orderId);
      res.json(reviews);
    } catch (error) {
      console.error('Error al obtener revisiones:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = complianceController;