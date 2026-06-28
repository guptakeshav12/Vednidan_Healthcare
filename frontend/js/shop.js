// Shop Controller Module with Paginated Products Catalog

const Shop = {
  products: [],
  currentCategory: 'all',
  searchQuery: '',
  currentPage: 1,
  totalPages: 1,
  limit: 12,

  async init() {
    await this.fetchProducts();
    this.setupListeners();
  },

  setupListeners() {
    // Category pills click handler
    const categoryContainer = document.getElementById('category-list');
    if (categoryContainer) {
      categoryContainer.addEventListener('click', (e) => {
        const pill = e.target.closest('.category-pill');
        if (!pill) return;

        // Toggle active class
        document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        this.currentCategory = pill.dataset.category;
        this.currentPage = 1; // Reset to page 1
        this.fetchProducts();
      });
    }

    // Modal Close button
    const closeBtn = document.getElementById('modal-close-btn');
    const backdrop = document.getElementById('product-modal-backdrop');
    if (closeBtn && backdrop) {
      closeBtn.addEventListener('click', () => this.closeProductModal());
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) this.closeProductModal();
      });
    }
  },

  async fetchProducts() {
    const grid = document.getElementById('products-grid');
    if (grid) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px; color: var(--text-secondary);">
          <i class="ri-loader-4-line ri-spin" style="font-size: 32px;"></i>
          <p style="margin-top: 10px;">Loading Ayurvedic catalog database...</p>
        </div>
      `;
    }

    const data = await Api.getProducts(
      this.currentPage, 
      this.limit, 
      this.currentCategory, 
      this.searchQuery
    );

    this.products = data.products;
    this.totalPages = data.totalPages;
    this.currentPage = data.page;

    this.renderProducts();
  },

  setSearchQuery(query) {
    this.searchQuery = query.toLowerCase().trim();
    this.currentPage = 1; // Reset to page 1
    this.fetchProducts();
  },

  changePage(newPage) {
    if (newPage < 1 || newPage > this.totalPages) return;
    this.currentPage = newPage;
    this.fetchProducts();
    
    // Scroll window back to category selector
    const catList = document.getElementById('category-list');
    if (catList) {
      catList.scrollIntoView({ behavior: 'smooth' });
    }
  },

  renderProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    if (this.products.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px; color: var(--text-secondary);">
          <i class="ri-search-eye-line" style="font-size: 48px; color: var(--text-muted);"></i>
          <h3 style="margin-top: 16px;">No remedies found</h3>
          <p style="margin-top: 8px;">Try searching for other ingredients or categories.</p>
        </div>
      `;
      return;
    }

    // Render product cards
    let htmlContent = this.products.map(product => {
      // Calculate discount percentage
      const discountPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
      
      return `
        <div class="product-card fade-in">
          ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
          <div class="product-image-wrapper" onclick="Shop.openProductModal(${product.id})">
            <img src="${product.image}" alt="${product.name}" onerror="this.src='https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&q=80&w=300'">
          </div>
          <div class="product-info">
            <span class="product-category">${product.category}</span>
            <h4 class="product-name" onclick="Shop.openProductModal(${product.id})">${product.name}</h4>
            <div class="product-rating">
              <span class="star-rating">${this.renderStars(product.rating)}</span>
              <span>(${product.reviewsCount})</span>
            </div>
            <p class="product-desc">${product.shortDescription}</p>
            <div class="product-price-row">
              <div class="price-container">
                <span class="original-price">₹${product.originalPrice}</span>
                <span class="current-price">₹${product.price} <span style="font-size: 11px; color: var(--success); font-weight: 700;">(${discountPercent}% OFF)</span></span>
              </div>
              <button class="add-cart-btn" onclick="Cart.addItem(${product.id}, 1)" aria-label="Add ${product.name} to Cart">
                <i class="ri-add-line"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Append Pagination Bar inside Grid spanning all columns
    if (this.totalPages > 1) {
      htmlContent += `
        <div class="pagination-bar" style="grid-column: 1/-1; display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 40px; border-top: 1px solid var(--accent); padding-top: 24px;">
          <button class="qty-btn" onclick="Shop.changePage(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
            <i class="ri-arrow-left-s-line"></i> Previous
          </button>
          
          <span style="font-weight: 700; font-size: 14px; color: var(--primary-dark);">
            Page ${this.currentPage} of ${this.totalPages}
          </span>
          
          <button class="qty-btn" onclick="Shop.changePage(${this.currentPage + 1})" ${this.currentPage === this.totalPages ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
            Next <i class="ri-arrow-right-s-line"></i>
          </button>
        </div>
      `;
    }

    grid.innerHTML = htmlContent;
  },

  renderStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    
    return '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);
  },

  async openProductModal(id) {
    let product = this.products.find(p => p.id === id);
    
    // If not found in the currently loaded page slice, fetch details from server directly
    if (!product) {
      product = await Api.getProductById(id);
    }
    if (!product) return;

    const modalDetails = document.getElementById('modal-content-details');
    if (!modalDetails) return;

    modalDetails.innerHTML = `
      <div class="modal-image-panel">
        <img src="${product.image}" alt="${product.name}" onerror="this.src='https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&q=80&w=400'">
      </div>
      <div class="modal-details">
        <span class="modal-badge">${product.badge || 'Ayurvedic Formula'}</span>
        <h2 class="modal-title">${product.name}</h2>
        <div class="modal-ratings">
          <span class="star-rating" style="color: var(--secondary);">${this.renderStars(product.rating)}</span>
          <span>${product.rating} / 5 (${product.reviewsCount} customer reviews)</span>
        </div>
        <div class="modal-price-row">
          <span class="current">₹${product.price}</span>
          <span class="original">₹${product.originalPrice}</span>
        </div>
        <p class="modal-desc">${product.longDescription}</p>
        
        <div class="modal-dosha-tag">
          <i class="ri-sparkling-fill"></i> Dosha: ${product.dosha}
        </div>

        <div class="modal-meta-section">
          <h4 class="modal-meta-title">Key Ingredients</h4>
          <p class="modal-meta-content">${product.ingredients.join(', ')}</p>
        </div>

        <div class="modal-meta-section">
          <h4 class="modal-meta-title">Directions for Use</h4>
          <p class="modal-meta-content">${product.usage}</p>
        </div>

        <div class="modal-actions">
          <div class="qty-selector">
            <button class="qty-btn" onclick="Shop.changeModalQty(-1)">-</button>
            <span class="qty-val" id="modal-qty-display">1</span>
            <button class="qty-btn" onclick="Shop.changeModalQty(1)">+</button>
          </div>
          <button class="btn-primary" style="flex: 1;" onclick="Shop.addModalProductToCart(${product.id})">
            Add to Basket <i class="ri-shopping-basket-line"></i>
          </button>
        </div>
      </div>
    `;

    document.getElementById('product-modal-backdrop').classList.add('active');
    document.body.style.overflow = 'hidden'; // Lock background scroll
  },

  closeProductModal() {
    document.getElementById('product-modal-backdrop').classList.remove('active');
    document.body.style.overflow = ''; // Unlock background scroll
  },

  modalQty: 1,

  changeModalQty(diff) {
    const qtySpan = document.getElementById('modal-qty-display');
    if (!qtySpan) return;

    let current = parseInt(qtySpan.textContent);
    current = Math.max(1, current + diff);
    qtySpan.textContent = current;
    this.modalQty = current;
  },

  addModalProductToCart(productId) {
    Cart.addItem(productId, this.modalQty);
    this.closeProductModal();
    // Reset modal counter
    this.modalQty = 1;
  }
};
