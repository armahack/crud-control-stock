const express = require('express');
const router = express.Router();
const movimientoController = require('../controllers/movimiento.controller');
const { protegerRuta, autorizarRoles } = require('../middlewares/auth.middleware');

// Rutas protegidas (requieren Token JWT)
router.post('/', protegerRuta, autorizarRoles('ADMIN', 'OPERADOR'), movimientoController.registrarMovimiento);
router.get('/', protegerRuta, movimientoController.obtenerMovimientos);

module.exports = router;