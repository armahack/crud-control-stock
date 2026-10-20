import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { API_URL, clearSession, readSession } from './src/api';
import { Notice } from './src/components';
import AuthScreen from './src/screens/AuthScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import MovementsScreen from './src/screens/MovementsScreen';
import ProductFormScreen from './src/screens/ProductFormScreen';
import AccountScreen from './src/screens/AccountScreen';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function LoadingScreen({ message }) {
  return (
    <View style={styles.loadingScreen}>
      <View style={styles.brandMark}>
        <View style={styles.brandCell} />
        <View style={[styles.brandCell, { opacity: 0.72 }]} />
        <View style={[styles.brandCell, { opacity: 0.52 }]} />
        <View style={[styles.brandCell, { opacity: 0.84 }]} />
      </View>
      <Text style={styles.loadingTitle}>stockroom<Text style={styles.brandDot}>.</Text></Text>
      <ActivityIndicator color={colors.primary} size="small" style={{ marginTop: 22 }} />
      {message ? <Text style={styles.loadingMessage}>{message}</Text> : null}
    </View>
  );
}

function MainTabs({ session, onLogout, onSessionExpired }) {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#919aaa',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginBottom: 3 },
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: colors.line,
          height: 61,
          paddingTop: 6
        }
      }}
    >
      <Tabs.Screen name="Inventario">
        {(props) => (
          <InventoryScreen
            {...props}
            session={session}
            onLogout={onLogout}
            onSessionExpired={onSessionExpired}
          />
        )}
      </Tabs.Screen>
      <Tabs.Screen name="Movimientos">
        {(props) => (
          <MovementsScreen {...props} session={session} onSessionExpired={onSessionExpired} />
        )}
      </Tabs.Screen>
      <Tabs.Screen name="Cuenta">
        {() => <AccountScreen session={session} onSessionExpired={onSessionExpired} />}
      </Tabs.Screen>
    </Tabs.Navigator>
  );
}

function MainNavigation({ session, onLogout, onSessionExpired }) {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#ffffff' },
          headerShadowVisible: false,
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
          contentStyle: { backgroundColor: colors.background }
        }}
      >
        <Stack.Screen name="Inicio" options={{ headerShown: false }}>
          {(props) => (
            <MainTabs
              {...props}
              session={session}
              onLogout={onLogout}
              onSessionExpired={onSessionExpired}
            />
          )}
        </Stack.Screen>
        <Stack.Screen
          name="ProductoForm"
          options={({ route }) => ({
            title: route.params?.product ? 'Editar producto' : 'Nuevo producto'
          })}
        >
          {(props) => (
            <ProductFormScreen
              {...props}
              session={session}
              onSessionExpired={onSessionExpired}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [startupError, setStartupError] = useState('');

  useEffect(() => {
    let mounted = true;
    readSession()
      .then((storedSession) => {
        if (mounted) setSession(storedSession);
      })
      .catch((error) => {
        if (mounted) setStartupError(`No se pudo recuperar la sesión: ${error.message}`);
      })
      .finally(() => {
        if (mounted) setCheckingSession(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await clearSession();
      setSession(null);
    } catch (error) {
      setStartupError(`No se pudo cerrar la sesión de forma segura: ${error.message}`);
    }
  }, []);

  const sessionExpired = useCallback(async () => {
    await logout();
    setStartupError('La sesión venció. Iniciá sesión nuevamente.');
  }, [logout]);

  return (
    <SafeAreaProvider>
      <StatusBar style={session ? 'dark' : 'light'} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {checkingSession ? (
          <LoadingScreen />
        ) : session ? (
          <>
            {startupError ? <View style={styles.sessionNotice}><Notice message={startupError} /></View> : null}
            <MainNavigation
              session={session}
              onLogout={logout}
              onSessionExpired={sessionExpired}
            />
          </>
        ) : (
          <>
            {startupError ? <View style={styles.sessionNotice}><Notice message={startupError} /></View> : null}
            <AuthScreen
              onAuthenticated={(authenticatedSession) => {
                setStartupError('');
                setSession(authenticatedSession);
              }}
            />
            <Text style={styles.apiHint}>API configurada: {API_URL}</Text>
          </>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  loadingScreen: { alignItems: 'center', backgroundColor: '#151e2d', flex: 1, justifyContent: 'center' },
  brandMark: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, height: 29, width: 29, transform: [{ rotate: '-8deg' }] },
  brandCell: { backgroundColor: '#8873fb', borderRadius: 3, height: 13, width: 13 },
  loadingTitle: { color: '#ffffff', fontSize: 23, fontWeight: '800', letterSpacing: -1, marginTop: 12 },
  brandDot: { color: '#9a88ff' },
  loadingMessage: { color: '#a5afbf', fontSize: 11, marginTop: 10 },
  sessionNotice: { backgroundColor: colors.background, paddingHorizontal: 14, paddingTop: 12 },
  apiHint: { backgroundColor: '#151e2d', color: '#8692a3', fontSize: 9, paddingBottom: 10, textAlign: 'center' }
});
