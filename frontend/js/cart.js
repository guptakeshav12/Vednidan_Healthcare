// Cart Controller Module

// ================================================================
// UPI DIRECT PAYMENT CONFIG — Fill your company UPI VPA below
// ================================================================
// To set your UPI ID: replace 'YOUR_UPI_ID@bank' with your actual
// UPI VPA e.g. 'vednidan@icici' or '9876543210@paytm'
// ================================================================
const COMPANY_UPI_ID   = '9772915042icici@ybl';          // <--- CHANGE THIS to your real UPI VPA
const COMPANY_UPI_NAME = 'VedNidan Healthcare';   // Merchant name shown in UPI app
// ================================================================

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
        this.openPaymentModal();
      });
    }

    const checkoutSubmitBtn = document.getElementById('checkout-submit-order-btn');
    if (checkoutSubmitBtn) {
      checkoutSubmitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openPaymentModal();
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

    // Payment & Delivery Tracker Close Buttons
    const payCloseBtn = document.getElementById('payment-close-btn');
    if (payCloseBtn) {
      payCloseBtn.addEventListener('click', () => {
        document.getElementById('payment-modal-backdrop').style.display = 'none';
      });
    }

    const trackBtn = document.getElementById('track-order-btn');
    if (trackBtn) {
      trackBtn.addEventListener('click', () => {
        document.getElementById('checkout-success-overlay').classList.remove('active');
        document.getElementById('delivery-modal-backdrop').style.display = 'flex';
      });
    }

    const delCloseBtn = document.getElementById('delivery-close-btn');
    if (delCloseBtn) {
      delCloseBtn.addEventListener('click', () => {
        document.getElementById('delivery-modal-backdrop').style.display = 'none';
        this.clearCart();
        if (typeof App !== 'undefined' && App.navigateTo) {
          App.navigateTo('shop-page');
        }
      });
    }

    // View Invoice / Bill button
    const viewInvoiceBtn = document.getElementById('view-invoice-btn');
    if (viewInvoiceBtn) {
      viewInvoiceBtn.addEventListener('click', () => {
        this.showInvoice();
      });
    }

    // Invoice Modal close buttons
    const invClose1 = document.getElementById('invoice-close-btn');
    if (invClose1) invClose1.addEventListener('click', () => {
      document.getElementById('invoice-modal-backdrop').style.display = 'none';
    });
    const invClose2 = document.getElementById('invoice-close-btn-2');
    if (invClose2) invClose2.addEventListener('click', () => {
      document.getElementById('invoice-modal-backdrop').style.display = 'none';
    });
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

  async addItem(productId, quantity = 1) {
    // Find the product details from the shop catalog (handle string/number IDs safely)
    let product = (typeof Shop !== 'undefined' && Array.isArray(Shop.products))
      ? Shop.products.find(p => String(p.id) === String(productId))
      : null;

    // Fallback: fetch from backend API if not in the currently loaded page slice
    if (!product && typeof Api !== 'undefined' && Api.getProductById) {
      product = await Api.getProductById(productId);
    }

    if (!product) {
      if (typeof showToast === 'function') showToast('Unable to add product to cart. Please try again.', 'error');
      return;
    }

    const existingItem = this.items.find(item => String(item.product.id) === String(productId));

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

  openPaymentModal() {
    // 1. Validate all delivery fields cleanly with clear user feedback
    const nameEl = document.getElementById('checkout-name');
    const emailEl = document.getElementById('checkout-email');
    const addrEl = document.getElementById('checkout-address');
    const cityEl = document.getElementById('checkout-city');
    const stateEl = document.getElementById('checkout-state');
    const zipEl = document.getElementById('checkout-zip');
    const phoneEl = document.getElementById('checkout-phone');

    const fields = [
      { el: nameEl, name: 'Full Name', valid: nameEl && nameEl.value.trim().length >= 2, msg: 'Please enter your full name (minimum 2 characters).' },
      { el: emailEl, name: 'Email Address', valid: emailEl && /^\S+@\S+\.\S+$/.test(emailEl.value.trim()), msg: 'Please enter a valid email address.' },
      { el: addrEl, name: 'Street Address', valid: addrEl && addrEl.value.trim().length >= 5, msg: 'Please enter your complete street address.' },
      { el: cityEl, name: 'City', valid: cityEl && cityEl.value.trim().length >= 2, msg: 'Please enter your city.' },
      { el: stateEl, name: 'State', valid: stateEl && stateEl.value.trim().length >= 2, msg: 'Please enter your state.' },
      { el: zipEl, name: 'PIN Code', valid: zipEl && /^\d{6}$/.test(zipEl.value.trim()), msg: 'Please enter a valid 6-digit PIN code.' },
      { el: phoneEl, name: 'Mobile Number', valid: phoneEl && /^[6-9]\d{9}$/.test(phoneEl.value.trim().replace(/\D/g, '')), msg: 'Please enter a valid 10-digit mobile number.' }
    ];

    // Reset styles
    fields.forEach(f => {
      if (f.el) {
        f.el.style.borderColor = '#cbd5e1';
        f.el.style.boxShadow = 'none';
      }
    });

    // Check for first invalid field
    for (const f of fields) {
      if (!f.valid) {
        if (f.el) {
          f.el.style.borderColor = '#e74c3c';
          f.el.style.boxShadow = '0 0 0 3px rgba(231,76,60,0.2)';
          f.el.focus();
          f.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        showToast(f.msg, 'warning');
        return;
      }
    }

    if (this.items.length === 0) {
      showToast('Cannot place order with an empty cart!', 'warning');
      return;
    }

    const invoice = this.calculateInvoice();
    const amountEl = document.getElementById('payment-amount-display');
    if (amountEl) amountEl.textContent = `₹${invoice.total}`;
    
    // Reset view safely
    this.switchPayTab('upi');
    // Generate dynamic UPI QR code with cart total
    const qrAmt = invoice.total;
    if (typeof QRCode !== 'undefined') {
      this.generateUpiQr(qrAmt);
    }
    const mainBody = document.getElementById('payment-main-body');
    if (mainBody) mainBody.style.display = 'block';

    const procState = document.getElementById('payment-processing-state');
    if (procState) procState.style.display = 'none';

    const otpBox = document.getElementById('otp-simulation-box');
    if (otpBox) otpBox.style.display = 'none';

    const spinBox = document.getElementById('processing-spinner-box');
    if (spinBox) spinBox.style.display = 'block';
    
    // Open payment modal cleanly
    const modal = document.getElementById('payment-modal-backdrop');
    if (modal) {
      modal.style.display = 'flex';
      modal.style.opacity = '1';
      modal.style.visibility = 'visible';
    }
  },

  switchPayTab(tab) {
    this._currentPayTab = tab;
    // Highlight button
    const tabs = ['upi', 'card', 'net', 'cod'];
    tabs.forEach(t => {
      const btn = document.getElementById(`tab-${t}`);
      const content = document.getElementById(`content-${t}`);
      if (btn) {
        if (t === tab) {
          btn.style.borderColor = '#2b84ea';
          btn.style.background = '#f0f7ff';
          btn.querySelector('i').style.color = '#2b84ea';
          btn.querySelector('span').style.color = '#0c2340';
        } else {
          btn.style.borderColor = '#e2e8f0';
          btn.style.background = 'white';
          btn.querySelector('i').style.color = '#64748b';
          btn.querySelector('span').style.color = '#64748b';
        }
      }
      if (content) {
        content.style.display = (t === tab) ? 'block' : 'none';
      }
    });
  },

  fillDemoCard() {
    const num = document.getElementById('card-number-input');
    const name = document.getElementById('card-name-input');
    const exp = document.getElementById('card-exp-input');
    const cvv = document.getElementById('card-cvv-input');
    if (num) num.value = '4532 8901 2345 6789';
    if (name) name.value = document.getElementById('checkout-name')?.value || 'Test Patient';
    if (exp) exp.value = '12/28';
    if (cvv) cvv.value = '888';
    showToast('Test Card details filled!', 'info');
  },

  async executePayment(method) {
    this._lastPaymentMethod = method;
    const invoice = this.calculateInvoice();

    // 1. Direct validation per method
    if (method === 'Card') {
      const num = document.getElementById('card-number-input')?.value.replace(/\s+/g, '') || '';
      if (num.length < 15) {
        showToast('Please enter a valid card number (or click "Fill Test Card")', 'warning');
        return;
      }
    }

    if (method === 'Cash on Delivery') {
      document.getElementById('payment-main-body').style.display = 'none';
      document.getElementById('payment-processing-state').style.display = 'block';
      document.getElementById('processing-status-text').textContent = 'Confirming Cash on Delivery Order...';
      setTimeout(() => {
        document.getElementById('payment-modal-backdrop').style.display = 'none';
        showToast('Order Placed Successfully! (Pay ₹' + invoice.total + ' on Delivery)', 'success');
        this.placeOrder();
      }, 900);
      return;
    }

    // 2. Online Payment (UPI, Card, Net Banking)
    document.getElementById('payment-main-body').style.display = 'none';
    document.getElementById('payment-processing-state').style.display = 'block';

    if (method === 'Card') {
      // Show 3D Secure OTP authentication screen
      document.getElementById('processing-spinner-box').style.display = 'none';
      document.getElementById('otp-simulation-box').style.display = 'block';
      return;
    }

    // For UPI / Net Banking
    const statusText = method === 'UPI' 
      ? `Awaiting UPI authorization for ₹${invoice.total}...` 
      : `Connecting to Bank Gateway...`;
    document.getElementById('processing-status-text').textContent = statusText;

    // Simulate authentic Gateway verification
    setTimeout(() => {
      document.getElementById('payment-modal-backdrop').style.display = 'none';
      showToast(`${method} Payment of ₹${invoice.total} Verified Successfully! ✓`, 'success');
      this.placeOrder();
    }, 1800);
  },

  // ================================================================
  // UPI DIRECT PAYMENT METHODS
  // ================================================================

  /**
   * generateUpiQr(amount)
   * Builds a UPI deep-link and renders a scannable QR code inside
   * #upi-qr-container. Any UPI app (GPay, PhonePe, Paytm) auto-fills
   * the merchant name and amount when scanned.
   */
  generateUpiQr(amount) {
    const container = document.getElementById('upi-qr-container');
    const upiIdDisplay = document.getElementById('upi-id-display');
    const amountDisplay = document.getElementById('upi-qr-amount-display');

    if (!container) return;

    // Show current amount in QR header
    if (amountDisplay) amountDisplay.textContent = amount;

    // Show UPI ID to user
    if (upiIdDisplay) upiIdDisplay.textContent = COMPANY_UPI_ID;

    // UPI deep-link format (supported by all major UPI apps)
    const upiUrl = `upi://pay?pa=${encodeURIComponent(COMPANY_UPI_ID)}&pn=${encodeURIComponent(COMPANY_UPI_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent('VedNidan Order Payment')}`;

    // Clear previous QR
    container.innerHTML = '';

    // Generate QR using QRCode.js
    try {
      new QRCode(container, {
        text: upiUrl,
        width: 160,
        height: 160,
        colorDark: '#0f172a',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    } catch (err) {
      container.innerHTML = '<div style="color:#e74c3c; font-size:11px; padding:10px;">QR generation failed.<br>Please use UPI ID directly.</div>';
      console.error('QRCode error:', err);
    }
  },

  /**
   * confirmUpiPayment()
   * Called when customer clicks "I Have Paid — Confirm Order".
   * Closes the modal and places the order.
   */
  confirmUpiPayment() {
    this._lastPaymentMethod = 'UPI Direct';
    const invoice = this.calculateInvoice();

    // Close modal
    const modal = document.getElementById('payment-modal-backdrop');
    if (modal) modal.style.display = 'none';

    // Show success toast
    showToast(`✔ UPI Payment of ₹${invoice.total} confirmed! Order Placed.`, 'success');

    // Place order in DB and show invoice
    this.placeOrder();
  },

  submitOtp() {
    const otp = document.getElementById('otp-input-field')?.value || '';
    if (otp.length !== 6) {
      showToast('Please enter the 6-digit OTP (e.g. 123456)', 'warning');
      return;
    }
    document.getElementById('otp-simulation-box').style.display = 'none';
    document.getElementById('processing-spinner-box').style.display = 'block';
    document.getElementById('processing-status-text').textContent = 'Authorizing payment with Card Issuer...';

    setTimeout(() => {
      document.getElementById('payment-modal-backdrop').style.display = 'none';
      showToast('Card Payment Authorized Successfully! ✓', 'success');
      this.placeOrder();
    }, 1200);
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
        paymentMethod: this._lastPaymentMethod || 'Unknown',
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

      // Save last order info for invoice display
      this._lastOrderId = data.order.id;
      this._lastOrderData = orderData;
      this._lastInvoice = invoice;

      placeBtn.disabled = false;
      placeBtn.innerHTML = `<i class="ri-checkbox-circle-line"></i> Confirm & Place Order`;

      // Trigger success overlay
      const summaryText = document.getElementById('success-invoice-summary');
      if (summaryText) {
        summaryText.innerHTML = `
          Order <strong style="color:var(--primary);">#VN-${data.order.id}</strong> placed for <strong>₹${invoice.total}</strong>.<br>
          Payment Method: <strong>${this._lastPaymentMethod || 'UPI Direct'}</strong>. Status: <strong style="color:#27ae60;">PAID ✓</strong>.<br>
          Estimated Delivery: <strong>2–3 business days</strong> by Delhivery Express.
        `;
      }
      document.getElementById('checkout-success-overlay').classList.add('active');

      // Instant Multi-Channel Notification Alert (SMS & Email simulation)
      setTimeout(() => {
        const notifCard = document.createElement('div');
        notifCard.id = 'instant-order-notif-toast';
        notifCard.style.cssText = `
          position: fixed; top: 20px; right: 20px; z-index: 999999;
          background: #0f172a; color: white; border-radius: 12px;
          padding: 16px 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.4);
          max-width: 360px; font-family: sans-serif; border-left: 5px solid #22c55e;
          animation: slideInRight 0.4s ease;
        `;
        notifCard.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-size:12px; font-weight:800; color:#4ade80; display:flex; align-items:center; gap:6px;">
              <i class="ri-notification-3-fill"></i> NOTIFICATIONS DISPATCHED
            </span>
            <button onclick="this.parentElement.parentElement.remove()" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:16px;">&times;</button>
          </div>
          <div style="font-size:12px; color:#e2e8f0; line-height:1.4; margin-bottom:8px;">
            <strong>📱 SMS & WhatsApp:</strong> Sent to <strong>+91-${phone}</strong> with live tracking link and order receipt.
          </div>
          <div style="font-size:12px; color:#e2e8f0; line-height:1.4;">
            <strong>📧 Email:</strong> Tax Invoice & Bill PDF sent to <strong>${email}</strong>.
          </div>
        `;
        document.body.appendChild(notifCard);

        setTimeout(() => {
          if (notifCard.parentElement) notifCard.remove();
        }, 8000);
      }, 800);

    } catch (err) {
      console.error(err);
      placeBtn.disabled = false;
      placeBtn.innerHTML = `<i class="ri-checkbox-circle-line"></i> Confirm & Place Order`;
      showToast('Error placing order. Please try again.', 'error');
    }
  },

  showInvoice() {
    const od = this._lastOrderData;
    const inv = this._lastInvoice;
    const orderId = this._lastOrderId;
    if (!od || !inv) {
      showToast('No order data available yet.', 'warning');
      return;
    }

    // Populate Bill To
    document.getElementById('inv-name').textContent = od.customerName;
    document.getElementById('inv-address').textContent = `${od.shippingAddress}, ${od.shippingCity}, ${od.shippingState} - ${od.shippingZip}`;
    document.getElementById('inv-phone').textContent = `📞 ${od.shippingPhone}`;
    document.getElementById('inv-email').textContent = `✉ ${od.customerEmail}`;

    // Invoice Info
    document.getElementById('inv-date').textContent = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    document.getElementById('inv-payment').textContent = od.paymentMethod || 'UPI Direct';
    document.getElementById('invoice-order-id-label').textContent = `Order #VN-${orderId}`;

    // Items table
    const tbody = document.getElementById('inv-items-tbody');
    tbody.innerHTML = od.items.map((item, i) => `
      <tr style="border-bottom:1px solid #f0f0f0;">
        <td style="padding:8px;">${i + 1}</td>
        <td style="padding:8px;">${item.name}</td>
        <td style="padding:8px; text-align:center;">${item.quantity}</td>
        <td style="padding:8px; text-align:right;">₹${item.price}</td>
        <td style="padding:8px; text-align:right; font-weight:600;">₹${item.price * item.quantity}</td>
      </tr>
    `).join('');

    // Totals
    document.getElementById('inv-subtotal').textContent = `₹${inv.subtotal}`;
    document.getElementById('inv-discount').textContent = `-₹${inv.discountAmount}`;
    document.getElementById('inv-shipping').textContent = inv.shipping === 0 ? 'FREE' : `₹${inv.shipping}`;
    document.getElementById('inv-total').textContent = `₹${inv.total}`;

    // Generate barcode using JsBarcode
    try {
      if (typeof JsBarcode !== 'undefined') {
        JsBarcode('#invoice-barcode', `VDN${orderId}`, {
          format: 'CODE128',
          width: 2,
          height: 50,
          displayValue: true,
          fontSize: 10,
          margin: 4
        });
      }
    } catch(e) { console.warn('Barcode gen error', e); }

    // Show modal
    document.getElementById('checkout-success-overlay').classList.remove('active');
    document.getElementById('invoice-modal-backdrop').style.display = 'flex';
  },

  printInvoice() {
    const printArea = document.getElementById('invoice-print-area');
    const win = window.open('', 'PRINT', 'width=700,height=900');
    win.document.write(`
      <html><head>
        <base href="${window.location.origin}/">
        <title>VedNidan Healthcare Invoice</title>
        <style>
          body { font-family: 'Courier New', monospace; color: #333; padding: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px; border-bottom: 1px solid #ddd; }
          th { background: #f5f5f5; }
          @media print { body { margin: 0; } }
        </style>
      </head><body>${printArea.innerHTML}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
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

window.Cart = Cart;
