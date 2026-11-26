// AI Doctor Consultation Handler with 7-Question State Machine
// Enhanced with: Knowledge Base treatment, PDF prescription, medicine availability popup

const Doctor = {
  chatLogs: [],
  isTyping: false,
  lastTreatment: null,   // stores last received treatment object for PDF / modal
  lastChatState: null,   // stores last chatState for patient details in PDF
  chatState: {
    step: 0,
    language: "",
    name: "",
    weight: "",
    height: "",
    problem: "",
    duration: "",
    symptom: "",
    scores: { vata: 0, pitta: 0, kapha: 0 }
  },

  init() {
    this.renderWelcomeMessage();
    this.setupListeners();
    this.setupMedicineModal();
  },

  setupListeners() {
    const sendBtn = document.getElementById('chat-send-btn');
    const inputField = document.getElementById('chat-user-input');
    const clearBtn = document.getElementById('clear-chat-btn');

    if (sendBtn && inputField) {
      sendBtn.addEventListener('click', () => this.sendMessage());
      inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.sendMessage();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.resetConsultation();
      });
    }

    // Suggestions panel click handler
    const suggestionsPanel = document.getElementById('chat-suggestions-chips');
    if (suggestionsPanel) {
      suggestionsPanel.addEventListener('click', (e) => {
        const chip = e.target.closest('.suggestion-chip');
        if (chip) {
          const queryText = chip.textContent.trim();
          this.sendMessage(queryText);
        }
      });
    }
  },

  setupMedicineModal() {
    const closeBtn = document.getElementById('med-avail-close-btn');
    const dismissBtn = document.getElementById('med-avail-dismiss-btn');
    const backdrop = document.getElementById('med-avail-backdrop');
    const addAllBtn = document.getElementById('med-avail-add-all-btn');

    const closeModal = () => {
      if (backdrop) backdrop.classList.remove('active');
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (dismissBtn) dismissBtn.addEventListener('click', closeModal);
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeModal();
      });
    }

    if (addAllBtn) {
      addAllBtn.addEventListener('click', () => {
        const list = document.getElementById('med-avail-list');
        if (!list) return;
        const availBtns = list.querySelectorAll('[data-product-id]');
        let count = 0;
        availBtns.forEach(btn => {
          const pid = parseInt(btn.getAttribute('data-product-id'));
          if (pid && typeof Cart !== 'undefined') {
            Cart.addItem(pid, 1);
            count++;
          }
        });
        if (count > 0) {
          closeModal();
          if (typeof showToast === 'function') showToast(`✅ Added ${count} available medicines to cart!`);
        } else {
          if (typeof showToast === 'function') showToast('No available store medicines to add.');
        }
      });
    }
  },

  resetConsultation() {
    this.chatState = {
      step: 0,
      language: "",
      name: "",
      weight: "",
      height: "",
      problem: "",
      duration: "",
      symptom: "",
      scores: { vata: 0, pitta: 0, kapha: 0 }
    };
    this.chatLogs = [];
    this.lastTreatment = null;
    this.lastChatState = null;
    const container = document.getElementById('chat-messages-log');
    if (container) container.innerHTML = '';
    this.renderWelcomeMessage();
  },

  renderWelcomeMessage() {
    const welcomeText = `Namaste 🙏 Welcome to VedNidan AI Doctor. Please choose your preferred language to begin / कृपया अपनी पसंदीदा भाषा चुनें / कृपया तुमची सोयीची भाषा निवडा:`;
    this.appendMessage('doctor', welcomeText, [], ["English", "Hindi (हिंदी)", "Marathi (मराठी)"]);
  },

  async sendMessage(customText = null) {
    const inputField = document.getElementById('chat-user-input');
    if (!inputField || this.isTyping) return;

    const messageText = customText || inputField.value.trim();
    if (!messageText) return;

    // Reset input field
    if (!customText) inputField.value = '';

    // If user asks to restart, trigger the reset
    if (messageText.toLowerCase() === "restart consultation" || messageText.toLowerCase() === "restart chat") {
      this.resetConsultation();
      return;
    }

    // Append user message
    this.appendMessage('user', messageText);

    // Set typing loader state
    this.setTypingIndicator(true);

    try {
      // Call backend API passing the current state
      const response = await fetch((window.API_BASE || '/api') + '/doctor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message: messageText,
          chatState: this.chatState
        })
      });

      if (!response.ok) throw new Error('Failed to consult AI Doctor');
      const data = await response.json();

      // Disable typing loader state
      this.setTypingIndicator(false);

      // Update state locally
      if (data.chatState) {
        this.lastChatState = { ...data.chatState };
        this.chatState = data.chatState;
      }

      // Store treatment for PDF and medicine modal
      if (data.treatment) {
        this.lastTreatment = data.treatment;
      }

      // Detect if consultation is complete (step 12 = report generated)
      const isReport = data.chatState && data.chatState.step === 12;

      // Append Doctor reply with products and follow-up chips
      this.appendMessage(
        'doctor', 
        data.reply, 
        data.recommendedProducts, 
        data.suggestedQuestions,
        isReport  // show action buttons only when report is ready
      );

      // If report generated, show action buttons and trigger medicine modal
      if (isReport && this.lastTreatment) {
        // Slight delay so user reads the report first
        setTimeout(() => {
          this.showMedicineAvailabilityModal(this.lastTreatment.medicines || []);
        }, 800);
      }

    } catch (error) {
      console.error('API Error (sendMessage):', error);
      this.setTypingIndicator(false);
      this.appendMessage(
        'doctor', 
        "I'm having trouble connecting to my diagnosis center. Let me reset our consultation. Please describe your symptoms again.",
        [], 
        ["Anxiety & Insomnia", "Slow Digestion", "Hair Thinning"]
      );
      this.chatState = { step: 0, symptom: "", scores: { vata: 0, pitta: 0, kapha: 0 } };
    }
  },

  setTypingIndicator(show) {
    this.isTyping = show;
    const log = document.getElementById('chat-messages-log');
    if (!log) return;

    const existingLoader = document.getElementById('chat-typing-loader');
    if (show) {
      if (existingLoader) return;
      const loader = document.createElement('div');
      loader.className = 'typing-indicator';
      loader.id = 'chat-typing-loader';
      loader.innerHTML = `
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      `;
      log.appendChild(loader);
      this.scrollToBottom();
    } else {
      if (existingLoader) existingLoader.remove();
    }
  },

  appendMessage(sender, text, products = [], suggestions = [], showReportActions = false) {
    const log = document.getElementById('chat-messages-log');
    if (!log) return;

    const message = document.createElement('div');
    message.className = `message-bubble ${sender}`;

    // Convert newlines to breaks and simple bold/italic markdown formatting
    let formattedText = text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/#### (.*?)(<br>|$)/g, '<h4>$1</h4>')
      .replace(/### (.*?)(<br>|$)/g, '<h3>$1</h3>')
      .replace(/• (.*?)(<br>|$)/g, '<li>$1</li>');

    message.innerHTML = `
      <div class="message-content">${formattedText}</div>
    `;

    // Render associated recommended products inside the chat bubble
    if (sender === 'doctor' && products && products.length > 0) {
      const productsGrid = document.createElement('div');
      productsGrid.className = 'chat-products-grid';

      products.forEach(p => {
        const prodCard = document.createElement('div');
        prodCard.className = 'chat-product-card';
        prodCard.innerHTML = `
          <img class="chat-product-img" src="${p.image}" alt="${p.name}" onerror="this.src='https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&q=80&w=100'">
          <div class="chat-product-details">
            <div class="chat-product-name">${p.name}</div>
            <div class="chat-product-price">₹${p.price}</div>
          </div>
          <button class="chat-product-add" onclick="Cart.addItem(${p.id}, 1)">Add to Cart</button>
        `;
        productsGrid.appendChild(prodCard);
      });

      message.appendChild(productsGrid);
    }

    // Show report action buttons (PDF Download + Medicine Availability)
    if (sender === 'doctor' && showReportActions) {
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'report-action-btns';
      actionsDiv.innerHTML = `
        <button class="report-btn-pdf" onclick="Doctor.generatePrescriptionPDF()">
          <i class="ri-file-pdf-2-line"></i> Download Prescription PDF
        </button>
        <button class="report-btn-med" onclick="Doctor.showMedicineAvailabilityModal(Doctor.lastTreatment ? Doctor.lastTreatment.medicines || [] : [])">
          <i class="ri-store-2-line"></i> Check Medicine Store
        </button>
      `;
      message.appendChild(actionsDiv);
    }

    // Add time details
    const time = document.createElement('div');
    time.className = 'message-meta';
    const now = new Date();
    time.textContent = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    message.appendChild(time);

    log.appendChild(message);
    this.scrollToBottom();

    // Render suggestion chips
    this.renderSuggestionChips(suggestions);
  },

  renderSuggestionChips(suggestions) {
    const container = document.getElementById('chat-suggestions-chips');
    if (!container) return;

    if (!suggestions || suggestions.length === 0) {
      container.innerHTML = '';
      container.style.padding = '0';
      return;
    }

    container.style.padding = '12px 24px';
    container.innerHTML = suggestions.map(q => `
      <div class="suggestion-chip">${q}</div>
    `).join('');
  },

  scrollToBottom() {
    const log = document.getElementById('chat-messages-log');
    if (log) {
      log.scrollTop = log.scrollHeight;
    }
  },

  // ─────────────────────────────────────────────────────────────────
  // PRESCRIPTION PDF GENERATOR
  // ─────────────────────────────────────────────────────────────────
  async loadLogoDataUrl() {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 200;
          canvas.height = img.naturalHeight || 200;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch (e) {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = 'assets/vednidan-logo-clean.png';
      setTimeout(() => resolve(null), 2500);
    });
  },

  async generatePrescriptionPDF() {
    if (typeof window.jspdf === 'undefined') {
      alert('PDF generator is loading. Please try again in a moment.');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const logoDataUrl = await this.loadLogoDataUrl();

    const state = this.lastChatState || this.chatState;
    const tx = this.lastTreatment;
    const patientName = state.name || 'Patient';
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 18;
    let y = 0;

    // Helper functions
    const drawRect = (x, yPos, w, h, fillColor) => {
      doc.setFillColor(...fillColor);
      doc.rect(x, yPos, w, h, 'F');
    };

    const checkPageBreak = (needed = 20) => {
      if (y + needed > pageH - 18) {
        doc.addPage();
        y = 20;
      }
    };

    const addText = (text, x, yPos, opts = {}) => {
      doc.setFontSize(opts.size || 10);
      doc.setFont('helvetica', opts.style || 'normal');
      doc.setTextColor(...(opts.color || [30, 30, 30]));
      if (opts.align) {
        doc.text(String(text || ''), x, yPos, { align: opts.align });
      } else {
        doc.text(String(text || ''), x, yPos);
      }
    };

    const addWrappedText = (text, x, yPos, maxW, opts = {}) => {
      doc.setFontSize(opts.size || 9);
      doc.setFont('helvetica', opts.style || 'normal');
      doc.setTextColor(...(opts.color || [60, 60, 60]));
      const lines = doc.splitTextToSize(String(text || ''), maxW);
      doc.text(lines, x, yPos);
      return lines.length * ((opts.size || 9) * 0.42);
    };

    // ── HEADER BANNER WITH LOGO ──────────────────────────────────
    drawRect(0, 0, pageW, 44, [22, 90, 60]);
    let textStartX = margin;
    if (logoDataUrl) {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, 7, 30, 30, 3, 3, 'F');
      doc.addImage(logoDataUrl, 'PNG', margin + 1.5, 8.5, 27, 27);
      textStartX = margin + 35;
    }
    addText('VedNidan Healthcare', textStartX, 16, { size: 18, style: 'bold', color: [255, 255, 255] });
    addText('AI Ayurvedic Consultation & Prescription Report', textStartX, 23, { size: 10, color: [180, 230, 200] });
    addText(`Date: ${dateStr}  |  Time: ${timeStr}`, textStartX, 31, { size: 9, color: [215, 245, 228] });
    addText('www.vednidan.healthcare', pageW - margin, 16, { size: 9, style: 'bold', color: [215, 245, 228], align: 'right' });
    addText('Ayurvedic Telehealth & Clinic', pageW - margin, 23, { size: 8, color: [180, 230, 200], align: 'right' });
    y = 52;

    // ── PATIENT INFO BOX ──────────────────────────────────────────
    drawRect(margin, y, pageW - margin * 2, 36, [240, 248, 244]);
    addText('PATIENT INFORMATION', margin + 5, y + 8, { size: 8, style: 'bold', color: [22, 90, 60] });
    addText(`Name: ${patientName}`, margin + 5, y + 16, { size: 10, style: 'bold', color: [20, 20, 20] });
    addText(`Weight: ${state.weight || 'N/A'}  |  Height: ${state.height || 'N/A'}  |  Duration: ${state.duration || 'N/A'}`, margin + 5, y + 23, { size: 9, color: [60, 60, 60] });
    addText(`Chief Complaint: ${state.problem || 'N/A'}`, margin + 5, y + 30, { size: 9, color: [60, 60, 60] });
    y += 44;

    // ── DOSHA ANALYSIS BOX ────────────────────────────────────────
    if (state.scores) {
      drawRect(margin, y, pageW - margin * 2, 32, [249, 245, 255]);
      addText('DOSHA ANALYSIS (PRAKRITI-VIKRITI ASSESSMENT)', margin + 5, y + 8, { size: 8, style: 'bold', color: [80, 30, 150] });
      const { vata = 0, pitta = 0, kapha = 0 } = state.scores;
      const dominant = vata >= pitta && vata >= kapha ? 'VATA' : pitta >= kapha ? 'PITTA' : 'KAPHA';
      addText(`Vata: ${vata}/7   |   Pitta: ${pitta}/7   |   Kapha: ${kapha}/7`, margin + 5, y + 18, { size: 10, color: [40, 40, 40] });
      addText(`Dominant Imbalance: ${dominant}`, margin + 5, y + 26, { size: 10, style: 'bold', color: [80, 30, 150] });
      y += 40;
    }

    // ── DIAGNOSIS ─────────────────────────────────────────────────
    if (tx && tx.diagnosis) {
      checkPageBreak(28);
      addText('CLASSICAL AYURVEDIC DIAGNOSIS', margin, y, { size: 9, style: 'bold', color: [22, 90, 60] });
      y += 4;
      doc.setDrawColor(22, 90, 60);
      doc.setLineWidth(0.4);
      doc.line(margin, y, pageW - margin, y);
      y += 6;
      const diagHeight = addWrappedText(tx.diagnosis.replace(/\*\*/g, ''), margin, y, pageW - margin * 2, { size: 9 });
      y += diagHeight + 8;
    }

    // ── MEDICINES ─────────────────────────────────────────────────
    if (tx && tx.medicines && tx.medicines.length > 0) {
      checkPageBreak(30);
      addText('PRESCRIBED CLASSICAL MEDICINES (SHASTRA-OKTA AUSHADHI)', margin, y, { size: 9, style: 'bold', color: [22, 90, 60] });
      y += 4;
      doc.setDrawColor(22, 90, 60);
      doc.line(margin, y, pageW - margin, y);
      y += 6;
      tx.medicines.forEach((med, i) => {
        checkPageBreak(14);
        const medText = `${i + 1}. ${med.replace(/\*\*/g, '')}`;
        const h = addWrappedText(medText, margin + 4, y, pageW - margin * 2 - 4, { size: 9 });
        y += h + 4;
      });
      checkPageBreak(12);
      addText('Note: Consult a registered Vaidya before starting classical formulations.', margin, y, { size: 8, style: 'italic', color: [180, 80, 0] });
      y += 10;
    }

    // ── HOME REMEDIES ─────────────────────────────────────────────
    if (tx && tx.homeRemedies && tx.homeRemedies.length > 0) {
      checkPageBreak(28);
      addText('AUTHENTIC HOME REMEDIES (GRIHYA CHIKITSA)', margin, y, { size: 9, style: 'bold', color: [22, 90, 60] });
      y += 4;
      doc.setDrawColor(22, 90, 60);
      doc.line(margin, y, pageW - margin, y);
      y += 6;
      tx.homeRemedies.forEach((rem, i) => {
        checkPageBreak(16);
        const h = addWrappedText(`${i + 1}. ${rem.replace(/\*\*/g, '')}`, margin + 4, y, pageW - margin * 2 - 4, { size: 9 });
        y += h + 4;
      });
      y += 4;
    }

    // ── THERAPIES ─────────────────────────────────────────────────
    if (tx && tx.therapies && tx.therapies.length > 0) {
      checkPageBreak(30);
      addText('PANCHAKARMA & THERAPY PRESCRIPTION', margin, y, { size: 9, style: 'bold', color: [22, 90, 60] });
      y += 4;
      doc.setDrawColor(22, 90, 60);
      doc.line(margin, y, pageW - margin, y);
      y += 6;
      tx.therapies.forEach((th, i) => {
        checkPageBreak(16);
        const h = addWrappedText(`${i + 1}. ${th.replace(/\*\*/g, '')}`, margin + 4, y, pageW - margin * 2 - 4, { size: 9 });
        y += h + 4;
      });
      y += 6;
    }

    // ── FOLLOW-UP ─────────────────────────────────────────────────
    checkPageBreak(32);
    drawRect(margin, y, pageW - margin * 2, 22, [240, 248, 244]);
    addText('FOLLOW-UP: Follow this protocol for minimum 21 days.', margin + 5, y + 8, { size: 9, style: 'bold', color: [22, 90, 60] });
    addText('Book in-clinic Panchakarma via the Book Therapist section on VedNidan Healthcare.', margin + 5, y + 16, { size: 8, color: [60, 60, 60] });
    y += 30;

    // ── SIGNATURE FOOTER ──────────────────────────────────────────
    checkPageBreak(25);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageW - margin, y);
    y += 8;
    addText('VedNidan AI Doctor - Charak Consultation Engine', margin, y, { size: 8, style: 'italic', color: [120, 120, 120] });
    addText('This is an AI-generated Ayurvedic consultation report. Not a substitute for professional medical advice.', margin, y + 6, { size: 7, color: [150, 150, 150] });
    addText('May you be blessed with Swastha - Ayu, Aarogya, Sukha.', pageW / 2, y + 14, { size: 8, style: 'bold', color: [22, 90, 60], align: 'center' });

    // Save
    const safeName = (patientName || 'Patient').replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`VedNidan_Prescription_${safeName}_${now.toISOString().slice(0, 10)}.pdf`);

    if (typeof showToast === 'function') {
      showToast('✅ Prescription PDF downloaded successfully!');
    }
  },

  // ─────────────────────────────────────────────────────────────────
  // MEDICINE AVAILABILITY MODAL
  // ─────────────────────────────────────────────────────────────────
  showMedicineAvailabilityModal(medicines = []) {
    const backdrop = document.getElementById('med-avail-backdrop');
    const list = document.getElementById('med-avail-list');
    if (!backdrop || !list) return;

    if (!medicines || medicines.length === 0) {
      list.innerHTML = `<div class="med-avail-empty">No specific medicines prescribed in this consultation.</div>`;
      backdrop.classList.add('active');
      return;
    }

    // Get all shop products
    const shopProducts = (typeof Shop !== 'undefined' && Shop.products) ? Shop.products : [];

    const rows = medicines.map((med, i) => {
      const medLower = med.toLowerCase().replace(/\(.*?\)/g, '').trim();
      
      // Fuzzy keyword match against shop products
      const matchedProduct = shopProducts.find(p => {
        const pName = (p.name || '').toLowerCase();
        const pDesc = (p.description || '').toLowerCase();
        const pCat = (p.category || '').toLowerCase();
        // Extract first meaningful word from medicine name
        const keywords = medLower.split(/[\s,\-]+/).filter(w => w.length > 3);
        return keywords.some(kw => pName.includes(kw) || pDesc.includes(kw) || pCat.includes(kw));
      });

      if (matchedProduct) {
        return `
          <div class="med-avail-item available">
            <div class="med-avail-item-info">
              <span class="med-avail-badge available-badge">✅ In Store</span>
              <div class="med-avail-item-name">${med}</div>
              <div class="med-avail-match">Matched: <strong>${matchedProduct.name}</strong> — ₹${matchedProduct.price}</div>
            </div>
            <button class="med-avail-add-btn" data-product-id="${matchedProduct.id}" onclick="Cart.addItem(${matchedProduct.id}, 1); this.textContent='✅ Added!'; this.disabled=true;">
              🛒 Add to Cart
            </button>
          </div>
        `;
      } else {
        return `
          <div class="med-avail-item unavailable">
            <div class="med-avail-item-info">
              <span class="med-avail-badge unavailable-badge">❌ Not Available</span>
              <div class="med-avail-item-name">${med}</div>
              <div class="med-avail-match">Not currently in our store. Ask your local Ayurvedic pharmacy or consult a Vaidya.</div>
            </div>
            <button class="med-avail-notify-btn" disabled>Unavailable</button>
          </div>
        `;
      }
    }).join('');

    const availCount = medicines.filter(med => {
      const medLower = med.toLowerCase().replace(/\(.*?\)/g, '').trim();
      return shopProducts.some(p => {
        const keywords = medLower.split(/[\s,\-]+/).filter(w => w.length > 3);
        return keywords.some(kw => (p.name||'').toLowerCase().includes(kw) || (p.description||'').toLowerCase().includes(kw));
      });
    }).length;

    list.innerHTML = `
      <div class="med-avail-summary">
        <span>${medicines.length} medicines prescribed</span>
        <span class="avail-count">${availCount} available in store</span>
        <span class="unavail-count">${medicines.length - availCount} not available</span>
      </div>
      ${rows}
    `;

    backdrop.classList.add('active');
  }
};
