/**
 * WELCOME MOTOR - Supabase Client & Data Synchronization Layer
 * Dual-tier architecture: Live Supabase Postgres + Synchronized Local Fallback
 */

class WelcomeMotorDataService {
  constructor() {
    this.client = null;
    this.storageKey = 'welcome_motors_vehicles_cache';
    this.settingsKey = 'welcome_motors_settings_cache';
    this.inquiriesKey = 'welcome_motors_inquiries_cache';
    this.initSupabase();
  }

  initSupabase() {
    try {
      if (window.supabase && APP_CONFIG.supabase.url && APP_CONFIG.supabase.anonKey) {
        this.client = window.supabase.createClient(
          APP_CONFIG.supabase.url,
          APP_CONFIG.supabase.anonKey
        );
        console.log('✅ Supabase initialized for Welcome Motor:', APP_CONFIG.supabase.url);
      } else {
        console.warn('⚠️ Supabase JS library not loaded or credentials missing. Operating in offline cache mode.');
      }
    } catch (err) {
      console.error('Supabase initialization error:', err);
    }
  }

  // ==========================================
  // VEHICLE CRUD METHODS
  // ==========================================

  /**
   * Fetch all vehicles with optional filters
   */
  async getVehicles(options = {}) {
    // 1. Attempt Supabase Query
    if (this.client) {
      try {
        let query = this.client
          .from('vehicles')
          .select('*')
          .order('created_at', { ascending: false });

        if (options.status) {
          query = query.eq('status', options.status);
        }
        if (options.featured !== undefined) {
          query = query.eq('featured', options.featured);
        }
        if (options.brand) {
          query = query.ilike('brand', `%${options.brand}%`);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          // Update local cache
          localStorage.setItem(this.storageKey, JSON.stringify(data));
          return this.applyLocalFilters(data, options);
        } else {
          console.warn('Supabase query failed or table empty, checking local cache:', error?.message);
        }
      } catch (err) {
        console.warn('Network or DB error, using cached vehicles:', err.message);
      }
    }

    // 2. Fallback to LocalStorage Cache
    const cached = this.getLocalVehicles();
    return this.applyLocalFilters(cached, options);
  }

  /**
   * Get single vehicle by ID
   */
  async getVehicleById(id) {
    if (!id) return null;

    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('vehicles')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn('Error fetching vehicle from Supabase:', err.message);
      }
    }

    // Fallback to cache
    const cached = this.getLocalVehicles();
    return cached.find(v => v.id === id) || null;
  }

  /**
   * Create new vehicle
   */
  async createVehicle(vehicleData) {
    const newVehicle = {
      id: vehicleData.id || this.generateUUID(),
      brand: vehicleData.brand.trim(),
      model: vehicleData.model.trim(),
      year: Number(vehicleData.year),
      price: Number(vehicleData.price),
      status: vehicleData.status || 'available',
      images: Array.isArray(vehicleData.images) && vehicleData.images.length > 0 
        ? vehicleData.images 
        : ['assets/images/fortuner_legender.jpg'],
      
      // Optional fields
      variant: vehicleData.variant?.trim() || null,
      mileage: vehicleData.mileage ? Number(vehicleData.mileage) : null,
      fuel_type: vehicleData.fuel_type || null,
      transmission: vehicleData.transmission || null,
      engine_capacity: vehicleData.engine_capacity?.trim() || null,
      color: vehicleData.color?.trim() || null,
      registration_city: vehicleData.registration_city?.trim() || null,
      condition: vehicleData.condition || null,
      assembly: vehicleData.assembly || null,
      owners_count: vehicleData.owners_count || null,
      description: vehicleData.description?.trim() || null,
      features: Array.isArray(vehicleData.features) ? vehicleData.features : [],
      safety_features: Array.isArray(vehicleData.safety_features) ? vehicleData.safety_features : [],
      featured: Boolean(vehicleData.featured),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save to LocalStorage immediately
    const cached = this.getLocalVehicles();
    cached.unshift(newVehicle);
    localStorage.setItem(this.storageKey, JSON.stringify(cached));

    // Push to Supabase if connected
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('vehicles')
          .insert([newVehicle])
          .select()
          .single();

        if (error) {
          console.warn('Supabase insert note:', error.message);
        } else if (data) {
          return data;
        }
      } catch (err) {
        console.warn('Supabase insert exception:', err.message);
      }
    }

    return newVehicle;
  }

  /**
   * Update existing vehicle
   */
  async updateVehicle(id, updates) {
    const cached = this.getLocalVehicles();
    const index = cached.findIndex(v => v.id === id);
    if (index === -1) {
      throw new Error('Vehicle not found');
    }

    const updatedVehicle = {
      ...cached[index],
      ...updates,
      id: id,
      year: updates.year ? Number(updates.year) : cached[index].year,
      price: updates.price ? Number(updates.price) : cached[index].price,
      mileage: updates.mileage !== undefined ? (updates.mileage ? Number(updates.mileage) : null) : cached[index].mileage,
      updated_at: new Date().toISOString()
    };

    cached[index] = updatedVehicle;
    localStorage.setItem(this.storageKey, JSON.stringify(cached));

    // Push to Supabase
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('vehicles')
          .update(updatedVehicle)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.warn('Supabase update note:', error.message);
        } else if (data) {
          return data;
        }
      } catch (err) {
        console.warn('Supabase update exception:', err.message);
      }
    }

    return updatedVehicle;
  }

  /**
   * Delete vehicle
   */
  async deleteVehicle(id) {
    const cached = this.getLocalVehicles();
    const filtered = cached.filter(v => v.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));

    if (this.client) {
      try {
        const { error } = await this.client
          .from('vehicles')
          .delete()
          .eq('id', id);

        if (error) {
          console.warn('Supabase delete note:', error.message);
        }
      } catch (err) {
        console.warn('Supabase delete exception:', err.message);
      }
    }

    return true;
  }

  /**
   * Fast status toggle
   */
  async updateVehicleStatus(id, newStatus) {
    return this.updateVehicle(id, { status: newStatus });
  }

  /**
   * Fast featured toggle
   */
  async toggleVehicleFeatured(id, featured) {
    return this.updateVehicle(id, { featured: Boolean(featured) });
  }

  // ==========================================
  // ==========================================
  // MEDIA & VIDEO STORAGE & UPLOAD
  // ==========================================

  /**
   * Upload image or video file to Supabase Storage or convert to optimized URL / IndexedDB Blob
   */
  async uploadMediaFile(file, folder = 'uploads') {
    if (!file) throw new Error('No file provided');

    // 1. Try Supabase Storage
    if (this.client && this.client.storage) {
      try {
        const fileExt = file.name.split('.').pop() || 'mp4';
        const isVideo = file.type.startsWith('video/') || ['mp4', 'webm', 'mov', 'm4v', 'ogv'].includes(fileExt.toLowerCase());
        const prefix = isVideo ? 'video' : 'img';
        const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const { data, error } = await this.client.storage
          .from(APP_CONFIG.supabase.storageBucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg')
          });

        if (!error && data) {
          const { data: publicUrlData } = this.client.storage
            .from(APP_CONFIG.supabase.storageBucket)
            .getPublicUrl(filePath);

          if (publicUrlData && publicUrlData.publicUrl) {
            return publicUrlData.publicUrl;
          }
        } else if (error) {
          console.warn('Supabase storage upload returned error:', error.message);
        }
      } catch (err) {
        console.warn('Supabase storage upload exception:', err.message);
      }
    }

    // 2. Large File / Video IndexedDB or Data URL Fallback
    if (file.size > 4 * 1024 * 1024) {
      // Store in IndexedDB for large media to prevent localStorage quota crash
      return await this.saveMediaToIndexedDB(file);
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  async uploadVehicleImage(file) {
    return this.uploadMediaFile(file, 'vehicles');
  }

  async uploadHeroVideo(file) {
    return this.uploadMediaFile(file, 'hero-video');
  }

  async saveMediaToIndexedDB(file) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('WelcomeMotorMediaDB', 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('media')) {
          db.createObjectStore('media', { keyPath: 'id' });
        }
      };
      request.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction('media', 'readwrite');
        const store = tx.objectStore('media');
        const mediaId = 'hero_custom_video_' + Date.now();
        store.put({ id: mediaId, file: file, name: file.name, type: file.type, date: new Date() });
        tx.oncomplete = () => {
          const blobUrl = URL.createObjectURL(file);
          // Store mediaId reference in sessionStorage
          sessionStorage.setItem('last_uploaded_video_id', mediaId);
          resolve(blobUrl);
        };
        tx.onerror = () => reject(tx.error);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // ==========================================
  // SETTINGS & METRICS
  // ==========================================

  async getSettings() {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('settings')
          .select('*')
          .eq('id', 'dealership_settings')
          .single();

        if (!error && data) {
          localStorage.setItem(this.settingsKey, JSON.stringify(data));
          return data;
        }
      } catch (err) {
        console.warn('Settings fetch error:', err.message);
      }
    }

    const cached = localStorage.getItem(this.settingsKey);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }

    return {
      dealership_name: APP_CONFIG.brand.name,
      owner_name: APP_CONFIG.brand.owner,
      tagline: APP_CONFIG.brand.tagline,
      phone: APP_CONFIG.brand.phone,
      whatsapp: APP_CONFIG.brand.whatsapp,
      address: APP_CONFIG.brand.address,
      google_maps_url: APP_CONFIG.brand.googleMapsUrl,
      years_experience: APP_CONFIG.brand.experienceYears,
      cars_sold: 2179,
      google_rating: 4.8,
      opening_hours: APP_CONFIG.brand.openingHours,
      license_number: '',
      hero_bg_type: APP_CONFIG.brand.heroBgType || 'video',
      hero_video_url: APP_CONFIG.brand.heroVideoUrl || '',
      hero_poster_url: APP_CONFIG.brand.heroPosterUrl || 'assets/images/fortuner_legender.jpg',
      hero_video_opacity: APP_CONFIG.brand.heroVideoOpacity || 0.45
    };
  }

  async updateSettings(newSettings) {
    const current = await this.getSettings();
    const updated = { ...current, ...newSettings, id: 'dealership_settings', updated_at: new Date().toISOString() };
    
    localStorage.setItem(this.settingsKey, JSON.stringify(updated));

    if (this.client) {
      try {
        await this.client
          .from('settings')
          .upsert([updated]);
      } catch (err) {
        console.warn('Settings upsert error:', err.message);
      }
    }

    return updated;
  }

  async getDashboardStats() {
    const vehicles = await this.getVehicles();
    return {
      total: vehicles.length,
      available: vehicles.filter(v => (v.status || 'available').toLowerCase() === 'available').length,
      reserved: vehicles.filter(v => (v.status || '').toLowerCase() === 'reserved').length,
      sold: vehicles.filter(v => (v.status || '').toLowerCase() === 'sold').length,
      featured: vehicles.filter(v => v.featured).length
    };
  }

  // ==========================================
  // INQUIRY SYSTEM
  // ==========================================

  async submitInquiry(inquiry) {
    const newInquiry = {
      id: this.generateUUID(),
      ...inquiry,
      status: 'new',
      created_at: new Date().toISOString()
    };

    const cached = this.getLocalInquiries();
    cached.unshift(newInquiry);
    localStorage.setItem(this.inquiriesKey, JSON.stringify(cached));

    if (this.client) {
      try {
        await this.client
          .from('inquiries')
          .insert([newInquiry]);
      } catch (err) {
        console.warn('Inquiry insert error:', err.message);
      }
    }

    return newInquiry;
  }

  // ==========================================
  // HELPER UTILITIES
  // ==========================================

  getLocalVehicles() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}

    // Curated Default Luxury Showroom Inventory
    const defaults = [
      {
        id: 'wm-lc300',
        brand: 'Toyota',
        model: 'Land Cruiser 300',
        variant: 'ZX 3.5L Twin-Turbo V6 (Fresh Import)',
        year: 2024,
        price: 115000000,
        status: 'available',
        body_type: 'SUV',
        category: 'suv',
        condition: 'Brand New',
        mileage: 150,
        fuel_type: 'Petrol',
        transmission: 'Automatic',
        engine_capacity: '3500 cc',
        color: 'Pearl White',
        registration_city: 'Unregistered',
        assembly: 'Imported',
        owners_count: 'First Owner',
        featured: true,
        images: ['assets/images/lc300.jpg'],
        description: 'Brand New 2024 Toyota Land Cruiser 300 ZX Twin-Turbo V6. Top of the line grade with Modelista body kit, 360-degree cameras, rear entertainment screens, cool box, heads-up display, and adaptive variable suspension. Available for immediate physical inspection at Rawalpindi Cricket Stadium.',
        features: ['Modelista Aerokit', 'Rear Seat Entertainment', 'JBL Synthesis 14-Speaker Audio', 'Cool Box & Heated/Cooled Seats', 'Sunroof & Ambient Illumination', 'Apple CarPlay & Android Auto', 'Push Button Start & Keyless Entry'],
        safety_features: ['Toyota Safety Sense 2.0', '10 Airbags', 'Lane Tracing Assist', 'Pre-Collision Radar', 'Blind Spot Monitoring', 'Hill Descent Control'],
        created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'wm-mercedes-s580e',
        brand: 'Mercedes-Benz',
        model: 'S-Class',
        variant: 'S 580 e AMG Line Plug-In Hybrid',
        year: 2023,
        price: 89000000,
        status: 'available',
        body_type: 'Sedan',
        category: 'sedan',
        condition: 'Used',
        mileage: 12400,
        fuel_type: 'Hybrid',
        transmission: 'Automatic',
        engine_capacity: '3000 cc',
        color: 'Obsidian Black Metallic',
        registration_city: 'Islamabad',
        assembly: 'Imported',
        owners_count: '1st Owner',
        featured: true,
        images: ['assets/images/mercedes_s_class.jpg'],
        description: 'Pristine 2023 Mercedes-Benz S 580 e Long Wheelbase AMG Line. High-voltage plug-in hybrid combining whisper-quiet electric cruising with twin-turbo performance. Burmester 3D High-End Sound, Executive rear seating with calf massage, Digital Light technology, and panoramic sunroof.',
        features: ['Burmester 3D Surround Sound', 'Executive Rear Massage Seats', 'Panoramic Sliding Sunroof', 'MBUX Augmented Reality Navigation', 'Soft-Close Doors & Power Boot', 'Air Balance Package with Fragrance'],
        safety_features: ['Active Distance Assist DISTRONIC', 'Pre-Safe Impulse Side', '360 Surround View with 3D Assist', '12 Airbags', 'Night Vision Assist'],
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'wm-prado-tx',
        brand: 'Toyota',
        model: 'Land Cruiser Prado',
        variant: 'TX L-Package 7-Seater 4x4',
        year: 2022,
        price: 38500000,
        status: 'available',
        body_type: 'SUV',
        category: 'suv',
        condition: 'Used',
        mileage: 28600,
        fuel_type: 'Petrol',
        transmission: 'Automatic',
        engine_capacity: '2700 cc',
        color: 'Pearl White Crystal',
        registration_city: 'Islamabad',
        assembly: 'Imported',
        owners_count: '1st Owner',
        featured: true,
        images: ['assets/images/toyota_prado.jpg'],
        description: 'Immaculate 2022 Toyota Land Cruiser Prado TX L Package with complete genuine Japanese auction sheet (Grade 4.5). Beige premium leather interior, sunroof, Modellista aero kit, heated & ventilated seats, and electric third-row folding.',
        features: ['Sunroof', 'Modellista Aero Styling', 'Beige Leather Upholstery', 'Dual Zone Climate Control', 'Push Start & Smart Entry', 'Cruise Control & Multi-terrain Select'],
        safety_features: ['8 Airbags', 'Vehicle Stability Control (VSC)', 'Traction Control', 'Reverse Camera with Guidelines', 'ABS with EBD'],
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'wm-audi-etron',
        brand: 'Audi',
        model: 'e-tron GT',
        variant: 'Quattro Performance EV 530HP',
        year: 2023,
        price: 42500000,
        status: 'available',
        body_type: 'Coupe',
        category: 'hybrid_ev',
        condition: 'Used',
        mileage: 14200,
        fuel_type: 'Electric',
        transmission: 'Automatic',
        engine_capacity: 'Electric (93 kWh)',
        color: 'Daytona Grey Pearl',
        registration_city: 'Islamabad',
        assembly: 'Imported',
        owners_count: '1st Owner',
        featured: true,
        images: ['assets/images/audi_etron_gt.jpg'],
        description: 'Showroom condition 2023 Audi e-tron GT Quattro EV. 0-100 km/h in 4.1s with 488km range on single charge. Matrix LED laser lights, Bang & Olufsen 3D sound system, panoramic fixed glass roof, adaptive air suspension, and ceramic coated finish.',
        features: ['Bang & Olufsen 3D Premium Sound', 'Adaptive Air Suspension', 'Panoramic Glass Roof', 'Audi Virtual Cockpit Plus', 'Carbon Fibre Interior Trims', 'Wireless Fast Charging Pad'],
        safety_features: ['Audi Pre-Sense Front & Rear', 'Active Lane Assist', 'Park Assist Plus with 360 Camera', '8 Airbags', 'Electronic Quattro Torque Vectoring'],
        created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'wm-fortuner-legender',
        brand: 'Toyota',
        model: 'Fortuner',
        variant: 'Legender 2.8 4x4 Sigma 4',
        year: 2023,
        price: 19800000,
        status: 'available',
        body_type: 'SUV',
        category: 'suv',
        condition: 'Used',
        mileage: 19500,
        fuel_type: 'Diesel',
        transmission: 'Automatic',
        engine_capacity: '2800 cc',
        color: 'Attitude Black Metallic',
        registration_city: 'Rawalpindi',
        assembly: 'Local',
        owners_count: '1st Owner',
        featured: true,
        images: ['assets/images/fortuner_legender.jpg'],
        description: 'Bumper-to-bumper genuine 2023 Toyota Fortuner Legender 2.8 Sigma 4. Dual tone Maroon & Black leather cabin, Bi-Beam sequential LED headlights, power tailgate with kick sensor, differential lock, and premium sound.',
        features: ['Dual Tone Leather Interior', 'Sequential LED Headlamps', 'Power Tailgate with Kick Sensor', 'Paddle Shifters & Drive Modes', 'Auto Dimming Rear Mirror', 'Ambient Cabin Lighting'],
        safety_features: ['7 Airbags', 'Vehicle Stability Control', 'Hill Start Assist', 'Downhill Assist Control', 'Rear Differential Lock'],
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'wm-civic-rs',
        brand: 'Honda',
        model: 'Civic',
        variant: 'RS 1.5 VTEC Turbo 11th Gen',
        year: 2024,
        price: 9850000,
        status: 'available',
        body_type: 'Sedan',
        category: 'sedan',
        condition: 'Used',
        mileage: 8400,
        fuel_type: 'Petrol',
        transmission: 'CVT',
        engine_capacity: '1500 cc',
        color: 'Meteoroid Grey Metallic',
        registration_city: 'Punjab',
        assembly: 'Local',
        owners_count: '1st Owner',
        featured: false,
        images: ['assets/images/civic_rs.jpg'],
        description: 'Top-tier 2024 Honda Civic RS Turbo 1.5 VTEC with genuine low mileage. Equipped with complete Honda SENSING autonomous safety suite, sunroof, black suede-leather upholstery with red stitching, ambient lighting, and wireless Apple CarPlay.',
        features: ['Honda SENSING Suite', 'Electric Sunroof', '9-inch HD Touchscreen with Apple CarPlay', 'Wireless Phone Charger', 'Red Stitching RS Sport Seats', 'Paddle Shifters'],
        safety_features: ['Adaptive Cruise Control (ACC)', 'Collision Mitigation Braking (CMBS)', 'Lane Keeping Assist System (LKAS)', 'Road Departure Mitigation', '6 Airbags', 'Hill Start Assist'],
        created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(defaults));
    } catch (e) {}

    return defaults;
  }

  getLocalInquiries() {
    try {
      const data = localStorage.getItem(this.inquiriesKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  applyLocalFilters(vehicles, options) {
    let result = [...vehicles];

    if (options.status) {
      result = result.filter(v => (v.status || 'available').toLowerCase() === options.status.toLowerCase());
    }

    if (options.featured !== undefined) {
      result = result.filter(v => Boolean(v.featured) === Boolean(options.featured));
    }

    if (options.category && options.category !== 'all') {
      const cat = options.category.toLowerCase();
      result = result.filter(v => {
        const vCat = (v.category || '').toLowerCase();
        const vBody = (v.body_type || '').toLowerCase();
        const vFuel = (v.fuel_type || '').toLowerCase();
        const vCondition = (v.condition || '').toLowerCase();

        if (cat === 'suv') return vCat === 'suv' || vBody === 'suv' || vBody.includes('4x4');
        if (cat === 'sedan') return vCat === 'sedan' || vBody === 'sedan';
        if (cat === 'hybrid_ev') return vCat === 'hybrid_ev' || vFuel === 'hybrid' || vFuel === 'electric';
        if (cat === 'import') return (v.assembly && v.assembly.toLowerCase() === 'imported') || vCondition.includes('unregistered');
        return true;
      });
    }

    if (options.brand) {
      const b = options.brand.toLowerCase();
      result = result.filter(v => v.brand && v.brand.toLowerCase().includes(b));
    }

    if (options.keyword) {
      const kw = options.keyword.toLowerCase();
      result = result.filter(v => 
        (v.brand && v.brand.toLowerCase().includes(kw)) ||
        (v.model && v.model.toLowerCase().includes(kw)) ||
        (v.variant && v.variant.toLowerCase().includes(kw)) ||
        (v.description && v.description.toLowerCase().includes(kw)) ||
        (v.color && v.color.toLowerCase().includes(kw)) ||
        (v.registration_city && v.registration_city.toLowerCase().includes(kw))
      );
    }

    if (options.minYear) {
      result = result.filter(v => v.year >= Number(options.minYear));
    }

    if (options.maxYear) {
      result = result.filter(v => v.year <= Number(options.maxYear));
    }

    if (options.minPrice) {
      result = result.filter(v => v.price >= Number(options.minPrice));
    }

    if (options.maxPrice) {
      result = result.filter(v => v.price <= Number(options.maxPrice));
    }

    if (options.fuelType) {
      result = result.filter(v => v.fuel_type && v.fuel_type.toLowerCase() === options.fuelType.toLowerCase());
    }

    if (options.transmission) {
      result = result.filter(v => v.transmission && v.transmission.toLowerCase() === options.transmission.toLowerCase());
    }

    if (options.condition) {
      result = result.filter(v => v.condition && v.condition.toLowerCase() === options.condition.toLowerCase());
    }

    // Sorting
    if (options.sort) {
      if (options.sort === 'price_asc') {
        result.sort((a, b) => a.price - b.price);
      } else if (options.sort === 'price_desc') {
        result.sort((a, b) => b.price - a.price);
      } else if (options.sort === 'year_desc') {
        result.sort((a, b) => b.year - a.year);
      } else if (options.sort === 'year_asc') {
        result.sort((a, b) => a.year - b.year);
      } else if (options.sort === 'mileage_asc') {
        result.sort((a, b) => (a.mileage || 0) - (b.mileage || 0));
      } else {
        result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      }
    }

    return result;
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// Global instance
if (typeof window !== 'undefined') {
  window.dbService = new WelcomeMotorDataService();
}
