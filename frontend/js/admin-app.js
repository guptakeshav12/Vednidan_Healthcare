// Admin Panel Dashboard Engine

// === CATALOG CONTROLS: LEFT-TO-RIGHT SCROLLING, FILTERING & DETAIL VIEW ===

window.scrollAdminTable = (wrapperId, delta) => {
  const el = document.getElementById(wrapperId);
  if (el) {
    el.scrollBy({ left: delta, behavior: 'smooth' });
  }
};

window.filterCatalogTable = (tbodyId, query) => {
  const q = (query || '').toLowerCase().trim();
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  const rows = tbody.getElementsByTagName('tr');
  for (let i = 0; i < rows.length; i++) {
    const text = rows[i].innerText.toLowerCase();
    if (!q || text.includes(q)) {
      rows[i].style.display = '';
    } else {
      rows[i].style.display = 'none';
    }
  }
};

window.viewCatalogItemDetails = (type, id) => {
  const modal = document.getElementById('admin-detail-view-backdrop');
  const title = document.getElementById('admin-detail-view-title');
  const container = document.getElementById('admin-detail-view-content');
  if (!modal || !container) return;

  let item = null;
  let html = '';

  if (type === 'product') {
    item = (AdminApp.products || []).find(p => p.id === id);
    if (!item) return;
    title.innerHTML = `<i class="ri-bubble-chart-line"></i> Product Details: ${item.name}`;
    html = `
      <div style="display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap;margin-bottom:16px;">
        <img src="${item.image}" alt="${item.name}" style="width:120px;height:120px;object-fit:cover;border-radius:10px;border:2px solid var(--admin-accent-gold);" onerror="this.src='assets/doctor_avatar.png'">
        <div style="flex:1;min-width:240px;">
          <h4 style="margin:0 0 6px;color:var(--admin-text-main);font-size:18px;">${item.name}</h4>
          <span style="background:rgba(207,168,92,0.15);color:var(--admin-accent-gold);padding:3px 10px;border-radius:6px;font-size:12px;font-weight:700;text-transform:capitalize;">${item.category}</span>
          <p style="margin:8px 0 0;color:var(--admin-text-muted);font-size:13px;">${item.shortDescription || 'No short summary provided.'}</p>
        </div>
      </div>
      <div class="detail-item-grid">
        <div class="detail-item-card"><span class="detail-label">Product ID</span><div class="detail-value">#${item.id}</div></div>
        <div class="detail-item-card"><span class="detail-label">Retail Price</span><div class="detail-value" style="color:var(--admin-success);font-size:18px;">₹${item.price}</div></div>
        <div class="detail-item-card"><span class="detail-label">Customer Rating</span><div class="detail-value"><i class="ri-star-fill" style="color:var(--admin-accent-gold);"></i> ${item.rating} (${item.reviewsCount || 0} reviews)</div></div>
        <div class="detail-item-card"><span class="detail-label">Best Seller Badge</span><div class="detail-value">${item.isBestSeller ? 'Yes ★' : 'Standard'}</div></div>
        <div class="detail-item-card" style="grid-column: 1/-1;"><span class="detail-label">Active Key Ingredients</span><div class="detail-value">${(item.ingredients || []).join(', ') || 'Classical botanical herbs'}</div></div>
        <div class="detail-item-card" style="grid-column: 1/-1;"><span class="detail-label">Usage Directions</span><div class="detail-value">${item.usageDirections || 'Take twice daily after meals.'}</div></div>
        <div class="detail-item-card" style="grid-column: 1/-1;"><span class="detail-label">Key Health Benefits</span><div class="detail-value">${(item.benefits || []).map(b => `• ${b}`).join('<br>') || 'Holistic wellness formulation'}</div></div>
        <div class="detail-item-card" style="grid-column: 1/-1;"><span class="detail-label">Complete Long Description</span><div class="detail-value" style="font-weight:400;font-size:13px;line-height:1.5;">${item.longDescription || '—'}</div></div>
      </div>
    `;
  } else if (type === 'doctor') {
    item = (AdminApp.doctors || []).find(d => d.id === id);
    if (!item) return;
    title.innerHTML = `<i class="ri-nurse-line"></i> Doctor Profile: ${item.name}`;
    html = `
      <div style="display:flex;gap:18px;align-items:center;margin-bottom:16px;">
        <img src="${item.avatar || 'assets/doctor_avatar.png'}" alt="${item.name}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid #22c55e;">
        <div>
          <h4 style="margin:0 0 4px;font-size:18px;color:var(--admin-text-main);">${item.name}</h4>
          <span style="color:#22c55e;font-size:13px;font-weight:700;">${item.qualification || 'BAMS, MD'}</span>
          <div style="font-size:12px;color:var(--admin-text-muted);margin-top:2px;">Specialty: ${item.specialty}</div>
        </div>
      </div>
      <div class="detail-item-grid">
        <div class="detail-item-card"><span class="detail-label">Doctor ID (Login)</span><div class="detail-value">#${item.id}</div></div>
        <div class="detail-item-card"><span class="detail-label">Official Email</span><div class="detail-value">${item.email || 'doctor'+item.id+'@vednidan.com'}</div></div>
        <div class="detail-item-card"><span class="detail-label">Phone Contact</span><div class="detail-value">${item.phone || '+91 9876543210'}</div></div>
        <div class="detail-item-card"><span class="detail-label">Experience</span><div class="detail-value">${item.experience || '10 years'}</div></div>
        <div class="detail-item-card"><span class="detail-label">Rating</span><div class="detail-value"><i class="ri-star-fill" style="color:var(--admin-accent-gold);"></i> ${item.rating || 4.8} / 5.0</div></div>
        <div class="detail-item-card"><span class="detail-label">Consultation Fee</span><div class="detail-value" style="color:var(--admin-success);">₹499 (Online Video Call)</div></div>
        <div class="detail-item-card" style="grid-column: 1/-1;"><span class="detail-label">Specialist Focus</span><div class="detail-value">${item.specialty} — Ayurvedic pulse diagnosis, systemic balance, herbal therapy prescriptions.</div></div>
      </div>
    `;
  } else if (type === 'therapist') {
    item = (AdminApp.therapists || []).find(t => t.id === id);
    if (!item) return;
    title.innerHTML = `<i class="ri-user-star-line"></i> Therapist Profile: ${item.name}`;
    const thList = Array.isArray(item.therapies) ? item.therapies : (item.therapies ? item.therapies.split(',') : []);
    html = `
      <div style="display:flex;gap:18px;align-items:center;margin-bottom:16px;">
        <img src="${item.avatar || 'assets/doctor_avatar.png'}" alt="${item.name}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid #a855f7;">
        <div>
          <h4 style="margin:0 0 4px;font-size:18px;color:var(--admin-text-main);">${item.name}</h4>
          <span style="color:#a855f7;font-size:13px;font-weight:700;">${item.qualification || 'Certified Panchakarma Vaidya'}</span>
          <div style="font-size:12px;color:var(--admin-text-muted);margin-top:2px;">Specialty: ${item.specialty}</div>
        </div>
      </div>
      <div class="detail-item-grid">
        <div class="detail-item-card"><span class="detail-label">Therapist ID (Login)</span><div class="detail-value">#${item.id}</div></div>
        <div class="detail-item-card"><span class="detail-label">Official Email</span><div class="detail-value">${item.email || 'therapist'+item.id+'@vednidan.com'}</div></div>
        <div class="detail-item-card"><span class="detail-label">Phone Contact</span><div class="detail-value">${item.phone || '+91 9876543212'}</div></div>
        <div class="detail-item-card"><span class="detail-label">Clinical Experience</span><div class="detail-value">${item.experience || '12 years'}</div></div>
        <div class="detail-item-card"><span class="detail-label">Patient Rating</span><div class="detail-value"><i class="ri-star-fill" style="color:var(--admin-accent-gold);"></i> ${item.rating || 4.9} / 5.0</div></div>
        <div class="detail-item-card"><span class="detail-label">Standard Session Fee</span><div class="detail-value" style="color:#0d9488;font-size:18px;font-weight:700;">₹799 (Home / Clinic Visit)</div></div>
        <div class="detail-item-card" style="grid-column: 1/-1;"><span class="detail-label">Therapies Offered</span><div class="detail-value">${thList.map(t => `<span style="display:inline-block;background:rgba(168,85,247,0.15);color:#c084fc;padding:3px 10px;border-radius:20px;font-size:12px;margin:2px 4px 2px 0;">${t.trim()}</span>`).join('')}</div></div>
      </div>
    `;
  } else if (type === 'partner') {
    item = (AdminApp.partnerAccounts || []).find(p => p.id === id);
    if (!item) return;
    title.innerHTML = `<i class="ri-shield-user-line"></i> Partner Account: ${item.name} (${item.role})`;
    html = `
      <div class="detail-item-grid">
        <div class="detail-item-card"><span class="detail-label">Partner Workspace ID</span><div class="detail-value">#${item.id}</div></div>
        <div class="detail-item-card"><span class="detail-label">Partner Name</span><div class="detail-value">${item.name}</div></div>
        <div class="detail-item-card"><span class="detail-label">Login Role</span><div class="detail-value" style="text-transform:capitalize;color:var(--admin-accent-gold);">${item.role}</div></div>
        <div class="detail-item-card"><span class="detail-label">Login Identifier / Email</span><div class="detail-value">${item.email}</div></div>
        <div class="detail-item-card"><span class="detail-label">Contact Phone</span><div class="detail-value">${item.phone || '—'}</div></div>
        <div class="detail-item-card"><span class="detail-label">Qualification</span><div class="detail-value">${item.qualification || '—'}</div></div>
        <div class="detail-item-card"><span class="detail-label">Specialty Field</span><div class="detail-value">${item.specialty || '—'}</div></div>
        <div class="detail-item-card"><span class="detail-label">Experience</span><div class="detail-value">${item.experience || '—'}</div></div>
        <div class="detail-item-card"><span class="detail-label">Rating</span><div class="detail-value"><i class="ri-star-fill" style="color:var(--admin-accent-gold);"></i> ${item.rating || 4.8}</div></div>
        <div class="detail-item-card"><span class="detail-label">Account Status</span><div class="detail-value" style="color:var(--admin-success);">Active</div></div>
      </div>
    `;
  }

  container.innerHTML = html;
  modal.classList.add('active');
};

window.closeAdminDetailView = () => {
  const modal = document.getElementById('admin-detail-view-backdrop');
  if (modal) modal.classList.remove('active');
};

// Also bind delete shortcuts to prevent undefined errors
window.deleteDoctor = (id) => window.deleteDoctorCatalog(id);
window.deleteTherapist = (id) => window.deleteTherapistCatalog(id);
window.deleteProduct = (id) => window.deleteProductListing(id);

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
      case 'partner-accounts':
        titleEl.textContent = 'Partner Workspace Accounts';
        descEl.textContent = 'Review login credentials, phone, specialties, rating, and manage partner logins.';
        break;
      case 'ai-consultations':
        titleEl.textContent = 'AI Doctor Consultation Logs';
        descEl.textContent = 'Review all AI Doctor consultations — patient details, dosha analysis, and prescribed Ayurvedic treatments.';
        break;
      case 'settings':
        titleEl.textContent = 'System Settings & Credentials';
        descEl.textContent = 'View default login credentials, system status, and VedNidan Healthcare platform configuration.';
        break;
    }
  },

  loadActiveTab() {
    // Read hash if available, else load dashboard
    const hash = window.location.hash.replace('#', '');
    if (['dashboard', 'products', 'orders', 'bookings', 'therapist-bookings', 'analytics', 'users', 'doctors', 'therapists', 'partner-accounts', 'ai-consultations', 'settings'].includes(hash)) {
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
      case 'partner-accounts':
        await this.fetchPartnerAccounts();
        break;
      case 'ai-consultations':
        await this.fetchConsultationLogs();
        break;
      case 'settings':
        await this.fetchSettings();
        break;
    }
  },

  // === API CALLS ===

  async fetchStats() {
    try {
      const res = await fetch(ADMIN_API + '/admin/stats');
      if (!res.ok) throw new Error();
      const stats = await res.json();
      
      document.getElementById('stat-revenue').textContent = '₹' + (stats.revenue || 0).toLocaleString();
      if (document.getElementById('stat-orders-revenue')) {
        document.getElementById('stat-orders-revenue').textContent = '₹' + (stats.ordersRevenue || 0).toLocaleString();
      }
      if (document.getElementById('stat-doctor-revenue')) {
        document.getElementById('stat-doctor-revenue').textContent = '₹' + (stats.doctorRevenue || 0).toLocaleString();
      }
      if (document.getElementById('stat-therapist-revenue')) {
        document.getElementById('stat-therapist-revenue').textContent = '₹' + (stats.therapistRevenue || 0).toLocaleString();
      }
      document.getElementById('stat-orders').textContent = stats.ordersCount || 0;
      document.getElementById('stat-bookings').textContent = stats.bookingsCount || 0;
      document.getElementById('stat-therapist-bookings').textContent = stats.therapistBookingsCount || 0;
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
          <td>₹${p.price}</td>
          <td><i class="ri-star-fill" style="color:var(--admin-accent-gold);"></i> ${p.rating} (${p.reviewsCount || 0})</td>
          <td>
            <div class="action-buttons" style="display:flex;align-items:center;gap:6px;">
              <button class="btn-catalog-view-detail" title="View Full Details" onclick="viewCatalogItemDetails('product', ${p.id})">
                <i class="ri-eye-line"></i> View
              </button>
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
        container.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--admin-text-muted);">No doctor appointments scheduled.</td></tr>`;
        return;
      }

      container.innerHTML = this.bookings.map(b => {
        // Status badge colour
        const statusColors = {
          'Scheduled': '#3b82f6',
          'In Progress': '#f59e0b',
          'Completed': '#10b981',
          'Cancelled': '#ef4444'
        };
        const statusColor = statusColors[b.status] || '#6b7280';
        const statusBadge = `<span style="background:${statusColor}22;color:${statusColor};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;">${b.status || 'Scheduled'}</span>`;

        // Video Room Link
        let videoCell = '<span style="color:var(--admin-text-muted);font-size:12px;">—</span>';
        if (b.videoRoomId) {
          videoCell = `<a href="https://meet.jit.si/${b.videoRoomId}" target="_blank" style="color:#3b82f6;font-size:11px;text-decoration:none;" title="Join Jitsi Room"><i class="ri-video-chat-line"></i> Join Call</a>`;
        }

        // Prescription pill
        const rxCell = b.prescription
          ? `<span title="${b.prescription}" style="display:block;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--admin-success);font-size:12px;"><i class="ri-file-list-3-line"></i> ${b.prescription}</span>`
          : '<span style="color:var(--admin-text-muted);font-size:12px;">Pending</span>';

        const payBadge = `<span style="background:rgba(22,163,74,0.15);color:#4ade80;border:1px solid rgba(22,163,74,0.3);padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;"><i class="ri-checkbox-circle-fill"></i> ${b.paymentStatus || 'Paid'} (${b.paymentMethod || 'UPI Direct'})</span>`;
        return `
          <tr>
            <td><strong>#${b.id}</strong></td>
            <td><strong>${b.patientName}</strong><br><span style="font-size:11px;color:var(--admin-text-muted);">${b.patientEmail || ''}</span></td>
            <td>${b.doctorName}</td>
            <td>${b.date} &nbsp;<span style="color:var(--admin-accent-gold);font-weight:700;">${b.timeSlot}</span></td>
            <td><strong style="color:var(--admin-success); font-size:14px;">₹${b.amount || 499}</strong></td>
            <td>${payBadge}</td>
            <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${b.symptom}">${b.symptom}</td>
            <td>${statusBadge}</td>
            <td>${rxCell}</td>
            <td>
              <button class="btn-icon btn-delete" title="Cancel Appointment" onclick="cancelDoctorBooking(${b.id})">
                <i class="ri-close-circle-line"></i>
              </button>
            </td>
          </tr>
        `;
      }).join('');
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
        container.innerHTML = `<tr><td colspan="10" style="text-align:center;color:var(--admin-text-muted);">No therapist appointments scheduled.</td></tr>`;
        return;
      }

      container.innerHTML = this.therapistBookings.map(b => {
        // Dispatch status badge
        const dispatchColors = {
          'Pending':     { bg: '#6b728022', txt: '#9ca3af' },
          'En Route':    { bg: '#f59e0b22', txt: '#f59e0b' },
          'Arrived':     { bg: '#3b82f622', txt: '#3b82f6' },
          'In Progress': { bg: '#8b5cf622', txt: '#8b5cf6' },
          'Completed':   { bg: '#10b98122', txt: '#10b981' },
          'Cancelled':   { bg: '#ef444422', txt: '#ef4444' }
        };
        const dc = dispatchColors[b.status] || dispatchColors['Pending'];
        const statusBadge = `<span style="background:${dc.bg};color:${dc.txt};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;">${b.status || 'Pending'}</span>`;

        // OTP — revealed only when session active or completed
        const showOtp = ['Arrived', 'In Progress', 'Completed'].includes(b.status);
        const otpCell = showOtp
          ? `<span style="font-family:monospace;font-size:14px;font-weight:800;color:var(--admin-accent-gold);letter-spacing:3px;">${b.otpCode}</span>`
          : `<span style="color:var(--admin-text-muted);font-size:12px;">Hidden</span>`;

        // Feedback & rating stars
        let feedbackCell = '<span style="color:var(--admin-text-muted);font-size:12px;">—</span>';
        if (b.status === 'Completed') {
          const stars = '★'.repeat(b.rating || 5) + '☆'.repeat(5 - (b.rating || 5));
          feedbackCell = `
            <div style="font-size:12px;">
              <span style="color:var(--admin-accent-gold);">${stars}</span>
              ${b.feedback ? `<br><span title="${b.feedback}" style="color:#e5e7eb;font-size:11px;display:block;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${b.feedback}</span>` : ''}
            </div>
          `;
        }

        return `
          <tr>
            <td><strong>#${b.id}</strong></td>
            <td><strong>${b.patientName}</strong><br><span style="font-size:11px;color:var(--admin-text-muted);">${b.patientEmail || ''}</span></td>
            <td>${b.therapistName}</td>
            <td><span style="background:rgba(207,168,92,0.1);color:var(--admin-accent-gold);padding:3px 8px;border-radius:4px;font-size:12px;font-weight:700;">${b.therapyType}</span></td>
            <td>${b.date} &nbsp;<span style="color:var(--admin-accent-gold);font-weight:700;">${b.timeSlot}</span></td>
            <td style="max-width:140px;font-size:12px;" title="${b.address}">
              <i class="ri-map-pin-line" style="color:var(--admin-accent-gold);"></i>
              <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:inline-block;max-width:110px;vertical-align:middle;">${b.address || 'In-Clinic'}</span>
            </td>
            <td>${statusBadge}</td>
            <td>${otpCell}</td>
            <td>${feedbackCell}</td>
            <td>
              <button class="btn-icon btn-delete" title="Cancel Therapy Session" onclick="cancelTherapistBooking(${b.id})">
                <i class="ri-close-circle-line"></i>
              </button>
            </td>
          </tr>
        `;
      }).join('');
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
        container.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--admin-text-muted);">No doctors in catalog.</td></tr>`;
        return;
      }

      this.doctors = docs;
      container.innerHTML = docs.map(d => `
        <tr>
          <td>#${d.id}</td>
          <td><strong>${d.name}</strong></td>
          <td><span style="font-size:12px; color:#22c55e; font-weight:600;">${d.qualification || 'BAMS'}</span></td>
          <td>${d.specialty}</td>
          <td style="font-size:12px;">${d.email || '—'}</td>
          <td style="font-size:12px;">${d.phone || '—'}</td>
          <td><i class="ri-star-fill" style="color:var(--admin-accent-gold);"></i> ${d.rating}</td>
          <td>${d.experience}</td>
          <td>
            <div class="action-buttons" style="display:flex;align-items:center;gap:6px;">
              <button class="btn-catalog-view-detail" title="View Full Details" onclick="viewCatalogItemDetails('doctor', ${d.id})">
                <i class="ri-eye-line"></i> View
              </button>
              <button class="btn-icon btn-edit" title="Edit Doctor" onclick='openEditDoctorModal(${JSON.stringify(d).replace(/'/g, "&apos;")})'>
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
        container.innerHTML = `<tr><td colspan="10" style="text-align:center;color:var(--admin-text-muted);">No therapists in catalog.</td></tr>`;
        return;
      }

      this.therapists = ths;
      container.innerHTML = ths.map(t => `
        <tr>
          <td>#${t.id}</td>
          <td><strong>${t.name}</strong></td>
          <td><span style="font-size:12px; color:#a855f7; font-weight:600;">${t.qualification || 'Certified Panchakarma Vaidya'}</span></td>
          <td>${t.specialty}</td>
          <td style="font-size:12px;">${t.email || '—'}</td>
          <td style="font-size:12px;">${t.phone || '—'}</td>
          <td><i class="ri-star-fill" style="color:var(--admin-accent-gold);"></i> ${t.rating}</td>
          <td>${t.experience}</td>
          <td>${(t.therapies || []).map(th => `<span style="background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:4px; font-size:11px; margin-right:4px;">${th}</span>`).join('')}</td>
          <td>
            <div class="action-buttons" style="display:flex;align-items:center;gap:6px;">
              <button class="btn-catalog-view-detail" title="View Full Details" onclick="viewCatalogItemDetails('therapist', ${t.id})">
                <i class="ri-eye-line"></i> View
              </button>
              <button class="btn-icon btn-edit" title="Edit Therapist" onclick='openEditTherapistModal(${JSON.stringify(t).replace(/'/g, "&apos;")})'>
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
  },

  async fetchPartnerAccounts() {
    try {
      const res = await fetch(ADMIN_API + '/admin/provider-accounts');
      if (!res.ok) throw new Error();
      const accounts = await res.json();

      const container = document.getElementById('partner-accounts-table-body');
      if (accounts.length === 0) {
        container.innerHTML = `<tr><td colspan="10" style="text-align:center;color:var(--admin-text-muted);">No partner accounts registered.</td></tr>`;
        return;
      }

      this.partnerAccounts = accounts;
      container.innerHTML = accounts.map(a => `
        <tr>
          <td>#${a.id}</td>
          <td><strong>${a.name}</strong></td>
          <td>${a.email}</td>
          <td>${a.phone || '—'}</td>
          <td><span class="badge ${a.role === 'doctor' ? 'badge-pending' : 'badge-shipped'}" style="text-transform: capitalize; font-weight:700;">${a.role}</span></td>
          <td><span style="font-size:12px; color:${a.role === 'doctor' ? '#22c55e' : '#a855f7'}; font-weight:600;">${a.qualification || '—'}</span></td>
          <td>${a.specialty}</td>
          <td>${a.experience}</td>
          <td><i class="ri-star-fill" style="color:var(--admin-accent-gold);"></i> ${a.rating}</td>
          <td>
            <div class="action-buttons" style="display:flex;align-items:center;gap:6px;">
              <button class="btn-catalog-view-detail" title="View Full Details" onclick="viewCatalogItemDetails('partner', ${a.id})">
                <i class="ri-eye-line"></i> View
              </button>
              <button class="btn-admin-secondary" style="padding:4px 8px; font-size:11px; white-space:nowrap; display:flex; align-items:center; gap:4px;" title="Reset Password to default 123456" onclick="resetPartnerPassword(${a.id})">
                <i class="ri-key-line"></i> Reset Password
              </button>
              <button class="btn-icon btn-delete" title="Delete Account" onclick="deletePartnerAccount(${a.id})">
                <i class="ri-delete-bin-line"></i>
              </button>
            </div>
          </td>
        </tr>
      `).join('');
    } catch (e) {
      console.error('Error fetching partner accounts:', e);
    }
  }
};

window.resetPartnerPassword = async (id) => {
  if (!confirm('Are you sure you want to reset this partner account password to default "123456"?')) return;
  try {
    const res = await fetch(`${ADMIN_API}/admin/provider-accounts/${id}/reset-password`, { method: 'PUT' });
    if (!res.ok) throw new Error();
    alert('Password reset successfully to default "123456".');
    AdminApp.fetchPartnerAccounts();
  } catch (err) {
    console.error(err);
    alert('Error resetting password.');
  }
};

window.deletePartnerAccount = async (id) => {
  if (!confirm('Are you sure you want to permanently delete this partner account? This action cannot be undone.')) return;
  try {
    const res = await fetch(`${ADMIN_API}/admin/provider-accounts/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
    alert('Partner account deleted.');
    AdminApp.fetchPartnerAccounts();
  } catch (err) {
    console.error(err);
    alert('Error deleting partner account.');
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
  if (typeof resetProductImageUpload === 'function') resetProductImageUpload('');
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
  document.getElementById('product-image').value = p.image || '';
  document.getElementById('product-short-desc').value = p.shortDescription || '';
  document.getElementById('product-long-desc').value = p.longDescription || '';
  document.getElementById('product-bestseller').checked = !!p.isBestSeller;
  document.getElementById('product-benefits').value = (p.benefits || []).join('\n');
  document.getElementById('product-usage').value = p.usageDirections || '';
  document.getElementById('product-ingredients').value = (p.ingredients || []).join(', ');

  // Show existing product image in the upload widget
  if (typeof resetProductImageUpload === 'function') resetProductImageUpload(p.image || '');

  // Also populate the URL fallback field if it's an external URL
  const urlFb = document.getElementById('product-image-url-fallback');
  if (urlFb) urlFb.value = (p.image || '').startsWith('http') ? (p.image || '') : '';

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
  const idField = document.getElementById('doctor-id');
  idField.disabled = false;
  idField.value = Math.floor(100 + Math.random() * 900); // Friendly auto-ID
  document.getElementById('doctor-form').reset();
  document.getElementById('doctor-id').value = idField.value;
  document.getElementById('doctor-modal-backdrop').classList.add('active');
};

window.closeDoctorModal = () => {
  document.getElementById('doctor-modal-backdrop').classList.remove('active');
};

window.openEditDoctorModal = (d) => {
  document.getElementById('doctor-modal-title').textContent = 'Edit Doctor Details';
  const idField = document.getElementById('doctor-id');
  idField.value = d.id;
  idField.disabled = true; // Cannot edit primary key ID

  document.getElementById('doctor-name-input').value = d.name || '';
  document.getElementById('doctor-qualification-input').value = d.qualification || '';
  document.getElementById('doctor-email-input').value = d.email || '';
  document.getElementById('doctor-phone-input').value = d.phone || '';
  document.getElementById('doctor-password-input').value = ''; // Blank unless changing
  document.getElementById('doctor-specialty').value = d.specialty || '';
  document.getElementById('doctor-rating').value = d.rating || 4.8;
  document.getElementById('doctor-experience').value = d.experience || '';

  document.getElementById('doctor-modal-backdrop').classList.add('active');
};

window.handleDoctorFormSubmit = async (e) => {
  e.preventDefault();
  const id = parseInt(document.getElementById('doctor-id').value);
  const name = document.getElementById('doctor-name-input').value.trim();
  const qualification = document.getElementById('doctor-qualification-input').value.trim();
  const email = document.getElementById('doctor-email-input').value.trim();
  const phone = document.getElementById('doctor-phone-input').value.trim();
  const password = document.getElementById('doctor-password-input').value.trim();
  const specialty = document.getElementById('doctor-specialty').value.trim();
  const rating = parseFloat(document.getElementById('doctor-rating').value) || 4.8;
  const experience = document.getElementById('doctor-experience').value.trim() || '10 years';

  const docData = { id, name, qualification, email, phone, password, specialty, rating, experience };
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
    alert(isEdit ? 'Doctor details updated successfully!' : 'New doctor added to directories and provider accounts!');
    closeDoctorModal();
    AdminApp.fetchDoctors();
    AdminApp.fetchPartnerAccounts();
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
    AdminApp.fetchPartnerAccounts();
  } catch (err) {
    console.error(err);
    alert('Error removing doctor profile.');
  }
};

// === THERAPIST CRUD WINDOW WRAPPERS ===

window.openAddTherapistModal = () => {
  document.getElementById('therapist-modal-title').textContent = 'Add New Therapist';
  const idField = document.getElementById('therapist-id');
  idField.disabled = false;
  idField.value = Math.floor(200 + Math.random() * 800); // Friendly auto-ID
  document.getElementById('therapist-form').reset();
  document.getElementById('therapist-id').value = idField.value;
  document.getElementById('therapist-modal-backdrop').classList.add('active');
};

window.closeTherapistModal = () => {
  document.getElementById('therapist-modal-backdrop').classList.remove('active');
};

window.openEditTherapistModal = (t) => {
  document.getElementById('therapist-modal-title').textContent = 'Edit Therapist Details';
  const idField = document.getElementById('therapist-id');
  idField.value = t.id;
  idField.disabled = true;

  document.getElementById('therapist-name-input').value = t.name || '';
  document.getElementById('therapist-qualification-input').value = t.qualification || '';
  document.getElementById('therapist-email-input').value = t.email || '';
  document.getElementById('therapist-phone-input').value = t.phone || '';
  document.getElementById('therapist-password-input').value = '';
  document.getElementById('therapist-specialty').value = t.specialty || '';
  document.getElementById('therapist-rating').value = t.rating || 4.9;
  document.getElementById('therapist-experience').value = t.experience || '';
  const therapiesArr = Array.isArray(t.therapies) ? t.therapies : (t.therapies ? t.therapies.split(',') : []);
  document.getElementById('therapist-therapies').value = therapiesArr.join(', ');

  document.getElementById('therapist-modal-backdrop').classList.add('active');
};

window.handleTherapistFormSubmit = async (e) => {
  e.preventDefault();
  const id = parseInt(document.getElementById('therapist-id').value);
  const name = document.getElementById('therapist-name-input').value.trim();
  const qualification = document.getElementById('therapist-qualification-input').value.trim();
  const email = document.getElementById('therapist-email-input').value.trim();
  const phone = document.getElementById('therapist-phone-input').value.trim();
  const password = document.getElementById('therapist-password-input').value.trim();
  const specialty = document.getElementById('therapist-specialty').value.trim();
  const rating = parseFloat(document.getElementById('therapist-rating').value) || 4.9;
  const experience = document.getElementById('therapist-experience').value.trim() || '15 years';
  const therapies = document.getElementById('therapist-therapies').value.split(',').map(t => t.trim()).filter(Boolean);

  const thData = { id, name, qualification, email, phone, password, specialty, rating, experience, therapies };
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
    alert(isEdit ? 'Therapist details updated successfully!' : 'New therapist added to directories and provider accounts!');
    closeTherapistModal();
    AdminApp.fetchTherapists();
    AdminApp.fetchPartnerAccounts();
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

// ===== AI CONSULTATION LOGS =====
AdminApp._allConsultations = [];

AdminApp.fetchConsultationLogs = async function() {
  const tbody = document.getElementById('consultations-tbody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;"><i class="ri-loader-4-line ri-spin"></i> Loading...</td></tr>`;
  try {
    const res = await fetch(`${ADMIN_API}/admin/consultation-logs`);
    const logs = await res.json();
    AdminApp._allConsultations = logs;
    AdminApp.renderConsultations(logs);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:#e74c3c;">Failed to load consultation logs.</td></tr>`;
  }
};

AdminApp.renderConsultations = function(logs) {
  const tbody = document.getElementById('consultations-tbody');
  if (!tbody) return;
  if (!logs || logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--admin-text-muted);">No AI consultations recorded yet. Consultations appear here in real-time when patients consult Charaka AI.</td></tr>`;
    return;
  }
  const doshaColors = { vata: '#8b5cf6', pitta: '#f59e0b', kapha: '#10b981' };
  tbody.innerHTML = logs.map((log, i) => {
    const dt = log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN') : 'N/A';
    const medicines = (log.medicines || []).slice(0, 2).join(', ');
    const moreMeds = (log.medicines || []).length > 2 ? ` +${(log.medicines||[]).length - 2} more` : '';
    const doshaColor = doshaColors[log.dominantDosha] || '#6b7280';
    const logId = log.id || ('LOG-'+(i+1));
    return `<tr>
      <td><strong style="color:var(--admin-accent-gold); font-family:monospace;">#${logId}</strong></td>
      <td>
        <strong>${log.name || 'Anonymous'}</strong><br>
        <small style="color:var(--admin-text-muted);">
          ${log.gender ? log.gender.toUpperCase() : ''} ${log.age ? '| ' + log.age + ' yrs' : ''} 
          ${log.weight ? '| ' + log.weight + 'kg' : ''}
        </small>
      </td>
      <td style="max-width:240px; white-space:normal; line-height:1.4;">
        <span style="font-weight:600; color:var(--admin-text-main);">${log.problem || 'General Checkup'}</span>
        ${log.duration ? `<br><small style="color:var(--admin-text-muted);"><i class="ri-history-line"></i> Duration: ${log.duration}</small>` : ''}
      </td>
      <td>
        <span class="badge" style="background:rgba(99,102,241,0.15);color:#818cf8;border:1px solid rgba(99,102,241,0.3);text-transform:capitalize;">
          ${log.category || 'general'}
        </span>
      </td>
      <td>
        <span class="badge" style="background:${doshaColor}22;color:${doshaColor};border:1px solid ${doshaColor}55;text-transform:capitalize;font-weight:700;">
          <i class="ri-fire-line"></i> ${log.dominantDosha || 'Tridoshic'}
        </span>
        <br>
        <small style="color:var(--admin-text-muted); font-size:10px;">
          ${log.scores ? `V:${log.scores.vata || 0} | P:${log.scores.pitta || 0} | K:${log.scores.kapha || 0}` : ''}
        </small>
      </td>
      <td style="max-width:260px; font-size:12px; white-space:normal; line-height:1.3;">
        <span style="color:#22c55e; font-weight:600;">${medicines}</span>${moreMeds ? `<em style="color:var(--admin-text-muted); font-size:11px;">${moreMeds}</em>` : ''}
      </td>
      <td>
        <span style="text-transform:uppercase;font-size:11px;font-weight:700;background:rgba(255,255,255,0.06);padding:3px 8px;border-radius:4px;">
          ${log.language === 'hi' ? '🇮🇳 Hindi' : log.language === 'mr' ? '🟠 Marathi' : '🌐 English'}
        </span>
      </td>
      <td style="font-size:12px;color:var(--admin-text-muted);">${dt}</td>
      <td>
        <button class="btn-catalog-view-detail" title="View Full AI Diagnosis" onclick="viewAIConsultationDetail('${logId}')">
          <i class="ri-eye-line"></i> View Report
        </button>
      </td>
    </tr>`;
  }).join('');
};

window.viewAIConsultationDetail = (logId) => {
  const modal = document.getElementById('admin-detail-view-backdrop');
  const title = document.getElementById('admin-detail-view-title');
  const container = document.getElementById('admin-detail-view-content');
  if (!modal || !container) return;

  const log = (AdminApp._allConsultations || []).find(l => (l.id || '') === logId || ('LOG-' + ((AdminApp._allConsultations.indexOf(l) + 1))) === logId);
  if (!log) return;

  title.innerHTML = `<i class="ri-robot-2-line" style="color:var(--admin-accent-gold);"></i> Charaka AI Diagnostic Record: ${log.name || 'Anonymous'}`;

  const medsHtml = (log.medicines || []).map(m => `<span style="display:inline-block;background:rgba(34,197,94,0.15);color:#4ade80;padding:4px 10px;border-radius:6px;font-size:12px;margin:2px 4px 2px 0;font-weight:600;"><i class="ri-capsule-line"></i> ${m}</span>`).join('') || '<span style="color:var(--admin-text-muted);">None prescribed</span>';

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px;">
      <div>
        <h4 style="margin:0 0 4px; font-size:18px; color:var(--admin-text-main);">${log.name || 'Anonymous Patient'}</h4>
        <span style="font-size:12px; color:var(--admin-text-muted);">Age: ${log.age || 'N/A'} | Gender: ${log.gender || 'N/A'} | Weight: ${log.weight ? log.weight + ' kg' : 'N/A'} | Height: ${log.height || 'N/A'}</span>
      </div>
      <span class="badge" style="background:rgba(207,168,92,0.15); color:var(--admin-accent-gold); border:1px solid var(--admin-accent-gold); font-size:12px;">
        ${log.id || logId}
      </span>
    </div>
    <div class="detail-item-grid">
      <div class="detail-item-card" style="grid-column: 1/-1;">
        <span class="detail-label">Reported Health Concern / Symptoms</span>
        <div class="detail-value" style="font-size:15px; color:#f0fdf4;">${log.problem || 'General Consultation'}</div>
        ${log.duration ? `<div style="font-size:12px; color:var(--admin-text-muted); margin-top:4px;"><strong>Duration of problem:</strong> ${log.duration}</div>` : ''}
      </div>
      <div class="detail-item-card">
        <span class="detail-label">Diagnostic Category</span>
        <div class="detail-value" style="text-transform:capitalize; color:#818cf8;">${log.category || 'General Health'}</div>
      </div>
      <div class="detail-item-card">
        <span class="detail-label">Dominant Dosha</span>
        <div class="detail-value" style="text-transform:capitalize; color:var(--admin-accent-gold);">${log.dominantDosha || 'Tridoshic Balance'}</div>
      </div>
      <div class="detail-item-card">
        <span class="detail-label">Dosha Imbalance Scores</span>
        <div class="detail-value" style="font-size:12px;">
          ${log.scores ? `Vata: <strong>${log.scores.vata || 0}</strong> | Pitta: <strong>${log.scores.pitta || 0}</strong> | Kapha: <strong>${log.scores.kapha || 0}</strong>` : 'N/A'}
        </div>
      </div>
      <div class="detail-item-card">
        <span class="detail-label">Consultation Language</span>
        <div class="detail-value">${log.language === 'hi' ? 'Hindi (हिंदी)' : log.language === 'mr' ? 'Marathi (मराठी)' : 'English'}</div>
      </div>
      <div class="detail-item-card" style="grid-column: 1/-1;">
        <span class="detail-label">Recommended Ayurvedic Remedies</span>
        <div class="detail-value" style="margin-top:6px;">${medsHtml}</div>
      </div>
      ${log.advice ? `
      <div class="detail-item-card" style="grid-column: 1/-1;">
        <span class="detail-label">Charaka AI Clinical Advice &amp; Lifestyle Guidelines</span>
        <div class="detail-value" style="font-size:13px; font-weight:400; line-height:1.5; color:#e2e8f0;">${log.advice.replace(/\n/g, '<br>')}</div>
      </div>` : ''}
      <div class="detail-item-card" style="grid-column: 1/-1;">
        <span class="detail-label">Consultation Timestamp</span>
        <div class="detail-value" style="font-size:12px; color:var(--admin-text-muted);">${log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN') : 'N/A'}</div>
      </div>
    </div>
  `;

  modal.classList.add('active');
};

AdminApp.filterConsultations = function(query) {
  const q = (query || '').toLowerCase();
  const filtered = AdminApp._allConsultations.filter(log =>
    (log.name || '').toLowerCase().includes(q) ||
    (log.problem || '').toLowerCase().includes(q) ||
    (log.category || '').toLowerCase().includes(q)
  );
  AdminApp.renderConsultations(filtered);
};

// ===== SYSTEM SETTINGS =====
AdminApp.fetchSettings = async function() {
  const container = document.getElementById('settings-container');
  if (!container) return;
  container.innerHTML = `<div style="text-align:center;padding:60px;"><i class="ri-loader-4-line ri-spin" style="font-size:32px;color:var(--admin-accent-gold);"></i><p style="margin-top:12px;color:var(--admin-text-muted);">Loading system settings & diagnostics...</p></div>`;
  try {
    const res = await fetch(`${ADMIN_API}/admin/settings`);
    const data = await res.json();
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:24px;">

        <!-- Top Status & Actions Banner -->
        <div class="admin-card" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;padding:20px 24px;">
          <div style="display:flex;align-items:center;gap:14px;">
            <div style="width:12px;height:12px;border-radius:50%;background:#22c55e;box-shadow:0 0 10px #22c55e;animation:pulse 2s infinite;"></div>
            <div>
              <h4 style="margin:0 0 2px;color:var(--admin-text-main);font-size:16px;">Core Platform Online &amp; Operational</h4>
              <span style="font-size:12px;color:var(--admin-text-muted);">Running ${data.systemName} &bull; ${data.version}</span>
            </div>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <button class="btn-admin-secondary" onclick="AdminApp.fetchSettings()" style="display:flex;align-items:center;gap:6px;">
              <i class="ri-refresh-line"></i> Refresh Diagnostics
            </button>
            <a href="/provider.html" target="_blank" class="btn-admin-primary" style="display:flex;align-items:center;gap:6px;text-decoration:none;padding:10px 18px;font-size:13px;">
              <i class="ri-shield-user-line"></i> Provider Portal <i class="ri-external-link-line" style="font-size:12px;"></i>
            </a>
            <a href="/index.html" target="_blank" class="btn-admin-secondary" style="display:flex;align-items:center;gap:6px;text-decoration:none;">
              <i class="ri-home-4-line"></i> Main Website <i class="ri-external-link-line" style="font-size:12px;"></i>
            </a>
          </div>
        </div>

        <!-- 3-Column Diagnostic Grid -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px;">

          <!-- Card 1: System Information -->
          <div class="admin-card" style="border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px;">
            <h3 style="color:var(--admin-accent-gold);margin-bottom:16px;display:flex;align-items:center;gap:10px;font-size:16px;">
              <i class="ri-server-line"></i> Server &amp; Architecture
            </h3>
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <tbody>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                  <td style="padding:10px 0;color:var(--admin-text-muted);">Control Center</td>
                  <td style="font-weight:700;text-align:right;">${data.systemName}</td>
                </tr>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                  <td style="padding:10px 0;color:var(--admin-text-muted);">Build Release</td>
                  <td style="text-align:right;"><span class="badge" style="background:rgba(99,102,241,0.2);color:#818cf8;">${data.version}</span></td>
                </tr>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                  <td style="padding:10px 0;color:var(--admin-text-muted);">Environment</td>
                  <td style="text-align:right;"><span class="badge" style="background:rgba(16,185,129,0.2);color:#10b981;">${data.environment}</span></td>
                </tr>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                  <td style="padding:10px 0;color:var(--admin-text-muted);">Database Engine</td>
                  <td style="font-size:12px;color:#10b981;font-weight:600;text-align:right;">${data.databaseStatus}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;color:var(--admin-text-muted);">Server Local Time</td>
                  <td style="font-size:12px;text-align:right;color:var(--admin-text-main);">${new Date(data.serverTime).toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Card 2: Payment Gateway & UPI Direct Mode -->
          <div class="admin-card" style="border:1px solid rgba(207,168,92,0.25);border-radius:16px;padding:24px;background:linear-gradient(135deg, rgba(207,168,92,0.06), rgba(16,185,129,0.04));">
            <h3 style="color:var(--admin-accent-gold);margin-bottom:16px;display:flex;align-items:center;gap:10px;font-size:16px;">
              <i class="ri-qr-code-line"></i> Payment Gateway &amp; UPI
            </h3>
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <tbody>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                  <td style="padding:10px 0;color:var(--admin-text-muted);">Payment Mode</td>
                  <td style="font-weight:700;text-align:right;color:#22c55e;"><i class="ri-check-line"></i> Direct Company UPI QR</td>
                </tr>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                  <td style="padding:10px 0;color:var(--admin-text-muted);">Transaction Fees</td>
                  <td style="font-weight:700;text-align:right;color:#22c55e;">0% (Zero Gateway Fees)</td>
                </tr>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                  <td style="padding:10px 0;color:var(--admin-text-muted);">UPI VPA Address</td>
                  <td style="text-align:right;"><code style="color:var(--admin-accent-gold);background:rgba(207,168,92,0.15);padding:2px 8px;border-radius:4px;">vednidan@icici</code></td>
                </tr>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                  <td style="padding:10px 0;color:var(--admin-text-muted);">Auto-Fill Amount</td>
                  <td style="text-align:right;color:#22c55e;font-weight:700;">Enabled (Instant Scan)</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;color:var(--admin-text-muted);">Settlement Speed</td>
                  <td style="text-align:right;color:var(--admin-text-main);font-weight:600;">Direct to Bank Account</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Card 3: Platform Live Metrics -->
          <div class="admin-card" style="border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px;">
            <h3 style="color:var(--admin-accent-gold);margin-bottom:16px;display:flex;align-items:center;gap:10px;font-size:16px;">
              <i class="ri-bar-chart-box-line"></i> Platform Repositories
            </h3>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div onclick="AdminApp.switchTab('products')" style="cursor:pointer;text-align:center;padding:16px;background:rgba(255,255,255,0.04);border-radius:12px;border:1px solid rgba(255,255,255,0.05);transition:all 0.2s;" onmouseover="this.style.borderColor='var(--admin-accent-gold)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.05)'">
                <div style="font-size:28px;font-weight:800;color:#818cf8;">${data.productsCount || 0}</div>
                <div style="font-size:11px;color:var(--admin-text-muted);margin-top:2px;">Medicines / Products</div>
              </div>
              <div onclick="AdminApp.switchTab('ai-consultations')" style="cursor:pointer;text-align:center;padding:16px;background:rgba(255,255,255,0.04);border-radius:12px;border:1px solid rgba(255,255,255,0.05);transition:all 0.2s;" onmouseover="this.style.borderColor='var(--admin-accent-gold)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.05)'">
                <div style="font-size:28px;font-weight:800;color:#10b981;">${data.aiConsultationsCount || 0}</div>
                <div style="font-size:11px;color:var(--admin-text-muted);margin-top:2px;">AI Consultations</div>
              </div>
              <div onclick="AdminApp.switchTab('partner-accounts')" style="cursor:pointer;text-align:center;padding:16px;background:rgba(255,255,255,0.04);border-radius:12px;border:1px solid rgba(255,255,255,0.05);transition:all 0.2s;" onmouseover="this.style.borderColor='var(--admin-accent-gold)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.05)'">
                <div style="font-size:28px;font-weight:800;color:#f59e0b;">${data.partnerAccountsCount || 0}</div>
                <div style="font-size:11px;color:var(--admin-text-muted);margin-top:2px;">Partner Accounts</div>
              </div>
              <div onclick="AdminApp.switchTab('bookings')" style="cursor:pointer;text-align:center;padding:16px;background:rgba(255,255,255,0.04);border-radius:12px;border:1px solid rgba(255,255,255,0.05);transition:all 0.2s;" onmouseover="this.style.borderColor='var(--admin-accent-gold)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.05)'">
                <div style="font-size:28px;font-weight:800;color:#38bdf8;">Live</div>
                <div style="font-size:11px;color:var(--admin-text-muted);margin-top:2px;">Appointments Active</div>
              </div>
            </div>
          </div>

        </div>

        <!-- Default Credentials & Access Management Card -->
        <div class="admin-card" style="border:1px solid rgba(207,168,92,0.25);border-radius:16px;padding:28px;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:14px;">
            <h3 style="color:var(--admin-accent-gold);margin:0;display:flex;align-items:center;gap:10px;font-size:18px;">
              <i class="ri-shield-keyhole-line"></i> Authorized Portals &amp; Login Credentials
            </h3>
            <span style="font-size:12px;color:var(--admin-text-muted);background:rgba(255,255,255,0.05);padding:4px 12px;border-radius:20px;">
              <i class="ri-information-line"></i> Credentials for doctors, therapists, and administrators
            </span>
          </div>
          <p style="font-size:13px;color:var(--admin-text-muted);margin:0 0 16px;">
            Use these portal URLs and credentials to login into doctor clinical workspace, therapist in-clinic dashboard, or the administrator control center.
          </p>
          <div class="table-responsive" style="margin:0;">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Designated Role</th>
                  <th>Portal Endpoint</th>
                  <th>Default Login ID / Email</th>
                  <th>Default Password</th>
                  <th>Operational Scope</th>
                  <th>Direct Access</th>
                </tr>
              </thead>
              <tbody>
                ${(data.defaultCredentials || []).map(cred => `
                  <tr>
                    <td><strong style="color:var(--admin-text-main);">${cred.role}</strong></td>
                    <td><code style="font-size:12px;background:rgba(255,255,255,0.06);padding:4px 10px;border-radius:6px;color:#38bdf8;">${cred.portal}</code></td>
                    <td><code style="font-size:12px;color:#a78bfa;font-weight:600;">${cred.defaultId}</code></td>
                    <td><code style="font-size:12px;color:#fbbf24;background:rgba(251,191,36,0.12);padding:4px 10px;border-radius:6px;font-weight:700;">${cred.defaultPassword}</code></td>
                    <td style="font-size:12px;color:var(--admin-text-muted);">${cred.notes}</td>
                    <td>
                      <a href="${cred.portal}" target="_blank" class="btn-table-action" style="text-decoration:none;display:inline-flex;align-items:center;gap:4px;" title="Open Portal">
                        <i class="ri-external-link-line"></i> Open
                      </a>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  } catch (err) {
    container.innerHTML = `<p style="color:#e74c3c;text-align:center;padding:40px;">Failed to load settings. Please try again.</p>`;
  }
};

// ─── Product Image Upload Handler ───────────────────────────────────────────
// Called once the DOM is ready (inside DOMContentLoaded below)
function initProductImageUpload() {
  const fileInput    = document.getElementById('product-img-file-input');
  const dropzone     = document.getElementById('product-img-dropzone');
  const previewWrap  = document.getElementById('product-img-preview-wrap');
  const previewImg   = document.getElementById('product-img-preview');
  const placeholder  = document.getElementById('product-img-placeholder');
  const hiddenUrl    = document.getElementById('product-image');
  const urlFallback  = document.getElementById('product-image-url-fallback');
  const statusDiv    = document.getElementById('product-img-upload-status');

  if (!fileInput || !dropzone) return;

  // Drag-and-drop visual feedback
  dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.style.background = 'rgba(74,124,111,0.15)'; });
  dropzone.addEventListener('dragleave', () => { dropzone.style.background = 'rgba(74,124,111,0.05)'; });
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.style.background = 'rgba(74,124,111,0.05)';
    if (e.dataTransfer.files.length > 0) handleImageFile(e.dataTransfer.files[0]);
  });

  fileInput.addEventListener('change', e => {
    if (e.target.files.length > 0) handleImageFile(e.target.files[0]);
  });

  // URL fallback overrides uploaded image
  urlFallback.addEventListener('input', () => {
    const val = urlFallback.value.trim();
    if (val) {
      hiddenUrl.value = val;
      showPreview(val);
    }
  });

  async function handleImageFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WEBP).');
      return;
    }

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    showPreview(localUrl);

    // Upload to server
    if (statusDiv) { statusDiv.style.display = 'block'; statusDiv.textContent = 'Uploading...'; statusDiv.style.color = '#94a3b8'; }

    try {
      const formData = new FormData();
      formData.append('productImage', file);

      const res = await fetch(ADMIN_API + '/admin/upload-product-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.imageUrl) {
        hiddenUrl.value = data.imageUrl;
        showPreview(data.imageUrl);
        if (statusDiv) { statusDiv.textContent = '✓ Image uploaded successfully!'; statusDiv.style.color = '#22c55e'; }
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Image upload error:', err);
      // Keep the local preview but flag as not saved
      if (statusDiv) { statusDiv.textContent = '⚠ Could not upload to server — image may not persist after server restart.'; statusDiv.style.color = '#f59e0b'; }
    }
  }

  function showPreview(src) {
    previewImg.src = src;
    previewWrap.style.display = 'block';
    placeholder.style.display = 'none';
  }

  // Expose to reset from outside (modal open/close)
  window.resetProductImageUpload = (existingUrl) => {
    fileInput.value = '';
    urlFallback.value = '';
    hiddenUrl.value = existingUrl || '';
    if (statusDiv) { statusDiv.style.display = 'none'; statusDiv.textContent = ''; }
    if (existingUrl) {
      showPreview(existingUrl);
    } else {
      previewWrap.style.display = 'none';
      placeholder.style.display = 'block';
      previewImg.src = '';
    }
  };
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  AdminApp.init();
  initProductImageUpload();
});


