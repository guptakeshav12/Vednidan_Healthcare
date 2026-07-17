// Admin Panel Dashboard Engine

// Auto-detect backend URL: use /api if served from Express (port 5000), else full URL
const ADMIN_API = (function() {
  const BACKEND_PORT = 5000;
  const p = window.location.port;
  if (p == BACKEND_PORT || window.location.protocol === 'https:') return '/api';
  return `http://localhost:${BACKEND_PORT}/api`;
})();

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
      case 'analytics':
        titleEl.textContent = 'Analytics Report';
        descEl.textContent = 'Monitor monthly revenues and identify best-selling Ayurvedic remedies.';
        break;
      case 'users':
        titleEl.textContent = 'Customer Directory';
        descEl.textContent = 'Browse registered website customers and inspect their individual purchase history.';
        break;
      case 'doctors':
        titleEl.textContent = 'Doctors Catalog Manager';
        descEl.textContent = 'Add, edit, or remove consulting Ayurvedic doctor profiles.';
        actionEl.innerHTML = `
          <button class="btn-admin-primary" onclick="openAddDoctorModal()">
            <i class="ri-add-line"></i> Add New Doctor
          </button>
        `;
        break;
      case 'therapists':
        titleEl.textContent = 'Therapists Catalog Manager';
        descEl.textContent = 'Add, edit, or remove certified Ayurvedic therapist profiles.';
        actionEl.innerHTML = `
          <button class="btn-admin-primary" onclick="openAddTherapistModal()">
            <i class="ri-add-line"></i> Add New Therapist
          </button>
        `;
        break;
    }
  },

  loadActiveTab() {
    // Read hash if available, else load dashboard
    const hash = window.location.hash.replace('#', '');
    if (['dashboard', 'products', 'orders', 'bookings', 'therapist-bookings', 'analytics', 'users', 'doctors', 'therapists'].includes(hash)) {
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
      case 'analytics':
        await this.fetchAnalytics();
        break;
      case 'users':
        await this.fetchUsers();
        break;
      case 'doctors':
        await this.fetchDoctors();
        break;
      case 'therapists':
        await this.fetchTherapists();
        break;
    }
  },

  // === API CALLS ===

  async fetchStats() {
    try {
      const res = await fetch(ADMIN_API + '/admin/stats');
      if (!res.ok) throw new Error();
      const stats = await res.json();
      
      document.getElementById('stat-revenue').textContent = `â‚¹${stats.revenue.toLocaleString()}`;
      document.getElementById('stat-orders').textContent = stats.ordersCount;
      document.getElementById('stat-bookings').textContent = stats.bookingsCount;
      document.getElementById('stat-therapist-bookings').textContent = stats.therapistBookingsCount;
    } catch (e) {
      console.error('Error fetching statistics:', e);
    }
  },

  async fetchDashboardRecentData() {
    try {
      const res = await fetch(ADMIN_API + '/admin/orders');
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
          <td>â‚¹${o.total}</td>
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
      const res = await fetch(ADMIN_API + '/products?limit=100');
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
          <td>â‚¹${p.price}</td>
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
      const res = await fetch(ADMIN_API + '/admin/orders');
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
            <td><strong>â‚¹${o.total}</strong></td>
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
      const res = await fetch(ADMIN_API + '/admin/bookings');
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
      const res = await fetch(ADMIN_API + '/admin/therapist-bookings');
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
  },

  async fetchAnalytics() {
    try {
      const res = await fetch(ADMIN_API + '/admin/analytics');
      if (!res.ok) throw new Error();
      const analytics = await res.json();

      const revContainer = document.getElementById('analytics-revenue-table-body');
      if (analytics.revenueByMonth.length === 0) {
        revContainer.innerHTML = `<tr><td colspan="2" style="text-align:center;color:var(--admin-text-muted);">No revenue data compiled yet.</td></tr>`;
      } else {
        revContainer.innerHTML = analytics.revenueByMonth.map(r => `
          <tr>
            <td><strong>${r.month}</strong></td>
            <td style="color:var(--admin-success); font-weight:800;">â‚¹${r.revenue.toLocaleString()}</td>
          </tr>
        `).join('');
      }

      const bestContainer = document.getElementById('analytics-bestsellers-table-body');
      if (analytics.bestSellers.length === 0) {
        bestContainer.innerHTML = `<tr><td colspan="2" style="text-align:center;color:var(--admin-text-muted);">No product sales data.</td></tr>`;
      } else {
        bestContainer.innerHTML = analytics.bestSellers.map(s => `
          <tr>
            <td><strong>${s.name}</strong></td>
            <td><span style="background:rgba(207,168,92,0.1); color:var(--admin-accent-gold); padding:4px 10px; border-radius:6px; font-weight:800;">${s.unitsSold} units</span></td>
          </tr>
        `).join('');
      }

    } catch (e) {
      console.error('Error loading analytics:', e);
    }
  },

  async fetchUsers() {
    try {
      const res = await fetch(ADMIN_API + '/admin/users');
      if (!res.ok) throw new Error();
      const usersList = await res.json();

      const container = document.getElementById('users-table-body');
      if (usersList.length === 0) {
        container.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--admin-text-muted);">No registered customers found.</td></tr>`;
        return;
      }

      container.innerHTML = usersList.map(u => `
        <tr>
          <td>#${u.id}</td>
          <td><strong>${u.name}</strong></td>
          <td>${u.email}</td>
          <td>${new Date(u.registeredAt).toLocaleDateString()}</td>
          <td><span style="font-weight:700;">${u.ordersCount} orders</span></td>
          <td style="color:var(--admin-success); font-weight:800;">â‚¹${u.totalSpend.toLocaleString()}</td>
          <td>
            <button class="btn-admin-secondary" style="padding:6px 12px; font-size:12px;" onclick="showUserHistory('${u.email}')">
              <i class="ri-history-line"></i> View History
            </button>
          </td>
        </tr>
      `).join('');
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  },

  async fetchDoctors() {
    try {
      const res = await fetch(ADMIN_API + '/admin/doctors');
      if (!res.ok) throw new Error();
      const docs = await res.json();

      const container = document.getElementById('doctors-table-body');
      if (docs.length === 0) {
        container.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--admin-text-muted);">No doctors in catalog.</td></tr>`;
        return;
      }

      container.innerHTML = docs.map(d => `
        <tr>
          <td>#${d.id}</td>
          <td><strong>${d.name}</strong></td>
          <td>${d.specialty}</td>
          <td><i class="ri-star-fill" style="color:var(--admin-accent-gold);"></i> ${d.rating}</td>
          <td>${d.experience}</td>
          <td>
            <div class="action-buttons">
              <button class="btn-icon btn-edit" title="Edit Doctor" onclick="openEditDoctorModal(${d.id}, '${d.name}', '${d.specialty}', ${d.rating}, '${d.experience}')">
                <i class="ri-pencil-line"></i>
              </button>
              <button class="btn-icon btn-delete" title="Delete Doctor" onclick="deleteDoctorCatalog(${d.id})">
                <i class="ri-delete-bin-line"></i>
              </button>
            </div>
          </td>
        </tr>
      `).join('');
    } catch (e) {
      console.error(e);
    }
  },

  async fetchTherapists() {
    try {
      const res = await fetch(ADMIN_API + '/admin/therapists');
      if (!res.ok) throw new Error();
      const ths = await res.json();

      const container = document.getElementById('therapists-table-body');
      if (ths.length === 0) {
        container.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--admin-text-muted);">No therapists in catalog.</td></tr>`;
        return;
      }

      container.innerHTML = ths.map(t => `
        <tr>
          <td>#${t.id}</td>
          <td><strong>${t.name}</strong></td>
          <td>${t.specialty}</td>
          <td><i class="ri-star-fill" style="color:var(--admin-accent-gold);"></i> ${t.rating}</td>
          <td>${t.experience}</td>
          <td>${(t.therapies || []).map(th => `<span style="background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:4px; font-size:11px; margin-right:4px;">${th}</span>`).join('')}</td>
          <td>
            <div class="action-buttons">
              <button class="btn-icon btn-edit" title="Edit Therapist" onclick="openEditTherapistModal(${t.id}, '${t.name}', '${t.specialty}', ${t.rating}, '${t.experience}', '${(t.therapies || []).join(', ')}')">
                <i class="ri-pencil-line"></i>
              </button>
              <button class="btn-icon btn-delete" title="Delete Therapist" onclick="deleteTherapistCatalog(${t.id})">
                <i class="ri-delete-bin-line"></i>
              </button>
            </div>
          </td>
        </tr>
      `).join('');
    } catch (e) {
      console.error(e);
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
    const res = await fetch(`${ADMIN_API}/admin/products/${id}`, { method: 'DELETE' });
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
    const res = await fetch(`${ADMIN_API}/admin/orders/${id}/status`, {
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
    const res = await fetch(`${ADMIN_API}/admin/bookings/${id}`, { method: 'DELETE' });
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
    const res = await fetch(`${ADMIN_API}/admin/therapist-bookings/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
    alert('Therapy session booking cancelled.');
    AdminApp.fetchTherapistBookings();
  } catch (e) {
    console.error(e);
    alert('Error cancelling session.');
  }
};

// === DOCTOR CRUD WINDOW WRAPPERS ===

window.openAddDoctorModal = () => {
  document.getElementById('doctor-modal-title').textContent = 'Add New Doctor';
  document.getElementById('doctor-id').disabled = false;
  document.getElementById('doctor-form').reset();
  document.getElementById('doctor-modal-backdrop').classList.add('active');
};

window.closeDoctorModal = () => {
  document.getElementById('doctor-modal-backdrop').classList.remove('active');
};

window.openEditDoctorModal = (id, name, specialty, rating, experience) => {
  document.getElementById('doctor-modal-title').textContent = 'Edit Doctor Details';
  const idField = document.getElementById('doctor-id');
  idField.value = id;
  idField.disabled = true; // Cannot edit primary key ID

  document.getElementById('doctor-name-input').value = name;
  document.getElementById('doctor-specialty').value = specialty;
  document.getElementById('doctor-rating').value = rating;
  document.getElementById('doctor-experience').value = experience;

  document.getElementById('doctor-modal-backdrop').classList.add('active');
};

window.handleDoctorFormSubmit = async (e) => {
  e.preventDefault();
  const id = parseInt(document.getElementById('doctor-id').value);
  const name = document.getElementById('doctor-name-input').value;
  const specialty = document.getElementById('doctor-specialty').value;
  const rating = parseFloat(document.getElementById('doctor-rating').value) || 4.5;
  const experience = document.getElementById('doctor-experience').value;

  const docData = { id, name, specialty, rating, experience };
  const isEdit = document.getElementById('doctor-id').disabled;

  const url = isEdit ? `/api/admin/doctors/${id}` : `/api/admin/doctors`;
  const method = isEdit ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(docData)
    });
    if (!res.ok) throw new Error();
    alert(isEdit ? 'Doctor details updated successfully!' : 'New doctor added to directories!');
    closeDoctorModal();
    AdminApp.fetchDoctors();
  } catch (err) {
    console.error(err);
    alert('Error saving doctor data.');
  }
};

window.deleteDoctorCatalog = async (id) => {
  if (!confirm('Are you sure you want to permanently delete this doctor profile?')) return;
  try {
    const res = await fetch(`${ADMIN_API}/admin/doctors/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
    alert('Doctor profile removed successfully.');
    AdminApp.fetchDoctors();
  } catch (err) {
    console.error(err);
    alert('Error removing doctor profile.');
  }
};

// === THERAPIST CRUD WINDOW WRAPPERS ===

window.openAddTherapistModal = () => {
  document.getElementById('therapist-modal-title').textContent = 'Add New Therapist';
  document.getElementById('therapist-id').disabled = false;
  document.getElementById('therapist-form').reset();
  document.getElementById('therapist-modal-backdrop').classList.add('active');
};

window.closeTherapistModal = () => {
  document.getElementById('therapist-modal-backdrop').classList.remove('active');
};

window.openEditTherapistModal = (id, name, specialty, rating, experience, therapiesStr) => {
  document.getElementById('therapist-modal-title').textContent = 'Edit Therapist Details';
  const idField = document.getElementById('therapist-id');
  idField.value = id;
  idField.disabled = true;

  document.getElementById('therapist-name-input').value = name;
  document.getElementById('therapist-specialty').value = specialty;
  document.getElementById('therapist-rating').value = rating;
  document.getElementById('therapist-experience').value = experience;
  document.getElementById('therapist-therapies').value = therapiesStr;

  document.getElementById('therapist-modal-backdrop').classList.add('active');
};

window.handleTherapistFormSubmit = async (e) => {
  e.preventDefault();
  const id = parseInt(document.getElementById('therapist-id').value);
  const name = document.getElementById('therapist-name-input').value;
  const specialty = document.getElementById('therapist-specialty').value;
  const rating = parseFloat(document.getElementById('therapist-rating').value) || 4.5;
  const experience = document.getElementById('therapist-experience').value;
  const therapies = document.getElementById('therapist-therapies').value.split(',').map(t => t.trim()).filter(t => t !== '');

  const thData = { id, name, specialty, rating, experience, therapies };
  const isEdit = document.getElementById('therapist-id').disabled;

  const url = isEdit ? `/api/admin/therapists/${id}` : `/api/admin/therapists`;
  const method = isEdit ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(thData)
    });
    if (!res.ok) throw new Error();
    alert(isEdit ? 'Therapist details updated successfully!' : 'New therapist added to directories!');
    closeTherapistModal();
    AdminApp.fetchTherapists();
  } catch (err) {
    console.error(err);
    alert('Error saving therapist data.');
  }
};

window.deleteTherapistCatalog = async (id) => {
  if (!confirm('Are you sure you want to permanently delete this therapist profile?')) return;
  try {
    const res = await fetch(`${ADMIN_API}/admin/therapists/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
    alert('Therapist profile removed successfully.');
    AdminApp.fetchTherapists();
  } catch (err) {
    console.error(err);
    alert('Error removing therapist profile.');
  }
};

// === CUSTOMER HISTORY WINDOW WRAPPERS ===

window.showUserHistory = async (email) => {
  const container = document.getElementById('user-orders-modal-content');
  if (!container) return;

  container.innerHTML = `<div style="text-align:center; padding:20px;"><i class="ri-loader-4-line ri-spin" style="font-size:24px;"></i> Loading histories...</div>`;
  document.getElementById('user-orders-modal-backdrop').classList.add('active');

  try {
    const res = await fetch(ADMIN_API + '/admin/orders');
    if (!res.ok) throw new Error();
    const orders = await res.json();

    const userOrders = orders.filter(o => (o.customerEmail || '').toLowerCase() === email.toLowerCase());

    if (userOrders.length === 0) {
      container.innerHTML = `<p style="text-align:center; padding:20px; color:var(--admin-text-muted);">This customer has not placed any orders yet.</p>`;
      return;
    }

    container.innerHTML = userOrders.map(o => `
      <div style="border: 1px solid var(--admin-border); border-radius: 8px; padding: 16px; margin-bottom: 12px; background: rgba(255,255,255,0.01);">
        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
          <span>Order <strong>#${o.id}</strong></span>
          <span class="badge badge-${o.status.toLowerCase()}">${o.status}</span>
        </div>
        <p style="font-size:12px; color:var(--admin-text-muted); margin-bottom:10px;">Date: ${new Date(o.orderedAt).toLocaleString()}</p>
        <ul class="order-items-list" style="padding-left:0; margin-bottom:10px;">
          ${o.items.map(i => `<li>${i.name} <strong>(x${i.quantity})</strong></li>`).join('')}
        </ul>
        <div style="display:flex; justify-content:space-between; font-weight:800; font-size:14px; border-top:1px dashed rgba(255,255,255,0.05); padding-top:10px;">
          <span>Grand Total:</span>
          <span style="color:var(--admin-accent-gold);">â‚¹${o.total}</span>
        </div>
      </div>
    `).join('');

  } catch (err) {
    console.error(err);
    container.innerHTML = `<p style="color:var(--admin-danger); text-align:center; padding:20px;">Failed to load order history.</p>`;
  }
};

window.closeUserOrdersModal = () => {
  document.getElementById('user-orders-modal-backdrop').classList.remove('active');
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  AdminApp.init();
});

