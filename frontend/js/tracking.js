// Order & Consultation/Therapy Session Tracking Module

const Tracking = {
  currentTab: 'remedies', // 'remedies' or 'sessions'
  jitsiApiInstance: null,

  init() {
    this.setupListeners();
  },

  setupListeners() {
    const remediesTab = document.getElementById('track-remedies-tab');
    const sessionsTab = document.getElementById('track-sessions-tab');
    const inputField = document.getElementById('tracking-input-id');
    const searchBtn = document.getElementById('tracking-search-btn');

    const searchTitle = document.getElementById('track-search-title-label');
    const searchSubtitle = document.getElementById('track-search-subtitle-label');

    if (remediesTab && sessionsTab) {
      remediesTab.addEventListener('click', () => {
        this.currentTab = 'remedies';
        remediesTab.style.background = 'var(--primary)';
        remediesTab.style.color = 'white';
        remediesTab.style.borderColor = 'var(--primary)';
        sessionsTab.style.background = 'none';
        sessionsTab.style.color = 'var(--text-secondary)';
        sessionsTab.style.borderColor = 'var(--text-muted)';
        
        searchTitle.innerHTML = `<i class="ri-map-pin-line"></i> Track Your Order`;
        searchSubtitle.textContent = 'Enter your Order ID to check live status and shipping timeline.';
        inputField.placeholder = "Enter Order ID (e.g. 1780000000001)...";

        // Hide results cards
        document.getElementById('tracking-results-card').style.display = 'none';
        document.getElementById('tracking-session-results-card').style.display = 'none';
      });

      sessionsTab.addEventListener('click', () => {
        this.currentTab = 'sessions';
        sessionsTab.style.background = 'var(--primary)';
        sessionsTab.style.color = 'white';
        sessionsTab.style.borderColor = 'var(--primary)';
        remediesTab.style.background = 'none';
        remediesTab.style.color = 'var(--text-secondary)';
        remediesTab.style.borderColor = 'var(--text-muted)';

        searchTitle.innerHTML = `<i class="ri-calendar-todo-line"></i> Track Doctor / Therapy Session`;
        searchSubtitle.textContent = 'Enter your Booking ID (obtained after scheduling) to track consultation rooms or therapist home arrivals.';
        inputField.placeholder = "Enter Booking ID (e.g. 1780000000)...";

        document.getElementById('tracking-results-card').style.display = 'none';
        document.getElementById('tracking-session-results-card').style.display = 'none';
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.executeTracking());
    }

    if (inputField) {
      inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.executeTracking();
      });
    }
  },

  executeTracking() {
    if (this.currentTab === 'remedies') {
      this.trackOrder();
    } else {
      this.trackSession();
    }
  },

  // 1. TRACK PHYSICAL ORDERS
  async trackOrder() {
    const inputField = document.getElementById('tracking-input-id');
    const searchBtn = document.getElementById('tracking-search-btn');
    if (!inputField || !searchBtn) return;

    const orderIdStr = inputField.value.trim();
    if (!orderIdStr) {
      showToast('Please enter an Order ID.', 'warning');
      return;
    }

    searchBtn.disabled = true;
    searchBtn.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Tracking...`;

    try {
      const response = await fetch((window.API_BASE || '/api') + '/admin/orders');
      if (!response.ok) throw new Error('Failed to retrieve order listings');
      
      const ordersList = await response.json();
      const targetId = parseInt(orderIdStr);
      const order = ordersList.find(o => o.id === targetId);

      if (!order) {
        showToast('No order found with the provided ID.', 'error');
        document.getElementById('tracking-results-card').style.display = 'none';
        return;
      }

      // Populate remedy UI
      document.getElementById('track-order-id-label').textContent = order.id;
      document.getElementById('track-order-date').textContent = new Date(order.orderedAt).toLocaleDateString('en-IN');
      
      const badge = document.getElementById('track-status-badge');
      badge.textContent = order.status;
      badge.className = `badge badge-${order.status.toLowerCase()}`;

      document.getElementById('track-shipping-name').innerHTML = `<strong>Name:</strong> ${order.customerName}`;
      document.getElementById('track-shipping-address').innerHTML = `<strong>Address:</strong> ${order.shippingAddress}, ${order.shippingCity}, ${order.shippingState} - ${order.shippingZip}`;
      document.getElementById('track-shipping-phone').innerHTML = `<strong>Phone:</strong> ${order.shippingPhone}`;

      const listContainer = document.getElementById('track-order-items-list');
      listContainer.innerHTML = order.items.map(item => `
        <li style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:13px; color:var(--text-secondary);">
          <span>${item.name} <strong>(x${item.quantity})</strong></span>
          <span>₹${item.price * item.quantity}</span>
        </li>
      `).join('');

      document.getElementById('track-order-total-price').textContent = order.total;
      this.updateRemedyTimelineUI(order.status);

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

  updateRemedyTimelineUI(status) {
    const lineFill = document.getElementById('track-progress-fill-line');
    const stepPlaced = document.getElementById('step-track-placed');
    const stepShipped = document.getElementById('step-track-shipped');
    const stepDelivered = document.getElementById('step-track-delivered');

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
    }
  },

  // 2. TRACK DOCTOR/THERAPIST SESSIONS
  async trackSession() {
    const inputField = document.getElementById('tracking-input-id');
    const searchBtn = document.getElementById('tracking-search-btn');
    if (!inputField || !searchBtn) return;

    const bookingIdStr = inputField.value.trim();
    if (!bookingIdStr) {
      showToast('Please enter a Booking ID.', 'warning');
      return;
    }

    searchBtn.disabled = true;
    searchBtn.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Loading...`;

    try {
      const targetId = parseInt(bookingIdStr);
      let foundBooking = null;
      let sessionType = ''; // 'doctor' or 'therapist'

      // Check Doctor Bookings list
      const docRes = await fetch((window.API_BASE || '/api') + '/admin/bookings');
      if (docRes.ok) {
        const docList = await docRes.json();
        foundBooking = docList.find(b => b.id === targetId);
        if (foundBooking) sessionType = 'doctor';
      }

      // If not doctor, check Therapist Bookings
      if (!foundBooking) {
        const therRes = await fetch((window.API_BASE || '/api') + '/admin/therapist-bookings');
        if (therRes.ok) {
          const therList = await therRes.json();
          foundBooking = therList.find(t => t.id === targetId);
          if (foundBooking) sessionType = 'therapist';
        }
      }

      if (!foundBooking) {
        showToast('No active Doctor or Therapist booking found with this ID.', 'error');
        document.getElementById('tracking-session-results-card').style.display = 'none';
        return;
      }

      // Populate base variables
      document.getElementById('track-session-id-label').textContent = foundBooking.id;
      document.getElementById('track-session-date').textContent = `${foundBooking.date} at ${foundBooking.timeSlot}`;
      
      const badge = document.getElementById('track-session-status-badge');
      badge.textContent = foundBooking.status;
      badge.className = `badge status-badge ${foundBooking.status.toLowerCase().replace(' ', '')}`;

      const docPanel = document.getElementById('track-doctor-consult-panel');
      const therPanel = document.getElementById('track-therapist-visit-panel');

      if (sessionType === 'doctor') {
        docPanel.style.display = 'block';
        therPanel.style.display = 'none';
        this.renderDoctorTracker(foundBooking);
      } else {
        docPanel.style.display = 'none';
        therPanel.style.display = 'block';
        this.renderTherapistTracker(foundBooking);
      }

      document.getElementById('tracking-session-results-card').style.display = 'block';
      showToast('Booking details retrieved!', 'success');

    } catch (err) {
      console.error(err);
      showToast('Error retrieving session booking details.', 'error');
    } finally {
      searchBtn.disabled = false;
      searchBtn.innerHTML = 'Track Status';
    }
  },

  renderDoctorTracker(booking) {
    document.getElementById('track-doc-name-label').textContent = booking.doctorName || 'Ayurvedic Consultant';

    const joinBtn = document.getElementById('btn-patient-join-call');
    const waitMsg = document.getElementById('patient-call-wait-message');
    const prescBox = document.getElementById('patient-prescription-box');
    const prescContent = document.getElementById('patient-prescription-content');

    // Reset Jitsi listener
    joinBtn.onclick = null;

    if (booking.status === 'In-Call') {
      joinBtn.disabled = false;
      joinBtn.style.animation = 'pulse-gold 2.5s infinite';
      waitMsg.innerHTML = `<span style="color:var(--success); font-weight:700;"><span class="pulse-dot" style="background-color:var(--success);"></span> Call is Active! Click the button above to join Jitsi consultation.</span>`;
      
      joinBtn.onclick = () => {
        this.launchPatientJitsiCall(booking);
      };
    } else if (booking.status === 'Completed') {
      joinBtn.disabled = true;
      joinBtn.style.animation = 'none';
      waitMsg.innerHTML = `<span style="color:var(--text-muted);"><i class="ri-checkbox-circle-line"></i> Session Completed successfully.</span>`;
      
      // Load Prescription
      if (booking.prescription) {
        prescBox.style.display = 'block';
        prescContent.innerHTML = booking.prescription.replace(/\n/g, '<br>');
      } else {
        prescBox.style.display = 'none';
      }
    } else {
      joinBtn.disabled = true;
      joinBtn.style.animation = 'none';
      waitMsg.innerHTML = `<span><i class="ri-time-line"></i> Waiting for doctor to initiate room call. Please refresh page/status.</span>`;
      prescBox.style.display = 'none';
    }
  },

  launchPatientJitsiCall(booking) {
    // Generate overlay iframe for Jitsi call dynamically
    let modal = document.getElementById('jitsi-patient-overlay');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'jitsi-patient-overlay';
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100vw';
      modal.style.height = '100vh';
      modal.style.zIndex = '9999';
      modal.style.backgroundColor = 'rgba(0,0,0,0.85)';
      modal.style.display = 'flex';
      modal.style.flexDirection = 'column';
      
      modal.innerHTML = `
        <div style="background-color: var(--primary-dark); color: white; display: flex; justify-content: space-between; align-items: center; padding: 15px 25px;">
          <h4 style="font-family: var(--font-heading); margin: 0;"><i class="ri-video-chat-line"></i> VedNidan Live Consultation Room</h4>
          <button id="close-patient-jitsi-call" style="background: none; border: 1px solid rgba(255,255,255,0.2); color: white; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight:700;">Disconnect</button>
        </div>
        <div id="patient-jitsi-iframe-container" style="flex-grow: 1; width: 100%;"></div>
      `;
      document.body.appendChild(modal);
    }

    modal.style.display = 'flex';

    const closeBtn = document.getElementById('close-patient-jitsi-call');
    closeBtn.onclick = () => {
      if (this.jitsiApiInstance) {
        this.jitsiApiInstance.dispose();
        this.jitsiApiInstance = null;
      }
      modal.style.display = 'none';
      document.getElementById('patient-jitsi-iframe-container').innerHTML = '';
      this.executeTracking(); // refresh status
    };

    const roomName = `VedNidan_Consultation_${booking.id}`;
    
    try {
      const domain = 'meet.jit.si';
      const options = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: document.getElementById('patient-jitsi-iframe-container'),
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 
            'fullscreen', 'fodeviceselection', 'hangup', 'profile', 
            'chat', 'settings', 'raisehand', 'videoquality', 'tileview'
          ]
        }
      };
      
      this.jitsiApiInstance = new JitsiMeetExternalAPI(domain, options);
      
      this.jitsiApiInstance.addEventListener('readyToClose', () => {
        closeBtn.click();
      });

    } catch (e) {
      console.error(e);
      document.getElementById('patient-jitsi-iframe-container').innerHTML = `
        <div style="padding:40px; text-align:center; color:white;">
          <p>Unable to embed Jitsi Meet. Click link to open in new tab:</p>
          <a href="https://meet.jit.si/${roomName}" target="_blank" style="color:var(--secondary); font-weight:700;">Open Consultation Room</a>
        </div>
      `;
    }
  },

  renderTherapistTracker(booking) {
    document.getElementById('track-therapist-name-label').innerHTML = `<strong>Therapist:</strong> ${booking.therapistName}`;
    document.getElementById('track-therapy-type-label').innerHTML = `<strong>Therapy Type:</strong> ${booking.therapyType}`;
    document.getElementById('track-visit-address-label').innerHTML = `<strong>Home Visit Address:</strong> ${booking.address || 'Address details missing.'}`;
    document.getElementById('track-session-otp-code').textContent = booking.otpCode || booking.otp_code || 'N/A';

    const desc = document.getElementById('track-session-status-desc');
    const fbackBox = document.getElementById('track-session-feedback-box');

    // Update steps timeline
    const lineFill = document.getElementById('track-session-progress-fill-line');
    const stepPending = document.getElementById('step-session-pending');
    const stepEnRoute = document.getElementById('step-session-enroute');
    const stepArrived = document.getElementById('step-session-arrived');
    const stepProgress = document.getElementById('step-session-inprogress');
    const stepCompleted = document.getElementById('step-session-completed');

    // Reset steps
    [stepPending, stepEnRoute, stepArrived, stepProgress, stepCompleted].forEach(s => s.classList.remove('active'));

    const status = booking.status || 'Pending';

    if (status === 'Pending') {
      lineFill.style.width = '0%';
      stepPending.classList.add('active');
      desc.textContent = "Your booking is approved. The therapist will depart soon from our clinic.";
      fbackBox.style.display = 'none';
    } 
    else if (status === 'En Route') {
      lineFill.style.width = '25%';
      stepPending.classList.add('active');
      stepEnRoute.classList.add('active');
      desc.innerHTML = `🏍️ <strong>Therapist is En Route!</strong> Your practitioner has departed and is traveling to your home. Please prepare your room.`;
      fbackBox.style.display = 'none';
    } 
    else if (status === 'Arrived') {
      lineFill.style.width = '50%';
      stepPending.classList.add('active');
      stepEnRoute.classList.add('active');
      stepArrived.classList.add('active');
      desc.innerHTML = `🏡 <strong>Therapist has Arrived!</strong> Please share your 4-digit OTP Code: <strong>${booking.otpCode || booking.otp_code}</strong> to verify and begin the treatment.`;
      fbackBox.style.display = 'none';
    } 
    else if (status === 'In Progress') {
      lineFill.style.width = '75%';
      stepPending.classList.add('active');
      stepEnRoute.classList.add('active');
      stepArrived.classList.add('active');
      stepProgress.classList.add('active');
      desc.innerHTML = `💆 <strong>Therapy treatment is in progress!</strong> Relax and experience holistic Ayurvedic healing.`;
      fbackBox.style.display = 'none';
    } 
    else if (status === 'Completed') {
      lineFill.style.width = '100%';
      stepPending.classList.add('active');
      stepEnRoute.classList.add('active');
      stepArrived.classList.add('active');
      stepProgress.classList.add('active');
      stepCompleted.classList.add('active');
      desc.innerHTML = `✅ <strong>Session Completed!</strong> Hope you had a restoring session. Therapist report details are shown below.`;
      
      // Load feedback
      fbackBox.style.display = 'block';
      document.getElementById('track-session-feedback-notes').textContent = booking.feedback || 'None provided.';
      document.getElementById('track-session-rating-val').textContent = `Health Index Score: ${'★'.repeat(booking.rating || 5)}`;

      // Stop any live refresh when completed
      this.stopLiveRefresh();
      return;
    }

    // Start live auto-refresh so patient sees therapist status updates in real-time
    this.startLiveRefresh(booking.id);
  },

  // ── Live Polling for Therapist Tracker ──────────────────────────
  _liveRefreshInterval: null,
  _lastTrackedBookingId: null,

  startLiveRefresh(bookingId) {
    // Don't start duplicate intervals
    if (this._lastTrackedBookingId === bookingId && this._liveRefreshInterval) return;

    this.stopLiveRefresh();
    this._lastTrackedBookingId = bookingId;

    // Show live indicator
    const badge = document.getElementById('track-session-status-badge');
    if (badge) {
      const liveTag = document.createElement('span');
      liveTag.id = 'live-refresh-tag';
      liveTag.style.cssText = 'font-size:10px;background:#22c55e;color:white;padding:2px 6px;border-radius:20px;margin-left:8px;font-weight:700;';
      liveTag.innerHTML = '● LIVE';
      if (!document.getElementById('live-refresh-tag')) {
        badge.parentNode.appendChild(liveTag);
      }
    }

    this._liveRefreshInterval = setInterval(async () => {
      try {
        const therRes = await fetch((window.API_BASE || '/api') + '/admin/therapist-bookings');
        if (!therRes.ok) return;
        const therList = await therRes.json();
        const updated = therList.find(t => t.id === bookingId);
        if (!updated) return;

        // Update status badge
        const badge = document.getElementById('track-session-status-badge');
        if (badge) {
          badge.textContent = updated.status;
          badge.className = `badge status-badge ${(updated.status || '').toLowerCase().replace(' ', '')}`;
        }

        // Re-render tracker with updated booking data
        this.renderTherapistTracker(updated);
      } catch (err) {
        console.warn('[Tracking] Live refresh error:', err);
      }
    }, 15000); // refresh every 15 seconds
  },

  stopLiveRefresh() {
    if (this._liveRefreshInterval) {
      clearInterval(this._liveRefreshInterval);
      this._liveRefreshInterval = null;
    }
    const liveTag = document.getElementById('live-refresh-tag');
    if (liveTag) liveTag.remove();
  }
};

