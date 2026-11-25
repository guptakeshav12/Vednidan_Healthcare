// Therapist Session Booking Handler — VedNidan Healthcare

const TherapistBooking = {
  selectedTherapistId: null,
  selectedDateString: null,
  selectedTimeSlot: null,
  selectedTherapyType: null,

  therapists: [
    { id: 201, name: "Vaidya Pradeep Sharma",  specialty: "Panchakarma & Detox Specialist",    rating: 4.9, experience: "25 yrs exp", therapies: ["Panchakarma", "Vamana", "Virechana", "Basti"],           avatar: "/assets/doctor_avatar.png" },
    { id: 202, name: "Vaidya Meera Kulkarni",   specialty: "Abhyanga & Oil Therapy Expert",     rating: 4.8, experience: "18 yrs exp", therapies: ["Abhyanga", "Shirodhara", "Pizhichil", "Elakizhi"],       avatar: "/assets/doctor_avatar.png" },
    { id: 203, name: "Vaidya Ramesh Iyer",      specialty: "Yoga & Pranayama Therapist",        rating: 4.9, experience: "20 yrs exp", therapies: ["Yoga Therapy", "Pranayama", "Meditation", "Marma Chikitsa"], avatar: "/assets/doctor_avatar.png" },
    { id: 204, name: "Vaidya Sunita Deshpande", specialty: "Nadi Pariksha & Diagnosis",         rating: 4.7, experience: "15 yrs exp", therapies: ["Nadi Pariksha", "Nasyam", "Raktamokshana", "Agni Karma"],  avatar: "/assets/doctor_avatar.png" },
    { id: 205, name: "Vaidya Karthik Menon",    specialty: "Kati Basti & Musculoskeletal Care", rating: 4.8, experience: "16 yrs exp", therapies: ["Kati Basti", "Janu Basti", "Greeva Basti", "Pinda Sweda"], avatar: "/assets/doctor_avatar.png" },
    { id: 206, name: "Vaidya Lakshmi Nair",     specialty: "Shirodhara & Stress Relief",        rating: 4.9, experience: "22 yrs exp", therapies: ["Shirodhara", "Takradhara", "Shirovasti", "Thalam"],        avatar: "/assets/doctor_avatar.png" },
    { id: 207, name: "Vaidya Arjun Patel",      specialty: "Netra Basti & Eye Care Specialist", rating: 4.7, experience: "12 yrs exp", therapies: ["Netra Basti", "Netra Tarpana", "Anjana", "Aschotana"],     avatar: "/assets/doctor_avatar.png" },
    { id: 208, name: "Vaidya Revathi Krishnan", specialty: "Women's Wellness & Fertility",      rating: 4.9, experience: "19 yrs exp", therapies: ["Uttara Basti", "Yoni Pichu", "Udvartana", "Sthanika Basti"], avatar: "/assets/doctor_avatar.png" }
  ],

  // ─── Initialization ───────────────────────────────────────────────────
  async init() {
    await this.fetchTherapists();
    this.renderCalendarDays();
    this.setupListeners();
    if (typeof Auth !== 'undefined' && Auth.currentUser) {
      const nameInput = document.getElementById('therapy-patient-name');
      const emailInput = document.getElementById('therapy-patient-email');
      if (nameInput && !nameInput.value) nameInput.value = Auth.currentUser.name;
      if (emailInput && !emailInput.value) emailInput.value = Auth.currentUser.email;
    }
  },

  async fetchTherapists() {
    try {
      const response = await fetch(`${window.API_BASE || '/api'}/therapist-booking/therapists`);
      if (response.ok) {
        const data = await response.json();
        if (data.therapists && data.therapists.length > 0) {
          this.therapists = data.therapists.map(t => ({
            ...t,
            avatar: t.avatar || '/assets/doctor_avatar.png',
            experience: t.experience ? (t.experience.includes('exp') ? t.experience : `${t.experience} exp`) : '10 yrs exp',
            therapies: t.therapies || ["General Consultation", "Panchakarma", "Abhyanga"]
          }));
        }
      }
    } catch (e) {
      console.warn('Could not fetch dynamic therapists, using default list:', e);
    }
    this.renderTherapists();
  },

  // ─── Event Listeners ──────────────────────────────────────────────────
  setupListeners() {
    // Step 1 — Therapist selection
    const list = document.getElementById('therapist-booking-list');
    if (list) {
      list.addEventListener('click', (e) => {
        const row = e.target.closest('.therapist-row');
        if (!row) return;

        document.querySelectorAll('.therapist-row').forEach(r => r.classList.remove('active'));
        row.classList.add('active');

        const radio = row.querySelector('.therapist-select-radio');
        if (radio) radio.checked = true;

        this.selectedTherapistId = parseInt(row.dataset.id);
        this.selectedTimeSlot = null;
        this.selectedTherapyType = null;

        // Unlock step 2
        const step2 = document.getElementById('therapy-datetime-section');
        if (step2) { step2.style.opacity = '1'; step2.style.pointerEvents = 'auto'; }

        // Populate therapy type dropdown for selected therapist
        this.updateTherapyTypeDropdown();

        // If date already selected, refresh slots
        if (this.selectedDateString) this.fetchSlots();
      });
    }

    // Step 2a — Date selection
    const calendarRow = document.getElementById('therapy-calendar-days-row');
    if (calendarRow) {
      calendarRow.addEventListener('click', (e) => {
        const card = e.target.closest('.therapy-date-card');
        if (!card) return;

        document.querySelectorAll('.therapy-date-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        this.selectedDateString = card.dataset.date;
        this.selectedTimeSlot = null;

        this.fetchSlots();
      });
    }

    // Step 2b — Time slot selection
    const slotsGrid = document.getElementById('therapy-slots-grid');
    if (slotsGrid) {
      slotsGrid.addEventListener('click', (e) => {
        const chip = e.target.closest('.therapy-time-chip.available');
        if (!chip) return;

        document.querySelectorAll('.therapy-time-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        this.selectedTimeSlot = chip.dataset.time;

        // Unlock step 3
        const step3 = document.getElementById('therapy-patient-section');
        if (step3) { step3.style.opacity = '1'; step3.style.pointerEvents = 'auto'; }

        this.updateBookingSummary();
      });
    }

    // Therapy type dropdown change
    const typeSelect = document.getElementById('therapy-type-select');
    if (typeSelect) {
      typeSelect.addEventListener('change', () => {
        this.selectedTherapyType = typeSelect.value;
        this.updateBookingSummary();
      });
    }

    // Step 3 — Form submit
    const form = document.getElementById('therapy-details-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitBooking();
      });
    }
  },

  selectTherapistById(therapistId) {
    const id = parseInt(therapistId);
    this.selectedTherapistId = id;
    this.selectedTimeSlot = null;
    this.selectedTherapyType = null;

    document.querySelectorAll('.therapist-row').forEach(row => {
      if (parseInt(row.dataset.id) === id) {
        row.classList.add('active');
        const radio = row.querySelector('.therapist-select-radio');
        if (radio) radio.checked = true;
      } else {
        row.classList.remove('active');
      }
    });

    const step2 = document.getElementById('therapy-datetime-section');
    if (step2) {
      step2.style.opacity = '1';
      step2.style.pointerEvents = 'auto';
    }

    this.updateTherapyTypeDropdown();

    if (!this.selectedDateString) {
      const firstDate = document.querySelector('.therapy-date-card');
      if (firstDate) firstDate.click();
    } else {
      this.fetchSlots();
    }

    this.updateBookingSummary();
  },

  // ─── Render Therapist Cards ───────────────────────────────────────────
  renderTherapists() {
    const list = document.getElementById('therapist-booking-list');
    if (!list) return;

    list.innerHTML = this.therapists.map(t => `
      <div class="therapist-row" data-id="${t.id}">
        <img class="therapist-avatar" src="${t.avatar}" alt="${t.name}"
             onerror="this.src='https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=100'">
        <div class="therapist-info">
          <div class="therapist-name">${t.name}</div>
          <div class="therapist-specialty">${t.specialty}</div>
          <div class="therapist-meta">
            <span><i class="ri-star-fill"></i> ${t.rating}</span>
            <span><i class="ri-briefcase-line"></i> ${t.experience}</span>
          </div>
          <div class="therapist-therapy-tags">
            ${t.therapies.map(th => `<span class="therapist-tag">${th}</span>`).join('')}
          </div>
        </div>
        <input type="radio" name="selected_therapist" class="therapist-select-radio" value="${t.id}">
      </div>
    `).join('');
  },

  // ─── Render Calendar Days ─────────────────────────────────────────────
  renderCalendarDays() {
    const row = document.getElementById('therapy-calendar-days-row');
    if (!row) return;

    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months   = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const days = [];

    for (let i = 0; i < 10; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}`;
      days.push({
        dayName:   weekdays[date.getDay()],
        dayNum:    date.getDate(),
        monthName: months[date.getMonth()],
        dateStr
      });
    }

    row.innerHTML = days.map(d => `
      <div class="therapy-date-card" data-date="${d.dateStr}">
        <span class="date-day-name">${d.dayName}</span>
        <span class="date-day-num">${d.dayNum}</span>
        <span class="date-month-name">${d.monthName}</span>
      </div>
    `).join('');
  },

  // ─── Fetch Available Slots from API ───────────────────────────────────
  async fetchSlots() {
    if (!this.selectedTherapistId || !this.selectedDateString) return;

    const grid = document.getElementById('therapy-slots-grid');
    if (grid) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;color:var(--text-secondary);padding:20px;">
          <i class="ri-loader-4-line ri-spin" style="font-size:24px;color:#14b8a6;"></i>
          <p style="margin-top:6px;font-size:13px;">Checking therapist availability...</p>
        </div>`;
    }

    try {
      const res = await fetch(`${window.API_BASE || '/api'}/therapist-booking/slots?therapistId=${this.selectedTherapistId}&date=${this.selectedDateString}`);
      if (!res.ok) throw new Error('Failed to retrieve slots');
      const data = await res.json();
      this.renderSlots(data.slots);
    } catch (err) {
      console.error(err);
      if (grid) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--danger);font-size:13px;">Error loading slots. Please try again.</div>`;
      }
    }
  },

  // ─── Render Time Slot Chips ───────────────────────────────────────────
  renderSlots(slots) {
    const grid = document.getElementById('therapy-slots-grid');
    if (!grid) return;

    if (!slots || slots.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);font-size:13px;">No slots on this date.</div>`;
      return;
    }

    grid.innerHTML = slots.map(slot => {
      const cls = slot.isAvailable ? 'available' : 'booked';
      return `<div class="therapy-time-chip ${cls}" data-time="${slot.time}">${slot.time}</div>`;
    }).join('');
  },

  // ─── Populate Therapy Type Dropdown ──────────────────────────────────
  updateTherapyTypeDropdown() {
    const select = document.getElementById('therapy-type-select');
    if (!select) return;

    const therapist = this.therapists.find(t => t.id === this.selectedTherapistId);
    if (!therapist) return;

    select.innerHTML = `<option value="">— Select Therapy Type —</option>` +
      therapist.therapies.map(th => `<option value="${th}">${th}</option>`).join('');

    this.selectedTherapyType = null;
  },

  // ─── Update Booking Summary Panel ────────────────────────────────────
  updateBookingSummary() {
    const box = document.getElementById('therapy-summary-box');
    if (!box) return;

    if (!this.selectedTherapistId || !this.selectedDateString || !this.selectedTimeSlot) {
      box.style.display = 'none';
      return;
    }

    const therapist = this.therapists.find(t => t.id === this.selectedTherapistId);
    const d = new Date(this.selectedDateString);
    const dateFormatted = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

    box.style.display = 'block';
    box.innerHTML = `
      <div class="therapy-summary-row">
        <span class="therapy-summary-label"><i class="ri-user-star-line"></i> Therapist:</span>
        <span>${therapist.name}</span>
      </div>
      <div class="therapy-summary-row">
        <span class="therapy-summary-label"><i class="ri-stethoscope-line"></i> Specialty:</span>
        <span>${therapist.specialty}</span>
      </div>
      <div class="therapy-summary-row">
        <span class="therapy-summary-label"><i class="ri-calendar-event-line"></i> Session Slot:</span>
        <span>${dateFormatted} at <strong>${this.selectedTimeSlot}</strong></span>
      </div>
      ${this.selectedTherapyType ? `
      <div class="therapy-summary-row">
        <span class="therapy-summary-label"><i class="ri-leaf-line"></i> Therapy Type:</span>
        <span>${this.selectedTherapyType}</span>
      </div>` : ''}
      <div class="therapy-summary-row" style="margin-top:8px;padding-top:8px;border-top:1px dashed #99f6e4;">
        <span class="therapy-summary-label"><i class="ri-money-rupee-circle-line"></i> Session Fee:</span>
        <span style="font-weight:800;color:#0d9488;font-size:16px;">₹799 <small style="font-weight:400;color:var(--text-muted);">(In-clinic session)</small></span>
      </div>
    `;
  },

  // ─── Submit Booking with UPI Payment Verification ───────────────────────
  submitBooking() {
    const patientName  = document.getElementById('therapy-patient-name')?.value.trim();
    const patientEmail = document.getElementById('therapy-patient-email')?.value.trim();
    const address      = document.getElementById('therapy-patient-address')?.value.trim();
    const concern      = document.getElementById('therapy-patient-concern')?.value.trim();
    const therapyType  = document.getElementById('therapy-type-select')?.value;

    if (!this.selectedTherapistId) {
      showToast('Please select an Ayurvedic Therapist first.', 'warning');
      return;
    }
    if (!this.selectedDateString) {
      showToast('Please select a session date.', 'warning');
      return;
    }
    if (!this.selectedTimeSlot) {
      showToast('Please select an available time slot.', 'warning');
      return;
    }
    if (!patientName || patientName.length < 2) {
      showToast('Please enter your full name.', 'warning');
      document.getElementById('therapy-patient-name')?.focus();
      return;
    }
    if (!patientEmail || !patientEmail.includes('@')) {
      showToast('Please enter a valid email address.', 'warning');
      document.getElementById('therapy-patient-email')?.focus();
      return;
    }
    if (!address || address.length < 4) {
      showToast('Please enter your complete address for the therapist visit.', 'warning');
      document.getElementById('therapy-patient-address')?.focus();
      return;
    }

    const therapist = this.therapists.find(t => t.id === this.selectedTherapistId) || { name: 'Ayurvedic Therapist', specialty: 'General' };
    const dateObj = new Date(this.selectedDateString);
    const dateFormatted = dateObj.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

    // Open Payment Modal with ₹799 UPI QR Code
    if (typeof BookingPaymentModal !== 'undefined') {
      BookingPaymentModal.open({
        title: 'Therapy Session Fee',
        specialistName: `${therapist.name} (${therapyType || therapist.specialty})`,
        slotText: `${dateFormatted} at ${this.selectedTimeSlot}`,
        amount: 799,
        onConfirmed: async (paymentInfo) => {
          await this.executeTherapistBookingWithPayment(paymentInfo, patientName, patientEmail, address, concern, therapyType, therapist, dateFormatted);
        }
      });
    } else {
      this.executeTherapistBookingWithPayment({ paymentMethod: 'UPI Direct', paymentStatus: 'Paid', amount: 799 }, patientName, patientEmail, address, concern, therapyType, therapist, dateFormatted);
    }
  },

  async executeTherapistBookingWithPayment(paymentInfo, patientName, patientEmail, address, concern, therapyType, therapist, dateFormatted) {
    const btn = document.getElementById('confirm-therapy-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Confirming session...`;
    }

    try {
      const res = await fetch((window.API_BASE || '/api') + '/therapist-booking/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          therapistId: this.selectedTherapistId,
          date: this.selectedDateString,
          timeSlot: this.selectedTimeSlot,
          patientName,
          patientEmail,
          therapyType: therapyType || "General Ayurvedic Session",
          address: address,
          amount: paymentInfo.amount || 799,
          paymentMethod: paymentInfo.paymentMethod || 'UPI Direct',
          paymentStatus: 'Paid',
          paymentId: paymentInfo.paymentId || ('UPI-TH-' + Date.now())
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Session booking failed');

      const overlay   = document.getElementById('checkout-success-overlay');
      const titleEl   = overlay?.querySelector('.success-title');
      const summaryEl = document.getElementById('success-invoice-summary');

      if (titleEl) titleEl.textContent = "Therapy Session Booked & Paid! 🌿";

      if (summaryEl) {
        const otpVal = data.booking.otp_code || data.booking.otpCode || '----';

        summaryEl.innerHTML = `
          Your home therapy session with <strong>${therapist.name}</strong> is confirmed:
          <div class="therapy-success-details" style="background-color: #f0fdf4; border-radius: 8px; padding: 16px; margin: 15px 0; border: 1px solid #86efac;">
            <div style="margin-bottom: 8px;"><i class="ri-calendar-event-line" style="color: #16a34a;"></i> <strong>Date:</strong> ${dateFormatted}</div>
            <div style="margin-bottom: 8px;"><i class="ri-time-line" style="color: #16a34a;"></i> <strong>Time:</strong> ${this.selectedTimeSlot}</div>
            <div style="margin-bottom: 8px;"><i class="ri-leaf-line" style="color: #16a34a;"></i> <strong>Therapy:</strong> ${therapyType || 'General Ayurvedic Session'}</div>
            <div style="margin-bottom: 8px;"><i class="ri-map-pin-line" style="color: #16a34a;"></i> <strong>Visit Address:</strong> ${address}</div>
            <div style="margin-bottom: 8px;"><i class="ri-user-line" style="color: #16a34a;"></i> <strong>Patient:</strong> ${patientName} (${patientEmail})</div>
            <div style="margin-bottom: 8px;"><i class="ri-shield-check-line" style="color: #16a34a;"></i> <strong>Payment Status:</strong> <span style="color:#15803d; font-weight:800;">PAID (₹${paymentInfo.amount || 799} via UPI Direct)</span></div>
            <div style="margin-bottom: 8px; font-size: 15px;"><i class="ri-shield-keyhole-line" style="color: var(--secondary-dark);"></i> <strong>Patient OTP Code:</strong> <strong style="font-size: 18px; color: #16a34a; font-family: monospace;">${otpVal}</strong></div>
          </div>
          <p style="margin-top:16px;font-size:13px;color:var(--text-secondary); line-height: 1.5;">
            ⚠️ <strong>Important:</strong> Please keep this OTP code safe. Share it with your therapist <strong>only when they arrive at your home</strong> to verify their identity and start the therapy session.
          </p>
        `;
      }

      overlay?.classList.add('active');
      this.resetBookingForm();

    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error scheduling therapy session', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i class="ri-qr-code-line"></i> Pay ₹799 &amp; Confirm Session`;
      }
    }
  },

  // ─── Reset Entire Form ────────────────────────────────────────────────
  resetBookingForm() {
    this.selectedTherapistId = null;
    this.selectedDateString  = null;
    this.selectedTimeSlot    = null;
    this.selectedTherapyType = null;

    document.querySelectorAll('.therapist-row').forEach(r => r.classList.remove('active'));
    document.querySelectorAll('.therapy-date-card').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.therapist-select-radio').forEach(r => r.checked = false);

    const grid = document.getElementById('therapy-slots-grid');
    if (grid) grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);font-size:13px;">Please select a therapist first</div>`;

    const box = document.getElementById('therapy-summary-box');
    if (box) { box.style.display = 'none'; box.innerHTML = ''; }

    const concern = document.getElementById('therapy-patient-concern');
    if (concern) concern.value = '';

    const typeSelect = document.getElementById('therapy-type-select');
    if (typeSelect) typeSelect.innerHTML = `<option value="">— Select a therapist first —</option>`;

    // Lock sections
    const step2 = document.getElementById('therapy-datetime-section');
    const step3 = document.getElementById('therapy-patient-section');
    if (step2) { step2.style.opacity = '0.5'; step2.style.pointerEvents = 'none'; }
    if (step3) { step3.style.opacity = '0.5'; step3.style.pointerEvents = 'none'; }
  }
};

// Initialise when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  TherapistBooking.init();
});

window.TherapistBooking = TherapistBooking;
