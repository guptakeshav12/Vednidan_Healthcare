// Prescription Reader Uploader & Scanner Handler

const Reader = {
  selectedFile: null,
  ocrMatchedProducts: [], // Array of { product, quantity, checkboxElement }

  init() {
    this.setupListeners();
  },

  setupListeners() {
    const dropZone = document.getElementById('drop-upload-zone');
    const fileInput = document.getElementById('file-uploader-input');
    const sampleLink = document.getElementById('load-sample-rx-btn');
    const addToCartBtn = document.getElementById('ocr-add-selected-btn');

    if (dropZone && fileInput) {
      // Trigger browse on click
      dropZone.addEventListener('click', () => fileInput.click());

      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          this.processFile(e.target.files[0]);
        }
      });

      // Drag and Drop triggers
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
      });

      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
      });

      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
          this.processFile(e.dataTransfer.files[0]);
        }
      });
    }

    // Sample prescription trigger
    if (sampleLink) {
      sampleLink.addEventListener('click', () => this.loadSamplePrescription());
    }

    // Add selected items to cart button
    if (addToCartBtn) {
      addToCartBtn.addEventListener('click', () => this.addSelectedToCart());
    }
  },

  async loadSamplePrescription() {
    try {
      this.resetScannerUI();
      this.setScannerState('active');
      
      const previewImg = document.getElementById('prescription-preview-img');
      if (previewImg) previewImg.src = '/assets/prescription_sample.png';

      // Simulate step-by-step loading for premium visuals
      this.updateStep('step-upload', 'active');
      
      // Fetch the sample image asset and convert it to a File object
      const response = await fetch('/assets/prescription_sample.png');
      const blob = await response.blob();
      const file = new File([blob], 'prescription_sample.png', { type: 'image/png' });

      // Run OCR process
      this.runOcrProcess(file);

    } catch (e) {
      console.error('Error loading sample prescription:', e);
      showToast('Error loading sample prescription asset', 'error');
      this.setScannerState('empty');
    }
  },

  processFile(file) {
    if (!file.type.match('image.*')) {
      showToast('Please upload an image file (PNG/JPG/WEBP)', 'error');
      return;
    }

    this.resetScannerUI();
    this.setScannerState('active');

    // Create a local object URL to preview the file immediately in the UI
    const previewImg = document.getElementById('prescription-preview-img');
    if (previewImg) {
      previewImg.src = URL.createObjectURL(file);
    }

    // Run OCR process
    this.runOcrProcess(file);
  },

  updateStep(stepId, status) {
    const stepEl = document.getElementById(stepId);
    if (!stepEl) return;

    stepEl.className = `scan-step ${status}`;
    const dot = stepEl.querySelector('.scan-step-dot');

    if (status === 'active') {
      dot.innerHTML = `<i class="ri-loader-4-line ri-spin"></i>`;
    } else if (status === 'done') {
      dot.innerHTML = `<i class="ri-check-line"></i>`;
    } else {
      dot.innerHTML = stepId.includes('upload') ? '1' : stepId.includes('ocr') ? '2' : '3';
    }
  },

  async runOcrProcess(file) {
    try {
      // Step 1: Uploading
      this.updateStep('step-upload', 'active');
      await new Promise(r => setTimeout(r, 1200)); // Visual buffer delay
      this.updateStep('step-upload', 'done');

      // Step 2: OCR Scanning text
      this.updateStep('step-ocr', 'active');
      
      // Call backend API which performs the Tesseract OCR
      const response = await Api.uploadPrescription(file);
      
      this.updateStep('step-ocr', 'done');

      // Step 3: Catalog Matching
      this.updateStep('step-match', 'active');
      await new Promise(r => setTimeout(r, 1000)); // Visual buffer delay
      this.updateStep('step-match', 'done');

      // Check results
      if (response && response.success) {
        this.renderResults(response.text, response.matchedProducts);
      } else {
        showToast(response.message || 'Prescription parsing failed', 'error');
        this.setScannerState('empty');
      }

    } catch (e) {
      console.error(e);
      showToast('Prescription upload processing failed', 'error');
      this.setScannerState('empty');
    }
  },

  setScannerState(state) {
    const emptyState = document.getElementById('scanner-empty-state');
    const activeState = document.getElementById('scanner-active-state');
    const resultsState = document.getElementById('scanner-results-state');

    if (emptyState) emptyState.style.display = state === 'empty' ? 'block' : 'none';
    if (activeState) activeState.style.display = state === 'active' ? 'flex' : 'none';
    if (resultsState) resultsState.style.display = state === 'results' ? 'block' : 'none';
  },

  resetScannerUI() {
    this.updateStep('step-upload', 'idle');
    this.updateStep('step-ocr', 'idle');
    this.updateStep('step-match', 'idle');
    this.ocrMatchedProducts = [];
  },

  renderResults(rawText, matchedList) {
    this.setScannerState('results');

    // 1. Render raw OCR findings
    const textBox = document.getElementById('ocr-raw-text');
    if (textBox) {
      textBox.textContent = rawText ? rawText.trim() : 'No characters readable.';
    }

    // 2. Render matched product checkboxes
    const container = document.getElementById('ocr-matched-list');
    if (!container) return;

    if (!matchedList || matchedList.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
          <i class="ri-alert-line" style="font-size: 28px; color: var(--warning);"></i>
          <p style="margin-top: 8px;">No matching medicines from our shop detected.</p>
          <p style="font-size: 11px; margin-top: 4px;">Make sure terms like "Ashwagandha" or "Triphala" are clearly written on the image.</p>
        </div>
      `;
      document.getElementById('ocr-add-selected-btn').style.display = 'none';
      return;
    }

    document.getElementById('ocr-add-selected-btn').style.display = 'block';
    
    // Save items internally for cart addition
    this.ocrMatchedProducts = matchedList;

    container.innerHTML = matchedList.map((item, idx) => `
      <div class="scan-result-item">
        <input type="checkbox" class="scan-result-checkbox" id="ocr-checkbox-${idx}" checked>
        <img class="scan-result-img" src="${item.product.image}" alt="${item.product.name}" onerror="this.src='https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&q=80&w=80'">
        <div class="scan-result-info">
          <div class="scan-result-name">${item.product.name}</div>
          <div>
            <span class="scan-result-qty-badge">Quantity: ${item.detectedQty}</span>
          </div>
        </div>
        <div class="scan-result-price">₹${item.product.price * item.detectedQty}</div>
      </div>
    `).join('');
  },

  addSelectedToCart() {
    let addedCount = 0;
    
    this.ocrMatchedProducts.forEach((item, idx) => {
      const checkbox = document.getElementById(`ocr-checkbox-${idx}`);
      if (checkbox && checkbox.checked) {
        Cart.addItem(item.product.id, item.detectedQty);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      showToast(`Added ${addedCount} prescription items to cart!`);
      // Reset scanner back to normal empty view
      this.setScannerState('empty');
    } else {
      showToast('No items checked to add.', 'warning');
    }
  }
};
