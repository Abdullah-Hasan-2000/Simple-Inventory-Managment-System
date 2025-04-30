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

    // Add action buttons
    cellActions.innerHTML = `
        <button class="btn btn-sm btn-warning me-2">Edit</button>
        <button class="btn btn-sm btn-danger">Delete</button>
    `;

    // Clear the form
    addItemForm.reset();
}
