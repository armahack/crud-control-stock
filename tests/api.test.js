process.env.JWT_SECRET = 'test-secret';
delete process.env.ADMIN_EMAIL;

const mockUsuario = {
  countDocuments: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndDelete: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findOne: jest.fn()
};
const mockProducto = {
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndDelete: jest.fn(),
  findByIdAndUpdate: jest.fn()
};
const mockMovimiento = { create: jest.fn(), find: jest.fn() };
const mockConectarDB = jest.fn().mockResolvedValue(undefined);

jest.mock('../models/usuario.model', () => mockUsuario);
jest.mock('../models/producto.model', () => mockProducto);
jest.mock('../models/movimiento.model', () => mockMovimiento);
jest.mock('../config/db', () => mockConectarDB);

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');

const makeQuery = (value) => ({
  select: jest.fn().mockReturnThis(),
  sort: jest.fn().mockResolvedValue(value),
  populate: jest.fn().mockReturnThis(),
  then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); }
});

describe('API de autenticación, inventario y permisos', () => {
  const users = new Map();
  let product;

  const tokenFor = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  const auth = (user) => `Bearer ${tokenFor(user)}`;

  beforeEach(() => {
    jest.clearAllMocks();
    users.clear();
    const admin = { _id: 'admin-id', nombre: 'Admin', email: 'admin@example.com', rol: 'ADMIN' };
    const operator = { _id: 'operator-id', nombre: 'Operador', email: 'operator@example.com', rol: 'OPERADOR' };
    const visitor = { _id: 'visitor-id', nombre: 'Visitante', email: 'visitor@example.com', rol: 'VISITANTE' };
    [admin, operator, visitor].forEach((user) => users.set(user._id, user));
    product = {
      _id: 'product-id', nombre: 'Teclado', codigoBarras: '123', precio: 1200, stock: 7, stockMinimo: 2,
      save: jest.fn().mockResolvedValue(undefined)
    };

    mockUsuario.countDocuments.mockResolvedValue(users.size);
    mockUsuario.findOne.mockResolvedValue(null);
    mockUsuario.create.mockImplementation(async (data) => ({ _id: 'created-user', ...data }));
    mockUsuario.findById.mockImplementation((id) => {
      const user = users.get(String(id)) || null;
      return Object.assign({}, user, { select: jest.fn().mockResolvedValue(user) });
    });
    mockUsuario.find.mockImplementation(() => makeQuery([...users.values()]));
    mockUsuario.findByIdAndUpdate.mockImplementation((id, changes) => {
      const updated = { ...users.get(String(id)), ...changes };
      users.set(String(id), updated);
      return { select: jest.fn().mockResolvedValue(updated) };
    });
    mockUsuario.findByIdAndDelete.mockImplementation(async (id) => users.delete(String(id)));

    mockProducto.find.mockImplementation(() => makeQuery([product]));
    mockProducto.findById.mockImplementation(async () => product);
    mockProducto.create.mockImplementation(async (data) => ({ _id: 'created-product', ...data }));
    mockProducto.findByIdAndUpdate.mockResolvedValue(product);
    mockProducto.findByIdAndDelete.mockResolvedValue(product);

    mockMovimiento.create.mockImplementation(async (data) => ({ _id: 'movement-id', ...data }));
    mockMovimiento.find.mockImplementation(() => makeQuery([]));
  });
  afterEach(() => { delete process.env.ADMIN_EMAIL; });

  it('conecta la base antes de las rutas API y deja el health check disponible', async () => {
    const health = await request(app).get('/api/health');
    expect(health.status).toBe(200);
    expect(mockConectarDB).not.toHaveBeenCalled();

    const products = await request(app).get('/api/productos');
    expect(products.status).toBe(200);
    expect(mockConectarDB).toHaveBeenCalledTimes(1);
  });

  it('registra el primer usuario como administrador y no acepta un rol autoasignado', async () => {
    mockUsuario.countDocuments.mockResolvedValueOnce(0);
    const response = await request(app).post('/api/auth/registro').send({
      nombre: 'Primero', email: 'FIRST@example.com', password: 'secret1', rol: 'ADMIN'
    });

    expect(response.status).toBe(201);
    expect(response.body.datos.rol).toBe('ADMIN');
    expect(mockUsuario.create).toHaveBeenCalledWith(expect.objectContaining({
      email: 'first@example.com', rol: 'ADMIN'
    }));

    mockUsuario.countDocuments.mockResolvedValueOnce(1);
    const laterResponse = await request(app).post('/api/auth/registro').send({
      nombre: 'Nuevo', email: 'new@example.com', password: 'secret1', rol: 'ADMIN'
    });
    expect(laterResponse.status).toBe(201);
    expect(laterResponse.body.datos.rol).toBe('VISITANTE');
  });

  it('cambia la contraseña solo al verificar la actual', async () => {
    const visitor = users.get('visitor-id');
    const save = jest.fn().mockResolvedValue(undefined);
    mockUsuario.findById.mockImplementation((id) => Object.assign({
      ...users.get(String(id)),
      compararPassword: jest.fn().mockImplementation(async (password) => password === 'oldpass'),
      save
    }, { select: jest.fn().mockResolvedValue(users.get(String(id))) }));

    const failed = await request(app).patch('/api/auth/cambiar-password')
      .set('Authorization', auth(visitor)).send({ passwordActual: 'wrong1', passwordNuevo: 'newpass' });
    expect(failed.status).toBe(401);
    expect(save).not.toHaveBeenCalled();

    const success = await request(app).patch('/api/auth/cambiar-password')
      .set('Authorization', auth(visitor)).send({ passwordActual: 'oldpass', passwordNuevo: 'newpass' });
    expect(success.status).toBe(200);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('permite promover una cuenta existente configurada como ADMIN_EMAIL', async () => {
    const account = {
      ...users.get('operator-id'),
      compararPassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(undefined)
    };
    process.env.ADMIN_EMAIL = account.email;
    mockUsuario.findOne.mockResolvedValue(account);

    const response = await request(app).post('/api/auth/login')
      .send({ email: account.email, password: 'secret1' });

    expect(response.status).toBe(200);
    expect(response.body.datos.rol).toBe('ADMIN');
    expect(account.save).toHaveBeenCalledTimes(1);
  });

  it('aplica permisos diferenciados en productos y administración de usuarios', async () => {
    const visitor = users.get('visitor-id');
    const operator = users.get('operator-id');
    const admin = users.get('admin-id');

    expect((await request(app).post('/api/productos').set('Authorization', auth(visitor)).send({ nombre: 'P' })).status).toBe(403);
    expect((await request(app).post('/api/productos').set('Authorization', auth(operator)).send({ nombre: 'P' })).status).toBe(201);
    expect((await request(app).delete('/api/productos/product-id').set('Authorization', auth(operator))).status).toBe(403);
    expect((await request(app).get('/api/usuarios').set('Authorization', auth(visitor))).status).toBe(403);
    expect((await request(app).get('/api/usuarios').set('Authorization', auth(admin))).status).toBe(200);
  });

  it('permite a ADMIN crear, actualizar y eliminar otras cuentas', async () => {
    const admin = users.get('admin-id');
    mockUsuario.create.mockImplementation(async (data) => ({ _id: 'new-user', ...data }));

    const created = await request(app).post('/api/usuarios').set('Authorization', auth(admin)).send({
      nombre: 'Nuevo operador', email: 'nuevo@example.com', password: 'secret1', rol: 'OPERADOR'
    });
    expect(created.status).toBe(201);
    expect(created.body.datos.rol).toBe('OPERADOR');
    expect(mockUsuario.create).toHaveBeenCalledWith(expect.objectContaining({ rol: 'OPERADOR' }));

    const changed = await request(app).put('/api/usuarios/operator-id').set('Authorization', auth(admin))
      .send({ rol: 'VISITANTE' });
    expect(changed.status).toBe(200);
    expect(changed.body.datos.rol).toBe('VISITANTE');

    const removed = await request(app).delete('/api/usuarios/visitor-id').set('Authorization', auth(admin));
    expect(removed.status).toBe(200);
  });

  it('impide que un administrador se elimine o se quite sus propios permisos', async () => {
    const admin = users.get('admin-id');
    mockUsuario.countDocuments.mockResolvedValue(1);

    const changed = await request(app).put('/api/usuarios/operator-id')
      .set('Authorization', auth(admin)).send({ rol: 'VISITANTE' });
    const removed = await request(app).delete('/api/usuarios/admin-id')
      .set('Authorization', auth(admin));

    expect(changed.status).toBe(200);
    expect(removed.status).toBe(400);

    const selfDemotion = await request(app).put('/api/usuarios/admin-id')
      .set('Authorization', auth(admin)).send({ rol: 'VISITANTE' });
    expect(selfDemotion.status).toBe(400);
  });

  it('valida y registra movimientos actualizando stock', async () => {
    const operator = users.get('operator-id');
    const headers = { Authorization: auth(operator) };

    const invalid = await request(app).post('/api/movimientos').set(headers)
      .send({ productoId: product._id, tipo: 'SALIDA', cantidad: 0 });
    expect(invalid.status).toBe(400);
    expect(product.save).not.toHaveBeenCalled();

    const result = await request(app).post('/api/movimientos').set(headers)
      .send({ productoId: product._id, tipo: 'SALIDA', cantidad: 2 });
    expect(result.status).toBe(201);
    expect(result.body.stockNuevo).toBe(5);
    expect(product.save).toHaveBeenCalledTimes(1);
    expect(mockMovimiento.create).toHaveBeenCalledWith(expect.objectContaining({
      producto: product._id, usuario: operator._id, cantidad: 2
    }));
  });
});
