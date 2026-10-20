const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protegerRuta } = require('../middlewares/auth.middleware');

router.post('/registro', authController.registrar);
router.post('/login', authController.login);
router.patch('/cambiar-password', protegerRuta, authController.cambiarPassword);

module.exports = router;