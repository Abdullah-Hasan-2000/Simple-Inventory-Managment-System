var addItemForm = document.querySelector('.card-body form'); // Keep for reset, querySelector is ES5
var inventoryTableBody = document.getElementById('inventoryTableBody');

// --- Firestore Integration ---

// Function to add a brand to the 'brands' collection if it doesn't exist
async function addBrandIfNotExists(brandName) {
    const brandRef = db.collection('brands').doc(brandName.trim().toUpperCase()); // Use uppercase name as ID for uniqueness check
    try {
        const doc = await brandRef.get();
        if (!doc.exists) {
            await brandRef.set({ name: brandName.trim() }); // Store the original casing
            console.log(`Brand "${brandName.trim()}" added to brands collection.`);
        } else {
            console.log(`Brand "${brandName.trim()}" already exists.`);
        }
    } catch (error) {
        console.error("Error checking/adding brand: ", error);
        // Decide if you want to proceed with adding the inventory item even if brand check fails
    }
}

// Function to add item to Firestore
async function addItemToFirestore(itemData) {
    try {
        const docRef = await db.collection("inventory").add(itemData);
        console.log("Document written with ID: ", docRef.id);
        await addBrandIfNotExists(itemData.brandName); // Add brand after item is successfully added
        return docRef.id; // Return the new document ID
    } catch (error) {
        console.error("Error adding document: ", error);
        alert("Failed to add item to database. Please try again.");
        return null;
    }
}

// Function to create and display a row in the inventory table
function createInventoryRow(itemData, docId) {
    // Calculate quantity in bottles based on size using if-else
    var bottlesPerCrate;
    if (itemData.bottleSize === '2.25L') {
        bottlesPerCrate = 4;
    } else if (itemData.bottleSize === '1.5L' || itemData.bottleSize === '1L') {
        bottlesPerCrate = 6;
    } else if (itemData.bottleSize === '500ml' || itemData.bottleSize === '345ml' || itemData.bottleSize === '300ml' || itemData.bottleSize === '250ml') {
        bottlesPerCrate = 12;
    } else {
        bottlesPerCrate = 0; // Default case
    }
    var quantityBottles = itemData.quantityCrates * bottlesPerCrate;

    // Calculate price per bottle and total price
    var pricePerBottle = bottlesPerCrate > 0 ? (itemData.pricePerCrate / bottlesPerCrate) : 0;
    var totalPrice = itemData.pricePerCrate * itemData.quantityCrates;

    // Create new table row
    var newRow = inventoryTableBody.insertRow();
    newRow.dataset.id = docId; // Store Firestore document ID on the row

    // Create cells for the new row
    var cellBrand = newRow.insertCell();
    var cellSize = newRow.insertCell();
    var cellQuantityCrates = newRow.insertCell();
    var cellQuantityBottles = newRow.insertCell();
    var cellPriceCrate = newRow.insertCell();
    var cellPriceBottle = newRow.insertCell();
    var cellTotalPrice = newRow.insertCell();
    var cellActions = newRow.insertCell();

    // Populate cells
    cellBrand.textContent = itemData.brandName;
    cellSize.textContent = itemData.bottleSize;
    cellQuantityCrates.textContent = itemData.quantityCrates;
    cellQuantityBottles.textContent = quantityBottles; // Use calculated value
    cellPriceCrate.textContent = itemData.pricePerCrate.toFixed(2);
    cellPriceBottle.textContent = pricePerBottle.toFixed(2); // Use calculated value
    cellTotalPrice.textContent = totalPrice.toFixed(2); // Use calculated value

    // Add action buttons with onclick handlers
    cellActions.innerHTML = `
        <button class="btn btn-sm btn-warning me-2" onclick="editItem(this)">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteItem(this)">Delete</button>
    `;
}

// Modified addItem function
async function addItem() { // Make the function async
    // Get form values
    var brandNameInput = document.getElementById('brandName');
    var bottleSizeInput = document.getElementById('bottleSize');
    var quantityCratesInput = document.getElementById('quantityCrates');
    var pricePerCrateInput = document.getElementById('pricePerCrate');

    var brandName = brandNameInput.value.trim();
    var bottleSize = bottleSizeInput.value;
    var quantityCrates = parseInt(quantityCratesInput.value);
    var pricePerCrate = parseFloat(pricePerCrateInput.value);

    // Basic validation
    if (!brandName || !bottleSize || isNaN(quantityCrates) || quantityCrates < 0 || isNaN(pricePerCrate) || pricePerCrate < 0) {
        alert('Please fill in all fields correctly.');
        return;
    }

    const itemData = {
        brandName: brandName,
        bottleSize: bottleSize,
        quantityCrates: quantityCrates,
        pricePerCrate: pricePerCrate,
        // Add a timestamp if needed
        // createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Add item to Firestore
    const newDocId = await addItemToFirestore(itemData);

    if (newDocId) {
        // Add row to the table only if Firestore add was successful
        createInventoryRow(itemData, newDocId);

        // Clear the form
        addItemForm.reset();
    }
}

// Function to load inventory from Firestore on page load
async function loadInventory() {
    try {
        const snapshot = await db.collection("inventory").orderBy("brandName").get(); // Example: order by brand name
        inventoryTableBody.innerHTML = ''; // Clear existing table rows before loading
        snapshot.forEach((doc) => {
            console.log(doc.id, " => ", doc.data());
            createInventoryRow(doc.data(), doc.id);
        });
    } catch (error) {
        console.error("Error loading inventory: ", error);
        alert("Failed to load inventory data.");
    }
}

// --- End Firestore Integration ---

// Function to make a row editable
function editItem(button) {
    var row = button.parentNode.parentNode; // Get the <tr> element
    var cells = row.getElementsByTagName('td'); // Get all cells in the row

    // Store original values (optional, useful for a cancel feature)
    // row.setAttribute('data-original-brand', cells[0].textContent);
    // ... store others ...

    // Get current values
    var brandName = cells[0].textContent;
    var bottleSize = cells[1].textContent;
    var quantityCrates = cells[2].textContent;
    var pricePerCrate = cells[4].textContent;

    // Replace cell content with input fields
    cells[0].innerHTML = '<input type="text" class="form-control form-control-sm" value="' + brandName + '">';
    cells[1].innerHTML = createSizeDropdown(bottleSize); // Use a helper function for the dropdown
    cells[2].innerHTML = '<input type="number" class="form-control form-control-sm" min="0" value="' + quantityCrates + '">';
    // cells[3] (Qty Bottles) is calculated, skip
    cells[4].innerHTML = '<input type="number" class="form-control form-control-sm" min="0" step="0.01" value="' + pricePerCrate + '">';
    // cells[5] (Price Bottle) is calculated, skip
    // cells[6] (Total Price) is calculated, skip

    // Change Edit button to Save button
    button.textContent = 'Save';
    button.classList.remove('btn-warning');
    button.classList.add('btn-success');
    button.setAttribute('onclick', 'saveItem(this)');

    // Optionally hide Delete button during edit
    var deleteButton = row.querySelector('.btn-danger');
    if (deleteButton) {
        deleteButton.style.display = 'none';
    }
}

// Helper function to create the size dropdown for editing
function createSizeDropdown(selectedValue) {
    var options = ['250ml', '300ml', '345ml', '500ml', '1L', '1.5L', '2.25L'];
    var selectHTML = '<select class="form-select form-select-sm">';
    options.forEach(function(option) {
        selectHTML += '<option value="' + option + '"' + (option === selectedValue ? ' selected' : '') + '>' + option + '</option>';
    });
    selectHTML += '</select>';
    return selectHTML;
}

// Function to save the edited row (UPDATED with Firestore)
async function saveItem(button) { // Make async
    var row = button.parentNode.parentNode; // Get the <tr> element
    var docId = row.dataset.id; // Get Firestore document ID
    if (!docId) {
        console.error("Document ID not found on row.");
        alert("Error saving item: Could not find item ID.");
        // Optionally revert UI changes here
        return;
    }

    var cells = row.getElementsByTagName('td'); // Get all cells in the row
    var inputs = row.getElementsByTagName('input');
    var select = row.getElementsByTagName('select')[0]; // Get the select element

    // Get new values from inputs/select
    var newBrandName = inputs[0].value.trim();
    var newBottleSize = select.value;
    var newQuantityCrates = parseInt(inputs[1].value);
    var newPricePerCrate = parseFloat(inputs[2].value);

    // Basic validation
    if (!newBrandName || !newBottleSize || isNaN(newQuantityCrates) || newQuantityCrates < 0 || isNaN(newPricePerCrate) || newPricePerCrate < 0) {
        alert('Please fill in all fields correctly.');
        // Optionally revert UI changes here or don't proceed
        return;
    }

    const updatedData = {
        brandName: newBrandName,
        bottleSize: newBottleSize,
        quantityCrates: newQuantityCrates,
        pricePerCrate: newPricePerCrate,
        // You might want to add an updatedAt timestamp
        // updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        // Update Firestore document
        await db.collection("inventory").doc(docId).update(updatedData);
        console.log("Document successfully updated!");

        // Check and add brand if it's new or changed
        await addBrandIfNotExists(newBrandName);

        // --- Recalculate derived values for display --- 
        var bottlesPerCrate;
        if (newBottleSize === '2.25L') {
            bottlesPerCrate = 4;
        } else if (newBottleSize === '1.5L' || newBottleSize === '1L') {
            bottlesPerCrate = 6;
        } else if (newBottleSize === '500ml' || newBottleSize === '345ml' || newBottleSize === '300ml' || newBottleSize === '250ml') {
            bottlesPerCrate = 12;
        } else {
            bottlesPerCrate = 0;
        }
        var newQuantityBottles = newQuantityCrates * bottlesPerCrate;
        var newPricePerBottle = bottlesPerCrate > 0 ? (newPricePerCrate / bottlesPerCrate) : 0;
        var newTotalPrice = newPricePerCrate * newQuantityCrates;
        // --- End Recalculation ---

        // Update cell content with new static values
        cells[0].textContent = newBrandName;
        cells[1].textContent = newBottleSize;
        cells[2].textContent = newQuantityCrates;
        cells[3].textContent = newQuantityBottles;
        cells[4].textContent = newPricePerCrate.toFixed(2);
        cells[5].textContent = newPricePerBottle.toFixed(2);
        cells[6].textContent = newTotalPrice.toFixed(2);

        // Change Save button back to Edit button
        button.textContent = 'Edit';
        button.classList.remove('btn-success');
        button.classList.add('btn-warning');
        button.setAttribute('onclick', 'editItem(this)');

        // Restore Delete button
        var deleteButton = row.querySelector('.btn-danger');
        if (deleteButton) {
            deleteButton.style.display = 'inline-block'; // Or 'block' depending on original display
        }

    } catch (error) {
        console.error("Error updating document: ", error);
        alert("Failed to save changes to the database. Please try again.");
        // Optionally revert UI changes here
    }
}

// Function to delete a table row (UPDATED with Firestore)
async function deleteItem(button) { // Make async
    var row = button.parentNode.parentNode; // Get the <tr> element
    var docId = row.dataset.id; // Get Firestore document ID

    if (!docId) {
        console.error("Document ID not found on row.");
        alert("Error deleting item: Could not find item ID.");
        return;
    }

    // Optional: Ask for confirmation
    if (!confirm("Are you sure you want to delete this item?")) {
        return;
    }

    try {
        // Delete the document from Firestore
        await db.collection("inventory").doc(docId).delete();
        console.log("Document successfully deleted!");

        // Remove the row from the table body *after* successful deletion
        inventoryTableBody.removeChild(row);

        // Note: We are not deleting the brand from the 'brands' collection here,
        // as other inventory items might still use it.

    } catch (error) {
        console.error("Error removing document: ", error);
        alert("Failed to delete item from the database. Please try again.");
    }
}

// Load inventory when the DOM is ready
document.addEventListener('DOMContentLoaded', loadInventory);
