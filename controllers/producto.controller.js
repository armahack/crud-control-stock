const Producto = require('../models/producto.model');

// Obtener todos los productos
exports.obtenerProductos = async (req, res, next) => {
  try {
    const productos = await Producto.find().sort({ createdAt: -1 });
    res.status(200).json({
      ok: true,
      datos: productos
    });
  } catch (error) {
    next(error);
  }
};

// Obtener un producto por su ID
exports.obtenerProductoPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const producto = await Producto.findById(id);

    if (!producto) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Producto no encontrado'
      });
    }

    res.status(200).json({
      ok: true,
      datos: producto
    });
  } catch (error) {
    next(error);
  }
};

// Crear un nuevo producto (con captura de error por código de barras duplicado)
exports.crearProducto = async (req, res, next) => {
  try {
    const { nombre, codigoBarras, precio, stock, stockMinimo } = req.body;
    const nuevoProducto = await Producto.create({
      nombre,
      codigoBarras: codigoBarras?.trim() || undefined,
      precio,
      stock,
      stockMinimo
    });
    res.status(201).json({
      ok: true,
      mensaje: 'Producto creado exitosamente en la base de datos',
      datos: nuevoProducto
    });
  } catch (error) {
    // Manejo de error E11000: Clave duplicada en MongoDB
    if (error.code === 11000) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El código de barras ya pertenece a otro producto'
      });
    }
    next(error);
  }
};

// Actualizar un producto existente
exports.actualizarProducto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actualizacion = {};
    for (const campo of ['nombre', 'codigoBarras', 'precio', 'stock', 'stockMinimo']) {
      if (req.body[campo] !== undefined) actualizacion[campo] = req.body[campo];
    }

    const quitarCodigoBarras = typeof actualizacion.codigoBarras === 'string'
      && actualizacion.codigoBarras.trim() === '';
    if (typeof actualizacion.codigoBarras === 'string') {
      actualizacion.codigoBarras = actualizacion.codigoBarras.trim();
    }
    if (quitarCodigoBarras) delete actualizacion.codigoBarras;

    const cambios = quitarCodigoBarras
      ? { $set: actualizacion, $unset: { codigoBarras: 1 } }
      : actualizacion;
    const productoActualizado = await Producto.findByIdAndUpdate(id, cambios, {
      new: true,
      runValidators: true
    });

    if (!productoActualizado) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Producto no encontrado para actualizar'
      });
    }

    res.status(200).json({
      ok: true,
      mensaje: 'Producto actualizado con éxito',
      datos: productoActualizado
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El código de barras ingresado ya está en uso'
      });
    }
    next(error);
  }
};

// Eliminar un producto
exports.eliminarProducto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const productoEliminado = await Producto.findByIdAndDelete(id);

    if (!productoEliminado) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Producto no encontrado para eliminar'
      });
    }

    res.status(200).json({
      ok: true,
      mensaje: 'Producto eliminado con éxito'
    });
  } catch (error) {
    next(error);
  }
};

// Obtener productos con stock crítico (Alerta de reabastecimiento)
exports.obtenerStockBajo = async (req, res, next) => {
  try {
    // Filtra los productos donde el stock sea menor o igual a stockMinimo
    const productosBajos = await Producto.find({
      $expr: { $lte: ['$stock', '$stockMinimo'] }
    }).sort({ stock: 1 });

    res.status(200).json({
      ok: true,
      total: productosBajos.length,
      datos: productosBajos
    });
  } catch (error) {
    next(error);
  }
};