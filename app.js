// State data awal
let products = [
    { id: 1, name: 'Beras Medium 5kg', price: 65000, stock: 20, category: 'Sembako', barcode: '899123456001', minStock: 5, unit: 'sak' },
    { id: 2, name: 'Minyak Goreng 1L', price: 16000, stock: 15, category: 'Minyak', barcode: '899123456002', minStock: 4, unit: 'pouch' },
    { id: 3, name: 'Sak Gula Pasir 50kg', price: 875000, stock: 5, category: 'Sembako', barcode: '899123456003', minStock: 2, unit: 'sak' }
];

let cart = [];
let transactions = [];
let users = [
    { username: 'admin', password: 'admin123', role: 'admin' }
];
let currentUser = null;
let settings = {
    storeName: 'Toko Sembako',
    printerEnabled: false,
    lowStockAlert: true
};

// ==========================================
// FUNGSI KHUSUS FORMAT RUPIAH & ANGKA BESAR
// ==========================================

// Format angka ke format tampilan Rupiah (Pasti ada pemisah titik: 875.000)
function formatRupiah(amount) {
    const num = Math.round(Number(amount) || 0);
    const formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return 'Rp ' + formatted;
}

// Membersihkan input teks: hapus titik/koma/spasi agar tersimpan nilai murni (875.000 -> 875000)
function parseRupiah(value) {
    if (!value && value !== 0) return 0;
    const cleanNumber = String(value).replace(/[^0-9]/g, '');
    return parseInt(cleanNumber, 10) || 0;
}

// Memberikan format titik otomatis saat user mengetik di form
function autoFormatRupiahInput(input) {
    const val = parseRupiah(input.value);
    input.value = val > 0 ? val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : '';
}

// Format tanggal ISO (YYYY-MM-DD)
function getTodayDateString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ==========================================
// PENYIMPANAN LOCALSTORAGE
// ==========================================

function loadData() {
    const savedProducts = localStorage.getItem('kasir_products');
    const savedTransactions = localStorage.getItem('kasir_transactions');
    const savedUsers = localStorage.getItem('kasir_users');
    const savedSettings = localStorage.getItem('kasir_settings');
    const savedUser = localStorage.getItem('kasir_current_user');
    
    if (savedProducts) {
        try {
            products = JSON.parse(savedProducts);
        } catch (e) {
            console.error('Gagal membaca data produk:', e);
        }
    }
    if (savedTransactions) transactions = JSON.parse(savedTransactions);
    if (savedUsers) users = JSON.parse(savedUsers);
    if (savedSettings) settings = JSON.parse(savedSettings);
    if (savedUser) currentUser = JSON.parse(savedUser);
}

function saveData() {
    localStorage.setItem('kasir_products', JSON.stringify(products));
    localStorage.setItem('kasir_transactions', JSON.stringify(transactions));
    localStorage.setItem('kasir_users', JSON.stringify(users));
    localStorage.setItem('kasir_settings', JSON.stringify(settings));
    if (currentUser) {
        localStorage.setItem('kasir_current_user', JSON.stringify(currentUser));
    }
}

// ==========================================
// AUTH & LOGIN
// ==========================================

function checkLogin() {
    if (!currentUser) {
        showLoginForm();
        return false;
    }
    return true;
}

function showLoginForm() {
    const container = document.getElementById('mainContainer');
    container.innerHTML = `
        <div class="header">
            <div class="header-content">
                <div class="title">🔐 Login Kasir</div>
            </div>
        </div>
        <div class="content">
            <div class="cart-container" style="max-width: 400px; margin: 40px auto;">
                <div class="cart-title">Masuk ke Sistem</div>
                <div style="margin-bottom: 12px;">
                    <label style="display: block; margin-bottom: 4px; font-weight: 600;">Username</label>
                    <input type="text" id="loginUsername" class="payment-input" placeholder="admin" style="margin-bottom: 0;">
                </div>
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 4px; font-weight: 600;">Password</label>
                    <input type="password" id="loginPassword" class="payment-input" placeholder="****" style="margin-bottom: 0;">
                </div>
                <button class="pay-btn" onclick="login()">🔓 LOGIN</button>
                <p style="margin-top: 12px; font-size: 12px; color: #6b7280; text-align: center;">Default: admin / admin123</p>
            </div>
        </div>
    `;
}

function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = user;
        saveData();
        location.reload();
    } else {
        alert('Username atau password salah!');
    }
}

function logout() {
    if (confirm('Yakin ingin logout?')) {
        currentUser = null;
        localStorage.removeItem('kasir_current_user');
        location.reload();
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'warning' ? '#f59e0b' : '#10b981'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        z-index: 9999;
        max-width: 90%;
        text-align: center;
        font-weight: 600;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 4000);
}

function toggleMenu() {
    const menu = document.getElementById('navMenu');
    menu.classList.toggle('active');
}

function switchTab(tab) {
    if (!checkLogin()) return;

    ['kasir', 'produk', 'laporan', 'settings'].forEach(t => {
        const el = document.getElementById(t + 'Tab');
        if (el) el.classList.add('hidden');
    });

    const activeTab = document.getElementById(tab + 'Tab');
    if (activeTab) activeTab.classList.remove('hidden');
    
    const tabs = ['kasir', 'produk', 'laporan', 'settings'];
    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach((btn, index) => {
        btn.classList.toggle('active', tabs[index] === tab);
    });
    
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.remove('active');
    
    if (tab === 'kasir') {
        checkLowStock();
        renderProducts();
        renderCart();
    } else if (tab === 'produk') {
        renderProductManagement();
    } else if (tab === 'laporan') {
        renderReport();
    } else if (tab === 'settings') {
        renderSettings();
    }
}

// ==========================================
// KASIR & PENJUALAN
// ==========================================

function checkLowStock() {
    if (!settings.lowStockAlert) return;
    const lowStockProducts = products.filter(p => p.stock <= p.minStock && p.stock > 0);
    if (lowStockProducts.length > 0) {
        const names = lowStockProducts.map(p => `${p.name} (${p.stock})`).join(', ');
        showNotification(`⚠️ Stok menipis: ${names}`, 'warning');
    }
}

function renderProducts() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm) || 
        (p.barcode && p.barcode.toLowerCase().includes(searchTerm)) ||
        p.category.toLowerCase().includes(searchTerm)
    );
    
    const productList = document.getElementById('productList');
    if (!productList) return;
    
    if (filteredProducts.length === 0) {
        productList.innerHTML = '<div class="empty-state">Tidak ada produk ditemukan.</div>';
        return;
    }
    
    productList.innerHTML = filteredProducts.map(product => `
        <div class="product-card">
            <div class="product-header">
                <div style="flex: 1;">
                    <div class="product-name">${product.name}</div>
                    <div class="product-category">${product.category} - ${product.unit}</div>
                    ${product.barcode ? `<div style="font-size: 12px; color: #9ca3af;">BARCODE: ${product.barcode}</div>` : ''}
                </div>
                <span class="stock-badge ${product.stock > product.minStock ? 'stock-high' : 'stock-low'}">
                    Stok: ${product.stock}
                </span>
            </div>
            <div class="product-footer">
                <div class="price">${formatRupiah(product.price)}</div>
                <button class="add-btn" onclick="addToCart(${product.id})" ${product.stock <= 0 ? 'disabled' : ''}>
                    ${product.stock > 0 ? '➕ Tambah' : 'Habis'}
                </button>
            </div>
        </div>
    `).join('');
}

function searchProducts() {
    renderProducts();
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const cartItem = cart.find(item => item.id === productId);
    
    if (cartItem) {
        if (cartItem.quantity < product.stock) {
            cartItem.quantity++;
        } else {
            alert('Stok barang tidak mencukupi!');
        }
    } else {
        if (product.stock > 0) {
            cart.push({ ...product, quantity: 1, discount: 0 });
        } else {
            alert('Stok barang habis!');
        }
    }
    
    renderCart();
}

function applyDiscount(productId) {
    const cartItem = cart.find(item => item.id === productId);
    if (!cartItem) return;
    
    const discount = prompt(`Diskon untuk ${cartItem.name} (%):`, cartItem.discount || 0);
    if (discount === null) return;
    
    const discountNum = parseFloat(discount) || 0;
    if (discountNum < 0 || discountNum > 100) {
        alert('Diskon harus antara 0% - 100%!');
        return;
    }
    
    cartItem.discount = discountNum;
    renderCart();
}

function updateQuantity(productId, change) {
    const cartItem = cart.find(item => item.id === productId);
    const product = products.find(p => p.id === productId);
    if (!cartItem || !product) return;
    
    if (cartItem.quantity + change > product.stock) {
        alert('Stok tidak mencukupi!');
        return;
    }
    
    if (cartItem.quantity + change <= 0) {
        removeFromCart(productId);
    } else {
        cartItem.quantity += change;
    }
    
    renderCart();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    renderCart();
}

function getTotal() {
    return cart.reduce((sum, item) => {
        const itemTotal = Number(item.price) * item.quantity;
        const discountAmount = itemTotal * ((item.discount || 0) / 100);
        return sum + (itemTotal - discountAmount);
    }, 0);
}

function renderCart() {
    const cartContainer = document.getElementById('cartContainer');
    if (!cartContainer) return;
    
    if (cart.length === 0) {
        cartContainer.innerHTML = '';
        return;
    }
    
    const total = getTotal();
    const totalDiscount = cart.reduce((sum, item) => {
        const itemTotal = Number(item.price) * item.quantity;
        return sum + (itemTotal * ((item.discount || 0) / 100));
    }, 0);
    
    cartContainer.innerHTML = `
        <div class="cart-container">
            <div class="cart-title">🛒 Keranjang Belanja</div>
            ${cart.map(item => {
                const itemTotal = Number(item.price) * item.quantity;
                const discountAmount = itemTotal * ((item.discount || 0) / 100);
                const finalPrice = itemTotal - discountAmount;
                
                return `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">${formatRupiah(item.price)} x ${item.quantity} ${item.unit}</div>
                        ${item.discount > 0 ? `<div style="color: #10b981; font-size: 12px;">Diskon ${item.discount}% (-${formatRupiah(discountAmount)})</div>` : ''}
                        <div style="font-weight: bold; color: #667eea;">${formatRupiah(finalPrice)}</div>
                    </div>
                    <div class="cart-controls">
                        <button class="qty-btn qty-minus" onclick="updateQuantity(${item.id}, -1)">−</button>
                        <div class="qty-display">${item.quantity}</div>
                        <button class="qty-btn qty-plus" onclick="updateQuantity(${item.id}, 1)">+</button>
                        <button class="qty-btn" onclick="applyDiscount(${item.id})" style="background: #f59e0b;">%</button>
                        <button class="qty-btn qty-delete" onclick="removeFromCart(${item.id})">🗑️</button>
                    </div>
                </div>
            `}).join('')}
            
            <div class="cart-total">
                ${totalDiscount > 0 ? `
                    <div style="display: flex; justify-content: space-between; color: #10b981; margin-bottom: 8px;">
                        <span>Total Hemat:</span>
                        <span>-${formatRupiah(totalDiscount)}</span>
                    </div>
                ` : ''}
                <div class="total-row">
                    <span>Total Bayar:</span>
                    <span class="total-amount">${formatRupiah(total)}</span>
                </div>
                <input type="text" inputmode="numeric" class="payment-input" id="paymentInput" placeholder="Masukkan Jumlah Uang Bayar" oninput="autoFormatRupiahInput(this)">
                <button class="pay-btn" onclick="processPayment()">💳 BAYAR</button>
            </div>
        </div>
    `;
}

function printReceipt(transaction) {
    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) {
        alert('Gagal membuka struk. Harap izinkan jendela pop-up di browser Anda.');
        return;
    }
    
    const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Struk #${transaction.id}</title>
            <style>
                body { font-family: monospace; padding: 20px; max-width: 320px; margin: 0 auto; }
                h2 { text-align: center; margin: 5px 0; }
                hr { border: 1px dashed #444; }
                .item { display: flex; justify-content: space-between; margin: 4px 0; }
                .total { font-weight: bold; font-size: 15px; }
                .center { text-align: center; }
            </style>
        </head>
        <body>
            <h2>${settings.storeName}</h2>
            <div class="center">${transaction.date}</div>
            <div class="center">Kasir: ${transaction.cashier}</div>
            <hr>
            ${transaction.items.map(item => {
                const itemTotal = Number(item.price) * item.quantity;
                const discount = itemTotal * (item.discount || 0) / 100;
                return `
                <div class="item">
                    <span>${item.name} x${item.quantity}</span>
                    <span>${formatRupiah(itemTotal)}</span>
                </div>
                ${item.discount > 0 ? `<div class="item" style="color: green;"><span>  Diskon ${item.discount}%</span><span>-${formatRupiah(discount)}</span></div>` : ''}
            `}).join('')}
            <hr>
            <div class="item total">
                <span>TOTAL:</span>
                <span>${formatRupiah(transaction.total)}</span>
            </div>
            <div class="item">
                <span>Bayar:</span>
                <span>${formatRupiah(transaction.payment)}</span>
            </div>
            <div class="item">
                <span>Kembali:</span>
                <span>${formatRupiah(transaction.change)}</span>
            </div>
            <hr>
            <div class="center">Terima Kasih Atas Kunjungan Anda</div>
        </body>
        </html>
    `;
    
    receiptWindow.document.write(receiptHTML);
    receiptWindow.document.close();
    
    setTimeout(() => {
        receiptWindow.focus();
        receiptWindow.print();
    }, 500);
}

function processPayment() {
    const total = getTotal();
    const paymentInput = document.getElementById('paymentInput');
    const payment = parseRupiah(paymentInput.value);
    
    if (cart.length === 0) {
        alert('Keranjang belanja masih kosong!');
        return;
    }
    
    if (payment < total) {
        alert(`Uang pembayaran kurang! Kurang ${formatRupiah(total - payment)}`);
        return;
    }
    
    const change = payment - total;
    
    cart.forEach(cartItem => {
        const product = products.find(p => p.id === cartItem.id);
        if (product) {
            product.stock = Math.max(0, product.stock - cartItem.quantity);
        }
    });
    
    const now = new Date();
    const transaction = {
        id: Date.now(),
        isoDate: getTodayDateString(),
        date: now.toLocaleString('id-ID', { 
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }),
        items: [...cart],
        total: total,
        payment: payment,
        change: change,
        cashier: currentUser ? currentUser.username : 'Kasir'
    };
    
    transactions.unshift(transaction);
    saveData();
    
    if (settings.printerEnabled) {
        printReceipt(transaction);
    }
    
    showNotification(`Pembayaran Berhasil! Kembalian: ${formatRupiah(change)}`, 'info');
    
    cart = [];
    paymentInput.value = '';
    checkLowStock();
    renderProducts();
    renderCart();
}

// ==========================================
// KELOLA PRODUK (INPUT & EDIT HARGA AMAN)
// ==========================================

function showAddProductForm() {
    const container = document.getElementById('productManagement');
    container.innerHTML = `
        <div class="cart-container" style="margin-bottom: 20px;">
            <div class="cart-title">➕ Tambah Produk Baru</div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Nama Produk *</label>
                <input type="text" id="newProductName" class="payment-input" placeholder="Contoh: Sak Gula Pasir 50kg">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Kategori *</label>
                <input type="text" id="newProductCategory" class="payment-input" placeholder="Sembako">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Barcode</label>
                <input type="text" id="newProductBarcode" class="payment-input" placeholder="Scan atau ketik kode barcode">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Harga (Rp) *</label>
                <input type="text" inputmode="numeric" id="newProductPrice" class="payment-input" placeholder="Contoh: 875000 atau 875.000" oninput="autoFormatRupiahInput(this)">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Stok Awal *</label>
                <input type="number" id="newProductStock" class="payment-input" placeholder="10">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Peringatan Stok Minimum *</label>
                <input type="number" id="newProductMinStock" class="payment-input" value="2">
            </div>
            
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Satuan *</label>
                <select id="newProductUnit" class="payment-input">
                    <option value="sak">Sak</option>
                    <option value="pcs">Pcs</option>
                    <option value="kg">Kg</option>
                    <option value="liter">Liter</option>
                    <option value="pak">Pak</option>
                    <option value="box">Box</option>
                    <option value="karton">Karton</option>
                </select>
            </div>
            
            <div style="display: flex; gap: 8px;">
                <button class="pay-btn" onclick="saveNewProduct()" style="flex: 1;">💾 Simpan</button>
                <button class="pay-btn" onclick="renderProductManagement()" style="flex: 1; background: #6b7280;">❌ Batal</button>
            </div>
        </div>
        <div id="productListManagement"></div>
    `;
    renderProductList();
}

function saveNewProduct() {
    const name = document.getElementById('newProductName').value.trim();
    const category = document.getElementById('newProductCategory').value.trim();
    const barcode = document.getElementById('newProductBarcode').value.trim();
    const price = parseRupiah(document.getElementById('newProductPrice').value);
    const stock = parseInt(document.getElementById('newProductStock').value, 10) || 0;
    const minStock = parseInt(document.getElementById('newProductMinStock').value, 10) || 1;
    const unit = document.getElementById('newProductUnit').value;
    
    if (!name) return alert('Nama produk wajib diisi!');
    if (price <= 0) return alert('Harga jual harus lebih dari 0!');
    if (stock < 0) return alert('Stok tidak boleh minus!');
    
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    
    products.push({
        id: newId,
        name: name,
        category: category || 'Umum',
        barcode: barcode,
        price: price,
        stock: stock,
        minStock: minStock,
        unit: unit
    });
    
    saveData();
    showNotification('Produk berhasil ditambahkan!', 'info');
    renderProductManagement();
}

function showEditProductForm(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Tampilkan harga yang sudah ada dengan pemisah titik
    const formattedPrice = Math.round(Number(product.price) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    
    const container = document.getElementById('productManagement');
    container.innerHTML = `
        <div class="cart-container" style="margin-bottom: 20px;">
            <div class="cart-title">✏️ Edit Produk</div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Nama Produk</label>
                <input type="text" id="editProductName" class="payment-input" value="${product.name}">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Kategori</label>
                <input type="text" id="editProductCategory" class="payment-input" value="${product.category}">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Barcode</label>
                <input type="text" id="editProductBarcode" class="payment-input" value="${product.barcode || ''}">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Harga (Rp)</label>
                <input type="text" inputmode="numeric" id="editProductPrice" class="payment-input" value="${formattedPrice}" oninput="autoFormatRupiahInput(this)">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Stok</label>
                <input type="number" id="editProductStock" class="payment-input" value="${product.stock}">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Stok Minimum</label>
                <input type="number" id="editProductMinStock" class="payment-input" value="${product.minStock}">
            </div>
            
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Satuan</label>
                <select id="editProductUnit" class="payment-input">
                    <option value="sak" ${product.unit === 'sak' ? 'selected' : ''}>Sak</option>
                    <option value="pcs" ${product.unit === 'pcs' ? 'selected' : ''}>Pcs</option>
                    <option value="kg" ${product.unit === 'kg' ? 'selected' : ''}>Kg</option>
                    <option value="liter" ${product.unit === 'liter' ? 'selected' : ''}>Liter</option>
                    <option value="pak" ${product.unit === 'pak' ? 'selected' : ''}>Pak</option>
                    <option value="box" ${product.unit === 'box' ? 'selected' : ''}>Box</option>
                    <option value="karton" ${product.unit === 'karton' ? 'selected' : ''}>Karton</option>
                </select>
            </div>
            
            <div style="display: flex; gap: 8px;">
                <button class="pay-btn" onclick="updateProduct(${productId})" style="flex: 1;">💾 Simpan Perubahan</button>
                <button class="pay-btn" onclick="renderProductManagement()" style="flex: 1; background: #6b7280;">❌ Batal</button>
            </div>
        </div>
        <div id="productListManagement"></div>
    `;
    renderProductList();
}

function updateProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const name = document.getElementById('editProductName').value.trim();
    const category = document.getElementById('editProductCategory').value.trim();
    const barcode = document.getElementById('editProductBarcode').value.trim();
    const price = parseRupiah(document.getElementById('editProductPrice').value);
    const stock = parseInt(document.getElementById('editProductStock').value, 10) || 0;
    const minStock = parseInt(document.getElementById('editProductMinStock').value, 10) || 1;
    const unit = document.getElementById('editProductUnit').value;
    
    if (!name) return alert('Nama produk wajib diisi!');
    if (price <= 0) return alert('Harga harus lebih dari 0!');
    if (stock < 0) return alert('Stok tidak boleh minus!');
    
    product.name = name;
    product.category = category || 'Umum';
    product.barcode = barcode;
    product.price = price;
    product.stock = stock;
    product.minStock = minStock;
    product.unit = unit;
    
    saveData();
    showNotification('Produk berhasil diperbarui!', 'info');
    renderProductManagement();
}

function deleteProduct(productId) {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;
    products = products.filter(p => p.id !== productId);
    saveData();
    showNotification('Produk berhasil dihapus!', 'info');
    renderProductManagement();
}

function renderProductList() {
    const container = document.getElementById('productListManagement');
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = '<div class="empty-state">Belum ada daftar produk.</div>';
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="product-card">
            <div style="margin-bottom: 12px;">
                <div style="font-weight: bold; font-size: 18px;">${product.name}</div>
                <div style="color: #6b7280; margin-top: 4px;">
                    ${product.category} | ${product.unit} ${product.barcode ? `| 📊 ${product.barcode}` : ''}
                </div>
                <div style="color: #667eea; font-weight: 700; font-size: 18px; margin-top: 4px;">${formatRupiah(product.price)}</div>
                <div style="font-weight: bold; margin-top: 4px; color: ${product.stock > product.minStock ? '#059669' : '#dc2626'};">
                    Stok: ${product.stock} ${product.unit} ${product.stock <= product.minStock ? '⚠️ (Menipis)' : '✅'}
                    <span style="font-size: 12px; font-weight: normal; color: #6b7280;">(Min: ${product.minStock})</span>
                </div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button class="add-btn" onclick="showEditProductForm(${product.id})" style="flex: 1; background: #f59e0b;">✏️ Edit</button>
                <button class="add-btn" onclick="deleteProduct(${product.id})" style="flex: 1; background: #ef4444;">🗑️ Hapus</button>
            </div>
        </div>
    `).join('');
}

function renderProductManagement() {
    const container = document.getElementById('productManagement');
    if (!container) return;
    
    container.innerHTML = `
        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
            <button class="pay-btn" onclick="showAddProductForm()" style="flex: 1;">➕ Tambah Produk</button>
            <button class="pay-btn" onclick="exportData()" style="flex: 1; background: #667eea;">📥 Backup Data</button>
        </div>
        <div id="productListManagement"></div>
    `;
    renderProductList();
}

function exportData() {
    const data = {
        products,
        transactions,
        settings,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-kasir-${Date.now()}.json`;
    link.click();
    
    showNotification('Backup berhasil diunduh!', 'info');
}

// ==========================================
// LAPORAN
// ==========================================

function getTopProducts(transactionList) {
    const productSales = {};
    
    transactionList.forEach(trans => {
        trans.items.forEach(item => {
            if (!productSales[item.name]) {
                productSales[item.name] = {
                    name: item.name,
                    quantity: 0,
                    total: 0,
                    unit: item.unit
                };
            }
            productSales[item.name].quantity += item.quantity;
            const itemTotal = Number(item.price) * item.quantity;
            const discount = itemTotal * (item.discount || 0) / 100;
            productSales[item.name].total += (itemTotal - discount);
        });
    });
    
    return Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
}

function renderReport() {
    const todayStr = getTodayDateString();
    
    const todayTransactions = transactions.filter(t => {
        return t.isoDate === todayStr || (t.date && t.date.includes(new Date().toLocaleDateString('id-ID')));
    });
    
    const todayTotal = todayTransactions.reduce((sum, t) => sum + t.total, 0);
    const todayItems = todayTransactions.reduce((sum, t) => sum + t.items.reduce((s, i) => s + i.quantity, 0), 0);
    
    const thisWeek = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateISO = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const label = `${d.getDate()}/${d.getMonth() + 1}`;
        
        const dayTrans = transactions.filter(t => t.isoDate === dateISO);
        const dayTotal = dayTrans.reduce((sum, t) => sum + t.total, 0);
        thisWeek.push({ label, total: dayTotal });
    }
    
    const maxWeekTotal = Math.max(...thisWeek.map(d => d.total), 1);
    
    const statsCard = document.getElementById('statsCard');
    statsCard.innerHTML = `
        <div class="stats-card">
            <div class="stats-title">Penjualan Hari Ini</div>
            <div class="stats-amount">${formatRupiah(todayTotal)}</div>
            <div style="margin-top: 12px; opacity: 0.9;">${todayTransactions.length} Transaksi | ${todayItems} Item Terjual</div>
        </div>
        
        <div class="cart-container" style="margin-bottom: 20px;">
            <div class="cart-title">📊 Grafik 7 Hari Terakhir</div>
            <div style="padding: 10px 0;">
                ${thisWeek.map(day => {
                    const percentage = (day.total / maxWeekTotal) * 100;
                    return `
                        <div style="margin-bottom: 12px;">
                            <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
                                <span>${day.label}</span>
                                <span style="font-weight: 600; color: #667eea;">${formatRupiah(day.total)}</span>
                            </div>
                            <div style="background: #e5e7eb; height: 16px; border-radius: 8px; overflow: hidden;">
                                <div style="background: linear-gradient(90deg, #667eea, #764ba2); height: 100%; width: ${percentage}%;"></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
        
        <div class="cart-container" style="margin-bottom: 20px;">
            <div class="cart-title">🔥 Produk Terlaris Hari Ini</div>
            <div style="padding: 5px 0;">
                ${getTopProducts(todayTransactions).map((item, index) => `
                    <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                        <div>
                            <span style="font-weight: bold; color: #667eea;">#${index + 1}</span>
                            <span style="margin-left: 8px; font-weight: 500;">${item.name}</span>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 600;">${item.quantity} ${item.unit}</div>
                            <div style="font-size: 12px; color: #6b7280;">${formatRupiah(item.total)}</div>
                        </div>
                    </div>
                `).join('')}
                ${todayTransactions.length === 0 ? '<div class="empty-state">Belum ada penjualan hari ini</div>' : ''}
            </div>
        </div>
    `;
    
    const transactionList = document.getElementById('transactionList');
    if (transactions.length === 0) {
        transactionList.innerHTML = '<div class="empty-state">Belum ada riwayat transaksi.</div>';
        return;
    }
    
    transactionList.innerHTML = `
        <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 16px; color: #1f2937;">Riwayat Transaksi</h2>
        ${transactions.slice(0, 20).map(transaction => `
        <div class="transaction-card">
            <div class="transaction-header">
                <div>
                    <div class="transaction-id">#${transaction.id}</div>
                    <div class="transaction-date">${transaction.date} | Kasir: ${transaction.cashier}</div>
                </div>
                <div class="transaction-total">${formatRupiah(transaction.total)}</div>
            </div>
            <div class="transaction-items">
                ${transaction.items.map(item => `
                    <div class="transaction-item">
                        • ${item.name} (${item.quantity} ${item.unit}) = ${formatRupiah(Number(item.price) * item.quantity)}
                        ${item.discount > 0 ? ` <span style="color: #10b981;">(Disc ${item.discount}%)</span>` : ''}
                    </div>
                `).join('')}
            </div>
            <div class="transaction-payment">
                <div>Bayar: ${formatRupiah(transaction.payment)} | Kembali: ${formatRupiah(transaction.change)}</div>
            </div>
            <button class="add-btn" onclick="printReceiptFromId(${transaction.id})" style="margin-top: 10px; width: 100%; background: #6b7280;">
                🖨️ Cetak Ulang Struk
            </button>
        </div>
    `).join('')}
    `;
}

function printReceiptFromId(transactionId) {
    const t = transactions.find(item => item.id === transactionId);
    if (t) printReceipt(t);
}

// ==========================================
// PENGATURAN TOKO & USER
// ==========================================

function renderSettings() {
    const container = document.getElementById('settingsContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="cart-container" style="margin-bottom: 20px;">
            <div class="cart-title">⚙️ Pengaturan Toko</div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Nama Toko</label>
                <input type="text" id="storeName" class="payment-input" value="${settings.storeName}">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="checkbox" id="lowStockAlert" ${settings.lowStockAlert ? 'checked' : ''} style="margin-right: 10px; width: 18px; height: 18px;">
                    <span>Aktifkan Peringatan Stok Rendah</span>
                </label>
            </div>
            
            <div style="margin-bottom: 16px;">
                <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="checkbox" id="printerEnabled" ${settings.printerEnabled ? 'checked' : ''} style="margin-right: 10px; width: 18px; height: 18px;">
                    <span>Cetak Struk Otomatis Setelah Bayar</span>
                </label>
            </div>
            
            <button class="pay-btn" onclick="saveSettings()">💾 Simpan Pengaturan</button>
        </div>
        
        ${currentUser && currentUser.role === 'admin' ? `
        <div class="cart-container" style="margin-bottom: 20px;">
            <div class="cart-title">👤 Manajemen Kasir & User</div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Username Baru</label>
                <input type="text" id="newUsername" class="payment-input" placeholder="kasir2">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Password</label>
                <input type="password" id="newPassword" class="payment-input" placeholder="****">
            </div>
            
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Peran (Role)</label>
                <select id="newRole" class="payment-input">
                    <option value="kasir">Kasir</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
            
            <button class="pay-btn" onclick="addUser()" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">➕ Tambah User</button>
            
            <div style="margin-top: 20px;">
                <h3 style="font-weight: 600; margin-bottom: 8px;">Daftar Akun:</h3>
                ${users.map(user => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px;">
                        <div>
                            <div style="font-weight: 600;">${user.username}</div>
                            <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">${user.role}</div>
                        </div>
                        ${user.username !== 'admin' && user.username !== currentUser.username ? `
                            <button class="qty-btn qty-delete" onclick="deleteUser('${user.username}')">🗑️</button>
                        ` : '<span style="font-size: 12px; color: #9ca3af;">(Aktif)</span>'}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        <div class="cart-container">
            <div class="cart-title">🚪 Keluar</div>
            <p style="color: #6b7280; margin-bottom: 12px;">Login sebagai: <strong>${currentUser.username}</strong> (${currentUser.role})</p>
            <button class="pay-btn" onclick="logout()" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
                🚪 Logout
            </button>
        </div>
    `;
}

function saveSettings() {
    settings.storeName = document.getElementById('storeName').value.trim() || 'Toko Sembako';
    settings.lowStockAlert = document.getElementById('lowStockAlert').checked;
    settings.printerEnabled = document.getElementById('printerEnabled').checked;
    
    const appTitle = document.getElementById('appTitle');
    if (appTitle) appTitle.textContent = `🛒 ${settings.storeName}`;
    
    saveData();
    showNotification('Pengaturan toko disimpan!', 'info');
}

function addUser() {
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value;
    const role = document.getElementById('newRole').value;
    
    if (!username || !password) return alert('Username dan password harus diisi!');
    if (users.find(u => u.username === username)) return alert('Username sudah digunakan!');
    
    users.push({ username, password, role });
    saveData();
    showNotification('User berhasil didaftarkan!', 'info');
    renderSettings();
}

function deleteUser(username) {
    if (!confirm(`Yakin ingin menghapus user ${username}?`)) return;
    users = users.filter(u => u.username !== username);
    saveData();
    showNotification('User berhasil dihapus!', 'info');
    renderSettings();
}

// ==========================================
// INISIALISASI
// ==========================================
loadData();

if (!currentUser) {
    showLoginForm();
} else {
    const appTitle = document.getElementById('appTitle');
    if (appTitle) appTitle.textContent = `🛒 ${settings.storeName}`;
    checkLowStock();
    renderProducts();
    renderCart();
}
