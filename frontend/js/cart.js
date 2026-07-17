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

    // Checkout Button (Redirects to custom Checkout Page)
    const checkoutBtn = document.getElementById('checkout-pay-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        this.toggleCart(false);
        if (typeof App !== 'undefined' && App.navigateTo) {
          App.navigateTo('checkout-page');
          this.renderCheckout();
        }
      });
    }

    // Checkout Form Place Order Button
    const checkoutForm = document.getElementById('checkout-shipping-form');
    if (checkoutForm) {
      checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.placeOrder();
      });
    }

    // OK success checkout button
    const successBtn = document.getElementById('success-close-btn');
    if (successBtn) {
      successBtn.addEventListener('click', () => {
        document.getElementById('checkout-success-overlay').classList.remove('active');
        this.clearCart();
        if (typeof App !== 'undefined' && App.navigateTo) {
          App.navigateTo('shop-page');
        }
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

  renderCheckout() {
    const summaryItems = document.getElementById('checkout-summary-items');
    if (!summaryItems) return;

    if (this.items.length === 0) {
      summaryItems.innerHTML = `<p style="color:var(--text-muted);">Your checkout cart is empty.</p>`;
      return;
    }

    summaryItems.innerHTML = this.items.map(item => `
      <div style="display:flex; justify-content:space-between; margin-bottom:12px; font-size:14px; border-bottom:1px solid rgba(255,255,255,0.03); padding-bottom:8px;">
        <div>
          <strong style="color:var(--text-main);">${item.product.name}</strong>
          <div style="color:var(--text-muted); font-size:12px;">Qty: ${item.quantity} × ₹${item.product.price}</div>
        </div>
        <span style="font-weight:700; color:var(--primary);">₹${item.product.price * item.quantity}</span>
      </div>
    `).join('');

    // Set totals on checkout page
    const invoice = this.calculateInvoice();
    document.getElementById('checkout-subtotal').textContent = `₹${invoice.subtotal}`;
    
    const discountRow = document.getElementById('checkout-discount-row');
    const discountVal = document.getElementById('checkout-discount');
    if (discountRow && discountVal) {
      if (invoice.discountAmount > 0) {
        discountRow.style.display = 'flex';
        discountVal.textContent = `-₹${invoice.discountAmount}`;
      } else {
        discountRow.style.display = 'none';
      }
    }

    document.getElementById('checkout-shipping').textContent = invoice.shipping === 0 ? 'FREE' : `₹${invoice.shipping}`;
    document.getElementById('checkout-total').textContent = `₹${invoice.total}`;

    // Prefill user details if logged in
    if (typeof Auth !== 'undefined' && Auth.currentUser) {
      const nameInput = document.getElementById('checkout-name');
      const emailInput = document.getElementById('checkout-email');
      if (nameInput) nameInput.value = Auth.currentUser.name;
      if (emailInput) emailInput.value = Auth.currentUser.email;
    }
  },

  async placeOrder() {
    const name = document.getElementById('checkout-name').value;
    const email = document.getElementById('checkout-email').value;
    const address = document.getElementById('checkout-address').value;
    const city = document.getElementById('checkout-city').value;
    const state = document.getElementById('checkout-state').value;
    const zip = document.getElementById('checkout-zip').value;
    const phone = document.getElementById('checkout-phone').value;

    if (this.items.length === 0) {
      showToast('Cannot place order with an empty cart!', 'warning');
      return;
    }

    const placeBtn = document.getElementById('checkout-submit-order-btn');
    placeBtn.disabled = true;
    placeBtn.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Placing order...`;

    try {
      const invoice = this.calculateInvoice();
      const orderData = {
        customerName: name,
        customerEmail: email,
        shippingAddress: address,
        shippingCity: city,
        shippingState: state,
        shippingZip: zip,
        shippingPhone: phone,
        items: this.items.map(item => ({
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity
        })),
        subtotal: invoice.subtotal,
        discount: invoice.discountAmount,
        shipping: invoice.shipping,
        total: invoice.total
      };

      const response = await fetch((window.API_BASE || '/api') + '/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) throw new Error('Order submission failed');
      const data = await response.json();

      placeBtn.disabled = false;
      placeBtn.innerHTML = `<i class="ri-checkbox-circle-line"></i> Confirm & Place Order`;

      // Trigger success overlay
      const summaryText = document.getElementById('success-invoice-summary');
      if (summaryText) {
        summaryText.innerHTML = `
          Thank you for choosing VedNidan Healthcare. 
          Your order has been placed successfully under Order ID: <strong style="color:var(--primary);">#${data.order.id}</strong> for a grand total of <strong>₹${invoice.total}</strong>. 
          You can track your package details using our new Order Tracking page using this ID!
        `;
      }
      document.getElementById('checkout-success-overlay').classList.add('active');

    } catch (err) {
      console.error(err);
      placeBtn.disabled = false;
      placeBtn.innerHTML = `<i class="ri-checkbox-circle-line"></i> Confirm & Place Order`;
      showToast('Error placing order. Please try again.', 'error');
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
