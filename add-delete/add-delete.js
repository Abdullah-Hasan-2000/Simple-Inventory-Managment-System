var addItemForm = document.querySelector('.card-body form'); // Keep for reset, querySelector is ES5
var inventoryTableBody = document.getElementById('inventoryTableBody');

function addItem() {
    // Get form values
    var brandName = document.getElementById('brandName').value;
    var bottleSize = document.getElementById('bottleSize').value;
    var quantityCrates = parseInt(document.getElementById('quantityCrates').value);
    var pricePerCrate = parseFloat(document.getElementById('pricePerCrate').value);

    // Calculate quantity in bottles based on size using if-else
    var bottlesPerCrate;
    if (bottleSize === '2.25L') {
        bottlesPerCrate = 4;
    } else if (bottleSize === '1.5L' || bottleSize === '1L') {
        bottlesPerCrate = 6;
    } else if (bottleSize === '500ml' || bottleSize === '345ml' || bottleSize === '300ml' || bottleSize === '250ml') {
        bottlesPerCrate = 12;
    } else {
        bottlesPerCrate = 0; // Default case
    }
    var quantityBottles = quantityCrates * bottlesPerCrate;

    // Calculate price per bottle and total price
    var pricePerBottle = bottlesPerCrate > 0 ? (pricePerCrate / bottlesPerCrate) : 0;
    var totalPrice = pricePerCrate * quantityCrates;

    // Create new table row
    var newRow = inventoryTableBody.insertRow();

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
    cellBrand.textContent = brandName;
    cellSize.textContent = bottleSize;
    cellQuantityCrates.textContent = quantityCrates;
    cellQuantityBottles.textContent = quantityBottles;
    cellPriceCrate.textContent = pricePerCrate.toFixed(2);
    cellPriceBottle.textContent = pricePerBottle.toFixed(2);
    cellTotalPrice.textContent = totalPrice.toFixed(2);

    // Add action buttons with onclick handlers
    cellActions.innerHTML = `
        <button class="btn btn-sm btn-warning me-2" onclick="editItem(this)">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteItem(this)">Delete</button>
    `;

    // Clear the form
    addItemForm.reset();
}

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

// Function to save the edited row
function saveItem(button) {
    var row = button.parentNode.parentNode; // Get the <tr> element
    var cells = row.getElementsByTagName('td'); // Get all cells in the row
    var inputs = row.getElementsByTagName('input');
    var select = row.getElementsByTagName('select')[0]; // Get the select element

    // Get new values from inputs/select
    var newBrandName = inputs[0].value;
    var newBottleSize = select.value;
    var newQuantityCrates = parseInt(inputs[1].value);
    var newPricePerCrate = parseFloat(inputs[2].value);

    // --- Recalculate derived values --- 
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
}

// Function to delete a table row
function deleteItem(button) {
    var row = button.parentNode.parentNode; // Get the <tr> element
    inventoryTableBody.removeChild(row); // Remove the row from the table body
}
