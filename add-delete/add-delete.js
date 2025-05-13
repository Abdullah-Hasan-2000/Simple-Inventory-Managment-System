var firebaseConfig = {
    apiKey: "AIzaSyCakMhSTPskw-Qy2P5RJFlvf71sxfNJwfs",
    authDomain: "new-project-46484.firebaseapp.com",
    projectId: "new-project-46484",
    storageBucket: "new-project-46484.firebasestorage.app",
    messagingSenderId: "37040453346",
    appId: "1:37040453346:web:e9fae426e55112890d50bb"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app();
}
const db = firebase.firestore();

var addItemForm = document.querySelector('.card-body form');
var inventoryTableBody = document.getElementById('inventoryTableBody');



// Function to add a brand to the 'brands' collection if it doesn't exist
function addBrandIfNotExists(brandName) {
    // Capitalize the brand name for storage
    var formattedName = brandName.trim();
    var displayName = formattedName.charAt(0).toUpperCase() + formattedName.slice(1).toLowerCase();
    var brandRef = db.collection('brands').doc(formattedName.toUpperCase());
    return brandRef.get()
        .then(function (doc) {
            if (!doc.exists) {
                return brandRef.set({ name: displayName })
                    .then(function () {
                        console.log('Brand "' + displayName + '" added to brands collection.');
                    });
            } else {
                console.log('Brand "' + displayName + '" already exists.');
                return Promise.resolve();
            }
        })
        .catch(function (error) {
            console.error("Error checking/adding brand: ", error);
        });
}

// Function to add item to Firestore
function addItemToFirestore(itemData) {
    return db.collection("inventory").add(itemData)
        .then(function (docRef) {
            console.log("Document written with ID: ", docRef.id);
            
            return addBrandIfNotExists(itemData.brandName)
                .then(function () {
                    return docRef.id;
                });
        })
        .catch(function (error) {
            console.error("Error adding document: ", error);
            alert("Failed to add item to database. Please try again.");
            return null; 
        });
}

// Function to create and display a row in the inventory table
function createInventoryRow(itemData, docId) {
    // Calculate quantity in bottles based on size
    var bottlesPerCrate;
    if (itemData.bottleSize === '2.25L') {
        bottlesPerCrate = 4;
    } else if (itemData.bottleSize === '1.5L' || itemData.bottleSize === '1L') {
        bottlesPerCrate = 6;
    } else if (itemData.bottleSize === '500ml' || itemData.bottleSize === '345ml' || itemData.bottleSize === '300ml' || itemData.bottleSize === '250ml') {
        bottlesPerCrate = 12;
    } else {
        bottlesPerCrate = 0;
    }
    var quantityBottles = itemData.quantityCrates * bottlesPerCrate;

    
    var pricePerBottle = bottlesPerCrate > 0 ? (itemData.pricePerCrate / bottlesPerCrate) : 0;
    var totalPrice = itemData.pricePerCrate * itemData.quantityCrates;

    
    var newRow = inventoryTableBody.insertRow();
    newRow.dataset.id = docId; // Store Firestore document ID on the row

    
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
    cellQuantityBottles.textContent = quantityBottles; 
    cellPriceCrate.textContent = itemData.pricePerCrate.toFixed(2);
    cellPriceBottle.textContent = pricePerBottle.toFixed(2); 
    cellTotalPrice.textContent = totalPrice.toFixed(2); 

    
    cellActions.innerHTML =
        '<button class="btn btn-sm btn-warning me-2" onclick="editItem(this)">Edit</button>' +
        '<button class="btn btn-sm btn-danger" onclick="deleteItem(this)">Delete</button>';
}


function addItem() {
    // Get form values
    var brandNameInput = document.getElementById('brandName');
    var bottleSizeInput = document.getElementById('bottleSize');
    var quantityCratesInput = document.getElementById('quantityCrates');
    var pricePerCrateInput = document.getElementById('pricePerCrate');

    var brandName = brandNameInput.value.trim();
    // Capitalize first letter for saving to db and table
    brandName = brandName.charAt(0).toUpperCase() + brandName.slice(1).toLowerCase();
    var bottleSize = bottleSizeInput.value;
    var quantityCrates = parseInt(quantityCratesInput.value);
    var pricePerCrate = parseFloat(pricePerCrateInput.value);

   
    if (!brandName || !bottleSize || isNaN(quantityCrates) || quantityCrates < 0 || isNaN(pricePerCrate) || pricePerCrate < 0) {
        alert('Please fill in all fields correctly.');
        return;
    }

    
    var itemData = {
        brandName: brandName,
        bottleSize: bottleSize,
        quantityCrates: quantityCrates,
        pricePerCrate: pricePerCrate
    };

    
    addItemToFirestore(itemData)
        .then(function (newDocId) {
            console.log(newDocId)
            if (newDocId) {
                
                createInventoryRow(itemData, newDocId);
                // Clear the form
                addItemForm.reset();
            }
        });
    
}


function loadInventory() {
    db.collection("inventory").orderBy("brandName").get()
        .then(function (snapshot) {
            inventoryTableBody.innerHTML = '';
            snapshot.forEach(function (doc) {
                console.log(doc.id, " => ", doc.data());
                createInventoryRow(doc.data(), doc.id);
            });
        })
        .catch(function (error) {
            console.error("Error loading inventory: ", error);
            alert("Failed to load inventory data.");
        });
}




function editItem(button) {
    var row = button.parentNode.parentNode;
    var cells = row.getElementsByTagName('td'); 

    
    var brandName = cells[0].textContent;
    var bottleSize = cells[1].textContent;
    var quantityCrates = cells[2].textContent;
    var pricePerCrate = cells[4].textContent;

    
    cells[0].innerHTML = '<input type="text" class="form-control form-control-sm" value="' + brandName + '">';
    cells[1].innerHTML = createSizeDropdown(bottleSize); // Use a function for the dropdown
    cells[2].innerHTML = '<input type="number" class="form-control form-control-sm" min="0" value="' + quantityCrates + '">';
    
    cells[4].innerHTML = '<input type="number" class="form-control form-control-sm" min="0" step="0.01" value="' + pricePerCrate + '">';
    

    // Change Edit button to Save button
    button.textContent = 'Save';
    button.classList.remove('btn-warning');
    button.classList.add('btn-success');
    button.setAttribute('onclick', 'saveItem(this)');

    // hide Delete button during edit
    var deleteButton = row.querySelector('.btn-danger');
    if (deleteButton) {
        deleteButton.style.display = 'none';
    }
}

// function to create the size dropdown for editing
function createSizeDropdown(selectedValue) {
    var options = ['250ml', '300ml', '345ml', '500ml', '1L', '1.5L', '2.25L'];
    var selectHTML = '<select class="form-select form-select-sm">';
    options.forEach(function (option) {
        selectHTML += '<option value="' + option + '"' + (option === selectedValue ? ' selected' : '') + '>' + option + '</option>';
    });
    selectHTML += '</select>';
    return selectHTML;
}


function saveItem(button) {
    var row = button.parentNode.parentNode; 
    var docId = row.dataset.id;
    if (!docId) {
        console.error("Document ID not found on row.");
        alert("Error saving item: Could not find item ID.");
        return;
    }

    var cells = row.getElementsByTagName('td');
    var inputs = row.getElementsByTagName('input');
    var select = row.getElementsByTagName('select')[0];

    // Get new values from inputs/select
    var newBrandName = inputs[0].value.trim();
    // Capitalize first letter for saving to db and table
    newBrandName = newBrandName.charAt(0).toUpperCase() + newBrandName.slice(1).toLowerCase();
    var newBottleSize = select.value;
    var newQuantityCrates = parseInt(inputs[1].value);
    var newPricePerCrate = parseFloat(inputs[2].value);

    
    if (!newBrandName || !newBottleSize || isNaN(newQuantityCrates) || newQuantityCrates < 0 || isNaN(newPricePerCrate) || newPricePerCrate < 0) {
        alert('Please fill in all fields correctly.');
        
        return;
    }

    var updatedData = {
        brandName: newBrandName,
        bottleSize: newBottleSize,
        quantityCrates: newQuantityCrates,
        pricePerCrate: newPricePerCrate,
        
    };

    // Update Firestore
    db.collection("inventory").doc(docId).update(updatedData)
        .then(function () {
            console.log("Document successfully updated!");
            
            return addBrandIfNotExists(newBrandName);
        })
        .then(function () {
            
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
            

           
            cells[0].textContent = newBrandName;
            cells[1].textContent = newBottleSize;
            cells[2].textContent = newQuantityCrates;
            cells[3].textContent = newQuantityBottles;
            cells[4].textContent = newPricePerCrate.toFixed(2);
            cells[5].textContent = newPricePerBottle.toFixed(2);
            cells[6].textContent = newTotalPrice.toFixed(2);

            
            button.textContent = 'Edit';
            button.classList.remove('btn-success');
            button.classList.add('btn-warning');
            button.setAttribute('onclick', 'editItem(this)');

            
            var deleteButton = row.querySelector('.btn-danger');
            if (deleteButton) {
                deleteButton.style.display = 'inline-block'; 
            }

        })
        .catch(function (error) {
            console.error("Error updating document: ", error);
            alert("Failed to save changes to the database. Please try again.");
            
        });
}

// Function to delete a table row
function deleteItem(button) {
    var row = button.parentNode.parentNode; 
    var docId = row.dataset.id;

    if (!docId) {
        console.error("Document ID not found on row.");
        alert("Error deleting item: Could not find item ID.");
        return;
    }


    // Delete the document from Firestore
    db.collection("inventory").doc(docId).delete()
        .then(function () {
            console.log("Document successfully deleted!");
 
            inventoryTableBody.removeChild(row);

        })
        .catch(function (error) {
            console.error("Error removing document: ", error);
            alert("Failed to delete item from the database. Please try again.");
        });
}

// Load inventory when the DOM is ready
document.addEventListener('DOMContentLoaded', loadInventory);
