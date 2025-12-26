//backend/src/routes/notificationRoutes.js

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.get('/', notificationController.getNotifications);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;