// Cart Controller Module

const Cart = {
  items: [], // Array of { product, quantity }
  appliedCoupon: null,
  discountPercentage: 0,
  shippingCost: 40,

  init() {
    this.loadFromStorage();
    this.render();
    this.setupListeners();
  },

  setupListeners() {
    // Open cart drawer
    const openBtn = document.getElementById('open-cart-btn');
    const backdrop = document.getElementById('cart-drawer-backdrop');
    if (openBtn) {
      openBtn.addEventListener('click', () => this.toggleCart(true));
    }
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) this.toggleCart(false);
      });
    }

    // Close button
    const closeBtn = document.getElementById('close-cart-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.toggleCart(false));
    }

    // Apply Coupon
    const applyCouponBtn = document.getElementById('coupon-apply-btn');
    if (applyCouponBtn) {
      applyCouponBtn.addEventListener('click', () => this.applyPromoCode());
    }

    // Checkout Button
    const checkoutBtn = document.getElementById('checkout-pay-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => this.checkout());
    }

    // OK success checkout button
    const successBtn = document.getElementById('success-close-btn');
    if (successBtn) {
      successBtn.addEventListener('click', () => {
        document.getElementById('checkout-success-overlay').classList.remove('active');
        this.clearCart();
      });
    }
  },

  loadFromStorage() {
    const saved = localStorage.getItem('vednidan_cart');
    if (saved) {
      try {
        this.items = JSON.parse(saved);
      } catch (e) {
        this.items = [];
      }
    }
  },

  saveToStorage() {
    localStorage.setItem('vednidan_cart', JSON.stringify(this.items));
  },

  toggleCart(open) {
    const backdrop = document.getElementById('cart-drawer-backdrop');
    if (!backdrop) return;
    if (open) {
      backdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    } else {
      backdrop.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  addItem(productId, quantity = 1) {
    // Find the product details from the shop catalog
    const product = Shop.products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = this.items.find(item => item.product.id === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.items.push({ product, quantity });
    }

    this.saveToStorage();
    this.render();
    showToast(`Added ${quantity}x ${product.name} to cart!`);
    
    // Auto slide-in cart drawer for intuitive purchase feedback
    this.toggleCart(true);
  },

  updateQty(productId, newQty) {
    if (newQty < 1) {
      this.removeItem(productId);
      return;
    }

    const item = this.items.find(item => item.product.id === productId);
    if (item) {
      item.quantity = newQty;
      this.saveToStorage();
      this.render();
    }
  },

  removeItem(productId) {
    const itemIndex = this.items.findIndex(item => item.product.id === productId);
    if (itemIndex > -1) {
      const name = this.items[itemIndex].product.name;
      this.items.splice(itemIndex, 1);
      this.saveToStorage();
      this.render();
      showToast(`Removed ${name} from cart`, 'warning');
    }
  },

  clearCart() {
    this.items = [];
    this.appliedCoupon = null;
    this.discountPercentage = 0;
    
    const couponField = document.getElementById('coupon-field');
    const msgBox = document.getElementById('coupon-message-box');
    if (couponField) couponField.value = '';
    if (msgBox) {
      msgBox.className = 'coupon-alert';
      msgBox.textContent = '';
    }

    this.saveToStorage();
    this.render();
  },

  applyPromoCode() {
    const field = document.getElementById('coupon-field');
    const msgBox = document.getElementById('coupon-message-box');
    if (!field || !msgBox) return;

    const code = field.value.trim().toUpperCase();

    if (code === 'VEDNIDAN10') {
      this.appliedCoupon = code;
      this.discountPercentage = 10;
      msgBox.className = 'coupon-alert success';
      msgBox.textContent = '10% promo code applied successfully!';
      showToast('10% discount applied!', 'success');
      this.render();
    } else if (code === '') {
      this.appliedCoupon = null;
      this.discountPercentage = 0;
      msgBox.className = 'coupon-alert';
      msgBox.textContent = '';
      this.render();
    } else {
      msgBox.className = 'coupon-alert error';
      msgBox.textContent = 'Invalid promo code. Try VEDNIDAN10.';
      showToast('Invalid promo code', 'error');
    }
  },

  async checkout() {
    if (this.items.length === 0) {
      showToast('Cannot checkout with an empty cart!', 'warning');
      return;
    }

    let customerName = Auth && Auth.currentUser ? Auth.currentUser.name : null;
    let customerEmail = Auth && Auth.currentUser ? Auth.currentUser.email : null;

    if (!customerName) {
      customerName = prompt("Please enter your name for delivery:", "Guest User");
      if (!customerName) return;
    }

    if (!customerEmail) {
      customerEmail = prompt("Please enter your email address for order updates:", "guest@vednidan.com");
      if (!customerEmail) return;
    }

    const checkoutBtn = document.getElementById('checkout-pay-btn');
    checkoutBtn.disabled = true;
    checkoutBtn.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Processing payment...`;

    try {
      const calculations = this.calculateInvoice();
      const orderData = {
        customerName,
        customerEmail,
        items: this.items.map(item => ({
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity
        })),
        subtotal: calculations.subtotal,
        discount: calculations.discountAmount,
        shipping: calculations.shipping,
        total: calculations.total
      };

      const response = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) throw new Error('Failed to create order on server');
      const data = await response.json();

      checkoutBtn.disabled = false;
      checkoutBtn.innerHTML = `Proceed to Secure Checkout <i class="ri-lock-line"></i>`;

      const summaryText = document.getElementById('success-invoice-summary');
      if (summaryText) {
        summaryText.innerHTML = `
          Thank you for choosing VedNidan Healthcare. 
          Your order has been placed successfully under Order ID: <strong>#${data.order.id}</strong> for a grand total of <strong>₹${calculations.total}</strong>. 
          A secure tracking link and SMS confirmation have been sent to your registered contact details.
        `;
      }

      this.toggleCart(false);
      document.getElementById('checkout-success-overlay').classList.add('active');

    } catch (error) {
      console.error('Checkout error:', error);
      checkoutBtn.disabled = false;
      checkoutBtn.innerHTML = `Proceed to Secure Checkout <i class="ri-lock-line"></i>`;
      showToast('Error processing checkout. Please try again.', 'error');
    }
  },

  calculateInvoice() {
    let subtotal = 0;
    this.items.forEach(item => {
      subtotal += item.product.price * item.quantity;
    });

    const discountAmount = Math.round(subtotal * (this.discountPercentage / 100));
    
    // Free shipping above 500 rupees, otherwise 40 rupees
    let shipping = subtotal > 500 || subtotal === 0 ? 0 : 40;
    
    const total = subtotal - discountAmount + shipping;

    return {
      subtotal,
      discountAmount,
      shipping,
      total
    };
  },

  render() {
    // 1. Update Cart Badges Count
    const totalItemsCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById('cart-badge-count');
    if (badge) badge.textContent = totalItemsCount;

    // 2. Render List Items inside Drawer
    const listContainer = document.getElementById('cart-items-container');
    if (!listContainer) return;

    if (this.items.length === 0) {
      listContainer.innerHTML = `
        <div class="cart-empty-state">
          <div class="cart-empty-icon"><i class="ri-shopping-basket-line"></i></div>
          <h3>Your cart is empty</h3>
          <p>Add remedies from our store or consult the AI Doctor to receive health recommendations.</p>
        </div>
      `;
      
      // Reset invoice values in UI
      this.updateInvoiceUI(0, 0, 0, 0);
      return;
    }

    listContainer.innerHTML = this.items.map(item => `
      <div class="cart-item-row">
        <img class="cart-item-image" src="${item.product.image}" alt="${item.product.name}" onerror="this.src='https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&q=80&w=100'">
        <div class="cart-item-info">
          <span class="cart-item-name">${item.product.name}</span>
          <span class="cart-item-price">₹${item.product.price}</span>
          <div class="cart-item-actions">
            <div class="cart-qty-ctrl">
              <button class="cart-qty-btn" onclick="Cart.updateQty(${item.product.id}, ${item.quantity - 1})">-</button>
              <span class="cart-qty-val">${item.quantity}</span>
              <button class="cart-qty-btn" onclick="Cart.updateQty(${item.product.id}, ${item.quantity + 1})">+</button>
            </div>
            <button class="cart-item-delete" onclick="Cart.removeItem(${item.product.id})" aria-label="Remove item">
              <i class="ri-delete-bin-line"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');

    // 3. Update pricing details
    const invoice = this.calculateInvoice();
    this.updateInvoiceUI(invoice.subtotal, invoice.discountAmount, invoice.shipping, invoice.total);
  },

  updateInvoiceUI(subtotal, discount, shipping, total) {
    const subtotalDisplay = document.getElementById('cart-math-subtotal');
    const discountContainer = document.getElementById('cart-math-discount-container');
    const discountDisplay = document.getElementById('cart-math-discount');
    const shippingDisplay = document.getElementById('cart-math-shipping');
    const totalDisplay = document.getElementById('cart-math-total');

    if (subtotalDisplay) subtotalDisplay.textContent = `₹${subtotal}`;
    
    if (discountContainer && discountDisplay) {
      if (discount > 0) {
        discountContainer.style.display = 'flex';
        discountDisplay.textContent = `-₹${discount}`;
      } else {
        discountContainer.style.display = 'none';
      }
    }

    if (shippingDisplay) {
      shippingDisplay.textContent = shipping === 0 ? 'FREE' : `₹${shipping}`;
    }

    if (totalDisplay) totalDisplay.textContent = `₹${total}`;

    // Update Free Shipping Progress Tracker UI
    const trackerBox = document.getElementById('shipping-tracker-box');
    const progressText = document.getElementById('shipping-progress-text');
    const progressFill = document.getElementById('shipping-progress-fill');

    if (trackerBox && progressText && progressFill) {
      if (subtotal === 0) {
        progressFill.style.width = '0%';
        progressText.innerHTML = `Add items worth <strong>₹500</strong> more to get FREE Shipping!`;
      } else if (subtotal < 500) {
        const remaining = 500 - subtotal;
        const percent = Math.min(100, (subtotal / 500) * 100);
        progressFill.style.width = `${percent}%`;
        progressText.innerHTML = `Add items worth <strong>₹${remaining}</strong> more to get <strong>FREE Shipping!</strong>`;
      } else {
        progressFill.style.width = '100%';
        progressText.innerHTML = `Congratulations! You've unlocked <strong>FREE Shipping!</strong> 🎉`;
      }
    }
  }
};
