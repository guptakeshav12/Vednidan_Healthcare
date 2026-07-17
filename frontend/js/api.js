// Frontend API Client
// Auto-detects whether running via Express server or VS Code Live Server

(function() {
  // If running through our Express server (port 5000), use relative /api
  // If running via VS Code Live Server (port 5500) or opened as file, point directly to Express
  const BACKEND_PORT = 5000;
  const currentPort = window.location.port;
  const currentProtocol = window.location.protocol;

  // Use relative path when served by Express (same server), otherwise use full URL
  let API_BASE;
  if (currentPort == BACKEND_PORT || (!currentPort && currentProtocol === 'https:')) {
    API_BASE = '/api';
  } else {
    // Running via Live Server or file:// — point to Express backend
    API_BASE = `http://localhost:${BACKEND_PORT}/api`;
  }

  window.API_BASE = API_BASE;
  console.log(`[VedNidan] API Base: ${API_BASE}`);
})();

const Api = {
  // Fetch products with pagination parameters
  async getProducts(page = 1, limit = 12, category = 'all', search = '') {
    try {
      const response = await fetch(`${window.API_BASE}/products?page=${page}&limit=${limit}&category=${category}&search=${encodeURIComponent(search)}`);
      if (!response.ok) throw new Error('Failed to fetch products catalog');
      return await response.json();
    } catch (error) {
      console.error('API Error (getProducts):', error);
      showToast('Error loading products. Is the server running?', 'error');
      return { products: [], page: 1, limit: 12, totalProducts: 0, totalPages: 1 };
    }
  },

  // Fetch single product details
  async getProductById(id) {
    try {
      const response = await fetch(`${window.API_BASE}/products/${id}`);
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
      const response = await fetch(`${window.API_BASE}/doctor/chat`, {
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
        reply: "I'm having trouble connecting to my diagnostic center. Please make sure the server is running on port 5000.",
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

      const response = await fetch(`${window.API_BASE}/prescription/upload`, {
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
