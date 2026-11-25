// Online Doctor Consultation Booking Handler

const Booking = {
  selectedDoctorId: null,
  selectedDateString: null,
  selectedTimeSlot: null,
  
  doctors: [
    { id: 101, name: "Dr. Vasudev Shashtri", specialty: "Nadi Pariksha & Pulse Diagnosis", rating: 4.9, experience: "22 yrs exp", avatar: "assets/doctor_avatar.png" },
    { id: 102, name: "Dr. Ananya Mishra", specialty: "Ayurvedic Skincare & Hair Expert", rating: 4.8, experience: "14 yrs exp", avatar: "assets/doctor_avatar.png" },
    { id: 103, name: "Dr. Raghavan Nair", specialty: "Panchakarma & Pain Specialist", rating: 4.9, experience: "18 yrs exp", avatar: "assets/doctor_avatar.png" }
  ],

  async init() {
    await this.fetchDoctors();
    this.renderCalendarDays();
    this.setupListeners();
  },

  async fetchDoctors() {
    try {
      const response = await fetch(`${window.API_BASE || '/api'}/booking/doctors`);
      if (response.ok) {
        const data = await response.json();
        if (data.doctors && data.doctors.length > 0) {
          this.doctors = data.doctors.map(d => ({
            ...d,
            avatar: d.avatar || 'assets/doctor_avatar.png',
            experience: d.experience ? (d.experience.includes('exp') ? d.experience : `${d.experience} exp`) : '10 yrs exp'
          }));
        }
      }
    } catch (e) {
      console.warn('Could not fetch dynamic doctors, using default list:', e);
    }
    this.renderDoctors();
  },

  setupListeners() {
    // Listen for doctor selection changes
    const doctorList = document.getElementById('doctor-booking-list');
    if (doctorList) {
      doctorList.addEventListener('click', (e) => {
        const row = e.target.closest('.doctor-booking-row');
        if (!row) return;

        // Toggle row active states
        document.querySelectorAll('.doctor-booking-row').forEach(r => r.classList.remove('active'));
        row.classList.add('active');

        // Set select radio check
        const radio = row.querySelector('.doctor-select-radio');
        if (radio) radio.checked = true;

        this.selectedDoctorId = parseInt(row.dataset.id);
        this.selectedTimeSlot = null; // Reset slot
        
        // Unlock step 2 section
        const step2 = document.getElementById('booking-datetime-section');
        if (step2) {
          step2.style.opacity = '1';
          step2.style.pointerEvents = 'auto';
        }

        // If date is already selected, refresh slots
        if (this.selectedDateString) {
          this.fetchSlots();
        }
      });
    }

    // Listen for calendar date cards click
    const calendarRow = document.getElementById('calendar-days-row');
    if (calendarRow) {
      calendarRow.addEventListener('click', (e) => {
        const card = e.target.closest('.calendar-date-card');
        if (!card) return;

        document.querySelectorAll('.calendar-date-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        this.selectedDateString = card.dataset.date;
        this.selectedTimeSlot = null; // Reset slot

        this.fetchSlots();
      });
    }

    // Listen for time slot chip click
    const slotsGrid = document.getElementById('booking-slots-grid');
    if (slotsGrid) {
      slotsGrid.addEventListener('click', (e) => {
        const chip = e.target.closest('.time-slot-chip.available');
        if (!chip) return;

        document.querySelectorAll('.time-slot-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        this.selectedTimeSlot = chip.dataset.time;

        // Unlock step 3 section
        const step3 = document.getElementById('booking-patient-section');
        if (step3) {
          step3.style.opacity = '1';
          step3.style.pointerEvents = 'auto';
        }

        this.updateBookingSummary();
      });
    }

    // Submit consultation booking
    const bookingForm = document.getElementById('booking-details-form');
    if (bookingForm) {
      bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitBooking();
      });
    }
  },

  selectDoctorById(doctorId) {
    const id = parseInt(doctorId);
    this.selectedDoctorId = id;
    this.selectedTimeSlot = null;

    // Highlight row
    document.querySelectorAll('.doctor-booking-row').forEach(row => {
      if (parseInt(row.dataset.id) === id) {
        row.classList.add('active');
        const radio = row.querySelector('.doctor-select-radio');
        if (radio) radio.checked = true;
      } else {
        row.classList.remove('active');
      }
    });

    // Unlock step 2
    const step2 = document.getElementById('booking-datetime-section');
    if (step2) {
      step2.style.opacity = '1';
      step2.style.pointerEvents = 'auto';
    }

    // Auto-select first available date if none selected
    if (!this.selectedDateString) {
      const firstDateCard = document.querySelector('.calendar-date-card');
      if (firstDateCard) {
        firstDateCard.click();
      }
    } else {
      this.fetchSlots();
    }

    this.updateBookingSummary();
  },

  renderDoctors() {
    const list = document.getElementById('doctor-booking-list');
    if (!list) return;

    list.innerHTML = this.doctors.map(doc => `
      <div class="doctor-booking-row" data-id="${doc.id}">
        <img class="doctor-booking-avatar" src="${doc.avatar}" alt="${doc.name}" onerror="this.src='https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=100'">
        <div class="doctor-booking-info">
          <div class="doctor-booking-name">${doc.name}</div>
          <div class="doctor-booking-specialty">${doc.specialty}</div>
          <div class="doctor-booking-meta">
            <span><i class="ri-star-fill" style="color: var(--secondary);"></i> ${doc.rating}</span>
            <span><i class="ri-briefcase-line"></i> ${doc.experience}</span>
          </div>
        </div>
        <input type="radio" name="selected_doctor" class="doctor-select-radio" value="${doc.id}">
      </div>
    `).join('');
  },

  renderCalendarDays() {
    const daysRow = document.getElementById('calendar-days-row');
    if (!daysRow) return;

    const days = [];
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      const dayName = weekdays[date.getDay()];
      const dayNum = date.getDate();
      const monthName = months[date.getMonth()];
      
      // Date string format YYYY-MM-DD
      const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;

      days.push({
        dayName,
        dayNum,
        monthName,
        dateStr
      });
    }

    daysRow.innerHTML = days.map(d => `
      <div class="calendar-date-card" data-date="${d.dateStr}">
        <span class="date-day-name">${d.dayName}</span>
        <span class="date-day-num">${d.dayNum}</span>
        <span class="date-month-name">${d.monthName}</span>
      </div>
    `).join('');
  },

  async fetchSlots() {
    if (!this.selectedDoctorId || !this.selectedDateString) return;

    const slotsGrid = document.getElementById('booking-slots-grid');
    if (slotsGrid) {
      slotsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 20px;">
          <i class="ri-loader-4-line ri-spin" style="font-size: 24px;"></i>
          <p style="margin-top: 6px;">Checking slot availability...</p>
        </div>
      `;
    }

    try {
      const response = await fetch(`${window.API_BASE || '/api'}/booking/slots?doctorId=${this.selectedDoctorId}&date=${this.selectedDateString}`);
      if (!response.ok) throw new Error('Failed to retrieve slots');
      const data = await response.json();

      this.renderSlots(data.slots);

    } catch (e) {
      console.error(e);
      if (slotsGrid) {
        slotsGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--danger); font-size: 13px;">Error checking slots. Please check network.</div>`;
      }
    }
  },

  renderSlots(slots) {
    const slotsGrid = document.getElementById('booking-slots-grid');
    if (!slotsGrid) return;

    if (!slots || slots.length === 0) {
      slotsGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); font-size: 13px;">No slots found on this date.</div>`;
      return;
    }

    slotsGrid.innerHTML = slots.map(slot => {
      const statusClass = slot.isAvailable ? 'available' : 'booked';
      return `
        <div class="time-slot-chip ${statusClass}" data-time="${slot.time}">
          ${slot.time}
        </div>
      `;
    }).join('');
  },

  updateBookingSummary() {
    const summaryBox = document.getElementById('booking-summary-box');
    if (!summaryBox) return;

    if (!this.selectedDoctorId || !this.selectedDateString || !this.selectedTimeSlot) {
      summaryBox.style.display = 'none';
      return;
    }

    const doctor = this.doctors.find(d => d.id === this.selectedDoctorId);
    
    // Format Date beautifully
    const d = new Date(this.selectedDateString);
    const dateFormatted = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

    summaryBox.style.display = 'block';
    summaryBox.innerHTML = `
      <div class="booking-summary-row">
        <span class="booking-summary-label">Doctor Reference:</span>
        <span>${doctor.name} (${doctor.specialty})</span>
      </div>
      <div class="booking-summary-row">
        <span class="booking-summary-label">Consultation Slot:</span>
        <span>${dateFormatted} at <strong>${this.selectedTimeSlot}</strong></span>
      </div>
      <div class="booking-summary-row">
        <span class="booking-summary-label">Fee Amount:</span>
        <span style="font-weight: 800; color: var(--primary-dark);">₹499 (Online Session)</span>
      </div>
    `;
  },

  submitBooking() {
    const patientName = document.getElementById('booking-patient-name').value.trim();
    const patientEmail = document.getElementById('booking-patient-email').value.trim();
    const symptom = document.getElementById('booking-patient-symptoms').value.trim();

    if (!this.selectedDoctorId) {
      showToast('Please select an Ayurvedic Doctor first.', 'warning');
      return;
    }
    if (!this.selectedDateString) {
      showToast('Please choose a consultation date.', 'warning');
      return;
    }
    if (!this.selectedTimeSlot) {
      showToast('Please select an available time slot.', 'warning');
      return;
    }
    if (!patientName || patientName.length < 2) {
      showToast('Please enter the patient full name.', 'warning');
      document.getElementById('booking-patient-name')?.focus();
      return;
    }
    if (!patientEmail || !patientEmail.includes('@')) {
      showToast('Please enter a valid patient email address.', 'warning');
      document.getElementById('booking-patient-email')?.focus();
      return;
    }

    const doc = this.doctors.find(d => d.id === this.selectedDoctorId) || { name: 'Ayurvedic Specialist', specialty: 'General' };
    const dateObj = new Date(this.selectedDateString);
    const dateFormatted = dateObj.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

    // Open Payment Modal with ₹499 UPI QR Code
    if (typeof BookingPaymentModal !== 'undefined') {
      BookingPaymentModal.open({
        title: 'Doctor Consultation Fee',
        specialistName: `${doc.name} (${doc.specialty})`,
        slotText: `${dateFormatted} at ${this.selectedTimeSlot}`,
        amount: 499,
        onConfirmed: async (paymentInfo) => {
          await this.executeBookingWithPayment(paymentInfo, patientName, patientEmail, symptom, doc, dateFormatted);
        }
      });
    } else {
      this.executeBookingWithPayment({ paymentMethod: 'UPI Direct', paymentStatus: 'Paid', amount: 499 }, patientName, patientEmail, symptom, doc, dateFormatted);
    }
  },

  async executeBookingWithPayment(paymentInfo, patientName, patientEmail, symptom, doc, dateFormatted) {
    const confirmBtn = document.getElementById('confirm-booking-btn');
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Securing your slot...`;
    }

    try {
      const response = await fetch((window.API_BASE || '/api') + '/booking/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: this.selectedDoctorId,
          date: this.selectedDateString,
          timeSlot: this.selectedTimeSlot,
          patientName,
          patientEmail,
          symptom,
          amount: paymentInfo.amount || 499,
          paymentMethod: paymentInfo.paymentMethod || 'UPI Direct',
          paymentStatus: 'Paid',
          paymentId: paymentInfo.paymentId || ('UPI-DOC-' + Date.now())
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Booking submission failed');

      // Trigger checkout success modal with payment confirmed details
      const checkoutSuccessOverlay = document.getElementById('checkout-success-overlay');
      const successTitle = checkoutSuccessOverlay?.querySelector('.success-title');
      const summaryText = document.getElementById('success-invoice-summary');

      if (successTitle) successTitle.textContent = "Consultation Booked & Paid! ✔";
      if (summaryText) {
        summaryText.innerHTML = `
          Your consultation with <strong>${doc.name}</strong> is confirmed:
          <div class="booking-success-details" style="background:#f0fdf4; border:1px solid #86efac; border-radius:8px; padding:16px; margin:15px 0;">
            <div style="margin-bottom:6px;"><i class="ri-calendar-event-line" style="color:#16a34a;"></i> <strong>Date:</strong> ${dateFormatted}</div>
            <div style="margin-bottom:6px;"><i class="ri-time-line" style="color:#16a34a;"></i> <strong>Time:</strong> ${this.selectedTimeSlot} (Online Video Call)</div>
            <div style="margin-bottom:6px;"><i class="ri-user-line" style="color:#16a34a;"></i> <strong>Patient:</strong> ${patientName} (${patientEmail})</div>
            <div style="margin-bottom:6px;"><i class="ri-shield-check-line" style="color:#16a34a;"></i> <strong>Payment Status:</strong> <span style="color:#15803d; font-weight:800;">PAID (₹${paymentInfo.amount || 499} via UPI Direct)</span></div>
            <div><i class="ri-file-list-3-line" style="color:#16a34a;"></i> <strong>Booking Reference:</strong> #BK-${data.booking.id}</div>
          </div>
          <p style="margin-top: 15px; color:#4b5563;">A secure video consultation link and receipt has been sent to <strong>${patientEmail}</strong>. Please join 5 minutes before your schedule.</p>
        `;
      }

      checkoutSuccessOverlay?.classList.add('active');
      this.resetBookingForm();

    } catch (e) {
      console.error(e);
      showToast(e.message || 'Error scheduling booking', 'error');
    } finally {
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = `<i class="ri-qr-code-line"></i> Pay ₹499 &amp; Confirm Appointment`;
      }
    }
  },

  resetBookingForm() {
    this.selectedDoctorId = null;
    this.selectedDateString = null;
    this.selectedTimeSlot = null;

    document.querySelectorAll('.doctor-booking-row').forEach(r => r.classList.remove('active'));
    document.querySelectorAll('.calendar-date-card').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.doctor-select-radio').forEach(r => r.checked = false);
    
    const slotsGrid = document.getElementById('booking-slots-grid');
    if (slotsGrid) slotsGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); font-size: 13px;">Please select a doctor first</div>`;

    const summaryBox = document.getElementById('booking-summary-box');
    if (summaryBox) {
      summaryBox.style.display = 'none';
      summaryBox.innerHTML = '';
    }

    const sympt = document.getElementById('booking-patient-symptoms');
    if (sympt) sympt.value = '';

    // Lock sections back
    const step2 = document.getElementById('booking-datetime-section');
    const step3 = document.getElementById('booking-patient-section');
    if (step2) {
      step2.style.opacity = '0.5';
      step2.style.pointerEvents = 'none';
    }
    if (step3) {
      step3.style.opacity = '0.5';
      step3.style.pointerEvents = 'none';
    }
  }
};

// Start Booking script
document.addEventListener('DOMContentLoaded', () => {
  Booking.init();
});

// Unified Booking Tab Switcher (Single Page Doctor + Therapist)
window.switchUnifiedBookingTab = function(type) {
  const docSection = document.getElementById('unified-doctor-section');
  const thSection = document.getElementById('unified-therapist-section');
  const btnDoc = document.getElementById('tab-btn-doctor');
  const btnTh = document.getElementById('tab-btn-therapist');

  // Navigate to booking-page if not currently active
  if (typeof App !== 'undefined' && App.navigateTo) {
    App.navigateTo('booking-page');
  } else {
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    const bp = document.getElementById('booking-page');
    if (bp) bp.classList.add('active');
  }

  if (type === 'therapist') {
    if (docSection) docSection.style.display = 'none';
    if (thSection) thSection.style.display = 'block';

    if (btnDoc) {
      btnDoc.style.background = 'transparent';
      btnDoc.style.color = '#4a5568';
    }
    if (btnTh) {
      btnTh.style.background = '#27ae60';
      btnTh.style.color = '#ffffff';
    }

    if (typeof TherapistBooking !== 'undefined' && TherapistBooking.renderTherapists) {
      TherapistBooking.renderTherapists();
    }
  } else {
    if (docSection) docSection.style.display = 'block';
    if (thSection) thSection.style.display = 'none';

    if (btnDoc) {
      btnDoc.style.background = '#27ae60';
      btnDoc.style.color = '#ffffff';
    }
    if (btnTh) {
      btnTh.style.background = 'transparent';
      btnTh.style.color = '#4a5568';
    }

    if (typeof Booking !== 'undefined' && Booking.renderDoctors) {
      Booking.renderDoctors();
    }
  }

  window.scrollTo({ top: 120, behavior: 'smooth' });
};

window.Booking = Booking;
