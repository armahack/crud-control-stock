const express = require('express');
const cors = require('cors');
const path = require('path');
const conectarDB = require('./config/db');
const productoRoutes = require('./routes/producto.routes');
const authRoutes = require('./routes/auth.routes');
const movimientoRoutes = require('./routes/movimiento.routes');
const usuarioRoutes = require('./routes/usuario.routes');
const setupSwagger = require('./config/swagger');
const manejarErrores = require('./middlewares/error.middleware');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({
    estado: 'OK',
    timestamp: new Date()
  });
});

setupSwagger(app);
app.use('/api', async (req, res, next) => {
  try {
    await conectarDB();
    next();
  } catch (error) {
    next(error);
  }
});

app.use('/api/productos', productoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/movimientos', movimientoRoutes);
app.use('/api/usuarios', usuarioRoutes);

app.use(express.static(path.join(__dirname, 'public')));
app.use(manejarErrores);

module.exports = app;
