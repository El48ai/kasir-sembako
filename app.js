// Data produk awal
let products = [
    { id: 1, name: 'Contoh Produk 1', price: 10000, stock: 10, category: 'Umum', barcode: '', minStock: 5, unit: 'pcs' }
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

// Load data dari localStorage
function loadData() {
    const savedProducts = localStorage.getItem('kasir_products');
    const savedTransactions = localStorage.getItem('kasir_transactions');
    const savedUsers = localStorage.getItem('kasir_users');
    const savedSettings = localStorage.getItem('kasir_settings');
    const savedUser = localStorage.getItem('kasir_current_user');
    
    if (savedProducts) products = JSON.parse(savedProducts);
    if (savedTransactions) transactions = JSON.parse(savedTransactions);
    if (savedUsers) users = JSON.parse(savedUsers);
    if (savedSettings) settings = JSON.parse(savedSettings);
    if (savedUser) currentUser = JSON.parse(savedUser);
}

// Simpan data ke localStorage
function saveData() {
    localStorage.setItem('kasir_products', JSON.stringify(products));
    localStorage.setItem('kasir_transactions', JSON.stringify(transactions));
    localStorage.setItem('kasir_users', JSON.stringify(users));
    localStorage.setItem('kasir_settings', JSON.stringify(settings));
    if (currentUser) {
        localStorage.setItem('kasir_current_user', JSON.stringify(currentUser));
    }
}

// Format rupiah
function formatRupiah(amount) {
    return 'Rp ' + amount.toLocaleString('id-ID');
}

// Check login
function checkLogin() {
    if (!currentUser) {
        showLoginForm();
        return false;
    }
    return true;
}

// Show login form
function showLoginForm() {
    const container = document.querySelector('.container');
    container.innerHTML = `
        <div class="header">
            <div class="header-content">
                <div class="title">🔐 Login Kasir</div>
            </div>
        </div>
        <div class="content">
            <div class="cart-container">
                <div class="cart-title">Masuk ke Sistem</div>
                <div style="margin-bottom: 12px;">
                    <label style="display: block; margin-bottom: 4px; font-weight: 600;">Username</label>
                    <input type="text" id="loginUsername" class="payment-input" placeholder="admin" style="margin-bottom: 0;">
                </div>
                <div style="margin-bottom: 12px;">
                    <label style="display: block; margin-bottom: 4px; font-weight: 600;">Password</label>
                    <input type="password" id="loginPassword" class="payment-input" placeholder="****" style="margin-bottom: 0;">
                </div>
                <button class="pay-btn" onclick="login()">🔓 LOGIN</button>
                <p style="margin-top: 12px; font-size: 12px; color: #6b7280;">Default: admin / admin123</p>
            </div>
        </div>
    `;
}

// Login
function login() {
    const username = document.getElementById('loginUsername').value;
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

// Logout
function logout() {
    if (confirm('Yakin ingin logout?')) {
        currentUser = null;
        localStorage.removeItem('kasir_current_user');
        location.reload();
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'warning' ? '#f59e0b' : '#10b981'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        z-index: 1000;
        max-width: 90%;
        text-align: center;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Toggle menu
function toggleMenu() {
    const menu = document.getElementById('navMenu');
    menu.classList.toggle('active');
}

// Switch tab
function switchTab(tab) {
    if (!checkLogin()) return;
    
    document.getElementById('kasirTab').classList.add('hidden');
    document.getElementById('produkTab').classList.add('hidden');
    document.getElementById('laporanTab').classList.add('hidden');
    document.getElementById('settingsTab').classList.add('hidden');
    
    document.getElementById(tab + 'Tab').classList.remove('hidden');
    
    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach((btn, index) => {
        btn.classList.remove('active');
        if ((tab === 'kasir' && index === 0) || 
            (tab === 'produk' && index === 1) || 
            (tab === 'laporan' && index === 2) ||
            (tab === 'settings' && index === 3)) {
            btn.classList.add('active');
        }
    });
    
    toggleMenu();
    
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

// Check low stock
function checkLowStock() {
    if (!settings.lowStockAlert) return;
    
    const lowStockProducts = products.filter(p => p.stock <= p.minStock && p.stock > 0);
    
    if (lowStockProducts.length > 0) {
        const names = lowStockProducts.map(p => `${p.name} (${p.stock})`).join(', ');
        showNotification(`⚠️ Stok rendah: ${names}`, 'warning');
    }
}

// Render produk
function renderProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm) || 
        (p.barcode && p.barcode.includes(searchTerm))
    );
    
    const productList = document.getElementById('productList');
    
    if (filteredProducts.length === 0) {
        productList.innerHTML = '<div class="empty-state">Tidak ada produk. Tambah produk di menu "Kelola Produk"</div>';
        return;
    }
    
    productList.innerHTML = filteredProducts.map(product => `
        <div class="product-card">
            <div class="product-header">
                <div style="flex: 1;">
                    <div class="product-name">${product.name}</div>
                    <div class="product-category">${product.category} - ${product.unit}</div>
                    ${product.barcode ? `<div style="font-size: 12px; color: #9ca3af;">📊 ${product.barcode}</div>` : ''}
                </div>
                <span class="stock-badge ${product.stock > product.minStock ? 'stock-high' : 'stock-low'}">
                    Stok: ${product.stock}
                </span>
            </div>
            <div class="product-footer">
                <div class="price">${formatRupiah(product.price)}</div>
                <button class="add-btn" onclick="addToCart(${product.id})" ${product.stock === 0 ? 'disabled' : ''}>
                    ➕ Tambah
                </button>
            </div>
        </div>
    `).join('');
}

// Search produk
function searchProducts() {
    renderProducts();
}

// Tambah ke keranjang
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const cartItem = cart.find(item => item.id === productId);
    
    if (cartItem) {
        if (cartItem.quantity < product.stock) {
            cartItem.quantity++;
        } else {
            alert('Stok tidak mencukupi!');
        }
    } else {
        if (product.stock > 0) {
            cart.push({ ...product, quantity: 1, discount: 0 });
        } else {
            alert('Stok habis!');
        }
    }
    
    renderCart();
}

// Apply discount to cart item
function applyDiscount(productId) {
    const cartItem = cart.find(item => item.id === productId);
    if (!cartItem) return;
    
    const discount = prompt(`Masukkan diskon untuk ${cartItem.name} (dalam %)`, '0');
    const discountNum = parseFloat(discount) || 0;
    
    if (discountNum < 0 || discountNum > 100) {
        alert('Diskon harus antara 0-100%');
        return;
    }
    
    cartItem.discount = discountNum;
    renderCart();
}

// Update quantity
function updateQuantity(productId, change) {
    const cartItem = cart.find(item => item.id === productId);
    const product = products.find(p => p.id === productId);
    
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

// Hapus dari keranjang
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    renderCart();
}

// Hitung total
function getTotal() {
    return cart.reduce((sum, item) => {
        const itemTotal = item.price * item.quantity;
        const discountAmount = itemTotal * (item.discount / 100);
        return sum + (itemTotal - discountAmount);
    }, 0);
}

// Render keranjang
function renderCart() {
    const cartContainer = document.getElementById('cartContainer');
    
    if (cart.length === 0) {
        cartContainer.innerHTML = '';
        return;
    }
    
    const total = getTotal();
    const totalDiscount = cart.reduce((sum, item) => {
        const itemTotal = item.price * item.quantity;
        return sum + (itemTotal * (item.discount / 100));
    }, 0);
    
    cartContainer.innerHTML = `
        <div class="cart-container">
            <div class="cart-title">🛒 Keranjang Belanja</div>
            ${cart.map(item => {
                const itemTotal = item.price * item.quantity;
                const discountAmount = itemTotal * (item.discount / 100);
                const finalPrice = itemTotal - discountAmount;
                
                return `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">${formatRupiah(item.price)} x ${item.quantity} ${item.unit}</div>
                        ${item.discount > 0 ? `<div style="color: #10b981; font-size: 12px;">Diskon ${item.discount}%: -${formatRupiah(discountAmount)}</div>` : ''}
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
                        <span>Total Diskon:</span>
                        <span>-${formatRupiah(totalDiscount)}</span>
                    </div>
                ` : ''}
                <div class="total-row">
                    <span>Total Bayar:</span>
                    <span class="total-amount">${formatRupiah(total)}</span>
                </div>
                <input type="number" class="payment-input" id="paymentInput" placeholder="Jumlah Bayar">
                <button class="pay-btn" onclick="processPayment()">💳 BAYAR</button>
            </div>
        </div>
    `;
}

// Print receipt
function printReceipt(transaction) {
    const receiptWindow = window.open('', '_blank');
    
    const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Struk #${transaction.id}</title>
            <style>
                body { font-family: monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
                h2 { text-align: center; margin: 10px 0; }
                hr { border: 1px dashed #000; }
                .item { display: flex; justify-content: space-between; margin: 5px 0; }
                .total { font-weight: bold; font-size: 16px; }
                .center { text-align: center; }
            </style>
        </head>
        <body>
            <h2>${settings.storeName}</h2>
            <div class="center">${transaction.date}</div>
            <div class="center">Kasir: ${transaction.cashier}</div>
            <hr>
            ${transaction.items.map(item => {
                const itemTotal = item.price * item.quantity;
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
            <div class="center">Terima Kasih</div>
            <div class="center">Selamat Belanja Kembali</div>
        </body>
        </html>
    `;
    
    receiptWindow.document.write(receiptHTML);
    receiptWindow.document.close();
    
    setTimeout(() => {
        receiptWindow.print();
    }, 500);
}

// Proses pembayaran
function processPayment() {
    const total = getTotal();
    const paymentInput = document.getElementById('paymentInput');
    const payment = parseInt(paymentInput.value) || 0;
    
    if (cart.length === 0) {
        alert('Keranjang kosong!');
        return;
    }
    
    if (payment < total) {
        alert('Pembayaran kurang!');
        return;
    }
    
    const change = payment - total;
    
    cart.forEach(cartItem => {
        const product = products.find(p => p.id === cartItem.id);
        if (product) {
            product.stock -= cartItem.quantity;
        }
    });
    
    const transaction = {
        id: Date.now(),
        date: new Date().toLocaleString('id-ID', { 
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }),
        items: [...cart],
        total: total,
        payment: payment,
        change: change,
        cashier: currentUser.username
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

// Show form tambah produk
function showAddProductForm() {
    const container = document.getElementById('productManagement');
    
    container.innerHTML = `
        <div class="cart-container" style="margin-bottom: 20px;">
            <div class="cart-title">➕ Tambah Produk Baru</div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Nama Produk *</label>
                <input type="text" id="newProductName" class="payment-input" placeholder="Beras Premium 5kg" style="margin-bottom: 0;">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Kategori *</label>
                <input type="text" id="newProductCategory" class="payment-input" placeholder="Beras" style="margin-bottom: 0;">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Barcode (opsional)</label>
                <input type="text" id="newProductBarcode" class="payment-input" placeholder="8991234567890" style="margin-bottom: 0;">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Harga (Rp) *</label>
                <input type="number" id="newProductPrice" class="payment-input" placeholder="75000" style="margin-bottom: 0;">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Stok *</label>
                <input type="number" id="newProductStock" class="payment-input" placeholder="50" style="margin-bottom: 0;">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Stok Minimum *</label>
                <input type="number" id="newProductMinStock" class="payment-input" placeholder="5" value="5" style="margin-bottom: 0;">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Satuan *</label>
                <select id="newProductUnit" class="payment-input" style="margin-bottom: 0;">
                    <option value="pcs">Pcs</option>
                    <option value="kg">Kg</option>
                    <option value="liter">Liter</option>
                    <option value="pak">Pak</option>
                    <option value="box">Box</option>
                    <option value="karton">Karton</option>
                    <option value="lusin">Lusin</option>
                </select>
            </div>
            
            <div style="display: flex; gap: 8px;">
                <button class="pay-btn" onclick="saveNewProduct()" style="flex: 1;">💾 Simpan</button>
                <button class="pay-btn" onclick="renderProductManagement()" style="flex: 1; background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);">❌ Batal</button>
            </div>
        </div>
        
        <div id="productListManagement"></div>
    `;
    
    renderProductList();
}

// Simpan produk baru
function saveNewProduct() {
    const name = document.getElementById('newProductName').value.trim();
    const category = document.getElementById('newProductCategory').value.trim();
    const barcode = document.getElementById('newProductBarcode').value.trim();
    const price = parseInt(document.getElementById('newProductPrice').value) || 0;
    const stock = parseInt(document.getElementById('newProductStock').value) || 0;
    const minStock = parseInt(document.getElementById('newProductMinStock').value) || 5;
    const unit = document.getElementById('newProductUnit').value;
    
    if (!name) {
        alert('Nama produk harus diisi!');
        return;
    }
    
    if (price <= 0) {
        alert('Harga harus lebih dari 0!');
        return;
    }
    
    if (stock < 0) {
        alert('Stok tidak boleh minus!');
        return;
    }
    
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

// Show form edit produk
function showEditProductForm(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const container = document.getElementById('productManagement');
    
    container.innerHTML = `
        <div class="cart-container" style="margin-bottom: 20px;">
            <div class="cart-title">✏️ Edit Produk</div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Nama Produk</label>
                <input type="text" id="editProductName" class="payment-input" value="${product.name}" style="margin-bottom: 0;">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Kategori</label>
                <input type="text" id="editProductCategory" class="payment-input" value="${product.category}" style="margin-bottom: 0;">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Barcode</label>
                <input type="text" id="editProductBarcode" class="payment-input" value="${product.barcode || ''}" style="margin-bottom: 0;">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Harga (Rp)</label>
                <input type="number" id="editProductPrice" class="payment-input" value="${product.price}" style="margin-bottom: 0;">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Stok</label>
                <input type="number" id="editProductStock" class="payment-input" value="${product.stock}" style="margin-bottom: 0;">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Stok Minimum</label>
                <input type="number" id="editProductMinStock" class="payment-input" value="${product.minStock}" style="margin-bottom: 0;">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Satuan</label>
                <select id="editProductUnit" class="payment-input" style="margin-bottom: 0;">
                    <option value="pcs" ${product.unit === 'pcs' ? 'selected' : ''}>Pcs</option>
                    <option value="kg" ${product.unit === 'kg' ? 'selected' : ''}>Kg</option>
                    <option value="liter" ${product.unit === 'liter' ? 'selected' : ''}>Liter</option>
                    <option value="pak" ${product.unit === 'pak' ? 'selected' : ''}>Pak</option>
                    <option value="box" ${product.unit === 'box' ? 'selected' : ''}>Box</option>
                    <option value="karton" ${product.unit === 'karton' ? 'selected' : ''}>Karton</option>
                    <option value="lusin" ${product.unit === 'lusin' ? 'selected' : ''}>Lusin</option>
                </select>
            </div>
            
            <div style="display: flex; gap: 8px;">
                <button class="pay-btn" onclick="updateProduct(${productId})" style="flex: 1;">💾 Simpan</button>
                <button class="pay-btn" onclick="renderProductManagement()" style="flex: 1; background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);">❌ Batal</button>
            </div>
        </div>
        
        <div id="productListManagement"></div>
    `;
    
    renderProductList();
}

// Update produk
function updateProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const name = document.getElementById('editProductName').value.trim();
    const category = document.getElementById('editProductCategory').value.trim();
    const barcode = document.getElementById('editProductBarcode').value.trim();
    const price = parseInt(document.getElementById('editProductPrice').value) || 0;
    const stock = parseInt(document.getElementById('editProductStock').value) || 0;
    const minStock = parseInt(document.getElementById('editProductMinStock').value) || 5;
    const unit = document.getElementById('editProductUnit').value;
    
    if (!name) {
        alert('Nama produk harus diisi!');
        return;
    }
    
    if (price <= 0) {
        alert('Harga harus lebih dari 0!');
        return;
    }
    
    if (stock < 0) {
        alert('Stok tidak boleh minus!');
        return;
    }
    
    product.name = name;
    product.category = category || 'Umum';
    product.barcode = barcode;
    product.price = price;
    product.stock = stock;
    product.minStock = minStock;
    product.unit = unit;
    
    saveData();
    showNotification('Produk berhasil diupdate!', 'info');
    renderProductManagement();
}

// Hapus produk
function deleteProduct(productId) {
    if (!confirm('Yakin ingin menghapus produk ini?')) {
        return;
    }
    
    products = products.filter(p => p.id !== productId);
    saveData();
    showNotification('Produk berhasil dihapus!', 'info');
    renderProductManagement();
}

// Render list produk
function renderProductList() {
    const container = document.getElementById('productListManagement');
    
    if (products.length === 0) {
        container.innerHTML = '<div class="empty-state">Belum ada produk</div>';
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="product-card">
            <div style="margin-bottom: 12px;">
                <div style="font-weight: bold; font-size: 18px;">${product.name}</div>
                <div style="color: #6b7280; margin-top: 4px;">
                    ${product.category} | ${product.unit}
                    ${product.barcode ? ` | 📊 ${product.barcode}` : ''}
                </div>
                <div style="color: #667eea; font-weight: 600; margin-top: 4px;">${formatRupiah(product.price)}</div>
                <div style="font-weight: bold; color: ${product.stock > product.minStock ? '#059669' : '#dc2626'};">
                    Stok: ${product.stock} ${product.unit} ${product.stock <= product.minStock ? '⚠️' : '✅'}
                    <span style="font-size: 12px;">(Min: ${product.minStock})</span>
                </div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button class="add-btn" onclick="showEditProductForm(${product.id})" style="flex: 1; background: #f59e0b;">✏️ Edit</button>
                <button class="add-btn" onclick="deleteProduct(${product.id})" style="flex: 1; background: #ef4444;">🗑️ Hapus</button>
            </div>
        </div>
    `).join('');
}

// Render manajemen produk
function renderProductManagement() {
    const container = document.getElementById('productManagement');
    
    container.innerHTML = `
        <button class="pay-btn" onclick="showAddProductForm()" style="margin-bottom: 20px;">➕ Tambah Produk Baru</button>
        <button class="pay-btn" onclick="exportData()" style="margin-bottom: 20px; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">📥 Export Data (Backup)</button>
        <div id="productListManagement"></div>
    `;
    
    renderProductList();
}

// Export data
function exportData() {
    const data = {
        products: products,
        transactions: transactions,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kasir-backup-${Date.now()}.json`;
    link.click();
    
    showNotification('Data berhasil di-export!', 'info');
}

// Get top products
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
            const itemTotal = item.price * item.quantity;
            const discount = itemTotal * (item.discount || 0) / 100;
            productSales[item.name].total += (itemTotal - discount);
        });
    });
    
    return Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
}

// Render laporan
function renderReport() {
    const today = new Date().toLocaleDateString('id-ID');
    const todayTransactions = transactions.filter(t => {
        const transDate = new Date(t.date.split(',')[0].split('/').reverse().join('-')).toLocaleDateString('id-ID');
        return transDate === today;
    });
    
    const todayTotal = todayTransactions.reduce((sum, t) => sum + t.total, 0);
    const todayItems = todayTransactions.reduce((sum, t) => sum + t.items.reduce((s, i) => s + i.quantity, 0), 0);
    
    const thisWeek = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('id-ID');
        const dayTrans = transactions.filter(t => {
            const transDate = new Date(t.date.split(',')[0].split('/').reverse().join('-')).toLocaleDateString('id-ID');
            return transDate === dateStr;
        });
        const dayTotal = dayTrans.reduce((sum, t) => sum + t.total, 0);
        thisWeek.push({ date: dateStr, total: dayTotal });
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
            <div style="padding: 20px 10px;">
                ${thisWeek.map(day => {
                    const percentage = maxWeekTotal > 0 ? (day.total / maxWeekTotal * 100) : 0;
                    return `
                        <div style="margin-bottom: 16px;">
                            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                                <span>${day.date.split('/')[0]}/${day.date.split('/')[1]}</span>
                                <span style="font-weight: 600; color: #667eea;">${formatRupiah(day.total)}</span>
                            </div>
                            <div style="background: #e5e7eb; height: 20px; border-radius: 10px; overflow: hidden;">
                                <div style="background: linear-gradient(90deg, #667eea, #764ba2); height: 100%; width: ${percentage}%; transition: width 0.3s;"></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
        
        <div class="cart-container" style="margin-bottom: 20px;">
            <div class="cart-title">🔥 Produk Terlaris Hari Ini</div>
            <div style="padding: 10px 0;">
                ${getTopProducts(todayTransactions).map((item, index) => `
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                        <div>
                            <span style="font-weight: bold; color: #667eea;">#${index + 1}</span>
                            <span style="margin-left: 8px;">${item.name}</span>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 600;">${item.quantity} ${item.unit}</div>
                            <div style="font-size: 12px; color: #6b7280;">${formatRupiah(item.total)}</div>
                        </div>
                    </div>
                `).join('')}
                ${getTopProducts(todayTransactions).length === 0 ? '<div class="empty-state">Belum ada penjualan hari ini</div>' : ''}
            </div>
        </div>
    `;
    
    const transactionList = document.getElementById('transactionList');
    
    if (transactions.length === 0) {
        transactionList.innerHTML = '<div class="empty-state">Belum ada transaksi</div>';
        return;
    }
    
    transactionList.innerHTML = `
        <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 16px; color: #1f2937;">Riwayat Transaksi</h2>
        ${transactions.slice(0, 20).map(transaction => `
        <div class="transaction-card">
            <div class="transaction-header">
                <div>
                    <div class="transaction-id">#${transaction.id}</div>
                    <div class="transaction-date">${transaction.date} | ${transaction.cashier}</div>
                </div>
                <div class="transaction-total">${formatRupiah(transaction.total)}</div>
            </div>
            <div class="transaction-items">
                ${transaction.items.map(item => `
                    <div class="transaction-item">
                        ${item.name} x${item.quantity} ${item.unit} = ${formatRupiah(item.price * item.quantity)}
                        ${item.discount > 0 ? ` <span style="color: #10b981;">(-${item.discount}%)</span>` : ''}
                    </div>
                `).join('')}
            </div>
            <div class="transaction-payment">
                <div>Bayar: ${formatRupiah(transaction.payment)}</div>
                <div>Kembali: ${formatRupiah(transaction.change)}</div>
            </div>
            <button class="add-btn" onclick='printReceiptFromHistory(${JSON.stringify(transaction)})' style="margin-top: 8px; width: 100%; background: #6b7280;">
                🖨️ Cetak Ulang Struk
            </button>
        </div>
    `).join('')}
    ${transactions.length > 20 ? '<div class="empty-state">Menampilkan 20 transaksi terakhir</div>' : ''}
    `;
}

// Print receipt from history
function printReceiptFromHistory(transaction) {
    printReceipt(transaction);
}

// Render settings
function renderSettings() {
    const container = document.getElementById('settingsContainer');
    
    container.innerHTML = `
        <div class="cart-container" style="margin-bottom: 20px;">
            <div class="cart-title">⚙️ Pengaturan Toko</div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Nama Toko</label>
                <input type="text" id="storeName" class="payment-input" value="${settings.storeName}" style="margin-bottom: 0;">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="checkbox" id="lowStockAlert" ${settings.lowStockAlert ? 'checked' : ''} style="margin-right: 8px; width: 20px; height: 20px;">
                    <span>Aktifkan Alert Stok Rendah</span>
                </label>
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="checkbox" id="printerEnabled" ${settings.printerEnabled ? 'checked' : ''} style="margin-right: 8px; width: 20px; height: 20px;">
                    <span>Cetak Struk Otomatis</span>
                </label>
            </div>
            
            <button class="pay-btn" onclick="saveSettings()">💾 Simpan Pengaturan</button>
        </div>
        
        ${currentUser && currentUser.role === 'admin' ? `
        <div class="cart-container" style="margin-bottom: 20px;">
            <div class="cart-title">👤 Manajemen User</div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Username Baru</label>
                <input type="text" id="newUsername" class="payment-input" placeholder="kasir1" style="margin-bottom: 0;">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Password</label>
                <input type="password" id="newPassword" class="payment-input" placeholder="****" style="margin-bottom: 0;">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Role</label>
                <select id="newRole" class="payment-input" style="margin-bottom: 0;">
                    <option value="kasir">Kasir</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
            
            <button class="pay-btn" onclick="addUser()" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">➕ Tambah User</button>
            
            <div style="margin-top: 20px;">
                <h3 style="font-weight: 600; margin-bottom: 8px;">Daftar User:</h3>
                ${users.map(user => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px;">
                        <div>
                            <div style="font-weight: 600;">${user.username}</div>
                            <div style="font-size: 12px; color: #6b7280;">${user.role}</div>
                        </div>
                        ${user.username !== 'admin' && user.username !== currentUser.username ? `
                            <button class="qty-btn qty-delete" onclick="deleteUser('${user.username}')">🗑️</button>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        <div class="cart-container">
            <div class="cart-title">🚪 Akun</div>
            <div style="margin-bottom: 12px;">
                <p style="color: #6b7280;">Login sebagai: <strong>${currentUser.username}</strong> (${currentUser.role})</p>
            </div>
            <button class="pay-btn" onclick="logout()" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
                🚪 Logout
            </button>
        </div>
    `;
}

// Save settings
function saveSettings() {
    settings.storeName = document.getElementById('storeName').value;
    settings.lowStockAlert = document.getElementById('lowStockAlert').checked;
    settings.printerEnabled = document.getElementById('printerEnabled').checked;
    
    saveData();
    showNotification('Pengaturan berhasil disimpan!', 'info');
}

// Add user
function addUser() {
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value;
    const role = document.getElementById('newRole').value;
    
    if (!username || !password) {
        alert('Username dan password harus diisi!');
        return;
    }
    
    if (users.find(u => u.username === username)) {
        alert('Username sudah ada!');
        return;
    }
    
    users.push({ username, password, role });
    saveData();
    showNotification('User berhasil ditambahkan!', 'info');
    renderSettings();
}

// Delete user
function deleteUser(username) {
    if (!confirm(`Yakin ingin menghapus user ${username}?`)) {
        return;
    }
    
    users = users.filter(u => u.username !== username);
    saveData();
    showNotification('User berhasil dihapus!', 'info');
    renderSettings();
}

// Inisialisasi
loadData();

if (!currentUser) {
    showLoginForm();
} else {
    checkLowStock();
    renderProducts();
    renderCart();
}
