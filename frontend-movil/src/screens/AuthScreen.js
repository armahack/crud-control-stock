import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { apiRequest, saveSession } from '../api';
import { Field, Notice, PrimaryButton } from '../components';
import { colors } from '../theme';

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const registering = mode === 'register';

  const submit = async () => {
    setError('');
    const normalizedEmail = email.trim().toLowerCase();
    if (registering && !nombre.trim()) {
      setError('Ingresá tu nombre para crear la cuenta.');
      return;
    }
    if (!normalizedEmail || !password) {
      setError('Completá el correo y la contraseña.');
      return;
    }
    if (registering && password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const result = await apiRequest(registering ? '/auth/registro' : '/auth/login', {
        method: 'POST',
        auth: false,
        body: {
          ...(registering ? { nombre: nombre.trim() } : {}),
          email: normalizedEmail,
          password
        }
      });
      const session = await saveSession(result);
      onAuthenticated(session);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <View style={styles.brandCell} />
            <View style={[styles.brandCell, { opacity: 0.72 }]} />
            <View style={[styles.brandCell, { opacity: 0.52 }]} />
            <View style={[styles.brandCell, { opacity: 0.84 }]} />
          </View>
          <Text style={styles.brand}>stockroom<Text style={styles.brandDot}>.</Text></Text>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>INVENTARIO A TU ALCANCE</Text>
          <Text style={styles.title}>
            {registering ? 'Empezá a ordenar' : 'Todo tu stock,'}
            {'\n'}
            <Text style={styles.titleAccent}>{registering ? 'tu negocio.' : 'en un solo lugar.'}</Text>
          </Text>
          <Text style={styles.subtitle}>
            {registering
              ? 'Creá tu cuenta y empezá a gestionar tu inventario.'
              : 'Ingresá para consultar productos y movimientos de tu negocio.'}
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.modeSwitch}>
            <Pressable
              onPress={() => { setMode('login'); setError(''); }}
              style={[styles.modeButton, !registering && styles.modeButtonSelected]}
            >
              <Text style={[styles.modeText, !registering && styles.modeTextSelected]}>Ingresar</Text>
            </Pressable>
            <Pressable
              onPress={() => { setMode('register'); setError(''); }}
              style={[styles.modeButton, registering && styles.modeButtonSelected]}
            >
              <Text style={[styles.modeText, registering && styles.modeTextSelected]}>Crear cuenta</Text>
            </Pressable>
          </View>

          <Notice message={error} />
          {registering ? (
            <Field label="Nombre" value={nombre} onChangeText={setNombre} placeholder="Tu nombre" />
          ) : null}
          <Field
            label="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            placeholder="nombre@negocio.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="Mínimo 6 caracteres"
            autoCapitalize="none"
            secureTextEntry
          />
          <PrimaryButton
            label={registering ? 'Crear cuenta' : 'Ingresar al inventario'}
            onPress={submit}
            loading={loading}
          />
        </View>

        <View style={styles.secureNote}>
          <View style={styles.onlineDot} />
          <Text style={styles.secureText}>Tu información se guarda de forma segura</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#151e2d', flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingVertical: 34 },
  brandRow: { alignItems: 'center', flexDirection: 'row', gap: 10, marginBottom: 37 },
  brandMark: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, height: 27, width: 27, transform: [{ rotate: '-8deg' }] },
  brandCell: { backgroundColor: '#8873fb', borderRadius: 3, height: 12, width: 12 },
  brand: { color: '#ffffff', fontSize: 22, fontWeight: '800', letterSpacing: -1 },
  brandDot: { color: '#9a88ff' },
  hero: { marginBottom: 23 },
  eyebrow: { color: '#a394ff', fontSize: 10, fontWeight: '800', letterSpacing: 1.8, marginBottom: 11 },
  title: { color: '#ffffff', fontSize: 32, fontWeight: '800', letterSpacing: -1.2, lineHeight: 39 },
  titleAccent: { color: '#a394ff' },
  subtitle: { color: '#a5afbf', fontSize: 13, lineHeight: 20, marginTop: 11, maxWidth: 310 },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    gap: 15,
    padding: 20
  },
  modeSwitch: { backgroundColor: '#f2f3f8', borderRadius: 10, flexDirection: 'row', padding: 4 },
  modeButton: { alignItems: 'center', borderRadius: 8, flex: 1, justifyContent: 'center', minHeight: 37 },
  modeButtonSelected: { backgroundColor: '#ffffff', elevation: 2 },
  modeText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  modeTextSelected: { color: colors.primary, fontWeight: '800' },
  secureNote: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 23 },
  onlineDot: { backgroundColor: '#43c08f', borderRadius: 5, height: 8, width: 8 },
  secureText: { color: '#8692a3', fontSize: 10 }
});
