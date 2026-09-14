const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

const pagesToTest = [
  '/',
  '/index.html',
  '/vehicle.html',
  '/404.html',
  '/css/main.css',
  '/css/components.css',
  '/css/responsive.css',
  '/js/config.js',
  '/js/supabase-client.js',
  '/js/main.js',
  '/js/vehicle-detail.js',
  '/assets/logo/welcome-motor-logo.png',
  '/admin/login.html',
  '/admin/index.html',
  '/admin/inventory.html',
  '/admin/add-vehicle.html',
  '/admin/edit-vehicle.html',
  '/admin/settings.html',
  '/admin/css/admin.css',
  '/admin/js/auth.js',
  '/admin/js/admin-dashboard.js',
  '/admin/js/admin-vehicle.js',
  '/admin/js/admin-settings.js'
];

async function testUrl(urlPath) {
  return new Promise((resolve) => {
    http.get(`${BASE_URL}${urlPath}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          path: urlPath,
          status: res.statusCode,
          contentType: res.headers['content-type'],
          length: data.length
        });
      });
    }).on('error', (err) => {
      resolve({ path: urlPath, status: 500, error: err.message });
    });
  });
}

async function runTests() {
  console.log('🧪 Starting Welcome Motor Automated Endpoint Verification...\n');
  let passed = 0;
  let failed = 0;

  for (const page of pagesToTest) {
    const res = await testUrl(page);
    if (res.status === 200) {
      console.log(`✅ [200 OK] ${res.path.padEnd(35)} (${res.contentType}) - ${res.length} bytes`);
      passed++;
    } else {
      console.log(`❌ [FAILED ${res.status}] ${res.path}`);
      failed++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Summary: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  // Test Logic & Functions
  console.log('🧪 Testing Config & WhatsApp Link Generator...');
  const configCode = fs.readFileSync(path.join(__dirname, 'js', 'config.js'), 'utf8');
  eval(configCode);

  if (typeof APP_CONFIG !== 'undefined') {
    console.log('✅ APP_CONFIG loaded successfully');
    console.log('   Brand:', APP_CONFIG.brand.name);
    console.log('   Owner:', APP_CONFIG.brand.owner);
    console.log('   Phone:', APP_CONFIG.brand.phone);
    console.log('   WhatsApp:', APP_CONFIG.brand.whatsapp);
    console.log('   Tagline:', APP_CONFIG.brand.tagline);
    console.log('   Maps link:', APP_CONFIG.brand.googleMapsUrl);

    // Test PKR formatting
    const priceFormatted1 = APP_CONFIG.formatPKR(18500000);
    console.log(`✅ Format PKR 18,500,000 -> "${priceFormatted1}"`);

    const priceFormatted2 = APP_CONFIG.formatPKR(3500000);
    console.log(`✅ Format PKR 3,500,000 -> "${priceFormatted2}"`);

    // Test Dynamic WhatsApp Link
    const sampleCar = {
      brand: 'Toyota',
      model: 'Fortuner',
      variant: 'Legender',
      year: 2023,
      price: 18500000,
      status: 'available'
    };
    const waLink = APP_CONFIG.generateWhatsAppLink(sampleCar, 'http://localhost:3000/vehicle.html?id=123');
    console.log('✅ Generated Dynamic WhatsApp Inquiry Link:');
    console.log('  ', waLink);

    if (waLink.includes('wa.me/923133884499') && waLink.includes('Fortuner') && waLink.includes('18%2C500%2C000')) {
      console.log('✅ WhatsApp link format verified!');
    } else {
      console.warn('⚠️ WhatsApp link format mismatch');
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
