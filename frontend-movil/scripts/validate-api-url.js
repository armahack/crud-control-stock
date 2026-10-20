const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
let apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl && fs.existsSync(envPath)) {
  const line = fs.readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith('EXPO_PUBLIC_API_URL='));
  apiUrl = line?.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
}

if (!apiUrl) {
  console.error('Falta EXPO_PUBLIC_API_URL. Configurá frontend-movil/.env.local antes de crear el APK.');
  process.exit(1);
}

let parsedUrl;
try {
  parsedUrl = new URL(apiUrl);
} catch {
  console.error('EXPO_PUBLIC_API_URL debe ser una URL válida terminada en /api.');
  process.exit(1);
}

if (!['http:', 'https:'].includes(parsedUrl.protocol) || !parsedUrl.pathname.replace(/\/+$/, '').endsWith('/api')) {
  console.error('EXPO_PUBLIC_API_URL debe usar HTTP/HTTPS y terminar en /api.');
  process.exit(1);
}

if (['localhost', '127.0.0.1', '::1'].includes(parsedUrl.hostname)) {
  console.error('La URL no puede apuntar a localhost: Android necesita una IP de red o un servidor accesible.');
  process.exit(1);
}

console.log(`URL de API para Android: ${parsedUrl.origin}${parsedUrl.pathname}`);
