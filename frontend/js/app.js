// Main Application Entry & Router

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

const App = {
  async init() {
    console.log("Initializing VedNidan Healthcare client application...");

    // Initialize individual modules
    await Shop.init();
    Cart.init();
    Doctor.init();
    Reader.init();

    this.setupRouter();
    this.setupSearch();
    this.setupMobileMenu();
    this.setupHeroActions();
  },

  setupRouter() {
    const navLinks = document.querySelectorAll('.nav-link, #logo-btn');
    const sections = document.querySelectorAll('.page-section');

    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Find target section
        let targetId = link.getAttribute('data-target');
        
        // If logo is clicked, route to shop page
        if (link.id === 'logo-btn') {
          targetId = 'shop-page';
          // Set active state on shop nav link
          document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
          const shopNav = document.getElementById('nav-shop');
          if (shopNav) shopNav.classList.add('active');
        } else {
          // Toggle active state on menu links
          document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        }

        if (!targetId) return;

        // Switch active pages
        sections.forEach(section => {
          if (section.id === targetId) {
            section.classList.add('active');
            section.style.display = 'block';
          } else {
            section.classList.remove('active');
            section.style.display = 'none';
          }
        });

        // Scroll to top of content
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Close mobile menu if open
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu && navMenu.classList.contains('mobile-active')) {
          navMenu.classList.remove('mobile-active');
          navMenu.style.display = 'none';
        }
      });
    });
  },

  setupSearch() {
    const searchInput = document.getElementById('search-bar');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        
        // If user is not on shop page, route them to shop page automatically when they type!
        const shopSection = document.getElementById('shop-page');
        if (shopSection && !shopSection.classList.contains('active')) {
          const shopNav = document.getElementById('nav-shop');
          if (shopNav) shopNav.click();
        }

        Shop.setSearchQuery(query);
      });
    }
  },

  setupMobileMenu() {
    const toggleBtn = document.getElementById('mobile-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (toggleBtn && navMenu) {
      toggleBtn.addEventListener('click', () => {
        navMenu.classList.toggle('mobile-active');
        if (navMenu.classList.contains('mobile-active')) {
          navMenu.style.display = 'flex';
          navMenu.style.flexDirection = 'column';
          navMenu.style.position = 'absolute';
          navMenu.style.top = '100%';
          navMenu.style.left = '0';
          navMenu.style.width = '100%';
          navMenu.style.backgroundColor = 'var(--surface)';
          navMenu.style.padding = '20px';
          navMenu.style.boxShadow = 'var(--shadow-md)';
          navMenu.style.borderBottom = '1px solid var(--accent)';
          navMenu.style.gap = '16px';
        } else {
          navMenu.style.display = 'none';
        }
      });
    }
  },

  setupHeroActions() {
    const consultBtn = document.getElementById('hero-consult-btn');
    const uploadBtn = document.getElementById('hero-upload-btn');
    const floatingChatBtn = document.getElementById('floating-chat-btn');

    if (consultBtn) {
      consultBtn.addEventListener('click', () => {
        const docNav = document.getElementById('nav-doctor');
        if (docNav) docNav.click();
      });
    }

    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => {
        const readerNav = document.getElementById('nav-reader');
        if (readerNav) readerNav.click();
      });
    }

    if (floatingChatBtn) {
      floatingChatBtn.addEventListener('click', () => {
        const docNav = document.getElementById('nav-doctor');
        if (docNav) docNav.click();
      });
    }
  }
};
