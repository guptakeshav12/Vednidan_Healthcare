// BookingPaymentModal — Reusable Direct UPI QR Payment Controller for Doctor & Therapist Bookings
// VedNidan Healthcare

window.BookingPaymentModal = {
  _currentCallback: null,
  _currentData: null,

  /**
   * Open the UPI QR Payment Modal
   * @param {Object} options
   *   options.title: 'Doctor Consultation Fee' | 'Therapy Session Fee'
   *   options.specialistName: 'Dr. Vasudev Shashtri'
   *   options.slotText: 'Thu, 26 Nov at 10:00 AM'
   *   options.amount: 499 | 799
   *   options.onConfirmed: function(paymentInfo) {}
   */
  open({ title, specialistName, slotText, amount, onConfirmed }) {
    this._currentCallback = onConfirmed;
    this._currentData = { title, specialistName, slotText, amount };

    const modal = document.getElementById('booking-payment-modal-backdrop');
    if (!modal) return;

    // Set text fields
    const titleEl = document.getElementById('bk-pay-modal-title');
    const amtDisplay = document.getElementById('bk-pay-amount-display');
    const qrAmtText = document.getElementById('bk-pay-qr-amount-text');
    const sumLine1 = document.getElementById('bk-pay-summary-line1');
    const sumLine2 = document.getElementById('bk-pay-summary-line2');
    const upiIdDisplay = document.getElementById('bk-upi-id-display');

    if (titleEl) titleEl.textContent = title || 'Appointment Fee';
    if (amtDisplay) amtDisplay.textContent = `₹${amount}`;
    if (qrAmtText) qrAmtText.textContent = amount;
    if (sumLine1) sumLine1.textContent = specialistName || 'Ayurvedic Specialist';
    if (sumLine2) sumLine2.textContent = slotText || 'Selected Slot';

    // Get Company UPI ID from global config or fallback
    const upiId = (typeof COMPANY_UPI_ID !== 'undefined') ? COMPANY_UPI_ID : 'vednidan@upi';
    const upiName = (typeof COMPANY_UPI_NAME !== 'undefined') ? COMPANY_UPI_NAME : 'VedNidan Healthcare';

    if (upiIdDisplay) upiIdDisplay.textContent = upiId;

    // Standard UPI deep-link URL (Auto-fills merchant name and amount in all UPI apps)
    const note = `${title || 'Booking'} - ${specialistName || 'VedNidan'}`;
    const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;

    // Render QR Code using QRCode.js
    const qrContainer = document.getElementById('bk-upi-qr-container');
    if (qrContainer) {
      qrContainer.innerHTML = '';
      if (typeof QRCode !== 'undefined') {
        try {
          new QRCode(qrContainer, {
            text: upiUrl,
            width: 150,
            height: 150,
            colorDark: '#0f172a',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
          });
        } catch (e) {
          qrContainer.innerHTML = `<div style="font-size:12px;padding:15px;color:#16a34a;">Pay to UPI:<br><strong>${upiId}</strong></div>`;
        }
      } else {
        qrContainer.innerHTML = `<div style="font-size:12px;padding:15px;color:#16a34a;">Pay to UPI:<br><strong>${upiId}</strong></div>`;
      }
    }

    modal.style.display = 'flex';
  },

  onPaidClicked() {
    const modal = document.getElementById('booking-payment-modal-backdrop');
    if (modal) modal.style.display = 'none';

    if (typeof showToast === 'function') {
      showToast(`Payment of ₹${this._currentData ? this._currentData.amount : ''} received! Confirming slot...`, 'success');
    }

    if (typeof this._currentCallback === 'function') {
      const paymentInfo = {
        paymentMethod: 'UPI Direct',
        paymentStatus: 'Paid',
        amount: this._currentData ? this._currentData.amount : 499,
        paymentId: 'UPI-BK-' + Date.now()
      };
      this._currentCallback(paymentInfo);
      this._currentCallback = null;
    }
  },

  close(isSuccess = false) {
    const modal = document.getElementById('booking-payment-modal-backdrop');
    if (modal) modal.style.display = 'none';
    this._currentCallback = null;

    if (!isSuccess && typeof showToast === 'function') {
      showToast('Payment incomplete. Your appointment was NOT booked.', 'warning');
    }
  }
};
