const db = require('../config/database');

const Compliance = {
  // Crear tarea de cumplimiento
  createTask: async (taskData) => {
    const {
      type,
      payload,
      priority,
      assigned_to,
      status
    } = taskData;
    
    const query = `
      INSERT INTO compliance_tasks (type, payload, priority, assigned_to, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [type, payload, priority, assigned_to, status];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Obtener todas las tareas
  findAllTasks: async () => {
    const query = `
      SELECT 
        ct.*,
        u.email as assigned_email,
        u.full_name as assigned_name
      FROM compliance_tasks ct
      LEFT JOIN users u ON ct.assigned_to = u.id
      ORDER BY 
        CASE priority 
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        ct.created_at DESC
    `;
    
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Obtener tareas por usuario asignado
  findTasksByUser: async (userId) => {
    const query = `
      SELECT *
      FROM compliance_tasks
      WHERE assigned_to = $1
      ORDER BY 
        CASE priority 
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        created_at DESC
    `;
    
    try {
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Actualizar estado de tarea
  updateTaskStatus: async (id, status, completed_at = null) => {
    const query = `
      UPDATE compliance_tasks 
      SET status = $1, completed_at = $2
      WHERE id = $3
      RETURNING *
    `;
    
    try {
      const result = await db.query(query, [status, completed_at, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Crear revisión de orden
  createOrderReview: async (reviewData) => {
    const {
      order_id,
      reviewer_id,
      action,
      comments
    } = reviewData;
    
    const query = `
      INSERT INTO order_reviews (order_id, reviewer_id, action, comments)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [order_id, reviewer_id, action, comments];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Obtener revisiones por orden
  findReviewsByOrder: async (orderId) => {
    const query = `
      SELECT 
        or.*,
        u.email as reviewer_email,
        u.full_name as reviewer_name
      FROM order_reviews or
      LEFT JOIN users u ON or.reviewer_id = u.id
      WHERE or.order_id = $1
      ORDER BY or.created_at DESC
    `;
    
    try {
      const result = await db.query(query, [orderId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = Compliance;