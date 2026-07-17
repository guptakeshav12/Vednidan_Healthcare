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
      const firstLetter = this.currentUser.name.charAt(0).toUpperCase();
      wrapper.innerHTML = `
        <div class="user-profile-menu" id="header-profile-menu" title="Click to log out">
          <div class="user-avatar-circle">${firstLetter}</div>
          <span class="user-name-display">${this.currentUser.name}</span>
        </div>
      `;

      // Bind logout action on clicking the profile wrapper
      const profileMenu = document.getElementById('header-profile-menu');
      if (profileMenu) {
        profileMenu.addEventListener('click', () => {
          if (confirm(`Logout from ${this.currentUser.name}'s account?`)) {
            this.logout();
          }
        });
      }
    } else {
      wrapper.innerHTML = `
        <button class="auth-header-btn" id="header-login-btn">Log In / Sign Up</button>
      `;
      // Re-bind listeners for the button
      const loginHeaderBtn = document.getElementById('header-login-btn');
      if (loginHeaderBtn) {
        loginHeaderBtn.addEventListener('click', () => this.toggleModal(true, 'login'));
      }
    }
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

      // Autofill patient details on Booking page if logged in
      const pName = document.getElementById('booking-patient-name');
      const pEmail = document.getElementById('booking-patient-email');
      if (pName) pName.value = this.currentUser.name;
      if (pEmail) pEmail.value = this.currentUser.email;

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
      
      // Auto switch back to login panel
      const loginPanel = document.getElementById('login-modal-panel');
      const signupPanel = document.getElementById('signup-modal-panel');
      if (loginPanel && signupPanel) {
        signupPanel.style.display = 'none';
        loginPanel.style.display = 'block';
        
        // Fill email field
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
    
    // Clear booking fields
    const pName = document.getElementById('booking-patient-name');
    const pEmail = document.getElementById('booking-patient-email');
    if (pName) pName.value = '';
    if (pEmail) pEmail.value = '';
  }
};

// Start Auth immediately on load
document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
});
