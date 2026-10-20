const express = require('express');
const usuarioController = require('../controllers/usuario.controller');
const { protegerRuta, autorizarRoles } = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(protegerRuta, autorizarRoles('ADMIN'));
router.get('/', usuarioController.listarUsuarios);
router.post('/', usuarioController.crearUsuario);
router.put('/:id', usuarioController.actualizarUsuario);
router.delete('/:id', usuarioController.eliminarUsuario);

module.exports = router;
