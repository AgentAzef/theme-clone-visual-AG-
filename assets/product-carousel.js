// Product Carousel Custom Element
// Handles sliding, resizing, touch/swipe, keyboard, autoplay, infinite loop
class ProductCarousel extends HTMLElement {
  constructor() {
    super();
    this.track = this.querySelector('.carousel-inner');
    this.items = Array.from(this.track.children); // Array for easier handling
    this.prevBtn = this.querySelector('.carousel-control.left');
    this.nextBtn = this.querySelector('.carousel-control.right');
    this.pos = 0;
    this.resizeTimer = null;
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.isInfinite = this.dataset.infinite === 'true';
    this.autoplayInterval = parseInt(this.dataset.autoplay) || 0;
    this.autoplayTimer = null;

    // Initial setup
    this.updateVisibleItems();
    this.updateButtons();
    this.setupTouch();
    this.setupKeyboard();
    this.setupLazyLoad(); // Performance boost
    if (this.autoplayInterval > 0) this.startAutoplay();

    // Accessibility: Live region for screen readers
    this.track.setAttribute('aria-live', 'polite');
  }

  // Calculate visible items based on viewport (matches CSS)
  updateVisibleItems() {
    const width = window.innerWidth;
    if (width < 768) this.visible = 1;
    else if (width < 1024) this.visible = 2;
    else if (width < 1400) this.visible = 3;
    else this.visible = 4;
    this.maxPos = Math.max(0, this.items.length - this.visible);
    this.pos = Math.min(this.pos, this.maxPos);
    this.updateItemWidth();
  }

  // Dynamic item width: Query CSS for flexibility
  updateItemWidth() {
    if (this.items.length > 0) {
      const itemStyle = getComputedStyle(this.items[0]);
      const containerStyle = getComputedStyle(this.track);
      const marginRight = parseFloat(itemStyle.marginRight) || 0;
      const gap = parseFloat(containerStyle.gap) || 24; // Fallback to your CSS gap
      this.itemWidth = this.items[0].offsetWidth + marginRight + gap;
    } else {
      this.itemWidth = 324; // Fallback if no items
    }
  }

  // Debounce resize event
  debounceResize() {
    clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => {
      this.updateVisibleItems();
      this.updateTransform();
      this.updateButtons();
    }, 150);
  }

  // Slide logic with infinite wrap-around
  slide(direction) {
    this.pos += direction;
    if (this.isInfinite) {
      if (this.pos > this.maxPos) this.pos = 0;
      if (this.pos < 0) this.pos = this.maxPos;
    } else {
      this.pos = Math.max(0, Math.min(this.pos, this.maxPos));
    }
    this.updateTransform();
    this.updateButtons();
  }

  // Apply CSS transform
  updateTransform() {
    this.track.style.transform = `translateX(-${this.pos * this.itemWidth}px)`;
  }

  // Enable/disable buttons (never disable in infinite mode)
  updateButtons() {
    this.prevBtn.disabled = !this.isInfinite && this.pos === 0;
    this.nextBtn.disabled = !this.isInfinite && this.pos === this.maxPos;
  }

  // Touch/Swipe support with Pointer Events
  setupTouch() {
    this.track.addEventListener('pointerdown', (e) => {
      this.touchStartX = e.clientX;
      this.stopAutoplay();
    });
    this.track.addEventListener('pointermove', (e) => {
      if (this.touchStartX !== 0) this.touchEndX = e.clientX;
    });
    this.track.addEventListener('pointerup', () => {
      if (this.touchStartX !== 0) {
        const delta = this.touchStartX - this.touchEndX;
        if (Math.abs(delta) > 50) { // Swipe threshold
          this.slide(delta > 0 ? 1 : -1);
        }
        this.touchStartX = 0;
        this.touchEndX = 0;
        if (this.autoplayInterval > 0) this.startAutoplay();
      }
    });
    this.track.addEventListener('pointercancel', () => {
      this.touchStartX = 0;
      this.touchEndX = 0;
      if (this.autoplayInterval > 0) this.startAutoplay();
    });
  }

  // Keyboard navigation for accessibility
  setupKeyboard() {
    this.setAttribute('tabindex', '0'); // Make focusable
    this.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.slide(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.slide(1);
      }
    });
  }

  // Autoplay start/stop
  startAutoplay() {
    this.autoplayTimer = setInterval(() => this.slide(1), this.autoplayInterval);
  }

  stopAutoplay() {
    clearInterval(this.autoplayTimer);
  }

  // Performance: Lazy-load images beyond initial viewport using IntersectionObserver
  setupLazyLoad() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target.querySelector('img');
          if (img && img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          observer.unobserve(entry.target);
        }
      });
    });
    this.items.forEach((item, index) => {
      if (index >= this.visible) observer.observe(item);
    });
  }
}

// Define the custom element
customElements.define('product-carousel', ProductCarousel);