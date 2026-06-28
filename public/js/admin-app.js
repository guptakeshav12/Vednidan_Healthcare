// Admin Panel Dashboard Engine

const AdminApp = {
  activeTab: 'dashboard',
  products: [],
  orders: [],
  bookings: [],
  therapistBookings: [],

  init() {
    this.setupListeners();
    this.loadActiveTab();
  },

  setupListeners() {
    // Sidebar Tabs listener
    const menuItems = document.querySelectorAll('.admin-menu-item');
    menuItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const tabName = item.getAttribute('data-tab');
        this.switchTab(tabName);
      });
    });
  },

  switchTab(tabName) {
    this.activeTab = tabName;
    
    // Update active tab class in Sidebar UI
    document.querySelectorAll('.admin-menu-item').forEach(item => {
      if (item.getAttribute('data-tab') === tabName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update active view content
    document.querySelectorAll('.admin-view').forEach(view => {
      if (view.id === `view-${tabName}`) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    // Update Title and Action Header Contextually
    this.updateHeaderContext(tabName);
    this.loadTabData(tabName);
  },

  updateHeaderContext(tabName) {
    const titleEl = document.getElementById('admin-current-view-title');
    const descEl = document.getElementById('admin-current-view-desc');
    const actionEl = document.getElementById('admin-header-actions-container');

    actionEl.innerHTML = ''; // reset

    switch (tabName) {
      case 'dashboard':
        titleEl.textContent = 'Dashboard Overview';
        descEl.textContent = 'Monitor sales, orders, and customer appointments in real time.';
        break;
      case 'products':
        titleEl.textContent = 'Products Catalog Manager';
        descEl.textContent = 'Add, modify, and remove Ayurvedic remedies from the store database.';
        actionEl.innerHTML = `
          <button class="btn-admin-primary" onclick="openAddProductModal()">
            <i class="ri-add-line"></i> Add New Product
          </button>
        `;
        break;
      case 'orders':
        titleEl.textContent = 'Orders Shipment Manager';
        descEl.textContent = 'Review order details, print receipts, and update shipping progress.';
        break;
      case 'bookings':
        titleEl.textContent = 'Doctor Appointments';
        descEl.textContent = 'Review scheduled clinical doctor appointments and slot bookings.';
        break;
      case 'therapist-bookings':
        titleEl.textContent = 'Therapist Appointments';
        descEl.textContent = 'Manage in-clinic therapy and Panchakarma sessions scheduling.';
        break;
    }
  },

  loadActiveTab() {
    // Read hash if available, else load dashboard
    const hash = window.location.hash.replace('#', '');
    if (['dashboard', 'products', 'orders', 'bookings', 'therapist-bookings'].includes(hash)) {
      this.switchTab(hash);
    } else {
      this.switchTab('dashboard');
    }
  },

  async loadTabData(tabName) {
    switch (tabName) {
      case 'dashboard':
        await this.fetchStats();
        await this.fetchDashboardRecentData();
        break;
      case 'products':
        await this.fetchProducts();
        break;
      case 'orders':
        await this.fetchOrders();
        break;
      case 'bookings':
        await this.fetchDoctorBookings();
        break;
      case 'therapist-bookings':
        await this.fetchTherapistBookings();
        break;
    }
  },

  // === API CALLS ===

  async fetchStats() {
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error();
      const stats = await res.json();
      
      document.getElementById('stat-revenue').textContent = `₹${stats.revenue.toLocaleString()}`;
      document.getElementById('stat-orders').textContent = stats.ordersCount;
      document.getElementById('stat-bookings').textContent = stats.bookingsCount;
      document.getElementById('stat-therapist-bookings').textContent = stats.therapistBookingsCount;
    } catch (e) {
      console.error('Error fetching statistics:', e);
    }
  },

  async fetchDashboardRecentData() {
    try {
      const res = await fetch('/api/admin/orders');
      if (!res.ok) throw new Error();
      const orders = await res.json();
      
      const recentPending = orders.filter(o => o.status === 'Pending').slice(0, 5);
      const container = document.getElementById('dashboard-recent-orders');
      
      if (recentPending.length === 0) {
        container.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--admin-text-muted);">No pending orders at the moment.</td></tr>`;
        return;
      }

      container.innerHTML = recentPending.map(o => `
        <tr>
          <td><strong>#${o.id}</strong></td>
          <td>${o.customerName}</td>
          <td>${o.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}</td>
          <td>₹${o.total}</td>
          <td><span class="badge badge-pending">Pending</span></td>
          <td>${new Date(o.orderedAt).toLocaleDateString()}</td>
        </tr>
      `).join('');
    } catch (e) {
      console.error('Error loading dashboard recent data:', e);
    }
  },

  async fetchProducts() {
    try {
      const res = await fetch('/api/products?limit=100');
      if (!res.ok) throw new Error();
      const data = await res.json();
      this.products = data.products;

      const container = document.getElementById('products-table-body');
      if (this.products.length === 0) {
        container.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--admin-text-muted);">No products found in database.</td></tr>`;
        return;
      }

      container.innerHTML = this.products.map(p => `
        <tr>
          <td><img src="${p.image}" alt="${p.name}" class="product-img-th" onerror="this.src='https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&q=80&w=100'"></td>
          <td><strong>${p.name}</strong>${p.isBestSeller ? ' <span style="font-size:10px;background:var(--admin-accent-gold);color:#000;padding:2px 6px;border-radius:4px;font-weight:700;">Best Seller</span>' : ''}</td>
          <td style="text-transform: capitalize;">${p.category}</td>
          <td>₹${p.price}</td>
          <td><i class="ri-star-fill" style="color:var(--admin-accent-gold);"></i> ${p.rating} (${p.reviewsCount})</td>
          <td>
            <div class="action-buttons">
              <button class="btn-icon btn-edit" title="Edit details" onclick="openEditProductModal(${p.id})">
                <i class="ri-pencil-line"></i>
              </button>
              <button class="btn-icon btn-delete" title="Delete listing" onclick="deleteProductListing(${p.id})">
                <i class="ri-delete-bin-line"></i>
              </button>
            </div>
          </td>
        </tr>
      `).join('');
    } catch (e) {
      console.error('Error fetching products:', e);
    }
  },

  async fetchOrders() {
    try {
      const res = await fetch('/api/admin/orders');
      if (!res.ok) throw new Error();
      this.orders = await res.json();

      const container = document.getElementById('orders-table-body');
      if (this.orders.length === 0) {
        container.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--admin-text-muted);">No orders placed yet.</td></tr>`;
        return;
      }

      container.innerHTML = this.orders.map(o => {
        const badgeClass = `badge-${o.status.toLowerCase()}`;
        return `
          <tr>
            <td><strong>#${o.id}</strong></td>
            <td><strong>${o.customerName}</strong></td>
            <td>${o.customerEmail}</td>
            <td>
              <ul class="order-items-list">
                ${o.items.map(i => `<li>${i.name} <strong>(x${i.quantity})</strong></li>`).join('')}
              </ul>
            </td>
            <td><strong>₹${o.total}</strong></td>
            <td><span class="badge ${badgeClass}">${o.status}</span></td>
            <td>${new Date(o.orderedAt).toLocaleString()}</td>
            <td>
              <select class="admin-form-select" style="padding:6px;font-size:12px;width:120px;" onchange="updateOrderStatus(${o.id}, this.value)">
                <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
                <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
              </select>
            </td>
          </tr>
        `;
      }).join('');
    } catch (e) {
      console.error('Error fetching orders:', e);
    }
  },

  async fetchDoctorBookings() {
    try {
      const res = await fetch('/api/admin/bookings');
      if (!res.ok) throw new Error();
      this.bookings = await res.json();

      const container = document.getElementById('bookings-table-body');
      if (this.bookings.length === 0) {
        container.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--admin-text-muted);">No doctor appointments scheduled.</td></tr>`;
        return;
      }

      container.innerHTML = this.bookings.map(b => `
        <tr>
          <td>${b.id}</td>
          <td><strong>${b.patientName}</strong></td>
          <td>${b.patientEmail}</td>
          <td>${b.doctorName}</td>
          <td>${b.date}</td>
          <td><span style="color:var(--admin-accent-gold);font-weight:700;">${b.timeSlot}</span></td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${b.symptom}">${b.symptom}</td>
          <td>${new Date(b.bookedAt).toLocaleDateString()}</td>
          <td>
            <button class="btn-icon btn-delete" title="Cancel Appointment" onclick="cancelDoctorBooking(${b.id})">
              <i class="ri-close-circle-line"></i>
            </button>
          </td>
        </tr>
      `).join('');
    } catch (e) {
      console.error('Error fetching bookings:', e);
    }
  },

  async fetchTherapistBookings() {
    try {
      const res = await fetch('/api/admin/therapist-bookings');
      if (!res.ok) throw new Error();
      this.therapistBookings = await res.json();

      const container = document.getElementById('therapist-bookings-table-body');
      if (this.therapistBookings.length === 0) {
        container.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--admin-text-muted);">No therapist appointments scheduled.</td></tr>`;
        return;
      }

      container.innerHTML = this.therapistBookings.map(b => `
        <tr>
          <td>${b.id}</td>
          <td><strong>${b.patientName}</strong></td>
          <td>${b.patientEmail}</td>
          <td>${b.therapistName}</td>
          <td><span style="background:rgba(207,168,92,0.1);color:var(--admin-accent-gold);padding:3px 8px;border-radius:4px;font-size:12px;font-weight:700;">${b.therapyType}</span></td>
          <td>${b.date}</td>
          <td><span style="color:var(--admin-accent-gold);font-weight:700;">${b.timeSlot}</span></td>
          <td>${new Date(b.bookedAt).toLocaleDateString()}</td>
          <td>
            <button class="btn-icon btn-delete" title="Cancel Therapy Session" onclick="cancelTherapistBooking(${b.id})">
              <i class="ri-close-circle-line"></i>
            </button>
          </td>
        </tr>
      `).join('');
    } catch (e) {
      console.error('Error fetching therapist bookings:', e);
    }
  }
};

// === INTERACTIVE FUNCTIONS BOUND TO WINDOW CONTEXT ===

window.switchTab = (tabName) => {
  AdminApp.switchTab(tabName);
};

window.openAddProductModal = () => {
  document.getElementById('product-modal-title').textContent = 'Add New Product';
  document.getElementById('product-form-id').value = '';
  document.getElementById('product-form').reset();
  document.getElementById('product-modal-backdrop').classList.add('active');
};

window.closeProductModal = () => {
  document.getElementById('product-modal-backdrop').classList.remove('active');
};

window.openEditProductModal = (id) => {
  const p = AdminApp.products.find(prod => prod.id === id);
  if (!p) return;

  document.getElementById('product-modal-title').textContent = 'Edit Product Details';
  document.getElementById('product-form-id').value = p.id;
  document.getElementById('product-name').value = p.name;
  document.getElementById('product-category').value = p.category;
  document.getElementById('product-price').value = p.price;
  document.getElementById('product-image').value = p.image;
  document.getElementById('product-short-desc').value = p.shortDescription || '';
  document.getElementById('product-long-desc').value = p.longDescription || '';
  document.getElementById('product-bestseller').checked = !!p.isBestSeller;
  document.getElementById('product-benefits').value = (p.benefits || []).join('\n');
  document.getElementById('product-usage').value = p.usageDirections || '';
  document.getElementById('product-ingredients').value = (p.ingredients || []).join(', ');

  document.getElementById('product-modal-backdrop').classList.add('active');
};

window.handleProductFormSubmit = async (event) => {
  event.preventDefault();

  const id = document.getElementById('product-form-id').value;
  const name = document.getElementById('product-name').value;
  const category = document.getElementById('product-category').value;
  const price = document.getElementById('product-price').value;
  const image = document.getElementById('product-image').value;
  const shortDescription = document.getElementById('product-short-desc').value;
  const longDescription = document.getElementById('product-long-desc').value;
  const isBestSeller = document.getElementById('product-bestseller').checked;
  const benefits = document.getElementById('product-benefits').value.split('\n').filter(b => b.trim() !== '');
  const usageDirections = document.getElementById('product-usage').value;
  const ingredients = document.getElementById('product-ingredients').value.split(',').map(i => i.trim()).filter(i => i !== '');

  const productData = {
    name, category, price, image, shortDescription, longDescription, isBestSeller, benefits, usageDirections, ingredients
  };

  const url = id ? `/api/admin/products/${id}` : '/api/admin/products';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });

    if (!res.ok) throw new Error('Failed to save product');

    alert(id ? 'Product details updated successfully!' : 'New product listing created!');
    closeProductModal();
    AdminApp.fetchProducts();
  } catch (e) {
    console.error(e);
    alert('Error saving product data. Please check parameters.');
  }
};

window.deleteProductListing = async (id) => {
  if (!confirm('Are you sure you want to permanently delete this product listing from the database?')) return;

  try {
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
    alert('Product listing removed successfully.');
    AdminApp.fetchProducts();
  } catch (e) {
    console.error(e);
    alert('Error removing product.');
  }
};

window.updateOrderStatus = async (id, newStatus) => {
  try {
    const res = await fetch(`/api/admin/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (!res.ok) throw new Error();
    AdminApp.fetchOrders();
  } catch (e) {
    console.error(e);
    alert('Error updating order shipment status.');
  }
};

window.cancelDoctorBooking = async (id) => {
  if (!confirm('Are you sure you want to cancel and remove this patient appointment?')) return;

  try {
    const res = await fetch(`/api/admin/bookings/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
    alert('Appointment cancelled.');
    AdminApp.fetchDoctorBookings();
  } catch (e) {
    console.error(e);
    alert('Error cancelling appointment.');
  }
};

window.cancelTherapistBooking = async (id) => {
  if (!confirm('Are you sure you want to cancel and remove this therapist session scheduling?')) return;

  try {
    const res = await fetch(`/api/admin/therapist-bookings/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
    alert('Therapy session booking cancelled.');
    AdminApp.fetchTherapistBookings();
  } catch (e) {
    console.error(e);
    alert('Error cancelling session.');
  }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  AdminApp.init();
});
