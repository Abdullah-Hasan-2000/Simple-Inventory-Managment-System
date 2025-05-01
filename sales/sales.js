document.addEventListener('DOMContentLoaded', function() {
    var brandDropdown = document.getElementById('brandNameDropdown');
    var sizeDropdown = document.getElementById('sizeDropdown');
    var quantityInput = document.getElementById('quantityCrates'); // Get quantity input
    var priceInput = document.getElementById('sellingPricePerCrate'); // Get price input
    var salesForm = document.getElementById('salesForm');
    var salesTableBody = document.getElementById('salesTableBody'); // Get table body

    // Helper function to add options to a select element
    function addOption(selectElement, text, value) {
        var option = document.createElement('option');
        option.textContent = text;
        option.value = value;
        selectElement.appendChild(option);
    }

    // Helper function to clear options from a select element
    function clearOptions(selectElement) {
        // Keep the first option (placeholder) and remove the rest
        while (selectElement.options.length > 1) {
            selectElement.remove(1);
        }
        // Reset to the placeholder option being selected
        selectElement.selectedIndex = 0;
    }

    // Function to fetch brands from Firestore and populate the dropdown (ES5 Promise)
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
                    addOption(brandDropdown, doc.data().name, doc.data().name);
                });
            })
            .catch(function(error) {
                console.error("Error fetching brands: ", error);
                addOption(brandDropdown, 'Error loading brands', '');
                brandDropdown.disabled = true;
            });
    }

    // Function to fetch available sizes for a selected brand (ES5 Promise)
    function populateSizes(selectedBrand) {
        clearOptions(sizeDropdown);
        sizeDropdown.disabled = true;
        sizeDropdown.options[0].textContent = 'Loading sizes...';

        if (!selectedBrand) {
            sizeDropdown.options[0].textContent = 'Select brand first...';
            return; // Exit if no brand is selected
        }

        db.collection('inventory')
            .where('brandName', '==', selectedBrand)
            .get()
            .then(function(snapshot) {
                if (snapshot.empty) {
                    console.log('No inventory found for brand: ' + selectedBrand);
                    sizeDropdown.options[0].textContent = 'No sizes available';
                    return;
                }

                var availableSizes = []; // Use an array instead of Set
                snapshot.forEach(function(doc) {
                    var size = doc.data().bottleSize;
                    if (availableSizes.indexOf(size) === -1) { // Check if size already exists
                        availableSizes.push(size);
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

    // Function to add a sale record to Firestore (ES5 Promise)
    function addSaleToFirestore(saleData) {
        return db.collection("sales").add(saleData)
            .then(function(docRef) {
                console.log("Sale recorded with ID: ", docRef.id);
                return docRef.id; // Return the new document ID
            })
            .catch(function(error) {
                console.error("Error recording sale: ", error);
                alert("Failed to record sale in database. Please try again.");
                return null;
            });
    }

    // Function to create and display a row in the sales history table
    function createSalesRow(saleData, docId) {
        var newRow = salesTableBody.insertRow(0); // Insert at the top
        newRow.dataset.id = docId; // Store Firestore document ID if needed later

        var cellDate = newRow.insertCell();
        var cellBrand = newRow.insertCell();
        var cellSize = newRow.insertCell();
        var cellQuantity = newRow.insertCell();
        var cellPrice = newRow.insertCell();
        var cellTotal = newRow.insertCell();

        // Format date (consider using a library for more robust formatting)
        var saleDate = saleData.saleTimestamp.toDate(); // Convert Firestore Timestamp to JS Date
        cellDate.textContent = saleDate.toLocaleDateString() + ' ' + saleDate.toLocaleTimeString();

        cellBrand.textContent = saleData.brandName;
        cellSize.textContent = saleData.bottleSize;
        cellQuantity.textContent = saleData.quantityCrates;
        cellPrice.textContent = saleData.sellingPricePerCrate.toFixed(2);
        cellTotal.textContent = (saleData.quantityCrates * saleData.sellingPricePerCrate).toFixed(2);
    }

    // Function to load sales history from Firestore (ES5 Promise)
    function loadSalesHistory() {
        db.collection("sales").orderBy("saleTimestamp", "desc").get()
            .then(function(snapshot) {
                salesTableBody.innerHTML = ''; // Clear existing table rows
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
    loadSalesHistory(); // <-- Add this call

    // Handle form submission (updated with inventory check - ES5 Promise)
    salesForm.addEventListener('submit', function(event) {
        event.preventDefault();

        var selectedBrand = brandDropdown.value;
        var selectedSize = sizeDropdown.value;
        var quantitySold = parseInt(quantityInput.value);
        var sellingPrice = parseFloat(priceInput.value);

        // Validation (as before)
        if (!selectedBrand || !selectedSize || isNaN(quantitySold) || quantitySold <= 0 || isNaN(sellingPrice) || sellingPrice < 0) {
            alert('Please fill in all fields correctly (Quantity > 0, Price >= 0).');
            return;
        }

        // --- Inventory Check and Update Logic (ES5 Promise) --- 
        var inventoryQuery = db.collection("inventory")
                             .where("brandName", "==", selectedBrand)
                             .where("bottleSize", "==", selectedSize)
                             .limit(1);

        inventoryQuery.get()
            .then(function(inventorySnapshot) {
                if (inventorySnapshot.empty) {
                    throw new Error('Inventory item not found for ' + selectedBrand + ' - ' + selectedSize + '. Cannot record sale.');
                }

                var inventoryDocRef = inventorySnapshot.docs[0].ref;
                var inventoryDocId = inventorySnapshot.docs[0].id;
                var saleDocId = null; // To store the ID of the recorded sale

                // Run a transaction (still uses async callback internally, but the outer structure is Promise-based)
                return db.runTransaction(function(transaction) {
                    // This function must return a Promise
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

                        var saleDocRef = db.collection("sales").doc(); // Auto-generate ID
                        transaction.set(saleDocRef, saleData);
                        saleDocId = saleDocRef.id; // Store the generated ID
                        return saleDocId; // Return the saleDocId from the transaction promise chain
                    });
                });
            })
            .then(function(returnedSaleDocId) {
                // This .then executes after the transaction successfully commits
                console.log("Transaction successful! Inventory updated and sale recorded.");
                var saleDocId = returnedSaleDocId; // Get the ID returned by the transaction

                // --- Post-Transaction UI Updates --- 
                if (saleDocId) {
                    // Fetch the newly created sale document to get server-generated timestamp
                    return db.collection("sales").doc(saleDocId).get()
                        .then(function(newSaleDoc) {
                            if (newSaleDoc.exists) {
                                createSalesRow(newSaleDoc.data(), newSaleDoc.id);
                            } else {
                                console.error("Failed to fetch newly added sale document for table update.");
                                loadSalesHistory(); // Fallback: Reload the whole table
                            }
                            // Clear the form regardless of fetch success
                            salesForm.reset();
                            clearOptions(sizeDropdown);
                            sizeDropdown.disabled = true;
                            sizeDropdown.options[0].textContent = 'Select brand first...';
                        });
                } else {
                     console.error("Sale Doc ID was not set after transaction."); // Should not happen on success
                     return Promise.resolve(); // Continue promise chain
                }
            })
            .catch(function(error) {
                // This catches errors from inventoryQuery.get() OR db.runTransaction()
                console.error("Sale transaction failed: ", error);
                alert('Failed to record sale: ' + error.message); // Show specific error
            });
    });
});
