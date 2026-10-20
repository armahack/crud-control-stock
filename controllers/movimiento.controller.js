const Movimiento = require('../models/movimiento.model');
const Producto = require('../models/producto.model');

// Registrar un movimiento (ENTRADA o SALIDA) y actualizar el stock del producto
exports.registrarMovimiento = async (req, res, next) => {
  try {
    const { productoId, tipo, cantidad, motivo } = req.body;

    const cantidadNumerica = Number(cantidad);
    if (!productoId || !['ENTRADA', 'SALIDA'].includes(tipo)
      || !Number.isInteger(cantidadNumerica) || cantidadNumerica < 1) {
      return res.status(400).json({
        ok: false,
        mensaje: 'productoId, un tipo válido y una cantidad entera mayor a cero son obligatorios'
      });
    }

    // Validar existencia del producto
    const producto = await Producto.findById(productoId);
    if (!producto) {
      return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });
    }

    // Si es SALIDA, verificar que haya stock suficiente
    if (tipo === 'SALIDA' && producto.stock < cantidadNumerica) {
      return res.status(400).json({
        ok: false,
        mensaje: `Stock insuficiente. Stock actual: ${producto.stock}, intentas vender: ${cantidadNumerica}`
      });
    }

    // Actualizar el stock en el producto
    if (tipo === 'ENTRADA') {
      producto.stock += cantidadNumerica;
    } else if (tipo === 'SALIDA') {
      producto.stock -= cantidadNumerica;
    }

    await producto.save();

    // Crear el registro del movimiento
    const nuevoMovimiento = await Movimiento.create({
      producto: productoId,
      usuario: req.usuario._id,
      tipo,
      cantidad,
      motivo
    });

    res.status(201).json({
      ok: true,
      mensaje: `Movimiento de ${tipo} registrado correctamente`,
      datos: nuevoMovimiento,
      stockNuevo: producto.stock
    });
  } catch (error) {
    next(error);
  }
};

// Obtener el historial completo de movimientos
exports.obtenerMovimientos = async (req, res, next) => {
  try {
    const movimientos = await Movimiento.find()
      .populate('producto', 'nombre codigoBarras precio stock')
      .populate('usuario', 'nombre email')
      .sort({ createdAt: -1 });

    res.status(200).json({ ok: true, datos: movimientos });
  } catch (error) {
    next(error);
  }
};