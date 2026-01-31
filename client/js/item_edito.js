// const API_ITEM_EDIT_URL = 'http://localhost/inventory_app/api/endpoints/data.php?resource=item';
// const API_ITEM_FETCH = 'http://localhost/inventory_app/api/endpoints/orders.php?resource=item_id'; // Use the same base endpoint


// // // 1. Initializer function (called on page load)
function initEditPage() {
    const urlParams = new URLSearchParams(window.location.search);
    let currentItemId = urlParams.get('item_id'); // Get the ID from the URL: edit_item.html?id=123
    

      if (urlItemId = null) {
        currentItemId = urlItemId;
        sessionStorage.setItem('current_item_id', urlItemId);
    } else {
        currentItemId = sessionStorage.getItem('current_item_id');
    }


    if (!currentItemId) {
        document.getElementById('editMessage').textContent = "Error: Item ID missing.";
        return;
    }
    
    // Set up event listeners
    document.getElementById('editItemForm').addEventListener('submit', handleSaveItem);



}


 const API_ITEM_EDIT_URL = 'http://localhost/inventory_app/api/endpoints/data.php?resource=item_id';
 const API_ITEM_FETCH = 'http://localhost/inventory_app/api/endpoints/orders.php?resource=item_id'; // Use the same base endpoint



async function handleSaveItem(event) {
    event.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    const currentItemId = urlParams.get('item_id');

    if (!currentItemId) {
        alert("Item context lost. Please reselect the item.");
        return;
    }

    const formData = new FormData();
    formData.append('item_id', currentItemId);
    formData.append(
        'stock_add',
        Number(document.getElementById('stockToAdd').value)
    );
    formData.append(
        'item_cost',
        Number(document.getElementById('itemCost').value)
    );

    const response = await fetch(API_ITEM_EDIT_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
    });

    const result = await response.json();
    document.getElementById('editMessage').textContent =
        result.message || 'Update successful';
}



