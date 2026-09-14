/**
 * WELCOME MOTOR - Application Configuration
 * Owner: Arslan Farooq
 * Rawalpindi Cricket Stadium
 */

const APP_CONFIG = {
  // Dealership Profile
  brand: {
    name: 'WELCOME MOTOR',
    owner: 'Arslan Farooq',
    tagline: '17 Years of Trust. 2,179 Cars Driven Home.',
    phone: '0313-3884499',
    phoneFormatted: '+92 313 3884499',
    phoneRaw: '03133884499',
    whatsapp: '0313-3884499',
    whatsappRaw: '923133884499',
    address: 'Rawalpindi Cricket Stadium, J3VG+FWR, Murree Rd, Rawalpindi Stadium Rd, Satellite Town, Rawalpindi 46000, Pakistan',
    googleMapsUrl: 'https://maps.app.goo.gl/shWDXxyVJ9MNbEK27',
    googleMapsEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3321.4925760824987!2d73.07455807639556!3d33.64438313915152!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38df952bf4bfad87%3A0x6b4fb6c91a0c7c64!2sRawalpindi%20Cricket%20Stadium!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s',
    experienceYears: 17,
    carsSold: '2,179+',
    googleRating: '4.8',
    openingHours: 'Open 24/7',
    licenseNumber: '', // Strictly hidden if empty
    heroBgType: 'video', // 'video', 'image', 'glow'
    heroVideoUrl: 'assets/videos/welcome-motors-luxury-car-pack.mp4',
    heroPosterUrl: 'assets/images/fortuner_legender.jpg',
    heroVideoOpacity: 0.55,
  },

  // Supabase Backend Credentials
  supabase: {
    url: 'https://rupvcvvwfmsrsbnfqzdf.supabase.co',
    anonKey: 'sb_publishable_ykKqBEAwsSYMY_i4RPdUgw_aRmq8emL',
    storageBucket: 'vehicle-images'
  },

  // WhatsApp Message Generator
  generateWhatsAppLink: (vehicle, currentUrl) => {
    const rawNumber = APP_CONFIG.brand.whatsappRaw;
    if (!vehicle) {
      const defaultMsg = encodeURIComponent(
        `Hello Welcome Motor! I am contacting you regarding your inventory at Rawalpindi Cricket Stadium.`
      );
      return `https://wa.me/${rawNumber}?text=${defaultMsg}`;
    }

    const priceText = typeof vehicle.price === 'number' 
      ? `PKR ${vehicle.price.toLocaleString()}` 
      : `PKR ${vehicle.price}`;

    const text = `Hello Welcome Motor (Arslan Farooq),\n\nI am interested in this vehicle:\n🚗 *${vehicle.year} ${vehicle.brand} ${vehicle.model} ${vehicle.variant || ''}*\n💰 *Price:* ${priceText}\n📍 *Status:* ${vehicle.status ? vehicle.status.toUpperCase() : 'AVAILABLE'}\n🔗 *Link:* ${currentUrl || window.location.href}\n\nPlease let me know if it is available for inspection at Rawalpindi Cricket Stadium.`;
    
    return `https://wa.me/${rawNumber}?text=${encodeURIComponent(text)}`;
  },

  // Currency & Number Formatters
  formatPKR: (amount) => {
    if (!amount || isNaN(amount)) return 'Price on Call';
    const num = Number(amount);
    if (num >= 10000000) {
      const crore = (num / 10000000).toFixed(2).replace(/\.00$/, '');
      return `PKR ${crore} Crore`;
    } else if (num >= 100000) {
      const lacs = (num / 100000).toFixed(2).replace(/\.00$/, '');
      return `PKR ${lacs} Lacs`;
    }
    return `PKR ${num.toLocaleString()}`;
  },

  formatFullPKR: (amount) => {
    if (!amount || isNaN(amount)) return 'Price on Call';
    return `PKR ${Number(amount).toLocaleString()}`;
  }
};

if (typeof window !== 'undefined') {
  window.APP_CONFIG = APP_CONFIG;
}
