const Usuario = require('../models/usuario.model');

const normalizarRol = (rol) => (rol === 'USER' ? 'OPERADOR' : rol);
const presentarUsuario = (usuario) => ({
  _id: usuario._id,
  nombre: usuario.nombre,
  email: usuario.email,
  rol: normalizarRol(usuario.rol),
  createdAt: usuario.createdAt
});

exports.listarUsuarios = async (req, res, next) => {
  try {
    const usuarios = await Usuario.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ ok: true, datos: usuarios.map(presentarUsuario) });
  } catch (error) {
    next(error);
  }
};

exports.crearUsuario = async (req, res, next) => {
  try {
    const { nombre, email, password, rol } = req.body;
    if (typeof nombre !== 'string' || !nombre.trim()
      || typeof email !== 'string' || !email.trim()
      || typeof password !== 'string' || !password) {
      return res.status(400).json({ ok: false, mensaje: 'Nombre, email y contraseña son obligatorios' });
    }
    if (password.length < 6) {
      return res.status(400).json({ ok: false, mensaje: 'La contraseña debe tener al menos 6 caracteres' });
    }
    if (!['ADMIN', 'OPERADOR', 'VISITANTE'].includes(rol)) {
      return res.status(400).json({ ok: false, mensaje: 'El rol debe ser ADMIN, OPERADOR o VISITANTE' });
    }
    const usuario = await Usuario.create({ nombre: nombre.trim(), email: email.trim().toLowerCase(), password, rol });
    res.status(201).json({ ok: true, datos: presentarUsuario(usuario) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ ok: false, mensaje: 'El email ya está registrado' });
    }
    next(error);
  }
};

exports.actualizarUsuario = async (req, res, next) => {
  try {
    const { nombre, email, rol } = req.body;
    const cambios = {};
    if (nombre !== undefined) {
      if (typeof nombre !== 'string' || !nombre.trim()) {
        return res.status(400).json({ ok: false, mensaje: 'El nombre no puede estar vacío' });
      }
      cambios.nombre = nombre.trim();
    }
    if (email !== undefined) {
      if (typeof email !== 'string' || !email.trim()) {
        return res.status(400).json({ ok: false, mensaje: 'El email no puede estar vacío' });
      }
      cambios.email = email.trim().toLowerCase();
    }
    if (rol !== undefined) {
      if (!['ADMIN', 'OPERADOR', 'VISITANTE'].includes(rol)) {
        return res.status(400).json({ ok: false, mensaje: 'Rol inválido' });
      }
      if (req.params.id === String(req.usuario._id) && rol !== 'ADMIN') {
        return res.status(400).json({ ok: false, mensaje: 'No podés quitarte tus propios permisos de administrador' });
      }
      if (rol !== 'ADMIN') {
        const objetivo = await Usuario.findById(req.params.id);
        if (objetivo?.rol === 'ADMIN' && await Usuario.countDocuments({ rol: 'ADMIN' }) <= 1) {
          return res.status(400).json({ ok: false, mensaje: 'No se puede quitar el último administrador' });
        }
      }
      cambios.rol = rol;
    }

    const usuario = await Usuario.findByIdAndUpdate(req.params.id, cambios, {
      new: true,
      runValidators: true
    }).select('-password');
    if (!usuario) return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });
    res.status(200).json({ ok: true, datos: presentarUsuario(usuario) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ ok: false, mensaje: 'El email ya está registrado' });
    }
    next(error);
  }
};

exports.eliminarUsuario = async (req, res, next) => {
  try {
    if (req.params.id === String(req.usuario._id)) {
      return res.status(400).json({ ok: false, mensaje: 'No podés eliminar tu propia cuenta' });
    }
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });
    if (usuario.rol === 'ADMIN' && await Usuario.countDocuments({ rol: 'ADMIN' }) <= 1) {
      return res.status(400).json({ ok: false, mensaje: 'No se puede eliminar el último administrador' });
    }
    await Usuario.findByIdAndDelete(req.params.id);
    res.status(200).json({ ok: true, mensaje: 'Usuario eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};
