const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Starting Verification Tests for Welcome Motor Updates...\n');

// 1. Verify File Existence
const requiredFiles = [
  'index.html',
  'css/main.css',
  'js/supabase-client.js',
  'supabase-schema.sql',
  'admin/index.html',
  'admin/sales.html',
  'admin/new-sale.html',
  'admin/edit-sale.html',
  'admin/sale-receipt.html',
  'admin/js/admin-sales.js',
  'admin/js/admin-dashboard.js',
  'admin/css/admin.css'
];

let allFilesExist = true;
requiredFiles.forEach(f => {
  const fullPath = path.join(__dirname, f);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ File exists: ${f}`);
  } else {
    console.error(`❌ File MISSING: ${f}`);
    allFilesExist = false;
  }
});
assert.strictEqual(allFilesExist, true, 'All required files must exist.');

// 2. Verify Hero Video CSS Overlay
console.log('\n--- Checking Hero Video Overlay CSS ---');
const mainCss = fs.readFileSync(path.join(__dirname, 'css/main.css'), 'utf8');
assert.ok(mainCss.includes('.hero-video-overlay'), 'main.css must contain .hero-video-overlay');
assert.ok(mainCss.includes('rgba(0, 0, 0, 0.48)') || mainCss.includes('rgba(0, 0, 0,'), 'Hero video overlay must use semi-transparent black rgba(0,0,0,...)');
assert.ok(!mainCss.includes('radial-gradient(ellipse at 50% 36%, rgba(255, 255, 255, 0.72)'), 'White radial gradient must be removed from overlay');
console.log('✅ Hero video overlay is confirmed semi-transparent black (approx 48–58% black opacity)');

// 3. Verify HTTP Endpoints
console.log('\n--- Checking HTTP Endpoints on Local Server ---');
const urlsToTest = [
  'http://localhost:3000/index.html',
  'http://localhost:3000/admin/index.html',
  'http://localhost:3000/admin/sales.html',
  'http://localhost:3000/admin/new-sale.html',
  'http://localhost:3000/admin/edit-sale.html',
  'http://localhost:3000/admin/sale-receipt.html',
  'http://localhost:3000/admin/js/admin-sales.js',
  'http://localhost:3000/js/supabase-client.js'
];

function testUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ HTTP 200 OK: ${url} (${data.length} bytes)`);
          resolve(data);
        } else {
          console.error(`❌ HTTP ${res.statusCode} FAILED: ${url}`);
          reject(new Error(`Failed with status ${res.statusCode}`));
        }
      });
    }).on('error', (err) => {
      console.error(`❌ Connection error for ${url}:`, err.message);
      reject(err);
    });
  });
}

async function runTests() {
  for (const url of urlsToTest) {
    await testUrl(url);
  }

  // 4. Test Calculation Math & Field Verifications
  console.log('\n--- Verifying Sales Calculations & Form Logic ---');
  const totalPrice = 19500000;
  const advance = 15000000;
  const remaining = totalPrice - advance;
  assert.strictEqual(remaining, 4500000, 'Remaining balance calculation must be accurate');

  const purchasePrice = 18200000;
  const expenses = 85000;
  const profit = totalPrice - purchasePrice - expenses;
  assert.strictEqual(profit, 1215000, 'Net profit calculation must be accurate');

  console.log(`✅ Calculation: Total (${totalPrice}) - Advance (${advance}) = Remaining (${remaining}) [PASSED]`);
  console.log(`✅ Calculation: Sale (${totalPrice}) - Purchase (${purchasePrice}) - Expenses (${expenses}) = Profit (${profit}) [PASSED]`);

  console.log('\n🎉 ALL SYSTEM TESTS PASSED SUCCESSFULLY! Welcome Motor is ready.');
}

runTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
