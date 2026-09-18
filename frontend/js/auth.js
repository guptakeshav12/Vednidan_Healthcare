// User Authentication Handler

const Auth = {
  currentUser: null,

  init() {
    this.checkSession();
    this.setupListeners();
  },

  setupListeners() {
    const loginHeaderBtn = document.getElementById('header-login-btn');
    const backdrop = document.getElementById('auth-modal-backdrop');
    
    const loginPanel = document.getElementById('login-modal-panel');
    const signupPanel = document.getElementById('signup-modal-panel');

    const loginClose = document.getElementById('login-close-btn');
    const signupClose = document.getElementById('signup-close-btn');

    const toSignup = document.getElementById('goto-signup-btn');
    const toLogin = document.getElementById('goto-login-btn');

    // Forms
    const loginForm = document.getElementById('login-submit-form');
    const signupForm = document.getElementById('signup-submit-form');

    if (loginHeaderBtn) {
      loginHeaderBtn.addEventListener('click', () => {
        if (this.currentUser) {
          // If already logged in, show logout confirmation prompt
          if (confirm(`Logout from ${this.currentUser.name}'s account?`)) {
            this.logout();
          }
        } else {
          this.toggleModal(true, 'login');
        }
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) this.toggleModal(false);
      });
    }

    if (loginClose) loginClose.addEventListener('click', () => this.toggleModal(false));
    if (signupClose) signupClose.addEventListener('click', () => this.toggleModal(false));

    if (toSignup) {
      toSignup.addEventListener('click', () => {
        if (loginPanel && signupPanel) {
          loginPanel.style.display = 'none';
          signupPanel.style.display = 'block';
        }
      });
    }

    if (toLogin) {
      toLogin.addEventListener('click', () => {
        if (loginPanel && signupPanel) {
          signupPanel.style.display = 'none';
          loginPanel.style.display = 'block';
        }
      });
    }

    // Form Submits
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitLogin();
      });
    }

    if (signupForm) {
      signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitSignup();
      });
    }
  },

  toggleModal(open, mode = 'login') {
    const backdrop = document.getElementById('auth-modal-backdrop');
    const loginPanel = document.getElementById('login-modal-panel');
    const signupPanel = document.getElementById('signup-modal-panel');

    if (!backdrop) return;

    if (open) {
      backdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
      if (mode === 'login') {
        if (loginPanel) loginPanel.style.display = 'block';
        if (signupPanel) signupPanel.style.display = 'none';
      } else {
        if (loginPanel) loginPanel.style.display = 'none';
        if (signupPanel) signupPanel.style.display = 'block';
      }
    } else {
      backdrop.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  checkSession() {
    const saved = localStorage.getItem('vednidan_user');
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved);
        this.updateHeaderUI();
      } catch (e) {
        this.currentUser = null;
      }
    }
  },

  updateHeaderUI() {
    const wrapper = document.getElementById('auth-header-wrapper');
    if (!wrapper) return;

    if (this.currentUser) {
      const firstLetter = (this.currentUser.name || 'U').charAt(0).toUpperCase();
      wrapper.innerHTML = `
        <div class="user-profile-menu" id="header-profile-menu">
          <div class="user-avatar-circle">${firstLetter}</div>
          <span class="user-name-display">${this.currentUser.name}</span>
          <i class="ri-arrow-down-s-line profile-chevron"></i>

          <div class="user-dropdown-panel" id="user-profile-dropdown" style="display: none;">
            <div class="dropdown-header-user">
              <div class="dropdown-user-avatar">${firstLetter}</div>
              <div class="dropdown-user-meta">
                <div class="dropdown-user-name">${this.currentUser.name}</div>
                <div class="dropdown-user-email">${this.currentUser.email}</div>
              </div>
            </div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-menu-list">
              <button type="button" class="dropdown-menu-item" id="dd-item-orders">
                <div class="dropdown-item-icon orders-icon"><i class="ri-shopping-bag-3-line"></i></div>
                <div class="dropdown-item-info">
                  <span class="dropdown-item-title">Medicine Orders</span>
                  <span class="dropdown-item-desc">Orders history & live shipment track</span>
                </div>
              </button>
              <button type="button" class="dropdown-menu-item" id="dd-item-doctor">
                <div class="dropdown-item-icon doctor-icon"><i class="ri-nurse-line"></i></div>
                <div class="dropdown-item-info">
                  <span class="dropdown-item-title">Doctor Consultations</span>
                  <span class="dropdown-item-desc">Appointments & online video call link</span>
                </div>
              </button>
              <button type="button" class="dropdown-menu-item" id="dd-item-therapist">
                <div class="dropdown-item-icon therapist-icon"><i class="ri-hand-heart-line"></i></div>
                <div class="dropdown-item-info">
                  <span class="dropdown-item-title">Therapist Sessions</span>
                  <span class="dropdown-item-desc">Therapist details, route track & visit OTP</span>
                </div>
              </button>
              <div class="dropdown-divider"></div>
              <button type="button" class="dropdown-menu-item dropdown-logout-item" id="dd-item-logout">
                <div class="dropdown-item-icon logout-icon"><i class="ri-logout-box-r-line"></i></div>
                <div class="dropdown-item-info">
                  <span class="dropdown-item-title" style="color: #ef4444;">Log Out</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      `;

      this.bindDropdownEvents();
      this.autofillForms();
    } else {
      wrapper.innerHTML = `
        <button class="auth-header-btn" id="header-login-btn">Log In / Sign Up</button>
      `;
      const loginHeaderBtn = document.getElementById('header-login-btn');
      if (loginHeaderBtn) {
        loginHeaderBtn.addEventListener('click', () => this.toggleModal(true, 'login'));
      }
    }
  },

  bindDropdownEvents() {
    const profileMenu = document.getElementById('header-profile-menu');
    const dropdown = document.getElementById('user-profile-dropdown');

    if (profileMenu && dropdown) {
      profileMenu.addEventListener('click', (e) => {
        // Toggle dropdown if clicked on menu itself or not on dropdown item
        if (e.target.closest('.dropdown-menu-item')) return;
        const isHidden = dropdown.style.display === 'none';
        dropdown.style.display = isHidden ? 'block' : 'none';
        profileMenu.classList.toggle('open', isHidden);
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!profileMenu.contains(e.target)) {
          dropdown.style.display = 'none';
          profileMenu.classList.remove('open');
        }
      });
    }

    // Dropdown Items
    const btnOrders = document.getElementById('dd-item-orders');
    if (btnOrders) {
      btnOrders.addEventListener('click', (e) => {
        e.stopPropagation();
        if (dropdown) dropdown.style.display = 'none';
        if (profileMenu) profileMenu.classList.remove('open');
        this.openActivityModal('orders');
      });
    }

    const btnDoctor = document.getElementById('dd-item-doctor');
    if (btnDoctor) {
      btnDoctor.addEventListener('click', (e) => {
        e.stopPropagation();
        if (dropdown) dropdown.style.display = 'none';
        if (profileMenu) profileMenu.classList.remove('open');
        this.openActivityModal('doctor');
      });
    }

    const btnTherapist = document.getElementById('dd-item-therapist');
    if (btnTherapist) {
      btnTherapist.addEventListener('click', (e) => {
        e.stopPropagation();
        if (dropdown) dropdown.style.display = 'none';
        if (profileMenu) profileMenu.classList.remove('open');
        this.openActivityModal('therapist');
      });
    }

    const btnLogout = document.getElementById('dd-item-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', (e) => {
        e.stopPropagation();
        if (dropdown) dropdown.style.display = 'none';
        if (profileMenu) profileMenu.classList.remove('open');
        this.logout();
      });
    }
  },

  // ── User Activity Dashboard Modal ──────────────────────────────
  setupActivityModalListeners() {
    const modal = document.getElementById('user-activity-modal');
    const closeBtn = document.getElementById('activity-modal-close-btn');

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    }

    // Tab buttons
    ['orders', 'doctor', 'therapist'].forEach(tabName => {
      const tabBtn = document.getElementById(`act-tab-${tabName}`);
      if (tabBtn) {
        tabBtn.addEventListener('click', () => this.switchActivityTab(tabName));
      }
    });
  },

  openActivityModal(defaultTab = 'orders') {
    if (!this.currentUser) {
      showToast('Please log in to view your activities.', 'warning');
      this.toggleModal(true, 'login');
      return;
    }

    const modal = document.getElementById('user-activity-modal');
    if (!modal) return;

    this.setupActivityModalListeners();

    const titleEl = document.getElementById('activity-modal-user-heading');
    if (titleEl) {
      titleEl.textContent = `${this.currentUser.name}'s Activities & Bookings`;
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    this.switchActivityTab(defaultTab);
    this.loadUserActivities();
  },

  switchActivityTab(tabName) {
    ['orders', 'doctor', 'therapist'].forEach(t => {
      const btn = document.getElementById(`act-tab-${t}`);
      const pane = document.getElementById(`act-pane-${t}`);
      if (btn) btn.classList.toggle('active', t === tabName);
      if (pane) pane.style.display = t === tabName ? 'block' : 'none';
    });
  },

  async loadUserActivities() {
    if (!this.currentUser || !this.currentUser.email) return;

    const email = this.currentUser.email.trim();

    try {
      const res = await fetch(`${window.API_BASE || '/api'}/auth/user-activity?email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error('Failed to retrieve user activities');
      const data = await res.json();

      const orders = data.orders || [];
      const doctors = data.doctorBookings || [];
      const therapists = data.therapistBookings || [];

      // Update counters
      const ordersCountEl = document.getElementById('act-orders-count');
      const docCountEl = document.getElementById('act-doctor-count');
      const thCountEl = document.getElementById('act-therapist-count');

      if (ordersCountEl) ordersCountEl.textContent = orders.length;
      if (docCountEl) docCountEl.textContent = doctors.length;
      if (thCountEl) thCountEl.textContent = therapists.length;

      // Render tab panes
      this.renderOrdersTab(orders);
      this.renderDoctorBookingsTab(doctors);
      this.renderTherapistBookingsTab(therapists);

    } catch (e) {
      console.error('[Activities Error]', e);
    }
  },

  renderOrdersTab(orders) {
    const container = document.getElementById('act-orders-list');
    if (!container) return;

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="activity-empty-state">
          <i class="ri-shopping-bag-3-line activity-empty-icon"></i>
          <h4>No Medicine Orders Placed Yet</h4>
          <p style="font-size:13px;margin-top:4px;">Browse our authentic Ayurvedic remedies and order directly with home delivery.</p>
          <button class="btn-act-primary" style="margin-top:14px;" onclick="document.getElementById('activity-modal-close-btn').click(); document.getElementById('nav-shop').click();">Explore Remedies Store</button>
        </div>
      `;
      return;
    }

    container.innerHTML = orders.map(o => {
      const statusClass = `status-${(o.status || 'pending').toLowerCase()}`;
      const dateStr = o.orderedAt ? new Date(o.orderedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent';
      return `
        <div class="activity-item-card">
          <div class="activity-card-header">
            <div>
              <span class="activity-card-id">Order #${o.id}</span>
              <span class="activity-card-date"><i class="ri-calendar-line"></i> ${dateStr}</span>
            </div>
            <span class="activity-status-pill ${statusClass}"><i class="ri-record-circle-fill" style="font-size:8px;"></i> ${o.status || 'Pending'}</span>
          </div>
          <div style="font-size:13px;margin-bottom:8px;">
            <strong>Items:</strong>
            <ul style="padding-left:18px;margin:6px 0;color:var(--text-secondary);">
              ${(o.items || []).map(it => `<li>${it.name} <strong>(x${it.quantity})</strong> — ₹${it.price * it.quantity}</li>`).join('')}
            </ul>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;background:var(--background);padding:8px 12px;border-radius:6px;font-size:13px;">
            <div><span>Total: </span><strong style="color:var(--primary);font-size:15px;">₹${(o.total || 0).toLocaleString('en-IN')}</strong></div>
            <div style="font-size:11px;color:var(--text-muted);"><i class="ri-map-pin-line"></i> ${o.shippingCity || ''} ${o.shippingState ? ', ' + o.shippingState : ''}</div>
          </div>
          <div class="activity-card-actions">
            <button class="btn-act-primary" onclick="Auth.trackThisOrder(${o.id})">
              <i class="ri-truck-line"></i> Live Track Shipment
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  renderDoctorBookingsTab(doctors) {
    const container = document.getElementById('act-doctor-list');
    if (!container) return;

    if (doctors.length === 0) {
      container.innerHTML = `
        <div class="activity-empty-state">
          <i class="ri-nurse-line activity-empty-icon"></i>
          <h4>No Doctor Consultations Booked</h4>
          <p style="font-size:13px;margin-top:4px;">Schedule a one-on-one virtual diagnostic consultation with top certified Ayurvedic Vaidyas.</p>
          <button class="btn-act-primary" style="margin-top:14px;" onclick="document.getElementById('activity-modal-close-btn').click(); document.getElementById('nav-booking').click();">Book Doctor Consultation</button>
        </div>
      `;
      return;
    }

    container.innerHTML = doctors.map(d => {
      const statusClass = `status-${(d.status || 'scheduled').toLowerCase().replace(' ', '')}`;
      const videoRoom = d.videoRoomId || `VedNidan_Consultation_${d.id}`;
      const canJoinVideo = d.status !== 'Cancelled';

      return `
        <div class="activity-item-card">
          <div class="activity-card-header">
            <div>
              <span class="activity-card-id">Appointment #${d.id}</span>
              <span class="activity-card-date"><i class="ri-calendar-event-line"></i> ${d.date} at ${d.timeSlot}</span>
            </div>
            <span class="activity-status-pill ${statusClass}"><i class="ri-record-circle-fill" style="font-size:8px;"></i> ${d.status || 'Scheduled'}</span>
          </div>
          <div style="font-size:13px;line-height:1.6;">
            <div><strong>Consulting Doctor:</strong> <span style="color:var(--primary-dark);font-weight:700;">${d.doctorName || 'Ayurvedic Specialist'}</span></div>
            ${d.symptom ? `<div><strong>Chief Concern:</strong> <span style="color:var(--text-secondary);font-style:italic;">${d.symptom}</span></div>` : ''}
          </div>

          ${d.prescription ? `
            <div style="margin-top:10px;background:var(--accent);padding:10px 12px;border-radius:6px;border:1px solid rgba(10,77,60,0.1);font-size:12px;">
              <strong style="color:var(--primary-dark);"><i class="ri-file-list-3-line"></i> Prescription Notes:</strong>
              <div style="margin-top:4px;color:var(--text-primary);white-space:pre-line;">${d.prescription}</div>
            </div>
          ` : ''}

          <div class="activity-card-actions">
            ${canJoinVideo ? `
              <button class="btn-act-video" onclick="Auth.joinDoctorCall('${videoRoom}')">
                <i class="ri-video-on-line"></i> 🎥 Join Live Video Room
              </button>
            ` : ''}
            <button class="btn-act-secondary" onclick="Auth.trackThisSession(${d.id})">
              <i class="ri-calendar-check-line"></i> View In Live Tracker
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  renderTherapistBookingsTab(therapists) {
    const container = document.getElementById('act-therapist-list');
    if (!container) return;

    if (therapists.length === 0) {
      container.innerHTML = `
        <div class="activity-empty-state">
          <i class="ri-hand-heart-line activity-empty-icon"></i>
          <h4>No Therapist Sessions Scheduled</h4>
          <p style="font-size:13px;margin-top:4px;">Experience authentic Panchakarma, Abhyanga & Shirodhara with verified practitioners at home.</p>
          <button class="btn-act-primary" style="margin-top:14px;" onclick="document.getElementById('activity-modal-close-btn').click(); document.getElementById('nav-therapist').click();">Book Home Therapy</button>
        </div>
      `;
      return;
    }

    container.innerHTML = therapists.map(t => {
      const statusClass = `status-${(t.status || 'pending').toLowerCase().replace(' ', '')}`;
      const otp = t.otpCode || t.otp_code || '----';

      return `
        <div class="activity-item-card">
          <div class="activity-card-header">
            <div>
              <span class="activity-card-id">Session #${t.id}</span>
              <span class="activity-card-date"><i class="ri-calendar-event-line"></i> ${t.date} at ${t.timeSlot}</span>
            </div>
            <span class="activity-status-pill ${statusClass}"><i class="ri-record-circle-fill" style="font-size:8px;"></i> ${t.status || 'Pending'}</span>
          </div>

          <div style="font-size:13px;line-height:1.6;">
            <div><strong>Therapist:</strong> <span style="color:var(--primary-dark);font-weight:700;">${t.therapistName || 'Ayurvedic Therapist'}</span></div>
            <div><strong>Therapy Type:</strong> <span style="color:var(--secondary-dark);font-weight:700;">${t.therapyType || 'Panchakarma / Abhyanga'}</span></div>
            <div><strong>Visit Address:</strong> <span style="color:var(--text-secondary);">${t.address || 'Address provided during booking'}</span></div>
          </div>

          <!-- Highlighted Visit Verification OTP -->
          <div class="activity-otp-badge-box">
            <div class="activity-otp-left">
              <span class="activity-otp-label"><i class="ri-shield-keyhole-line"></i> Visit Verification OTP</span>
              <span class="activity-otp-desc">Share this code with therapist upon arrival to start session</span>
            </div>
            <div class="activity-otp-code">${otp}</div>
          </div>

          ${t.feedback ? `
            <div style="background:var(--accent);padding:10px 12px;border-radius:6px;font-size:12px;margin-bottom:8px;">
              <strong>Therapist Report:</strong> <em>"${t.feedback}"</em>
              ${t.rating ? `<div style="color:var(--secondary-dark);font-weight:700;margin-top:2px;">Wellness Score: ${'★'.repeat(t.rating)}</div>` : ''}
            </div>
          ` : ''}

          <div class="activity-card-actions">
            <button class="btn-act-primary" onclick="Auth.trackThisSession(${t.id})">
              <i class="ri-navigation-line"></i> 🏍️ Track Therapist Route & Arrival
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  // ── Direct Action Helpers ───────────────────────────────────────
  trackThisOrder(orderId) {
    const modal = document.getElementById('user-activity-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    const navTrack = document.getElementById('nav-track');
    if (navTrack) navTrack.click();

    const remediesTab = document.getElementById('track-remedies-tab');
    if (remediesTab) remediesTab.click();

    const inputField = document.getElementById('tracking-input-id');
    if (inputField) {
      inputField.value = orderId;
      if (window.Tracking && typeof window.Tracking.executeTracking === 'function') {
        window.Tracking.executeTracking();
      }
    }
  },

  trackThisSession(bookingId) {
    const modal = document.getElementById('user-activity-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    const navTrack = document.getElementById('nav-track');
    if (navTrack) navTrack.click();

    const sessionsTab = document.getElementById('track-sessions-tab');
    if (sessionsTab) sessionsTab.click();

    const inputField = document.getElementById('tracking-input-id');
    if (inputField) {
      inputField.value = bookingId;
      if (window.Tracking && typeof window.Tracking.executeTracking === 'function') {
        window.Tracking.executeTracking();
      }
    }
  },

  joinDoctorCall(roomName) {
    const url = `https://meet.jit.si/${roomName}`;
    window.open(url, '_blank');
  },

  autofillForms() {
    if (!this.currentUser) return;
    const name = this.currentUser.name || '';
    const email = this.currentUser.email || '';

    // Doctor booking
    const docName = document.getElementById('booking-patient-name');
    const docEmail = document.getElementById('booking-patient-email');
    if (docName && !docName.value) docName.value = name;
    if (docEmail && !docEmail.value) docEmail.value = email;

    // Therapist booking
    const thName = document.getElementById('therapy-patient-name');
    const thEmail = document.getElementById('therapy-patient-email');
    if (thName && !thName.value) thName.value = name;
    if (thEmail && !thEmail.value) thEmail.value = email;

    // Checkout form
    const ckName = document.getElementById('checkout-name');
    const ckEmail = document.getElementById('checkout-email');
    if (ckName && !ckName.value) ckName.value = name;
    if (ckEmail && !ckEmail.value) ckEmail.value = email;
  },

  async submitLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      const response = await fetch((window.API_BASE || '/api') + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');

      this.currentUser = data.user;
      localStorage.setItem('vednidan_user', JSON.stringify(this.currentUser));
      
      this.updateHeaderUI();
      this.toggleModal(false);
      showToast(`Welcome back, ${this.currentUser.name}! 👋`);
      this.autofillForms();

    } catch (e) {
      console.error(e);
      showToast(e.message || 'Invalid email or password', 'error');
    }
  },

  async submitSignup() {
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    try {
      const response = await fetch((window.API_BASE || '/api') + '/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Signup failed');

      showToast('Account created successfully! Please log in.', 'success');
      
      const loginPanel = document.getElementById('login-modal-panel');
      const signupPanel = document.getElementById('signup-modal-panel');
      if (loginPanel && signupPanel) {
        signupPanel.style.display = 'none';
        loginPanel.style.display = 'block';
        document.getElementById('login-email').value = email;
        document.getElementById('login-password').value = '';
      }

    } catch (e) {
      console.error(e);
      showToast(e.message || 'Signup failed', 'error');
    }
  },

  logout() {
    this.currentUser = null;
    localStorage.removeItem('vednidan_user');
    this.updateHeaderUI();
    showToast('Logged out successfully', 'warning');
    
    // Clear booking and checkout fields
    const pName = document.getElementById('booking-patient-name');
    const pEmail = document.getElementById('booking-patient-email');
    if (pName) pName.value = '';
    if (pEmail) pEmail.value = '';

    const thName = document.getElementById('therapy-patient-name');
    const thEmail = document.getElementById('therapy-patient-email');
    if (thName) thName.value = '';
    if (thEmail) thEmail.value = '';

    const ckName = document.getElementById('checkout-name');
    const ckEmail = document.getElementById('checkout-email');
    if (ckName) ckName.value = '';
    if (ckEmail) ckEmail.value = '';
  }
};


// Start Auth immediately on load
document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
});
