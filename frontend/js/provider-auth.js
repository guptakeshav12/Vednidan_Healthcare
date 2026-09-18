// Provider Portal — Authentication Screen Controller
// Handles: Login, Signup, Forgot Password, OTP Reset

const API = window.API_BASE || '/api';

// ─── Current forgot-password state ───────────────────────
let forgotEmail = '';
let forgotRole  = 'doctor';

// ─── Specialty options by role ────────────────────────────
const DOCTOR_SPECIALTIES = [
  'Nadi Pariksha & Pulse Diagnosis',
  'Ayurvedic Skincare & Hair Care Expert',
  'Panchakarma & Chronic Pain Specialist',
  'General Ayurvedic Practitioner',
  'Rasayana & Anti-Aging Specialist',
  'Ayurvedic Gynaecology & Women Wellness',
  'Kaya Chikitsa (Internal Medicine)',
  'Bala Roga (Paediatric Ayurveda)',
  'Shalya Tantra (Ayurvedic Surgery)',
  'Shalakya Tantra (ENT & Eye Care)'
];

const THERAPIST_SPECIALTIES = [
  'Panchakarma & Detox Specialist',
  'Abhyanga & Oil Therapy Expert',
  'Yoga & Pranayama Therapist',
  'Nadi Pariksha & Diagnosis',
  'Kati Basti & Musculoskeletal Care',
  'Shirodhara & Stress Relief',
  'Netra Basti & Eye Care Specialist',
  "Women's Wellness & Fertility",
  'Udvartana & Weight Management',
  'Marma Chikitsa Therapist'
];

// ─── DOM-ready init ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, skip auth
  const saved = localStorage.getItem('vednidan_provider');
  if (saved) {
    try {
      ProviderApp.provider = JSON.parse(saved);
      ProviderApp.currentRole = ProviderApp.provider.role;
      document.getElementById('auth-fullscreen').style.display = 'none';
      document.getElementById('provider-workspace-view').style.display = 'flex';
      ProviderApp.showWorkspace();
    } catch (e) {
      localStorage.removeItem('vednidan_provider');
    }
    return;
  }

  initRoleTabs('login-role-tabs',  'login');
  initRoleTabs('signup-role-tabs', 'signup');
  initRoleTabs('forgot-role-tabs', 'forgot');
  populateSpecialtySelect('doctor');

  bindLoginForm();
  bindSignupForm();
  bindForgotEmailForm();
  bindForgotResetForm();
});

// ─── Switch between auth screens ─────────────────────────
window.switchScreen = (name) => {
  document.querySelectorAll('.auth-screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(`screen-${name}`);
  if (el) el.classList.add('active');

  // Reset forgot-password state when navigating
  if (name === 'forgot') {
    document.getElementById('forgot-step-email').style.display = 'block';
    document.getElementById('forgot-step-reset').style.display = 'none';
  }
};

// ─── Role Tab Setup ───────────────────────────────────────
function initRoleTabs(containerId, screenName) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.querySelectorAll('.role-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.role-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const role = btn.dataset.role;

      if (screenName === 'signup') {
        populateSpecialtySelect(role);
        const qualInput = document.getElementById('signup-qualification');
        const qualLabel = document.getElementById('signup-qualification-label');
        const therapiesGroup = document.getElementById('signup-therapies-group');
        const therapiesInput = document.getElementById('signup-therapies');

        if (role === 'doctor') {
          if (qualLabel) qualLabel.innerHTML = 'Qualifications / Degrees <span class="req">*</span>';
          if (qualInput) qualInput.placeholder = 'e.g. BAMS, MD (Ayurveda)';
          if (therapiesGroup) therapiesGroup.style.display = 'none';
          if (therapiesInput) therapiesInput.required = false;
        } else {
          if (qualLabel) qualLabel.innerHTML = 'Therapist Certification / Qualification <span class="req">*</span>';
          if (qualInput) qualInput.placeholder = 'e.g. Certified Panchakarma Vaidya, BAMS, Diploma';
          if (therapiesGroup) therapiesGroup.style.display = 'block';
          if (therapiesInput) therapiesInput.required = true;
        }
      }
      if (screenName === 'forgot') forgotRole = role;

      // Update login role icon
      if (screenName === 'login') {
        const icon = document.getElementById('login-role-icon');
        icon.innerHTML = role === 'doctor'
          ? '<i class="ri-stethoscope-line"></i>'
          : '<i class="ri-hand-heart-line"></i>';
      }
    });
  });
}

// ─── Populate specialty dropdown ──────────────────────────
function populateSpecialtySelect(role) {
  const sel = document.getElementById('signup-specialty');
  const label = document.getElementById('signup-specialty-label');
  if (!sel) return;

  const options = role === 'doctor' ? DOCTOR_SPECIALTIES : THERAPIST_SPECIALTIES;
  label.textContent = role === 'doctor' ? 'Medical Specialty' : 'Therapy Specialty';

  sel.innerHTML = '<option value="">-- Select your specialty --</option>';
  options.forEach(opt => {
    const o = document.createElement('option');
    o.value = opt;
    o.textContent = opt;
    sel.appendChild(o);
  });
}

// ─── Get active role from a tab group ────────────────────
function getActiveRole(containerId) {
  const active = document.querySelector(`#${containerId} .role-tab.active`);
  return active ? active.dataset.role : 'doctor';
}

// ─── PASSWORD VISIBILITY TOGGLE ──────────────────────────
window.togglePassword = (inputId, btn) => {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  btn.innerHTML = isHidden ? '<i class="ri-eye-line"></i>' : '<i class="ri-eye-off-line"></i>';
};

// ─── OTP char-input navigation ────────────────────────────
window.moveOtp = (input, nextId) => {
  input.value = input.value.replace(/\D/g, '');
  if (input.value.length === 1 && nextId) {
    const next = document.getElementById(nextId);
    if (next) next.focus();
  }
};

window.backOtp = (e, input, prevId) => {
  if (e.key === 'Backspace' && input.value === '' && prevId) {
    const prev = document.getElementById(prevId);
    if (prev) { prev.value = ''; prev.focus(); }
  }
};

function getOtpValue() {
  return ['otp-c1','otp-c2','otp-c3','otp-c4','otp-c5','otp-c6']
    .map(id => document.getElementById(id)?.value || '')
    .join('');
}

// ─── BUTTON LOADING STATE ────────────────────────────────
function setBtnLoading(btnId, loading, originalText = '') {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (loading) {
    btn.dataset.originalText = btn.querySelector('span')?.textContent || btn.textContent;
    btn.disabled = true;
    const span = btn.querySelector('span');
    if (span) span.textContent = 'Please wait...';
    else btn.textContent = 'Please wait...';
  } else {
    btn.disabled = false;
    const span = btn.querySelector('span');
    if (span) span.textContent = originalText || btn.dataset.originalText || 'Submit';
    else btn.textContent = originalText || 'Submit';
  }
}

// ─── SHOW AUTH TOAST ──────────────────────────────────────
function showAuthToast(message, type = 'success') {
  const wrapper = document.getElementById('toast-wrapper');
  if (!wrapper) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icons = { success: 'ri-checkbox-circle-line', error: 'ri-error-warning-line', warning: 'ri-alert-line' };
  t.innerHTML = `<i class="${icons[type] || icons.success}"></i> <span>${message}</span>`;
  wrapper.appendChild(t);
  setTimeout(() => { t.style.animation = 'fadeOut 0.3s forwards'; setTimeout(() => t.remove(), 300); }, 4500);
}

// ─────────────────────────────────────────────────────────
// LOGIN FORM
// ─────────────────────────────────────────────────────────
function bindLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const role     = getActiveRole('login-role-tabs');

    if (!email || !password) {
      showAuthToast('Please enter your email and password.', 'warning');
      return;
    }

    setBtnLoading('btn-login', true);

    try {
      const res = await fetch(`${API}/provider/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Login failed');

      localStorage.setItem('vednidan_provider', JSON.stringify(data.provider));
      showAuthToast(`Welcome back, ${data.provider.name}! 🎉`);

      setTimeout(() => {
        document.getElementById('auth-fullscreen').style.display = 'none';
        document.getElementById('provider-workspace-view').style.display = 'flex';
        ProviderApp.provider = data.provider;
        ProviderApp.currentRole = data.provider.role;
        ProviderApp.showWorkspace();
      }, 800);

    } catch (err) {
      showAuthToast(err.message || 'Authentication failed.', 'error');
    } finally {
      setBtnLoading('btn-login', false);
    }
  });
}

// ─────────────────────────────────────────────────────────
// SIGNUP FORM
// ─────────────────────────────────────────────────────────
function bindSignupForm() {
  const form = document.getElementById('signup-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name            = document.getElementById('signup-name').value.trim();
    const email           = document.getElementById('signup-email').value.trim();
    const phone           = document.getElementById('signup-phone').value.trim();
    const qualification   = document.getElementById('signup-qualification') ? document.getElementById('signup-qualification').value.trim() : '';
    const specialty       = document.getElementById('signup-specialty').value;
    const experience      = document.getElementById('signup-experience').value;
    const password        = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    const termsChecked    = document.getElementById('signup-terms').checked;
    const role            = getActiveRole('signup-role-tabs');
    const therapies       = role === 'therapist' && document.getElementById('signup-therapies') ? document.getElementById('signup-therapies').value.trim() : '';

    if (!name || !email || !password || !qualification) {
      showAuthToast('Please fill in all required fields (Name, Email, Qualification, Password).', 'warning'); return;
    }
    if (role === 'therapist' && !therapies) {
      showAuthToast('Please enter the therapies you offer (e.g. Abhyanga, Shirodhara).', 'warning'); return;
    }
    if (password.length < 6) {
      showAuthToast('Password must be at least 6 characters.', 'warning'); return;
    }
    if (password !== confirmPassword) {
      showAuthToast('Passwords do not match.', 'error'); return;
    }
    if (!termsChecked) {
      showAuthToast('Please accept the Terms of Service.', 'warning'); return;
    }

    setBtnLoading('btn-signup', true);

    try {
      const res = await fetch(`${API}/provider/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, qualification, specialty, experience, therapies, password, role })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Signup failed');

      showAuthToast('Account created! Please log in with your credentials. 🎉');
      form.reset();
      setTimeout(() => switchScreen('login'), 1500);

    } catch (err) {
      showAuthToast(err.message || 'Registration failed.', 'error');
    } finally {
      setBtnLoading('btn-signup', false);
    }
  });
}

// ─────────────────────────────────────────────────────────
// FORGOT PASSWORD — Step 1: Send OTP
// ─────────────────────────────────────────────────────────
function bindForgotEmailForm() {
  const form = document.getElementById('forgot-email-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value.trim();
    forgotRole  = getActiveRole('forgot-role-tabs');
    forgotEmail = email;

    if (!email) {
      showAuthToast('Please enter your registered email.', 'warning'); return;
    }

    setBtnLoading('btn-send-otp', true);

    try {
      const res = await fetch(`${API}/provider/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: forgotRole })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Could not send OTP');

      // Demo mode: show OTP on screen
      const notice = document.getElementById('otp-demo-notice');
      const demoOtpEl = document.getElementById('demo-otp-display');
      if (data.demoOtp && demoOtpEl) {
        demoOtpEl.textContent = `Demo OTP: ${data.demoOtp}`;
        notice.style.display = 'flex';
      }

      document.getElementById('forgot-step-email').style.display = 'none';
      document.getElementById('forgot-step-reset').style.display  = 'block';
      showAuthToast('OTP sent! Check your email (or see demo code above).');

    } catch (err) {
      showAuthToast(err.message || 'Failed to send OTP.', 'error');
    } finally {
      setBtnLoading('btn-send-otp', false);
    }
  });
}

// ─────────────────────────────────────────────────────────
// FORGOT PASSWORD — Step 2: Verify OTP + Set New Password
// ─────────────────────────────────────────────────────────
function bindForgotResetForm() {
  const form = document.getElementById('forgot-reset-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const otp         = getOtpValue();
    const newPassword = document.getElementById('reset-new-password').value;
    const confirmPwd  = document.getElementById('reset-confirm-password').value;

    if (otp.length < 6) {
      showAuthToast('Please enter the full 6-digit OTP.', 'warning'); return;
    }
    if (newPassword.length < 6) {
      showAuthToast('New password must be at least 6 characters.', 'warning'); return;
    }
    if (newPassword !== confirmPwd) {
      showAuthToast('New passwords do not match.', 'error'); return;
    }

    setBtnLoading('btn-reset-password', true);

    try {
      const res = await fetch(`${API}/provider/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp, newPassword, role: forgotRole })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Password reset failed');

      showAuthToast('Password reset successfully! Please log in. ✅');
      setTimeout(() => switchScreen('login'), 1500);

    } catch (err) {
      showAuthToast(err.message || 'Reset failed. Check OTP and try again.', 'error');
    } finally {
      setBtnLoading('btn-reset-password', false);
    }
  });
}

// ─────────────────────────────────────────────────────────
// RESEND OTP
// ─────────────────────────────────────────────────────────
window.resendOtp = async () => {
  if (!forgotEmail) return;
  try {
    const res = await fetch(`${API}/provider/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: forgotEmail, role: forgotRole })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    const demoOtpEl = document.getElementById('demo-otp-display');
    if (data.demoOtp && demoOtpEl) demoOtpEl.textContent = `Demo OTP: ${data.demoOtp}`;
    showAuthToast('A new OTP has been sent to your email.');
  } catch (err) {
    showAuthToast(err.message || 'Failed to resend OTP.', 'error');
  }
};
