# Backend Inventario

API REST de inventario con Express, MongoDB, autenticación JWT y documentación Swagger.

## Desarrollo local

Configurá `MONGO_URI` y `JWT_SECRET` en `.env`. Opcionalmente, configurá `ADMIN_EMAIL`
con el correo que debe tener rol `ADMIN` en una base ya poblada.

```powershell
npm.cmd install
npm.cmd run dev
```

La API queda disponible en `http://localhost:3000/api` y la documentación en
`http://localhost:3000/api/docs`.

## Desplegar la API en Vercel

1. Subí el código a un repositorio Git y conectalo con Vercel.
2. Para el proyecto de API, usá la raíz del repositorio como **Root Directory**.
   Vercel detecta y ejecuta la aplicación Express exportada por `app.js`.
3. En las variables de entorno de Vercel, configurá `MONGO_URI`, `JWT_SECRET` y,
   si corresponde, `ADMIN_EMAIL`. No las agregues al repositorio ni a `VITE_*`.
4. Permití en MongoDB Atlas las conexiones desde el despliegue de Vercel.
5. Desplegá y verificá `https://<dominio>/api/health`, `https://<dominio>/api/docs`
   y un endpoint que consulte MongoDB, como `https://<dominio>/api/productos`.

La aplicación conecta con MongoDB bajo demanda para las rutas de API y reutiliza la
conexión mientras la instancia serverless permanezca activa. El endpoint de salud no
requiere base de datos; verificá también una ruta de datos antes de considerar operativo
el despliegue. Vercel no sirve `express.static()` como hosting de assets; desplegá el
panel web por separado.

## Clientes web y Android

Para desplegar el panel, creá otro proyecto Vercel desde el mismo repositorio y establecé
`frontend` como **Root Directory**. Configurá `VITE_API_URL` con la URL HTTPS pública de
la API terminada en `/api`.

Para compilar la app Android, establecé `EXPO_PUBLIC_API_URL` con esa misma URL en
`frontend-movil/.env.local` y ejecutá `npm.cmd run android:apk` desde `frontend-movil`.
La dirección se incorpora al APK; no uses `localhost` para un dispositivo Android real.
