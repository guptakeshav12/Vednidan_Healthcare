// Order Tracking Controller Module

const Tracking = {
  init() {
    this.setupListeners();
  },

  setupListeners() {
    const searchBtn = document.getElementById('tracking-search-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.trackOrder());
    }

    const inputId = document.getElementById('tracking-input-id');
    if (inputId) {
      inputId.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.trackOrder();
        }
      });
    }
  },

  async trackOrder() {
    const inputField = document.getElementById('tracking-input-id');
    if (!inputField) return;

    const orderIdStr = inputField.value.trim();
    if (!orderIdStr) {
      showToast('Please enter an Order ID first', 'warning');
      return;
    }

    const searchBtn = document.getElementById('tracking-search-btn');
    searchBtn.disabled = true;
    searchBtn.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Tracking...`;

    try {
      // Fetch all orders
      const response = await fetch((window.API_BASE || '/api') + '/admin/orders');
      if (!response.ok) throw new Error('Failed to retrieve order listings');
      
      const ordersList = await response.json();
      const targetId = parseInt(orderIdStr);

      const order = ordersList.find(o => o.id === targetId);

      if (!order) {
        showToast('No order found with the provided ID', 'error');
        document.getElementById('tracking-results-card').style.display = 'none';
        searchBtn.disabled = false;
        searchBtn.innerHTML = 'Track Order';
        return;
      }

      // Populate order data in UI
      document.getElementById('track-order-id-label').textContent = order.id;
      document.getElementById('track-order-date').textContent = new Date(order.orderedAt).toLocaleDateString();
      
      // Status badge style
      const statusBadge = document.getElementById('track-status-badge');
      statusBadge.textContent = order.status;
      statusBadge.className = `badge badge-${order.status.toLowerCase()}`;

      // Shipping address details
      document.getElementById('track-shipping-name').innerHTML = `<strong>Name:</strong> ${order.customerName}`;
      document.getElementById('track-shipping-address').innerHTML = `<strong>Address:</strong> ${order.shippingAddress}, ${order.shippingCity}, ${order.shippingState} - ${order.shippingZip}`;
      document.getElementById('track-shipping-phone').innerHTML = `<strong>Phone:</strong> ${order.shippingPhone}`;

      // Items list
      const itemsContainer = document.getElementById('track-order-items-list');
      itemsContainer.innerHTML = order.items.map(item => `
        <li style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:13px; color:var(--text-secondary);">
          <span>${item.name} <strong>(x${item.quantity})</strong></span>
          <span>₹${item.price * item.quantity}</span>
        </li>
      `).join('');

      document.getElementById('track-order-total-price').textContent = order.total;

      // Update Timeline Steps
      this.updateTimelineUI(order.status);

      // Display results card
      document.getElementById('tracking-results-card').style.display = 'block';
      showToast('Order details retrieved!', 'success');

    } catch (err) {
      console.error(err);
      showToast('Error tracking order. Please try again.', 'error');
    } finally {
      searchBtn.disabled = false;
      searchBtn.innerHTML = 'Track Order';
    }
  },

  updateTimelineUI(status) {
    const lineFill = document.getElementById('track-progress-fill-line');
    const stepPlaced = document.getElementById('step-track-placed');
    const stepShipped = document.getElementById('step-track-shipped');
    const stepDelivered = document.getElementById('step-track-delivered');

    // Reset steps
    stepPlaced.classList.remove('active');
    stepShipped.classList.remove('active');
    stepDelivered.classList.remove('active');

    if (status === 'Pending') {
      lineFill.style.width = '0%';
      stepPlaced.classList.add('active');
    } else if (status === 'Shipped') {
      lineFill.style.width = '50%';
      stepPlaced.classList.add('active');
      stepShipped.classList.add('active');
    } else if (status === 'Delivered') {
      lineFill.style.width = '100%';
      stepPlaced.classList.add('active');
      stepShipped.classList.add('active');
      stepDelivered.classList.add('active');
    } else if (status === 'Cancelled') {
      lineFill.style.width = '0%';
      // No steps marked active, shows status badge
    }
  }
};
