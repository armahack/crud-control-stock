import { useCallback, useEffect, useState } from 'react';
import clienteAxios from '../api/axios';

const errorMessage = (error) => error.response?.data?.mensaje || 'No se pudieron cargar los movimientos.';

export default function Movements({ puedeAdministrar }) {
  const [productos, setProductos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [productoId, setProductoId] = useState('');
  const [tipo, setTipo] = useState('ENTRADA');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [productosRes, movimientosRes] = await Promise.all([
        clienteAxios.get('/productos'),
        clienteAxios.get('/movimientos')
      ]);
      setProductos(productosRes.data.datos);
      setMovimientos(movimientosRes.data.datos);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    let activo = true;
    Promise.all([clienteAxios.get('/productos'), clienteAxios.get('/movimientos')])
      .then(([productosRes, movimientosRes]) => {
        if (!activo) return;
        setProductos(productosRes.data.datos);
        setMovimientos(movimientosRes.data.datos);
      })
      .catch((err) => {
        if (activo) setError(errorMessage(err));
      });
    return () => { activo = false; };
  }, []);
  const selectedProduct = productos.find((producto) => producto._id === productoId) || productos[0];

  const registrar = async (evento) => {
    evento.preventDefault();
    setError('');
    setMensaje('');
    setGuardando(true);
    try {
      const respuesta = await clienteAxios.post('/movimientos', {
        productoId: selectedProduct?._id, tipo, cantidad: Number(cantidad), motivo: motivo.trim()
      });
      setMensaje(respuesta.data.mensaje);
      setCantidad('');
      setMotivo('');
      await cargar();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300">{error}</p>}
      {mensaje && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300">{mensaje}</p>}
      {puedeAdministrar && (
        <form onSubmit={registrar} className="grid gap-4 rounded-xl border border-slate-700 bg-slate-800 p-6 sm:grid-cols-2">
          <h2 className="text-xl font-bold text-white sm:col-span-2">Registrar movimiento</h2>
          <label className="text-sm text-slate-300">Producto
            <select required value={selectedProduct?._id || ''} onChange={(e) => setProductoId(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white">
              {productos.map((producto) => <option key={producto._id} value={producto._id}>{producto.nombre} · stock {producto.stock}</option>)}
            </select>
          </label>
          <label className="text-sm text-slate-300">Tipo
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white">
              <option value="ENTRADA">Entrada</option><option value="SALIDA">Salida</option>
            </select>
          </label>
          <label className="text-sm text-slate-300">Cantidad
            <input required type="number" min="1" step="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white" />
          </label>
          <label className="text-sm text-slate-300">Motivo (opcional)
            <input value={motivo} onChange={(e) => setMotivo(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white" />
          </label>
          <button disabled={guardando || !productos.length} className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-50 sm:col-span-2">
            {guardando ? 'Guardando...' : 'Guardar movimiento'}
          </button>
        </form>
      )}
      <section className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
        <div className="border-b border-slate-700 p-5"><h2 className="text-xl font-bold text-white">Historial de movimientos</h2></div>
        {movimientos.length === 0 ? <p className="p-5 text-slate-400">Todavía no hay movimientos registrados.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/50 text-xs uppercase text-slate-400">
                <tr><th className="p-4">Fecha</th><th className="p-4">Producto</th><th className="p-4">Tipo</th><th className="p-4">Cantidad</th><th className="p-4">Usuario</th><th className="p-4">Motivo</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {movimientos.map((movimiento) => (
                  <tr key={movimiento._id}>
                    <td className="p-4">{new Date(movimiento.createdAt).toLocaleString()}</td>
                    <td className="p-4 text-white">{movimiento.producto?.nombre || 'Producto eliminado'}</td>
                    <td className="p-4">{movimiento.tipo}</td><td className="p-4">{movimiento.cantidad}</td>
                    <td className="p-4">{movimiento.usuario?.nombre || 'Usuario eliminado'}</td>
                    <td className="p-4">{movimiento.motivo || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
