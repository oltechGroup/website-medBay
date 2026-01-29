// backend/src/services/currencyService.js
const axios = require('axios');
const db = require('../config/database'); // Import directo para logs de auditoría
const Country = require('../models/countryModel');

// CONFIGURACIÓN
const API_URL = 'https://open.er-api.com/v6/latest/USD'; 
const SAFETY_MARGIN_PERCENTAGE = 2.0; 

const currencyService = {
  /**
   * Función principal que orquesta la actualización de tasas
   */
  updateExchangeRates: async () => {
    console.log('🔄 Iniciando actualización de tasas de cambio...');
    
    try {
      // 1. Obtener monedas activas
      const activeCurrencies = await Country.getDistinctCurrencies();
      
      if (activeCurrencies.length === 0) {
        return { 
          success: true, 
          message: 'No hay monedas activas para actualizar.',
          stats: { updated: 0, total: 0 }
        };
      }

      // 2. Obtener tasas reales (Base USD)
      const response = await axios.get(API_URL);
      const apiRates = response.data.rates;

      if (!apiRates) {
        throw new Error('La API externa no devolvió datos válidos.');
      }

      const stats = { updated: 0, failed: 0, details: [] };

      // 3. Procesar y actualizar con TRAZABILIDAD
      for (const currencyCode of activeCurrencies) {
        if (apiRates[currencyCode]) {
          const marketRate = apiRates[currencyCode];
          
          // 🛡️ CÁLCULO DEL PRECIO SEGURO
          const safeRate = parseFloat((marketRate * (1 + (SAFETY_MARGIN_PERCENTAGE / 100))).toFixed(6));
          
          // --- MEJORA PARA EL CORAZÓN DE MEDBAY ---
          // Antes de actualizar, verificamos si el valor cambió significativamente
          const currentRateRes = await db.query('SELECT exchange_rate FROM countries WHERE currency_code = $1 LIMIT 1', [currencyCode]);
          const oldRate = currentRateRes.rows[0]?.exchange_rate;

          // Solo actualizamos si hay una diferencia real (evita triggers innecesarios)
          if (parseFloat(oldRate) !== safeRate) {
            await Country.updateRateByCurrency(currencyCode, safeRate);

            // LOG DE AUDITORÍA (Opcional pero recomendado para el Punto 2)
            // Esto permite saber exactamente cuándo y por qué cambió un precio
            console.log(`📈 Divisa ${currencyCode} actualizada: ${oldRate} -> ${safeRate}`);
          }

          stats.updated++;
          stats.details.push({
            currency: currencyCode,
            marketRate,
            safeRate,
            status: 'updated'
          });
        } else {
          stats.failed++;
          stats.details.push({ currency: currencyCode, status: 'not_found_in_api' });
        }
      }

      return { 
        success: true, 
        message: 'Tasas sincronizadas con margen de seguridad del 2%',
        stats 
      };

    } catch (error) {
      console.error('❌ Error Crítico en currencyService:', error.message);
      return { success: false, error: error.message };
    }
  }
};

module.exports = currencyService;