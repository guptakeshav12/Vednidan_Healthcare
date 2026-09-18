// Practitioner & Therapist Portal Client Application Engine

document.addEventListener('DOMContentLoaded', () => {
  ProviderApp.init();
});

const ProviderApp = {
  currentRole: 'doctor', // 'doctor' or 'therapist'
  provider: null, // Logged in practitioner profile
  bookings: [], // Assigned bookings list
  activeBooking: null, // Selected active booking details
  jitsiApi: null, // Jitsi Meet API reference instance
  sessionInterval: null, // Timer interval for therapy session
  sessionSeconds: 0, // Elapsed seconds
  selectedRating: 5, // Therapist feedback score rating

  init() {
    // Auth flow is now handled by provider-auth.js
    // Only call showWorkspace if already authenticated (done in provider-auth.js)
  },

  checkLoginState() {
    const saved = localStorage.getItem('vednidan_provider');
    if (saved) {
      this.provider = JSON.parse(saved);
      this.currentRole = this.provider.role;
      this.showWorkspace();
    }
  },

  showLogin() {
    document.getElementById('provider-login-view').style.display = 'flex';
    document.getElementById('provider-workspace-view').style.display = 'none';
    this.resetState();
  },

  showWorkspace() {
    document.getElementById('auth-fullscreen').style.display = 'none';
    document.getElementById('provider-workspace-view').style.display = 'flex';

    // Set Profile sidebar details
    document.getElementById('profile-name').textContent = this.provider.name;
    document.getElementById('profile-specialty').textContent = this.provider.specialty || '';
    document.getElementById('profile-rating-label').textContent = this.provider.rating || '4.9';

    const roleIcon = document.getElementById('profile-role-icon');
    if (this.currentRole === 'doctor') {
      roleIcon.className = 'ri-nurse-line';
      document.getElementById('view-doctor-home').style.display = 'block';
      document.getElementById('view-therapist-home').style.display = 'none';
      this.loadProductSelectOptions();
    } else {
      roleIcon.className = 'ri-hand-heart-line';
      document.getElementById('view-doctor-home').style.display = 'none';
      document.getElementById('view-therapist-home').style.display = 'block';
      this.setupTherapistRatingStars();
    }

    // Populate profile detail panel
    this.populateProfileView();

    this.setupWorkspaceListeners();
    this.loadBookings();
  },

  populateProfileView() {
    if (!this.provider) return;
    const p = this.provider;
    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '—'; };
    setEl('pdetail-name', p.name);
    setEl('pdetail-email', p.email || '');
    setEl('pdetail-specialty', p.specialty || '');
    setEl('pdetail-experience', p.experience || '');
    setEl('pdetail-phone', p.phone || '');
    setEl('pdetail-rating', `${p.rating || 4.9} ★`);
    setEl('pdetail-joined', p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : 'N/A');

    const roleBadge = document.getElementById('pdetail-role-badge');
    const roleIcon  = document.getElementById('profile-detail-icon');
    if (roleBadge) roleBadge.textContent = p.role === 'doctor' ? '👨‍⚕️ Doctor' : '🧘 Therapist';
    if (roleIcon) roleIcon.className = p.role === 'doctor' ? 'ri-nurse-line' : 'ri-hand-heart-line';
  },

  setupWorkspaceListeners() {
    // Logout button
    document.getElementById('btn-logout-partner').addEventListener('click', () => {
      localStorage.removeItem('vednidan_provider');
      location.reload(); // Full reload brings back auth screen
    });

    // Menu Navigation Tabs
    const homeTab    = document.getElementById('menu-home');
    const historyTab = document.getElementById('menu-history');
    const profileTab = document.getElementById('menu-profile');

    const hideAllViews = () => {
      ['view-doctor-home','view-therapist-home','view-history','view-profile'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
      [homeTab, historyTab, profileTab].forEach(t => t && t.classList.remove('active'));
    };

    homeTab && homeTab.addEventListener('click', (e) => {
      e.preventDefault();
      hideAllViews();
      homeTab.classList.add('active');
      if (this.currentRole === 'doctor') {
        document.getElementById('view-doctor-home').style.display = 'block';
      } else {
        document.getElementById('view-therapist-home').style.display = 'block';
      }
    });

    historyTab && historyTab.addEventListener('click', (e) => {
      e.preventDefault();
      hideAllViews();
      historyTab.classList.add('active');
      document.getElementById('view-history').style.display = 'block';
      this.loadHistoryView();
    });

    profileTab && profileTab.addEventListener('click', (e) => {
      e.preventDefault();
      hideAllViews();
      profileTab.classList.add('active');
      document.getElementById('view-profile').style.display = 'block';
    });

    // --- Doctor Workspace Action Listeners ---
    const endCallBtn = document.getElementById('btn-end-consultation');
    if (endCallBtn) {
      endCallBtn.addEventListener('click', () => {
        this.disconnectJitsiRoom();
      });
    }

    const prescriptionForm = document.getElementById('prescription-form');
    if (prescriptionForm) {
      prescriptionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitPrescription();
      });
    }

    // --- Therapist Workspace Ride-Share Action Listeners ---
    const startJourneyBtn = document.getElementById('btn-start-journey');
    if (startJourneyBtn) {
      startJourneyBtn.addEventListener('click', () => this.updateTherapistSessionStatus('En Route'));
    }

    const markArrivedBtn = document.getElementById('btn-mark-arrived');
    if (markArrivedBtn) {
      markArrivedBtn.addEventListener('click', () => this.updateTherapistSessionStatus('Arrived'));
    }

    const verifyOtpBtn = document.getElementById('btn-verify-otp');
    if (verifyOtpBtn) {
      verifyOtpBtn.addEventListener('click', () => {
        const val = document.getElementById('dispatch-otp-input').value.trim();
        if (val.length !== 4) {
          this.showToast('Please enter a valid 4-digit OTP.', 'warning');
          return;
        }
        this.updateTherapistSessionStatus('In Progress', val);
      });
    }

    const startTreatmentBtn = document.getElementById('btn-start-treatment');
    if (startTreatmentBtn) {
      startTreatmentBtn.addEventListener('click', () => {
        startTreatmentBtn.style.display = 'none';
        document.getElementById('btn-complete-treatment').style.display = 'inline-block';
        this.startSessionTimer();
      });
    }

    const completeTreatmentBtn = document.getElementById('btn-complete-treatment');
    if (completeTreatmentBtn) {
      completeTreatmentBtn.addEventListener('click', () => {
        this.stopSessionTimer();
        // Shift control screen to Feedback Form
        document.getElementById('control-step-active').style.display = 'none';
        document.getElementById('control-step-feedback').style.display = 'block';
      });
    }

    const therapistFeedbackForm = document.getElementById('therapist-feedback-form');
    if (therapistFeedbackForm) {
      therapistFeedbackForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fback = document.getElementById('dispatch-feedback').value.trim();
        this.updateTherapistSessionStatus('Completed', null, fback, this.selectedRating);
      });
    }

    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) {
      changePasswordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitPasswordChange();
      });
    }
  },

  async submitPasswordChange() {
    const currentPassword = document.getElementById('cp-current').value;
    const newPassword = document.getElementById('cp-new').value;
    const confirmPassword = document.getElementById('cp-confirm').value;

    if (!currentPassword || !newPassword || !confirmPassword) {
      this.showToast('All fields are required.', 'warning');
      return;
    }
    if (newPassword.length < 6) {
      this.showToast('New password must be at least 6 characters.', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      this.showToast('New passwords do not match.', 'error');
      return;
    }

    try {
      const response = await fetch(`${window.API_BASE || '/api'}/provider/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.provider.email,
          role: this.currentRole,
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Password update failed');

      this.showToast('Password updated successfully!', 'success');
      document.getElementById('change-password-form').reset();

    } catch (err) {
      console.error(err);
      this.showToast(err.message || 'Error updating password.', 'error');
    }
  },

  async loadBookings() {
    if (!this.provider) return;

    try {
      const response = await fetch(`${window.API_BASE || '/api'}/provider/bookings?providerId=${this.provider.id}&role=${this.currentRole}`);
      if (!response.ok) throw new Error('Could not pull listings');
      this.bookings = await response.json();

      if (this.currentRole === 'doctor') {
        this.renderDoctorBookings();
      } else {
        this.renderTherapistBookings();
      }
    } catch (err) {
      console.error(err);
      this.showToast('Failed to fetch bookings list.', 'error');
    }
  },

  renderDoctorBookings() {
    const list = document.getElementById('doctor-slots-container');
    if (!list) return;

    const filtered = this.bookings.filter(b => b.status !== 'Completed');

    if (filtered.length === 0) {
      list.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-muted); font-size:13px;">No consultation bookings found for today.</div>`;
      return;
    }

    list.innerHTML = filtered.map(b => {
      const activeClass = this.activeBooking && this.activeBooking.id === b.id ? 'active' : '';
      return `
        <div class="slot-row ${activeClass}" onclick="ProviderApp.selectDoctorBooking(${b.id})">
          <div class="slot-info">
            <h5>${b.patientName}</h5>
            <p><i class="ri-calendar-line"></i> ${b.date} | ${b.timeSlot}</p>
            <span class="status-badge ${b.status.toLowerCase()}">${b.status}</span>
          </div>
          <div class="slot-meta">
            <span class="time-badge">Consultation</span>
          </div>
        </div>
      `;
    }).join('');
  },

  renderTherapistBookings() {
    const list = document.getElementById('therapist-slots-container');
    if (!list) return;

    const filtered = this.bookings.filter(b => b.status !== 'Completed');

    if (filtered.length === 0) {
      list.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-muted); font-size:13px;">No home-visit bookings found for today.</div>`;
      return;
    }

    list.innerHTML = filtered.map(b => {
      const activeClass = this.activeBooking && this.activeBooking.id === b.id ? 'active' : '';
      return `
        <div class="slot-row ${activeClass}" onclick="ProviderApp.selectTherapistBooking(${b.id})">
          <div class="slot-info">
            <h5>${b.patientName}</h5>
            <p><i class="ri-map-pin-line"></i> ${b.date} | ${b.timeSlot}</p>
            <span class="status-badge ${b.status.toLowerCase()}">${b.status}</span>
          </div>
          <div class="slot-meta">
            <span class="time-badge" style="background-color: var(--secondary); color: var(--primary-dark); font-weight:800;">Home Visit</span>
          </div>
        </div>
      `;
    }).join('');
  },

  selectDoctorBooking(id) {
    const booking = this.bookings.find(b => b.id === id);
    if (!booking) return;

    this.activeBooking = booking;
    this.renderDoctorBookings(); // update active UI highlights

    document.getElementById('consultation-empty-state').style.display = 'none';
    document.getElementById('consultation-active-state').style.display = 'block';

    document.getElementById('active-call-patient-name').textContent = `Patient: ${booking.patientName}`;
    
    // Clear Jitsi room & prescription forms
    document.getElementById('jitsi-iframe-container').innerHTML = '';
    document.getElementById('presc-diagnosis').value = '';
    document.getElementById('presc-dosage').value = '';
    document.getElementById('presc-product-select').value = '';

    // If session is already active or in-call, reload room
    this.connectJitsiRoom(booking);
  },

  selectTherapistBooking(id) {
    const booking = this.bookings.find(b => b.id === id);
    if (!booking) return;

    this.activeBooking = booking;
    this.renderTherapistBookings();

    document.getElementById('dispatch-empty-state').style.display = 'none';
    document.getElementById('dispatch-active-state').style.display = 'block';

    document.getElementById('dispatch-patient-name').textContent = booking.patientName;
    document.getElementById('dispatch-therapy-type-label').textContent = `Therapy: ${booking.therapyType}`;
    document.getElementById('dispatch-address-text').textContent = booking.address || 'Address details missing.';

    // NOTE: OTP is NOT shown to the therapist for security.
    // The patient sees the OTP on their booking/tracking page and shares it verbally at arrival.

    this.updateDispatcherWorkflowUI(booking.status);
  },

  // --- JITSI MEET VIDEO CONSULTATION ENGINE ---
  connectJitsiRoom(booking) {
    const container = document.getElementById('jitsi-iframe-container');
    container.innerHTML = ''; // Reset frame

    // Pre-emptively send status update to database
    if (booking.status !== 'In-Call') {
      this.updateDoctorSessionStatus('In-Call');
    }

    const roomName = `VedNidan_Consultation_${booking.id}`;
    
    // Initialize Jitsi Meet Iframe Call
    try {
      const domain = 'meet.jit.si';
      const options = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: container,
        userInfo: {
          displayName: this.provider.name
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 
            'fullscreen', 'fodeviceselection', 'hangup', 'profile', 
            'chat', 'settings', 'raisehand', 'videoquality', 'tileview'
          ]
        }
      };
      
      this.jitsiApi = new JitsiMeetExternalAPI(domain, options);

      // Handle hangup trigger
      this.jitsiApi.addEventListener('readyToClose', () => {
        this.disconnectJitsiRoom();
      });

    } catch (e) {
      console.error('Error opening Jitsi Meet Room:', e);
      container.innerHTML = `
        <div style="padding:40px; text-align:center; color: var(--danger); font-weight:700;">
          <i class="ri-alert-line" style="font-size:32px;"></i>
          <p>Failed to embed secure Video API. Please direct copy Jitsi Link below:</p>
          <a href="https://meet.jit.si/${roomName}" target="_blank" class="btn-primary" style="display:inline-block; margin-top:10px;">Open in Jitsi Window</a>
        </div>
      `;
    }
  },

  disconnectJitsiRoom() {
    if (this.jitsiApi) {
      this.jitsiApi.dispose();
      this.jitsiApi = null;
    }
    document.getElementById('jitsi-iframe-container').innerHTML = `
      <div style="padding:60px 20px; text-align:center; color: var(--text-muted); font-size:14px;">
        <i class="ri-phone-dismiss-line" style="font-size:48px; color: var(--danger); margin-bottom:12px;"></i>
        <h4>Call Terminated</h4>
        <p>Please enter the patient's diagnostic notes below to close out the booking ticket.</p>
      </div>
    `;
    this.updateDoctorSessionStatus('Scheduled');
  },

  async updateDoctorSessionStatus(status) {
    if (!this.activeBooking) return;

    try {
      const response = await fetch(`${window.API_BASE || '/api'}/provider/doctor/booking/${this.activeBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!response.ok) throw new Error('Status save failed');
      const data = await response.json();

      // Update active booking locally
      this.activeBooking.status = status;
      this.loadBookings(); // refresh sidebar list

    } catch (e) {
      console.error(e);
      this.showToast('Could not sync call session status with server.', 'error');
    }
  },

  async submitPrescription() {
    if (!this.activeBooking) return;

    const diagnosis = document.getElementById('presc-diagnosis').value.trim();
    const dosage = document.getElementById('presc-dosage').value.trim();
    const prodSelect = document.getElementById('presc-product-select');
    const prodName = prodSelect.options[prodSelect.selectedIndex].text;

    let fullPrescription = `**Diagnosis:** ${diagnosis}\n`;
    if (prodSelect.value) {
      fullPrescription += `**Recommended Herb:** ${prodName}\n`;
    }
    if (dosage) {
      fullPrescription += `**Instructions:** ${dosage}`;
    }

    try {
      const response = await fetch(`${window.API_BASE || '/api'}/provider/doctor/booking/${this.activeBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'Completed',
          prescription: fullPrescription
        })
      });

      if (!response.ok) throw new Error('Prescription upload failed');

      this.showToast('Diagnostic invoice and prescription saved successfully!', 'success');
      this.activeBooking = null;
      document.getElementById('consultation-active-state').style.display = 'none';
      document.getElementById('consultation-empty-state').style.display = 'flex';
      this.loadBookings();

    } catch (err) {
      console.error(err);
      this.showToast(err.message || 'Failed to save diagnostic details.', 'error');
    }
  },

  // --- THERAPIST DISPATCH TIMELINE WORKFLOW (RAPIDO STYLE) ---
  updateDispatcherWorkflowUI(status) {
    const routeLine = document.getElementById('route-progress-line');
    const marker = document.getElementById('dispatcher-marker');
    const etaText = document.getElementById('dispatch-eta-text');

    // Controls step display panels
    const stepStart = document.getElementById('control-step-start');
    const stepArrived = document.getElementById('control-step-arrived');
    const stepOtp = document.getElementById('control-step-otp');
    const stepActive = document.getElementById('control-step-active');
    const stepFeedback = document.getElementById('control-step-feedback');

    // Hide all step controls first
    stepStart.style.display = 'none';
    stepArrived.style.display = 'none';
    stepOtp.style.display = 'none';
    stepActive.style.display = 'none';
    stepFeedback.style.display = 'none';

    // Status Badge UI
    const badge = document.getElementById('dispatch-status-badge');
    badge.className = `status-indicator-badge ${status.toLowerCase().replace(' ', '')}`;
    badge.textContent = status;

    if (status === 'Pending') {
      stepStart.style.display = 'block';
      routeLine.style.strokeDashoffset = '400'; // 0% progress
      marker.setAttribute('transform', 'translate(30, 90)');
      etaText.textContent = 'Distance: 4.8 km | ETA: 12 mins';
    } 
    else if (status === 'En Route') {
      stepArrived.style.display = 'block';
      routeLine.style.strokeDashoffset = '200'; // 50% progress
      marker.setAttribute('transform', 'translate(190, 90)');
      etaText.textContent = 'En Route: Navigating to Patient home... | ETA: 6 mins';
      this.showToast('Routing timeline loaded. Ride started!');
    } 
    else if (status === 'Arrived') {
      stepOtp.style.display = 'block';
      routeLine.style.strokeDashoffset = '0'; // 100% progress
      marker.setAttribute('transform', 'translate(340, 90)');
      etaText.textContent = 'Arrived at Destination!';
      this.showToast('You have arrived! Collect the OTP from the patient.');
    } 
    else if (status === 'In Progress') {
      stepActive.style.display = 'block';
      routeLine.style.strokeDashoffset = '0';
      marker.setAttribute('transform', 'translate(340, 90)');
      etaText.textContent = 'Therapy Session in Progress...';
    }
  },

  async updateTherapistSessionStatus(status, otpCode = null, feedback = null, rating = null) {
    if (!this.activeBooking) return;

    try {
      const body = { status };
      if (otpCode) body.otpCode = otpCode;
      if (feedback) body.feedback = feedback;
      if (rating) body.rating = rating;

      const response = await fetch(`${window.API_BASE || '/api'}/provider/therapist/booking/${this.activeBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Status sync failure');

      this.activeBooking.status = status;
      this.loadBookings();

      if (status === 'Completed') {
        this.showToast('Therapy visit completed! Session details synced to Admin.', 'success');
        this.activeBooking = null;
        document.getElementById('dispatch-active-state').style.display = 'none';
        document.getElementById('dispatch-empty-state').style.display = 'flex';
      } else {
        this.updateDispatcherWorkflowUI(status);
      }

    } catch (err) {
      console.error(err);
      this.showToast(err.message || 'Step update failed.', 'error');
      
      // If OTP check fails, flag error text
      if (status === 'In Progress') {
        const errorLabel = document.getElementById('otp-error-msg');
        if (errorLabel) errorLabel.style.display = 'block';
      }
    }
  },

  startSessionTimer() {
    this.sessionSeconds = 0;
    const clock = document.getElementById('session-timer-clock');
    
    this.sessionInterval = setInterval(() => {
      this.sessionSeconds++;
      const hrs = String(Math.floor(this.sessionSeconds / 3600)).padStart(2, '0');
      const mins = String(Math.floor((this.sessionSeconds % 3600) / 60)).padStart(2, '0');
      const secs = String(this.sessionSeconds % 60).padStart(2, '0');
      
      clock.textContent = `${hrs}:${mins}:${secs}`;
    }, 1000);
  },

  stopSessionTimer() {
    if (this.sessionInterval) {
      clearInterval(this.sessionInterval);
      this.sessionInterval = null;
    }
  },

  // --- RATINGS HANDLER ---
  setupTherapistRatingStars() {
    const starRow = document.getElementById('feedback-stars-row');
    if (!starRow) return;

    this.selectedRating = 5; // Default reset
    const stars = starRow.querySelectorAll('.star-btn');
    
    // Highlight all stars up to 5 by default
    stars.forEach(s => s.className = 'ri-star-fill star-btn active');

    stars.forEach(star => {
      star.addEventListener('click', (e) => {
        const val = parseInt(e.target.dataset.val);
        this.selectedRating = val;
        
        stars.forEach(s => {
          const sVal = parseInt(s.dataset.val);
          if (sVal <= val) {
            s.className = 'ri-star-fill star-btn active';
          } else {
            s.className = 'ri-star-line star-btn';
          }
        });
      });
    });
  },

  // --- HISTORICAL SESSIONS ARCHIVE VIEW ---
  async loadHistoryView() {
    const tbody = document.getElementById('history-table-body');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;"><i class="ri-loader-4-line ri-spin"></i> Loading archives...</td></tr>`;

    try {
      const response = await fetch(`${window.API_BASE || '/api'}/provider/bookings?providerId=${this.provider.id}&role=${this.currentRole}`);
      if (!response.ok) throw new Error('Data retrieve failed');
      const all = await response.json();

      const completed = all.filter(b => b.status === 'Completed');

      if (completed.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-secondary);">No completed sessions or visits archived yet.</td></tr>`;
        return;
      }

      tbody.innerHTML = completed.map(b => {
        let details = '';
        if (this.currentRole === 'doctor') {
          details = b.prescription ? b.prescription.replace(/\n/g, '<br>') : 'Consultation notes missing.';
        } else {
          details = `<strong>Type:</strong> ${b.therapyType}<br><strong>Feedback:</strong> ${b.feedback || 'None'}<br><strong>Rating score:</strong> ${'★'.repeat(b.rating || 5)}`;
        }

        return `
          <tr>
            <td>#${b.id}</td>
            <td><strong>${b.patientName}</strong><br><span style="font-size:11px; color:var(--text-muted);">${b.patientEmail}</span></td>
            <td>${b.date}<br>${b.timeSlot}</td>
            <td><div style="font-size:12px; max-width:400px; color:var(--text-secondary);">${details}</div></td>
          </tr>
        `;
      }).join('');

    } catch (e) {
      console.error(e);
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--danger);">Error loading archives.</td></tr>`;
    }
  },

  async loadProductSelectOptions() {
    const select = document.getElementById('presc-product-select');
    if (!select) return;

    try {
      const response = await fetch(`${window.API_BASE || '/api'}/products?limit=100`);
      if (!response.ok) throw new Error('Product catalog pull failed');
      const data = await response.json();

      // Keep it unique and reset
      select.innerHTML = '<option value="">-- Choose Remedy from Catalog --</option>';
      data.products.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.name} (₹${p.price})`;
        select.appendChild(opt);
      });
    } catch (e) {
      console.error('Error populating prescription pad select:', e);
    }
  },

  // Toast alert launcher
  showToast(message, type = 'success') {
    const wrapper = document.getElementById('toast-wrapper');
    if (!wrapper) return;

    const t = document.createElement('div');
    t.className = `toast ${type}`;
    
    let icon = 'ri-checkbox-circle-line';
    if (type === 'error') icon = 'ri-error-warning-line';
    if (type === 'warning') icon = 'ri-alert-line';

    t.innerHTML = `<i class="${icon}"></i> <span>${message}</span>`;
    wrapper.appendChild(t);

    setTimeout(() => {
      t.style.animation = 'fadeOut 0.3s forwards';
      setTimeout(() => t.remove(), 300);
    }, 4000);
  },

  resetState() {
    this.provider = null;
    this.bookings = [];
    this.activeBooking = null;
    this.disconnectJitsiRoom();
    this.stopSessionTimer();
  }
};
