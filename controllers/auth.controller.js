const Usuario = require('../models/usuario.model');
const jwt = require('jsonwebtoken');

const rolPublico = (rol) => (rol === 'USER' ? 'OPERADOR' : rol);
const datosPublicos = (usuario) => ({
  _id: usuario._id,
  nombre: usuario.nombre,
  email: usuario.email,
  rol: rolPublico(usuario.rol)
});

// Función auxiliar para generar el JWT
const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '8h' });
};

// Registro de Usuario
exports.registrar = async (req, res, next) => {
  try {
    const { nombre, email, password } = req.body;
    if (typeof nombre !== 'string' || !nombre.trim()
      || typeof email !== 'string' || !email.trim()
      || typeof password !== 'string' || !password) {
      return res.status(400).json({ ok: false, mensaje: 'Nombre, email y contraseña son obligatorios' });
    }
    if (password.length < 6) {
      return res.status(400).json({ ok: false, mensaje: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const emailNormalizado = email.trim().toLowerCase();
    const existeUsuario = await Usuario.findOne({ email: emailNormalizado });
    if (existeUsuario) {
      return res.status(400).json({ ok: false, mensaje: 'El email ya está registrado' });
    }

    const cantidadUsuarios = await Usuario.countDocuments();
    const rol = cantidadUsuarios === 0 ? 'ADMIN' : 'VISITANTE';
    const usuario = await Usuario.create({ nombre: nombre.trim(), email: emailNormalizado, password, rol });
    const token = generarToken(usuario._id);

    res.status(201).json({
      ok: true,
      mensaje: 'Usuario registrado con éxito',
      datos: datosPublicos(usuario),
      token
    });
  } catch (error) {
    next(error);
  }
};

// Login de Usuario
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || !email.trim()
      || typeof password !== 'string' || !password) {
      return res.status(400).json({ ok: false, mensaje: 'Email y contraseña son obligatorios' });
    }

    const usuario = await Usuario.findOne({ email: email.trim().toLowerCase() });
    if (!usuario) {
      return res.status(401).json({ ok: false, mensaje: 'Credenciales inválidas' });
    }

    const esCorrecto = await usuario.compararPassword(password);
    if (!esCorrecto) {
      return res.status(401).json({ ok: false, mensaje: 'Credenciales inválidas' });
    }

    const emailAdministrador = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (emailAdministrador && usuario.email === emailAdministrador && usuario.rol !== 'ADMIN') {
      usuario.rol = 'ADMIN';
      await usuario.save();
    }

    const token = generarToken(usuario._id);

    res.status(200).json({
      ok: true,
      mensaje: 'Inicio de sesión exitoso',
      datos: datosPublicos(usuario),
      token
    });
  } catch (error) {
    next(error);
  }
};

exports.cambiarPassword = async (req, res, next) => {
  try {
    const { passwordActual, passwordNuevo } = req.body;
    if (typeof passwordActual !== 'string' || !passwordActual
      || typeof passwordNuevo !== 'string' || !passwordNuevo) {
      return res.status(400).json({ ok: false, mensaje: 'La contraseña actual y la nueva son obligatorias' });
    }
    if (passwordNuevo.length < 6) {
      return res.status(400).json({ ok: false, mensaje: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }
    const usuario = await Usuario.findById(req.usuario._id);
    if (!usuario) return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });
    if (!await usuario.compararPassword(passwordActual)) {
      return res.status(401).json({ ok: false, mensaje: 'La contraseña actual es incorrecta' });
    }

    usuario.password = passwordNuevo;
    await usuario.save();
    res.status(200).json({ ok: true, mensaje: 'Contraseña actualizada correctamente' });
  } catch (error) {
    next(error);
  }
};