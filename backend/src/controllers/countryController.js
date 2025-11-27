const Country = require('../models/countryModel');

const countryController = {
  // Obtener todos los países con paginación y búsqueda
  getAll: async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '',
        currency = '' 
      } = req.query;

      // Validar parámetros de paginación
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Máximo 100 por página

      let countries, total;
      
      if (currency) {
        // Filtrar por moneda específica
        countries = await Country.findByCurrency(currency);
        total = countries.length;
      } else {
        // Búsqueda general con paginación
        countries = await Country.findAll(pageNum, limitNum, search);
        total = await Country.count(search);
      }

      const totalPages = Math.ceil(total / limitNum);

      res.json({
        success: true,
        data: countries,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      });
    } catch (error) {
      console.error('Error fetching countries:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener los países',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Obtener estadísticas de países
  getStats: async (req, res) => {
    try {
      const stats = await Country.getStats();
      
      res.json({
        success: true,
        data: {
          totalCountries: parseInt(stats.total_countries),
          totalCurrencies: parseInt(stats.total_currencies),
          averageExchangeRate: parseFloat(stats.avg_exchange_rate),
          minExchangeRate: parseFloat(stats.min_exchange_rate),
          maxExchangeRate: parseFloat(stats.max_exchange_rate)
        }
      });
    } catch (error) {
      console.error('Error fetching country stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las estadísticas',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Obtener país por código
  getByCode: async (req, res) => {
    try {
      const { code } = req.params;
      
      // Validar formato del código (2 letras mayúsculas)
      if (!/^[A-Z]{2}$/.test(code)) {
        return res.status(400).json({
          success: false,
          message: 'El código del país debe ser exactamente 2 letras mayúsculas (ej: US, MX)'
        });
      }

      const country = await Country.findByCode(code.toUpperCase());

      if (!country) {
        return res.status(404).json({
          success: false,
          message: 'País no encontrado'
        });
      }

      res.json({
        success: true,
        data: country
      });
    } catch (error) {
      console.error('Error fetching country:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener el país',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Crear nuevo país
  create: async (req, res) => {
    try {
      const countryData = req.body;

      // Validaciones completas
      const validationErrors = [];

      // Validar código (2 letras mayúsculas)
      if (!countryData.code || !/^[A-Z]{2}$/.test(countryData.code)) {
        validationErrors.push('El código del país debe ser exactamente 2 letras mayúsculas (ej: US, MX)');
      }

      // Validar nombre
      if (!countryData.name || countryData.name.trim().length < 2) {
        validationErrors.push('El nombre del país es requerido y debe tener al menos 2 caracteres');
      }

      // Validar código de moneda (3 letras mayúsculas)
      if (!countryData.currency_code || !/^[A-Z]{3}$/.test(countryData.currency_code)) {
        validationErrors.push('El código de moneda debe ser exactamente 3 letras mayúsculas (ej: USD, EUR)');
      }

      // Validar tasa de cambio
      if (countryData.exchange_rate && (isNaN(countryData.exchange_rate) || countryData.exchange_rate <= 0)) {
        validationErrors.push('La tasa de cambio debe ser un número positivo');
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: validationErrors
        });
      }

      // Normalizar datos
      const normalizedData = {
        ...countryData,
        code: countryData.code.toUpperCase(),
        currency_code: countryData.currency_code.toUpperCase(),
        name: countryData.name.trim(),
        currency_name: countryData.currency_name?.trim() || '',
        currency_symbol: countryData.currency_symbol || '',
        currency_decimals: parseInt(countryData.currency_decimals) || 2,
        exchange_rate: parseFloat(countryData.exchange_rate) || 1.0
      };

      const newCountry = await Country.create(normalizedData);
      
      res.status(201).json({
        success: true,
        message: 'País creado exitosamente',
        data: newCountry
      });
    } catch (error) {
      console.error('Error creating country:', error);
      
      if (error.code === '23505') { // Violación de unique constraint
        return res.status(400).json({
          success: false,
          message: 'El código del país ya existe en el sistema'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al crear el país',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Actualizar país
  update: async (req, res) => {
    try {
      const { code } = req.params;
      const countryData = req.body;

      // Validar formato del código
      if (!/^[A-Z]{2}$/.test(code)) {
        return res.status(400).json({
          success: false,
          message: 'Código de país inválido'
        });
      }

      // Validaciones de datos de entrada
      const validationErrors = [];

      if (countryData.name && countryData.name.trim().length < 2) {
        validationErrors.push('El nombre del país debe tener al menos 2 caracteres');
      }

      if (countryData.currency_code && !/^[A-Z]{3}$/.test(countryData.currency_code)) {
        validationErrors.push('El código de moneda debe ser exactamente 3 letras mayúsculas');
      }

      if (countryData.exchange_rate && (isNaN(countryData.exchange_rate) || countryData.exchange_rate <= 0)) {
        validationErrors.push('La tasa de cambio debe ser un número positivo');
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: validationErrors
        });
      }

      // Normalizar datos para actualización
      const normalizedData = { ...countryData };
      
      if (normalizedData.currency_code) {
        normalizedData.currency_code = normalizedData.currency_code.toUpperCase();
      }
      if (normalizedData.name) {
        normalizedData.name = normalizedData.name.trim();
      }
      if (normalizedData.currency_name) {
        normalizedData.currency_name = normalizedData.currency_name.trim();
      }
      if (normalizedData.exchange_rate) {
        normalizedData.exchange_rate = parseFloat(normalizedData.exchange_rate);
      }
      if (normalizedData.currency_decimals) {
        normalizedData.currency_decimals = parseInt(normalizedData.currency_decimals);
      }

      const updatedCountry = await Country.update(code.toUpperCase(), normalizedData);

      if (!updatedCountry) {
        return res.status(404).json({
          success: false,
          message: 'País no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'País actualizado exitosamente',
        data: updatedCountry
      });
    } catch (error) {
      console.error('Error updating country:', error);
      
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({
          success: false,
          message: 'El código de moneda ya está en uso por otro país'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al actualizar el país',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Eliminar país
  delete: async (req, res) => {
    try {
      const { code } = req.params;

      // Validar formato del código
      if (!/^[A-Z]{2}$/.test(code)) {
        return res.status(400).json({
          success: false,
          message: 'Código de país inválido'
        });
      }

      const deleted = await Country.delete(code.toUpperCase());

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'País no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'País eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error deleting country:', error);

      if (error.code === '23503') { // Violación de foreign key
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar el país porque está siendo utilizado por fabricantes o proveedores'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al eliminar el país',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Obtener países por moneda
  getByCurrency: async (req, res) => {
    try {
      const { currencyCode } = req.params;
      
      if (!/^[A-Z]{3}$/.test(currencyCode)) {
        return res.status(400).json({
          success: false,
          message: 'Código de moneda inválido'
        });
      }

      const countries = await Country.findByCurrency(currencyCode.toUpperCase());

      res.json({
        success: true,
        data: countries,
        count: countries.length
      });
    } catch (error) {
      console.error('Error fetching countries by currency:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener países por moneda',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = countryController;