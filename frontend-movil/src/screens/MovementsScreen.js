import { useCallback, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { apiRequest } from '../api';
import { Field, Notice, PrimaryButton, ScreenTitle } from '../components';
import { colors, shadow } from '../theme';

function dateLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export default function MovementsScreen({ session, onSessionExpired }) {
  const puedeOperar = ['ADMIN', 'OPERADOR', 'USER'].includes(session.user.rol);
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [productId, setProductId] = useState('');
  const [type, setType] = useState('ENTRADA');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadMovements = useCallback(async () => {
    setLoading(true);
    try {
      const [productResponse, movementResponse] = await Promise.all([
        apiRequest('/productos', { auth: false }),
        apiRequest('/movimientos', { token: session.token })
      ]);
      if (!Array.isArray(productResponse.datos) || !Array.isArray(movementResponse.datos)) {
        throw new Error('La API devolvió el historial con un formato inesperado.');
      }
      setProducts(productResponse.datos);
      setMovements(movementResponse.datos);
      setError('');
    } catch (requestError) {
      setError(requestError.message);
      if (requestError.status === 401) onSessionExpired();
    } finally {
      setLoading(false);
    }
  }, [onSessionExpired, session.token]);

  useFocusEffect(useCallback(() => {
    loadMovements();
  }, [loadMovements]));

  const selectedProduct = products.find((product) => product._id === productId) || products[0];

  const submit = async () => {
    setError('');
    setNotice('');
    const amount = Number(quantity);
    if (!selectedProduct || !Number.isInteger(amount) || amount < 1) {
      setError('Elegí un producto e ingresá una cantidad entera mayor a cero.');
      return;
    }
    if (type === 'SALIDA' && amount > Number(selectedProduct.stock)) {
      setError(`No hay stock suficiente. Disponible: ${selectedProduct.stock} unidades.`);
      return;
    }

    setSaving(true);
    try {
      const result = await apiRequest('/movimientos', {
        method: 'POST',
        token: session.token,
        body: {
          productoId: selectedProduct._id,
          tipo: type,
          cantidad: amount,
          motivo: reason.trim()
        }
      });
      setQuantity('');
      setReason('');
      setNotice(result.mensaje || 'Movimiento registrado y stock actualizado.');
      await loadMovements();
    } catch (requestError) {
      setError(requestError.message);
      if (requestError.status === 401) onSessionExpired();
    } finally {
      setSaving(false);
    }
  };

  const header = (
    <View>
      <ScreenTitle
        eyebrow="CONTROL DE EXISTENCIAS"
        title="Movimientos"
        subtitle="Registrá entradas y salidas para mantener el stock al día."
      />
      {puedeOperar ? <View style={styles.formCard}>
        <Text style={styles.formTitle}>Nuevo movimiento</Text>
        <Text style={styles.label}>Producto</Text>
        <Pressable
          disabled={products.length === 0}
          onPress={() => setPickerOpen(true)}
          style={styles.productPicker}
        >
          <View style={styles.pickerCopy}>
            <Text style={styles.pickerName} numberOfLines={1}>
              {selectedProduct?.nombre || 'No hay productos disponibles'}
            </Text>
            {selectedProduct ? <Text style={styles.pickerStock}>Stock actual: {selectedProduct.stock}</Text> : null}
          </View>
          <Text style={styles.pickerArrow}>⌄</Text>
        </Pressable>

        <Text style={[styles.label, { marginTop: 14 }]}>Tipo de movimiento</Text>
        <View style={styles.typeRow}>
          <Pressable
            onPress={() => setType('ENTRADA')}
            style={[styles.typeButton, type === 'ENTRADA' && styles.entrySelected]}
          >
            <Text style={[styles.typeIcon, type === 'ENTRADA' && { color: colors.green }]}>＋</Text>
            <Text style={[styles.typeText, type === 'ENTRADA' && { color: colors.green }]}>Entrada</Text>
          </Pressable>
          <Pressable
            onPress={() => setType('SALIDA')}
            style={[styles.typeButton, type === 'SALIDA' && styles.exitSelected]}
          >
            <Text style={[styles.typeIcon, type === 'SALIDA' && { color: colors.red }]}>−</Text>
            <Text style={[styles.typeText, type === 'SALIDA' && { color: colors.red }]}>Salida</Text>
          </Pressable>
        </View>
        <Field label="Cantidad de unidades" value={quantity} onChangeText={setQuantity} placeholder="Ej. 4" keyboardType="number-pad" />
        <Field label="Motivo (opcional)" value={reason} onChangeText={setReason} placeholder="Ej. Reposición del proveedor" />
        {error ? <Notice message={error} /> : null}
        {notice ? <Notice message={notice} type="success" /> : null}
        <PrimaryButton
          label="Guardar movimiento"
          onPress={submit}
          loading={saving}
          disabled={products.length === 0}
        />
      </View> : null}

      <View style={styles.historyHeading}>
        <View style={styles.historyMark}><Text style={styles.historyMarkText}>◷</Text></View>
        <View>
          <Text style={styles.historyTitle}>Historial reciente</Text>
          <Text style={styles.historySubtitle}>Los últimos movimientos de tu inventario.</Text>
        </View>
      </View>
      {error && movements.length > 0 ? <Notice message={error} /> : null}
    </View>
  );

  const renderMovement = ({ item }) => {
    const isEntry = item.tipo === 'ENTRADA';
    const name = item.producto && typeof item.producto === 'object'
      ? item.producto.nombre
      : 'Producto';
    return (
      <View style={styles.movementCard}>
        <View style={[styles.movementIcon, isEntry ? styles.entryIcon : styles.exitIcon]}>
          <Text style={[styles.movementIconText, isEntry ? styles.entryText : styles.exitText]}>
            {isEntry ? '↓' : '↑'}
          </Text>
        </View>
        <View style={styles.movementInfo}>
          <Text style={styles.movementProduct} numberOfLines={1}>{name || 'Producto eliminado'}</Text>
          <Text style={styles.movementMeta}>{item.motivo || 'Movimiento de inventario'} · {dateLabel(item.createdAt)}</Text>
        </View>
        <View style={styles.quantityBlock}>
          <Text style={[styles.movementQuantity, isEntry ? styles.entryText : styles.exitText]}>
            {isEntry ? '+' : '−'}{item.cantidad}
          </Text>
          <Text style={styles.unitLabel}>unidades</Text>
        </View>
      </View>
    );
  };

  return (
    <>
      <FlatList
        style={styles.screen}
        contentContainerStyle={styles.content}
        data={movements}
        keyExtractor={(item) => item._id}
        renderItem={renderMovement}
        ListHeaderComponent={header}
        ListEmptyComponent={!loading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Todavía no se registraron movimientos.</Text>
          </View>
        ) : null}
        ListFooterComponent={loading ? <Text style={styles.loadingText}>Actualizando movimientos...</Text> : <View style={{ height: 24 }} />}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadMovements} colors={[colors.primary]} tintColor={colors.primary} />
        }
      />
      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>Elegí un producto</Text>
            <FlatList
              data={products}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setProductId(item._id);
                    setPickerOpen(false);
                  }}
                  style={styles.productOption}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickerName}>{item.nombre}</Text>
                    <Text style={styles.pickerStock}>Stock: {item.stock} · Mínimo: {item.stockMinimo}</Text>
                  </View>
                  {item._id === (selectedProduct?._id) ? <Text style={styles.selectedCheck}>✓</Text> : null}
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { padding: 18, paddingBottom: 28 },
  formCard: { ...shadow, backgroundColor: '#ffffff', borderColor: colors.line, borderRadius: 14, borderWidth: 1, gap: 13, marginBottom: 22, padding: 16 },
  formTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  label: { color: '#536174', fontSize: 12, fontWeight: '700' },
  productPicker: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: colors.line, borderRadius: 10, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 51, paddingHorizontal: 13 },
  pickerCopy: { flex: 1 },
  pickerName: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  pickerStock: { color: colors.muted, fontSize: 10, marginTop: 4 },
  pickerArrow: { color: colors.primary, fontSize: 20, paddingLeft: 10 },
  typeRow: { flexDirection: 'row', gap: 9 },
  typeButton: { alignItems: 'center', backgroundColor: '#f7f8fa', borderColor: colors.line, borderRadius: 10, borderWidth: 1, flex: 1, flexDirection: 'row', gap: 7, justifyContent: 'center', minHeight: 43 },
  entrySelected: { backgroundColor: colors.greenSoft, borderColor: '#bfe7d2' },
  exitSelected: { backgroundColor: colors.redSoft, borderColor: '#f0d3d7' },
  typeIcon: { color: colors.muted, fontSize: 17, fontWeight: '800' },
  typeText: { color: '#687588', fontSize: 12, fontWeight: '700' },
  historyHeading: { alignItems: 'center', flexDirection: 'row', gap: 10, marginBottom: 10 },
  historyMark: { alignItems: 'center', backgroundColor: '#eaf2ff', borderRadius: 9, height: 35, justifyContent: 'center', width: 35 },
  historyMarkText: { color: colors.blue, fontSize: 18 },
  historyTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  historySubtitle: { color: colors.muted, fontSize: 10, marginTop: 3 },
  movementCard: { ...shadow, alignItems: 'center', backgroundColor: '#ffffff', borderColor: colors.line, borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 10, marginBottom: 8, padding: 12 },
  movementIcon: { alignItems: 'center', borderRadius: 9, height: 35, justifyContent: 'center', width: 35 },
  entryIcon: { backgroundColor: colors.greenSoft },
  exitIcon: { backgroundColor: colors.redSoft },
  movementIconText: { fontSize: 19, fontWeight: '800' },
  entryText: { color: colors.green },
  exitText: { color: colors.red },
  movementInfo: { flex: 1 },
  movementProduct: { color: '#354155', fontSize: 11, fontWeight: '800' },
  movementMeta: { color: colors.muted, fontSize: 9, marginTop: 4 },
  quantityBlock: { alignItems: 'flex-end' },
  movementQuantity: { fontSize: 13, fontWeight: '800' },
  unitLabel: { color: colors.muted, fontSize: 8, marginTop: 2 },
  emptyCard: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: colors.line, borderRadius: 12, borderWidth: 1, padding: 20 },
  emptyText: { color: colors.muted, fontSize: 11 },
  loadingText: { color: colors.muted, fontSize: 11, padding: 14, textAlign: 'center' },
  modalBackdrop: { alignItems: 'center', backgroundColor: 'rgba(18, 27, 42, 0.5)', flex: 1, justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#ffffff', borderRadius: 16, maxHeight: '70%', padding: 16, width: '100%' },
  modalTitle: { color: colors.ink, fontSize: 16, fontWeight: '800', marginBottom: 9 },
  productOption: { alignItems: 'center', borderTopColor: colors.line, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 13 },
  selectedCheck: { color: colors.green, fontSize: 18, fontWeight: '800' }
});
