const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API REST - Sistema de Inventario',
      version: '1.0.0',
      description: 'Documentación interactiva de la API para clientes Web y Móvil'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor Local'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingresa el Token JWT obtenido en el Login'
        }
      }
    },
    paths: {
      // --- AUTENTICACIÓN ---
      '/api/auth/registro': {
        post: {
          summary: 'Registrar un nuevo usuario',
          tags: ['Autenticación'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    nombre: { type: 'string', example: 'Juan Pérez' },
                    email: { type: 'string', example: 'juan@email.com' },
                    password: { type: 'string', example: '123456' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Usuario registrado con éxito' },
            400: { description: 'El email ya existe o datos inválidos' }
          }
        }
      },
      '/api/auth/login': {
        post: {
          summary: 'Iniciar sesión para obtener Token JWT',
          tags: ['Autenticación'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', example: 'juan@email.com' },
                    password: { type: 'string', example: '123456' }
                  }
                }
              }
            }
          },
          '/api/auth/cambiar-password': {
            patch: {
              summary: 'Cambiar la contraseña de la sesión actual',
              tags: ['Autenticación'],
              security: [{ bearerAuth: [] }],
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      required: ['passwordActual', 'passwordNuevo'],
                      properties: {
                        passwordActual: { type: 'string' },
                        passwordNuevo: { type: 'string', minLength: 6 }
                      }
                    }
                  }
                }
              },
              responses: {
                200: { description: 'Contraseña actualizada' },
                401: { description: 'Contraseña actual incorrecta o token inválido' }
              }
            }
          },
          '/api/usuarios': {
            get: {
              summary: 'Listar usuarios (solo ADMIN)',
              tags: ['Usuarios'],
              security: [{ bearerAuth: [] }],
              responses: { 200: { description: 'Lista de usuarios' }, 403: { description: 'Permisos insuficientes' } }
            },
            post: {
              summary: 'Crear usuario con rol (solo ADMIN)',
              tags: ['Usuarios'],
              security: [{ bearerAuth: [] }],
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      required: ['nombre', 'email', 'password', 'rol'],
                      properties: {
                        nombre: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string', minLength: 6 },
                        rol: { type: 'string', enum: ['ADMIN', 'OPERADOR', 'VISITANTE'] }
                      }
                    }
                  }
                }
              },
              responses: { 201: { description: 'Usuario creado' }, 403: { description: 'Permisos insuficientes' } }
            }
          },
          '/api/usuarios/{id}': {
            put: {
              summary: 'Actualizar nombre, email o rol (solo ADMIN)',
              tags: ['Usuarios'],
              security: [{ bearerAuth: [] }],
              parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        nombre: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        rol: { type: 'string', enum: ['ADMIN', 'OPERADOR', 'VISITANTE'] }
                      }
                    }
                  }
                }
              },
              responses: { 200: { description: 'Usuario actualizado' }, 403: { description: 'Permisos insuficientes' } }
            },
            delete: {
              summary: 'Eliminar usuario (solo ADMIN)',
              tags: ['Usuarios'],
              security: [{ bearerAuth: [] }],
              parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
              responses: { 200: { description: 'Usuario eliminado' }, 403: { description: 'Permisos insuficientes' } }
            }
          },
          responses: {
            200: { description: 'Login exitoso y retorno de Token JWT' },
            401: { description: 'Credenciales inválidas' }
          }
        }
      },

      // --- PRODUCTOS ---
      '/api/productos': {
        get: {
          summary: 'Obtiene la lista de todos los productos',
          tags: ['Productos'],
          responses: {
            200: { description: 'Lista de productos obtenida correctamente' }
          }
        },
        post: {
          summary: 'Crea un nuevo producto (Protegido)',
          tags: ['Productos'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    nombre: { type: 'string', example: 'Pepsi 2.25L' },
                    precio: { type: 'number', example: 4200 },
                    stock: { type: 'number', example: 15 },
                    codigoBarras: { type: 'string', example: '779123456790' },
                    stockMinimo: { type: 'number', example: 5 }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Producto creado exitosamente' },
            400: { description: 'Código de barras duplicado o datos inválidos' },
            401: { description: 'No autorizado' }
          }
        }
      },
      '/api/productos/stock-bajo': {
        get: {
          summary: 'Obtener productos con stock crítico (Protegido)',
          tags: ['Productos'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Lista de productos con stock menor o igual al mínimo' },
            401: { description: 'No autorizado' }
          }
        }
      },
      '/api/productos/{id}': {
        get: {
          summary: 'Obtiene un producto por su ID',
          tags: ['Productos'],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' },
              description: 'ID de MongoDB del producto'
            }
          ],
          responses: {
            200: { description: 'Producto encontrado' },
            404: { description: 'Producto no encontrado' }
          }
        },
        put: {
          summary: 'Actualiza un producto por su ID (Protegido)',
          tags: ['Productos'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    nombre: { type: 'string', example: 'Pepsi 2.25L Modificada' },
                    precio: { type: 'number', example: 4500 }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Producto actualizado con éxito' },
            404: { description: 'Producto no encontrado' }
          }
        },
        delete: {
          summary: 'Elimina un producto por su ID (Protegido)',
          tags: ['Productos'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            200: { description: 'Producto eliminado con éxito' },
            404: { description: 'Producto no encontrado' }
          }
        }
      },

      // --- MOVIMIENTOS ---
      '/api/movimientos': {
        get: {
          summary: 'Obtener historial de movimientos (Protegido)',
          tags: ['Movimientos'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Historial de movimientos obtenido con éxito' },
            401: { description: 'No autorizado' }
          }
        },
        post: {
          summary: 'Registrar un movimiento / venta (Protegido)',
          tags: ['Movimientos'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    productoId: { type: 'string', example: '65f1234567890abc' },
                    tipo: { type: 'string', example: 'SALIDA' },
                    cantidad: { type: 'number', example: 2 },
                    motivo: { type: 'string', example: 'Venta de mostrador' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Movimiento registrado y stock actualizado' },
            400: { description: 'Stock insuficiente o datos inválidos' }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app) => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = setupSwagger;