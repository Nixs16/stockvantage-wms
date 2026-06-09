/**
 * StockVantage - Warehouse Inventory Dashboard
 * Core Application Script
 */

// ==========================================================================
// 1. Initial State & Dummy Data
// ==========================================================================
const DEFAULT_ITEMS = [
  { id: 'item-1', name: 'Laptop Asus Zenbook 14', sku: 'EL-LPT-001', category: 'Elektronik', quantity: 42, minStock: 10, price: 15499000, location: 'Gudang 1 - Rak A-1' },
  { id: 'item-2', name: 'Kursi Kantor Ergonomis Koenig', sku: 'FR-CHR-002', category: 'Furnitur', quantity: 8, minStock: 12, price: 1850000, location: 'Gudang 1 - Rak B-4' },
  { id: 'item-3', name: 'Monitor Dell 27 Inch 4K', sku: 'EL-MON-003', category: 'Elektronik', quantity: 15, minStock: 5, price: 5699000, location: 'Gudang 1 - Rak A-3' },
  { id: 'item-4', name: 'Kertas HVS A4 Sinar Dunia 80g', sku: 'AT-PPR-004', category: 'Alat Tulis', quantity: 180, minStock: 30, price: 48000, location: 'Gudang 2 - Rak C-1' },
  { id: 'item-5', name: 'Obeng Set Toolkit Bosch', sku: 'SC-TLK-005', category: 'Suku Cadang', quantity: 3, minStock: 8, price: 320000, location: 'Gudang 2 - Rak D-2' },
  { id: 'item-6', name: 'Meja Rapat Kayu Jati', sku: 'FR-TBL-006', category: 'Furnitur', quantity: 0, minStock: 2, price: 7800000, location: 'Gudang 1 - Rak B-1' },
  { id: 'item-7', name: 'Keyboard Mechanical Keychron K2', sku: 'EL-KEY-007', category: 'Elektronik', quantity: 24, minStock: 6, price: 1450000, location: 'Gudang 1 - Rak A-2' }
];

const DEFAULT_TRANSACTIONS = [
  { id: 'TRX-101', itemId: 'item-1', itemName: 'Laptop Asus Zenbook 14', type: 'in', quantity: 15, timestamp: '03 Jun, 14:25' },
  { id: 'TRX-102', itemId: 'item-2', itemName: 'Kursi Kantor Ergonomis Koenig', type: 'out', quantity: 4, timestamp: '03 Jun, 16:10' },
  { id: 'TRX-103', itemId: 'item-5', itemName: 'Obeng Set Toolkit Bosch', type: 'out', quantity: 2, timestamp: '04 Jun, 01:15' },
  { id: 'TRX-104', itemId: 'item-4', itemName: 'Kertas HVS A4 Sinar Dunia 80g', type: 'in', quantity: 50, timestamp: '04 Jun, 03:40' }
];

// State arrays loaded from API backend
let items = [];
let transactions = [];
let registeredUsers = [];
let currentUser = JSON.parse(localStorage.getItem('sv_current_user')) || null;

// Configurable constants
const TOTAL_STORAGE_SLOTS = 1000; // Used for capacity utilization stats

// Warehouse definitions — each warehouse owns a set of rack letters
const DEFAULT_WAREHOUSES = [
  {
    id: 'wh-1',
    name: 'Gudang 1',
    icon: '🏭',
    description: 'Gudang utama untuk Elektronik & Suku Cadang',
    color: 'blue',
    racks: ['A', 'B'],
    capacity: { A: 150, B: 100 }
  },
  {
    id: 'wh-2',
    name: 'Gudang 2',
    icon: '🏗️',
    description: 'Gudang Furnitur & Alat Tulis',
    color: 'green',
    racks: ['C', 'D'],
    capacity: { C: 300, D: 150 }
  },
  {
    id: 'wh-3',
    name: 'Gudang 3',
    icon: '📦',
    description: 'Gudang cadangan (buffer stock)',
    color: 'purple',
    racks: [],
    capacity: {}
  }
];
let WAREHOUSES = [];
// ==========================================================================
// 2. DOM Elements Selection
// ==========================================================================
const themeToggle = document.getElementById('theme-toggle');
const tabButtons = document.querySelectorAll('.menu-item');
const tabContents = document.querySelectorAll('.tab-content');
const pageTitle = document.getElementById('page-title');
const pageSubtitle = document.getElementById('page-subtitle');
const globalSearch = document.getElementById('global-search');

// KPI elements
const kpiTotalItems = document.getElementById('kpi-total-items');
const kpiTotalValue = document.getElementById('kpi-total-value');
const kpiLowStock = document.getElementById('kpi-low-stock');
const kpiLowStockDesc = document.getElementById('kpi-low-stock-desc');
const kpiCapacity = document.getElementById('kpi-capacity');
const kpiCapacityBar = document.getElementById('kpi-capacity-bar');

// Tab 1 (Dashboard) elements
const stockChart = document.getElementById('stock-chart');
const transactionLog = document.getElementById('transaction-log');

// Tab 2 (Inventory) elements
const inventoryTableBody = document.getElementById('inventory-table-body');
const filterCategory = document.getElementById('filter-category');
const filterStatus = document.getElementById('filter-status');
const filteredCount = document.getElementById('filtered-count');
const totalCount = document.getElementById('total-count');

// Modal elements
const quickAddBtn = document.getElementById('quick-add-btn');
const itemModal = document.getElementById('item-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelFormBtn = document.getElementById('cancel-form-btn');
const itemForm = document.getElementById('item-form');
const modalTitle = document.getElementById('modal-title');
const saveItemBtn = document.getElementById('save-item-btn');

// Modal form input fields
const formItemId = document.getElementById('form-item-id');
const inputName = document.getElementById('item-name');
const inputSku = document.getElementById('item-sku');
const inputCategory = document.getElementById('item-category');
const inputLocationWarehouse = document.getElementById('item-location-warehouse');
const inputLocationRack = document.getElementById('item-location-rack');
const inputLocationSlot = document.getElementById('item-location-slot');
const inputPrice = document.getElementById('item-price');
const inputQuantity = document.getElementById('item-quantity');
const inputThreshold = document.getElementById('item-threshold');
const inputDate = document.getElementById('item-date');
const inputDateGroup = document.getElementById('item-date-group');

// Toast element
const toastContainer = document.getElementById('toast-container');

// Auth elements
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const loginFormWrapper = document.getElementById('login-form-wrapper');
const registerFormWrapper = document.getElementById('register-form-wrapper');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const registerName = document.getElementById('register-name');
const registerEmail = document.getElementById('register-email');
const registerRole = document.getElementById('register-role');
const registerPassword = document.getElementById('register-password');
const toRegisterBtn = document.getElementById('to-register-btn');
const toLoginBtn = document.getElementById('to-login-btn');
const sidebarLogout = document.getElementById('sidebar-logout');

// Stock Out Elements

const stockoutForm = document.getElementById('stockout-form');
const stockoutItemSelect = document.getElementById('stockout-item-select');
const stockoutQty = document.getElementById('stockout-qty');
const stockoutRecipient = document.getElementById('stockout-recipient');
const stockoutNotes = document.getElementById('stockout-notes');
const stockoutDate = document.getElementById('stockout-date');

// Warehouse Elements
const warehouseRacksContainer = document.getElementById('warehouse-racks-container');
const warehouseCardsContainer = document.getElementById('warehouse-cards-container');
const warehouseListView = document.getElementById('warehouse-list-view');
const warehouseDetailView = document.getElementById('warehouse-detail-view');
const backToWarehousesBtn = document.getElementById('back-to-warehouses-btn');
const breadcrumbWarehouseName = document.getElementById('breadcrumb-warehouse-name');
const warehouseDetailName = document.getElementById('warehouse-detail-name');
const warehouseDetailSubtitle = document.getElementById('warehouse-detail-subtitle');
const detailStatTotalItems = document.getElementById('detail-stat-total-items');
const detailStatTotalQty = document.getElementById('detail-stat-total-qty');
const detailStatCapacity = document.getElementById('detail-stat-capacity');

let activeWarehouseId = null; // tracks which warehouse is currently drilled into

// Warehouse Modal Elements
const addWarehouseBtn = document.getElementById('add-warehouse-btn');
const editWarehouseBtn = document.getElementById('edit-warehouse-btn');
const deleteWarehouseBtn = document.getElementById('delete-warehouse-btn');
const warehouseModal = document.getElementById('warehouse-modal');
const closeWarehouseModalBtn = document.getElementById('close-warehouse-modal-btn');
const cancelWarehouseFormBtn = document.getElementById('cancel-warehouse-form-btn');
const warehouseForm = document.getElementById('warehouse-form');
const warehouseModalTitle = document.getElementById('warehouse-modal-title');
const saveWarehouseBtn = document.getElementById('save-warehouse-btn');
const addRackRowBtn = document.getElementById('add-rack-row-btn');
const warehouseRacksRowsContainer = document.getElementById('warehouse-racks-rows-container');

// Warehouse Modal Form Fields
const formWarehouseId = document.getElementById('form-warehouse-id');
const warehouseNameInput = document.getElementById('warehouse-name');
const warehouseDescriptionInput = document.getElementById('warehouse-description');
const warehouseColorSelect = document.getElementById('warehouse-color');

// User Management Elements
const usersTableBody = document.getElementById('users-table-body');
const addUserBtn = document.getElementById('add-user-btn');
const userModal = document.getElementById('user-modal');
const closeUserModalBtn = document.getElementById('close-user-modal-btn');
const cancelUserBtn = document.getElementById('cancel-user-btn');
const userForm = document.getElementById('user-form');
const userModalTitle = document.getElementById('user-modal-title');
const saveUserBtn = document.getElementById('save-user-btn');

// User Modal Form Fields
const formUserId = document.getElementById('form-user-id');
const userNameInput = document.getElementById('user-name');
const userEmailInput = document.getElementById('user-email');
const userRoleInput = document.getElementById('user-role');
const userPasswordInput = document.getElementById('user-password');

// ==========================================================================
// 3. Helper Functions
// ==========================================================================
function saveData() {
  if (currentUser) {
    localStorage.setItem('sv_current_user', JSON.stringify(currentUser));
  } else {
    localStorage.removeItem('sv_current_user');
  }
}

async function loadAllData() {
  try {
    const [itemsRes, txRes, whRes] = await Promise.all([
      fetch('/api/items').then(r => r.json()),
      fetch('/api/transactions').then(r => r.json()),
      fetch('/api/warehouses').then(r => r.json())
    ]);

    items = itemsRes;
    transactions = txRes;
    WAREHOUSES = whRes;

    if (currentUser && currentUser.role === 'Manager') {
      registeredUsers = await fetch('/api/users').then(r => r.json());
    }
  } catch (err) {
    console.error('Gagal mengambil data dari server:', err);
    showToast('Gagal memuat data dari server.', 'error');
  }
}

async function refreshData() {
  await loadAllData();
  updateUI();
}

function formatCurrency(num) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(num);
}

function formatDateTime(date) {
  const pad = (n) => String(n).padStart(2, '0');
  const day = pad(date.getDate());
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const month = months[date.getMonth()];
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${day} ${month}, ${hours}:${minutes}`;
}

function getCurrentDatetimeLocal() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function formatDatetimeLocal(dtStr) {
  if (!dtStr) return formatDateTime(new Date());
  const d = new Date(dtStr);
  return formatDateTime(d);
}

// Toast notification helper
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-message">${message}</span>`;
  
  toastContainer.appendChild(toast);

  // Auto remove toast
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 3000);
}

// Note: Transactions are now logged server-side via POST /api/transactions

// Check stock status classification
function getStockStatusClass(quantity, minStock) {
  if (quantity === 0) return 'outofstock';
  if (quantity <= minStock) return 'lowstock';
  return 'instock';
}

function getStockStatusLabel(quantity, minStock) {
  if (quantity === 0) return 'Stok Habis';
  if (quantity <= minStock) return 'Stok Menipis';
  return 'Tersedia';
}

// ==========================================================================
// 4. UI Updating Functions
// ==========================================================================

// Main coordinator for UI refresh
function updateUI() {
  updateKPIs();
  renderChart();
  renderTransactions();
  renderInventoryTable();
  populateItemDropdowns();
  // Refresh whichever warehouse view is currently active
  if (activeWarehouseId) {
    renderWarehouseRacks(activeWarehouseId);
  } else {
    renderWarehouseList();
  }
  renderUsersTable();
}

// Populate item dropdown selects for transaction forms
function populateItemDropdowns() {
  if (!stockoutItemSelect) return;
  
  const currentOutSel = stockoutItemSelect.value;

  const htmlOptions = `
    <option value="">-- Pilih Barang dari Inventaris --</option>
    ${items.map(item => `<option value="${item.id}">${item.name} (${item.sku}) - Stok: ${item.quantity}</option>`).join('')}
  `;

  stockoutItemSelect.innerHTML = htmlOptions;

  // Restore selection if valid
  stockoutItemSelect.value = items.some(i => i.id === currentOutSel) ? currentOutSel : "";
}

// Populate the Gudang dropdown in the Add/Edit item modal
function populateWarehouseDropdown(selectedWhId = '') {
  if (!inputLocationWarehouse) return;
  inputLocationWarehouse.innerHTML = '<option value="">-- Pilih Gudang --</option>';
  WAREHOUSES.forEach(wh => {
    const opt = document.createElement('option');
    opt.value = wh.id;
    opt.textContent = wh.name;
    if (wh.id === selectedWhId) opt.selected = true;
    inputLocationWarehouse.appendChild(opt);
  });
  // Trigger rack population for the pre-selected warehouse
  populateRackDropdown(selectedWhId);
}

// Populate the Rak dropdown based on selected warehouse
function populateRackDropdown(warehouseId, selectedRack = '') {
  if (!inputLocationRack) return;
  inputLocationRack.innerHTML = '<option value="">-- Pilih Rak --</option>';

  if (!warehouseId) {
    inputLocationRack.disabled = true;
    return;
  }

  const wh = WAREHOUSES.find(w => w.id === warehouseId);
  if (!wh || wh.racks.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'Gudang ini belum memiliki rak';
    opt.disabled = true;
    inputLocationRack.appendChild(opt);
    inputLocationRack.disabled = true;
    return;
  }

  inputLocationRack.disabled = false;
  wh.racks.forEach(rackLetter => {
    const opt = document.createElement('option');
    opt.value = rackLetter;
    opt.textContent = `Rak ${rackLetter}`;
    if (rackLetter === selectedRack) opt.selected = true;
    inputLocationRack.appendChild(opt);
  });
}

// Event: cascade rack dropdown when warehouse changes
if (inputLocationWarehouse) {
  inputLocationWarehouse.addEventListener('change', () => {
    populateRackDropdown(inputLocationWarehouse.value);
  });
}

// Helper: get rack name (e.g. 'A', 'B', 'A1') from location string cleanly
function getRackFromLocation(locationStr) {
  if (!locationStr) return '';
  const parts = locationStr.split(' - ');
  const rackPart = parts.length >= 2 ? parts[1] : locationStr;
  const match = rackPart.toUpperCase().match(/RAK\s*([A-Z0-9]{1,3})/);
  return match ? match[1] : '';
}

// Helper: parse existing location string (e.g. "Gudang 1 - Rak A-1" or legacy "Rak A-1") into {whId, rack, slot}
function parseLocationString(locationStr) {
  if (!locationStr) return { whId: '', rack: '', slot: '' };
  
  const upper = locationStr.toUpperCase().trim();
  const parts = upper.split(' - ');
  let whName = '';
  let rackPart = '';
  
  if (parts.length >= 2) {
    whName = parts[0].trim();
    rackPart = parts[1].trim();
  } else {
    rackPart = upper;
  }

  // Find warehouse by name
  let wh = null;
  if (whName) {
    wh = WAREHOUSES.find(w => w.name.toUpperCase() === whName);
  }

  // Parse rack name and slot — supports 1-3 chars alphanumeric (e.g. A, B2, AA)
  const match = rackPart.match(/RAK\s*([A-Z0-9]{1,3})(?:-(\d+))?/i);
  let rack = '';
  let slot = '';
  if (match) {
    rack = match[1].toUpperCase();
    slot = match[2] || '';
  }

  // Fallback: If warehouse not found by name, check by rack name (legacy data compatibility)
  if (!wh && rack) {
    wh = WAREHOUSES.find(w => w.racks.includes(rack));
  }

  return { whId: wh ? wh.id : '', rack, slot };
}

// Helper: compose location string from dropdown values
function composeLocationString() {
  const whId = inputLocationWarehouse.value;
  const rack = inputLocationRack.value;
  const slot = inputLocationSlot.value.trim();
  if (!whId || !rack) return '';
  
  const wh = WAREHOUSES.find(w => w.id === whId);
  const whName = wh ? wh.name : '';
  
  return slot ? `${whName} - Rak ${rack}-${slot}` : `${whName} - Rak ${rack}`;
}

// Render Level-1: Warehouse selector card grid
function renderWarehouseList() {
  if (!warehouseCardsContainer) return;
  warehouseCardsContainer.innerHTML = '';

  WAREHOUSES.forEach(wh => {
    // Compute summary stats for each warehouse
    const whItems = items.filter(item => {
      const { whId } = parseLocationString(item.location);
      return whId === wh.id;
    });
    const totalQty = whItems.reduce((sum, i) => sum + i.quantity, 0);
    const totalCapacity = Object.values(wh.capacity).reduce((sum, c) => sum + c, 0) || 100;
    const usedPercent = Math.min(Math.round((totalQty / totalCapacity) * 100), 100);
    const lowStockCount = whItems.filter(i => i.quantity <= i.minStock).length;

    let fillClass = 'normal';
    if (usedPercent >= 85) fillClass = 'danger';
    else if (usedPercent >= 50) fillClass = 'warning';

    const card = document.createElement('div');
    card.className = `warehouse-selector-card wh-color-${wh.color}`;
    card.setAttribute('data-wh-id', wh.id);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');

    card.innerHTML = `
      <div class="wh-card-top">
        <div class="wh-card-meta">
          <h3 class="wh-card-name">${wh.name}</h3>
          <p class="wh-card-desc">${wh.description}</p>
        </div>
        <svg class="wh-card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </div>
      <div class="wh-card-stats">
        <div class="wh-mini-stat">
          <span class="wh-mini-val">${whItems.length}</span>
          <span class="wh-mini-lbl">Jenis Barang</span>
        </div>
        <div class="wh-mini-stat">
          <span class="wh-mini-val">${totalQty}</span>
          <span class="wh-mini-lbl">Total Unit</span>
        </div>
        <div class="wh-mini-stat">
          <span class="wh-mini-val ${lowStockCount > 0 ? 'warning-text' : ''}">${lowStockCount}</span>
          <span class="wh-mini-lbl">Stok Menipis</span>
        </div>
      </div>
      <div class="wh-card-bar-wrapper">
        <div class="wh-card-bar-container">
          <div class="rack-bar-fill ${fillClass}" style="width: ${usedPercent}%"></div>
        </div>
        <span class="wh-card-bar-label">${usedPercent}% kapasitas terpakai</span>
      </div>
      <div class="wh-card-racks-chips">
        ${wh.racks.length > 0 
          ? wh.racks.map(r => `<span class="rack-chip">Rak ${r}</span>`).join('') 
          : '<span class="rack-chip empty">Belum ada rak</span>'}
      </div>
    `;

    card.addEventListener('click', () => openWarehouseDetail(wh.id));
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') openWarehouseDetail(wh.id); });

    warehouseCardsContainer.appendChild(card);
  });
}

// Open Level-2: Drill-down into a specific warehouse
function openWarehouseDetail(warehouseId) {
  const wh = WAREHOUSES.find(w => w.id === warehouseId);
  if (!wh) return;

  activeWarehouseId = warehouseId;

  // Switch views
  warehouseListView.classList.add('hidden');
  warehouseDetailView.classList.remove('hidden');

  // Update breadcrumb & header
  breadcrumbWarehouseName.textContent = wh.name;
  warehouseDetailName.textContent = wh.name;
  warehouseDetailSubtitle.textContent = wh.description;

  // Render racks for this warehouse
  renderWarehouseRacks(warehouseId);
}

// Go back to Level-1
function backToWarehouseList() {
  activeWarehouseId = null;
  warehouseDetailView.classList.add('hidden');
  warehouseListView.classList.remove('hidden');
  renderWarehouseList();
}

// Render Level-2: Racks and items for a given warehouse
function renderWarehouseRacks(warehouseId) {
  if (!warehouseRacksContainer) return;
  warehouseRacksContainer.innerHTML = '';

  const wh = WAREHOUSES.find(w => w.id === warehouseId);
  if (!wh) return;

  // Build rack groups for this warehouse's racks only
  const rackGroups = {};
  wh.racks.forEach(r => { rackGroups[r] = []; });

  items.forEach(item => {
    const { whId, rack } = parseLocationString(item.location);
    if (whId === warehouseId && rack && rackGroups.hasOwnProperty(rack)) {
      rackGroups[rack].push(item);
    }
  });

  // Compute overall detail stats
  const allWhItems = Object.values(rackGroups).flat();
  const uniqueItems = [...new Map(allWhItems.map(i => [i.id, i])).values()];
  const totalQty = uniqueItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalCapacity = Object.values(wh.capacity).reduce((sum, c) => sum + c, 0) || 100;
  const usedPercent = Math.min(Math.round((totalQty / totalCapacity) * 100), 100);

  if (detailStatTotalItems) detailStatTotalItems.textContent = uniqueItems.length;
  if (detailStatTotalQty) detailStatTotalQty.textContent = totalQty;
  if (detailStatCapacity) detailStatCapacity.textContent = `${usedPercent}%`;

  if (wh.racks.length === 0) {
    warehouseRacksContainer.innerHTML = `
      <div class="warehouse-empty-state">
        <div class="empty-icon">📭</div>
        <h3>Gudang Masih Kosong</h3>
        <p>Belum ada rak yang terdaftar untuk ${wh.name}. Tambahkan barang dengan lokasi rak yang sesuai.</p>
      </div>
    `;
    return;
  }

  Object.keys(rackGroups).forEach(rackKey => {
    const rackItems = rackGroups[rackKey];
    const capacity = wh.capacity[rackKey] || 100;
    const rackTotalQty = rackItems.reduce((sum, i) => sum + i.quantity, 0);
    const percent = Math.min(Math.round((rackTotalQty / capacity) * 100), 100);

    let progressClass = 'normal';
    if (percent >= 85) progressClass = 'danger';
    else if (percent >= 50) progressClass = 'warning';

    const rackCard = document.createElement('div');
    rackCard.className = 'rack-card';

    let itemsHtml = '';
    if (rackItems.length === 0) {
      itemsHtml = `<div class="rack-empty-msg">Tidak ada barang di Rak ${rackKey}</div>`;
    } else {
      itemsHtml = rackItems.map(item => `
        <div class="rack-item-row">
          <div class="rack-item-name" title="${item.name}">
            ${item.name}
            <span class="rack-item-sku">${item.sku}</span>
          </div>
          <div class="rack-item-qty ${item.quantity <= item.minStock ? 'qty-low' : ''}">${item.quantity} pcs</div>
        </div>
      `).join('');
    }

    rackCard.innerHTML = `
      <div class="rack-header">
        <span class="rack-title">Rak ${rackKey}</span>
        <span class="rack-capacity-label">${rackTotalQty} / ${capacity} Unit</span>
      </div>
      <div class="rack-bar-wrapper">
        <div class="rack-bar-container">
          <div class="rack-bar-fill ${progressClass}" style="width: ${percent}%"></div>
        </div>
        <div style="font-size: 0.75rem; text-align: right; color: var(--text-secondary); font-weight: 600;">${percent}% Terisi</div>
      </div>
      <div class="rack-items-list">
        ${itemsHtml}
      </div>
    `;

    warehouseRacksContainer.appendChild(rackCard);
  });
}

// Render dynamic User accounts table for Managers
function renderUsersTable() {
  if (!usersTableBody) return;
  usersTableBody.innerHTML = '';

  registeredUsers.forEach((user) => {
    const tr = document.createElement('tr');
    const isSelf = currentUser && currentUser.email === user.email;
    
    let actionButtons = '';
    if (isSelf) {
      actionButtons = `<span style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">Sesi Aktif</span>`;
    } else {
      actionButtons = `
        <div class="actions-group">
          <button class="action-btn edit user-edit-btn" data-email="${user.email}" title="Edit User">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="action-btn delete user-delete-btn" data-email="${user.email}" title="Hapus User">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      `;
    }

    const roleBadgeClass = user.role === 'Manager' ? 'instock' : user.role === 'Supervisor' ? 'lowstock' : 'outofstock';

    tr.innerHTML = `
      <td><strong>${user.name}</strong></td>
      <td>${user.email}</td>
      <td>
        <span class="status-badge ${roleBadgeClass}">
          ${user.role}
        </span>
      </td>
      <td class="actions-col">
        ${actionButtons}
      </td>
    `;

    usersTableBody.appendChild(tr);
  });

  attachUserTableListeners();
}

// Update Top KPI numbers
function updateKPIs() {
  // 1. Total Items
  kpiTotalItems.textContent = items.length;

  // 2. Total Value
  const totalVal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  kpiTotalValue.textContent = formatCurrency(totalVal);

  // 3. Low Stock Items count
  const lowStockItems = items.filter(item => item.quantity <= item.minStock);
  kpiLowStock.textContent = lowStockItems.length;
  kpiLowStockDesc.textContent = lowStockItems.length > 0 
    ? `${lowStockItems.length} item di bawah batas aman.` 
    : 'Semua stok aman dan tercukupi.';

  // 4. Warehouse Capacity Utilization
  const currentTotalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const capacityPercent = Math.min(Math.round((currentTotalQuantity / TOTAL_STORAGE_SLOTS) * 100), 100);
  kpiCapacity.textContent = `${capacityPercent}%`;
  kpiCapacityBar.style.width = `${capacityPercent}%`;
}

// Render Top 5 Items Bar Chart
function renderChart() {
  stockChart.innerHTML = '';
  
  // Sort items by quantity descending and take top 5
  const topItems = [...items]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  if (topItems.length === 0) {
    stockChart.innerHTML = `<div style="color: var(--text-muted); font-size: 0.95rem; text-align: center; margin: auto; padding: 20px;">Belum ada data barang untuk ditampilkan.</div>`;
    return;
  }

  const maxQty = Math.max(...topItems.map(i => i.quantity), 1);

  topItems.forEach(item => {
    const percentage = (item.quantity / maxQty) * 100;
    const barWrapper = document.createElement('div');
    barWrapper.className = 'chart-bar-wrapper';

    barWrapper.innerHTML = `
      <span class="chart-bar-val">${item.quantity}</span>
      <div class="chart-bar-container">
        <div class="chart-bar-fill" style="height: ${percentage}%"></div>
      </div>
      <span class="chart-bar-label" title="${item.name}">${item.name}</span>
    `;
    stockChart.appendChild(barWrapper);
  });
}

// Render Recent Activity Logs
function renderTransactions() {
  transactionLog.innerHTML = '';
  
  const displayTrx = transactions.slice(0, 5); // Display top 5

  if (displayTrx.length === 0) {
    transactionLog.innerHTML = `<div style="color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 20px;">Belum ada log aktivitas.</div>`;
    return;
  }

  displayTrx.forEach(trx => {
    const itemEl = document.createElement('div');
    itemEl.className = 'transaction-item';

    const isStockIn = trx.type === 'in';
    const typeClass = isStockIn ? 'in' : 'out';
    const typeLabel = isStockIn ? 'Stok Masuk' : 'Stok Keluar';
    
    // SVG icon selection (In vs Out arrow)
    const iconSvg = isStockIn 
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="17 11 12 6 7 11"/><line x1="12" y1="18" x2="12" y2="6"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="7 13 12 18 17 13"/><line x1="12" y1="6" x2="12" y2="18"/></svg>`;

    itemEl.innerHTML = `
      <div class="activity-icon-wrapper ${typeClass}">
        ${iconSvg}
      </div>
      <div class="activity-details">
        <div class="activity-text"><span>${trx.itemName}</span> (${typeLabel})</div>
        <div class="activity-time">${trx.timestamp}</div>
      </div>
      <div class="activity-qty ${typeClass}">
        ${isStockIn ? '+' : '-'}${trx.quantity}
      </div>
    `;

    transactionLog.appendChild(itemEl);
  });
}

// Render Main Inventory Table with Filters/Search
function renderInventoryTable() {
  inventoryTableBody.innerHTML = '';
  
  const searchVal = globalSearch.value.trim().toLowerCase();
  const categoryVal = filterCategory.value;
  const statusVal = filterStatus.value;

  // Perform filtration
  const filteredItems = items.filter(item => {
    // 1. Search Query Match
    const matchesSearch = item.name.toLowerCase().includes(searchVal) || item.sku.toLowerCase().includes(searchVal);
    
    // 2. Category Match
    const matchesCategory = categoryVal === 'all' || item.category === categoryVal;

    // 3. Status Match
    let matchesStatus = true;
    if (statusVal === 'instock') {
      matchesStatus = item.quantity > item.minStock;
    } else if (statusVal === 'lowstock') {
      matchesStatus = item.quantity <= item.minStock && item.quantity > 0;
    } else if (statusVal === 'outofstock') {
      matchesStatus = item.quantity === 0;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Display counters
  filteredCount.textContent = filteredItems.length;
  totalCount.textContent = items.length;

  if (filteredItems.length === 0) {
    inventoryTableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 40px;">
          Barang tidak ditemukan. Coba sesuaikan kata pencarian atau kategori filter Anda.
        </td>
      </tr>
    `;
    return;
  }

  filteredItems.forEach(item => {
    const tr = document.createElement('tr');
    
    const statusClass = getStockStatusClass(item.quantity, item.minStock);
    const statusLabel = getStockStatusLabel(item.quantity, item.minStock);

    tr.innerHTML = `
      <td>
        <div class="item-name-cell">
          <span class="item-title">${item.name}</span>
          <span class="item-sku">${item.sku}</span>
        </div>
      </td>
      <td>${item.category}</td>
      <td>${item.location}</td>
      <td class="item-price-cell">${formatCurrency(item.price)}</td>
      <td>
        <div class="item-qty-container">
          <button class="qty-adjust-btn minus" data-id="${item.id}" title="Kurangi 1 Stok">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <span class="item-qty-value">${item.quantity}</span>
          <button class="qty-adjust-btn plus" data-id="${item.id}" title="Tambah 1 Stok">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
      </td>
      <td>
        <span class="status-badge ${statusClass}">${statusLabel}</span>
      </td>
      <td class="actions-col">
        <div class="actions-group">
          <button class="action-btn edit" data-id="${item.id}" title="Edit Detail Barang">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="action-btn delete" data-id="${item.id}" title="Hapus Barang">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      </td>
    `;

    inventoryTableBody.appendChild(tr);
  });

  // Attach dynamic event listeners to inside buttons
  attachTableRowListeners();
}

// ==========================================================================
// 5. Action Handlers (CRUD & Adjust Stock)
// ==========================================================================

// Plus / Minus Quantity Buttons Inside Table Row
function attachTableRowListeners() {
  // Quantity increment
  document.querySelectorAll('.qty-adjust-btn.plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      adjustStock(id, 1);
    });
  });

  // Quantity decrement
  document.querySelectorAll('.qty-adjust-btn.minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      adjustStock(id, -1);
    });
  });

  // Edit item details
  document.querySelectorAll('.action-btn.edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      openModal(id);
    });
  });

  // Delete item row
  document.querySelectorAll('.action-btn.delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      deleteItem(id);
    });
  });
}

function adjustStock(id, amount) {
  const item = items.find(i => i.id === id);
  if (!item) return;

  const newQty = item.quantity + amount;
  if (newQty < 0) {
    showToast('Stok tidak boleh kurang dari 0!', 'warning');
    return;
  }

  const type = amount > 0 ? 'in' : 'out';
  fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId: id, type, quantity: Math.abs(amount) })
  })
  .then(res => { if (!res.ok) throw new Error('Gagal memperbarui stok'); return res.json(); })
  .then(() => {
    showToast(`Stok ${item.name} diperbarui (${amount > 0 ? '+' : ''}${amount})`, 'success');
    refreshData();
  })
  .catch(err => showToast(err.message, 'error'));
}

function deleteItem(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  
  if (confirm(`Apakah Anda yakin ingin menghapus "${item.name}" dari daftar inventaris gudang?`)) {
    fetch(`/api/items/${id}`, { method: 'DELETE' })
    .then(res => { if (!res.ok) throw new Error('Gagal menghapus barang'); return res.json(); })
    .then(() => {
      showToast(`Barang "${item.name}" berhasil dihapus.`, 'info');
      refreshData();
    })
    .catch(err => showToast(err.message, 'error'));
  }
}

// Modal Form handling
function openModal(editingId = null) {
  itemForm.reset();
  // Reset rack dropdown state
  if (inputLocationRack) {
    inputLocationRack.innerHTML = '<option value="">-- Pilih Rak --</option>';
    inputLocationRack.disabled = true;
  }

  // Always populate warehouse dropdown fresh
  populateWarehouseDropdown();

  if (editingId) {
    // EDIT MODE
    const item = items.find(i => i.id === editingId);
    if (!item) return;

    modalTitle.textContent = 'Edit Detail Barang';
    saveItemBtn.textContent = 'Simpan Perubahan';

    // Populate basic fields
    formItemId.value = item.id;
    inputName.value = item.name;
    inputSku.value = item.sku;
    inputCategory.value = item.category;
    inputPrice.value = item.price;
    inputQuantity.value = item.quantity;
    inputThreshold.value = item.minStock;

    // Parse and pre-select location dropdowns
    const { whId, rack, slot } = parseLocationString(item.location);
    populateWarehouseDropdown(whId);
    populateRackDropdown(whId, rack);
    if (inputLocationSlot) inputLocationSlot.value = slot;

    // Disable initial quantity field to prevent transaction confusion during raw edits
    inputQuantity.disabled = true;
    // Hide date field on edit mode
    if (inputDateGroup) inputDateGroup.style.display = 'none';
    if (inputDate) inputDate.required = false;
  } else {
    // ADD MODE
    modalTitle.textContent = 'Tambah Barang Baru';
    saveItemBtn.textContent = 'Tambah Barang';
    formItemId.value = '';
    inputQuantity.disabled = false;
    // Show and auto-fill date field on add mode
    if (inputDateGroup) inputDateGroup.style.display = '';
    if (inputDate) {
      inputDate.required = true;
      inputDate.value = getCurrentDatetimeLocal();
    }
  }

  itemModal.classList.add('active');
}

function closeModal() {
  itemModal.classList.remove('active');
  itemForm.reset();
}

// Form Submission Event
itemForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const id = formItemId.value;
  const name = inputName.value.trim();
  const sku = inputSku.value.trim().toUpperCase();
  const category = inputCategory.value;
  const location = composeLocationString();
  const price = parseFloat(inputPrice.value);
  const minStock = parseInt(inputThreshold.value);

  // Validate location
  if (!location) {
    showToast('Pilih gudang dan rak terlebih dahulu.', 'warning');
    return;
  }

  // Validate duplicate SKU (only check others if editing)
  const duplicateSku = items.find(i => i.sku === sku && i.id !== id);
  if (duplicateSku) {
    showToast(`Gagal: SKU "${sku}" sudah terdaftar untuk barang "${duplicateSku.name}".`, 'error');
    return;
  }

  const warehouse_id = inputLocationWarehouse.value;
  const rack_letter = inputLocationRack.value;
  const slot = inputLocationSlot.value.trim() || null;

  if (id) {
    // Edit item execution (AJAX)
    fetch(`/api/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, sku, category, price, minStock, warehouse_id, rack_letter, slot })
    })
    .then(res => {
      if (!res.ok) throw new Error('Gagal memperbarui barang');
      return res.json();
    })
    .then(() => {
      showToast(`Barang "${name}" berhasil diubah.`, 'success');
      closeModal();
      refreshData();
    })
    .catch(err => showToast(err.message, 'error'));
  } else {
    // Add item execution (AJAX)
    const quantity = parseInt(inputQuantity.value) || 0;
    const newId = `item-${Date.now()}`;
    const customDate = inputDate ? inputDate.value : '';

    fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: newId, name, sku, category, price, quantity, minStock, warehouse_id, rack_letter, slot, customDate })
    })
    .then(res => {
      if (!res.ok) throw new Error('Gagal menambahkan barang');
      return res.json();
    })
    .then(() => {
      showToast(`Barang "${name}" berhasil ditambahkan ke inventaris.`, 'success');
      closeModal();
      refreshData();
    })
    .catch(err => showToast(err.message, 'error'));
  }
});

// ==========================================================================
// 6. Navigation and Application Control
// ==========================================================================

// Theme Loading & Switching
function initTheme() {
  const activeTheme = localStorage.getItem('sv_theme') || 'light';
  document.documentElement.setAttribute('data-theme', activeTheme);
}

themeToggle.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('sv_theme', newTheme);
  showToast(`Mode visual diubah ke tema ${newTheme === 'dark' ? 'Gelap' : 'Terang'}`, 'info');
});

// Tab Switching Listener
tabButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const activeTab = btn.getAttribute('data-tab');

    // Switch menu button class
    tabButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Switch content tab class
    tabContents.forEach(content => {
      content.classList.remove('active');
      if (content.id === `${activeTab}-tab`) {
        content.classList.add('active');
      }
    });

    // Update Header Text dynamically
    if (activeTab === 'dashboard') {
      pageTitle.textContent = 'Dashboard Overview';
      pageSubtitle.textContent = 'Ringkasan status inventaris gudang real-time.';
      globalSearch.placeholder = "Cari barang atau SKU...";
    } else if (activeTab === 'inventory') {
      pageTitle.textContent = 'Daftar Barang Gudang';
      pageSubtitle.textContent = 'Lihat, kelola, dan perbarui seluruh inventaris barang Anda.';
      globalSearch.placeholder = "Ketik nama barang / SKU untuk mencari...";
    } else if (activeTab === 'stockout') {
      pageTitle.textContent = 'Keluar Barang';
      pageSubtitle.textContent = 'Formulir pencatatan barang keluar (Stock Out) dari gudang.';
      if (stockoutDate) stockoutDate.value = getCurrentDatetimeLocal();
    } else if (activeTab === 'warehouse') {
      pageTitle.textContent = 'Manajemen Gudang';
      pageSubtitle.textContent = 'Pilih gudang untuk melihat detail rak dan inventaris barang di dalamnya.';
      // Always reset to warehouse list view when switching to this tab
      activeWarehouseId = null;
      if (warehouseListView) warehouseListView.classList.remove('hidden');
      if (warehouseDetailView) warehouseDetailView.classList.add('hidden');
      renderWarehouseList();
    } else if (activeTab === 'users') {
      pageTitle.textContent = 'Kelola Pengguna';
      pageSubtitle.textContent = 'Manajemen akun Supervisor dan Staff Admin (Khusus Manager).';
    }
  });
});

// Warehouse back-navigation button
if (backToWarehousesBtn) {
  backToWarehousesBtn.addEventListener('click', () => backToWarehouseList());
}

// Search inputs & Filtering Event triggers
globalSearch.addEventListener('input', () => {
  const activeTabBtn = document.querySelector('.menu-item.active');
  const currentTab = activeTabBtn ? activeTabBtn.getAttribute('data-tab') : '';
  if (currentTab !== 'inventory' && globalSearch.value.trim() !== '') {
    const invTabBtn = document.querySelector('.menu-item[data-tab="inventory"]');
    if (invTabBtn) invTabBtn.click();
  }
  renderInventoryTable();
});

filterCategory.addEventListener('change', renderInventoryTable);
filterStatus.addEventListener('change', renderInventoryTable);

// Modal listeners for Items
quickAddBtn.addEventListener('click', () => openModal());
closeModalBtn.addEventListener('click', closeModal);
cancelFormBtn.addEventListener('click', closeModal);

// Close modal when clicking on outside background overlay
window.addEventListener('click', (e) => {
  if (e.target === itemModal) {
    closeModal();
  }
  if (e.target === userModal) {
    closeUserModal();
  }
  if (e.target === warehouseModal) {
    closeWarehouseModal();
  }
});

// ==========================================================================
// 7. Stock In & Stock Out Form Listeners
// ==========================================================================

// Submit Transaksi Keluar Barang
stockoutForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const itemId = stockoutItemSelect.value;
  const qty = parseInt(stockoutQty.value);
  const recipient = stockoutRecipient.value.trim();
  const notes = stockoutNotes.value.trim();
  const customDate = stockoutDate ? stockoutDate.value : '';

  const item = items.find(i => i.id === itemId);
  if (!item) return;

  // Check if quantity is sufficient
  if (qty > item.quantity) {
    showToast(`Transaksi Gagal: Stok tidak mencukupi. Stok saat ini ${item.quantity} unit.`, 'error');
    return;
  }

  fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId, type: 'out', quantity: qty, customDate })
  })
  .then(res => {
    if (!res.ok) throw new Error('Gagal memproses transaksi');
    return res.json();
  })
  .then(() => {
    showToast(`Stok ${item.name} berhasil dikeluarkan sebesar -${qty} unit.`, 'success');
    stockoutForm.reset();
    if (stockoutDate) stockoutDate.value = getCurrentDatetimeLocal();
    refreshData();
  })
  .catch(err => showToast(err.message, 'error'));
});


// ==========================================================================
// 8. User Management CRUD Listeners & Modal Functions
// ==========================================================================

function openUserModal(editingEmail = null) {
  userForm.reset();
  
  if (editingEmail) {
    const user = registeredUsers.find(u => u.email === editingEmail);
    if (!user) return;

    userModalTitle.textContent = 'Ubah Akun Pengguna';
    saveUserBtn.textContent = 'Simpan Perubahan';
    
    formUserId.value = user.email; // hidden ID
    userNameInput.value = user.name;
    userEmailInput.value = user.email;
    userRoleInput.value = user.role;
    userPasswordInput.value = user.password;
  } else {
    userModalTitle.textContent = 'Tambah User Baru';
    saveUserBtn.textContent = 'Tambah User';
    formUserId.value = '';
  }

  userModal.classList.add('active');
}

function closeUserModal() {
  userModal.classList.remove('active');
  userForm.reset();
}

function attachUserTableListeners() {
  // Edit User Button
  document.querySelectorAll('.user-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const email = btn.getAttribute('data-email');
      openUserModal(email);
    });
  });

  // Delete User Button
  document.querySelectorAll('.user-delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const email = btn.getAttribute('data-email');
      const user = registeredUsers.find(u => u.email === email);
      if (!user) return;

      if (confirm(`Apakah Anda yakin ingin menghapus pengguna "${user.name}" (${user.role})?`)) {
        fetch(`/api/users/${encodeURIComponent(email)}`, { method: 'DELETE' })
        .then(res => { if (!res.ok) throw new Error('Gagal menghapus user'); return res.json(); })
        .then(() => {
          showToast(`Pengguna "${user.name}" berhasil dihapus.`, 'info');
          refreshData();
        })
        .catch(err => showToast(err.message, 'error'));
      }
    });
  });
}

// User form buttons
addUserBtn.addEventListener('click', () => openUserModal());
closeUserModalBtn.addEventListener('click', closeUserModal);
cancelUserBtn.addEventListener('click', closeUserModal);

// User form submit
userForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = formUserId.value; // old email
  const name = userNameInput.value.trim();
  const email = userEmailInput.value.trim().toLowerCase();
  const role = userRoleInput.value;
  const password = userPasswordInput.value;

  if (id) {
    // Edit User (AJAX)
    fetch(`/api/users/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, role, password })
    })
    .then(res => { if (!res.ok) throw new Error('Gagal memperbarui pengguna'); return res.json(); })
    .then(() => {
      showToast(`Pengguna "${name}" berhasil diubah.`, 'success');
      closeUserModal();
      refreshData();
    })
    .catch(err => showToast(err.message, 'error'));
  } else {
    // Add User (AJAX)
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, role, password })
    })
    .then(res => { if (!res.ok) throw new Error('Gagal menambahkan pengguna'); return res.json(); })
    .then(() => {
      showToast(`Pengguna baru "${name}" berhasil ditambahkan.`, 'success');
      closeUserModal();
      refreshData();
    })
    .catch(err => showToast(err.message, 'error'));
  }
});

// ==========================================================================
// 8.5. Warehouse Management (Add, Edit, Delete Warehouses & Racks)
// ==========================================================================

function openWarehouseModal(editingId = null) {
  warehouseForm.reset();
  if (warehouseRacksRowsContainer) {
    warehouseRacksRowsContainer.innerHTML = '';
  }

  if (editingId) {
    // EDIT MODE
    const wh = WAREHOUSES.find(w => w.id === editingId);
    if (!wh) return;

    warehouseModalTitle.textContent = 'Edit Detail Gudang & Rak';
    saveWarehouseBtn.textContent = 'Simpan Perubahan';

    formWarehouseId.value = wh.id;
    warehouseNameInput.value = wh.name;
    warehouseDescriptionInput.value = wh.description;
    warehouseColorSelect.value = wh.color;

    // Populate racks
    wh.racks.forEach(rackLetter => {
      const cap = wh.capacity[rackLetter] || 100;
      addRackRow(rackLetter, cap);
    });
  } else {
    // ADD MODE
    warehouseModalTitle.textContent = 'Tambah Gudang Baru';
    saveWarehouseBtn.textContent = 'Tambah Gudang';
    formWarehouseId.value = '';
    
    // Add one empty rack row by default
    addRackRow('', 100);
  }

  warehouseModal.classList.add('active');
}

function closeWarehouseModal() {
  warehouseModal.classList.remove('active');
  warehouseForm.reset();
}

function addRackRow(rackLetter = '', capacity = 100) {
  // Determine which warehouse is being edited (from the hidden form field)
  const editingWhId = formWarehouseId ? formWarehouseId.value : '';
  const isExisting = rackLetter !== '';
  // Only lock if this rack letter has items IN this specific warehouse
  const rackHasItems = isExisting && items.some(item => {
    const { whId, rack } = parseLocationString(item.location);
    return whId === editingWhId && rack === rackLetter.toUpperCase();
  });

  const div = document.createElement('div');
  div.className = 'rack-form-row';
  div.innerHTML = `
    <div class="form-group">
      <label>Nama / Huruf Rak</label>
      <input type="text" class="rack-letter-input" placeholder="Contoh: A" maxlength="3" required value="${rackLetter}" style="text-transform: uppercase;" ${rackHasItems ? 'readonly title="Tidak bisa mengubah nama rak yang sedang digunakan"' : ''}>
    </div>
    <div class="form-group">
      <label>Kapasitas (Unit)</label>
      <input type="number" class="rack-capacity-input" placeholder="Contoh: 150" min="1" required value="${capacity}">
    </div>
    ${rackHasItems 
      ? '<div style="width: 32px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: var(--text-muted);" title="Rak berisi barang (tidak bisa dihapus)">🔒</div>'
      : '<button type="button" class="btn-remove-rack-row" title="Hapus Rak">&times;</button>'
    }
  `;

  if (!rackHasItems) {
    div.querySelector('.btn-remove-rack-row').addEventListener('click', () => {
      const currentLetter = div.querySelector('.rack-letter-input').value.trim().toUpperCase();
      // Only block removal if items exist in THIS warehouse's rack
      const inUse = currentLetter && items.some(item => {
        const { whId, rack } = parseLocationString(item.location);
        return whId === editingWhId && rack === currentLetter;
      });
      if (inUse) {
        showToast(`Gagal: Rak ${currentLetter} masih memiliki barang di dalamnya. Kosongkan rak terlebih dahulu!`, 'error');
        return;
      }
      div.remove();
    });
  }

  warehouseRacksRowsContainer.appendChild(div);
}

// Add event listeners for Warehouse Management actions
if (addWarehouseBtn) {
  addWarehouseBtn.addEventListener('click', () => openWarehouseModal());
}

if (editWarehouseBtn) {
  editWarehouseBtn.addEventListener('click', () => openWarehouseModal(activeWarehouseId));
}

if (closeWarehouseModalBtn) {
  closeWarehouseModalBtn.addEventListener('click', closeWarehouseModal);
}

if (cancelWarehouseFormBtn) {
  cancelWarehouseFormBtn.addEventListener('click', closeWarehouseModal);
}

if (addRackRowBtn) {
  addRackRowBtn.addEventListener('click', () => addRackRow());
}

// Submit Form Gudang
if (warehouseForm) {
  warehouseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = formWarehouseId.value;
    const name = warehouseNameInput.value.trim();
    const description = warehouseDescriptionInput.value.trim();
    const color = warehouseColorSelect.value;

    const rackRows = warehouseRacksRowsContainer.querySelectorAll('.rack-form-row');
    const newRacks = [];
    const newCapacity = {};
    const checkedLetters = new Set();

    for (const row of rackRows) {
      const letterInput = row.querySelector('.rack-letter-input');
      const capacityInput = row.querySelector('.rack-capacity-input');
      const letter = letterInput.value.trim().toUpperCase();
      const capacity = parseInt(capacityInput.value);

      if (!letter || !/^[A-Z0-9]{1,3}$/.test(letter)) {
        showToast('Nama rak harus berupa 1-3 karakter huruf atau angka (A-Z, 0-9).', 'warning');
        letterInput.focus();
        return;
      }

      if (checkedLetters.has(letter)) {
        showToast(`Gagal: Nama rak "${letter}" ditulis ganda di form ini.`, 'warning');
        letterInput.focus();
        return;
      }
      checkedLetters.add(letter);
      // Note: Same rack name in DIFFERENT warehouses is allowed.

      newRacks.push(letter);
      newCapacity[letter] = capacity;
    }

    if (id) {
      // EDIT WAREHOUSE (AJAX)
      const wh = WAREHOUSES.find(w => w.id === id);
      if (!wh) return;

      const deletedRacks = wh.racks.filter(r => !newRacks.includes(r));
      for (const dr of deletedRacks) {
        const rackHasItems = items.some(item => {
          const { whId, rack } = parseLocationString(item.location);
          return whId === id && rack === dr;
        });
        if (rackHasItems) {
          showToast(`Gagal: Rak "${dr}" tidak boleh dihapus karena masih berisi barang di gudang ini.`, 'error');
          return;
        }
      }

      fetch(`/api/warehouses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, color, racks: newRacks, capacity: newCapacity })
      })
      .then(res => { if (!res.ok) throw new Error('Gagal memperbarui gudang'); return res.json(); })
      .then(() => {
        showToast(`Gudang "${name}" berhasil diperbarui.`, 'success');
        closeWarehouseModal();
        refreshData().then(() => {
          if (activeWarehouseId && activeWarehouseId === id) openWarehouseDetail(activeWarehouseId);
        });
      })
      .catch(err => showToast(err.message, 'error'));
    } else {
      // ADD WAREHOUSE (AJAX)
      const newId = `wh-${Date.now()}`;
      fetch('/api/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: newId, name, description, color, racks: newRacks, capacity: newCapacity })
      })
      .then(res => { if (!res.ok) throw new Error('Gagal menambahkan gudang'); return res.json(); })
      .then(() => {
        showToast(`Gudang baru "${name}" berhasil ditambahkan.`, 'success');
        closeWarehouseModal();
        refreshData();
      })
      .catch(err => showToast(err.message, 'error'));
    }
  });
}

// Delete Warehouse Button click handler
if (deleteWarehouseBtn) {
  deleteWarehouseBtn.addEventListener('click', () => {
    if (!activeWarehouseId) return;

    const wh = WAREHOUSES.find(w => w.id === activeWarehouseId);
    if (!wh) return;

    const whItems = items.filter(item => {
      const { whId } = parseLocationString(item.location);
      return whId === activeWarehouseId;
    });

    if (whItems.length > 0) {
      showToast(`Gagal: Gudang "${wh.name}" tidak dapat dihapus karena masih berisi barang di raknya. Kosongkan/pindahkan barang terlebih dahulu!`, 'error');
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus "${wh.name}" secara permanen dari sistem?`)) {
      fetch(`/api/warehouses/${activeWarehouseId}`, { method: 'DELETE' })
      .then(res => { if (!res.ok) throw new Error('Gagal menghapus gudang'); return res.json(); })
      .then(() => {
        showToast('Gudang berhasil dihapus.', 'info');
        backToWarehouseList();
        refreshData();
      })
      .catch(err => showToast(err.message, 'error'));
    }
  });
}

// ==========================================================================================================
// 9. Authentication & Session Control
// ==========================================================================

// Switch to Register Form
toRegisterBtn.addEventListener('click', (e) => {
  e.preventDefault();
  loginFormWrapper.classList.remove('active');
  registerFormWrapper.classList.add('active');
  registerForm.reset();
});

// Switch to Login Form
toLoginBtn.addEventListener('click', (e) => {
  e.preventDefault();
  registerFormWrapper.classList.remove('active');
  loginFormWrapper.classList.add('active');
  loginForm.reset();
});

// Login Form Submit
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = loginEmail.value.trim().toLowerCase();
  const password = loginPassword.value;

  fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  .then(res => {
    if (!res.ok) throw new Error('Email atau kata sandi salah. Silakan coba lagi.');
    return res.json();
  })
  .then(user => {
    currentUser = user;
    saveData();
    checkSession();
    showToast(`Selamat datang kembali, ${user.name}! (${user.role})`, 'success');
  })
  .catch(err => showToast(err.message, 'error'));
});

// Register Form Submit (Sign up open form)
registerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = registerName.value.trim();
  const email = registerEmail.value.trim().toLowerCase();
  const role = registerRole.value;
  const password = registerPassword.value;

  fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, role, password })
  })
  .then(res => { if (!res.ok) return res.json().then(d => { throw new Error(d.error || 'Gagal mendaftar'); }); return res.json(); })
  .then(() => {
    showToast('Akun berhasil dibuat! Silakan masuk.', 'success');
    registerFormWrapper.classList.remove('active');
    loginFormWrapper.classList.add('active');
    loginForm.reset();
    loginEmail.value = email;
  })
  .catch(err => showToast(err.message, 'error'));
});

// Logout Event Listener
sidebarLogout.addEventListener('click', (e) => {
  e.preventDefault();
  if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
    currentUser = null;
    saveData();
    checkSession();
    showToast('Sesi Anda telah berakhir. Sampai jumpa!', 'info');
  }
});

// Session Checker and Role UI Apply
async function checkSession() {
  if (currentUser) {
    authContainer.style.display = 'none';
    appContainer.style.display = 'grid';

    document.body.className = ''; // Reset classes
    
    let roleClass = 'role-manager';
    if (currentUser.role === 'Supervisor') {
      roleClass = 'role-supervisor';
    } else if (currentUser.role === 'Staff Admin') {
      roleClass = 'role-staff';
    }
    document.body.classList.add(roleClass);

    // Populate Dynamic Profile Info in Header
    const avatarInitials = currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    document.querySelector('.avatar').textContent = avatarInitials;
    document.querySelector('.profile-name').textContent = currentUser.name;
    document.querySelector('.profile-role').textContent = currentUser.role;

    // Role-based redirect logic
    const activeTabBtn = document.querySelector('.menu-item.active');
    const activeTab = activeTabBtn ? activeTabBtn.getAttribute('data-tab') : 'dashboard';

    if (currentUser.role === 'Staff Admin') {
      // Staff can only access: inventory, stockin, stockout
      if (activeTab === 'dashboard' || activeTab === 'warehouse' || activeTab === 'users') {
        const invTabBtn = document.getElementById('menu-inventory-link');
        if (invTabBtn) invTabBtn.click();
      }
    } else if (currentUser.role === 'Supervisor') {
      // Supervisor cannot access: users
      if (activeTab === 'users') {
        const dashTabBtn = document.getElementById('menu-dashboard-link');
        if (dashTabBtn) dashTabBtn.click();
      }
    } else {
      // Manager has access to everything
    }

    updateUI();
    await loadAllData();
    updateUI();
  } else {
    authContainer.style.display = 'flex';
    appContainer.style.display = 'none';
    document.body.className = '';
    
    loginFormWrapper.classList.add('active');
    registerFormWrapper.classList.remove('active');
    loginForm.reset();
  }
}

// ==========================================================================
// 10. App Initialization
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  checkSession();
  if (stockoutDate) stockoutDate.value = getCurrentDatetimeLocal();
});
