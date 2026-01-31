let currentCategoryId ;

const API_CREATE_BASE = 'http://localhost/inventory_app/api/create.php';

async function postData(resource, payload) {
  const response = await fetch(`${API_CREATE_BASE}?resource=${resource}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { message: 'Server did not return valid JSON', raw: text };
  }
}

async function handleCreateCategory(event) {
  event.preventDefault();
  const nameInput = document.getElementById('newCategoryName');
  const message = document.getElementById('categoryMessage');

  message.textContent = 'Creating...';

  try {
    const data = await postData('category', { name: nameInput.value.trim() });
    if (data.message.includes('successfully')) {
      message.style.color = 'green';
      message.textContent = `✅ ${data.message}`;
      nameInput.value = '';
      fetchAndDisplayCategories();
    } else {
      message.style.color = 'red';
      message.textContent = `⚠️ ${data.message}`;
    }
  } catch (err) {
    message.textContent = '❌ Network error: Could not reach server.';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const createCategoryForm = document.getElementById('createCategoryForm');
  if (createCategoryForm)
    createCategoryForm.addEventListener('submit', handleCreateCategory);
});
///////////////////////////////////////
/////////////////////////////////////

const API_ITEM_ADD_URL = 'http://localhost/inventory_app/api/endpoints/data.php?resource=items';

async function handleAddItem(event) {
    event.preventDefault();
    /////////////////////////////////////////
    // 
    
    const categoryName = sessionStorage.getItem('category_name');
    
    const nameDisplay = document.getElementById('categoryNameDisplay');
    /////////////////////////////////////////
    
    const messageElement = document.getElementById('addMessage');
    const urlParams = new URLSearchParams(window.location.search);
     currentCategoryId = urlParams.get('category_id');

if (currentCategoryId) {
    sessionStorage.setItem("category_id", currentCategoryId);
} else {
    currentCategoryId = sessionStorage.getItem("category_id") 
        || localStorage.getItem("current_category_id");
}

if (!currentCategoryId) {
    alert("No category selected.");
    return;
}
    // currentCategoryId = urlParams.get('category_id'); 
    // if (!currentCategoryId) {
    //     alert('Error: Category ID missing in URL.');
    //     return;
    // }

    //const messageElement = document.getElementById('addMessage');
    messageElement.textContent = 'Creating item...';
    messageElement.className = 'alert alert-info';
    // Get the new unit value
    const itemName = document.getElementById('itemName').value.trim();
    const itemUnit = document.getElementById('itemUnit').value.trim();
    const stock = document.getElementById('StockLevel').value.trim();
    const itemCost = document.getElementById('itemCost').value.trim();
    
    if (!itemName || !itemUnit) {
        messageElement.textContent = 'Item Name and Measuring Unit are required.';
        messageElement.className = 'alert alert-danger';
        return;
    }

    
    // Use FormData for file uploads
    const formData = new FormData();
    formData.append('category_id', currentCategoryId);
    formData.append('name', itemName);
    //formData.append('description', document.getElementById('itemDescription').value);
    
    // CRITICAL: New field for the measuring unit
    formData.append('measuring_unit', itemUnit); 
    
    // Initial stock level (0 for a brand new item)
    formData.append('stock_level', stock);

    //formData.append('item_cost', itemCost);
    
    console.log('item_cost:', itemCost);
    formData.append('item_cost', itemCost);

    const pictureFile = document.getElementById('itemPicture').files[0];
    if (pictureFile) {
        formData.append('item_image', pictureFile);
        }

    const response = await fetch(API_ITEM_ADD_URL, {
        method: 'POST', 
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
    });

    const data = await response.json();

    if (response.ok) {
        messageElement.textContent = `Item '${itemName}' created successfully!`;
        messageElement.className = 'alert alert-success';
        document.getElementById('addItemForm').reset();
    } else {
        messageElement.textContent = `Creation Failed: ${data.message || response.statusText}`;
        messageElement.className = 'alert alert-danger';
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const addItemForm = document.getElementById('addItemForm');
    if (addItemForm) {
        addItemForm.addEventListener('submit', handleAddItem);
    }
});
