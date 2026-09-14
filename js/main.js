/**
 * WELCOME MOTOR - Main Client Showroom Controller
 * Theme: Clean White Background + Welcome Motors Logo Red + High-Contrast Black Typography
 * Owner: Arslan Farooq | Rawalpindi Cricket Stadium
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize UI & Components
  initNavigation();
  initSettings();
  initContactForm();
  initStatsCounter();

  // Load Inventory & Featured Cars
  await loadFeaturedVehicles();
  await loadInventory();

  // Listen for storage / admin updates in other tabs/windows
  window.addEventListener('storage', (e) => {
    if (e.key === 'welcome_motors_vehicles_cache' || e.key === 'welcome_motors_settings_cache') {
      console.log('🔄 Data updated in admin, refreshing showroom...');
      loadFeaturedVehicles();
      loadInventory();
      initSettings();
    }
  });
});

// ==========================================
// NAVIGATION & HEADER LOGIC
// ==========================================
function initNavigation() {
  const navbar = document.getElementById('mainNavbar');
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');

  // Sticky Navbar Blur Effect
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Mobile Drawer Toggle
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      mobileToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
      document.body.classList.toggle('no-scroll');
    });

    // Close on link click
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileToggle.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.classList.remove('no-scroll');
      });
    });
  }

  // Active section spy
  window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section[id]');
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}

// ==========================================
// BUSINESS SETTINGS LOADER
// ==========================================
async function initSettings() {
  try {
    const settings = await window.dbService.getSettings();
    if (!settings) return;

    // Update phone & whatsapp elements
    const phoneLinks = document.querySelectorAll('.dynamic-phone-link');
    phoneLinks.forEach(el => {
      el.href = `tel:${settings.phone.replace(/[^0-9+]/g, '')}`;
      const textSpan = el.querySelector('.phone-text');
      if (textSpan) textSpan.textContent = settings.phone;
    });

    const waLinks = document.querySelectorAll('.dynamic-wa-link');
    waLinks.forEach(el => {
      const raw = settings.whatsapp ? settings.whatsapp.replace(/[^0-9]/g, '') : '923133884499';
      el.href = `https://wa.me/${raw.startsWith('92') ? raw : '92' + raw.replace(/^0/, '')}`;
    });

    // Update address & owner elements
    document.querySelectorAll('.dynamic-address').forEach(el => el.textContent = settings.address);
    document.querySelectorAll('.dynamic-owner').forEach(el => el.textContent = settings.owner_name);
    document.querySelectorAll('.dynamic-tagline').forEach(el => el.textContent = settings.tagline);
    document.querySelectorAll('.dynamic-hours').forEach(el => el.textContent = settings.opening_hours);

    // License number (ONLY visible if non-empty)
    const licenseContainer = document.getElementById('publicLicenseBox');
    if (licenseContainer) {
      if (settings.license_number && settings.license_number.trim()) {
        licenseContainer.style.display = 'block';
        const licenseVal = document.getElementById('publicLicenseValue');
        if (licenseVal) licenseVal.textContent = settings.license_number.trim();
      } else {
        licenseContainer.style.display = 'none';
      }
    }

    // Initialize Hero Background
    initHeroBackground(settings);
  } catch (e) {
    console.warn('Error loading dynamic settings:', e);
  }
}

// ==========================================
// HERO BACKGROUND CONTROLLER
// ==========================================
function initHeroBackground(settings) {
  const container = document.getElementById('heroVideoContainer');
  const video = document.getElementById('heroBgVideo');
  const overlay = document.getElementById('heroVideoOverlay');
  const controls = document.getElementById('heroVideoControls');
  const muteBtn = document.getElementById('heroVideoMuteBtn');
  const mutedIcon = document.getElementById('heroAudioMutedIcon');
  const unmutedIcon = document.getElementById('heroAudioUnmutedIcon');
  const audioLabel = document.getElementById('heroAudioLabel');

  if (!container || !video) return;

  const bgType = settings?.hero_bg_type || 'video';
  const videoUrl = settings?.hero_video_url || 'assets/videos/welcome-motors-luxury-car-pack.mp4';
  const posterUrl = settings?.hero_poster_url || 'assets/images/fortuner_legender.jpg';

  if (overlay) {
    overlay.style.background = `
      radial-gradient(ellipse at 50% 36%, rgba(255, 255, 255, 0.72) 0%, rgba(255, 255, 255, 0.45) 45%, rgba(255, 255, 255, 0.1) 75%, transparent 100%),
      linear-gradient(180deg, 
        rgba(15, 23, 42, 0.18) 0%, 
        rgba(255, 255, 255, 0.22) 15%, 
        rgba(255, 255, 255, 0.08) 45%, 
        rgba(255, 255, 255, 0.35) 75%, 
        #FFFFFF 100%
      )
    `;
  }

  if (posterUrl) {
    video.poster = posterUrl;
  }

  if (bgType === 'glow') {
    container.style.display = 'none';
    if (controls) controls.style.display = 'none';
    return;
  }

  container.style.display = 'block';

  if (videoUrl) {
    const currentSrc = video.currentSrc || video.src || '';
    if (!currentSrc.includes(videoUrl)) {
      video.src = videoUrl;
      video.load();
    }
    
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        video.classList.add('is-playing');
        if (controls) controls.style.display = 'block';
      }).catch(err => {
        console.warn('Autoplay note:', err.message);
        video.classList.add('is-playing');
        if (controls) controls.style.display = 'block';
      });
    }
  } else {
    video.classList.add('is-playing');
    if (controls) controls.style.display = 'none';
  }

  // Mute / Unmute Button Logic
  if (muteBtn && !muteBtn.dataset.bound) {
    muteBtn.dataset.bound = 'true';
    muteBtn.addEventListener('click', () => {
      video.muted = !video.muted;
      if (video.muted) {
        if (mutedIcon) mutedIcon.style.display = 'inline-block';
        if (unmutedIcon) unmutedIcon.style.display = 'none';
        if (audioLabel) audioLabel.textContent = 'Sound Off';
        muteBtn.title = 'Sound Muted (Click to Unmute)';
      } else {
        if (mutedIcon) mutedIcon.style.display = 'none';
        if (unmutedIcon) unmutedIcon.style.display = 'inline-block';
        if (audioLabel) audioLabel.textContent = 'Sound On';
        muteBtn.title = 'Sound Playing (Click to Mute)';
      }
    });
  }
}

// ==========================================
// STATISTICS COUNT-UP ANIMATION CONTROLLER
// ==========================================
function initStatsCounter() {
  const statsContainer = document.getElementById('heroStatsGrid');
  if (!statsContainer) return;

  const statElements = statsContainer.querySelectorAll('.stat-count-val');
  if (!statElements || statElements.length === 0) return;

  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let animated = false;

  const runCounterAnimation = () => {
    if (animated) return;
    animated = true;

    if (prefersReducedMotion) {
      statElements.forEach(el => {
        const target = parseFloat(el.getAttribute('data-target')) || 0;
        const format = el.getAttribute('data-format');
        const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
        const suffix = el.getAttribute('data-suffix') || '';
        if (decimals > 0) {
          el.innerHTML = `${target.toFixed(decimals)}<span class="highlight">${suffix}</span>`;
        } else if (format === 'comma') {
          el.innerHTML = `${target.toLocaleString()}<span class="highlight">${suffix}</span>`;
        } else {
          el.innerHTML = `${target}<span class="highlight">${suffix}</span>`;
        }
      });
      return;
    }

    const duration = 1600; // Smooth 1.6s duration
    const startTime = performance.now();

    const updateFrame = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Premium smooth cubic ease-out
      const easeOut = 1 - Math.pow(1 - progress, 3);

      statElements.forEach(el => {
        const target = parseFloat(el.getAttribute('data-target')) || 0;
        const format = el.getAttribute('data-format');
        const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
        const suffix = el.getAttribute('data-suffix') || '';
        const isHours = el.getAttribute('data-type') === 'hours';

        const currentVal = target * easeOut;

        if (decimals > 0) {
          const valStr = currentVal.toFixed(decimals);
          el.innerHTML = `${valStr}<span class="highlight">${suffix}</span>`;
        } else if (format === 'comma') {
          const rounded = Math.floor(currentVal);
          el.innerHTML = `${rounded.toLocaleString()}<span class="highlight">${suffix}</span>`;
        } else if (isHours) {
          const rounded = Math.floor(currentVal);
          if (progress < 1) {
            el.innerHTML = `${rounded}`;
          } else {
            el.innerHTML = `${target}<span class="highlight">${suffix}</span>`;
          }
        } else {
          const rounded = Math.floor(currentVal);
          el.innerHTML = `${rounded}<span class="highlight">${suffix}</span>`;
        }
      });

      if (progress < 1) {
        requestAnimationFrame(updateFrame);
      } else {
        // Guarantee final exact numbers
        statElements.forEach(el => {
          const target = parseFloat(el.getAttribute('data-target')) || 0;
          const format = el.getAttribute('data-format');
          const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
          const suffix = el.getAttribute('data-suffix') || '';
          if (decimals > 0) {
            el.innerHTML = `${target.toFixed(decimals)}<span class="highlight">${suffix}</span>`;
          } else if (format === 'comma') {
            el.innerHTML = `${target.toLocaleString()}<span class="highlight">${suffix}</span>`;
          } else {
            el.innerHTML = `${target}<span class="highlight">${suffix}</span>`;
          }
        });
      }
    };

    requestAnimationFrame(updateFrame);
  };

  // IntersectionObserver to trigger once when entering viewport
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          runCounterAnimation();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    observer.observe(statsContainer);
  } else {
    runCounterAnimation();
  }
}

// ==========================================
// FEATURED VEHICLES SECTION
// ==========================================
async function loadFeaturedVehicles() {
  const container = document.getElementById('featuredVehiclesGrid');
  const section = document.getElementById('featuredSection');
  if (!container) return;

  try {
    const all = await window.dbService.getVehicles();
    const featured = all.filter(v => v.featured);

    if (featured.length === 0) {
      if (section) section.style.display = 'none';
      return;
    }

    if (section) section.style.display = 'block';
    container.innerHTML = featured.map((v, idx) => renderVehicleCard(v, idx)).join('');
  } catch (err) {
    console.error('Error loading featured vehicles:', err);
  }
}

// ==========================================
// MAIN INVENTORY SYSTEM & FILTERS
// ==========================================
let currentFilterOptions = {
  keyword: '',
  category: 'all',
  brand: '',
  condition: '',
  fuelType: '',
  transmission: '',
  minPrice: '',
  maxPrice: '',
  sort: 'newest'
};

let currentViewMode = 'grid';

async function loadInventory() {
  const container = document.getElementById('inventoryGrid');
  const countBadge = document.getElementById('inventoryCount');
  if (!container) return;

  // Apply View Mode Class
  if (currentViewMode === 'list') {
    container.classList.add('list-mode');
  } else {
    container.classList.remove('list-mode');
  }

  container.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 0;">
      <div style="display: inline-block; width: 36px; height: 36px; border: 3px solid rgba(220,38,38,0.2); border-top-color: #DC2626; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
      <p style="color: #6B7280; margin-top: 1rem; font-size: 0.9375rem;">Loading showroom inventory...</p>
    </div>
  `;

  try {
    const allVehicles = await window.dbService.getVehicles();
    updateCategoryCounts(allVehicles);

    const vehicles = await window.dbService.getVehicles(currentFilterOptions);
    
    if (countBadge) {
      countBadge.innerHTML = `Showing <strong>${vehicles.length}</strong> verified showroom vehicles`;
    }

    if (vehicles.length === 0) {
      container.innerHTML = `
        <div class="inventory-empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon-box">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
          </div>
          <h3 class="empty-title">No Vehicles Found</h3>
          <p class="empty-desc">No vehicles match your search filters. Contact Arslan Farooq directly or reset your filters!</p>
          <button class="btn btn-outline btn-sm" onclick="resetFilters()">Reset All Filters</button>
        </div>
      `;
      return;
    }

    container.innerHTML = vehicles.map((v, idx) => renderVehicleCard(v, idx)).join('');
  } catch (err) {
    console.error('Error loading inventory:', err);
    container.innerHTML = `<p style="color: #DC2626; text-align: center; grid-column: 1 / -1;">Unable to load inventory. Please refresh or try again.</p>`;
  }
}

// Update Category Count Badges
function updateCategoryCounts(all) {
  if (!Array.isArray(all)) return;

  const total = all.length;
  const suvCount = all.filter(v => (v.category === 'suv' || (v.body_type && v.body_type.toLowerCase().includes('suv')) || (v.body_type && v.body_type.toLowerCase().includes('4x4')))).length;
  const sedanCount = all.filter(v => (v.category === 'sedan' || (v.body_type && v.body_type.toLowerCase().includes('sedan')))).length;
  const evCount = all.filter(v => (v.category === 'hybrid_ev' || (v.fuel_type && (v.fuel_type.toLowerCase() === 'hybrid' || v.fuel_type.toLowerCase() === 'electric')))).length;
  const importCount = all.filter(v => ((v.assembly && v.assembly.toLowerCase() === 'imported') || (v.condition && v.condition.toLowerCase().includes('unregistered')))).length;

  const elAll = document.getElementById('catCountAll');
  const elSuv = document.getElementById('catCountSuv');
  const elSedan = document.getElementById('catCountSedan');
  const elEv = document.getElementById('catCountEv');
  const elImport = document.getElementById('catCountImport');

  if (elAll) elAll.textContent = total;
  if (elSuv) elSuv.textContent = suvCount;
  if (elSedan) elSedan.textContent = sedanCount;
  if (elEv) elEv.textContent = evCount;
  if (elImport) elImport.textContent = importCount;
}

// ==============================================================================
// SEHGAL MOTORSPORTS INSPIRED VEHICLE CARD TEMPLATE
// Clean White Card | Vehicle Image | Vehicle Name | Red Price | Red Call Now Button
// ==============================================================================
function renderVehicleCard(v, idx = 0) {
  const mainImage = (v.images && v.images.length > 0) ? v.images[0] : 'assets/images/fortuner_legender.jpg';
  const priceFormatted = v.price ? `Rs.${Number(v.price).toLocaleString()}` : 'Price on Call';
  const priceDisplayCrore = APP_CONFIG.formatPKR(v.price);
  const status = (v.status || 'available').toLowerCase();

  const statusLabels = {
    available: 'Available',
    reserved: 'Reserved',
    sold: 'Sold'
  };

  // Build full vehicle name in Sehgal Motorsports style: e.g. "Toyota Hilux Vigo Invincible 2013"
  const vehicleFullName = `${v.brand || ''} ${v.model || ''} ${v.variant || ''} ${v.year || ''}`.replace(/\s+/g, ' ').trim();
  const phone = APP_CONFIG.brand.phoneRaw || '03133884499';
  const callUrl = `tel:${phone}`;
  const currentUrl = `${window.location.origin}/vehicle.html?id=${v.id}`;
  const waLink = APP_CONFIG.generateWhatsAppLink(v, currentUrl);

  return `
    <div class="vehicle-card" id="car-${v.id}" style="--card-stagger: ${idx % 12};">
      <div class="vehicle-image-box">
        <a href="vehicle.html?id=${v.id}" class="vehicle-card-img-link" title="View details for ${vehicleFullName}">
          <div class="vehicle-image-badges-top">
            ${v.featured ? `
              <div class="featured-pill">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                <span>Featured</span>
              </div>
            ` : `
              <div class="badge-verified-seal">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Verified</span>
              </div>
            `}
            <span class="status-badge ${status}">${statusLabels[status] || status}</span>
          </div>

          <img src="${mainImage}" alt="${vehicleFullName}" class="vehicle-card-img" loading="lazy" onerror="this.src='assets/images/fortuner_legender.jpg'">
        </a>
      </div>

      <div class="vehicle-content">
        <h3 class="vehicle-title">
          <a href="vehicle.html?id=${v.id}" class="vehicle-title-link" title="${vehicleFullName}">
            ${vehicleFullName}
          </a>
        </h3>

        <div class="vehicle-price-container">
          <span class="vehicle-price-main">${priceFormatted}</span>
          ${priceDisplayCrore && !priceDisplayCrore.includes('Price on Call') ? `
            <span class="vehicle-price-sub">(${priceDisplayCrore})</span>
          ` : ''}
        </div>

        <a href="${callUrl}" class="btn-call-now" title="Call Showroom (0313-3884499)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          <span>Call Now</span>
        </a>

        <div class="vehicle-card-sub-actions">
          <a href="vehicle.html?id=${v.id}" class="vehicle-sub-link">
            <span>View Specs</span>
          </a>
          <a href="${waLink}" target="_blank" rel="noopener" class="vehicle-sub-link wa-sub">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.07-1.115-.067-.282-.091-.643-.231-1.109-.434-1.957-.852-3.232-2.827-3.33-2.957-.099-.13-1.025-1.36-1.025-2.593 0-1.233.647-1.84.877-2.091.229-.251.5-.313.667-.313.167 0 .334.002.48.009.153.007.359-.058.56.425.209.502.712 1.737.775 1.863.063.126.104.273.021.439-.083.166-.125.27-.249.416-.125.147-.263.328-.376.44-.125.126-.255.263-.11.512.146.25 1.488 1.488 2.87 2.062.25.104.396.084.542-.084.146-.167.625-.729.792-.979.167-.25.334-.209.563-.125.23.084 1.46.688 1.71.813.25.125.417.188.479.292.063.104.063.604-.081 1.009z"/></svg>
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// CATEGORY & BRAND SELECTION HANDLERS
// ==========================================
function selectCategory(cat, btn) {
  currentFilterOptions.category = cat;
  
  document.querySelectorAll('.category-tab-btn').forEach(el => el.classList.remove('active'));
  if (btn) btn.classList.add('active');

  loadInventory();
}

function selectBrandPill(brand, btn) {
  currentFilterOptions.brand = brand;
  
  const brandSelect = document.getElementById('filterBrand');
  if (brandSelect) brandSelect.value = brand;

  document.querySelectorAll('.brand-pill-btn').forEach(el => el.classList.remove('active'));
  if (btn) btn.classList.add('active');

  loadInventory();
}

function setViewMode(mode) {
  currentViewMode = mode;
  
  const btnGrid = document.getElementById('viewModeGrid');
  const btnList = document.getElementById('viewModeList');

  if (mode === 'list') {
    btnList?.classList.add('active');
    btnGrid?.classList.remove('active');
  } else {
    btnGrid?.classList.add('active');
    btnList?.classList.remove('active');
  }

  loadInventory();
}

// ==========================================
// QUICK VIEW MODAL LOGIC
// ==========================================
async function openQuickView(id) {
  const modal = document.getElementById('quickViewModal');
  const content = document.getElementById('quickViewContent');
  if (!modal || !content) return;

  modal.classList.add('active');
  document.body.classList.add('no-scroll');

  content.innerHTML = `
    <div style="text-align: center; padding: 4rem 0;">
      <div style="display: inline-block; width: 36px; height: 36px; border: 3px solid rgba(220,38,38,0.2); border-top-color: #DC2626; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
      <p style="color: #6B7280; margin-top: 1rem;">Loading vehicle preview...</p>
    </div>
  `;

  try {
    const v = await window.dbService.getVehicleById(id);
    if (!v) {
      content.innerHTML = `<p style="padding: 2rem; color: #DC2626; text-align: center;">Vehicle details not found.</p>`;
      return;
    }

    const images = Array.isArray(v.images) && v.images.length > 0 ? v.images : ['assets/images/fortuner_legender.jpg'];
    const priceDisplay = APP_CONFIG.formatPKR(v.price);
    const fullPriceDisplay = APP_CONFIG.formatFullPKR(v.price);
    const waLink = APP_CONFIG.generateWhatsAppLink(v, `${window.location.origin}/vehicle.html?id=${v.id}`);

    content.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; padding: 2rem;" class="quick-view-grid-layout">
        <div>
          <div class="gallery-container">
            <div class="gallery-main-view">
              <img id="quickViewMainImg" src="${images[0]}" alt="${v.brand} ${v.model}" class="gallery-main-img" onerror="this.src='assets/images/fortuner_legender.jpg'">
            </div>
            ${images.length > 1 ? `
              <div class="gallery-thumbnails-row">
                ${images.map((img, idx) => `
                  <div class="gallery-thumb ${idx === 0 ? 'active' : ''}" onclick="switchQuickViewThumb('${img}', this)">
                    <img src="${img}" alt="Thumbnail ${idx + 1}" onerror="this.src='assets/images/fortuner_legender.jpg'">
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </div>

        <div>
          <div style="font-size: 0.8125rem; font-weight: 800; color: #DC2626; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.35rem;">
            ${v.year} • ${v.brand}
          </div>
          <h2 style="font-family: var(--font-heading); font-size: 1.75rem; font-weight: 900; color: #111827; line-height: 1.2; margin-bottom: 0.35rem;">
            ${v.model}
          </h2>
          ${v.variant ? `<p style="color: #4B5563; font-size: 0.95rem; margin-bottom: 1.25rem;">${v.variant}</p>` : ''}

          <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem;">
            <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #6B7280; margin-bottom: 0.25rem;">Demand Price</div>
            <div style="font-family: var(--font-heading); font-size: 1.85rem; font-weight: 900; color: #DC2626;">${priceDisplay}</div>
            <div style="font-size: 0.8125rem; color: #4B5563;">${fullPriceDisplay}</div>
          </div>

          <div class="spec-table-grid" style="margin: 1.25rem 0; grid-template-columns: repeat(2, 1fr);">
            <div class="spec-box-item">
              <div class="spec-box-label">Mileage</div>
              <div class="spec-box-val">${v.mileage ? `${Number(v.mileage).toLocaleString()} KM` : 'Brand New'}</div>
            </div>
            <div class="spec-box-item">
              <div class="spec-box-label">Transmission</div>
              <div class="spec-box-val">${v.transmission || 'Automatic'}</div>
            </div>
            <div class="spec-box-item">
              <div class="spec-box-label">Engine Capacity</div>
              <div class="spec-box-val">${v.engine_capacity || 'N/A'}</div>
            </div>
            <div class="spec-box-item">
              <div class="spec-box-label">Registration</div>
              <div class="spec-box-val">${v.registration_city || 'Islamabad'}</div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 1.75rem;">
            <a href="vehicle.html?id=${v.id}" class="btn btn-outline">
              <span>Full Details</span>
            </a>
            <a href="${waLink}" target="_blank" rel="noopener" class="btn btn-whatsapp">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.07-1.115-.067-.282-.091-.643-.231-1.109-.434-1.957-.852-3.232-2.827-3.33-2.957-.099-.13-1.025-1.36-1.025-2.593 0-1.233.647-1.84.877-2.091.229-.251.5-.313.667-.313.167 0 .334.002.48.009.153.007.359-.058.56.425.209.502.712 1.737.775 1.863.063.126.104.273.021.439-.083.166-.125.27-.249.416-.125.147-.263.328-.376.44-.125.126-.255.263-.11.512.146.25 1.488 1.488 2.87 2.062.25.104.396.084.542-.084.146-.167.625-.729.792-.979.167-.25.334-.209.563-.125.23.084 1.46.688 1.71.813.25.125.417.188.479.292.063.104.063.604-.081 1.009z"/></svg>
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Error opening quick view:', err);
  }
}

function switchQuickViewThumb(src, el) {
  const main = document.getElementById('quickViewMainImg');
  if (main) main.src = src;

  document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
}

function closeQuickViewModal() {
  const modal = document.getElementById('quickViewModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.classList.remove('no-scroll');
  }
}

// Close modal on click outside
window.addEventListener('click', (e) => {
  const modal = document.getElementById('quickViewModal');
  if (e.target === modal) {
    closeQuickViewModal();
  }
});

// Close modal on Escape key
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeQuickViewModal();
  }
});

// ==========================================
// FILTER HANDLERS
// ==========================================
function applyFilters() {
  const brandEl = document.getElementById('filterBrand');
  const keywordEl = document.getElementById('filterKeyword');
  const conditionEl = document.getElementById('filterCondition');
  const fuelEl = document.getElementById('filterFuel');
  const transEl = document.getElementById('filterTransmission');
  const minPriceEl = document.getElementById('filterMinPrice');
  const maxPriceEl = document.getElementById('filterMaxPrice');
  const sortEl = document.getElementById('filterSort');

  currentFilterOptions = {
    ...currentFilterOptions,
    keyword: keywordEl ? keywordEl.value.trim() : '',
    brand: brandEl ? brandEl.value : '',
    condition: conditionEl ? conditionEl.value : '',
    fuelType: fuelEl ? fuelEl.value : '',
    transmission: transEl ? transEl.value : '',
    minPrice: minPriceEl ? minPriceEl.value : '',
    maxPrice: maxPriceEl ? maxPriceEl.value : '',
    sort: sortEl ? sortEl.value : 'newest'
  };

  // Sync brand pills UI
  document.querySelectorAll('.brand-pill-btn').forEach(btn => {
    if (btn.dataset.brand === currentFilterOptions.brand) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  loadInventory();
}

function resetFilters() {
  const form = document.getElementById('inventoryFilterForm');
  if (form) form.reset();

  currentFilterOptions = {
    keyword: '',
    category: 'all',
    brand: '',
    condition: '',
    fuelType: '',
    transmission: '',
    minPrice: '',
    maxPrice: '',
    sort: 'newest'
  };

  // Reset category tabs & brand pills active state
  document.querySelectorAll('.category-tab-btn').forEach((btn, idx) => {
    if (idx === 0) btn.classList.add('active');
    else btn.classList.remove('active');
  });

  document.querySelectorAll('.brand-pill-btn').forEach((btn, idx) => {
    if (idx === 0) btn.classList.add('active');
    else btn.classList.remove('active');
  });

  loadInventory();
}

function handleHeroSearch(e) {
  if (e) e.preventDefault();
  const searchBrand = document.getElementById('heroSearchBrand')?.value || '';
  const searchBudget = document.getElementById('heroSearchBudget')?.value || '';
  const searchYear = document.getElementById('heroSearchYear')?.value || '';

  currentFilterOptions.brand = searchBrand;
  if (searchBudget) {
    currentFilterOptions.maxPrice = searchBudget;
  }
  if (searchYear) {
    currentFilterOptions.minYear = searchYear;
  }

  // Update filter controls in inventory section
  const brandEl = document.getElementById('filterBrand');
  if (brandEl && searchBrand) brandEl.value = searchBrand;

  // Scroll smoothly to inventory section
  const invSection = document.getElementById('inventory');
  if (invSection) {
    invSection.scrollIntoView({ behavior: 'smooth' });
  }

  loadInventory();
}

// ==========================================
// CONTACT FORM SUBMISSION
// ==========================================
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = `<span>Sending...</span>`;

    const inquiry = {
      customer_name: form.elements['name'].value.trim(),
      customer_phone: form.elements['phone'].value.trim(),
      customer_email: form.elements['email']?.value.trim() || null,
      message: form.elements['message'].value.trim()
    };

    try {
      await window.dbService.submitInquiry(inquiry);
      showToast('Thank you! Your message has been received. Arslan Farooq will contact you shortly.');
      form.reset();
    } catch (err) {
      showToast('Error submitting form. Please call or WhatsApp us directly at 0313-3884499.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  });
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(message) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

// Expose globals
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;
window.handleHeroSearch = handleHeroSearch;
window.selectCategory = selectCategory;
window.selectBrandPill = selectBrandPill;
window.setViewMode = setViewMode;
window.openQuickView = openQuickView;
window.closeQuickViewModal = closeQuickViewModal;
window.switchQuickViewThumb = switchQuickViewThumb;
window.showToast = showToast;
