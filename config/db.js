const mongoose = require('mongoose');

let connectionPromise;

const conectarDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('Falta configurar la variable MONGO_URI');
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (mongoose.connection.readyState === 0) {
    connectionPromise = undefined;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGO_URI)
      .then(({ connection }) => {
        console.log('[MONGO DB] Conectado exitosamente');
        return connection;
      })
      .catch((error) => {
        connectionPromise = undefined;
        console.error(`[MONGO DB ERROR]: ${error.message}`);
        throw error;
      });
  }

  return connectionPromise;
};

module.exports = conectarDB;