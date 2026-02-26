// backend/src/controllers/trafficController.js

const db = require('../config/database');

const trafficController = {
  // 1. EL RECEPTOR SILENCIOSO (Recibe el Ping del Frontend)
  ping: async (req, res) => {
    // Respondemos Inmediatamente para no bloquear al cliente (Fire and Forget)
    res.status(200).json({ success: true });

    try {
      const { session_id, country, country_code, product_id } = req.body;

      if (!session_id) return; // Si no hay sesión, ignoramos

      // A) UPSERT de la sesión: 
      // Si la sesión no existe, la crea. Si ya existe, solo actualiza su "last_active".
      await db.query(
        `INSERT INTO traffic_sessions (session_id, country, country_code, last_active) 
         VALUES ($1, $2, $3, NOW()) 
         ON CONFLICT (session_id) DO UPDATE 
         SET last_active = NOW()`,
        [session_id, country || 'Unknown', country_code || 'XX']
      );

      // B) Registro de vista de producto (Si el usuario está viendo un producto específico)
      if (product_id) {
        // Usamos un try-catch interno por si el product_id es inválido o fue borrado
        try {
          await db.query(
            `INSERT INTO traffic_product_views (session_id, product_id, viewed_at) 
             VALUES ($1, $2, NOW())`,
            [session_id, product_id]
          );
        } catch (dbError) {
          // Ignoramos silenciosamente si el UUID es inválido o no coincide
        }
      }

    } catch (error) {
      console.error("⚠️ Error silencioso en traffic ping:", error.message);
    }
  },

  // =========================================================
  // 📊 FUNCIONES DE ANÁLISIS (Para tu futuro Panel Elite)
  // =========================================================

  getStats: async (req, res) => {
    try {
      // 1. Visitantes "En Vivo" (Activos en los últimos 5 minutos)
      const liveRes = await db.query(
        `SELECT COUNT(*) as live_users FROM traffic_sessions 
         WHERE last_active >= NOW() - INTERVAL '5 minutes'`
      );

      // 2. Visitantes de las últimas 24 horas
      const dailyRes = await db.query(
        `SELECT COUNT(*) as daily_users FROM traffic_sessions 
         WHERE last_active >= NOW() - INTERVAL '24 hours'`
      );

      // 3. Top Países (Últimos 30 días)
      const topCountriesRes = await db.query(
        `SELECT country, country_code, COUNT(*) as visitors 
         FROM traffic_sessions 
         WHERE last_active >= NOW() - INTERVAL '30 days'
         GROUP BY country, country_code 
         ORDER BY visitors DESC LIMIT 5`
      );

      // 4. Top 5 Productos Más Vistos (Últimos 7 días)
      const topProductsRes = await db.query(
        `SELECT p.id, p.description, p.global_sku, COUNT(v.id) as views 
         FROM traffic_product_views v
         JOIN products p ON v.product_id = p.id
         WHERE v.viewed_at >= NOW() - INTERVAL '7 days'
         GROUP BY p.id, p.description, p.global_sku
         ORDER BY views DESC LIMIT 5`
      );

      res.json({
        success: true,
        data: {
          live_users: parseInt(liveRes.rows[0].live_users),
          daily_users: parseInt(dailyRes.rows[0].daily_users),
          top_countries: topCountriesRes.rows,
          top_products: topProductsRes.rows
        }
      });

    } catch (error) {
      console.error("Error obteniendo estadísticas de tráfico:", error);
      res.status(500).json({ error: "Error interno obteniendo tráfico" });
    }
  }
};

module.exports = trafficController;