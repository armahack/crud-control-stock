import { useState } from 'react';
import clienteAxios from '../api/axios';

export default function ChangePassword() {
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNuevo, setPasswordNuevo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cambiar = async (evento) => {
    evento.preventDefault();
    setError('');
    setMensaje('');
    setGuardando(true);
    try {
      const respuesta = await clienteAxios.patch('/auth/cambiar-password', { passwordActual, passwordNuevo });
      setMensaje(respuesta.data.mensaje);
      setPasswordActual('');
      setPasswordNuevo('');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo actualizar la contraseña.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="mx-auto max-w-xl rounded-xl border border-slate-700 bg-slate-800 p-6">
      <h2 className="mb-2 text-xl font-bold text-white">Cambiar contraseña</h2>
      <p className="mb-5 text-sm text-slate-400">Confirmá tu contraseña actual para guardar una nueva.</p>
      {error && <p role="alert" className="mb-4 text-sm text-rose-300">{error}</p>}
      {mensaje && <p role="status" className="mb-4 text-sm text-emerald-300">{mensaje}</p>}
      <form onSubmit={cambiar} className="space-y-4">
        <label className="block text-sm text-slate-300">
          Contraseña actual
          <input type="password" required value={passwordActual} onChange={(e) => setPasswordActual(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white" />
        </label>
        <label className="block text-sm text-slate-300">
          Nueva contraseña
          <input type="password" required minLength={6} value={passwordNuevo} onChange={(e) => setPasswordNuevo(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white" />
        </label>
        <button disabled={guardando} className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-50">
          {guardando ? 'Guardando...' : 'Actualizar contraseña'}
        </button>
      </form>
    </section>
  );
}
