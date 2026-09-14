/**
 * WELCOME MOTOR - Admin Settings Controller
 * Dealership business profile, Hero Video background & database sync
 */

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettingsForm();
  initVideoUploader();
});

async function loadSettingsForm() {
  try {
    const settings = await window.dbService.getSettings();
    const form = document.getElementById('settingsForm');
    if (!form || !settings) return;

    form.elements['dealership_name'].value = settings.dealership_name || 'WELCOME MOTOR';
    form.elements['owner_name'].value = settings.owner_name || 'Arslan Farooq';
    form.elements['tagline'].value = settings.tagline || '17 Years of Trust. 2,179 Cars Driven Home.';
    form.elements['phone'].value = settings.phone || '0313-3884499';
    form.elements['whatsapp'].value = settings.whatsapp || '0313-3884499';
    form.elements['address'].value = settings.address || '';
    form.elements['google_maps_url'].value = settings.google_maps_url || '';
    form.elements['years_experience'].value = settings.years_experience || 17;
    form.elements['cars_sold'].value = settings.cars_sold || 2179;
    form.elements['google_rating'].value = settings.google_rating || 4.8;
    form.elements['opening_hours'].value = settings.opening_hours || 'Open 24/7';
    form.elements['license_number'].value = settings.license_number || '';

    // Hero Media Settings
    if (form.elements['hero_bg_type']) {
      form.elements['hero_bg_type'].value = settings.hero_bg_type || 'video';
    }
    if (form.elements['hero_video_url']) {
      form.elements['hero_video_url'].value = settings.hero_video_url || '';
    }
    if (form.elements['hero_poster_url']) {
      form.elements['hero_poster_url'].value = settings.hero_poster_url || 'assets/images/fortuner_legender.jpg';
    }
    if (form.elements['hero_video_opacity']) {
      form.elements['hero_video_opacity'].value = settings.hero_video_opacity || 0.45;
      const opacityLabel = document.getElementById('opacityValLabel');
      if (opacityLabel) opacityLabel.textContent = Math.round((settings.hero_video_opacity || 0.45) * 100) + '%';
    }

    toggleHeroMediaFields();
    updateVideoPreview();

  } catch (err) {
    console.error('Error loading settings:', err);
  }
}

function toggleHeroMediaFields() {
  const mode = document.getElementById('heroBgTypeSelect')?.value;
  const videoGroup = document.getElementById('videoSettingsGroup');
  if (videoGroup) {
    if (mode === 'glow') {
      videoGroup.style.display = 'none';
    } else {
      videoGroup.style.display = 'block';
    }
  }
}

function updateVideoPreview() {
  const videoUrl = document.getElementById('heroVideoUrlInput')?.value.trim();
  const posterUrl = document.getElementById('heroPosterUrlInput')?.value.trim();
  const opacity = document.getElementById('heroOpacityInput')?.value || 0.45;
  const previewVideo = document.getElementById('adminHeroVideoPreview');
  const previewOverlay = document.getElementById('adminVideoOverlay');
  const badge = document.getElementById('videoStatusBadge');

  if (previewOverlay) {
    previewOverlay.style.background = `rgba(0, 0, 0, ${opacity})`;
  }

  if (previewVideo) {
    if (posterUrl) previewVideo.poster = posterUrl;
    if (videoUrl) {
      if (previewVideo.src !== videoUrl) {
        previewVideo.src = videoUrl;
        previewVideo.load();
        previewVideo.play().then(() => {
          if (badge) { badge.textContent = '✓ Video Playing'; badge.style.color = '#34D399'; }
        }).catch(err => {
          if (badge) { badge.textContent = '⚠️ Video Loaded (Autoplay muted)'; badge.style.color = '#F59E0B'; }
        });
      }
    } else {
      previewVideo.src = '';
      if (badge) { badge.textContent = 'No Video URL (Poster active)'; badge.style.color = '#9CA3AF'; }
    }
  }
}

function initVideoUploader() {
  const dropzone = document.getElementById('videoDropzone');
  const fileInput = document.getElementById('heroVideoFileInput');
  const statusDiv = document.getElementById('videoUploadStatus');

  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', () => fileInput.click());

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '#DC2626';
    dropzone.style.background = 'rgba(220, 38, 38, 0.12)';
  });

  dropzone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'rgba(220, 38, 38, 0.4)';
    dropzone.style.background = 'rgba(220, 38, 38, 0.03)';
  });

  dropzone.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'rgba(220, 38, 38, 0.4)';
    dropzone.style.background = 'rgba(220, 38, 38, 0.03)';
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleVideoFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', async () => {
    if (fileInput.files && fileInput.files.length > 0) {
      await handleVideoFile(fileInput.files[0]);
    }
  });

  async function handleVideoFile(file) {
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg', 'video/x-matroska'];
    const ext = file.name.split('.').pop().toLowerCase();
    
    if (!validVideoTypes.includes(file.type) && !['mp4', 'webm', 'mov', 'm4v', 'ogv', 'mkv'].includes(ext)) {
      alert('Please select a valid video file (.mp4, .webm, or .mov)');
      return;
    }

    if (statusDiv) statusDiv.innerHTML = `⏳ Uploading and processing video: <strong>${file.name}</strong> (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`;

    try {
      const videoUrl = await window.dbService.uploadHeroVideo(file);
      document.getElementById('heroVideoUrlInput').value = videoUrl;
      if (statusDiv) statusDiv.innerHTML = `✅ Video <strong>${file.name}</strong> successfully configured!`;
      updateVideoPreview();
    } catch (err) {
      console.error('Video upload failed:', err);
      // Create local blob URL immediately so user can still preview and use it
      const localBlob = URL.createObjectURL(file);
      document.getElementById('heroVideoUrlInput').value = localBlob;
      if (statusDiv) statusDiv.innerHTML = `✅ Video loaded locally: <strong>${file.name}</strong>`;
      updateVideoPreview();
    }
  }
}

async function handleSettingsSubmit(e) {
  e.preventDefault();
  const form = document.getElementById('settingsForm');
  const btn = document.getElementById('saveSettingsBtn');
  const alertBox = document.getElementById('settingsSuccessAlert');

  const payload = {
    dealership_name: form.elements['dealership_name'].value.trim(),
    owner_name: form.elements['owner_name'].value.trim(),
    tagline: form.elements['tagline'].value.trim(),
    phone: form.elements['phone'].value.trim(),
    whatsapp: form.elements['whatsapp'].value.trim(),
    address: form.elements['address'].value.trim(),
    google_maps_url: form.elements['google_maps_url'].value.trim(),
    years_experience: Number(form.elements['years_experience'].value),
    cars_sold: Number(form.elements['cars_sold'].value),
    google_rating: Number(form.elements['google_rating'].value),
    opening_hours: form.elements['opening_hours'].value.trim(),
    license_number: form.elements['license_number'].value.trim(),
    hero_bg_type: form.elements['hero_bg_type'] ? form.elements['hero_bg_type'].value : 'video',
    hero_video_url: form.elements['hero_video_url'] ? form.elements['hero_video_url'].value.trim() : '',
    hero_poster_url: form.elements['hero_poster_url'] ? form.elements['hero_poster_url'].value.trim() : 'assets/images/fortuner_legender.jpg',
    hero_video_opacity: form.elements['hero_video_opacity'] ? Number(form.elements['hero_video_opacity'].value) : 0.45
  };

  btn.disabled = true;
  btn.innerHTML = `<span>Saving Settings...</span>`;

  try {
    await window.dbService.updateSettings(payload);
    alertBox.style.display = 'block';
    setTimeout(() => { alertBox.style.display = 'none'; }, 4000);
  } catch (err) {
    alert('Error saving settings: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span>Save All Settings</span>`;
  }
}

window.handleSettingsSubmit = handleSettingsSubmit;
window.toggleHeroMediaFields = toggleHeroMediaFields;
window.updateVideoPreview = updateVideoPreview;

