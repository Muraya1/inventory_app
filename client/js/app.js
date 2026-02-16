// client/js/app.js (The Consolidated File)
let globalItemReportData = [];
let globalOrderReportData = [];
let currentCategoryItems = [];
let currentPage = 1;         // NEW: Tracks the current page number
const ITEMS_PER_PAGE = 50;
const LOW_STOCK_THRESHOLD = 10; // Items with 10 or fewer in stock are considered 'low'     // NEW: Consistent limit for the API
// --- API Endpoints Configuration ---
// !!! CRITICAL: UPDATE THE PORT and FOLDER NAME if your XAMPP setup is different.
const API_AUTH_URL = 'http://localhost/inventory_app/api/endpoints/auth.php'; 
const API_DATA_URL = 'http://localhost/inventory_app/api/endpoints/data.php?resource=categories'; 
const API_ITEMS_URL = 'http://localhost/inventory_app/api/endpoints/data.php?resource=items';
const API_ORDERS_URL = 'http://localhost/inventory_app/api/endpoints/orders.php'; 
const API_ITEMSR_URL = "http://localhost/inventory_app/api/endpoints/data.php?resource=items&action=receive";
const API_REPORT_ITEMS_URL = 'http://localhost/inventory_app/api/endpoints/data.php?resource=report_items';
const API_REPORT_ORDERS_URL = 'http://localhost/inventory_app/api/endpoints/orders.php?resource=report_orders';
//const API_REPORT_ORDERS_URL: "http://localhost/inventory_app/api/endpoints/orders.php?resource=report_orders"
// =================================================================
// --- Utility & Cart State Management (from what was planned for cart.js) ---
// =================================================================

/**
 * Loads the cart from session storage or initializes an empty array.
 */
function getCart() {
    const cart = sessionStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
}

/**
 * Saves the cart state back to session storage.
 */
function saveCart(cart) {
    sessionStorage.setItem('cart', JSON.stringify(cart));
}

/**
 * Adds an item to the cart or updates its quantity.
 */
function addToCart(itemId, itemName, quantity) {
    let cart = getCart();
    quantity = parseFloat(quantity, 10);
    
    if (quantity <= 0) {
        cart = cart.filter(item => item.item_id !== itemId);
        saveCart(cart);
        console.log(`Item ${itemName} removed from cart.`);
        return;
    }

    const existingItemIndex = cart.findIndex(item => item.item_id === itemId);

    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity = quantity;
    } else {
        cart.push({
            item_id: itemId,
            name: itemName,
            quantity: quantity
        });
    }

    saveCart(cart);
    alert(`Added ${quantity} x ${itemName} to cart!`);
    console.log('Current Cart:', getCart());
}

/**
 * Removes an item from the cart and refreshes the display (used on cart.html).
 */
function removeFromCart(itemId) {
    let cart = getCart();
    cart = cart.filter(item => item.item_id !== itemId);
    saveCart(cart);
    
    // Attempt to refresh the view if the displayCart function is present
    if (typeof displayCart === 'function') {
        displayCart(); 
    }

    if (cart.length === 0) {
        alert('Cart is empty. Redirecting back to items.');
        window.location.href = 'items.html'; 
    }
}


// =================================================================
// --- Phase 1: Login Logic ---

const handleLogin = async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const messageElement = document.getElementById('message');

    messageElement.textContent = '';
    messageElement.style.color = '';

    try {
        const response = await fetch(API_AUTH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        // if (response.ok && data.token) {
        if (response.ok) {

            //localStorage.setItem('auth_token', data.token);
            localStorage.setItem('user_id', data.user.user_id);
            localStorage.setItem('user_role', data.user.role);
            localStorage.setItem('username', data.user.username);
            //localStorage.setItem('item_id', data.item);
            sessionStorage.setItem('user_id', data.user.user_id);
            sessionStorage.setItem('username', data.user.username);
            sessionStorage.setItem('user_role', data.user.role);
            //sessionStorage.setItem('PHPSESSID', data.session_id); // Store the session ID for API calls

            messageElement.textContent = 'Login successful! Redirecting...';
            messageElement.style.color = 'green';

            // redirect after 500ms for smoothness
            setTimeout(() => {
               // window.location.href = 'categories.html';
                window.location.href = 'home.html';
            }, 500);

        } else {
            messageElement.textContent = data.message || 'Login failed.';
            messageElement.style.color = 'red';
        }

    } catch (e) {
        console.error("Network error:", e);
        messageElement.textContent = "Unable to reach the server.";
        messageElement.style.color = 'red';
    }
};



// client/js/app.js (New function)

// client/js/app.js

function applyUserPermissions() {
    const role = localStorage.getItem('user_role');
    
    // 1. Elements visible only to Admin
    const adminElements = document.querySelectorAll('.admin-only');

    if (role === 'user') {
        // Hide Admin UI elements
        adminElements.forEach(el => el.style.display = 'none');
        
        // 2. Hide stock receiving elements on items.html
        // We will target the input and button based on their IDs/classes
        const receiveInputs = document.querySelectorAll('[id^="receive-qty-"]');
        const receiveButtons = document.querySelectorAll('[id^="receive-btn-"]');
        
        receiveInputs.forEach(input => input.style.display = 'none');
        receiveButtons.forEach(button => button.style.display = 'none');
    } 
    // If role is 'admin', nothing is hidden, so no 'else' is needed.
}

// =================================================================
// --- Phase 2: Categories Logic ---
// =================================================================

/**
 * Handles the click event when a user selects a category.
 */
function selectCategory(categoryId, categoryName) {
    sessionStorage.setItem('category_id', categoryId);
    sessionStorage.setItem('category_name', categoryName);
    
    window.location.href = 'items.html';
}



async function fetchAndDisplayCategories() {
    //localStorage.setItem("current_category_id", selectedCategoryId);
    //const authToken = localStorage.getItem('auth_token');
        const user = localStorage.getItem('username');
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const listContainer = document.getElementById('categoryList');
    if (!listContainer) return;

    listContainer.innerHTML = 'Loading categories...';

    try {
        const response = await fetch(API_DATA_URL, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const categories = await response.json();

        if (response.ok) {
            listContainer.innerHTML = '';
            
            categories.forEach(cat => {
                const button = document.createElement('div');
                button.className = 'dept-button'; 
                button.textContent = cat.name;
                button.onclick = () => selectCategory(cat.category_id, cat.name);
                listContainer.appendChild(button);
            });
        } else {
            listContainer.innerHTML = `<p class="error-message">Error fetching data: ${categories.message || 'Server error'}</p>`;
        }

    } catch (error) {
        listContainer.innerHTML = `<p class="error-message">Network error: Could not load categories.</p>`;
    }
}



// =================================================================

const itemsPerPage = 10;

async function loadMoreOrders() {
    //const authToken = localStorage.getItem('auth_token');
    const tbody = document.getElementById('orderHistoryBody');
    const loadMoreBtn = document.getElementById('loadMoreBtn');

    try {
        // Pass page and limit as query parameters
        const response = await fetch(`${API_ORDER_HISTORY_URL}&page=${currentPage}&limit=${itemsPerPage}`, {
        
            method: 'GET',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const orders = await response.json();

        if (response.ok && orders.length > 0) {
            // NOTICE: We do NOT do tbody.innerHTML = '' here. 
            // We want to keep the old rows and add new ones.


            orders.forEach(order => {
                const row = document.createElement('tr');
                 const itemListHtml = order.items.map(item => {
                    const cost = parseFloat(item.unit_price).toFixed(2);
                    return `<li>${item.quantity} x ${item.name} <small>(${cost} )</small></li>`;
                }).join('');

                // 2. Format the Total Order Cost
                const formattedTotal = parseFloat(order.total_cost).toFixed(2);

                row.innerHTML = `
                    <td>${order.order_id}</td>
                    <td>${new Date(order.order_timestamp).toLocaleDateString()}</td>
                    <td>${order.receiver_name}</small></td>
                    <td>${order.department_name}</td>
                    <td>${order.vendor_name}</td>
                    <td><ul class="item-list">${itemListHtml}</ul></td>
                    <td><strong>${formattedTotal}</strong></td>
                    <td><span style="color: green; font-weight: bold;">${order.status}</span></td>
                    
                `;
                
                // ... (Your existing row.innerHTML logic) ...

                tbody.appendChild(row);
            });

            currentPage++; // Move to the next "bit" for the next click
            
            // If we got fewer items than the limit, we reached the end
            if (orders.length < itemsPerPage) {
                loadMoreBtn.style.display = 'none'; 
            }
        } else {
            loadMoreBtn.innerText = "No more orders to load";
            loadMoreBtn.disabled = true;
        }

    } catch (error) {
        console.error("Error loading more orders:", error);
    }
}
async function fetchAndDisplayItems(page = 1) {
    // --- 1. Setup & Validation ---
    //const sessionToken = sessionStorage.getItem('PHPSESSID');
    const userId = sessionStorage.getItem('user_id');
    const categoryId = sessionStorage.getItem('category_id');
    const categoryName = sessionStorage.getItem('category_name');
    
    const listContainer = document.getElementById('itemList');
    const nameDisplay = document.getElementById('categoryNameDisplay');
    
    const limit = ITEMS_PER_PAGE; 

    if (!categoryId || !listContainer || !userId) {
        window.location.href = 'categories.html'; 
        return;
    }

    currentPage = page;
    nameDisplay.textContent = categoryName;

    // --- 2. API Fetch ---
    try {
        const response = await fetch(`${API_ITEMS_URL}&category_id=${categoryId}&limit=${limit}&page=${currentPage}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${''}` }
        });
        
        const responseObj = await response.json(); 
        const items = responseObj.data;
        listContainer.innerHTML = '';
        if (response.ok) {
            currentCategoryItems = items; 
            
            renderItemList(currentCategoryItems);
            
            
            populateItemDropdown();
           
            updatePaginationControls(responseObj.total, responseObj.page, responseObj.limit);

            if (items.length === 0) {
                listContainer.innerHTML = listContainer.querySelector('.item-header').outerHTML + 
                '<p style="grid-column: 1 / span 6; text-align: center; padding-top: 20px;">No items in stock for this category.</p>';
            }

        } else {
            listContainer.innerHTML = listContainer.querySelector('.item-header').outerHTML + 
                `<p class="error-message" style="grid-column: 1 / span 6;">Error fetching items: ${responseObj.message || 'Server error'}</p>`;
        }

    } catch (error) {
        listContainer.innerHTML = listContainer.querySelector('.item-header').outerHTML + 
            `<p class="error-message" style="grid-column: 1 / span 6;">Network error: Could not load items.</p>`;
        console.error("Fetch Items Error:", error);
    }
}


function updatePaginationControls(total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const pageInfo = document.getElementById('pageInfo');
    
    if (pageInfo) pageInfo.textContent = `Page ${page} of ${totalPages}`;

    if (prevBtn) prevBtn.disabled = page <= 1;
    if (nextBtn) nextBtn.disabled = page >= totalPages;

    // Remove old listeners to prevent duplicates
    if (prevBtn) prevBtn.onclick = null;
    if (nextBtn) nextBtn.onclick = null;

    // Attach new listeners to fetch the next/previous page
    if (prevBtn) {
        prevBtn.onclick = () => {
            if (page > 1) fetchAndDisplayItems(page - 1);
        };
    }
    if (nextBtn) {
        nextBtn.onclick = () => {
            if (page < totalPages) fetchAndDisplayItems(page + 1);
        };
    }
}


// =================================================================
// --- Phase 4: Cart Review and Order Submission Logic ---
// =================================================================

/**
 * Renders the current contents of the cart to the cart.html page.
 */
function displayCart() {
    const cart = getCart(); 
    const body = document.getElementById('cartItemsBody');
    const orderForm = document.getElementById('orderForm');
    
    if (!body) return; // Exit if not on the cart page

    body.innerHTML = ''; 

    if (cart.length === 0) {
        body.innerHTML = '<tr><td colspan="3" style="text-align: center;">Your cart is empty.</td></tr>';
        if (orderForm) {
            orderForm.style.pointerEvents = 'none';
            document.getElementById('placeOrderButton').disabled = true;
        }
        return;
    }
    
    if (orderForm) {
        orderForm.style.pointerEvents = 'auto';
        document.getElementById('placeOrderButton').disabled = false;
    }

    cart.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td><button onclick="removeFromCart(${item.item_id})">Remove</button></td>
        `;
        body.appendChild(row);
    });
}



async function handleOrderSubmission(event) {
    event.preventDefault(); 
    const messageElement = document.getElementById('orderMessage');
    const userId = localStorage.getItem('user_id');
    const username = localStorage.getItem('username');
    // Existing fields
    const receiverName = document.getElementById('receiverName').value.trim();
    
    // NEW FIELDS
    const vendorName = document.getElementById('vendorName').value.trim();
    //const departmentName = document.getElementById('departmentName').value.trim();
    const departmentName = document.getElementById('deptSelect').value;
    const placeOrderButton = document.getElementById('placeOrderButton');
    
    const cart = getCart(); 
    //const authToken = localStorage.getItem('auth_token');
    // NOTE: user_id is often better retrieved on the server side from the JWT/token payload

    messageElement.textContent = 'Processing order...';
    placeOrderButton.disabled = true;

    // Enhance validation check
    if (cart.length === 0 || !receiverName || !vendorName || !departmentName || !userId) {
        messageElement.textContent = 'Error: All fields (Receiver, Vendor, Department) and cart items are required.';
        placeOrderButton.disabled = false;
        return;
    }

    try {
        const response = await fetch(API_ORDERS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                //'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                // Pass existing and new fields
                username: username,              // <-- NEW: Include username for better order tracking
                user_id: userId,
                receiver_name: receiverName,
                vendor_name: vendorName,          // <-- NEW
                department_id: departmentName,  // <-- NEW
                items: cart
                // user_id is omitted here, assumed to be read from the JWT on the server
            })
        });
        const data = await response.json();

        if (response.ok) {
            // SUCCESS
            messageElement.textContent = `Order ${data.order_id} placed successfully!`;
            messageElement.style.color = 'green';
            sessionStorage.removeItem('cart'); // Clear cart state
            
            // Redirect back to categories to start a new order
            setTimeout(() => {
                 window.location.href = 'order_success.html'; 
            }, 1500);
            
        } else {
            // FAILURE (Stock issue or transaction error)
            messageElement.textContent = data.message || 'Order failed due to a server error.';
            messageElement.style.color = 'red';
            placeOrderButton.disabled = false;
        }

        // ... (rest of the success/failure logic) ...
        
    } catch (error) {
        messageElement.textContent = 'Network or system error during order submission.';
        messageElement.style.color = 'red';
        placeOrderButton.disabled = false;
        //... (network error handling) ...
    }
}


// =================================================================
// --- DOM Initialization & Listeners ---
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    applyUserPermissions();
    // Listener for the Login Form (on login.html)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});
    
    // Listener for the Order Form (on cart.html)
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', handleOrderSubmission);
    }
    
    // Auto-display function calls based on the page content
    if (document.getElementById('categoryList')) {
        fetchAndDisplayCategories();
    }
    if (document.getElementById('itemList')) {
        fetchAndDisplayItems();
    }
    if (document.getElementById('cartItemsBody')) {
        displayCart();
    }
    // client/js/app.js (Inside the main DOMContentLoaded listener at the bottom)

document.addEventListener('DOMContentLoaded', () => {
    applyUserPermissions();
    // ... existing loginForm listener ...
    // ... existing orderForm listener ...
    const imageUploadForm = document.getElementById('imageUploadForm');
    if (imageUploadForm) {
        populateItemDropdown(); // Load item list for dropdown
        imageUploadForm.addEventListener('submit', handleImageUpload);
    }
    
    // Search Listener (on items.html)
    const searchInput = document.getElementById('itemSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleItemSearch); 
    }
});


// client/js/app.js (Add this function)

const API_ORDER_HISTORY_URL = 'http://localhost/inventory_app/api/endpoints/orders.php?resource=history';



async function fetchAndDisplayOrderHistory() {
    const authToken = localStorage.getItem('auth_token');
    const tbody = document.getElementById('orderHistoryBody');
    
    // Increased colspan to 8 to match the actual number of columns
    const colSpanCount = 8; 
    
    if (!tbody || !authToken) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="${colSpanCount}">Authentication required.</td></tr>`;
        return;
    }

    tbody.innerHTML = `<tr><td colspan="${colSpanCount}">Fetching order history...</td></tr>`;

    // try {
    //     const response = await fetch(API_ORDER_HISTORY_URL, {
    //         method: 'GET',
    //         headers: { 'Authorization': `Bearer ${authToken}`  }
    //     });
    try {
        // Pass page and limit as query parameters
        const response = await fetch(`${API_ORDER_HISTORY_URL}&page=${currentPage}&limit=${itemsPerPage}`, {
        
            method: 'GET',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });


        const orders = await response.json();

        if (response.ok) {
            tbody.innerHTML = '';
            
            if (orders.length === 0) {
                tbody.innerHTML = `<tr><td colspan="${colSpanCount}">No orders found in history.</td></tr>`;
                return;
            }

            orders.forEach(order => {
                const row = document.createElement('tr');
                
                // 1. Format items to show quantity, name, and individual cost
                const itemListHtml = order.items.map(item => {
                    const cost = parseFloat(item.unit_price).toFixed(2);
                    return `<li>${item.quantity} x ${item.name} <small>(${cost} )</small></li>`;
                }).join('');

                // 2. Format the Total Order Cost
                const formattedTotal = parseFloat(order.total_cost).toFixed(2);

                row.innerHTML = `
                    <td>${order.order_id}</td>
                    <td>${new Date(order.order_timestamp).toLocaleDateString()}</td>
                    <td>${order.receiver_name}</small></td>
                    <td>${order.department_name}</td>
                    <td>${order.vendor_name}</td>
                    <td><ul class="item-list">${itemListHtml}</ul></td>
                    <td><strong>${formattedTotal}</strong></td>
                    <td><span style="color: green; font-weight: bold;">${order.to_status}</span></td>
                    
                `;
                tbody.appendChild(row);
            });

        } else {
            tbody.innerHTML = `<tr><td colspan="${colSpanCount}" class="error-message">Error: ${orders.message || 'Server error'}</td></tr>`;
        }

     } catch (error) { 
        tbody.innerHTML = `<tr><td colspan="${colSpanCount}" class="error-message">Network error: Could not load history.</td></tr>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    applyUserPermissions();
    // ... existing listeners ...
    
    // --- NEW: Auto-display function call for order history ---
    if (document.getElementById('orderHistoryBody')) {
        fetchAndDisplayOrderHistory();
    }
    // ... rest of the logic ...
});



///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// client/js/app.js (Add this function)

const API_RECEIVE_STOCK_URL = 'http://localhost/inventory_app/api/endpoints/data.php?resource=items&action=receive';

/**
 * Sends a request to the API to increase stock for a given item.
 */
async function handleStockReceiving(itemId, itemName) {
    //const qtyInput = document.getElementById(`receive-qty-${itemId}`);
    const qtyInput = document.getElementById(`stockToAdd-${itemId}`);
    const messageElement = document.getElementById(`receive-msg-${itemId}`);
    const receiveButton = document.getElementById(`receive-btn-${itemId}`);
    
    const quantity = parseInt(qtyInput.value, 10);
    const authToken = localStorage.getItem('auth_token');

    if (quantity <= 0 || isNaN(quantity)) {
        messageElement.textContent = 'Enter a valid quantity.';
        return;
    }

    messageElement.textContent = 'Processing...';
    receiveButton.disabled = true;

    try {
        const response = await fetch(API_RECEIVE_STOCK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ item_id: itemId, quantity: quantity })
        });

        const data = await response.json();

        if (response.ok) {
            messageElement.textContent = `Received ${quantity} of ${itemName}! Stock updated.`;
            messageElement.style.color = 'green';
            qtyInput.value = '0'; // Clear input
            
            // CRITICAL: Refresh the items list to show the new stock level
            fetchAndDisplayItems();

        } else {
            messageElement.textContent = data.message || 'Receiving failed.';
            messageElement.style.color = 'red';
        }

    } catch (error) {
        messageElement.textContent = 'Network error: Could not connect to receiving endpoint.';
        messageElement.style.color = 'red';
    } finally {
        receiveButton.disabled = false;
    }
}

// =================================================================

// client/js/app.js (Add this function)

/**
 * Fetches the item report and displays it on the reports page.
 */
async function fetchItemReportData() {
    const authToken = localStorage.getItem('auth_token');
    const tbody = document.getElementById('itemReportBody');
    const downloadButton = document.getElementById('downloadItemReport');
    

    if (!tbody || !authToken) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="4">Authentication required.</td></tr>';
        return;
    }

    try {
        const response = await fetch(API_REPORT_ITEMS_URL, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const items = await response.json();

        if (response.ok) {
            tbody.innerHTML = '';
            globalItemReportData = items; // 1. STORE DATA GLOBALLY
            if (downloadButton) downloadButton.disabled = false;
            
            if (items.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4">No items in the system.</td></tr>';
                return;
            }

            items.forEach(item => {
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>#${item.item_id} - ${item.name}</td>
                    <td>${item.stock_level}</td>
                    <td>${item.date_created.substring(0, 10)}</td>
                    <td>${item.last_stock_received.substring(0, 16).replace('T', ' ')}</td>
                `;
                tbody.appendChild(row);
            });

        } else {
            globalItemReportData = [];
            if (downloadButton) downloadButton.disabled = true;
            tbody.innerHTML = `<tr><td colspan="4" class="error-message">Error: ${items.message || 'Server error'}</td></tr>`;
        }

    } catch (error) {
        globalItemReportData = [];
        if (downloadButton) downloadButton.disabled = true;
        tbody.innerHTML = `<tr><td colspan="4" class="error-message">Network error: Could not load item report.</td></tr>`;
    }
}


// client/js/app.js (Add this function)

/**
 * Fetches the detailed order report and displays it on the reports page.
 */
 async function fetchOrderReportData() {
    const authToken = localStorage.getItem('auth_token');
    const tbody = document.getElementById('orderReportBody');
    const downloadButton = document.getElementById('downloadItemReport');
    
    if (!tbody || !authToken) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="5">Authentication required.</td></tr>';
        return;
    }

    try {
        const response = await fetch(API_REPORT_ORDERS_URL, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const orders = await response.json();

        if (response.ok) {
            tbody.innerHTML = '';
            globalOrderReportData = orders; // 1. STORE DATA GLOBALLY
            if (downloadButton) downloadButton.disabled = false; // 2. ENABLE BUTTON

            
            if (orders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5">No orders found in the system.</td></tr>';
                return;
            }
            renderOrderFrequencyChart(orders);


            orders.forEach(order => {
                const row = document.createElement('tr');
                
                // Format items into an HTML list
                const itemListHtml = order.items.map(item => 
                    `<li>${item.quantity} x ${item.name}</li>`
                ).join('');

                row.innerHTML = `
                    <td>#${order.order_id}</td>
                    <td>${order.username} (for ${order.receiver_name})</td>
                    <td>${order.order_timestamp.substring(0, 16).replace('T', ' ')}</td>
                    <td><ul class="item-list">${itemListHtml}</ul></td>
                    <td><span style="color: green; font-weight: bold;">${order.status}</span></td>
                `;
                tbody.appendChild(row);
            });

        } else {
            globalOrderReportData = [];
            if (downloadButton) downloadButton.disabled = true;
            tbody.innerHTML = `<tr><td colspan="5" class="error-message">Error: ${orders.message || 'Server error'}</td></tr>`;
        }

    } catch (error) {
        globalOrderReportData = [];
        if (downloadButton) downloadButton.disabled = true;
        tbody.innerHTML = `<tr><td colspan="5" class="error-message">Network error: Could not load order report.</td></tr>`;
    }
}


// client/js/app.js (Add this function)
/**
 * Renders a bar chart showing the frequency of ordered items.
 */
function renderOrderFrequencyChart(orders) {
    // 1. Aggregate Data: Count total quantity for each unique item name
    const itemTotals = {};

    orders.forEach(order => {
        order.items.forEach(item => {
            const currentTotal = itemTotals[item.name] || 0;
            itemTotals[item.name] = currentTotal + item.quantity;
        });
    });

    // 2. Prepare Data for Chart.js
    const itemNames = Object.keys(itemTotals);
    const itemQuantities = Object.values(itemTotals);

    // Sort items from most ordered to least ordered
    const sortedData = itemNames.map((name, index) => ({
        name: name,
        quantity: itemQuantities[index]
    })).sort((a, b) => b.quantity - a.quantity);
    
    const labels = sortedData.map(item => item.name);
    const data = sortedData.map(item => item.quantity);

    // 3. Get Canvas Context and Render Chart
    const ctx = document.getElementById('orderFrequencyChart').getContext('2d');
    
    // Check if a chart already exists on the canvas and destroy it (prevents error on refresh)
    if (window.myOrderChart) {
        window.myOrderChart.destroy();
    }

    window.myOrderChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Quantity Ordered',
                data: data,
                backgroundColor: [
                    'rgba(30, 136, 229, 0.6)', // Primary Blue
                    'rgba(141, 110, 99, 0.6)',
                    'rgba(102, 187, 106, 0.6)',
                    'rgba(255, 167, 38, 0.6)',
                    'rgba(255, 99, 132, 0.6)'
                ],
                borderColor: [
                    'rgba(30, 136, 229, 1)',
                ],
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y', // Makes it a horizontal bar chart for better label readability
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Top Ordered Items by Total Quantity'
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Total Quantity'
                    }
                }
            }
        }
    });
}

// client/js/app.js (Add this helper function)

/**
 * Converts a JSON array of objects into a CSV string.
 * Flattens nested 'items' arrays for order report compatibility.
 */
function convertToCSV(jsonData, reportType) {
    if (jsonData.length === 0) return '';

    // 1. Determine Headers (Keys)
    const headers = new Set();
    const isOrderReport = reportType === 'orders';

    // Collect all possible keys from all objects
    jsonData.forEach(obj => {
        Object.keys(obj).forEach(key => {
            if (key !== 'items') { // Exclude the raw items array itself
                headers.add(key);
            }
        });
        if (isOrderReport) {
            headers.add('items_list'); // Add a consolidated column for items
        }
    });

    const headerArray = Array.from(headers);
    let csv = headerArray.join(',') + '\n';

    // 2. Map Data Rows
    jsonData.forEach(row => {
        const data = [];
        headerArray.forEach(header => {
            let value = row[header];

            if (header === 'items_list' && isOrderReport && row.items) {
                // Special handling for the nested array of ordered items
                value = row.items.map(i => `${i.quantity}x ${i.name}`).join('; ');
            } else if (value === null || value === undefined) {
                value = '';
            } else if (typeof value === 'string') {
                // Escape quotes and wrap string values in quotes
                value = `"${value.replace(/"/g, '""')}"`;
            }
            data.push(value);
        });
        csv += data.join(',') + '\n';
    });
    
    return csv;
}

// client/js/app.js (Add this main download function)

/**
 * Initiates the download of a report based on the provided data.
 */
function downloadReport(data, filenamePrefix, reportType) {
    if (!data || data.length === 0) {
        alert('No data available to download.');
        return;
    }
    
    const csvContent = convertToCSV(data, reportType);
    if (!csvContent) {
        alert('Could not generate CSV content.');
        return;
    }

    // Create a Blob containing the CSV data
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link element to trigger the download
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filenamePrefix}-${new Date().toISOString().substring(0, 10)}.csv`);
    
    // Append link, click it, and remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url); // Clean up the object URL
}


///////////////////upload images//////////////////////////////




/**
 * Fetches all items (not just the current category) to populate the image upload dropdown.
 */
async function populateItemDropdown() {
    const select = document.getElementById('itemIdSelect');
    const authToken = localStorage.getItem('auth_token');

    if (!select) return; 

    // Use a slightly modified data endpoint that fetches ALL items for the dropdown
    // NOTE: This assumes you have an API that returns all items, for now, we'll try a generic fetch
    const response = await fetch('http://localhost/inventory_app/api/endpoints/data.php?resource=report_items', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const items = await response.json();
    
    if (response.ok) {
        select.innerHTML = '<option value="">-- Select Item to Upload Image For --</option>';
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item.item_id;
            option.textContent = `${item.name} (Stock: ${item.stock_level})`;
            select.appendChild(option);
        });
    } else {
        select.innerHTML = '<option value="">Failed to load item list.</option>';
    }
}

/**
 * Handles the image file upload using FormData.
 */

const API_UPLOAD_URL = 'http://localhost/inventory_app/api/endpoints/upload.php';
async function handleImageUpload(event) {
    event.preventDefault();
    const messageElement = document.getElementById('imageUploadMessage');
    const selectElement = document.getElementById('itemIdSelect');
    const fileInput = document.getElementById('itemImage');
    const uploadButton = document.getElementById('uploadImageButton');

    messageElement.textContent = 'Uploading...';
    uploadButton.disabled = true;

    if (!selectElement.value || !fileInput.files.length) {
        messageElement.textContent = 'Please select an item and a file.';
        uploadButton.disabled = false;
        return;
    }

    // FormData is required for file uploads
    const formData = new FormData();
    formData.append('item_image', fileInput.files[0]);
    formData.append('item_id', selectElement.value);

    try {
        const response = await fetch(API_UPLOAD_URL, {
            method: 'POST',
            body: formData // No Content-Type header needed; FormData sets it automatically
        });

        const data = await response.json();

        if (response.ok) {
            messageElement.textContent = `Success! Image path saved: ${data.image_path}`;
            messageElement.style.color = 'green';
            fileInput.value = ''; // Clear file input
            
            // Refresh items list to show the new picture immediately
            fetchAndDisplayItems();

        } else {
            messageElement.textContent = data.message || 'Upload failed.';
            messageElement.style.color = 'red';
        }

    } catch (error) {
        messageElement.textContent = 'Network error during upload.';
        messageElement.style.color = 'red';
    } finally {
        uploadButton.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // ... existing listeners ...
    applyUserPermissions();

    // --- NEW: Image Upload Listeners (on items.html) ---
    const imageUploadForm = document.getElementById('imageUploadForm');
    if (imageUploadForm) {
        populateItemDropdown(); // Load item list for dropdown
        imageUploadForm.addEventListener('submit', handleImageUpload);
    }
    
    // ... rest of the auto-display logic ...
});


////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * Renders the item list based on the provided array (used for both initial load and filtering).
 */
//////
function toggleMenu(itemId) {
    event.stopPropagation();
    const menu = document.getElementById(`menu-${itemId}`);
    menu.classList.toggle('show');
}

function closeMenu(itemId) {
    const menu = document.getElementById(`menu-${itemId}`);
    menu.classList.remove('show');
}
document.addEventListener("click", function () {
    document.querySelectorAll(".menu-dropdown.show").forEach(menu => {
        menu.classList.remove("show");
    });
});
document.addEventListener("click", function (e) {
    if (e.target.closest(".menu-wrapper")) return;

    document.querySelectorAll(".menu-dropdown.show").forEach(menu => {
        menu.classList.remove("show");
    });
});

/////////////////////////////////////////////

function openEditItem(itemId) {
    // Save the selected item ID in sessionStorage
    sessionStorage.setItem('current_item_id', itemId);

    // Redirect to edit page, URL param optional
    window.location.href = `edit_item.html?item_id=${itemId}`;
}
function renderItemList(itemsToRender) {
    const listContainer = document.getElementById('itemList');
    if (!listContainer) return;

    // Clear previous items but keep the header (by selecting children after the first)
    const existingRows = listContainer.querySelectorAll('.item-row:not(.item-header)');
    existingRows.forEach(row => row.remove());

    if (itemsToRender.length === 0) {
        // Find the element after the header to insert the "No items" message
        const header = listContainer.querySelector('.item-header');
        if (header) {
             header.insertAdjacentHTML('afterend', '<p style="padding: 15px; grid-column: 1 / span 6;">No items match your search criteria.</p>');
        } else {
             listContainer.innerHTML += '<p style="padding: 15px;">No items match your search criteria.</p>';
        }
        return;
    }

    itemsToRender.forEach(item => {
        
        
        const row = document.createElement('div');
        row.className = 'item-row';
        
        // ... (re-insert the entire row.innerHTML logic here from fetchAndDisplayItems) ...
        // You MUST copy the final row.innerHTML string from fetchAndDisplayItems and paste it here.
        
        // Example structure (ensure all 6 columns are present!)
        const currentQty = sessionStorage.getItem(`cart_${item.item_id}`) || 0;
        const itemNameEscaped = item.name.replace(/'/g, "\\'"); 
        const fullImageUrl = `http://localhost/inventory_app/${item.image_path}`;
        
        const imageHtml = item.image_path 
            ? `<img src="${fullImageUrl}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">`
            : `<div style="width: 50px; height: 50px; background-color: #f0f0f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #ccc;">📷</div>`;


//         row.innerHTML = `
//             <div style="display: flex; align-items: center; gap: 10px;"> 
//                 ${imageHtml}
//                 <span class="item-name">${item.name}</span>
//             </div>
//             <div>${item.stock_level}</div>
//             <input type="number" id="qty-${item.item_id}" class="input-qty" value="${currentQty}" 
//                    min="0" max="${item.stock_level}" placeholder="0">
//             <button onclick="
//                 const qty = document.getElementById('qty-${item.item_id}').value;
//                 addToCart(${item.item_id}, '${itemNameEscaped}', qty);"
//             >Add</button>
            
//             <button onclick="openEditItem(${item.item_id})">
//     EDIT
// </button>

//             <span id="receive-msg-${item.item_id}" class="error-message" style="margin-top: 5px; grid-column: 1 / span 6;"></span>
//             `;
//         listContainer.appendChild(row);
        
////////////////////
                row.className = "item-row";

        row.innerHTML = `
            <!-- 1️⃣ Item name -->
            <div style="display:flex; align-items:center; gap:10px;">
                ${imageHtml}
                <span class="item-name">${item.name}</span>
            </div>

            <!-- 2️⃣ Stock -->
            <div>${item.stock_level}</div>

            <!-- 3️⃣ Order qty -->
            <input
                type="number"
                id="qty-${item.item_id}"
                class="input-qty"
                value="${currentQty}"
                min="0"
                max="${item.stock_level}"
                step="0.1"
                placeholder="0.0"
            />

            <!-- 4️⃣ ADD BUTTON (YOU WERE MISSING THIS) -->
            <button onclick="
                         const qty = document.getElementById('qty-${item.item_id}').value;
                         addToCart(${item.item_id}, '${itemNameEscaped}', qty);"
                   >Add</button>

            <!-- 5️⃣ MENU (⋮) -->
            <div class="menu-wrapper">
                <button class="menu-btn" onclick="toggleMenu(${item.item_id})"></button>

                <div class="menu-dropdown" id="menu-${item.item_id}">
                    <button onclick="
                         const qty = document.getElementById('qty-${item.item_id}').value;
                         addToCart(${item.item_id}, '${itemNameEscaped}', qty);"
                    >Add</button>
                    <button onclick="openEditItem(${item.item_id})">Edit</button>
                    <button onclick="handleItemDeletion(${item.item_id})">Delete</button>
                </div>
            </div>
        `;
        listContainer.appendChild(row);

//document.getElementById("itemList").appendChild(row);     

////////////////////////

    });
}

/**
 * Filters the current list of items based on the search input value.
 */
function handleItemSearch() {
    const searchInput = document.getElementById('itemSearchInput');
    if (!searchInput) return;

    const searchTerm = searchInput.value.toLowerCase().trim();

    if (searchTerm === '') {
        // If search box is empty, show the full list
        renderItemList(currentCategoryItems);
    } else {
        // Filter the global list
        const filteredItems = currentCategoryItems.filter(item => 
            item.name.toLowerCase().includes(searchTerm)
        );
        renderItemList(filteredItems);
    }
}

// client/js/app.js (Inside the main DOMContentLoaded listener at the bottom)

document.addEventListener('DOMContentLoaded', () => {
    applyUserPermissions();
    // ... existing listeners ...
    
    // --- NEW: Search Listener (on items.html) ---
    const searchInput = document.getElementById('itemSearchInput');
    if (searchInput) {
        // Trigger search instantly when user types
        searchInput.addEventListener('input', handleItemSearch); 
    }
    
    // ... rest of the logic ...
});
//deletion of items and categories should be handled in the same way as receiving stock, by refreshing the item list after the operation is complete.
// app.js

//const API_CATEGORY_URL = API_BASE_URL + 'data.php?resource=category'; 

/**
 * Handles the AJAX call to delete a category.
 * @param {number} categoryId 
 */
async function handleCategoryDeletion(categoryId) {
    if (!confirm(`Are you sure you want to delete Category ID ${categoryId}? This cannot be undone if successful.`)) {
        return;
    }

    const authToken = localStorage.getItem('auth_token');
    const messageElement = document.getElementById('categoryMessage'); // Assume you have a message container

    messageElement.textContent = `Attempting to delete Category ID ${categoryId}...`;
    messageElement.style.color = 'orange';

    try {
        const response = await fetch(API_CATEGORY_URL, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ category_id: categoryId })
        });

        const data = await response.json();

        if (response.ok) {
            messageElement.textContent = data.message;
            messageElement.style.color = 'green';
            // Refresh the category list after successful deletion
            fetchAndDisplayCategories(); 
        } else {
            // Handle 409 Conflict, 403 Forbidden, 404 Not Found, etc.
            messageElement.textContent = `Deletion Failed: ${data.message || response.statusText}`;
            messageElement.style.color = 'red';
        }

    } catch (error) {
        messageElement.textContent = 'Network error during category deletion.';
        messageElement.style.color = 'red';
        console.error('Deletion error:', error);
    }
}

// CRITICAL: You must update your fetchAndDisplayCategories function
// to include the delete button and hook up the event listener.

/**
 * Example update for fetchAndDisplayCategories to include the button.
 */
function setupCategoryDeletionListeners() {
    // Attach listener to the container (delegation)
    document.getElementById('categoriesTableBody').addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-category-btn')) {
            const categoryId = event.target.dataset.categoryId;
            handleCategoryDeletion(categoryId);
        }
    });
}
// You must call setupCategoryDeletionListeners() on page load.

// app.js
const API_ITEM_URL = 'http://localhost/inventory_app/api/endpoints/data.php?resource=item';
//const API_ITEM_URL = API_BASE_URL + 'data.php?resource=item'; // Assuming you use 'item' for single item operations
/**
 * 
 * Handles the AJAX call to delete an item.
 * @param {number} itemId 
 */
async function handleItemDeletion(itemId) {
    if (!confirm(`WARNING: Are you sure you want to delete Item ID ${itemId}? This cannot be undone.`)) {
        return;
    }

    const authToken = localStorage.getItem('auth_token');
    const messageElement = document.getElementById('itemsError'); // Re-use the error div for messages

    messageElement.style.display = 'block';
    messageElement.textContent = `Attempting to delete Item ID ${itemId}...`;
    messageElement.style.backgroundColor = '#ffffcc'; // Yellow background for processing

    try {
        const response = await fetch(API_ITEM_URL, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ item_id: itemId })
        });

        //const data = await response.json();
        const text = await response.text();
           console.log(text);

        if (response.ok) {
            messageElement.textContent = text || 'Item deleted successfully.'  ;
            messageElement.style.backgroundColor = '#d4edda'; // Green for success
            
            // Refresh the item list after successful deletion
            fetchAndDisplayItems(); 
        } else {
            // Handle 403 Forbidden, 404 Not Found, etc.
            messageElement.textContent = `Deletion Failed: ${data.message || response.statusText}`;
            messageElement.style.backgroundColor = '#f8d7da'; // Red for failure
        }

    } catch (error) {
        messageElement.textContent = 'Network error during item deletion.';
        messageElement.style.backgroundColor = '#f8d7da';
        console.error('Deletion error:', error);
    }
}

function setupItemDeletionListener() {
    const tbody = document.getElementById('itemsTableBody');

    // Remove existing listener to prevent duplicates (safer approach if called repeatedly)
    tbody.removeEventListener('click', itemDeletionDelegate);
    
    // Add the delegated listener
    tbody.addEventListener('click', itemDeletionDelegate);
}

// Delegate function to handle the click event
function itemDeletionDelegate(event) {
    if (event.target.classList.contains('delete-item-btn')) {
        const itemId = event.target.dataset.itemId;
        handleItemDeletion(itemId); // Call the function that makes the API DELETE request
    }
}

async function fetchDepartmentsForOrder() {
    const deptDropdown = document.getElementById('orderDepartment');
    
    try {
        const response = await fetch('http://localhost/inventory_app/api/endpoints/reports.php?resource=get_departments');
       // const response = await fetch('api/endpoints/data.php?resource=get_departments');
        const departments = await response.json();

        // Clear existing options except the first one
        deptDropdown.innerHTML = '<option value="">-- Select Department --</option>';

        departments.forEach(dept => {
            const option = document.createElement('option');
            // IMPORTANT: The value is the ID, the text is the Name
            option.value = dept.department_id; 
            option.textContent = dept.department_name;
            deptDropdown.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading departments:", error);
    }
}

//Call this when the checkout page/modal opens
//document.addEventListener('DOMContentLoaded', fetchDepartmentsForOrder);

async function updateBalanceDisplay(deptId, start, end) {
    try {
        const response = await fetch(`api/endpoints/reports.php?resource=balance&dept_id=${deptId}&start_date=${start}&end_date=${end}`);
        const data = await response.json();

        // Populate the cards
        document.getElementById('totalAccrued').innerText = `$${data.accrued.toFixed(2)}`;
        document.getElementById('totalPaid').innerText = `$${data.paid.toFixed(2)}`;
        
        const balanceElement = document.getElementById('totalBalance');
        balanceElement.innerText = `$${data.balance.toFixed(2)}`;

        // Visual Feedback: If they owe money, make it red. If cleared, make it green.
        balanceElement.style.color = data.balance > 0 ? "#ffcccc" : "#ccffcc";
        
    } catch (error) {
        console.error("Balance calculation failed", error);
    }
}

// Call this inside your existing generateReport() function