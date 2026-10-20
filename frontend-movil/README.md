# Stockroom - aplicación móvil Android

Cliente React Native con Expo para la API principal de inventario. Incluye autenticación,
inventario, movimientos, cambio de contraseña y administración de usuarios para `ADMIN`.

## Requisitos

- Node.js y npm.
- Expo Go instalado en el teléfono.
- Backend ejecutándose en la computadora y conectado a MongoDB Atlas.
- Teléfono y computadora conectados a la misma red Wi-Fi.

## Configurar la dirección de la API

La aplicación usa `EXPO_PUBLIC_API_URL`. Durante el desarrollo intenta detectar la IP del host
Expo Go automáticamente; si no puede, usa `http://localhost:3000/api`. En un teléfono físico
`localhost` apunta al propio teléfono, no a la computadora, por eso se recomienda configurar la IP.

1. Copiá `.env.example` como `.env.local` dentro de `frontend-movil`.
2. Para Expo Go en la misma Wi-Fi, reemplazá la dirección por la IPv4 de la computadora,
   obtenida con `ipconfig`. Para un APK que funcionará fuera de la red local, configurá
   la URL HTTPS pública de tu API.

   ```dotenv
   EXPO_PUBLIC_API_URL=https://api.tu-dominio.com/api
   ```

   En desarrollo local puede ser `http://192.168.1.50:3000/api`; el teléfono y la computadora
   deben estar en la misma red y Windows Firewall debe permitir el puerto 3000. No uses
   `localhost`: en un teléfono Android identifica al propio dispositivo, no a tu computadora.

## Iniciar

Terminal 1, desde la carpeta del backend:

```powershell
npm.cmd run dev
```

Terminal 2, desde `frontend-movil`:

```powershell
npm.cmd install
npx.cmd expo start --lan
```

Escaneá el QR con Expo Go. Si cambiaste `.env.local` con Expo ya abierto, reiniciá Metro con
`npx.cmd expo start --lan --clear`.

## Generar un APK instalable en Windows

La API debe tener una dirección alcanzable desde el dispositivo Android. Configurá
`EXPO_PUBLIC_API_URL` en `.env.local`; el script rechaza URLs `localhost` para evitar generar
un APK que no pueda conectarse desde el teléfono.

Instalá Android Studio y sus Android SDK/Build Tools, configurá `ANDROID_HOME` o
`ANDROID_SDK_ROOT`, y asegurate de tener un JDK compatible (Java 21 en este proyecto).
Luego, desde `frontend-movil`:

```powershell
npm.cmd run android:apk
```

El APK de prueba, firmado con la clave de depuración de Android, se genera en
`frontend-movil/android/app/build/outputs/apk/debug/app-debug.apk` y se puede instalar para
probar la app. No lo distribuyas como versión de producción. Para Google Play se requiere
configurar y proteger una clave de firma release.

También está definido un perfil APK en `eas.json` para un build con Expo Application Services.
Ese flujo necesita una cuenta Expo y compila el proyecto en sus servidores; no se ejecutó.

## Funciones conectadas a la API

- Registro e inicio de sesión usando `/api/auth/registro` y `/api/auth/login`.
- Token JWT guardado con `expo-secure-store`.
- Cambio de contraseña y gestión de usuarios/roles desde la pestaña Cuenta.
- Lista de productos y alertas de stock bajo con `FlatList`.
- Alta, edición y eliminación de productos.
- Registro de entradas y salidas, con historial de movimientos.
- Permisos de interfaz acordes a los roles `ADMIN`, `OPERADOR` y `VISITANTE`; el backend
  aplica la autorización definitiva a cada operación.

Las escrituras se procesan en el backend; el móvil no se conecta directamente a MongoDB.
Las URLs `http://` se habilitan únicamente para desarrollo/red local; para un APK de uso real,
preferí una API publicada mediante HTTPS.
