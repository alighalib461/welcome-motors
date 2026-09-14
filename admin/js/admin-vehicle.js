/**
 * WELCOME MOTOR - Admin Vehicle Form Controller (Add & Edit)
 * Handles Required + Optional fields, multi-image upload & Supabase syncing
 */

let uploadedImages = [];
let currentVehicleId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  currentVehicleId = urlParams.get('id');

  initImageUploader();

  if (currentVehicleId) {
    // Edit mode
    await loadVehicleForEdit(currentVehicleId);
  }
});

// ==========================================
// IMAGE UPLOADER (DROPZONE & URL)
// ==========================================
function initImageUploader() {
  const dropzone = document.getElementById('imageDropzone');
  const fileInput = document.getElementById('vehicleFileInput');

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = '#DC2626';
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.style.borderColor = 'rgba(220, 38, 38, 0.35)';
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'rgba(220, 38, 38, 0.35)';
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileSelection(e.dataTransfer.files);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileSelection(e.target.files);
      }
    });
  }
}

async function handleFileSelection(fileList) {
  const files = Array.from(fileList);
  const statusEl = document.getElementById('imageUploadStatus');
  if (statusEl) statusEl.textContent = `Uploading ${files.length} images...`;

  for (const file of files) {
    try {
      const url = await window.dbService.uploadVehicleImage(file);
      if (url && !uploadedImages.includes(url)) {
        uploadedImages.push(url);
      }
    } catch (err) {
      console.error('Image upload failed:', err);
    }
  }

  if (statusEl) statusEl.textContent = '';
  renderImagePreviews();
}

function addImageUrl() {
  const urlInput = document.getElementById('manualImageUrlInput');
  if (!urlInput) return;
  const url = urlInput.value.trim();
  if (url && !uploadedImages.includes(url)) {
    uploadedImages.push(url);
    urlInput.value = '';
    renderImagePreviews();
  }
}

function removeImage(index) {
  uploadedImages.splice(index, 1);
  renderImagePreviews();
}

function renderImagePreviews() {
  const container = document.getElementById('imagePreviewGrid');
  if (!container) return;

  if (uploadedImages.length === 0) {
    container.innerHTML = `<p style="grid-column: 1 / -1; color: #9CA3AF; font-size: 0.8125rem;">No images uploaded yet. Please add at least 1 image.</p>`;
    return;
  }

  container.innerHTML = uploadedImages.map((img, idx) => `
    <div class="image-preview-item">
      <img src="${img}" alt="Preview ${idx + 1}" onerror="this.src='../assets/images/fortuner_legender.jpg'">
      <button type="button" class="image-remove-btn" onclick="removeImage(${idx})" title="Remove">✕</button>
      ${idx === 0 ? '<span style="position: absolute; bottom: 4px; left: 4px; background: rgba(220,38,38,0.9); font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; color: #fff;">MAIN</span>' : ''}
    </div>
  `).join('');
}

// ==========================================
// LOAD VEHICLE FOR EDIT
// ==========================================
async function loadVehicleForEdit(id) {
  try {
    const vehicle = await window.dbService.getVehicleById(id);
    if (!vehicle) {
      alert('Vehicle not found.');
      window.location.href = 'inventory.html';
      return;
    }

    const form = document.getElementById('vehicleForm');
    if (!form) return;

    // Required fields
    form.elements['brand'].value = vehicle.brand || '';
    form.elements['model'].value = vehicle.model || '';
    form.elements['year'].value = vehicle.year || '';
    form.elements['price'].value = vehicle.price || '';
    form.elements['status'].value = vehicle.status || 'available';

    // Optional fields
    if (form.elements['variant']) form.elements['variant'].value = vehicle.variant || '';
    if (form.elements['mileage']) form.elements['mileage'].value = vehicle.mileage || '';
    if (form.elements['fuel_type']) form.elements['fuel_type'].value = vehicle.fuel_type || '';
    if (form.elements['transmission']) form.elements['transmission'].value = vehicle.transmission || '';
    if (form.elements['engine_capacity']) form.elements['engine_capacity'].value = vehicle.engine_capacity || '';
    if (form.elements['color']) form.elements['color'].value = vehicle.color || '';
    if (form.elements['registration_city']) form.elements['registration_city'].value = vehicle.registration_city || '';
    if (form.elements['condition']) form.elements['condition'].value = vehicle.condition || '';
    if (form.elements['assembly']) form.elements['assembly'].value = vehicle.assembly || '';
    if (form.elements['owners_count']) form.elements['owners_count'].value = vehicle.owners_count || '';
    if (form.elements['description']) form.elements['description'].value = vehicle.description || '';
    if (form.elements['featured']) form.elements['featured'].checked = Boolean(vehicle.featured);

    // Features
    if (Array.isArray(vehicle.features) && form.elements['features']) {
      form.elements['features'].value = vehicle.features.join(', ');
    }
    if (Array.isArray(vehicle.safety_features) && form.elements['safety_features']) {
      form.elements['safety_features'].value = vehicle.safety_features.join(', ');
    }

    // Images
    uploadedImages = Array.isArray(vehicle.images) ? [...vehicle.images] : [];
    renderImagePreviews();

  } catch (err) {
    console.error('Error loading vehicle for edit:', err);
  }
}

// ==========================================
// FORM SUBMIT (CREATE OR UPDATE)
// ==========================================
async function handleVehicleFormSubmit(e) {
  e.preventDefault();
  const form = document.getElementById('vehicleForm');
  const btn = document.getElementById('saveVehicleBtn');
  const errorBox = document.getElementById('formErrorAlert');

  errorBox.style.display = 'none';

  // Validation
  if (uploadedImages.length === 0) {
    errorBox.textContent = 'Please upload at least 1 image for the vehicle.';
    errorBox.style.display = 'block';
    errorBox.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  const brand = form.elements['brand'].value.trim();
  const model = form.elements['model'].value.trim();
  const year = form.elements['year'].value.trim();
  const price = form.elements['price'].value.trim();
  const status = form.elements['status'].value;

  if (!brand || !model || !year || !price) {
    errorBox.textContent = 'Please fill all required fields (Brand, Model, Year, Price).';
    errorBox.style.display = 'block';
    return;
  }

  // Parse Features & Safety tags
  const rawFeatures = form.elements['features'] ? form.elements['features'].value : '';
  const featuresList = rawFeatures.split(',').map(f => f.trim()).filter(Boolean);

  const rawSafety = form.elements['safety_features'] ? form.elements['safety_features'].value : '';
  const safetyList = rawSafety.split(',').map(s => s.trim()).filter(Boolean);

  const vehiclePayload = {
    brand: brand,
    model: model,
    year: Number(year),
    price: Number(price),
    status: status,
    images: uploadedImages,
    
    // Optional Fields (stored as null if empty)
    variant: form.elements['variant']?.value.trim() || null,
    mileage: form.elements['mileage']?.value ? Number(form.elements['mileage'].value) : null,
    fuel_type: form.elements['fuel_type']?.value || null,
    transmission: form.elements['transmission']?.value || null,
    engine_capacity: form.elements['engine_capacity']?.value.trim() || null,
    color: form.elements['color']?.value.trim() || null,
    registration_city: form.elements['registration_city']?.value.trim() || null,
    condition: form.elements['condition']?.value || null,
    assembly: form.elements['assembly']?.value || null,
    owners_count: form.elements['owners_count']?.value.trim() || null,
    description: form.elements['description']?.value.trim() || null,
    features: featuresList,
    safety_features: safetyList,
    featured: Boolean(form.elements['featured']?.checked)
  };

  btn.disabled = true;
  btn.innerHTML = `<span>Saving to Supabase...</span>`;

  try {
    if (currentVehicleId) {
      await window.dbService.updateVehicle(currentVehicleId, vehiclePayload);
    } else {
      await window.dbService.createVehicle(vehiclePayload);
    }

    window.location.href = 'inventory.html';
  } catch (err) {
    errorBox.textContent = 'Error saving vehicle: ' + err.message;
    errorBox.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span>Save Vehicle to Showroom</span>`;
  }
}

window.addImageUrl = addImageUrl;
window.removeImage = removeImage;
window.handleVehicleFormSubmit = handleVehicleFormSubmit;
