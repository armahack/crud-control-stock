require('dotenv').config();
const app = require('./app');
const conectarDB = require('./config/db');

const PORT = process.env.PORT || 3000;
const iniciarServidor = async () => {
  await conectarDB();
  app.listen(PORT, () => {
    console.log(`[SERVER] Escuchando en http://localhost:${PORT}`);
  });
};

iniciarServidor().catch((error) => {
  console.error(`[SERVER ERROR]: ${error.message}`);
  process.exitCode = 1;
});
