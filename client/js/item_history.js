// client/js/item_history.js
const API_BASE = 'http://localhost/inventory_app/api/endpoints';

let allItems    = [];   // from getitem()
let currentData = null; // full history of selected item

// ─────────────────────────────────────────
// 1. Load all items on page load (for search)
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadAllItems();

    // Live search filter
    document.getElementById('item-search').addEventListener('input', function () {
        filterDropdown(this.value.trim());
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown-wrapper')) {
            document.getElementById('item-dropdown').style.display = 'none';
        }
    });
});

async function loadAllItems() {
    try {
        const res    = await fetch(`${API_BASE}/getitems.php`);
        const result = await res.json();
        if (result.status === 'success') {
            allItems = result.data;
        }
    } catch (err) {
        console.error('Failed to load items:', err);
    }
}

// ─────────────────────────────────────────
// 2. Filter dropdown as user types
// ─────────────────────────────────────────
function filterDropdown(query) {
    const dropdown = document.getElementById('item-dropdown');

    if (!query) {
        dropdown.style.display = 'none';
        return;
    }

    const lower   = query.toLowerCase();
    const matches = allItems.filter(item =>
        item.name.toLowerCase().includes(lower) ||
        (item.sku && item.sku.toLowerCase().includes(lower))
    );

    if (matches.length === 0) {
        dropdown.innerHTML = `<div class="dropdown-item" style="color:#aaa">No items found</div>`;
    } else {
        dropdown.innerHTML = matches.map(item => `
    <div class="dropdown-item"
        onclick="selectItem(${item.item_id}, '${item.name.replace(/'/g, "\\'")}')">
        ${item.name}
        <span class="item-sku">${item.sku || ''}</span>
    </div>
`).join('');
    }

    dropdown.style.display = 'block';
}

function triggerSearch() {
    const query = document.getElementById('item-search').value.trim();
    filterDropdown(query);
}

// ─────────────────────────────────────────
// 3. User selects an item → fetch full history
// ─────────────────────────────────────────
async function selectItem(itemId, itemName) {
    // Update input and close dropdown
    document.getElementById('item-search').value = itemName;
    document.getElementById('item-dropdown').style.display = 'none';

    try {
        const res    = await fetch(`${API_BASE}/item_history.php?item_id=${itemId}`);
        
        const result = await res.json();
        //console.log("Item:", result.data.item);

        if (result.status !== 'success') {
            alert('Could not load item history: ' + result.message);
            return;
        }

        currentData = result.data;
        renderAll(currentData);
        document.getElementById('history-section').style.display = 'block';

    } catch (err) {
        console.error('Error fetching history:', err);
        alert('Server error. Please try again.');
    }
}

// ─────────────────────────────────────────
// 4. Render everything
// ─────────────────────────────────────────
function renderAll(data) {
    renderItemCard(data.item);
    renderLogs(data.inventory_logs);
    renderOrders(data.orders);
    renderAlerts(data.low_stock);
    switchTab('logs'); // default tab
}

// Item Info Card

function renderItemCard(item) {
    const activeTag = item.is_active == 1
        ? '<span class="badge-active">● Active</span>'
        : '<span class="badge-inactive">● Inactive</span>';

    document.getElementById('item-info-card').innerHTML = `
        <div class="info-grid">
            <div class="info-item">
                <label>Item Name</label>
                <p>${escapeHtml(item.name)} ${activeTag}</p>
            </div>
            <div class="info-item">
                <label>SKU</label>
                <p>${item.sku || '—'}</p>
            </div>
            <div class="info-item">
                <label>Category</label>
                <p>${item.category_name || '—'}</p>
            </div>
            <div class="info-item">
                <label>Department</label>
                <p>${item.department_name || '—'}</p>
            </div>
            <div class="info-item">
                <label>Current Stock</label>
                <p>${item.stock_level} ${item.measuring_unit}</p>
            </div>
            <div class="info-item">
                <label>Unit Cost</label>
                <p>KES ${parseFloat(item.item_cost).toLocaleString()}</p>
            </div>
            <div class="info-item">
                <label>Date Created</label>
                <p>${formatDate(item.date_created)}</p>
            </div>
            <div class="info-item">
                <label>Last Stock Received</label>
                <p>${formatDate(item.last_stock_received)}</p>
            </div>
        </div>
    `;
}

// Stock Logs
function renderLogs(logs) {
    const tbody = document.getElementById('logs-body');
    if (!logs.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No stock logs found.</td></tr>`;
        return;
    }

    tbody.innerHTML = logs.map((log, i) => {
        const change    = parseFloat(log.quantity_added);
        const changeTag = change >= 0
            ? `<span class="tag tag-green">+${change}</span>`
            : `<span class="tag tag-red">${change}</span>`;

        const typeTag = log.change_type === 'RESTOCK'
            ? `<span class="tag tag-blue">RESTOCK</span>`
            : `<span class="tag tag-grey">${log.change_type}</span>`;

        return `
            <tr>
                <td>${i + 1}</td>
                <td>${formatDate(log.update_date)}</td>
                <td>${typeTag}</td>
                <td>${log.old_quantity}</td>
                <td>${changeTag}</td>
                <td>${log.new_quantity}</td>
                <td>${log.user_name || '—'}</td>
            </tr>
        `;
    }).join('');
}

// Orders
function renderOrders(orders) {
    const tbody = document.getElementById('orders-body');
    if (!orders.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No orders found for this item.</td></tr>`;
        return;
    }

    tbody.innerHTML = orders.map(o => {
        const statusMap = {
            APPROVED: 'tag-green',
            PENDING:  'tag-orange',
            REJECTED: 'tag-red'
        };
        const statusTag = `<span class="tag ${statusMap[o.order_status] || 'tag-grey'}">${o.order_status}</span>`;

        return `
            <tr>
                <td>#${o.order_id}</td>
                <td>${formatDate(o.order_timestamp)}</td>
                <td>${escapeHtml(o.receiver_name)}</td>
                <td>${escapeHtml(o.vendor_name || '—')}</td>
                <td>${escapeHtml(o.department_name || '—')}</td>
                <td>${o.quantity}</td>
                <td>KES ${parseFloat(o.unit_price).toLocaleString()}</td>
                <td>${statusTag}</td>
            </tr>
        `;
    }).join('');
}

// Low Stock Alerts
function renderAlerts(alerts) {
    const tbody = document.getElementById('alerts-body');
    if (!alerts.length) {
        tbody.innerHTML = `<tr><td colspan="4" class="empty-state">No low stock alerts for this item.</td></tr>`;
        return;
    }

    tbody.innerHTML = alerts.map((a, i) => {
        const resolvedTag = a.resolved == 1
            ? `<span class="tag tag-green">Resolved</span>`
            : `<span class="tag tag-red">Active</span>`;

        return `
            <tr>
                <td>${i + 1}</td>
                <td>${formatDate(a.created_at)}</td>
                <td>${a.stock_level}</td>
                <td>${resolvedTag}</td>
            </tr>
        `;
    }).join('');
}

// ─────────────────────────────────────────
// 5. Tabs

function switchTab(tab) {
    // Hide all panels
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    
    // Deactivate all tab buttons
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    // Show selected panel
    document.getElementById(`tab-${tab}`).classList.add('active');

    // Activate the matching button by data attribute
    const activeBtn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
    if (activeBtn) activeBtn.classList.add('active');
}

// ─────────────────────────────────────────
// 6. Download CSV
// ─────────────────────────────────────────
function downloadCSV() {
    if (!currentData) return;

    const item = currentData.item;
    let csv = '';

    // Item Info
    csv += `ITEM HISTORY REPORT\n`;
    csv += `Generated:,${new Date().toLocaleString()}\n\n`;
    csv += `Item Name,SKU,Category,Department,Stock Level,Unit Cost,Status\n`;
    csv += `"${item.name}","${item.sku || ''}","${item.category_name || ''}","${item.department_name || ''}",${item.stock_level},"KES ${item.item_cost}","${item.is_active == 1 ? 'Active' : 'Inactive'}"\n\n`;

    // Stock Logs
    csv += `STOCK MOVEMENT LOGS\n`;
    csv += `Date,Change Type,Old Qty,Change,New Qty,Updated By\n`;
    currentData.inventory_logs.forEach(log => {
        csv += `"${log.update_date}","${log.change_type}",${log.old_quantity},${log.quantity_added},${log.new_quantity},"${log.user_name || ''}"\n`;
    });

    csv += `\nORDERS\n`;
    csv += `Order #,Date,Receiver,Vendor,Department,Qty Taken,Unit Price,Status\n`;
    currentData.orders.forEach(o => {
        csv += `${o.order_id},"${o.order_timestamp}","${o.receiver_name}","${o.vendor_name || ''}","${o.department_name || ''}",${o.quantity},${o.unit_price},"${o.order_status}"\n`;
    });

    csv += `\nLOW STOCK ALERTS\n`;
    csv += `Date Triggered,Stock Level,Resolved\n`;
    currentData.low_stock.forEach(a => {
        csv += `"${a.created_at}",${a.stock_level},"${a.resolved == 1 ? 'Yes' : 'No'}"\n`;
    });

    // Trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `item_history_${item.name.replace(/\s+/g, '_')}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────
// 7. Helpers
// ─────────────────────────────────────────
function clearHistory() {
    document.getElementById('history-section').style.display = 'none';
    document.getElementById('item-search').value = '';
    currentData = null;
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-KE', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}