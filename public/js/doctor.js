// AI Doctor Consultation Handler with 7-Question State Machine

const Doctor = {
  chatLogs: [],
  isTyping: false,
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
      const response = await fetch('/api/doctor/chat', {
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
        this.chatState = data.chatState;
        console.log("Updated Local chatState:", this.chatState);
      }

      // Append Doctor reply with products and follow-up chips
      this.appendMessage(
        'doctor', 
        data.reply, 
        data.recommendedProducts, 
        data.suggestedQuestions
      );

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

  appendMessage(sender, text, products = [], suggestions = []) {
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
  }
};
