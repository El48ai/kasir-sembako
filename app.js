// Data produk awal (bisa dikosongkan atau diisi contoh)
let products = [
    { id: 1, name: 'Contoh Produk 1', price: 10000, stock: 10, category: 'Umum' }
];

let cart = [];
let transactions = [];

// Load data dari localStorage
function loadData() {
    const savedProducts = localStorage.getItem('kasir_products');
    const savedTransactions = localStorage.getItem('kasir_transactions');
    
    if (savedProducts) {
        products = JSON.parse(savedProducts);
    }
    if (savedTransactions) {
        transactions = JSON.parse(savedTransactions);
    }
}

// Simpan data ke localStorage
function saveData() {
    localStorage.setItem('kasir_products', JSON.stringify(products));
    localStorage.setItem('kasir_transactions', JSON.stringify(transactions));
}

// Format rupiah
function formatRupiah(amount) {
    return 'Rp ' + amount.toLocaleString('id-ID');
}

// Toggle menu
function toggleMenu() {
    const menu = document.getElementById('navMenu');
    menu.classList.toggle('active');
}

// Switch tab
function switchTab(tab) {
    document.getElementById('kasirTab').classList.add('hidden');
    document.getElementById('produkTab').classList.add('hidden');
    document.getElementById('laporanTab').classList.add('hidden');
    
    document.getElementById(tab + 'Tab').classList.remove('hidden');
    
    // Update active button
    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach((btn, index) => {
        btn.classList.remove('active');
        if ((tab === 'kasir' && index === 0) || 
            (tab === 'produk' && index === 1) || 
            (tab === 'laporan' && index === 2)) {
            btn.classList.add('active');
        }
    });
    
    toggleMenu();
    
    if (tab === 'kasir') {
        renderProducts();
        renderCart();
    } else if (tab === 'produk') {
        renderProductManagement();
    } else if (tab === 'laporan') {
        renderReport();
    }
}

// Render produk
function renderProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm)
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
                    <div class="product-category">${product.category}</div>
                </div>
                <span class="stock-badge ${product.stock > 10 ? 'stock-high' : 'stock-low'}">
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
            cart.push({ ...product, quantity: 1 });
        } else {
            alert('Stok habis!');
        }
    }
    
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
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// Render keranjang
function renderCart() {
    const cartContainer = document.getElementById('cartContainer');
    
    if (cart.length === 0) {
        cartContainer.innerHTML = '';
        return;
    }
    
    const total = getTotal();
    
    cartContainer.innerHTML = `
        <div class="cart-container">
            <div class="cart-title">🛒 Keranjang Belanja</div>
            ${cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">${formatRupiah(item.price)}</div>
                    </div>
                    <div class="cart-controls">
                        <button class="qty-btn qty-minus" onclick="updateQuantity(${item.id}, -1)">−</button>
                        <div class="qty-display">${item.quantity}</div>
                        <button class="qty-btn qty-plus" onclick="updateQuantity(${item.id}, 1)">+</button>
                        <button class="qty-btn qty-delete" onclick="removeFromCart(${item.id})">🗑️</button>
                    </div>
                </div>
            `).join('')}
            
            <div class="cart-total">
                <div class="total-row">
                    <span>Total:</span>
                    <span class="total-amount">${formatRupiah(total)}</span>
                </div>
                <input type="number" class="payment-input" id="paymentInput" placeholder="Jumlah Bayar">
                <button class="pay-btn" onclick="processPayment()">💳 BAYAR</button>
            </div>
        </div>
    `;
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
    
    // Update stok
    cart.forEach(cartItem => {
        const product = products.find(p => p.id === cartItem.id);
        if (product) {
            product.stock -= cartItem.quantity;
        }
    });
    
    // Simpan transaksi
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
        change: change
    };
    
    transactions.unshift(transaction);
    
    saveData();
    
    alert(`Pembayaran Berhasil!\n\nTotal: ${formatRupiah(total)}\nBayar: ${formatRupiah(payment)}\nKembalian: ${formatRupiah(change)}`);
    
    cart = [];
    paymentInput.value = '';
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
                <label style="display: block; margin-bottom: 4px; font-weight: 600; color: #374151;">Nama Produk</label>
                <input type="text" id="newProductName" class="payment-input" placeholder="Contoh: Beras Premium 5kg" style="margin-bottom: 0;">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600; color: #374151;">Kategori</label>
                <input type="text" id="newProductCategory" class="payment-input" placeholder="Contoh: Beras" style="margin-bottom: 0;">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600; color: #374151;">Harga (Rp)</label>
                <input type="number" id="newProductPrice" class="payment-input" placeholder="Contoh: 75000" style="margin-bottom: 0;">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600; color: #374151;">Stok</label>
                <input type="number" id="newProductStock" class="payment-input" placeholder="Contoh: 50" style="margin-bottom: 0;">
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
    const price = parseInt(document.getElementById('newProductPrice').value) || 0;
    const stock = parseInt(document.getElementById('newProductStock').value) || 0;
    
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
        price: price,
        stock: stock
    });
    
    saveData();
    alert('Produk berhasil ditambahkan!');
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
                <label style="display: block; margin-bottom: 4px; font-weight: 600; color: #374151;">Nama Produk</label>
                <input type="text" id="editProductName" class="payment-input" value="${product.name}" style="margin-bottom: 0;">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600; color: #374151;">Kategori</label>
                <input type="text" id="editProductCategory" class="payment-input" value="${product.category}" style="margin-bottom: 0;">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600; color: #374151;">Harga (Rp)</label>
                <input type="number" id="editProductPrice" class="payment-input" value="${product.price}" style="margin-bottom: 0;">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600; color: #374151;">Stok</label>
                <input type="number" id="editProductStock" class="payment-input" value="${product.stock}" style="margin-bottom: 0;">
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
    const price = parseInt(document.getElementById('editProductPrice').value) || 0;
    const stock = parseInt(document.getElementById('editProductStock').value) || 0;
    
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
    product.price = price;
    product.stock = stock;
    
    saveData();
    alert('Produk berhasil diupdate!');
    renderProductManagement();
}

// Hapus produk
function deleteProduct(productId) {
    if (!confirm('Yakin ingin menghapus produk ini?')) {
        return;
    }
    
    products = products.filter(p => p.id !== productId);
    saveData();
    alert('Produk berhasil dihapus!');
    renderProductManagement();
}

// Render list produk di management
function renderProductList() {
    const container = document.getElementById('productListManagement');
    
    if (products.length === 0) {
        container.innerHTML = '<div class="empty-state">Belum ada produk. Klik tombol "Tambah Produk" untuk mulai.</div>';
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="product-card">
            <div style="margin-bottom: 12px;">
                <div style="font-weight: bold; font-size: 18px; color: #1f2937;">${product.name}</div>
                <div style="color: #6b7280; margin-top: 4px;">Kategori: ${product.category}</div>
                <div style="color: #667eea; font-weight: 600; margin-top: 4px; font-size: 18px;">${formatRupiah(product.price)}</div>
                <div style="font-weight: bold; color: ${product.stock > 10 ? '#059669' : '#dc2626'}; margin-top: 4px;">
                    Stok: ${product.stock}
                </div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button class="add-btn" onclick="showEditProductForm(${product.id})" style="flex: 1; background: #f59e0b;">
                    ✏️ Edit
                </button>
                <button class="add-btn" onclick="deleteProduct(${product.id})" style="flex: 1; background: #ef4444;">
                    🗑️ Hapus
                </button>
            </div>
        </div>
    `).join('');
}

// Render manajemen produk
function renderProductManagement() {
    const container = document.getElementById('productManagement');
    
    container.innerHTML = `
        <button class="pay-btn" onclick="showAddProductForm()" style="margin-bottom: 20px;">
            ➕ Tambah Produk Baru
        </button>
        <div id="productListManagement"></div>
    `;
    
    renderProductList();
}

// Render laporan
function renderReport() {
    const today = new Date().toLocaleDateString('id-ID');
    const todayTransactions = transactions.filter(t => {
        const transDate = new Date(t.date.split(',')[0].split('/').reverse().join('-')).toLocaleDateString('id-ID');
        return transDate === today;
    });
    
    const todayTotal = todayTransactions.reduce((sum, t) => sum + t.total, 0);
    
    const statsCard = document.getElementById('statsCard');
    statsCard.innerHTML = `
        <div class="stats-card">
            <div class="stats-title">Total Penjualan Hari Ini</div>
            <div class="stats-amount">${formatRupiah(todayTotal)}</div>
            <div style="margin-top: 12px; opacity: 0.9;">Transaksi: ${todayTransactions.length}</div>
        </div>
    `;
    
    const transactionList = document.getElementById('transactionList');
    
    if (transactions.length === 0) {
        transactionList.innerHTML = '<div class="empty-state">Belum ada transaksi</div>';
        return;
    }
    
    transactionList.innerHTML = transactions.map(transaction => `
        <div class="transaction-card">
            <div class="transaction-header">
                <div>
                    <div class="transaction-id">#${transaction.id}</div>
                    <div class="transaction-date">${transaction.date}</div>
                </div>
                <div class="transaction-total">${formatRupiah(transaction.total)}</div>
            </div>
            <div class="transaction-items">
                ${transaction.items.map(item => `
                    <div class="transaction-item">${item.name} x${item.quantity} = ${formatRupiah(item.price * item.quantity)}</div>
                `).join('')}
            </div>
            <div class="transaction-payment">
                <div>Bayar: ${formatRupiah(transaction.payment)}</div>
                <div>Kembalian: ${formatRupiah(transaction.change)}</div>
            </div>
        </div>
    `).join('');
}

// Inisialisasi
loadData();
renderProducts();
renderCart();
