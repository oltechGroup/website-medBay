// backend/src/services/currencyService.js
const axios = require('axios');
const Country = require('../models/countryModel');

// CONFIGURACIÓN
// Usamos esta API pública que devuelve tasas actualizadas diariamente con base en USD
const API_URL = 'https://open.er-api.com/v6/latest/USD'; 

// Margen de seguridad (%) para protegernos de la volatilidad.
// Ejemplo: Si es 2%, y el dólar está a 20, el sistema guardará 20.4
const SAFETY_MARGIN_PERCENTAGE = 2.0; 

const currencyService = {
  /**
   * Función principal que orquesta la actualización de tasas
   */
  updateExchangeRates: async () => {
    console.log('🔄 Iniciando actualización de tasas de cambio...');
    
    try {
      // 1. Preguntar a la DB qué monedas estamos usando
      // Esto evita procesar monedas de países que no tenemos registrados
      const activeCurrencies = await Country.getDistinctCurrencies();
      
      if (activeCurrencies.length === 0) {
        return { 
          success: true, 
          message: 'No hay monedas activas para actualizar.',
          stats: { updated: 0, total: 0 }
        };
      }

      console.log(`📡 Consultando API externa para ${activeCurrencies.length} monedas...`);

      // 2. Obtener tasas reales del mercado (Base USD)
      const response = await axios.get(API_URL);
      const apiRates = response.data.rates;

      if (!apiRates) {
        throw new Error('La API externa no devolvió datos válidos (rates missing).');
      }

      // 3. Procesar y actualizar cada moneda
      const stats = {
        updated: 0,
        failed: 0,
        details: []
      };

      for (const currencyCode of activeCurrencies) {
        // Verificar si la API tiene datos para esta moneda (ej: MXN)
        if (apiRates[currencyCode]) {
          const marketRate = apiRates[currencyCode];
          
          // 🛡️ CÁLCULO DEL PRECIO SEGURO
          // Fórmula: TasaReal * (1 + (Porcentaje / 100))
          const safeRate = marketRate * (1 + (SAFETY_MARGIN_PERCENTAGE / 100));
          
          // Guardar en Base de Datos (Redondeamos a 6 decimales para precisión)
          await Country.updateRateByCurrency(currencyCode, safeRate.toFixed(6));

          stats.updated++;
          stats.details.push({
            currency: currencyCode,
            marketRate: marketRate,
            safeRate: safeRate,
            status: 'updated'
          });
        } else {
          console.warn(`⚠️ La moneda ${currencyCode} no fue encontrada en la API.`);
          stats.failed++;
          stats.details.push({ currency: currencyCode, status: 'not_found_in_api' });
        }
      }

      console.log(`✅ Actualización completada. Actualizados: ${stats.updated}, Fallidos: ${stats.failed}`);
      
      return { 
        success: true, 
        message: 'Actualización de tasas completada exitosamente',
        stats 
      };

    } catch (error) {
      console.error('❌ Error Crítico en currencyService:', error.message);
      return { 
        success: false, 
        message: 'Error al conectar con el servicio de divisas',
        error: error.message 
      };
    }
  }
};

module.exports = currencyService;