document.addEventListener('DOMContentLoaded', function() {
    var brandDropdown = document.getElementById('brandNameDropdown');
    var sizeDropdown = document.getElementById('sizeDropdown');
    var quantityInput = document.getElementById('quantityCrates'); 
    var priceInput = document.getElementById('sellingPricePerCrate'); 
    var salesForm = document.getElementById('salesForm');
    var salesTableBody = document.getElementById('salesTableBody');

    // function to add options to a select element
    function addOption(selectElement, text) {
        var option = document.createElement('option');
        option.textContent = text;
        option.value = text;
        selectElement.appendChild(option);
    }

    // function to clear options from a select element
    function clearOptions(selectElement) {
        
        while (selectElement.options.length > 1) {
            selectElement.remove(1);
        }
        
        selectElement.selectedIndex = 0;
    }

    // Function to capitalize the first letter of a string
    function capitalizeFirstLetter(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    // Function to fetch brands from Firestore and populate the dropdown
    function populateBrands() {
        db.collection('brands').orderBy('name').get()
            .then(function(snapshot) {
                if (snapshot.empty) {
                    console.log('No brands found in Firestore.');
                    addOption(brandDropdown, 'No brands available', '');
                    brandDropdown.disabled = true;
                    return;
                }
                snapshot.forEach(function(doc) {
                    
                    var displayName = capitalizeFirstLetter(doc.data().name);
                    addOption(brandDropdown, displayName);
                });
            })
            .catch(function(error) {
                console.error("Error fetching brands: ", error);
                addOption(brandDropdown, 'Error loading brands', '');
                brandDropdown.disabled = true;
            });
    }

    // Function to fetch available sizes for a selected brand
    function populateSizes(selectedBrand) {
        clearOptions(sizeDropdown);
        sizeDropdown.disabled = true;
        sizeDropdown.options[0].textContent = 'Loading sizes...';
        if (!selectedBrand) {
            sizeDropdown.options[0].textContent = 'Select brand first...';
            return;
        }
        // Always use capitalized brand for queries
        var capBrand = capitalizeFirstLetter(selectedBrand);
        db.collection('inventory')
            .where('brandName', 'in', [capBrand, capBrand.toLowerCase(), capBrand.toUpperCase()])
            .get()
            .then(function(snapshot) {
                if (snapshot.empty) {
                    
                    return db.collection('inventory').get();
                }
                return snapshot;
            })
            .then(function(snapshot) {
                var availableSizes = [];
                if (snapshot.empty) {
                    sizeDropdown.options[0].textContent = 'No sizes available';
                    return;
                }
                snapshot.forEach(function(doc) {
                    var brand = doc.data().brandName;
                    if (brand && brand.toLowerCase() === capBrand.toLowerCase()) {
                        var size = doc.data().bottleSize;
                        if (availableSizes.indexOf(size) === -1) {
                            availableSizes.push(size);
                        }
                    }
                });
                if (availableSizes.length === 0) {
                    sizeDropdown.options[0].textContent = 'No sizes available';
                    return;
                }
                var sortedSizes = availableSizes.sort();
                sizeDropdown.options[0].textContent = 'Choose...';
                sortedSizes.forEach(function(size) {
                    addOption(sizeDropdown, size, size);
                });
                sizeDropdown.disabled = false;
            })
            .catch(function(error) {
                console.error("Error fetching sizes: ", error);
                sizeDropdown.options[0].textContent = 'Error loading sizes';
            });
    }

    // Function to add a sale record to Firestore
    function addSaleToFirestore(saleData) {
        return db.collection("sales").add(saleData)
            .then(function(docRef) {
                console.log("Sale recorded with ID: ", docRef.id);
                return docRef.id;
            })
            .catch(function(error) {
                console.error("Error recording sale: ", error);
                alert("Failed to record sale in database. Please try again.");
                return null;
            });
    }

    // Function to create and display a row in the sales history table
    function createSalesRow(saleData, docId) {
        var newRow = salesTableBody.insertRow(0);
        newRow.dataset.id = docId;

        var cellDate = newRow.insertCell();
        var cellBrand = newRow.insertCell();
        var cellSize = newRow.insertCell();
        var cellQuantity = newRow.insertCell();
        var cellPrice = newRow.insertCell();
        var cellTotal = newRow.insertCell();

        
        var saleDate = saleData.saleTimestamp.toDate();
        cellDate.textContent = saleDate.toLocaleDateString() + ' ' + saleDate.toLocaleTimeString();

        cellBrand.textContent = saleData.brandName;
        cellSize.textContent = saleData.bottleSize;
        cellQuantity.textContent = saleData.quantityCrates;
        cellPrice.textContent = saleData.sellingPricePerCrate.toFixed(2);
        cellTotal.textContent = (saleData.quantityCrates * saleData.sellingPricePerCrate).toFixed(2);
    }

    // Function to load sales history from Firestore
    function loadSalesHistory() {
        db.collection("sales").orderBy("saleTimestamp", "desc").get()
            .then(function(snapshot) {
                salesTableBody.innerHTML = '';
                snapshot.forEach(function(doc) {
                    createSalesRow(doc.data(), doc.id);
                });
            })
            .catch(function(error) {
                console.error("Error loading sales history: ", error);
                alert("Failed to load sales history.");
            });
    }

    // Event listener for brand dropdown change
    brandDropdown.addEventListener('change', function() {
        var selectedBrand = this.value;
        populateSizes(selectedBrand);
    });

    // Populate brands when the page loads
    populateBrands();

    // Load sales history when the page loads
    loadSalesHistory();

    // Handle form submit button click
    salesForm.addEventListener('submit', function(event) {
        event.preventDefault();

        var selectedBrand = capitalizeFirstLetter(brandDropdown.value);
        var selectedSize = sizeDropdown.value;
        var quantitySold = parseInt(quantityInput.value);
        var sellingPrice = parseFloat(priceInput.value);

        
        if (!selectedBrand || !selectedSize || isNaN(quantitySold) || quantitySold <= 0 || isNaN(sellingPrice) || sellingPrice < 0) {
            alert('Please fill in all fields correctly (Quantity > 0, Price >= 0).');
            return;
        }

        
        // Try all case variations for brandName to match inventory
        function getInventoryDoc() {
            return db.collection("inventory")
                .where("brandName", "==", selectedBrand)
                .where("bottleSize", "==", selectedSize)
                .limit(1)
                .get()
                .then(function(snapshot) {
                    if (!snapshot.empty) return snapshot;
                    // Try lowercase
                    return db.collection("inventory")
                        .where("brandName", "==", selectedBrand.toLowerCase())
                        .where("bottleSize", "==", selectedSize)
                        .limit(1)
                        .get();
                })
                .then(function(snapshot) {
                    if (!snapshot.empty) return snapshot;
                    // Try uppercase
                    return db.collection("inventory")
                        .where("brandName", "==", selectedBrand.toUpperCase())
                        .where("bottleSize", "==", selectedSize)
                        .limit(1)
                        .get();
                });
        }
        getInventoryDoc()
            .then(function(inventorySnapshot) {
                if (inventorySnapshot.empty) {
                    throw new Error('Inventory item not found for ' + selectedBrand + ' - ' + selectedSize + '. Cannot record sale.');
                }
                var inventoryDocRef = inventorySnapshot.docs[0].ref;
                var inventoryDocId = inventorySnapshot.docs[0].id;
                var saleDocId = null; 
                return db.runTransaction(function(transaction) {
                    
                    return transaction.get(inventoryDocRef).then(function(inventoryDoc) {
                        if (!inventoryDoc.exists) {
                            throw new Error('Inventory item ' + inventoryDocId + ' vanished!');
                        }
                        var currentQuantity = inventoryDoc.data().quantityCrates;
                        if (currentQuantity < quantitySold) {
                            throw new Error('Insufficient stock for ' + selectedBrand + ' - ' + selectedSize + '. Available: ' + currentQuantity + ', Requested: ' + quantitySold);
                        }
                        var newQuantity = currentQuantity - quantitySold;
                        transaction.update(inventoryDocRef, { quantityCrates: newQuantity });
                        var saleData = {
                            brandName: selectedBrand,
                            bottleSize: selectedSize,
                            quantityCrates: quantitySold,
                            sellingPricePerCrate: sellingPrice,
                            saleTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
                            inventoryDocId: inventoryDocId
                        };
                        var saleDocRef = db.collection("sales").doc();
                        transaction.set(saleDocRef, saleData);
                        saleDocId = saleDocRef.id; 
                        return saleDocId;
                    });
                });
            })
            .then(function(returnedSaleDocId) {
                // This .then executes after the transaction successfully commits
                console.log("Transaction successful! Inventory updated and sale recorded.");
                var saleDocId = returnedSaleDocId; 

                
                if (saleDocId) {
                   
                    return db.collection("sales").doc(saleDocId).get()
                        .then(function(newSaleDoc) {
                            if (newSaleDoc.exists) {
                                createSalesRow(newSaleDoc.data(), newSaleDoc.id);
                            } else {
                                console.error("Failed to fetch newly added sale document for table update.");
                                loadSalesHistory();
                            }
                            
                            salesForm.reset();
                            clearOptions(sizeDropdown);
                            sizeDropdown.disabled = true;
                            sizeDropdown.options[0].textContent = 'Select brand first...';
                        });
                } else {
                     console.error("Sale Doc ID was not set after transaction."); 
                     return Promise.resolve(); 
                }
            })
            .catch(function(error) {
                
                console.error("Sale transaction failed: ", error);
                alert('Failed to record sale: ' + error.message);
            });
    });
});
