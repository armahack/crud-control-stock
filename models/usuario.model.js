const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rol: {
    type: String,
    enum: ['ADMIN', 'OPERADOR', 'VISITANTE', 'USER'],
    default: 'VISITANTE'
  },
  permisos: {
    crearProductos: { type: Boolean, default: false },
    modificarStock: { type: Boolean, default: false },
    registrarVentas: { type: Boolean, default: true },
    verReportes: { type: Boolean, default: true },
    gestionarUsuarios: { type: Boolean, default: false }
  }
}, { timestamps: true });

usuarioSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

usuarioSchema.methods.compararPassword = function compararPassword(passwordIngresada) {
  return bcrypt.compare(passwordIngresada, this.password);
};

module.exports = mongoose.model('Usuario', usuarioSchema);
