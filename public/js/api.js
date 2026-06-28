// Frontend API Client

const API_BASE = '/api';

const Api = {
  // Fetch products with pagination parameters
  async getProducts(page = 1, limit = 12, category = 'all', search = '') {
    try {
      const response = await fetch(`${API_BASE}/products?page=${page}&limit=${limit}&category=${category}&search=${encodeURIComponent(search)}`);
      if (!response.ok) throw new Error('Failed to fetch products catalog');
      return await response.json();
    } catch (error) {
      console.error('API Error (getProducts):', error);
      showToast('Error loading products from server', 'error');
      return { products: [], page: 1, limit: 12, totalProducts: 0, totalPages: 1 };
    }
  },

  // Fetch single product details
  async getProductById(id) {
    try {
      const response = await fetch(`${API_BASE}/products/${id}`);
      if (!response.ok) throw new Error(`Failed to fetch product details for ID ${id}`);
      return await response.json();
    } catch (error) {
      console.error('API Error (getProductById):', error);
      showToast('Error loading product details', 'error');
      return null;
    }
  },

  // Talk to AI doctor chatbot
  async consultDoctor(message) {
    try {
      const response = await fetch(`${API_BASE}/doctor/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });
      if (!response.ok) throw new Error('Error getting response from AI Doctor');
      return await response.json();
    } catch (error) {
      console.error('API Error (consultDoctor):', error);
      return {
        reply: "I'm having trouble connecting to my diagnostic center. Please check your network connection and try again.",
        diagnosis: "System connection failure.",
        recommendedProducts: [],
        suggestedQuestions: ["Try asking again", "What products do you have?"]
      };
    }
  },

  // Upload prescription image for OCR scanning
  async uploadPrescription(fileObject, onProgressUpdate) {
    try {
      const formData = new FormData();
      formData.append('prescription', fileObject);

      // We'll perform a standard fetch upload
      const response = await fetch(`${API_BASE}/prescription/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error processing prescription upload');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error (uploadPrescription):', error);
      showToast(error.message || 'Prescription scanning failed', 'error');
      return {
        success: false,
        message: error.message || 'Failed to communicate with OCR server.',
        text: '',
        matchedProducts: []
      };
    }
  }
};

// Global Toast utility
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-wrapper');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'ri-checkbox-circle-line';
  if (type === 'error') icon = 'ri-error-warning-line';
  if (type === 'warning') icon = 'ri-alert-line';

  toast.innerHTML = `
    <i class="${icon}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}
