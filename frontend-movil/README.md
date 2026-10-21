# Stockroom Inventario para Android

Aplicación móvil hecha con React Native y Expo para consultar y administrar el inventario mediante la API del proyecto, desplegada en Vercel. La aplicación no se conecta directamente a MongoDB: las solicitudes pasan por la API.

## Estado de la APK generada

- Archivo: `android\app\build\outputs\apk\release\app-release.apk`
- Tamaño verificado: 71,8 MiB (75.280.995 bytes)
- Paquete Android: `com.stockroom.inventario`
- Versión: `1.0.0`
- API configurada para esta compilación: `https://crud-control-stock-api.vercel.app/api`
- Firma: clave de depuración de Android; adecuada para pruebas e instalación directa, no para publicar en Google Play.

La firma APK v2 es válida, el manifiesto informa el paquete y la versión indicados, y el
bundle JavaScript contiene la URL HTTPS configurada. La APK incluye el bundle de la
aplicación, por lo que para ejecutarla no hace falta iniciar Metro. El usuario confirmó que
la versión instalada funciona correctamente. Para probarla, usá cuentas y productos de
prueba: esta APK opera contra el entorno publicado. La firma debug sirve para probar, no
para publicar en Google Play.

## Requisitos

- Windows, PowerShell y Node.js con npm.
- Un JDK compatible con el Gradle del proyecto. En este entorno, el wrapper se inicia con
  JDK 21 y Gradle informa que su daemon usa Java 25 según
  `android\gradle\gradle-daemon-jvm.properties`; la versión efectiva se comprueba con
  `gradlew.bat -version`.
- Android SDK y Build Tools instalados, por ejemplo, mediante Android Studio.
- Para la configuración Android actual: Android SDK 36, Build Tools 36.0.0 y NDK 27.1.12297006.
- Un teléfono Android para instalar y probar el APK.
- Para usar la aplicación, conexión a Internet y acceso a la API de Vercel.

Para usar Expo Go durante el desarrollo se necesita, además, Expo Go instalado en el teléfono. Para instalar el APK release no hace falta iniciar Metro ni tener Expo Go.

## Dirección de la API

La variable `EXPO_PUBLIC_API_URL` establece la dirección base que usa la aplicación. En este proyecto debe incluir el sufijo `/api`:

```dotenv
EXPO_PUBLIC_API_URL=https://crud-control-stock-api.vercel.app/api
```

El valor se configura en `frontend-movil\.env.local`. Ese archivo es local y no se debe subir al repositorio. Existe `.env.example` como plantilla; si todavía no existe `.env.local`, se puede crear así desde la carpeta `frontend-movil`:

```powershell
Copy-Item .env.example .env.local
```

Después, abrir `.env.local` y dejar la variable como se muestra arriba. No usar `localhost` en un APK: en un teléfono Android señalaría al propio teléfono, no a Vercel ni a la computadora.

El script de compilación valida que la URL sea válida, use HTTP o HTTPS, termine en `/api` y no apunte a `localhost`. Para un APK que se conecte a un servicio publicado, se recomienda HTTPS.

## Cómo se genera el APK

La carpeta nativa `android` se genera mediante Expo y está excluida de Git. Si no está
presente en tu copia, generala una vez desde `frontend-movil` antes de abrir Android Studio:

```powershell
npx.cmd expo prebuild --platform android
```

Estos son los pasos para producir la APK de este proyecto:

1. Revisar la configuración Android y la URL de API. La app ya tenía configurado el paquete `com.stockroom.inventario` y `.env.local` ya contenía la URL HTTPS de Vercel.
2. Ejecutar `scripts\validate-api-url.js`, que comprueba la URL antes de empezar una compilación para evitar generar un APK con una dirección local o incompleta.
3. Cargar la configuración de Expo mediante `app.config.js`, que pone la URL configurada a disposición de la aplicación.
4. Ejecutar el script `android:apk` de `package.json`. Este activa el modo de producción y llama a Gradle para compilar la variante Android `release`.
5. Gradle incorpora el código JavaScript de la app y genera `android\app\build\outputs\apk\release\app-release.apk`.
6. Verificar el paquete Android y la firma del APK con las herramientas de Android SDK.

### Generar desde Android Studio

1. Abrí `frontend-movil\android` en Android Studio (no la raíz del repositorio) y esperá
   a que finalice **Gradle Sync**.
2. En la ventana **Gradle**, abrí el proyecto `app`, después **Tasks > build**, y ejecutá
   `assembleRelease`.
3. La APK queda en
   `frontend-movil\android\app\build\outputs\apk\release\app-release.apk`.

También podés abrir la terminal integrada en `frontend-movil\android` y ejecutar
`.\gradlew.bat assembleRelease`. La opción **Build APK(s)** genera la variante debug; para
obtener el archivo release autónomo de esta guía, ejecutá `assembleRelease`.

Para repetir la compilación en PowerShell:

```powershell
Set-Location C:\Users\Armando\Desktop\backend-inventario\frontend-movil

# Si aún no están instaladas las dependencias:
npm.cmd install

# Ajustar JAVA_HOME si el JDK 21 está instalado en otra carpeta.
$env:JAVA_HOME = Get-ChildItem "$env:ProgramFiles\Eclipse Adoptium" -Directory -Filter 'jdk-21*' |
  Select-Object -First 1 -ExpandProperty FullName
if (-not $env:JAVA_HOME) { throw 'Instalá JDK 21 y configurá JAVA_HOME.' }

$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:Path = "$env:JAVA_HOME\bin;$env:Path"

npm.cmd run android:apk
```

En este entorno local, `gradle-daemon-jvm.properties` fija Java 25 para el daemon aunque
`JAVA_HOME` apunte a JDK 21 para iniciar Gradle. Consultá la versión efectiva con:

```powershell
Set-Location .\android
.\gradlew.bat -version
```

Al terminar, el archivo queda en:

```text
android\app\build\outputs\apk\release\app-release.apk
```

El archivo se puede copiar al teléfono e instalar. También se puede instalar por USB con Android Debug Bridge (`adb`), si está instalado y disponible en el `PATH`:

```powershell
adb install -r .\android\app\build\outputs\apk\release\app-release.apk
```

### Si Windows informa que la ruta del archivo es demasiado larga

La compilación nativa usa CMake y Ninja. En Windows, una ruta extensa del proyecto puede producir el error `Filename longer than 260 characters`. Una solución es crear una unión de directorio corta para compilar:

```powershell
$proyecto = 'C:\Users\Armando\Desktop\backend-inventario\frontend-movil'
$atajo = "$env:USERPROFILE\fm"

# El nombre fm no debe existir previamente.
cmd /c mklink /J "$atajo" "$proyecto"
Set-Location $atajo
npm.cmd run android:apk
```

Al finalizar, se puede quitar únicamente la unión creada con:

```powershell
Set-Location $env:USERPROFILE
cmd /c rmdir "$env:USERPROFILE\fm"
```

No ejecutar el último comando si `fm` ya existía y no es la unión temporal que se creó para esta compilación. El APK se genera dentro del proyecto original, en la misma ruta de salida indicada arriba.

### Si Gradle selecciona una versión de Java distinta

`JAVA_HOME` identifica la JVM que inicia Gradle, pero el daemon puede usar otra versión
definida en la configuración local del proyecto. Para revisar ambas, ejecutá desde
`frontend-movil\android`:

```powershell
.\gradlew.bat -version
```

En el entorno donde se verificó esta APK, el wrapper se inicia con JDK 21 y el daemon usa
Java 25, según `android\gradle\gradle-daemon-jvm.properties`. En Android Studio revisá
**Settings > Build, Execution, Deployment > Build Tools > Gradle** y evitá cambiar la
versión fijada por el proyecto si no hay un error que lo requiera. Esa configuración está
dentro de `android`, que se genera localmente y no está versionada; por eso puede diferir
entre equipos.

## Instalar y probar en un teléfono

1. Copiá `app-release.apk` al teléfono, abrilo desde el administrador de archivos y aceptá
   la instalación. Si Android lo solicita, habilitá **Instalar aplicaciones desconocidas**
   únicamente para la aplicación desde la que abriste el archivo.
2. Abrí **Stockroom**. La pantalla de acceso debe indicar la API configurada. Esta APK apunta
   al servicio publicado de Vercel y necesita conexión a Internet.
3. Iniciá sesión con una cuenta y datos de prueba. La APK opera contra la API desplegada y
las acciones realizadas modifican ese entorno.
4. Verificá primero la consulta del catálogo y del historial. Después, con datos de prueba,
   probá búsqueda, producto, entrada/salida de stock, cambio de contraseña y las acciones de
   usuarios si la cuenta tiene rol `ADMIN`.
5. Cerrá y volvé a abrir la app para comprobar que la sesión se conserva; cerrá sesión para
   comprobar el retorno a la pantalla de acceso.

La URL de esta APK corresponde al entorno publicado: crear, editar, mover o borrar datos
modifica ese inventario compartido. No pruebes operaciones destructivas sobre productos o
cuentas reales. La prueba en el dispositivo y el resultado de cada operación quedan a cargo
de la validación manual; la firma correcta por sí sola no los garantiza.

## Funciones de la aplicación

- Registro e inicio de sesión.
- Consulta del catálogo de productos y búsqueda por nombre o código de barras.
- Avisos y listado de productos con stock bajo.
- Creación, edición y eliminación de productos.
- Registro y consulta del historial de movimientos de inventario.
- Cambio de contraseña.
- Administración de usuarios para cuentas con rol administrador: creación, cambio de rol y eliminación.
- Almacenamiento local seguro de la sesión y del token mediante `expo-secure-store`.
- Manejo de errores de conexión y de sesión vencida.

Los permisos que muestra la interfaz dependen del rol. La API del backend valida los permisos de cada operación; ocultar una acción en la app no sustituye esa autorización del servidor.

## Funciones y rutas de API utilizadas

Las pantallas usan `apiRequest` (`src\api.js`) para llamar a la URL base más una ruta:

| Función | Método y ruta relativa | Uso |
|---|---|---|
| Registrar una cuenta | `POST /auth/registro` | Envía nombre, correo y contraseña. |
| Iniciar sesión | `POST /auth/login` | Inicia sesión y recibe los datos de sesión. |
| Consultar productos | `GET /productos` | Carga el catálogo. |
| Consultar stock bajo | `GET /productos/stock-bajo` | Obtiene productos para reponer. |
| Crear un producto | `POST /productos` | Guarda nombre, código de barras, precio y cantidades. |
| Editar un producto | `PUT /productos/:id` | Actualiza la información del producto. |
| Eliminar un producto | `DELETE /productos/:id` | Elimina el producto seleccionado. |
| Consultar movimientos | `GET /movimientos` | Carga el historial. |
| Registrar un movimiento | `POST /movimientos` | Registra una entrada o salida y su motivo. |
| Cambiar contraseña | `PATCH /auth/cambiar-password` | Actualiza la contraseña de la cuenta actual. |
| Consultar usuarios | `GET /usuarios` | Carga las cuentas para su administración. |
| Crear un usuario | `POST /usuarios` | Crea una cuenta con un rol. |
| Cambiar el rol de un usuario | `PUT /usuarios/:id` | Actualiza el rol de la cuenta. |
| Eliminar un usuario | `DELETE /usuarios/:id` | Elimina la cuenta seleccionada. |

Las rutas de la tabla son relativas: con la URL base configurada, por ejemplo, `GET /productos` se envía a `https://crud-control-stock-api.vercel.app/api/productos`.

En `src\api.js` también se encuentran estas funciones de sesión:

- `readSession()`: recupera el token y los datos del usuario desde `expo-secure-store`.
- `saveSession()`: guarda la sesión devuelta por la API.
- `clearSession()`: elimina la sesión guardada.
- `apiRequest()`: prepara la solicitud HTTP, incluye el token cuando corresponde y comunica los errores de API o conexión.

## Ejecutar la aplicación en desarrollo

Desde `frontend-movil`, configurar primero `.env.local` como se describe arriba. Luego:

```powershell
npm.cmd install
npx.cmd expo start --lan
```

Escanear el código QR con Expo Go. Si se modifica `.env.local` mientras Expo está activo, reiniciar limpiando la caché:

```powershell
npx.cmd expo start --lan --clear
```

Si se usa una API local en lugar de Vercel, configurar una dirección alcanzable desde el teléfono, como `http://192.168.1.50:3000/api`. El teléfono y la computadora deben estar en la misma red, y el firewall debe permitir el puerto del backend. No usar `localhost` desde un teléfono físico.

## Archivos principales

- `app.config.js`: adapta la configuración de Expo y comparte la dirección de API con la app.
- `app.json`: nombre, versión y paquete Android.
- `src\api.js`: solicitudes HTTP y almacenamiento de la sesión.
- `src\screens\`: pantallas de autenticación, inventario, productos, movimientos y cuenta.
- `scripts\validate-api-url.js`: validación de la URL antes de compilar.
- `android\`: proyecto nativo usado por Gradle para construir el APK.
- `.env.local`: configuración local de la API; no se debe incluir en Git.

## Publicación y firma

El APK generado utiliza la configuración de firma de depuración que está definida en `android\app\build.gradle`. Sirve para pruebas y para instalar la aplicación manualmente, pero no es una firma adecuada para publicar en Google Play o distribuir una versión de producción.

Para publicar la app, configurar una clave de firma release propia, guardarla de forma segura y seguir el proceso de firma de Android. No subir claves privadas, contraseñas ni archivos de firma al repositorio. Si se agregan o cambian plugins nativos de Expo, regenerar la carpeta Android antes de compilar, revisando los cambios:

```powershell
npx.cmd expo prebuild --platform android
```
