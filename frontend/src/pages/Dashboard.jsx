import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clienteAxios from '../api/axios';
import { AlertTriangle, LogOut, Package, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import Movements from './Movements';
import UserManagement from './UserManagement';
import ChangePassword from './ChangePassword';

const formularioVacio = {
  nombre: '',
  codigoBarras: '',
  precio: '',
  stock: '0',
  stockMinimo: '5'
};

const mensajeDeError = (error) =>
  error.response?.data?.mensaje ||
  error.response?.data?.error ||
  'No se pudo completar la solicitud. Comprueba que la API y MongoDB estén disponibles.';

const obtenerUsuario = () => {
  try {
    return JSON.parse(localStorage.getItem('usuario')) || { nombre: 'Usuario' };
  } catch {
    return { nombre: 'Usuario' };
  }
};

export default function Dashboard() {
  const [productos, setProductos] = useState([]);
  const [stockBajo, setStockBajo] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [formulario, setFormulario] = useState(formularioVacio);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [vista, setVista] = useState('inventario');
  const navigate = useNavigate();

  const usuario = obtenerUsuario();
  const esAdmin = usuario.rol === 'ADMIN';
  const puedeOperar = esAdmin || ['OPERADOR', 'USER'].includes(usuario.rol);

  const solicitarDatos = useCallback(async () => {
    const [resProductos, resStockBajo] = await Promise.all([
      clienteAxios.get('/productos'),
      clienteAxios.get('/productos/stock-bajo')
    ]);

    if (!Array.isArray(resProductos.data.datos) || !Array.isArray(resStockBajo.data.datos)) {
      throw new Error('La API devolvió un formato de datos inesperado.');
    }

    return {
      productos: resProductos.data.datos,
      stockBajo: resStockBajo.data.datos
    };
  }, []);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const datos = await solicitarDatos();
      setProductos(datos.productos);
      setStockBajo(datos.stockBajo);
    } catch (err) {
      setError(err.message === 'La API devolvió un formato de datos inesperado.'
        ? err.message
        : mensajeDeError(err));
    } finally {
      setCargando(false);
    }
  }, [solicitarDatos]);

  useEffect(() => {
    let activo = true;
    solicitarDatos()
      .then((datos) => {
        if (!activo) return;
        setError('');
        setProductos(datos.productos);
        setStockBajo(datos.stockBajo);
      })
      .catch((err) => {
        if (!activo) return;
        setError(err.message === 'La API devolvió un formato de datos inesperado.'
          ? err.message
          : mensajeDeError(err));
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [solicitarDatos]);

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  const cambiarCampo = ({ target: { name, value } }) => {
    setFormulario((actual) => ({ ...actual, [name]: value }));
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setFormulario(formularioVacio);
  };

  const iniciarEdicion = (producto) => {
    setEditandoId(producto._id);
    setFormulario({
      nombre: producto.nombre,
      codigoBarras: producto.codigoBarras || '',
      precio: String(producto.precio),
      stock: String(producto.stock),
      stockMinimo: String(producto.stockMinimo)
    });
    setMensaje('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const guardarProducto = async (evento) => {
    evento.preventDefault();
    setGuardando(true);
    setError('');
    setMensaje('');

    const datos = {
      nombre: formulario.nombre.trim(),
      codigoBarras: formulario.codigoBarras.trim(),
      precio: Number(formulario.precio),
      stock: Number(formulario.stock),
      stockMinimo: Number(formulario.stockMinimo)
    };

    try {
      if (editandoId) {
        await clienteAxios.put(`/productos/${editandoId}`, datos);
        setMensaje('Producto actualizado correctamente.');
      } else {
        await clienteAxios.post('/productos', datos);
        setMensaje('Producto creado correctamente.');
      }

      cancelarEdicion();
      await cargarDatos();
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const eliminarProducto = async (producto) => {
    if (!window.confirm(`¿Querés eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    setEliminandoId(producto._id);
    setError('');
    setMensaje('');
    try {
      await clienteAxios.delete(`/productos/${producto._id}`);
      if (editandoId === producto._id) cancelarEdicion();
      setMensaje('Producto eliminado correctamente.');
      await cargarDatos();
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEliminandoId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Package className="text-emerald-400" size={28} />
          <h1 className="text-xl font-bold text-white">Sistema de Inventario</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-300 text-sm">
            Hola, <strong className="text-emerald-400">{usuario.nombre}</strong>
            <span className="ml-2 text-slate-500">({usuario.rol || 'VISITANTE'})</span>
          </span>
          <button
            onClick={cerrarSesion}
            className="flex items-center gap-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white px-3 py-1.5 rounded-lg text-sm border border-rose-500/30 transition-all cursor-pointer"
          >
            <LogOut size={16} /> Salir
          </button>
        </div>
      </header>

      <nav aria-label="Secciones del panel" className="flex flex-wrap gap-2 border-b border-slate-700 bg-slate-800 px-6 py-3">
        {[
          ['inventario', 'Inventario'],
          ['movimientos', 'Movimientos'],
          ['password', 'Cambiar contraseña'],
          ...(esAdmin ? [['usuarios', 'Usuarios']] : [])
        ].map(([id, label]) => (
          <button key={id} onClick={() => setVista(id)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${vista === id ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
            {label}
          </button>
        ))}
      </nav>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {error && (
          <div role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300">
            {error}
          </div>
        )}
        {mensaje && (
          <div role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300">
            {mensaje}
          </div>
        )}

        {vista === 'inventario' ? (
          <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Productos</p>
              <h2 className="text-3xl font-bold text-white mt-1">{productos.length}</h2>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg"><Package size={28} /></div>
          </div>

          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Alertas de Stock Bajo</p>
              <h2 className="text-3xl font-bold text-amber-400 mt-1">{stockBajo.length}</h2>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg"><AlertTriangle size={28} /></div>
          </div>

          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Conexión con la API</p>
              <span className={`inline-block mt-2 px-2.5 py-1 text-xs font-semibold rounded-full border ${
                error
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}>
                {error ? 'Revisar conexión' : 'Disponible'}
              </span>
            </div>
            <button
              onClick={cargarDatos}
              disabled={cargando}
              className="p-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Recargar datos"
            >
              <RefreshCw size={24} className={cargando ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {stockBajo.length > 0 && (
          <section className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5">
            <div className="flex items-center gap-2 text-amber-400 font-semibold mb-3">
              <AlertTriangle size={20} />
              <h2>Atención: productos con stock bajo</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {stockBajo.map((producto) => (
                <div key={producto._id} className="bg-slate-800/80 p-3 rounded-lg border border-amber-500/20 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-white text-sm">{producto.nombre}</p>
                    <p className="text-xs text-slate-400">Mínimo requerido: {producto.stockMinimo}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-rose-500/20 text-rose-400 font-bold text-xs rounded-md">
                    Stock: {producto.stock}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {puedeOperar && <section className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="font-bold text-lg text-white">
                {editandoId ? 'Editar producto' : 'Agregar producto'}
              </h2>
              <p className="text-sm text-slate-400">
                Los cambios se guardan en la base de datos mediante la API.
              </p>
            </div>
            {editandoId && (
              <button
                type="button"
                onClick={cancelarEdicion}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200"
              >
                <X size={16} /> Cancelar
              </button>
            )}
          </div>

          <form onSubmit={guardarProducto} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <label className="text-sm text-slate-300">
              Nombre
              <input
                name="nombre"
                value={formulario.nombre}
                onChange={cambiarCampo}
                required
                maxLength={120}
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white"
              />
            </label>
            <label className="text-sm text-slate-300">
              Código de barras
              <input
                name="codigoBarras"
                value={formulario.codigoBarras}
                onChange={cambiarCampo}
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white"
              />
            </label>
            <label className="text-sm text-slate-300">
              Precio
              <input
                name="precio"
                type="number"
                min="0"
                step="0.01"
                value={formulario.precio}
                onChange={cambiarCampo}
                required
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white"
              />
            </label>
            <label className="text-sm text-slate-300">
              Stock actual
              <input
                name="stock"
                type="number"
                min="0"
                step="1"
                value={formulario.stock}
                onChange={cambiarCampo}
                required
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white"
              />
            </label>
            <label className="text-sm text-slate-300">
              Stock mínimo
              <input
                name="stockMinimo"
                type="number"
                min="0"
                step="1"
                value={formulario.stockMinimo}
                onChange={cambiarCampo}
                required
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white"
              />
            </label>
            <div className="sm:col-span-2 lg:col-span-5">
              <button
                type="submit"
                disabled={guardando}
                className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {editandoId ? <Pencil size={18} /> : <Plus size={18} />}
                {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Agregar producto'}
              </button>
            </div>
          </form>
        </section>}

        <section className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-700 flex justify-between items-center">
            <h2 className="font-bold text-lg text-white">Catálogo de Productos</h2>
            <span className="text-xs text-slate-400">GET /api/productos</span>
          </div>

          {cargando ? (
            <div className="p-8 text-center text-slate-400">Cargando inventario...</div>
          ) : productos.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No hay productos registrados en el sistema.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs">
                  <tr>
                    <th className="p-4">Producto</th>
                    <th className="p-4">Código</th>
                    <th className="p-4">Precio</th>
                    <th className="p-4">Stock Actual</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {productos.map((producto) => (
                    <tr key={producto._id} className="hover:bg-slate-700/30">
                      <td className="p-4 font-medium text-white">{producto.nombre}</td>
                      <td className="p-4 text-slate-400 font-mono text-xs">{producto.codigoBarras || 'N/A'}</td>
                      <td className="p-4 text-emerald-400 font-semibold">${producto.precio}</td>
                      <td className="p-4 font-bold">{producto.stock}</td>
                      <td className="p-4">
                        {producto.stock <= producto.stockMinimo ? (
                          <span className="px-2 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs rounded-md font-medium">
                            Stock bajo
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs rounded-md font-medium">
                            Disponible
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {puedeOperar && <>
                          <button
                            type="button"
                            onClick={() => iniciarEdicion(producto)}
                            aria-label={`Editar ${producto.nombre}`}
                            className="rounded-md p-2 text-sky-300 hover:bg-sky-500/10"
                          >
                            <Pencil size={16} />
                          </button>
                          {esAdmin && (
                          <button
                            type="button"
                            onClick={() => eliminarProducto(producto)}
                            disabled={eliminandoId === producto._id}
                            aria-label={`Eliminar ${producto.nombre}`}
                            className="rounded-md p-2 text-rose-300 hover:bg-rose-500/10 disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                          </button>
                          )}
                          </>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
          </>
        ) : vista === 'movimientos' ? (
          <Movements puedeAdministrar={puedeOperar} />
        ) : vista === 'usuarios' && esAdmin ? (
          <UserManagement usuarioActual={usuario} />
        ) : (
          <ChangePassword />
        )}
      </main>
    </div>
  );
}
