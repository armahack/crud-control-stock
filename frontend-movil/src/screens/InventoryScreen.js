import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { apiRequest } from '../api';
import { Notice, ScreenTitle } from '../components';
import { colors, shadow } from '../theme';

function money(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2
  }).format(Number(value) || 0);
}

export default function InventoryScreen({ navigation, session, onLogout, onSessionExpired }) {
  const esAdmin = session.user.rol === 'ADMIN';
  const puedeOperar = esAdmin || ['OPERADOR', 'USER'].includes(session.user.rol);
  const [products, setProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const [productResponse, lowResponse] = await Promise.all([
        apiRequest('/productos', { auth: false }),
        apiRequest('/productos/stock-bajo', { token: session.token })
      ]);
      if (!Array.isArray(productResponse.datos) || !Array.isArray(lowResponse.datos)) {
        throw new Error('La API devolvió una lista de productos con un formato inesperado.');
      }
      setProducts(productResponse.datos);
      setLowStock(lowResponse.datos);
      setError('');
    } catch (requestError) {
      setError(requestError.message);
      if (requestError.status === 401) onSessionExpired();
    } finally {
      setLoading(false);
    }
  }, [onSessionExpired, session.token]);

  useFocusEffect(useCallback(() => {
    loadProducts();
  }, [loadProducts]));

  const removeProduct = (product) => {
    Alert.alert(
      'Eliminar producto',
      `¿Querés eliminar "${product.nombre}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiRequest(`/productos/${encodeURIComponent(product._id)}`, {
                method: 'DELETE',
                token: session.token
              });
              await loadProducts();
            } catch (requestError) {
              setError(requestError.message);
              if (requestError.status === 401) onSessionExpired();
            }
          }
        }
      ]
    );
  };

  const openEditor = (product) => {
    navigation.navigate('ProductoForm', { product });
  };

  const normalizedSearch = search.trim().toLowerCase();
  const filteredProducts = normalizedSearch
    ? products.filter((product) => (
      product.nombre?.toLowerCase().includes(normalizedSearch)
      || product.codigoBarras?.toLowerCase().includes(normalizedSearch)
    ))
    : products;

  const listHeader = (
    <View>
      <View style={styles.topLine}>
        <View style={styles.logoRow}>
          <View style={styles.logoMark}>
            <View style={styles.logoCell} />
            <View style={[styles.logoCell, { opacity: 0.72 }]} />
            <View style={[styles.logoCell, { opacity: 0.52 }]} />
            <View style={[styles.logoCell, { opacity: 0.84 }]} />
          </View>
          <Text style={styles.logoText}>stockroom<Text style={styles.logoDot}>.</Text></Text>
        </View>
        <Pressable onPress={onLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Salir</Text>
        </Pressable>
      </View>
      <ScreenTitle
        eyebrow="PANEL DE CONTROL"
        title="Inventario"
        subtitle={`Hola, ${session.user.nombre || 'Usuario'}. Acá tenés el estado de tus productos.`}
        action={puedeOperar ? '+ Agregar' : undefined}
        onAction={puedeOperar ? () => navigation.navigate('ProductoForm', { product: null }) : undefined}
      />
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>PRODUCTOS</Text>
          <Text style={styles.summaryValue}>{products.length}</Text>
          <Text style={styles.summaryHint}>en el catálogo</Text>
        </View>
        <View style={[styles.summaryCard, styles.alertCard]}>
          <Text style={styles.summaryLabel}>STOCK BAJO</Text>
          <Text style={[styles.summaryValue, { color: colors.amber }]}>{lowStock.length}</Text>
          <Text style={styles.summaryHint}>para reponer</Text>
        </View>
      </View>
      {lowStock.length > 0 ? (
        <View style={styles.lowPanel}>
          <Text style={styles.lowTitle}>Atención: productos por reponer</Text>
          {lowStock.slice(0, 4).map((product) => (
            <View style={styles.lowRow} key={product._id}>
              <Text style={styles.lowName} numberOfLines={1}>{product.nombre}</Text>
              <Text style={styles.lowQuantity}>{product.stock} / {product.stockMinimo}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <View style={styles.catalogTitleRow}>
        <View>
          <Text style={styles.catalogTitle}>Productos</Text>
          <Text style={styles.catalogSubtitle}>
            {normalizedSearch
              ? `${filteredProducts.length} resultado${filteredProducts.length === 1 ? '' : 's'}`
              : 'Tocá editar para actualizar la información.'}
          </Text>
        </View>
        <Pressable onPress={() => loadProducts()} style={styles.refreshButton}>
          <Text style={styles.refreshText}>↻</Text>
        </Pressable>
      </View>
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          accessibilityLabel="Buscar productos por nombre o código de barras"
          autoCapitalize="none"
          onChangeText={setSearch}
          placeholder="Buscar por nombre o código"
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          style={styles.searchInput}
          value={search}
        />
        {search ? (
          <Pressable
            accessibilityLabel="Limpiar búsqueda"
            accessibilityRole="button"
            onPress={() => setSearch('')}
            style={styles.clearSearchButton}
          >
            <Text style={styles.clearSearchText}>×</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Notice message={error} /> : null}
    </View>
  );

  const renderProduct = ({ item }) => {
    const isLow = Number(item.stock) <= Number(item.stockMinimo);
    return (
      <View style={styles.productCard}>
        <View style={styles.productMain}>
          <View style={styles.productGlyph}><Text style={styles.productGlyphText}>▤</Text></View>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>{item.nombre}</Text>
            <Text style={styles.productCode} numberOfLines={1}>{item.codigoBarras || 'Sin código de barras'}</Text>
          </View>
          <View style={styles.priceBlock}>
            <Text style={styles.productPrice}>{money(item.precio)}</Text>
            <Text style={[styles.stockText, isLow && styles.lowStockText]}>
              {item.stock} un. · mín. {item.stockMinimo}
            </Text>
          </View>
        </View>
        <View style={styles.productFooter}>
          <View style={[styles.badge, isLow ? styles.badgeLow : styles.badgeAvailable]}>
            <View style={[styles.badgeDot, isLow ? styles.badgeDotLow : styles.badgeDotAvailable]} />
            <Text style={[styles.badgeText, isLow ? styles.badgeTextLow : styles.badgeTextAvailable]}>
              {isLow ? 'Stock bajo' : 'Disponible'}
            </Text>
          </View>
          {puedeOperar ? <View style={styles.rowActions}>
            <Pressable accessibilityRole="button" onPress={() => openEditor(item)} style={styles.editButton}>
              <Text style={styles.editButtonText}>Editar</Text>
            </Pressable>
            {esAdmin ? <Pressable accessibilityRole="button" onPress={() => removeProduct(item)} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>Eliminar</Text>
            </Pressable> : null}
          </View> : null}
        </View>
      </View>
    );
  };

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.listContent}
      data={filteredProducts}
      keyExtractor={(item) => item._id}
      renderItem={renderProduct}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={!loading && products.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>▤</Text>
          <Text style={styles.emptyTitle}>Todavía no hay productos</Text>
          <Text style={styles.emptyText}>Agregá el primero para empezar a llevar tu inventario.</Text>
        </View>
      ) : !loading && filteredProducts.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No encontramos productos</Text>
          <Text style={styles.emptyText}>Probá con otro nombre o código de barras.</Text>
        </View>
      ) : null}
      ListFooterComponent={loading ? <Text style={styles.loadingText}>Actualizando inventario...</Text> : <View style={{ height: 22 }} />}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={() => loadProducts()}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  listContent: { padding: 18, paddingBottom: 28 },
  topLine: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  logoRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  logoMark: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, height: 20, width: 20, transform: [{ rotate: '-8deg' }] },
  logoCell: { backgroundColor: '#8873fb', borderRadius: 2, height: 9, width: 9 },
  logoText: { color: colors.ink, fontSize: 17, fontWeight: '800', letterSpacing: -0.7 },
  logoDot: { color: colors.primary },
  logoutButton: { backgroundColor: '#ffffff', borderColor: colors.line, borderRadius: 9, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  logoutText: { color: '#647187', fontSize: 11, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', gap: 11, marginBottom: 15 },
  summaryCard: { ...shadow, backgroundColor: '#ffffff', borderColor: colors.line, borderRadius: 13, borderWidth: 1, flex: 1, padding: 14 },
  alertCard: { backgroundColor: '#fffdf8' },
  summaryLabel: { color: '#98a2b1', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  summaryValue: { color: colors.ink, fontSize: 25, fontWeight: '800', marginTop: 8 },
  summaryHint: { color: colors.muted, fontSize: 10, marginTop: 2 },
  lowPanel: { backgroundColor: '#fffaf0', borderColor: '#f4e6c9', borderRadius: 12, borderWidth: 1, marginBottom: 17, padding: 13 },
  lowTitle: { color: colors.amber, fontSize: 11, fontWeight: '800', marginBottom: 8 },
  lowRow: { alignItems: 'center', borderTopColor: '#f2e9d8', borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  lowName: { color: '#5b6472', flex: 1, fontSize: 11, marginRight: 12 },
  lowQuantity: { color: colors.amber, fontSize: 10, fontWeight: '800' },
  catalogTitleRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 11 },
  catalogTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  catalogSubtitle: { color: colors.muted, fontSize: 10, marginTop: 3 },
  searchBox: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: colors.line, borderRadius: 10, borderWidth: 1, flexDirection: 'row', marginBottom: 12, minHeight: 45, paddingHorizontal: 12 },
  searchIcon: { color: colors.muted, fontSize: 21, marginRight: 8 },
  searchInput: { color: colors.ink, flex: 1, fontSize: 12, minHeight: 43, paddingVertical: 0 },
  clearSearchButton: { alignItems: 'center', height: 30, justifyContent: 'center', width: 30 },
  clearSearchText: { color: colors.muted, fontSize: 21, lineHeight: 24 },
  refreshButton: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 9, height: 37, justifyContent: 'center', width: 37 },
  refreshText: { color: colors.primary, fontSize: 21, fontWeight: '700' },
  productCard: { ...shadow, backgroundColor: '#ffffff', borderColor: colors.line, borderRadius: 13, borderWidth: 1, marginBottom: 10, paddingHorizontal: 13, paddingTop: 14 },
  productMain: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  productGlyph: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 10, height: 38, justifyContent: 'center', width: 38 },
  productGlyphText: { color: colors.primary, fontSize: 18 },
  productInfo: { flex: 1 },
  productName: { color: '#354155', fontSize: 12, fontWeight: '800' },
  productCode: { color: '#9aa4b3', fontSize: 9, marginTop: 4 },
  priceBlock: { alignItems: 'flex-end', maxWidth: 105 },
  productPrice: { color: colors.ink, fontSize: 11, fontWeight: '800' },
  stockText: { color: colors.green, fontSize: 9, marginTop: 4 },
  lowStockText: { color: colors.amber },
  productFooter: { alignItems: 'center', borderTopColor: '#f0f1f4', borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingVertical: 10 },
  badge: { alignItems: 'center', borderRadius: 20, flexDirection: 'row', gap: 5, paddingHorizontal: 8, paddingVertical: 5 },
  badgeLow: { backgroundColor: colors.amberSoft },
  badgeAvailable: { backgroundColor: colors.greenSoft },
  badgeDot: { borderRadius: 4, height: 6, width: 6 },
  badgeDotLow: { backgroundColor: colors.amber },
  badgeDotAvailable: { backgroundColor: colors.green },
  badgeText: { fontSize: 9, fontWeight: '700' },
  badgeTextLow: { color: colors.amber },
  badgeTextAvailable: { color: colors.green },
  rowActions: { flexDirection: 'row', gap: 7 },
  editButton: { backgroundColor: '#f5f3ff', borderRadius: 7, paddingHorizontal: 10, paddingVertical: 6 },
  editButtonText: { color: colors.primary, fontSize: 9, fontWeight: '700' },
  deleteButton: { backgroundColor: '#fff3f3', borderRadius: 7, paddingHorizontal: 10, paddingVertical: 6 },
  deleteButtonText: { color: colors.red, fontSize: 9, fontWeight: '700' },
  emptyCard: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: colors.line, borderRadius: 12, borderWidth: 1, padding: 25 },
  emptyIcon: { color: '#a597ff', fontSize: 27 },
  emptyTitle: { color: colors.ink, fontSize: 13, fontWeight: '800', marginTop: 9 },
  emptyText: { color: colors.muted, fontSize: 10, lineHeight: 16, marginTop: 5, textAlign: 'center' },
  loadingText: { color: colors.muted, fontSize: 11, paddingVertical: 15, textAlign: 'center' }
});
