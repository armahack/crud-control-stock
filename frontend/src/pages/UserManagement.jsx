import { useCallback, useEffect, useState } from 'react';
import clienteAxios from '../api/axios';

const roles = ['ADMIN', 'OPERADOR', 'VISITANTE'];
const emptyUser = { nombre: '', email: '', password: '', rol: 'OPERADOR' };

export default function UserManagement({ usuarioActual }) {
  const [usuarios, setUsuarios] = useState([]);
  const [formulario, setFormulario] = useState(emptyUser);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const respuesta = await clienteAxios.get('/usuarios');
      setUsuarios(respuesta.data.datos);
      setError('');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudieron cargar los usuarios.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    let activo = true;
    clienteAxios.get('/usuarios')
      .then((respuesta) => {
        if (!activo) return;
        setUsuarios(respuesta.data.datos);
        setError('');
      })
      .catch((err) => {
        if (activo) setError(err.response?.data?.mensaje || 'No se pudieron cargar los usuarios.');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => { activo = false; };
  }, []);

  const actualizarRol = async (usuario) => {
    setError('');
    setMensaje('');
    try {
      await clienteAxios.put(`/usuarios/${usuario._id}`, { rol: usuario.rol });
      setMensaje(`Rol actualizado para ${usuario.nombre}.`);
      await cargar();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo actualizar el usuario.');
      await cargar();
    }
  };

  const crearUsuario = async (evento) => {
    evento.preventDefault();
    setGuardando(true);
    setError('');
    setMensaje('');
    try {
      await clienteAxios.post('/usuarios', formulario);
      setFormulario(emptyUser);
      setMensaje('Usuario creado correctamente.');
      await cargar();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo crear el usuario.');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (usuario) => {
    if (!window.confirm(`¿Eliminar la cuenta de ${usuario.nombre}?`)) return;
    setError('');
    setMensaje('');
    try {
      await clienteAxios.delete(`/usuarios/${usuario._id}`);
      setMensaje('Usuario eliminado correctamente.');
      await cargar();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo eliminar el usuario.');
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-700 bg-slate-800 p-6">
        <h2 className="mb-5 text-xl font-bold text-white">Crear usuario</h2>
        {error && <p role="alert" className="mb-4 text-sm text-rose-300">{error}</p>}
        {mensaje && <p role="status" className="mb-4 text-sm text-emerald-300">{mensaje}</p>}
        <form onSubmit={crearUsuario} className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-slate-300">Nombre
            <input required value={formulario.nombre} onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white" />
          </label>
          <label className="text-sm text-slate-300">Email
            <input required type="email" value={formulario.email} onChange={(e) => setFormulario({ ...formulario, email: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white" />
          </label>
          <label className="text-sm text-slate-300">Contraseña inicial
            <input required minLength={6} type="password" value={formulario.password} onChange={(e) => setFormulario({ ...formulario, password: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white" />
          </label>
          <label className="text-sm text-slate-300">Rol
            <select value={formulario.rol} onChange={(e) => setFormulario({ ...formulario, rol: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white">
              {roles.map((rol) => <option key={rol}>{rol}</option>)}
            </select>
          </label>
          <button disabled={guardando} className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-50 sm:col-span-2">
            {guardando ? 'Creando...' : 'Crear cuenta'}
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
        <div className="border-b border-slate-700 p-5">
          <h2 className="text-xl font-bold text-white">Usuarios y permisos</h2>
          <p className="mt-1 text-sm text-slate-400">El administrador puede modificar roles y eliminar cuentas.</p>
        </div>
        {cargando ? <p className="p-5 text-slate-400">Cargando usuarios...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/50 text-xs uppercase text-slate-400">
                <tr><th className="p-4">Usuario</th><th className="p-4">Email</th><th className="p-4">Rol</th><th className="p-4">Acciones</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {usuarios.map((usuario) => (
                  <tr key={usuario._id}>
                    <td className="p-4 text-white">{usuario.nombre}{usuario._id === usuarioActual._id ? ' (vos)' : ''}</td>
                    <td className="p-4">{usuario.email}</td>
                    <td className="p-4">
                      <select value={usuario.rol} disabled={usuario._id === usuarioActual._id}
                        onChange={(e) => setUsuarios((actuales) => actuales.map((item) => item._id === usuario._id ? { ...item, rol: e.target.value } : item))}
                        className="rounded border border-slate-600 bg-slate-900 p-2 text-white">
                        {roles.map((rol) => <option key={rol}>{rol}</option>)}
                      </select>
                    </td>
                    <td className="space-x-2 p-4">
                      <button onClick={() => actualizarRol(usuario)} disabled={usuario._id === usuarioActual._id}
                        className="rounded bg-slate-700 px-3 py-1.5 text-white disabled:opacity-40">Guardar rol</button>
                      <button onClick={() => eliminar(usuario)} disabled={usuario._id === usuarioActual._id}
                        className="rounded bg-rose-900/60 px-3 py-1.5 text-rose-200 disabled:opacity-40">Eliminar</button>
                    </td>
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
