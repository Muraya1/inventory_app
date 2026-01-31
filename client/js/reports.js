//const API_REPORT_ITEMS_URL = 'http://localhost/inventory_app/api/endpoints/reports.php?resource=items';
//const API_REPORT_ORDERS_URL = 'http://localhost/inventory_app/api/endpoints/reports.php?resource=orders';
//const API_REPORT_ORDERS_URL = 'http://localhost/inventory_app/api/endpoints/orders.php?resource=reports'; // UPDATED ENDPOINT
//let globalOrderReportData = [];
//const REPORT = 'http://localhost/inventory_app/api/endpoints/data.php?resource=reports';
async function fetchOrderReportData() {
    const authToken = localStorage.getItem('auth_token');
    const tbody = document.getElementById('orderReportBody');
    const downloadButton = document.getElementById('downloadItemReport');
    const grandTotalEl = document.getElementById('grandTotalCost'); // ADD THIS

    if (!tbody || !authToken) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="5">Authentication required.</td></tr>';
        return;
    }

    try {
        const response = await fetch(API_REPORT_ORDERS_URL, {
        // const response = await fetch(REPORT, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const orders = await response.json();

        if (response.ok) {
            tbody.innerHTML = '';
            //globalOrderReportData = orders;
            if (downloadButton) downloadButton.disabled = false;

            if (orders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5">No orders found in the system.</td></tr>';
                if (grandTotalEl) grandTotalEl.innerText = '$0.00';
                return;
            }
            renderOrderFrequencyChart(orders);

            let grandTotal = 0; // 🔥 GRAND TOTAL

            orders.forEach(order => {
                const row = document.createElement('tr');

                // 🧮 Calculate order total
                let orderTotal = 0;

                const itemListHtml = order.items.map(item => {
                    const qty = parseFloat(item.quantity) || 0;
                    const cost = parseFloat(item.item_cost) || 0;
                    const itemTotal = qty * cost;

                    orderTotal += itemTotal;
                    grandTotal += itemTotal;

                    return `<li>${qty} x ${item.name} — $${itemTotal.toFixed(2)}</li>`;
                }).join('');

                row.innerHTML = `
                    <td>#${order.order_id}</td>
                    <td>${order.username} (for ${order.receiver_name})</td>
                    <td>${order.order_timestamp.substring(0, 16).replace('T', ' ')}</td>
                    <td>
                        <ul class="item-list">
                            ${itemListHtml}
                            <li style="font-weight:bold; margin-top:4px;">
                                Order Total: $${orderTotal.toFixed(2)}
                            </li>
                        </ul>
                    </td>
                    <td>
                        <span style="color: green; font-weight: bold;">
                            ${order.status}
                        </span>
                    </td>
                `;

                tbody.appendChild(row);
            });

            // 💰 DISPLAY GRAND TOTAL
            if (grandTotalEl) {
                grandTotalEl.innerText = `$${grandTotal.toFixed(2)}`;
            }

        } else {
            globalOrderReportData = [];
            if (downloadButton) downloadButton.disabled = true;
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="error-message">
                        Error: ${orders.message || 'Server error'}
                    </td>
                </tr>
            `;
            if (grandTotalEl) grandTotalEl.innerText = '$0.00';
        }

    } catch (error) {
        globalOrderReportData = [];
        if (downloadButton) downloadButton.disabled = true;
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="error-message">
                    Network error: Could not load order report.
                </td>
            </tr>
        `;
        if (grandTotalEl) grandTotalEl.innerText = '$0.00';
    }
}
document.addEventListener('DOMContentLoaded', fetchOrderReportData);
////////////////////////////////////////
// async function checkLowStock() {
//     const res = await fetch('http://localhost/inventory_app/api/endpoints/low-stock.php');
//     const data = await res.json();

//     const dot = document.getElementById('alertDot');

//     if (data.low_stock_count > 0) {
//         dot.classList.remove('hidden');
//     } else {
//         dot.classList.add('hidden');
//     }
// }


// // Run on page load
// checkLowStock();

// // Optional: poll every 30s
// ////setInterval(checkLowStock, 3000);
// ////////////////////////////////////////
// function renderAlerts(alerts) {
//     const tbody = document.getElementById('lowStockLogBody');
//     tbody.innerHTML = alerts.map(alert => `
//         <tr>
//             <td>${alert.created_at}</td>
//             <td>${alert.item_name}</td>
//             <td>${alert.stock_level} (Initial)</td>
//             <td><span class="badge" style="background: #fee2e2; color: #b91c1c; padding: 4px 8px; border-radius: 4px;">Needs Restock</span></td>
//         </tr>
//     `).join('');
// }

// const REPORT = 'http://localhost/inventory_app/api/endpoints/data.php?resource=reports';
// async function loadOrderReports() {
//     const tableBody = document.getElementById('reportTableBody');
//     const grandTotalElement = document.getElementById('grandTotal');
//     const authToken = localStorage.getItem('auth_token');

//     try {
//         const response = await fetch(REPORT, {
//             headers: { 'Authorization': `Bearer ${authToken}` }
//         });
//         const result = await response.json();

//         if (response.ok && result.data) {
//             let overallTotal = 0;
//             if (tableBody){
//             tableBody.innerHTML = '';}
            

//             result.data.forEach(order => {
//                 const orderTotal = parseFloat(order.total_order_cost || 0);
//                 overallTotal += orderTotal;

//                 const row = document.createElement('tr');
//                 row.innerHTML = `
//                     <td>#${order.order_id}</td>
//                     <td>${order.order_timestamp}</td>
//                     <td>${order.receiver_name}</td>
//                     <td>${order.department_name}</td>
//                     <td>${order.vendor_name}</td>
//                     <td><strong>$${orderTotal.toFixed(2)}</strong></td>
//                 `;
//                 tableBody.appendChild(row);
//             });

//             grandTotalElement.textContent = `$${overallTotal.toFixed(2)}`;
//         }
//     } catch (error) {
//         console.error("Report error:", error);
//         tableBody.innerHTML = '<tr><td colspan="6">Error loading report data.</td></tr>';
//     }
// }

// //Initialize on page load
// document.addEventListener('DOMContentLoaded', loadOrderReports);


async function loadTotalExpenditure() {
    const grandTotalElement = document.getElementById('grandTotal');
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const authToken = localStorage.getItem('auth_token');

    if (!startDate || !endDate) {
        alert("Please select a date range.");
        return;
    }
    const url = `http://localhost/inventory_app/api/endpoints/reports.php?resource=total_expenditure&start_date=${startDate}&end_date=${endDate}`;
    //const url = `${REPORT_URL}?resource=reports&start_date=${startDate}&end_date=${endDate}`;

    try {
        grandTotalElement.textContent = "Calculating...";

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const result = await response.json();

        if (response.ok) {
            // The API now gives us the exact number we need
            const total = parseFloat(result.total_expenditure).toFixed(2);
            grandTotalElement.textContent = `$${total}`;
        } else {
            grandTotalElement.textContent = "$0.00";
        }
    } catch (error) {
        grandTotalElement.textContent = "Error";
    }
}
//document.getElementById('filterBtn').addEventListener('click', loadTotalExpenditure);