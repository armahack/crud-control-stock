import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { apiRequest } from '../api';
import { Field, Notice, PrimaryButton, ScreenTitle } from '../components';
import { colors } from '../theme';

const roles = ['VISITANTE', 'OPERADOR', 'ADMIN'];

export default function AccountScreen({ session, onSessionExpired }) {
  const isAdmin = session.user.rol === 'ADMIN';
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNuevo, setPasswordNuevo] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('OPERADOR');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const result = await apiRequest('/usuarios', { token: session.token });
      if (!Array.isArray(result.datos)) throw new Error('La API devolvió una lista de usuarios inválida.');
      setUsuarios(result.datos);
      setError('');
    } catch (requestError) {
      setError(requestError.message);
      if (requestError.status === 401) onSessionExpired();
    } finally {
      setLoading(false);
    }
  }, [isAdmin, onSessionExpired, session.token]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const changePassword = async () => {
    setError('');
    setNotice('');
    if (passwordNuevo.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setSaving(true);
    try {
      const result = await apiRequest('/auth/cambiar-password', {
        method: 'PATCH',
        token: session.token,
        body: { passwordActual, passwordNuevo }
      });
      setPasswordActual('');
      setPasswordNuevo('');
      setNotice(result.mensaje);
    } catch (requestError) {
      setError(requestError.message);
      if (requestError.status === 401) onSessionExpired();
    } finally {
      setSaving(false);
    }
  };

  const createUser = async () => {
    setError('');
    setNotice('');
    if (!nombre.trim() || !email.trim() || password.length < 6) {
      setError('Completá nombre, email y una contraseña de al menos 6 caracteres.');
      return;
    }
    setSaving(true);
    try {
      const result = await apiRequest('/usuarios', {
        method: 'POST',
        token: session.token,
        body: { nombre: nombre.trim(), email: email.trim().toLowerCase(), password, rol }
      });
      setNombre('');
      setEmail('');
      setPassword('');
      setNotice(`Se creó la cuenta de ${result.datos.nombre}.`);
      await loadUsers();
    } catch (requestError) {
      setError(requestError.message);
      if (requestError.status === 401) onSessionExpired();
    } finally {
      setSaving(false);
    }
  };

  const updateRole = async (user, nextRole) => {
    setError('');
    setNotice('');
    try {
      await apiRequest(`/usuarios/${encodeURIComponent(user._id)}`, {
        method: 'PUT',
        token: session.token,
        body: { rol: nextRole }
      });
      setNotice(`Rol actualizado para ${user.nombre}.`);
      await loadUsers();
    } catch (requestError) {
      setError(requestError.message);
      if (requestError.status === 401) onSessionExpired();
      await loadUsers();
    }
  };

  const deleteUser = (user) => {
    Alert.alert('Eliminar cuenta', `¿Eliminar a ${user.nombre}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          setError('');
          try {
            const result = await apiRequest(`/usuarios/${encodeURIComponent(user._id)}`, {
              method: 'DELETE',
              token: session.token
            });
            setNotice(result.mensaje);
            await loadUsers();
          } catch (requestError) {
            setError(requestError.message);
            if (requestError.status === 401) onSessionExpired();
          }
        }
      }
    ]);
  };

  const renderUser = ({ item }) => {
    const roleIndex = roles.indexOf(item.rol);
    const nextRole = roles[(roleIndex + 1) % roles.length];
    const isCurrentUser = item._id === session.user._id;
    return (
      <View style={styles.userRow}>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.nombre}{isCurrentUser ? ' (vos)' : ''}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <Text style={styles.userRole}>{item.rol}</Text>
        </View>
        {!isCurrentUser ? (
          <View style={styles.userActions}>
            <PrimaryButton label="Cambiar rol" secondary onPress={() => updateRole(item, nextRole)} />
            <PrimaryButton label="Eliminar" secondary onPress={() => deleteUser(item)} />
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenTitle
          eyebrow={`CUENTA · ${session.user.rol}`}
          title="Mi cuenta"
          subtitle={`Sesión iniciada como ${session.user.nombre} (${session.user.email}).`}
        />
        {error ? <Notice message={error} /> : null}
        {notice ? <Notice message={notice} type="success" /> : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cambiar contraseña</Text>
          <Field label="Contraseña actual" value={passwordActual} onChangeText={setPasswordActual} secureTextEntry autoCapitalize="none" />
          <Field label="Nueva contraseña" value={passwordNuevo} onChangeText={setPasswordNuevo} secureTextEntry autoCapitalize="none" />
          <PrimaryButton label="Actualizar contraseña" onPress={changePassword} loading={saving} />
        </View>

        {isAdmin ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Crear usuario</Text>
              <Field label="Nombre" value={nombre} onChangeText={setNombre} placeholder="Nombre completo" />
              <Field label="Email" value={email} onChangeText={setEmail} placeholder="nombre@negocio.com" keyboardType="email-address" autoCapitalize="none" />
              <Field label="Contraseña inicial" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
              <Text style={styles.label}>Rol inicial</Text>
              <View style={styles.roleRow}>
                {roles.map((itemRole) => (
                  <Text
                    key={itemRole}
                    onPress={() => setRol(itemRole)}
                    style={[styles.roleOption, rol === itemRole && styles.roleOptionSelected]}
                  >
                    {itemRole}
                  </Text>
                ))}
              </View>
              <PrimaryButton label="Crear cuenta" onPress={createUser} loading={saving} />
            </View>
            <View style={styles.card}>
              <View style={styles.listHeading}>
                <Text style={styles.cardTitle}>Administrar usuarios</Text>
                <Text onPress={loadUsers} style={styles.refresh}>Actualizar</Text>
              </View>
              {loading ? <Text style={styles.emptyText}>Cargando usuarios...</Text> : null}
              <FlatList
                data={usuarios}
                keyExtractor={(item) => item._id}
                renderItem={renderUser}
                scrollEnabled={false}
                ListEmptyComponent={!loading ? <Text style={styles.emptyText}>No hay usuarios para mostrar.</Text> : null}
              />
            </View>
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 14, padding: 18, paddingBottom: 32 },
  card: { backgroundColor: '#ffffff', borderColor: colors.line, borderRadius: 14, borderWidth: 1, gap: 13, padding: 16 },
  cardTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  label: { color: '#536174', fontSize: 12, fontWeight: '700' },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  roleOption: { backgroundColor: '#f2f3f8', borderRadius: 8, color: colors.muted, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 8 },
  roleOptionSelected: { backgroundColor: colors.primary, color: '#ffffff' },
  listHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  refresh: { color: colors.primary, fontSize: 12, fontWeight: '700', padding: 8 },
  userRow: { borderTopColor: colors.line, borderTopWidth: 1, gap: 10, paddingVertical: 12 },
  userDetails: { gap: 3 },
  userName: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  userEmail: { color: colors.muted, fontSize: 11 },
  userRole: { color: colors.primary, fontSize: 10, fontWeight: '800', marginTop: 2 },
  userActions: { flexDirection: 'row', gap: 8 },
  emptyText: { color: colors.muted, fontSize: 12, paddingVertical: 12 }
});
