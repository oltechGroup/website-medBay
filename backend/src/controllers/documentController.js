const Document = require('../models/documentModel');

const documentController = {
  // Crear nuevo documento
  create: async (req, res) => {
    try {
      const documentData = req.body;

      // Validaciones básicas
      if (!documentData.owner_type || !documentData.owner_id || !documentData.document_type || !documentData.file_path) {
        return res.status(400).json({ error: 'owner_type, owner_id, document_type y file_path son requeridos' });
      }

      // Verificar que el owner_type sea válido
      if (!['user', 'supplier'].includes(documentData.owner_type)) {
        return res.status(400).json({ error: 'owner_type debe ser "user" o "supplier"' });
      }

      // Si el documento es para un usuario, verificar que el usuario existe y es el mismo que sube el documento o admin
      if (documentData.owner_type === 'user') {
        if (documentData.owner_id !== req.user.id && req.user.verification_level !== 'admin') {
          return res.status(403).json({ error: 'No puedes subir documentos para otro usuario' });
        }
      }

      const newDocument = await Document.create({
        ...documentData,
        status: 'uploaded'
      });

      res.status(201).json({
        message: 'Documento subido exitosamente',
        document: newDocument
      });

    } catch (error) {
      console.error('Error al crear documento:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener todos los documentos (solo admin)
  getAll: async (req, res) => {
    try {
      const documents = await Document.findAll();
      res.json(documents);
    } catch (error) {
      console.error('Error al obtener documentos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener documentos del usuario actual
  getMyDocuments: async (req, res) => {
    try {
      const documents = await Document.findByOwner('user', req.user.id);
      res.json(documents);
    } catch (error) {
      console.error('Error al obtener documentos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener documento por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const document = await Document.findById(id);
      
      if (!document) {
        return res.status(404).json({ error: 'Documento no encontrado' });
      }

      // Verificar permisos: admin o el dueño del documento
      if (document.owner_type === 'user' && document.owner_id !== req.user.id && req.user.verification_level !== 'admin') {
        return res.status(403).json({ error: 'No tienes permisos para ver este documento' });
      }

      res.json(document);
    } catch (error) {
      console.error('Error al obtener documento:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Actualizar estado de documento (solo admin)
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const updatedDocument = await Document.updateStatus(id, status, req.user.id, notes);
      
      if (!updatedDocument) {
        return res.status(404).json({ error: 'Documento no encontrado' });
      }

      res.json({
        message: 'Estado de documento actualizado exitosamente',
        document: updatedDocument
      });

    } catch (error) {
      console.error('Error al actualizar estado de documento:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Eliminar documento
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const document = await Document.findById(id);
      
      if (!document) {
        return res.status(404).json({ error: 'Documento no encontrado' });
      }

      // Verificar permisos: admin o el dueño del documento
      if (document.owner_type === 'user' && document.owner_id !== req.user.id && req.user.verification_level !== 'admin') {
        return res.status(403).json({ error: 'No tienes permisos para eliminar este documento' });
      }

      const deletedDocument = await Document.delete(id);
      res.json({
        message: 'Documento eliminado exitosamente',
        document: deletedDocument
      });

    } catch (error) {
      console.error('Error al eliminar documento:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = documentController;