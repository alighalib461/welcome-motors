const http = require('http');

const urls = [
  'http://localhost:3000/',
  'http://localhost:3000/assets/videos/welcome-motors-luxury-car-pack.mp4',
  'http://localhost:3000/assets/images/lc300.jpg',
  'http://localhost:3000/assets/images/mercedes_s_class.jpg',
  'http://localhost:3000/assets/images/toyota_prado.jpg',
  'http://localhost:3000/assets/images/audi_etron_gt.jpg',
  'http://localhost:3000/css/main.css',
  'http://localhost:3000/css/components.css',
  'http://localhost:3000/css/responsive.css',
  'http://localhost:3000/js/config.js',
  'http://localhost:3000/js/main.js',
  'http://localhost:3000/js/supabase-client.js',
  'http://localhost:3000/vehicle.html'
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      console.log(`[${res.statusCode === 200 ? 'OK' : 'ERR ' + res.statusCode}] ${url} -> ${res.headers['content-type']} (${res.headers['content-length']} bytes)`);
      resolve(res.statusCode);
    }).on('error', (err) => {
      console.error(`[FAIL] ${url}:`, err.message);
      resolve(500);
    });
  });
}

async function run() {
  console.log('--- Verifying Welcome Motor Server Assets ---');
  for (const u of urls) {
    await checkUrl(u);
  }
  console.log('--- Verification Complete ---');
}

run();
