const request = require('supertest');
const app = require('../app');

describe('GET /api/health', () => {
  it('responde que la API está activa', async () => {
    const respuesta = await request(app).get('/api/health');

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body.estado).toBe('OK');
    expect(respuesta.body.timestamp).toBeDefined();
  });
});

describe('Cliente web de inventario', () => {
  it('sirve la página y sus archivos estáticos', async () => {
    const pagina = await request(app).get('/');
    const script = await request(app).get('/app.js');
    const estilos = await request(app).get('/styles.css');

    expect(pagina.statusCode).toBe(200);
    expect(pagina.text).toContain('Stockroom');
    expect(script.statusCode).toBe(200);
    expect(script.text).toContain('/movimientos');
    expect(estilos.statusCode).toBe(200);
  });
});
