const apiBase = '/api';
const storageKeys = { token: 'token', user: 'usuario' };

const elements = {
  authScreen: document.querySelector('#auth-screen'),
  appScreen: document.querySelector('#app-screen'),
  authTitle: document.querySelector('#auth-title'),
  authDescription: document.querySelector('#auth-description'),
  authSwitchLabel: document.querySelector('#auth-switch-label'),
  authSwitchButton: document.querySelector('#auth-switch-button'),
  loginForm: document.querySelector('#login-form'),
  registerForm: document.querySelector('#register-form'),
  userName: document.querySelector('#user-name'),
  userRole: document.querySelector('#user-role'),
  userAvatar: document.querySelector('#user-avatar'),
  logoutButton: document.querySelector('#logout-button'),
  refreshButton: document.querySelector('#refresh-button'),
  totalProducts: document.querySelector('#total-products'),
  lowStockCount: document.querySelector('#low-stock-count'),
  movementCount: document.querySelector('#movement-count'),
  lowStockSection: document.querySelector('#low-stock-section'),
  lowStockList: document.querySelector('#low-stock-list'),
  productsTableBody: document.querySelector('#products-table-body'),
  productsEmpty: document.querySelector('#products-empty'),
  productResultCount: document.querySelector('#product-result-count'),
  searchInput: document.querySelector('#search-input'),
  newProductButton: document.querySelector('#new-product-button'),
  productDialog: document.querySelector('#product-dialog'),
  productForm: document.querySelector('#product-form'),
  productDialogTitle: document.querySelector('#product-dialog-title'),
  productDialogDescription: document.querySelector('#product-dialog-description'),
  saveProductButton: document.querySelector('#save-product-button'),
  closeDialogButton: document.querySelector('#close-dialog-button'),
  cancelDialogButton: document.querySelector('#cancel-dialog-button'),
  movementForm: document.querySelector('#movement-form'),
  movementProduct: document.querySelector('#movement-product'),
  movementHistory: document.querySelector('#movement-history'),
  historyEmpty: document.querySelector('#history-empty'),
  lastUpdated: document.querySelector('#last-updated'),
  toastRegion: document.querySelector('#toast-region')
};

let products = [];
let stockLowProducts = [];
let movements = [];
let authMode = 'login';
let toastTimeouts = new Set();

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function currentToken() {
  return localStorage.getItem(storageKeys.token);
}

function currentUser() {
  try {
    return JSON.parse(localStorage.getItem(storageKeys.user)) || {};
  } catch {
    return {};
  }
}

function canOperateInventory() {
  return ['ADMIN', 'OPERADOR', 'USER'].includes(currentUser().rol);
}

function notify(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast${type === 'error' ? ' error' : ''}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.textContent = message;
  elements.toastRegion.append(toast);

  const timeout = window.setTimeout(() => {
    toast.remove();
    toastTimeouts.delete(timeout);
  }, 4200);
  toastTimeouts.add(timeout);
}

async function apiRequest(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && currentToken()) headers.Authorization = `Bearer ${currentToken()}`;

  let response;
  try {
    response = await fetch(`${apiBase}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch {
    throw new Error('No se pudo conectar con la API. Verificá que el servidor esté iniciado.');
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && auth) {
      clearSession();
      showAuthScreen();
    }
    throw new Error(result.mensaje || result.error || `La API respondió con error ${response.status}.`);
  }
  return result;
}

function getSessionUser() {
  try {
    return JSON.parse(localStorage.getItem(storageKeys.user) || 'null');
  } catch {
    return null;
  }
}

function storeSession(result) {
  if (!result.token || !result.datos) {
    throw new Error('La API respondió sin los datos de sesión esperados.');
  }
  localStorage.setItem(storageKeys.token, result.token);
  localStorage.setItem(storageKeys.user, JSON.stringify(result.datos));
}

function clearSession() {
  localStorage.removeItem(storageKeys.token);
  localStorage.removeItem(storageKeys.user);
}

function showAuthScreen() {
  elements.authScreen.hidden = false;
  elements.appScreen.hidden = true;
}

function showAppScreen() {
  const user = getSessionUser();
  if (!currentToken() || !user) {
    clearSession();
    showAuthScreen();
    return;
  }

  elements.authScreen.hidden = true;
  elements.appScreen.hidden = false;
  elements.userName.textContent = user.nombre || 'Usuario';
  elements.userRole.textContent = user.rol || 'Cuenta activa';
  elements.userAvatar.textContent = (user.nombre || 'U').trim().charAt(0).toUpperCase();
  loadDashboard();
}

function setAuthMode(mode) {
  authMode = mode;
  const registering = mode === 'register';
  elements.loginForm.hidden = registering;
  elements.registerForm.hidden = !registering;
  elements.authTitle.innerHTML = registering
    ? 'Empezá a ordenar<br><span>tu inventario.</span>'
    : 'Todo tu stock,<br><span>en un solo lugar.</span>';
  elements.authDescription.textContent = registering
    ? 'Creá tu cuenta para acceder al panel de inventario.'
    : 'Ingresá para administrar los productos y movimientos de tu negocio.';
  elements.authSwitchLabel.textContent = registering ? '¿Ya tenés una cuenta?' : '¿Primera vez por acá?';
  elements.authSwitchButton.textContent = registering ? 'Iniciar sesión' : 'Crear cuenta';
}

async function handleAuthSubmit(event, mode) {
  event.preventDefault();
  const form = event.currentTarget;
  const submit = form.querySelector('button[type="submit"]');
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  submit.disabled = true;

  try {
    const result = await apiRequest(mode === 'register' ? '/auth/registro' : '/auth/login', {
      method: 'POST',
      body: payload,
      auth: false
    });
    storeSession(result);
    form.reset();
    showAppScreen();
    notify(mode === 'register' ? 'Tu cuenta ya está lista.' : '¡Qué bueno verte de nuevo!');
  } catch (error) {
    notify(error.message, 'error');
  } finally {
    submit.disabled = false;
  }
}

function formatPrice(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return 'Fecha no disponible';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

async function loadDashboard() {
  elements.refreshButton.disabled = true;
  elements.refreshButton.innerHTML = '<span class="refresh-icon">↻</span> Actualizando...';
  try {
    const [productsResponse, lowResponse, movementResponse] = await Promise.all([
      apiRequest('/productos', { auth: false }),
      apiRequest('/productos/stock-bajo'),
      apiRequest('/movimientos')
    ]);

    if (!Array.isArray(productsResponse.datos)
      || !Array.isArray(lowResponse.datos)
      || !Array.isArray(movementResponse.datos)) {
      throw new Error('La API devolvió un formato de respuesta inesperado.');
    }

    products = productsResponse.datos;
    stockLowProducts = lowResponse.datos;
    movements = movementResponse.datos;
    renderDashboard();
    elements.lastUpdated.textContent = `Actualizado ${new Intl.DateTimeFormat('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date())}`;
  } catch (error) {
    notify(error.message, 'error');
  } finally {
    elements.refreshButton.disabled = false;
    elements.refreshButton.innerHTML = '<span class="refresh-icon">↻</span> Actualizar datos';
  }
}

function renderDashboard() {
  elements.totalProducts.textContent = products.length;
  elements.lowStockCount.textContent = stockLowProducts.length;
  elements.movementCount.textContent = movements.length;
  renderLowStock();
  renderProducts();
  renderMovementOptions();
  renderMovementHistory();
  elements.newProductButton.hidden = !canOperateInventory();
  elements.movementForm.closest('.movement-form-panel').hidden = !canOperateInventory();
}

function renderLowStock() {
  elements.lowStockSection.hidden = stockLowProducts.length === 0;
  elements.lowStockList.innerHTML = stockLowProducts.map((product) => `
    <div class="low-stock-item">
      <span>${escapeHtml(product.nombre)}</span>
      <strong>${Number(product.stock) || 0} / ${Number(product.stockMinimo) || 0}</strong>
    </div>
  `).join('');
}

function renderProducts() {
  const search = elements.searchInput.value.trim().toLocaleLowerCase('es-AR');
  const filtered = products.filter((product) =>
    `${product.nombre} ${product.codigoBarras || ''}`.toLocaleLowerCase('es-AR').includes(search)
  );

  elements.productResultCount.textContent = `${filtered.length} ${filtered.length === 1 ? 'producto' : 'productos'}`;
  elements.productsEmpty.hidden = filtered.length !== 0;
  elements.productsTableBody.innerHTML = filtered.map((product) => {
    const low = Number(product.stock) <= Number(product.stockMinimo);
    return `
      <tr>
        <td class="product-cell">${escapeHtml(product.nombre)}</td>
        <td class="code-cell">${escapeHtml(product.codigoBarras || 'Sin código')}</td>
        <td class="price-cell">${formatPrice(product.precio)}</td>
        <td><span class="stock-chip${low ? ' low' : ''}">${Number(product.stock) || 0} un.</span></td>
        <td><span class="status-chip${low ? ' low' : ''}">${low ? 'Stock bajo' : 'Disponible'}</span></td>
        <td>
          <div class="row-actions">
            ${canOperateInventory() ? `
            <button class="row-action" type="button" data-action="edit" data-id="${escapeHtml(product._id)}" aria-label="Editar ${escapeHtml(product.nombre)}" title="Editar">✎</button>
            ${currentUser().rol === 'ADMIN' ? `
            <button class="row-action delete" type="button" data-action="delete" data-id="${escapeHtml(product._id)}" aria-label="Eliminar ${escapeHtml(product.nombre)}" title="Eliminar">⌫</button>
            ` : ''}
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderMovementOptions() {
  const previousValue = elements.movementProduct.value;
  if (products.length === 0) {
    elements.movementProduct.innerHTML = '<option value="">Agregá un producto primero</option>';
    elements.movementProduct.disabled = true;
    elements.movementForm.querySelector('button[type="submit"]').disabled = true;
    return;
  }

  elements.movementProduct.disabled = false;
  elements.movementForm.querySelector('button[type="submit"]').disabled = false;
  elements.movementProduct.innerHTML = products.map((product) =>
    `<option value="${escapeHtml(product._id)}">${escapeHtml(product.nombre)} · ${Number(product.stock) || 0} un.</option>`
  ).join('');
  if (products.some((product) => product._id === previousValue)) {
    elements.movementProduct.value = previousValue;
  }
}

function renderMovementHistory() {
  elements.historyEmpty.hidden = movements.length !== 0;
  elements.movementHistory.innerHTML = movements.slice(0, 6).map((movement) => {
    const entry = movement.tipo === 'ENTRADA';
    const product = movement.producto && typeof movement.producto === 'object'
      ? movement.producto.nombre
      : 'Producto';
    return `
      <div class="history-row">
        <div class="history-product">
          <strong>${escapeHtml(product || 'Producto')}</strong>
          <small>${escapeHtml(movement.motivo || 'Movimiento de inventario')} · ${escapeHtml(formatDate(movement.createdAt))}</small>
        </div>
        <span class="movement-type ${entry ? 'entry' : 'exit'}">${entry ? 'ENTRADA' : 'SALIDA'}</span>
        <span class="history-quantity">${entry ? '+' : '−'}${Number(movement.cantidad) || 0}</span>
      </div>
    `;
  }).join('');
}

function openProductDialog(product = null) {
  elements.productForm.reset();
  elements.productForm.elements.productId.value = product?._id || '';
  elements.productForm.elements.nombre.value = product?.nombre || '';
  elements.productForm.elements.codigoBarras.value = product?.codigoBarras || '';
  elements.productForm.elements.precio.value = product?.precio ?? '';
  elements.productForm.elements.stock.value = product?.stock ?? 0;
  elements.productForm.elements.stockMinimo.value = product?.stockMinimo ?? 5;
  elements.productDialogTitle.textContent = product ? 'Editar producto' : 'Nuevo producto';
  elements.productDialogDescription.textContent = product
    ? 'Actualizá los datos del producto en tu inventario.'
    : 'Completá los datos para agregarlo al inventario.';
  elements.saveProductButton.innerHTML = product ? 'Guardar cambios <span>→</span>' : 'Guardar producto <span>→</span>';
  elements.productDialog.showModal();
  elements.productForm.elements.nombre.focus();
}

function closeProductDialog() {
  if (elements.productDialog.open) elements.productDialog.close();
}

async function saveProduct(event) {
  event.preventDefault();
  const fields = elements.productForm.elements;
  const id = fields.productId.value;
  const button = elements.saveProductButton;
  const payload = {
    nombre: fields.nombre.value.trim(),
    codigoBarras: fields.codigoBarras.value.trim(),
    precio: Number(fields.precio.value),
    stock: Number(fields.stock.value),
    stockMinimo: Number(fields.stockMinimo.value)
  };

  if (!payload.nombre || !Number.isFinite(payload.precio) || payload.precio < 0
    || !Number.isInteger(payload.stock) || payload.stock < 0
    || !Number.isInteger(payload.stockMinimo) || payload.stockMinimo < 0) {
    notify('Revisá el nombre, el precio y las cantidades ingresadas.', 'error');
    return;
  }

  button.disabled = true;
  try {
    const result = await apiRequest(id ? `/productos/${encodeURIComponent(id)}` : '/productos', {
      method: id ? 'PUT' : 'POST',
      body: payload
    });
    closeProductDialog();
    await loadDashboard();
    notify(result.mensaje || (id ? 'Producto actualizado.' : 'Producto creado.'));
  } catch (error) {
    notify(error.message, 'error');
  } finally {
    button.disabled = false;
  }
}

async function deleteProduct(id) {
  const product = products.find((item) => item._id === id);
  if (!product || !window.confirm(`¿Eliminar "${product.nombre}" del inventario? Esta acción no se puede deshacer.`)) return;

  try {
    const result = await apiRequest(`/productos/${encodeURIComponent(id)}`, { method: 'DELETE' });
    await loadDashboard();
    notify(result.mensaje || 'Producto eliminado.');
  } catch (error) {
    notify(error.message, 'error');
  }
}

async function saveMovement(event) {
  event.preventDefault();
  const fields = elements.movementForm.elements;
  const payload = {
    productoId: fields.productoId.value,
    tipo: fields.tipo.value,
    cantidad: Number(fields.cantidad.value),
    motivo: fields.motivo.value.trim()
  };

  if (!payload.productoId || !Number.isInteger(payload.cantidad) || payload.cantidad < 1) {
    notify('Elegí un producto e ingresá una cantidad entera mayor a cero.', 'error');
    return;
  }

  const button = elements.movementForm.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    const result = await apiRequest('/movimientos', { method: 'POST', body: payload });
    elements.movementForm.elements.cantidad.value = '';
    elements.movementForm.elements.motivo.value = '';
    await loadDashboard();
    notify(result.mensaje || 'Movimiento guardado y stock actualizado.');
  } catch (error) {
    notify(error.message, 'error');
  } finally {
    button.disabled = products.length === 0;
  }
}

elements.authSwitchButton.addEventListener('click', () => {
  setAuthMode(authMode === 'login' ? 'register' : 'login');
});
elements.loginForm.addEventListener('submit', (event) => handleAuthSubmit(event, 'login'));
elements.registerForm.addEventListener('submit', (event) => handleAuthSubmit(event, 'register'));
elements.logoutButton.addEventListener('click', () => {
  clearSession();
  products = [];
  stockLowProducts = [];
  movements = [];
  showAuthScreen();
});
elements.refreshButton.addEventListener('click', loadDashboard);
elements.searchInput.addEventListener('input', renderProducts);
elements.newProductButton.addEventListener('click', () => openProductDialog());
elements.closeDialogButton.addEventListener('click', closeProductDialog);
elements.cancelDialogButton.addEventListener('click', closeProductDialog);
elements.productForm.addEventListener('submit', saveProduct);
elements.movementForm.addEventListener('submit', saveMovement);
elements.productsTableBody.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const product = products.find((item) => item._id === button.dataset.id);
  if (!product) return;
  if (button.dataset.action === 'edit') openProductDialog(product);
  if (button.dataset.action === 'delete') deleteProduct(product._id);
});
elements.productDialog.addEventListener('click', (event) => {
  if (event.target === elements.productDialog) closeProductDialog();
});
document.querySelectorAll('.nav-link').forEach((link) => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.nav-link').forEach((item) => item.classList.remove('active'));
    link.classList.add('active');
  });
});

if (currentToken() && getSessionUser()) showAppScreen();
else showAuthScreen();
