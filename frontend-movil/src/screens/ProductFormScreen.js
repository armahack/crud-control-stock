import { useState } from 'react';
import {
  Alert,
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

export default function ProductFormScreen({ route, navigation, session, onSessionExpired }) {
  const product = route.params?.product;
  const [nombre, setNombre] = useState(product?.nombre || '');
  const [codigoBarras, setCodigoBarras] = useState(product?.codigoBarras || '');
  const [precio, setPrecio] = useState(product ? String(product.precio) : '');
  const [stock, setStock] = useState(product ? String(product.stock) : '0');
  const [stockMinimo, setStockMinimo] = useState(product ? String(product.stockMinimo) : '5');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setError('');
    const amount = Number(precio);
    const stockAmount = Number(stock);
    const minimum = Number(stockMinimo);

    if (!nombre.trim() || !Number.isFinite(amount) || amount < 0
      || !Number.isInteger(stockAmount) || stockAmount < 0
      || !Number.isInteger(minimum) || minimum < 0) {
      setError('Completá el nombre, un precio válido y cantidades enteras no negativas.');
      return;
    }

    setLoading(true);
    try {
      const result = await apiRequest(
        product ? `/productos/${encodeURIComponent(product._id)}` : '/productos',
        {
          method: product ? 'PUT' : 'POST',
          token: session.token,
          body: {
            nombre: nombre.trim(),
            codigoBarras: codigoBarras.trim(),
            precio: amount,
            stock: stockAmount,
            stockMinimo: minimum
          }
        }
      );
      navigation.goBack();
      Alert.alert('Inventario actualizado', result.mensaje || 'El producto se guardó correctamente.');
    } catch (requestError) {
      setError(requestError.message);
      if (requestError.status === 401) onSessionExpired();
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenTitle
          eyebrow={product ? 'ACTUALIZAR CATÁLOGO' : 'NUEVO EN EL CATÁLOGO'}
          title={product ? 'Editar producto' : 'Agregar producto'}
          subtitle="Los cambios se guardan en la base de datos de inventario."
        />
        <View style={styles.card}>
          {error ? <Notice message={error} /> : null}
          <Field label="Nombre del producto" value={nombre} onChangeText={setNombre} placeholder="Ej. Café molido 500 g" />
          <Field label="Código de barras (opcional)" value={codigoBarras} onChangeText={setCodigoBarras} placeholder="7791234567890" autoCapitalize="none" />
          <Field label="Precio" value={precio} onChangeText={setPrecio} placeholder="0,00" keyboardType="decimal-pad" />
          <View style={styles.twoFields}>
            <View style={styles.halfField}>
              <Field label="Stock actual" value={stock} onChangeText={setStock} placeholder="0" keyboardType="number-pad" />
            </View>
            <View style={styles.halfField}>
              <Field label="Stock mínimo" value={stockMinimo} onChangeText={setStockMinimo} placeholder="5" keyboardType="number-pad" />
            </View>
          </View>
          <PrimaryButton
            label={product ? 'Guardar cambios' : 'Crear producto'}
            onPress={save}
            loading={loading}
          />
          <PrimaryButton
            label="Cancelar"
            onPress={() => navigation.goBack()}
            secondary
            disabled={loading}
          />
          <Text style={styles.helpText}>La cantidad inicial también queda guardada en MongoDB.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { padding: 19, paddingBottom: 35 },
  card: { backgroundColor: '#ffffff', borderColor: colors.line, borderRadius: 14, borderWidth: 1, gap: 15, padding: 16 },
  twoFields: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  helpText: { color: colors.muted, fontSize: 10, lineHeight: 15, textAlign: 'center' }
});
