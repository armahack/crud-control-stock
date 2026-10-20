const express = require('express');
const router = express.Router();
const productoController = require('../controllers/producto.controller');
const { protegerRuta, autorizarRoles } = require('../middlewares/auth.middleware');

router.get('/', productoController.obtenerProductos);
router.get('/stock-bajo', protegerRuta, productoController.obtenerStockBajo);
router.get('/:id', productoController.obtenerProductoPorId);

router.post('/', protegerRuta, autorizarRoles('ADMIN', 'OPERADOR'), productoController.crearProducto);
router.put('/:id', protegerRuta, autorizarRoles('ADMIN', 'OPERADOR'), productoController.actualizarProducto);
router.delete('/:id', protegerRuta, autorizarRoles('ADMIN'), productoController.eliminarProducto);

module.exports = router;
