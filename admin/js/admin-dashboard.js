/**
 * WELCOME MOTOR - Admin Dashboard Controller
 * Metrics Calculations & Quick Vehicle Operations
 */

document.addEventListener('DOMContentLoaded', async () => {
  displayAdminUser();
  await refreshDashboard();
});

function displayAdminUser() {
  const user = AdminAuth.getCurrentUser();
  const userNameEl = document.getElementById('adminUserName');
  if (userNameEl && user) {
    userNameEl.textContent = user.name || 'Admin';
  }
}

async function refreshDashboard() {
  await loadStats();
  await loadSalesMetrics();
  await loadRecentSales();
  await loadRecentVehicles();
}

async function loadSalesMetrics() {
  try {
    const stats = await window.dbService.getSalesStats();

    const elSalesCount = document.getElementById('dashSalesCount');
    const elRevenue = document.getElementById('dashTotalRevenue');
    const elProfit = document.getElementById('dashTotalProfit');
    const elAdvance = document.getElementById('dashTotalAdvance');
    const elBalance = document.getElementById('dashTotalBalance');

    if (elSalesCount) elSalesCount.textContent = stats.totalCount;
    if (elRevenue) elRevenue.textContent = formatPKRCompact(stats.totalRevenue);
    if (elProfit) elProfit.textContent = formatPKRCompact(stats.totalProfit);
    if (elAdvance) elAdvance.textContent = formatPKRCompact(stats.totalAdvance);
    if (elBalance) elBalance.textContent = formatPKRCompact(stats.totalRemaining);
  } catch (err) {
    console.error('Error loading dashboard sales stats:', err);
  }
}

async function loadRecentSales() {
  const tbody = document.getElementById('recentSalesTableBody');
  if (!tbody) return;

  try {
    const sales = await window.dbService.getSales();
    if (sales.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2rem; color: #9CA3AF;">
            No sales recorded yet. <a href="new-sale.html" style="color: #DC2626; font-weight: 700; margin-left: 0.5rem;">+ Create First Sale</a>
          </td>
        </tr>
      `;
      return;
    }

    const recent = sales.slice(0, 5);
    tbody.innerHTML = recent.map(s => {
      let statusClass = 'badge-paid';
      const st = (s.payment_status || '').toLowerCase();
      if (st.includes('partial') || st.includes('advance')) {
        statusClass = 'badge-partial';
      } else if (st.includes('pending')) {
        statusClass = 'badge-pending';
      }

      let tfClass = 'badge-transfer-in-process';
      const tf = (s.transfer_status || '').toLowerCase();
      if (tf.includes('completed') || tf.includes('done') || tf === 'transferred') {
        tfClass = 'badge-transfer-completed';
      } else if (tf.includes('pending')) {
        tfClass = 'badge-transfer-pending';
      }

      return `
        <tr>
          <td>
            <div style="font-weight: 700; color: #FFFFFF;">${escapeHtml(s.customer_name)}</div>
            <div style="font-size: 0.75rem; color: #9CA3AF;">CNIC: ${escapeHtml(s.cnic || 'N/A')}</div>
          </td>
          <td>
            <div style="font-weight: 600; color: #FFFFFF;">${s.year} ${escapeHtml(s.brand)} ${escapeHtml(s.model)}</div>
            <div style="font-size: 0.75rem; color: #60A5FA;">${escapeHtml(s.registration_number || 'Unregistered')}</div>
          </td>
          <td style="font-weight: 800; color: #FFFFFF;">
            ${APP_CONFIG.formatPKR(s.total_sale_price)}
          </td>
          <td>
            <span class="badge-status ${statusClass}">
              ${escapeHtml(s.payment_status || 'Paid in Full')}
            </span>
          </td>
          <td>
            <span class="badge-status ${tfClass}">
              ${escapeHtml(s.transfer_status || 'In Process')}
            </span>
          </td>
          <td style="font-size: 0.8125rem; color: #9CA3AF;">
            ${s.sale_date ? new Date(s.sale_date).toLocaleDateString('en-GB') : 'Recent'}
          </td>
          <td>
            <div style="display: flex; gap: 0.4rem; align-items: center;">
              <a href="sale-receipt.html?id=${s.id}" target="_blank" class="btn btn-primary btn-sm" style="padding: 0.3rem 0.55rem; font-size: 0.75rem;">
                🖨️ Receipt
              </a>
              <a href="sales.html" class="btn btn-outline btn-sm" style="padding: 0.3rem 0.55rem; font-size: 0.75rem;">
                Details
              </a>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading recent sales:', err);
  }
}

async function loadStats() {
  try {
    const stats = await window.dbService.getDashboardStats();

    document.getElementById('statTotalVehicles').textContent = stats.total;
    document.getElementById('statAvailableVehicles').textContent = stats.available;
    document.getElementById('statReservedVehicles').textContent = stats.reserved;
    document.getElementById('statSoldVehicles').textContent = stats.sold;
    document.getElementById('statFeaturedVehicles').textContent = stats.featured;
  } catch (err) {
    console.error('Error loading stats:', err);
  }
}

async function loadRecentVehicles() {
  const tbody = document.getElementById('recentVehiclesTableBody');
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="6" style="text-align: center; padding: 2.5rem; color: #9CA3AF;">
        Loading vehicle records...
      </td>
    </tr>
  `;

  try {
    const vehicles = await window.dbService.getVehicles();

    if (vehicles.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 3rem 1rem; color: #9CA3AF;">
            <div style="font-weight: 700; color: #FFFFFF; margin-bottom: 0.5rem; font-size: 1.1rem;">No Vehicles in Inventory Yet</div>
            <p style="margin-bottom: 1.25rem;">Start building your showroom catalog by adding your first vehicle.</p>
            <a href="add-vehicle.html" class="btn btn-primary btn-sm">+ Add New Vehicle</a>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = vehicles.map(v => {
      const img = (v.images && v.images.length > 0) ? v.images[0] : '../assets/images/fortuner_legender.jpg';
      const status = (v.status || 'available').toLowerCase();

      return `
        <tr id="row-${v.id}">
          <td>
            <div class="vehicle-table-cell">
              <img src="${img}" alt="${v.model}" class="vehicle-table-thumb" onerror="this.src='../assets/images/fortuner_legender.jpg'">
              <div>
                <div style="font-weight: 700; color: #FFFFFF;">${v.year} ${v.brand} ${v.model}</div>
                <div style="font-size: 0.75rem; color: #9CA3AF;">${v.variant || 'Standard'} • ${v.engine_capacity || 'N/A'}</div>
              </div>
            </div>
          </td>
          <td style="font-weight: 700; color: #FFFFFF;">
            ${APP_CONFIG.formatPKR(v.price)}
          </td>
          <td>
            <select class="admin-select" style="padding: 0.35rem 0.6rem; font-size: 0.8125rem; width: auto;" onchange="quickStatusChange('${v.id}', this.value)">
              <option value="available" ${status === 'available' ? 'selected' : ''}>🟢 Available</option>
              <option value="reserved" ${status === 'reserved' ? 'selected' : ''}>🟡 Reserved</option>
              <option value="sold" ${status === 'sold' ? 'selected' : ''}>🔴 Sold</option>
            </select>
          </td>
          <td>
            <button class="btn btn-sm ${v.featured ? 'btn-primary' : 'btn-outline'}" onclick="quickToggleFeatured('${v.id}', ${!v.featured})" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;">
              ${v.featured ? '★ Featured' : '☆ Standard'}
            </button>
          </td>
          <td>
            <span style="font-size: 0.8125rem; color: #9CA3AF;">
              ${v.created_at ? new Date(v.created_at).toLocaleDateString() : 'Recent'}
            </span>
          </td>
          <td>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <a href="edit-vehicle.html?id=${v.id}" class="btn btn-outline btn-sm" style="padding: 0.35rem 0.75rem; font-size: 0.8125rem;" title="Edit Vehicle">
                Edit
              </a>
              <a href="../vehicle.html?id=${v.id}" target="_blank" class="btn btn-outline btn-sm" style="padding: 0.35rem 0.6rem;" title="Public Preview">
                👁️
              </a>
              <button class="btn btn-outline btn-sm" onclick="confirmDeleteVehicle('${v.id}', '${v.year} ${v.brand} ${v.model}')" style="padding: 0.35rem 0.6rem; color: #EF4444; border-color: rgba(239,68,68,0.3);" title="Delete">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error('Error loading vehicles:', err);
    tbody.innerHTML = `<tr><td colspan="6" style="color: #EF4444; text-align: center; padding: 2rem;">Failed to load vehicles.</td></tr>`;
  }
}

async function quickStatusChange(id, newStatus) {
  try {
    await window.dbService.updateVehicleStatus(id, newStatus);
    await loadStats();
  } catch (err) {
    alert('Error updating status: ' + err.message);
  }
}

async function quickToggleFeatured(id, newFeatured) {
  try {
    await window.dbService.toggleVehicleFeatured(id, newFeatured);
    await refreshDashboard();
  } catch (err) {
    alert('Error updating featured flag: ' + err.message);
  }
}

async function confirmDeleteVehicle(id, title) {
  if (confirm(`Are you sure you want to delete "${title}" from showroom inventory? This action cannot be undone.`)) {
    try {
      await window.dbService.deleteVehicle(id);
      await refreshDashboard();
    } catch (err) {
      alert('Error deleting vehicle: ' + err.message);
    }
  }
}

window.quickStatusChange = quickStatusChange;
window.quickToggleFeatured = quickToggleFeatured;
window.confirmDeleteVehicle = confirmDeleteVehicle;
window.refreshDashboard = refreshDashboard;
