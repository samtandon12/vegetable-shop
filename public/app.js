const products = [
  { id: 1, name: 'Tomato', price: 2.99, image: 'https://images.unsplash.com/photo-1546470427-227e9e3e0e4e?w=400' },
  { id: 2, name: 'Carrot', price: 1.99, image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400' },
  { id: 3, name: 'Broccoli', price: 3.49, image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400' },
  { id: 4, name: 'Potato', price: 1.49, image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400' },
  { id: 5, name: 'Onion', price: 1.29, image: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=400' },
  { id: 6, name: 'Bell Pepper', price: 2.79, image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400' }
];

let cart = [];

// Toast notification system
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Check authentication on load
window.onload = async () => {
  const res = await fetch('/api/check-auth');
  const data = await res.json();
  if (data.authenticated) {
    showShop();
  }
};

function showSignup() {
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('signupForm').classList.remove('hidden');
}

function showLogin() {
  document.getElementById('signupForm').classList.add('hidden');
  document.getElementById('verifyForm').classList.add('hidden');
  document.getElementById('loginForm').classList.remove('hidden');
}

async function signup() {
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  
  const res = await fetch('/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await res.json();
  
  if (res.ok) {
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('verifyForm').classList.remove('hidden');
    document.getElementById('verifyEmail').value = email;
    
    if (data.demoCode) {
      showToast(`Demo mode: Your code is ${data.demoCode}`, 'success');
    } else {
      showToast('Verification code sent to your email!', 'success');
    }
  } else {
    showToast(data.error, 'error');
  }
}

async function verifyCode() {
  const email = document.getElementById('verifyEmail').value;
  const code = document.getElementById('verifyCode').value;
  
  const res = await fetch('/api/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code })
  });
  
  if (res.ok) {
    showToast('Account verified! Please login.', 'success');
    showLogin();
  } else {
    const data = await res.json();
    showToast(data.error, 'error');
  }
}

async function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (res.ok) {
    showShop();
  } else {
    showToast('Invalid credentials', 'error');
  }
}

async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  cart = [];
  document.getElementById('authPage').classList.remove('hidden');
  document.getElementById('shopPage').classList.add('hidden');
}

function showShop() {
  document.getElementById('authPage').classList.add('hidden');
  document.getElementById('shopPage').classList.remove('hidden');
  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = products.map(p => `
    <div class="product-card">
      <img src="${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <div class="price">$${p.price.toFixed(2)}</div>
      <button onclick="addToCart(${p.id})">Add to Cart</button>
    </div>
  `).join('');
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  const existing = cart.find(item => item.id === productId);
  
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  
  updateCartCount();
  showToast(`${product.name} added to cart!`, 'success');
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('cartCount').textContent = count;
}

function showHome() {
  document.getElementById('homePage').classList.remove('hidden');
  document.getElementById('cartPage').classList.add('hidden');
  document.getElementById('checkoutPage').classList.add('hidden');
}

function showCart() {
  document.getElementById('homePage').classList.add('hidden');
  document.getElementById('cartPage').classList.remove('hidden');
  document.getElementById('checkoutPage').classList.add('hidden');
  renderCart();
}

function renderCart() {
  const container = document.getElementById('cartItems');
  
  if (cart.length === 0) {
    container.innerHTML = '<p>Your cart is empty</p>';
    document.getElementById('cartTotal').innerHTML = '';
    return;
  }
  
  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-info">
        <h3>${item.name}</h3>
        <p>$${item.price.toFixed(2)} x ${item.quantity}</p>
      </div>
      <div class="cart-item-actions">
        <span>$${(item.price * item.quantity).toFixed(2)}</span>
        <button onclick="removeFromCart(${item.id})">Remove</button>
      </div>
    </div>
  `).join('');
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  document.getElementById('cartTotal').innerHTML = `Total: $${total.toFixed(2)}`;
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  updateCartCount();
  renderCart();
}

function showCheckout() {
  if (cart.length === 0) {
    showToast('Your cart is empty!', 'error');
    return;
  }
  
  document.getElementById('cartPage').classList.add('hidden');
  document.getElementById('checkoutPage').classList.remove('hidden');
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  document.getElementById('orderSummary').innerHTML = `
    <h3>Order Summary</h3>
    ${cart.map(item => `<p>${item.name} x ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}</p>`).join('')}
    <h3>Total: $${total.toFixed(2)}</h3>
  `;
}

function placeOrder() {
  showToast('Order placed successfully! Thank you for shopping with us.', 'success');
  cart = [];
  updateCartCount();
  showHome();
}
