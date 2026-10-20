# Stockroom: panel web oficial

Este cliente React + Vite es el panel web oficial para desarrollo y uso de las funciones
de administración. La interfaz estática en `public/` sigue disponible desde Express como
cliente alternativo heredado; ambas consumen la misma API y sus permisos se validan en el backend.

## Inicio local

1. Iniciá el backend desde la raíz del repositorio (`npm run dev`) con `MONGO_URI` y
   `JWT_SECRET` configurados.
2. Desde `frontend/`, ejecutá `npm install` y `npm run dev`.
3. Abrí la URL que informa Vite (normalmente `http://localhost:5173`). El cliente llama
   a la API en `http://localhost:3000/api`.

## Despliegue del panel en Vercel

Creá un proyecto Vercel conectado al mismo repositorio y configurá `frontend` como
**Root Directory**. Vercel detecta Vite; definí `VITE_API_URL` en las variables de entorno
del proyecto con la URL HTTPS de la API, incluyendo `/api` (por ejemplo,
`https://tu-api.vercel.app/api`). Aplicá la variable a Production y Preview y redeplegá.

No configures `VITE_API_URL` como secreto: Vite incorpora su valor al JavaScript del cliente.
La URL de la API es pública; las credenciales de MongoDB y `JWT_SECRET` deben existir
únicamente como variables secretas del proyecto que despliega el backend.

Para generar y revisar la versión de producción: `npm run build` y `npm run preview`.

## Roles

- `ADMIN`: gestiona usuarios, productos y movimientos.
- `OPERADOR`: crea y edita productos y registra movimientos; no elimina productos ni
  administra usuarios.
- `VISITANTE`: consulta el catálogo y el historial, y puede cambiar su propia contraseña.

El primer usuario registrado en una base vacía obtiene `ADMIN`; los registros públicos
siguientes obtienen `VISITANTE`. Para designar un administrador en una base ya existente,
configurá `ADMIN_EMAIL` con el correo de esa persona; al iniciar sesión con esas credenciales,
el backend la promueve a `ADMIN`. Un administrador también puede crear cuentas y asignar roles
desde la sección **Usuarios**.

El panel ofrece registro/inicio de sesión, consulta y gestión de productos, alertas de stock,
registro e historial de movimientos, cambio de contraseña y ABM de usuarios para `ADMIN`.
La API y la interfaz antigua de Express continúan disponibles en el puerto del backend.
