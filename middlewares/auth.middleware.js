const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuario.model');

const normalizarRol = (rol) => (rol === 'USER' ? 'OPERADOR' : rol);

const protegerRuta = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, mensaje: 'No autorizado, no se proporcionó un token' });
  }

  let decoded;
  try {
    decoded = jwt.verify(authorization.slice(7), process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ ok: false, mensaje: 'No autorizado, token inválido' });
  }

  try {
    const usuario = await Usuario.findById(decoded.id).select('-password');
    if (!usuario) {
      return res.status(401).json({ ok: false, mensaje: 'No autorizado, el usuario ya no existe' });
    }
    req.usuario = usuario;
    return next();
  } catch (error) {
    return next(error);
  }
};

const autorizarRoles = (...rolesPermitidos) => (req, res, next) => {
  if (!req.usuario || !rolesPermitidos.includes(normalizarRol(req.usuario.rol))) {
    return res.status(403).json({ ok: false, mensaje: 'No tenés permisos para realizar esta acción' });
  }
  return next();
};

const verificarPermiso = (permisoRequerido) => (req, res, next) => {
  if (normalizarRol(req.usuario?.rol) === 'ADMIN' || req.usuario?.permisos?.[permisoRequerido]) {
    return next();
  }
  return res.status(403).json({ ok: false, mensaje: 'No tenés permisos para realizar esta acción' });
};

module.exports = {
  protegerRuta,
  autorizarRoles,
  verificarToken: protegerRuta,
  verificarRol: autorizarRoles,
  verificarPermiso
};
