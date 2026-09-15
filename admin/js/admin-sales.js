/**
 * WELCOME MOTOR - Dealership Customer & Sales Records Controller
 * Full CRUD, Live Financial Calculations, Receipts, and WhatsApp Share
 */

let allSales = [];
let availableVehicles = [];

// ==============================================================================
// 1. SALES DASHBOARD INITIALIZATION
// ==============================================================================
async function initSalesDashboard() {
  await loadSalesStats();
  await loadAllSales();
}

async function loadSalesStats() {
  try {
    const stats = await window.dbService.getSalesStats();

    const elTotal = document.getElementById('statTotalSales');
    const elRevenue = document.getElementById('statTotalRevenue');
    const elProfit = document.getElementById('statTotalProfit');
    const elAdvance = document.getElementById('statTotalAdvance');
    const elBalance = document.getElementById('statTotalBalance');

    if (elTotal) elTotal.textContent = stats.totalCount;
    if (elRevenue) elRevenue.textContent = formatPKRCompact(stats.totalRevenue);
    if (elProfit) elProfit.textContent = formatPKRCompact(stats.totalProfit);
    if (elAdvance) elAdvance.textContent = formatPKRCompact(stats.totalAdvance);
    if (elBalance) elBalance.textContent = formatPKRCompact(stats.totalRemaining);
  } catch (err) {
    console.error('Error loading sales stats:', err);
  }
}

async function loadAllSales() {
  const tbody = document.getElementById('salesTableBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2.5rem; color: #9CA3AF;">Loading customer sales records...</td></tr>`;

  try {
    allSales = await window.dbService.getSales();
    renderFilteredSalesTable(allSales);
  } catch (err) {
    console.error('Error loading sales:', err);
    tbody.innerHTML = `<tr><td colspan="7" style="color: #EF4444; text-align: center; padding: 2rem;">Failed to load sales records.</td></tr>`;
  }
}

function renderFilteredSalesTable(sales) {
  const tbody = document.getElementById('salesTableBody');
  if (!tbody) return;

  if (sales.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 3.5rem 1rem; color: #9CA3AF;">
          <div style="font-weight: 700; color: #FFFFFF; font-size: 1.15rem; margin-bottom: 0.5rem;">No Customer Sales Records Found</div>
          <p style="margin-bottom: 1.25rem;">Start recording your dealership vehicle sales, receipts, and customer documents.</p>
          <a href="new-sale.html" class="btn btn-primary btn-sm">+ Create New Customer Sale</a>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = sales.map(sale => {
    const total = Number(sale.total_sale_price) || 0;
    const advance = Number(sale.advance_payment) || 0;
    const remaining = Number(sale.remaining_amount) || 0;
    
    // Status Badge
    let statusClass = 'badge-paid';
    const st = (sale.payment_status || '').toLowerCase();
    if (st.includes('partial') || st.includes('advance')) {
      statusClass = 'badge-partial';
    } else if (st.includes('pending')) {
      statusClass = 'badge-pending';
    }

    // Transfer Badge
    let transferClass = 'badge-transfer-in-process';
    const tf = (sale.transfer_status || '').toLowerCase();
    if (tf.includes('completed') || tf.includes('done') || tf === 'transferred') {
      transferClass = 'badge-transfer-completed';
    } else if (tf.includes('pending')) {
      transferClass = 'badge-transfer-pending';
    }

    const saleDateStr = sale.sale_date ? new Date(sale.sale_date).toLocaleDateString('en-GB') : 'N/A';

    return `
      <tr id="sale-row-${sale.id}">
        <td>
          <div style="font-weight: 800; color: #FFFFFF; font-size: 0.95rem;">${escapeHtml(sale.customer_name)}</div>
          <div style="font-size: 0.75rem; color: #9CA3AF; margin-top: 2px;">
            <span>CNIC: ${escapeHtml(sale.cnic || 'N/A')}</span> • <span>📞 ${escapeHtml(sale.phone || 'N/A')}</span>
          </div>
          <div style="font-size: 0.7rem; color: #DC2626; font-weight: 700; margin-top: 2px;">Receipt: ${escapeHtml(sale.receipt_number || 'N/A')}</div>
        </td>
        <td>
          <div style="font-weight: 700; color: #FFFFFF;">${sale.year} ${escapeHtml(sale.brand)} ${escapeHtml(sale.model)}</div>
          <div style="font-size: 0.75rem; color: #9CA3AF; margin-top: 2px;">
            <span style="color: #60A5FA; font-weight: 700;">${escapeHtml(sale.registration_number || 'Unreg')}</span> • <span>${escapeHtml(sale.color || 'N/A')}</span>
          </div>
        </td>
        <td>
          <div style="font-weight: 800; color: #FFFFFF;">${APP_CONFIG.formatPKR(total)}</div>
          <div style="font-size: 0.75rem; color: #10B981;">Adv: ${APP_CONFIG.formatPKR(advance)}</div>
          ${remaining > 0 ? `<div style="font-size: 0.75rem; color: #EF4444; font-weight: 700;">Bal: ${APP_CONFIG.formatPKR(remaining)}</div>` : ''}
        </td>
        <td>
          <span class="badge-status ${statusClass}">
            ${escapeHtml(sale.payment_status || 'Paid in Full')}
          </span>
          <div style="font-size: 0.7rem; color: #9CA3AF; margin-top: 4px;">${escapeHtml(sale.payment_method || 'Cash')}</div>
        </td>
        <td>
          <span class="badge-status ${transferClass}">
            ${escapeHtml(sale.transfer_status || 'In Process')}
          </span>
          <div style="font-size: 0.7rem; color: #9CA3AF; margin-top: 4px;">Biometric: <b style="color: #FFFFFF;">${escapeHtml(sale.biometric_status || 'Done')}</b></div>
        </td>
        <td>
          <span style="font-size: 0.8125rem; color: #D1D5DB; font-weight: 600;">${saleDateStr}</span>
        </td>
        <td>
          <div style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">
            <button class="btn btn-outline btn-sm" onclick="showSaleDetailsModal('${sale.id}')" style="padding: 0.35rem 0.6rem;" title="View Complete Record">
              👁️ View
            </button>
            <a href="sale-receipt.html?id=${sale.id}" target="_blank" class="btn btn-primary btn-sm" style="padding: 0.35rem 0.6rem;" title="Official Printable Receipt">
              🖨️ Receipt
            </a>
            <button class="btn btn-outline btn-sm" onclick="shareSaleViaWhatsApp('${sale.id}')" style="padding: 0.35rem 0.6rem; color: #22C55E; border-color: rgba(34,197,94,0.4);" title="Share via WhatsApp">
              💬 WhatsApp
            </button>
            <a href="edit-sale.html?id=${sale.id}" class="btn btn-outline btn-sm" style="padding: 0.35rem 0.6rem;" title="Edit Sale Record">
              ✏️ Edit
            </a>
            <button class="btn btn-outline btn-sm" onclick="deleteSaleWithConfirm('${sale.id}', '${escapeHtml(sale.customer_name)} - ${escapeHtml(sale.brand)} ${escapeHtml(sale.model)}')" style="padding: 0.35rem 0.5rem; color: #EF4444; border-color: rgba(239,68,68,0.3);" title="Delete Record">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterSalesList() {
  const kw = document.getElementById('salesSearchInput')?.value || '';
  const paymentStatus = document.getElementById('salesPaymentFilter')?.value || '';
  const transferStatus = document.getElementById('salesTransferFilter')?.value || '';

  const options = {
    search: kw,
    payment_status: paymentStatus,
    transfer_status: transferStatus
  };

  const filtered = window.dbService.applyLocalSalesFilters(allSales, options);
  renderFilteredSalesTable(filtered);
}

// ==============================================================================
// 2. SALE CREATION & EDITING FORM LOGIC
// ==============================================================================
async function initSaleForm(isEdit = false) {
  // Populate inventory selector for 1-click auto-fill
  await populateInventorySelector();

  // Attach live calculation listeners
  setupLiveCalculators();

  // Handle CNIC Formatting
  setupCNICFormatter();

  // If edit mode, load existing sale data
  if (isEdit) {
    const urlParams = new URLSearchParams(window.location.search);
    const saleId = urlParams.get('id');
    if (!saleId) {
      alert('Sale ID missing from URL');
      window.location.href = 'sales.html';
      return;
    }
    await loadSaleDataForEdit(saleId);
  }
}

async function populateInventorySelector() {
  const select = document.getElementById('inventoryVehicleSelect');
  if (!select) return;

  try {
    availableVehicles = await window.dbService.getVehicles();
    select.innerHTML = `<option value="">-- Choose from Showroom Inventory (Optional Auto-Fill) --</option>`;
    
    availableVehicles.forEach(v => {
      select.innerHTML += `
        <option value="${v.id}">
          ${v.year} ${v.brand} ${v.model} (${v.variant || 'Std'}) - ${APP_CONFIG.formatPKR(v.price)} [${v.status.toUpperCase()}]
        </option>
      `;
    });
  } catch (err) {
    console.warn('Could not load inventory for selector:', err);
  }
}

function handleInventorySelect(vehicleId) {
  if (!vehicleId) return;
  const vehicle = availableVehicles.find(v => v.id === vehicleId);
  if (!vehicle) return;

  // Auto-fill vehicle inputs
  setInputValue('brand', vehicle.brand);
  setInputValue('model', vehicle.model);
  setInputValue('variant', vehicle.variant || '');
  setInputValue('year', vehicle.year);
  setInputValue('color', vehicle.color || '');
  setInputValue('mileage', vehicle.mileage || '');
  setInputValue('condition', vehicle.condition || 'Used');
  setInputValue('import_local', vehicle.assembly || 'Local');
  setInputValue('total_sale_price', vehicle.price);
  setInputValue('sale_price', vehicle.price);

  // Trigger calculations
  recalcSaleFinancials();
}

function setupLiveCalculators() {
  const totalSaleInput = document.querySelector('input[name="total_sale_price"]');
  const advanceInput = document.querySelector('input[name="advance_payment"]');
  const purchaseInput = document.querySelector('input[name="purchase_price"]');
  const internalSaleInput = document.querySelector('input[name="sale_price"]');
  const expensesInput = document.querySelector('input[name="additional_expenses"]');

  const triggers = [totalSaleInput, advanceInput, purchaseInput, internalSaleInput, expensesInput];
  triggers.forEach(input => {
    if (input) {
      input.addEventListener('input', () => {
        // Sync internal sale price if matching
        if (input === totalSaleInput && internalSaleInput && (!internalSaleInput.value || internalSaleInput.value === '0')) {
          internalSaleInput.value = totalSaleInput.value;
        }
        recalcSaleFinancials();
      });
    }
  });

  // Run initial calculation
  recalcSaleFinancials();
}

function recalcSaleFinancials() {
  const totalSale = Number(document.querySelector('input[name="total_sale_price"]')?.value) || 0;
  const advance = Number(document.querySelector('input[name="advance_payment"]')?.value) || 0;
  const remaining = Math.max(0, totalSale - advance);

  const purchase = Number(document.querySelector('input[name="purchase_price"]')?.value) || 0;
  const salePr = Number(document.querySelector('input[name="sale_price"]')?.value) || totalSale;
  const expenses = Number(document.querySelector('input[name="additional_expenses"]')?.value) || 0;
  const profit = salePr - purchase - expenses;

  // Update Remaining Amount field & Banner
  const remainingInput = document.querySelector('input[name="remaining_amount"]');
  if (remainingInput) remainingInput.value = remaining;

  const profitInput = document.querySelector('input[name="final_profit"]');
  if (profitInput) profitInput.value = profit;

  const bannerRemaining = document.getElementById('calcBannerRemaining');
  if (bannerRemaining) bannerRemaining.textContent = APP_CONFIG.formatPKR(remaining);

  const bannerProfit = document.getElementById('calcBannerProfit');
  if (bannerProfit) {
    bannerProfit.textContent = (profit >= 0 ? '+' : '') + APP_CONFIG.formatPKR(profit);
    bannerProfit.style.color = profit >= 0 ? '#10B981' : '#EF4444';
  }

  // Auto-suggest Payment Status
  const statusSelect = document.querySelector('select[name="payment_status"]');
  if (statusSelect) {
    if (advance >= totalSale && totalSale > 0) {
      statusSelect.value = 'Paid in Full';
    } else if (advance > 0) {
      statusSelect.value = 'Partial / Advance Paid';
    } else {
      statusSelect.value = 'Pending';
    }
  }
}

function setupCNICFormatter() {
  const cnicInput = document.querySelector('input[name="cnic"]');
  if (!cnicInput) return;

  cnicInput.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 13);
    let formatted = val;
    if (val.length > 5 && val.length <= 12) {
      formatted = `${val.substring(0, 5)}-${val.substring(5)}`;
    } else if (val.length > 12) {
      formatted = `${val.substring(0, 5)}-${val.substring(5, 12)}-${val.substring(12, 13)}`;
    }
    e.target.value = formatted;
  });
}

async function handleSaleFormSubmit(e, isEdit = false) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving Sale Record...';
  }

  try {
    const formData = new FormData(form);
    const saleData = {};

    formData.forEach((value, key) => {
      if (key !== 'documents_received') {
        saleData[key] = value;
      }
    });

    // Collect received document checkboxes
    const receivedCheckboxes = form.querySelectorAll('input[name="documents_received"]:checked');
    saleData.documents_received = Array.from(receivedCheckboxes).map(cb => cb.value);

    // If inventory vehicle selected
    const invSelect = document.getElementById('inventoryVehicleSelect');
    if (invSelect && invSelect.value) {
      saleData.vehicle_id = invSelect.value;
    }

    let savedRecord;
    if (isEdit) {
      const urlParams = new URLSearchParams(window.location.search);
      const saleId = urlParams.get('id');
      savedRecord = await window.dbService.updateSale(saleId, saleData);
      alert(`Customer sale record for "${savedRecord.customer_name}" updated successfully!`);
    } else {
      savedRecord = await window.dbService.createSale(saleData);
      const openReceipt = confirm(`✅ Sale created successfully! Receipt #${savedRecord.receipt_number}\n\nWould you like to open the official printable sale receipt now?`);
      if (openReceipt) {
        window.open(`sale-receipt.html?id=${savedRecord.id}`, '_blank');
      }
    }

    window.location.href = 'sales.html';
  } catch (err) {
    console.error('Error saving sale:', err);
    alert('Error saving customer sale: ' + err.message);
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = isEdit ? 'Update Sale Record' : 'Save Customer Sale Record';
    }
  }
}

async function loadSaleDataForEdit(saleId) {
  try {
    const sale = await window.dbService.getSaleById(saleId);
    if (!sale) {
      alert('Sale record not found.');
      window.location.href = 'sales.html';
      return;
    }

    // Populate all fields
    setInputValue('customer_name', sale.customer_name);
    setInputValue('father_husband_name', sale.father_husband_name || '');
    setInputValue('cnic', sale.cnic);
    setInputValue('phone', sale.phone);
    setInputValue('whatsapp', sale.whatsapp || sale.phone);
    setInputValue('address', sale.address || '');
    setInputValue('city', sale.city || 'Rawalpindi');

    setInputValue('brand', sale.brand);
    setInputValue('model', sale.model);
    setInputValue('variant', sale.variant || '');
    setInputValue('year', sale.year);
    setInputValue('registration_number', sale.registration_number);
    setInputValue('chassis_number', sale.chassis_number || '');
    setInputValue('engine_number', sale.engine_number || '');
    setInputValue('color', sale.color || '');
    setInputValue('mileage', sale.mileage || '');
    setInputValue('condition', sale.condition || 'Used');
    setInputValue('import_local', sale.import_local || 'Local');

    setInputValue('sale_date', sale.sale_date);
    setInputValue('total_sale_price', sale.total_sale_price);
    setInputValue('advance_payment', sale.advance_payment);
    setInputValue('payment_method', sale.payment_method);
    setInputValue('payment_status', sale.payment_status);
    setInputValue('expected_payment_date', sale.expected_payment_date || '');

    setInputValue('transfer_status', sale.transfer_status);
    setInputValue('biometric_status', sale.biometric_status);
    setInputValue('excise_status', sale.excise_status);
    setInputValue('documents_pending', sale.documents_pending || '');
    setInputValue('notes', sale.notes || '');

    setInputValue('purchase_price', sale.purchase_price || '');
    setInputValue('sale_price', sale.sale_price || sale.total_sale_price);
    setInputValue('additional_expenses', sale.additional_expenses || '');
    setInputValue('seller_source', sale.seller_source || '');
    setInputValue('salesperson', sale.salesperson || 'Arslan Farooq');

    // Document checkboxes
    if (Array.isArray(sale.documents_received)) {
      document.querySelectorAll('input[name="documents_received"]').forEach(cb => {
        cb.checked = sale.documents_received.includes(cb.value);
      });
    }

    recalcSaleFinancials();
  } catch (err) {
    console.error('Error loading sale for edit:', err);
    alert('Failed to load sale details.');
  }
}

// ==============================================================================
// 3. DETAIL VIEW MODAL
// ==============================================================================
async function showSaleDetailsModal(saleId) {
  const backdrop = document.getElementById('saleDetailModalBackdrop');
  const body = document.getElementById('saleDetailModalBody');
  if (!backdrop || !body) return;

  body.innerHTML = `<div style="text-align: center; padding: 3rem; color: #9CA3AF;">Loading details...</div>`;
  backdrop.classList.add('active');

  try {
    const sale = await window.dbService.getSaleById(saleId);
    if (!sale) {
      body.innerHTML = `<div style="color: #EF4444; padding: 2rem;">Sale record not found.</div>`;
      return;
    }

    const total = Number(sale.total_sale_price) || 0;
    const advance = Number(sale.advance_payment) || 0;
    const remaining = Number(sale.remaining_amount) || 0;
    const profit = Number(sale.final_profit) || 0;
    const docs = Array.isArray(sale.documents_received) ? sale.documents_received : [];

    body.innerHTML = `
      <!-- RECEIPT & HEADER -->
      <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(220, 38, 38, 0.1); border: 1px solid rgba(220, 38, 38, 0.3); border-radius: 10px; padding: 1rem 1.25rem; margin-bottom: 1.5rem;">
        <div>
          <div style="font-size: 0.75rem; color: #9CA3AF; text-transform: uppercase; font-weight: 700;">Official Receipt Number</div>
          <div style="font-family: 'Outfit', sans-serif; font-size: 1.25rem; font-weight: 900; color: #DC2626;">${escapeHtml(sale.receipt_number || 'N/A')}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 0.75rem; color: #9CA3AF; text-transform: uppercase; font-weight: 700;">Sale Date</div>
          <div style="font-weight: 700; color: #FFFFFF;">${sale.sale_date ? new Date(sale.sale_date).toLocaleDateString('en-GB') : 'N/A'}</div>
        </div>
      </div>

      <!-- 1. CUSTOMER DETAILS -->
      <div class="detail-section-card">
        <div class="detail-section-title">1. Customer Information</div>
        <div class="detail-info-grid">
          <div class="detail-info-item">
            <span class="detail-info-label">Customer Name</span>
            <span class="detail-info-val" style="color: #FFFFFF; font-weight: 800;">${escapeHtml(sale.customer_name)}</span>
          </div>
          <div class="detail-info-item">
            <span class="detail-info-label">Father / Husband Name</span>
            <span class="detail-info-val">${escapeHtml(sale.father_husband_name || 'N/A')}</span>
          </div>
          <div class="detail-info-item">
            <span class="detail-info-label">CNIC Number</span>
            <span class="detail-info-val" style="color: #60A5FA; font-family: monospace;">${escapeHtml(sale.cnic || 'N/A')}</span>
          </div>
          <div class="detail-info-item">
            <span class="detail-info-label">Phone Number</span>
            <span class="detail-info-val">📞 ${escapeHtml(sale.phone || 'N/A')}</span>
          </div>
          <div class="detail-info-item">
            <span class="detail-info-label">WhatsApp</span>
            <span class="detail-info-val">💬 ${escapeHtml(sale.whatsapp || sale.phone || 'N/A')}</span>
          </div>
          <div class="detail-info-item">
            <span class="detail-info-label">City / Address</span>
            <span class="detail-info-val">${escapeHtml(sale.city || '')}${sale.address ? ` - ${escapeHtml(sale.address)}` : ''}</span>
          </div>
        </div>
      </div>

      <!-- 2. VEHICLE DETAILS -->
      <div class="detail-section-card">
        <div class="detail-section-title">2. Vehicle Specifications</div>
        <div class="detail-info-grid">
          <div class="detail-info-item">
            <span class="detail-info-label">Vehicle</span>
            <span class="detail-info-val" style="font-weight: 800;">${sale.year} ${escapeHtml(sale.brand)} ${escapeHtml(sale.model)}</span>
          </div>
          <div class="detail-info-item">
            <span class="detail-info-label">Variant / Package</span>
            <span class="detail-info-val">${escapeHtml(sale.variant || 'Standard')}</span>
          </div>
          <div class="detail-info-item">
            <span class="detail-info-label">Registration Number</span>
            <span class="detail-info-val" style="color: #34D399; font-weight: 800;">${escapeHtml(sale.registration_number || 'Unregistered')}</span>
          </div>
          <div class="detail-info-item">
            <span class="detail-info-label">Engine Number</span>
            <span class="detail-info-val" style="font-family: monospace;">${escapeHtml(sale.engine_number || 'N/A')}</span>
          </div>
          <div class="detail-info-item">
            <span class="detail-info-label">Chassis Number</span>
            <span class="detail-info-val" style="font-family: monospace;">${escapeHtml(sale.chassis_number || 'N/A')}</span>
          </div>
          <div class="detail-info-item">
            <span class="detail-info-label">Colour & Condition</span>
            <span class="detail-info-val">${escapeHtml(sale.color || 'N/A')} • ${escapeHtml(sale.condition || 'Used')} (${escapeHtml(sale.import_local || 'Local')})</span>
          </div>
        </div>
      </div>

      <!-- 3. PAYMENT & SALE BREAKDOWN -->
      <div class="detail-section-card">
        <div class="detail-section-title">3. Financial & Payment Breakdown</div>
        <div class="detail-info-grid">
          <div class="detail-info-item">
            <span class="detail-info-label">Total Sale Price</span>
            <span class="detail-info-val" style="font-size: 1.25rem; font-weight: 900; color: #FFFFFF;">${APP_CONFIG.formatPKR(total)}</span>
          </div>
          <div class="detail-info-item">
            <span class="detail-info-label">Advance / Down Payment</span>
            <span class="detail-info-val" style="font-size: 1.25rem; font-weight: 800; color: #10B981;">${APP_CONFIG.formatPKR(advance)}</span>
          </div>
          <div class="detail-info-item">
            <span class="detail-info-label">Remaining Balance</span>
            <span class="detail-info-val" style="font-size: 1.25rem; font-weight: 800; color: ${remaining > 0 ? '#EF4444' : '#10B981'};">
              ${APP_CONFIG.formatPKR(remaining)}
            </span>
          </div>
          <div class="detail-info-item">
            <span class="detail-info-label">Payment Method</span>
            <span class="detail-info-val">${escapeHtml(sale.payment_method || 'Cash')}</span>
          </div>
          <div class="detail-info-item">
            <span class="detail-info-label">Payment Status</span>
            <span class="detail-info-val" style="color: #FBBF24; font-weight: 700;">${escapeHtml(sale.payment_status || 'Paid')}</span>
          </div>
          <div class="detail-info-item">
            <span class="detail-info-label">Expected Balance Due Date</span>
            <span class="detail-info-val">${sale.expected_payment_date ? new Date(sale.expected_payment_date).toLocaleDateString('en-GB') : 'Fully Settled'}</span>
          </div>
        </div>
      </div>

      <!-- 4. DOCUMENTATION & BIOMETRIC STATUS -->
      <div class="detail-section-card">
        <div class="detail-section-title">4. Documentation & Biometrics</div>
        <div class="detail-info-grid" style="margin-bottom: 1rem;">
          <div class="detail-info-item">
            <span class="detail-info-label">Ownership Transfer</span>
            <span class="detail-info-val">${escapeHtml(sale.transfer_status || 'In Process')}</span>
          </div>
          <div class="detail-info-item">
            <span class="detail-info-label">Biometric Verification</span>
            <span class="detail-info-val">${escapeHtml(sale.biometric_status || 'Done')}</span>
          </div>
          <div class="detail-info-item">
            <span class="detail-info-label">Excise Status</span>
            <span class="detail-info-val">${escapeHtml(sale.excise_status || 'In Process')}</span>
          </div>
        </div>

        <div style="font-size: 0.8rem; color: #9CA3AF; font-weight: 700; margin-bottom: 0.4rem;">Documents Handed Over / Received:</div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
          ${docs.length > 0 ? docs.map(d => `<span style="background: rgba(16,185,129,0.15); color: #34D399; padding: 0.25rem 0.65rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600;">✓ ${escapeHtml(d)}</span>`).join('') : '<span style="color: #9CA3AF; font-size: 0.8rem;">No documents specified</span>'}
        </div>

        ${sale.documents_pending ? `
          <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 8px; padding: 0.75rem; font-size: 0.8125rem; color: #FCA5A5; margin-bottom: 0.75rem;">
            <b>Pending Documents:</b> ${escapeHtml(sale.documents_pending)}
          </div>
        ` : ''}

        ${sale.notes ? `
          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--admin-border); border-radius: 8px; padding: 0.75rem; font-size: 0.8125rem; color: #D1D5DB;">
            <b>Special Remarks / Terms:</b> ${escapeHtml(sale.notes)}
          </div>
        ` : ''}
      </div>

      <!-- 5. INTERNAL DEALERSHIP FINANCIALS (CONFIDENTIAL) -->
      <div class="detail-section-card" style="border-color: rgba(59, 130, 246, 0.3); background: rgba(59, 130, 246, 0.03);">
        <div class="detail-section-title" style="color: #60A5FA;">5. Internal Dealership Accounting (Staff Only)</div>
        <div class="detail-info-grid">
          <div class="detail-info-item">
            <span class="detail-info-label">Vehicle Purchase Cost</span>
            <span class="detail-info-val">${APP_CONFIG.formatPKR(sale.purchase_price || 0)}</span>
          </div>
          <div class="detail-info-item">
            <span class="detail-info-label">Additional Expenses</span>
            <span class="detail-info-val">${APP_CONFIG.formatPKR(sale.additional_expenses || 0)}</span>
          </div>
          <div class="detail-info-item">
            <span class="detail-info-label">Net Realized Profit</span>
            <span class="detail-info-val" style="font-size: 1.25rem; font-weight: 900; color: #10B981;">
              ${profit >= 0 ? '+' : ''}${APP_CONFIG.formatPKR(profit)}
            </span>
          </div>
          <div class="detail-info-item">
            <span class="detail-info-label">Acquired From / Source</span>
            <span class="detail-info-val">${escapeHtml(sale.seller_source || 'Showroom Sourcing')}</span>
          </div>
          <div class="detail-info-item">
            <span class="detail-info-label">Authorized Staff Member</span>
            <span class="detail-info-val">${escapeHtml(sale.salesperson || 'Arslan Farooq')}</span>
          </div>
        </div>
      </div>
    `;

    // Modal action buttons
    const modalFooter = document.getElementById('saleDetailModalFooter');
    if (modalFooter) {
      modalFooter.innerHTML = `
        <a href="sale-receipt.html?id=${sale.id}" target="_blank" class="btn btn-primary btn-sm">🖨️ Official Print Receipt</a>
        <button class="btn btn-outline btn-sm" onclick="shareSaleViaWhatsApp('${sale.id}')" style="color: #22C55E; border-color: rgba(34,197,94,0.4);">💬 WhatsApp Share</button>
        <a href="edit-sale.html?id=${sale.id}" class="btn btn-outline btn-sm">✏️ Edit Record</a>
        <button class="btn btn-outline btn-sm" onclick="closeSaleModal()">Close</button>
      `;
    }
  } catch (err) {
    console.error('Error fetching sale details:', err);
    body.innerHTML = `<div style="color: #EF4444; padding: 2rem;">Error displaying details.</div>`;
  }
}

function closeSaleModal() {
  const backdrop = document.getElementById('saleDetailModalBackdrop');
  if (backdrop) backdrop.classList.remove('active');
}

// ==============================================================================
// 4. WHATSAPP SHARE GENERATOR
// ==============================================================================
async function shareSaleViaWhatsApp(saleId) {
  try {
    const sale = await window.dbService.getSaleById(saleId);
    if (!sale) return;

    const total = Number(sale.total_sale_price) || 0;
    const advance = Number(sale.advance_payment) || 0;
    const remaining = Number(sale.remaining_amount) || 0;
    const saleDateStr = sale.sale_date ? new Date(sale.sale_date).toLocaleDateString('en-GB') : 'N/A';

    const cleanPhone = (sale.whatsapp || sale.phone || '03133884499').replace(/\D/g, '');
    let waPhone = cleanPhone;
    if (waPhone.startsWith('0')) {
      waPhone = '92' + waPhone.substring(1);
    } else if (!waPhone.startsWith('92')) {
      waPhone = '92' + waPhone;
    }

    const message = `*WELCOME MOTOR - VEHICLE SALE RECEIPT*
━━━━━━━━━━━━━━━━━━━━━
*Receipt No:* ${sale.receipt_number || 'WM-REC'}
*Sale Date:* ${saleDateStr}

*CUSTOMER DETAILS:*
• Name: ${sale.customer_name}
• CNIC: ${sale.cnic}
• Contact: ${sale.phone}

*VEHICLE PARTICULARS:*
• Vehicle: ${sale.year} ${sale.brand} ${sale.model} ${sale.variant || ''}
• Reg No: ${sale.registration_number || 'Unregistered'}
• Engine No: ${sale.engine_number || 'N/A'}
• Chassis No: ${sale.chassis_number || 'N/A'}
• Color: ${sale.color || 'N/A'}

*PAYMENT BREAKDOWN:*
• Total Sale Price: PKR ${total.toLocaleString()}
• Advance / Received: PKR ${advance.toLocaleString()}
• Remaining Balance: PKR ${remaining.toLocaleString()}
• Payment Status: ${sale.payment_status}
${remaining > 0 && sale.expected_payment_date ? `• Balance Due Date: ${new Date(sale.expected_payment_date).toLocaleDateString('en-GB')}` : ''}

*DOCUMENTATION:*
• Transfer Status: ${sale.transfer_status}
• Biometric Status: ${sale.biometric_status}

━━━━━━━━━━━━━━━━━━━━━
*WELCOME MOTOR*
Arslan Farooq | Rawalpindi Cricket Stadium
📞 0313-3884499 | Open 24/7
www.welcomemotor.pk`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${waPhone}?text=${encoded}`, '_blank');
  } catch (err) {
    console.error('Error sharing on WhatsApp:', err);
    alert('Error preparing WhatsApp message: ' + err.message);
  }
}

// ==============================================================================
// 5. DELETE WITH CONFIRMATION
// ==============================================================================
async function deleteSaleWithConfirm(id, title) {
  if (confirm(`⚠️ Permanent Deletion Confirmation:\n\nAre you sure you want to permanently delete the sale record for:\n"${title}"?\n\nThis will remove the transaction from records.`)) {
    try {
      await window.dbService.deleteSale(id);
      await initSalesDashboard();
      alert('Sale record deleted successfully.');
    } catch (err) {
      alert('Error deleting sale: ' + err.message);
    }
  }
}

// ==============================================================================
// UTILITIES
// ==============================================================================
function setInputValue(name, val) {
  const input = document.querySelector(`[name="${name}"]`);
  if (input) {
    input.value = val;
  }
}

function formatPKRCompact(num) {
  if (num === null || num === undefined) return '0 PKR';
  const val = Number(num);
  if (isNaN(val)) return '0 PKR';
  
  if (val >= 10000000) {
    return (val / 10000000).toFixed(2) + ' Cr';
  } else if (val >= 100000) {
    return (val / 100000).toFixed(2) + ' Lac';
  }
  return val.toLocaleString() + ' PKR';
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
