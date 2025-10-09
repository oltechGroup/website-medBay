const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware.verifyToken);

// Rutas de inventario
router.post('/lots', inventoryController.createLot);
router.get('/lots', inventoryController.getAllLots);
router.get('/lots/product/:productId', inventoryController.getLotsByProduct);
router.get('/lots/near-expiry', inventoryController.getNearExpiryLots);
router.put('/lots/:lotId/quantity', inventoryController.updateLotQuantity);
router.put('/lots/:lotId/reserve', inventoryController.reserveLotQuantity);
router.put('/lots/:lotId/release', inventoryController.releaseLotQuantity);

module.exports = router;