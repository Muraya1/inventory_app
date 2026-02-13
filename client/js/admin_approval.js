// admin_approvals.js - Admin Order Approval System
// API Base URL - CHANGE THIS to match your server
const API_BASE = 'http://localhost/inventory_app/api/endpoints';

// Global state
let allOrders = [];
let currentFilter = 'all';
let currentRejectOrderId = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
    loadOrders();
    setupFilterButtons();
    setupAutoRefresh();
});

/**
 * Check if user is admin
 */
function checkAdminAuth() {
    const userRole = sessionStorage.getItem('user_role') || localStorage.getItem('user_role');
    
    if (userRole !== 'admin') {
        showAlert('Access Denied. Admin privileges required.', 'error');
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 20000);
    }
}

/**
 * Load all pending orders
 */
async function loadOrders() {
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE}/pending_orders.php`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            allOrders = data.orders || [];
            updateStatistics();
            renderOrders();
        } else {
            throw new Error(data.message || 'Failed to load orders');
        }

    } catch (error) {
        console.error('Error loading orders:', error);
        showError('Failed to load orders: ' + error.message);
    }
}

/**
 * Update statistics cards
 */
function updateStatistics() {
    const pending = allOrders.length;
    const stockOk = allOrders.filter(o => o.can_approve).length;
    const stockIssues = allOrders.filter(o => !o.can_approve).length;

    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('statPending').textContent = pending;
    
    // Note: Approved/Rejected today stats would need a separate API call
    // For now, we'll just show pending stats
    document.getElementById('statApproved').textContent = '-';
    document.getElementById('statRejected').textContent = '-';
}

/**
 * Render orders based on current filter
 */
function renderOrders() {
    const container = document.getElementById('ordersContainer');
    
    // Filter orders
    let filteredOrders = allOrders;
    
    if (currentFilter === 'stock-ok') {
        filteredOrders = allOrders.filter(o => o.can_approve);
    } else if (currentFilter === 'stock-warning') {
        filteredOrders = allOrders.filter(o => !o.can_approve);
    }

    // Check if empty
    if (filteredOrders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <h3>No Pending Orders</h3>
                <p>All orders have been processed. Great job!</p>
            </div>
        `;
        return;
    }

    // Render order cards
    container.innerHTML = filteredOrders.map(order => createOrderCard(order)).join('');
}

/**
 * Create HTML for a single order card
 */
function createOrderCard(order) {
    const hasStockIssue = !order.can_approve;
    const totalAmount = parseFloat(order.total_amount || 0).toFixed(2);
    
    // Format date
    const orderDate = new Date(order.order_timestamp);
    const formattedDate = orderDate.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Build items HTML
    const itemsHTML = order.items.map(item => {
        const stockStatus = item.current_stock >= item.quantity;
        const stockBadge = stockStatus 
            ? `<span class="stock-ok-badge">✓ Stock OK</span>`
            : `<span class="stock-warning-badge">⚠ Low Stock</span>`;
        
        return `
            <div class="item-row">
                <div>
                    <div class="item-name">${item.name}</div>
                    <div class="item-details">
                        <span>Qty: ${item.quantity} ${item.measuring_unit || 'units'}</span>
                        <span>Price: KSh ${parseFloat(item.unit_price).toFixed(2)}</span>
                        <span>Available: ${item.current_stock}</span>
                        ${stockBadge}
                    </div>
                </div>
                <div style="text-align: right; font-weight: 600; color: #2d3748;">
                    KSh ${(item.quantity * item.unit_price).toFixed(2)}
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="order-card ${hasStockIssue ? 'stock-warning' : ''}" data-order-id="${order.order_id}">
            <div class="order-header">
                <div class="order-info">
                    <h3>Order #${order.order_id}</h3>
                    <div class="order-meta">
                        <span>👤 ${order.created_by_username}</span>
                        <span>📦 ${order.receiver_name}</span>
                        <span>🏢 ${order.vendor_name}</span>
                        <span>🏭 ${order.department_name || 'N/A'}</span>
                        <span>📅 ${formattedDate}</span>
                    </div>
                </div>
                <span class="status-badge pending">Pending</span>
            </div>

            ${hasStockIssue ? `
                <div style="background: #fff5f5; border: 2px solid #f56565; border-radius: 8px; padding: 12px; margin-bottom: 15px; color: #c53030; font-weight: 600;">
                    ⚠️ ${order.stock_issue}
                </div>
            ` : ''}

            <div class="order-items">
                <h4>📋 Order Items (${order.item_count})</h4>
                ${itemsHTML}
                <div class="order-total">
                    <strong>Total: KSh ${totalAmount}</strong>
                </div>
            </div>

            <div class="order-actions">
                <button class="btn-view" onclick="viewOrderTimeline(${order.order_id})">
                    📊 View Timeline
                </button>
                <button class="btn-reject" onclick="openRejectModal(${order.order_id})">
                    ❌ Reject
                </button>
                <button class="btn-approve" 
                        onclick="approveOrder(${order.order_id})"
                        ${hasStockIssue ? 'disabled' : ''}>
                    ✅ Approve & Deduct Stock
                </button>
            </div>
        </div>
    `;
}

/**
 * Approve an order
 */
async function approveOrder(orderId) {
    if (!confirm(`Are you sure you want to APPROVE Order #${orderId}?\n\nThis will:\n✓ Deduct stock from inventory\n✓ Mark order as approved\n✓ Notify the vendor`)) {
        return;
    }

    try {
        showAlert('Processing approval...', 'warning');

        const response = await fetch(`${API_BASE}/approve_order.php`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                order_id: orderId,
                note: 'Approved by admin'
            })
        });

        const data = await response.json();

        if (data.success) {
            showAlert(`✅ Order #${orderId} approved successfully! Stock has been deducted.`, 'success');
            
            // Remove the order from the list
            allOrders = allOrders.filter(o => o.order_id !== orderId);
            updateStatistics();
            renderOrders();

            // Play success sound (optional)
            playSuccessSound();

        } else {
            throw new Error(data.message || 'Approval failed');
        }

    } catch (error) {
        console.error('Error approving order:', error);
        showAlert('❌ Failed to approve order: ' + error.message, 'error');
    }
}

/**
 * Open reject modal
 */
function openRejectModal(orderId) {
    currentRejectOrderId = orderId;
     if (orderId == null) {
        console.error('openRejectModal called without orderId');
        return;
    }
    
    document.getElementById('rejectOrderId').textContent = orderId;
    document.getElementById('rejectionReason').value = '';
    document.getElementById('rejectModal').classList.add('active');
}

/**
 * Close reject modal
 */


function closeRejectModal(currentRejectOrderId) {
    currentRejectOrderId = null;
    document.getElementById('rejectModal').classList.remove('active');
}

/**
 * Confirm rejection
 */
async function confirmReject() {
    const reason = document.getElementById('rejectionReason').value.trim();

     if (!currentRejectOrderId) {
         showAlert('No order selected for rejection', 'error');
        return;

 }

    if (!reason) {
        alert('Please provide a rejection reason');
        return;
    }

    if (reason.length < 10) {
        alert('Please provide a more detailed reason (at least 10 characters)');
        return;
    }

    try {
        closeRejectModal();
        showAlert('Processing rejection...', 'warning');
        const orderId = currentRejectOrderId; // snapshot


        const response = await fetch(`${API_BASE}/reject.php`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                order_id: currentRejectOrderId,
                reason: reason
            })
        });

        const data = await response.json();

        if (data.success) {
            // showAlert(`Order #${currentRejectOrderId} has been rejected. Vendor has been notified.`, 'success');
            showAlert(`Order #${orderId} has been rejected. Vendor has been notified.`, 'success');
            // Remove from list
            allOrders = allOrders.filter(o => o.order_id !== orderId);
            updateStatistics();
            renderOrders();

        } else {
            throw new Error(data.message || 'Rejection failed');
        }

    } catch (error) {
        console.error('Error rejecting order:', error);
        showAlert('Failed to reject order: ' + error.message, 'error');
    }
}

/**
 * View order timeline (audit history)
 */
async function viewOrderTimeline(orderId) {
    try {
        const response = await fetch(`${API_BASE}/order_timeline.php?order_id=${orderId}`, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success && data.timeline) {
            displayTimeline(orderId, data.timeline);
        } else {
            throw new Error(data.message || 'Failed to load timeline');
        }

    } catch (error) {
        console.error('Error loading timeline:', error);
        showAlert('Failed to load order timeline', 'error');
    }
}

/**
 * Display timeline in a modal/alert
 */
function displayTimeline(orderId, timeline) {
    if (timeline.length === 0) {
        alert(`Order #${orderId} has no history yet.`);
        return;
    }

    let timelineHTML = `📊 Order #${orderId} Timeline:\n\n`;
    
    timeline.forEach(entry => {
        const date = new Date(entry.changed_at).toLocaleString();
        timelineHTML += `${date}\n`;
        timelineHTML += `${entry.from_status} → ${entry.to_status}\n`;
        timelineHTML += `By: ${entry.changed_by_username} (${entry.changed_by_role})\n`;
        if (entry.reason) {
            timelineHTML += `Reason: ${entry.reason}\n`;
        }
        timelineHTML += `\n`;
    });

    alert(timelineHTML);
}

/**
 * Setup filter buttons
 */
function setupFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active state
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Update filter
            currentFilter = this.dataset.filter;
            renderOrders();
        });
    });
}

/**
 * Refresh orders
 */
function refreshOrders() {
    loadOrders();
    showAlert('Orders refreshed', 'success');
}

/**
 * Setup auto-refresh every 30 seconds
 */
function setupAutoRefresh() {
    setInterval(() => {
        loadOrders();
    }, 300000); // 30 seconds
}

/**
 * Show loading state
 */
function showLoading() {
    const container = document.getElementById('ordersContainer');
    container.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Loading orders...</p>
        </div>
    `;
}

/**
 * Show error state
 */
function showError(message) {
    const container = document.getElementById('ordersContainer');
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <h3>Error Loading Orders</h3>
            <p>${message}</p>
            <button class="btn btn-secondary" onclick="loadOrders()" style="margin-top: 20px;">
                Try Again
            </button>
        </div>
    `;
}

/**
 * Show alert message
 */
function showAlert(message, type = 'success') {
    const container = document.getElementById('alertContainer');
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} show`;
    alertDiv.textContent = message;
    
    container.innerHTML = '';
    container.appendChild(alertDiv);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 300);
    }, 5000);
}

/**
 * Play success sound (optional)
 */
function playSuccessSound() {
    // You can add an audio element if you want sound effects
    // const audio = new Audio('success.mp3');
    // audio.play();
}

/**
 * Close modal when clicking outside
 */
document.addEventListener('click', function(e) {
    const modal = document.getElementById('rejectModal');
    if (e.target === modal) {
        closeRejectModal();
    }
});

/**
 * Handle escape key to close modal
 */
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeRejectModal();
    }
});