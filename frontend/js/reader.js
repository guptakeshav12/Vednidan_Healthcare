// Prescription Reader Uploader & Scanner Handler

const Reader = {
  selectedFile: null,
  ocrMatchedProducts: [], // Array of { product, detectedQty, prescribedName, form, directions }

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

      this.updateStep('step-upload', 'active');
      
      const response = await fetch('/assets/prescription_sample.png');
      const blob = await response.blob();
      const file = new File([blob], 'prescription_sample.png', { type: 'image/png' });

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

    const previewImg = document.getElementById('prescription-preview-img');
    if (previewImg) {
      previewImg.src = URL.createObjectURL(file);
    }

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
      await new Promise(r => setTimeout(r, 800));
      this.updateStep('step-upload', 'done');

      // Step 2: OCR Scanning
      this.updateStep('step-ocr', 'active');
      
      const response = await Api.uploadPrescription(file);
      
      this.updateStep('step-ocr', 'done');

      // Step 3: Catalog Matching
      this.updateStep('step-match', 'active');
      await new Promise(r => setTimeout(r, 600));
      this.updateStep('step-match', 'done');

      if (response && response.success) {
        this.renderResults(response.text, response.matchedProducts, response.outOfStockMedicines);
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

  renderResults(rawText, matchedList, outOfStockList) {
    this.setScannerState('results');

    // 1. Render raw OCR text
    const textBox = document.getElementById('ocr-raw-text');
    if (textBox) {
      textBox.textContent = rawText ? rawText.trim() : 'No readable text extracted.';
    }

    // 2. Summary counts
    const summaryEl = document.getElementById('ocr-summary-counts');
    if (summaryEl) {
      const total = (matchedList || []).length + (outOfStockList || []).length;
      summaryEl.innerHTML = `
        <span class="ocr-badge-available"><i class="ri-check-line"></i> ${(matchedList || []).length} Available</span>
        <span class="ocr-badge-oos"><i class="ri-close-circle-line"></i> ${(outOfStockList || []).length} Not Listed</span>
        <span style="font-size:12px;color:var(--text-secondary);margin-left:4px;">(${total} total detected)</span>
      `;
    }

    const container = document.getElementById('ocr-matched-list');
    if (!container) return;

    const hasMatched = matchedList && matchedList.length > 0;
    const hasOOS = outOfStockList && outOfStockList.length > 0;

    if (!hasMatched && !hasOOS) {
      container.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
          <i class="ri-alert-line" style="font-size: 28px; color: var(--warning);"></i>
          <p style="margin-top: 8px;">No medicines detected in this prescription.</p>
          <p style="font-size: 11px; margin-top: 4px;">Make sure the image is clear and text is readable.</p>
        </div>
      `;
      const addBtn = document.getElementById('ocr-add-selected-btn');
      if (addBtn) addBtn.style.display = 'none';
      return;
    }

    const addBtn = document.getElementById('ocr-add-selected-btn');
    if (addBtn) addBtn.style.display = hasMatched ? 'block' : 'none';
    
    // Save for cart
    this.ocrMatchedProducts = matchedList || [];

    let html = '';

    // ── MATCHED (Available) products ─────────────────────────────
    if (hasMatched) {
      html += `<div class="ocr-section-header ocr-available-header">
        <i class="ri-checkbox-circle-line"></i> Available in Our Store (${matchedList.length})
      </div>`;

      html += matchedList.map((item, idx) => `
        <div class="scan-result-item scan-result-available">
          <input type="checkbox" class="scan-result-checkbox" id="ocr-checkbox-${idx}" checked>
          <img class="scan-result-img" src="${item.product.image || ''}" alt="${item.product.name}" 
               onerror="this.src='https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&q=80&w=80'">
          <div class="scan-result-info">
            <div class="scan-result-name">${item.product.name}</div>
            <div style="margin-top:4px;font-size:11px;color:var(--text-secondary);">
              <span style="font-style:italic;">Rx: ${item.prescribedName}</span>
              ${item.form ? ` &bull; <span>${item.form}</span>` : ''}
            </div>
            <div style="margin-top:4px;">
              <span class="scan-result-qty-badge">Qty: ${item.detectedQty}</span>
              ${item.directions ? `<span class="scan-result-dir-badge">${item.directions}</span>` : ''}
            </div>
          </div>
          <div class="scan-result-price">₹${(item.product.price * item.detectedQty).toLocaleString('en-IN')}</div>
        </div>
      `).join('');
    }

    // ── OUT OF STOCK medicines ────────────────────────────────────
    if (hasOOS) {
      html += `<div class="ocr-section-header ocr-oos-header" style="margin-top:${hasMatched ? '20px' : '0'};">
        <i class="ri-close-circle-line"></i> Not Listed / Sourcing Required (${outOfStockList.length})
      </div>`;

      html += outOfStockList.map(item => {
        let suggestionsHtml = '';
        if (item.suggestions && item.suggestions.length > 0) {
          suggestionsHtml = `
            <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed rgba(255,107,107,0.3); width: 100%;">
              <span style="font-size:11px; font-weight:700; color:var(--text-secondary); text-transform:uppercase;">AI Suggested Substitutes:</span>
              <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
                ${item.suggestions.map(sug => `
                  <div style="display:flex; align-items:center; justify-content:space-between; background:var(--background); padding:6px 10px; border-radius:4px; border:1px solid var(--accent);">
                    <div style="display:flex; align-items:center; gap:8px;">
                      <img src="${sug.image || ''}" style="width:24px; height:24px; border-radius:4px; object-fit:cover;" onerror="this.style.display='none'">
                      <div>
                        <div style="font-size:12px; font-weight:600; color:var(--text-primary);">${sug.name}</div>
                        <div style="font-size:10px; color:var(--text-secondary);">${sug.category || ''} • ₹${sug.price}</div>
                      </div>
                    </div>
                    <button type="button" class="btn-primary" style="padding:4px 8px; font-size:10px; border-radius:4px;" onclick="window.location.href='/#products'; showToast('Check store for ${sug.name.replace(/'/g, "\\'")}');">View</button>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }

        return `
        <div class="scan-result-item scan-result-oos" style="flex-direction:column; align-items:stretch;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; width:100%;">
            <div style="display:flex; gap:12px;">
              <div class="scan-result-oos-icon"><i class="ri-medicine-bottle-line"></i></div>
              <div class="scan-result-info">
                <div class="scan-result-name">${item.name}</div>
                <div style="margin-top:4px;font-size:11px;color:var(--text-secondary);">
                  ${item.form ? `<span>${item.form}</span>` : ''}
                  ${item.directions ? ` &bull; <span>${item.directions}</span>` : ''}
                </div>
              </div>
            </div>
            <div class="scan-result-oos-tag">
              <i class="ri-error-warning-line"></i> Not in Store
            </div>
          </div>
          ${suggestionsHtml}
        </div>
        `;
      }).join('');
    }

    container.innerHTML = html;
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
      showToast(`Added ${addedCount} prescription item(s) to cart!`);
      this.setScannerState('empty');
    } else {
      showToast('No items checked to add.', 'warning');
    }
  }
};
