/**
 * WELCOME MOTOR - Dedicated Vehicle Detail Controller
 * Manages gallery, specifications with conditional field hiding, WhatsApp, and call triggers
 * Theme: Clean White Background + Welcome Motors Logo Red + High-Contrast Black Typography
 */

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const vehicleId = urlParams.get('id');

  if (!vehicleId) {
    renderNotFound('No vehicle specified. Please browse our inventory.');
    return;
  }

  await loadVehicleDetails(vehicleId);
});

async function loadVehicleDetails(id) {
  const container = document.getElementById('vehicleDetailContainer');
  if (!container) return;

  try {
    const vehicle = await window.dbService.getVehicleById(id);
    if (!vehicle) {
      renderNotFound('The requested vehicle could not be found in our showroom inventory.');
      return;
    }

    // Set Page Title
    document.title = `${vehicle.year} ${vehicle.brand} ${vehicle.model} ${vehicle.variant || ''} | Welcome Motor`;

    // Process Images
    const images = Array.isArray(vehicle.images) && vehicle.images.length > 0 
      ? vehicle.images 
      : ['assets/images/fortuner_legender.jpg'];
    
    const mainImgSrc = images[0];
    const priceDisplay = APP_CONFIG.formatPKR(vehicle.price);
    const fullPriceDisplay = APP_CONFIG.formatFullPKR(vehicle.price);
    const priceFormattedNumber = vehicle.price ? `Rs.${Number(vehicle.price).toLocaleString()}` : 'Price on Call';
    const status = (vehicle.status || 'available').toLowerCase();
    const currentUrl = window.location.href;
    const waLink = APP_CONFIG.generateWhatsAppLink(vehicle, currentUrl);

    // Build Specs Array with CONDITIONAL DISPLAY (only non-empty fields)
    const specs = [
      { label: 'Brand', value: vehicle.brand },
      { label: 'Model', value: vehicle.model },
      { label: 'Model Year', value: vehicle.year },
      { label: 'Variant', value: vehicle.variant },
      { label: 'Condition', value: vehicle.condition },
      { label: 'Mileage', value: vehicle.mileage ? `${Number(vehicle.mileage).toLocaleString()} KM` : null },
      { label: 'Transmission', value: vehicle.transmission },
      { label: 'Fuel Type', value: vehicle.fuel_type },
      { label: 'Engine Capacity', value: vehicle.engine_capacity },
      { label: 'Exterior Color', value: vehicle.color },
      { label: 'Registration City', value: vehicle.registration_city },
      { label: 'Assembly', value: vehicle.assembly },
      { label: 'Ownership', value: vehicle.owners_count }
    ].filter(s => s.value !== null && s.value !== undefined && s.value !== '');

    // Features & Safety (filter empty)
    const features = Array.isArray(vehicle.features) ? vehicle.features.filter(f => f && f.trim()) : [];
    const safety = Array.isArray(vehicle.safety_features) ? vehicle.safety_features.filter(s => s && s.trim()) : [];

    container.innerHTML = `
      <div class="container" style="padding-top: 2rem; padding-bottom: 5rem;">
        <!-- Breadcrumbs -->
        <nav style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #6B7280; margin-bottom: 2rem;">
          <a href="index.html" style="color: #6B7280; text-decoration: none;">Home</a>
          <span>/</span>
          <a href="index.html#inventory" style="color: #6B7280; text-decoration: none;">Inventory</a>
          <span>/</span>
          <span style="color: #111827; font-weight: 600;">${vehicle.year} ${vehicle.brand} ${vehicle.model}</span>
        </nav>

        <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 3rem; align-items: start;" class="vehicle-detail-layout">
          <!-- LEFT: IMAGE GALLERY -->
          <div>
            <div class="gallery-container">
              <div class="gallery-main-view">
                <img id="mainGalleryImage" src="${mainImgSrc}" alt="${vehicle.brand} ${vehicle.model}" class="gallery-main-img" onerror="this.src='assets/images/fortuner_legender.jpg'">
              </div>
              ${images.length > 1 ? `
                <div class="gallery-thumbnails-row">
                  ${images.map((img, idx) => `
                    <div class="gallery-thumb ${idx === 0 ? 'active' : ''}" onclick="switchGalleryImage('${img}', this)">
                      <img src="${img}" alt="Thumbnail ${idx + 1}" onerror="this.src='assets/images/fortuner_legender.jpg'">
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>

            <!-- Description (Only if non-empty) -->
            ${vehicle.description && vehicle.description.trim() ? `
              <div style="background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 16px; padding: 2rem; margin-top: 2rem; box-shadow: var(--shadow-sm);">
                <h3 style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 800; color: #111827; margin-bottom: 1rem;">Vehicle Overview</h3>
                <p style="color: #4B5563; line-height: 1.7; font-size: 0.95rem; white-space: pre-line;">${vehicle.description}</p>
              </div>
            ` : ''}

            <!-- Key Features (Only if available) -->
            ${features.length > 0 ? `
              <div style="background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 16px; padding: 2rem; margin-top: 2rem; box-shadow: var(--shadow-sm);">
                <h3 style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 800; color: #111827; margin-bottom: 1rem;">Key Comfort & Styling Features</h3>
                <div class="feature-tags-list">
                  ${features.map(f => `
                    <span class="feature-tag-chip">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      ${f}
                    </span>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Safety Features (Only if available) -->
            ${safety.length > 0 ? `
              <div style="background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 16px; padding: 2rem; margin-top: 2rem; box-shadow: var(--shadow-sm);">
                <h3 style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 800; color: #111827; margin-bottom: 1rem;">Safety & Driver Assistance</h3>
                <div class="feature-tags-list">
                  ${safety.map(s => `
                    <span class="feature-tag-chip">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                      ${s}
                    </span>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>

          <!-- RIGHT: SPECS & BUYER ACTIONS -->
          <div>
            <div style="background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 20px; padding: 2.25rem; box-shadow: var(--shadow-md); position: sticky; top: 100px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
                <span style="font-size: 0.8125rem; font-weight: 800; text-transform: uppercase; color: #DC2626; letter-spacing: 0.08em;">${vehicle.year} ${vehicle.brand}</span>
                <span class="status-badge ${status}">${status.toUpperCase()}</span>
              </div>

              <h1 style="font-family: var(--font-heading); font-size: 2.1rem; font-weight: 900; color: #111827; line-height: 1.2; margin-bottom: 1rem;">
                ${vehicle.model} ${vehicle.variant ? `<span style="font-size: 1.4rem; color: #6B7280; font-weight: 600;">${vehicle.variant}</span>` : ''}
              </h1>

              <div style="padding: 1.25rem 0; border-top: 1px solid #E5E7EB; border-bottom: 1px solid #E5E7EB; margin-bottom: 1.75rem;">
                <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #6B7280; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Demand Price</div>
                <div style="display: flex; align-items: baseline; gap: 0.75rem; flex-wrap: wrap;">
                  <span style="font-family: var(--font-heading); font-size: 2.2rem; font-weight: 900; color: #DC2626;">${priceFormattedNumber}</span>
                  ${priceDisplay !== fullPriceDisplay ? `<span style="color: #4B5563; font-size: 0.95rem; font-weight: 600;">(${priceDisplay})</span>` : ''}
                </div>
              </div>

              <!-- SPECIFICATION GRID -->
              <h4 style="font-family: var(--font-heading); font-size: 0.9375rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #111827; margin-bottom: 1rem;">Specifications</h4>
              <div class="spec-table-grid">
                ${specs.map(s => `
                  <div class="spec-box-item">
                    <div class="spec-box-label">${s.label}</div>
                    <div class="spec-box-val">${s.value}</div>
                  </div>
                `).join('')}
              </div>

              <!-- ACTION BUTTONS -->
              <div style="display: flex; flex-direction: column; gap: 0.85rem; margin-top: 2rem;">
                <a href="tel:03133884499" class="btn btn-primary btn-lg btn-block" style="font-size: 1.05rem;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  <span>Call Showroom (0313-3884499)</span>
                </a>

                <a href="${waLink}" target="_blank" rel="noopener" class="btn btn-whatsapp btn-lg btn-block" style="font-size: 1.05rem;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.07-1.115-.067-.282-.091-.643-.231-1.109-.434-1.957-.852-3.232-2.827-3.33-2.957-.099-.13-1.025-1.36-1.025-2.593 0-1.233.647-1.84.877-2.091.229-.251.5-.313.667-.313.167 0 .334.002.48.009.153.007.359-.058.56.425.209.502.712 1.737.775 1.863.063.126.104.273.021.439-.083.166-.125.27-.249.416-.125.147-.263.328-.376.44-.125.126-.255.263-.11.512.146.25 1.488 1.488 2.87 2.062.25.104.396.084.542-.084.146-.167.625-.729.792-.979.167-.25.334-.209.563-.125.23.084 1.46.688 1.71.813.25.125.417.188.479.292.063.104.063.604-.081 1.009z"/></svg>
                  <span>Inquire on WhatsApp</span>
                </a>
              </div>

              <!-- DEALER TRUST BADGE -->
              <div style="background: rgba(220,38,38,0.06); border: 1px solid rgba(220,38,38,0.2); border-radius: 12px; padding: 1.15rem; margin-top: 1.5rem; text-align: center;">
                <div style="font-weight: 800; font-size: 0.9375rem; color: #111827; margin-bottom: 0.25rem;">WELCOME MOTOR • Rawalpindi Stadium</div>
                <div style="font-size: 0.8125rem; color: #4B5563;">17 Years of Trust • 2,179+ Cars Sold • Open 24/7</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Error rendering vehicle details:', err);
    renderNotFound('An error occurred while loading this vehicle.');
  }
}

function switchGalleryImage(src, thumbElement) {
  const main = document.getElementById('mainGalleryImage');
  if (main) {
    main.src = src;
  }
  document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
  if (thumbElement) {
    thumbElement.classList.add('active');
  }
}

function renderNotFound(message) {
  const container = document.getElementById('vehicleDetailContainer');
  if (!container) return;
  container.innerHTML = `
    <div class="container" style="padding: 6rem 1.5rem; text-align: center;">
      <div style="width: 80px; height: 80px; border-radius: 50%; background: rgba(220,38,38,0.08); color: #DC2626; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      </div>
      <h2 style="font-family: var(--font-heading); font-size: 2rem; font-weight: 800; color: #111827; margin-bottom: 0.75rem;">Vehicle Not Found</h2>
      <p style="color: #6B7280; max-width: 500px; margin: 0 auto 2rem; font-size: 1rem;">${message}</p>
      <a href="index.html#inventory" class="btn btn-primary btn-lg">Browse Showroom Inventory</a>
    </div>
  `;
}

window.switchGalleryImage = switchGalleryImage;
