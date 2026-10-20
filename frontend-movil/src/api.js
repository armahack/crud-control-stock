import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const expoHostUri = Constants.expoConfig?.hostUri
  || Constants.manifest2?.extra?.expoGo?.debuggerHost
  || Constants.manifest?.debuggerHost;
const expoHost = expoHostUri?.split(':')[0];

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL
  || (expoHost ? `http://${expoHost}:3000/api` : null)
  || Constants.expoConfig?.extra?.apiUrl
  || 'http://localhost:3000/api'
).replace(/\/+$/, '');

const TOKEN_KEY = 'stockroom.jwt';
const USER_KEY = 'stockroom.user';

export async function readSession() {
  const [token, userJson] = await Promise.all([
    SecureStore.getItemAsync(TOKEN_KEY),
    SecureStore.getItemAsync(USER_KEY)
  ]);

  if (!token || !userJson) return null;

  try {
    return { token, user: JSON.parse(userJson) };
  } catch (error) {
    await clearSession();
    return null;
  }
}

export async function saveSession({ token, datos }) {
  if (!token || !datos) {
    throw new Error('La API no devolvió los datos de sesión esperados.');
  }

  await Promise.all([
    SecureStore.setItemAsync(TOKEN_KEY, token),
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(datos))
  ]);
  return { token, user: datos };
}

export async function clearSession() {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_KEY)
  ]);
}

export async function apiRequest(path, { method = 'GET', body, token, auth = true } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch (error) {
    throw new Error(
      `No se pudo conectar con la API (${API_URL}). ` +
      'Verificá la IP local, el Wi-Fi y que el backend esté iniciado.'
    );
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = result.mensaje || result.error || `Error de la API (${response.status}).`;
    const apiError = new Error(message);
    apiError.status = response.status;
    throw apiError;
  }

  return result;
}
