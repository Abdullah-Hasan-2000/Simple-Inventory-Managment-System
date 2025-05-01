document.addEventListener('DOMContentLoaded', function() {
    const brandDropdown = document.getElementById('brandNameDropdown');
    const sizeDropdown = document.getElementById('sizeDropdown');
    const quantityInput = document.getElementById('quantityCrates'); // Get quantity input
    const priceInput = document.getElementById('sellingPricePerCrate'); // Get price input
    const salesForm = document.getElementById('salesForm');
    const salesTableBody = document.getElementById('salesTableBody'); // Get table body

    // Helper function to add options to a select element
    function addOption(selectElement, text, value) {
        const option = document.createElement('option');
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

    // Function to fetch brands from Firestore and populate the dropdown
    async function populateBrands() {
        try {
            const snapshot = await db.collection('brands').orderBy('name').get();
            if (snapshot.empty) {
                console.log('No brands found in Firestore.');
                addOption(brandDropdown, 'No brands available', '');
                brandDropdown.disabled = true;
                return;
            }
            snapshot.forEach(doc => {
                addOption(brandDropdown, doc.data().name, doc.data().name);
            });
        } catch (error) {
            console.error("Error fetching brands: ", error);
            addOption(brandDropdown, 'Error loading brands', '');
            brandDropdown.disabled = true;
        }
    }

    // Function to fetch available sizes for a selected brand
    async function populateSizes(selectedBrand) {
        clearOptions(sizeDropdown);
        sizeDropdown.disabled = true;
        sizeDropdown.options[0].textContent = 'Loading sizes...'; // Update placeholder text

        if (!selectedBrand) {
            sizeDropdown.options[0].textContent = 'Select brand first...';
            return; // Exit if no brand is selected
        }

        try {
            const snapshot = await db.collection('inventory')
                                     .where('brandName', '==', selectedBrand)
                                     .get();

            if (snapshot.empty) {
                console.log(`No inventory found for brand: ${selectedBrand}`);
                sizeDropdown.options[0].textContent = 'No sizes available';
                return;
            }

            const availableSizes = new Set(); // Use a Set to store unique sizes
            snapshot.forEach(doc => {
                availableSizes.add(doc.data().bottleSize);
            });

            if (availableSizes.size === 0) {
                 sizeDropdown.options[0].textContent = 'No sizes available';
                 return;
            }

            // Sort sizes (optional, but good for consistency)
            const sortedSizes = Array.from(availableSizes).sort(); // Basic sort, customize if needed

            sizeDropdown.options[0].textContent = 'Choose...'; // Reset placeholder
            sortedSizes.forEach(size => {
                addOption(sizeDropdown, size, size);
            });
            sizeDropdown.disabled = false; // Enable the dropdown

        } catch (error) {
            console.error("Error fetching sizes: ", error);
            sizeDropdown.options[0].textContent = 'Error loading sizes';
        }
    }

    // Function to add a sale record to Firestore
    async function addSaleToFirestore(saleData) {
        try {
            const docRef = await db.collection("sales").add(saleData);
            console.log("Sale recorded with ID: ", docRef.id);
            return docRef.id; // Return the new document ID
        } catch (error) {
            console.error("Error recording sale: ", error);
            alert("Failed to record sale in database. Please try again.");
            return null;
        }
    }

    // Function to create and display a row in the sales history table
    function createSalesRow(saleData, docId) {
        const newRow = salesTableBody.insertRow(0); // Insert at the top
        newRow.dataset.id = docId; // Store Firestore document ID if needed later

        const cellDate = newRow.insertCell();
        const cellBrand = newRow.insertCell();
        const cellSize = newRow.insertCell();
        const cellQuantity = newRow.insertCell();
        const cellPrice = newRow.insertCell();
        const cellTotal = newRow.insertCell();

        // Format date (consider using a library for more robust formatting)
        const saleDate = saleData.saleTimestamp.toDate(); // Convert Firestore Timestamp to JS Date
        cellDate.textContent = saleDate.toLocaleDateString() + ' ' + saleDate.toLocaleTimeString();

        cellBrand.textContent = saleData.brandName;
        cellSize.textContent = saleData.bottleSize;
        cellQuantity.textContent = saleData.quantityCrates;
        cellPrice.textContent = saleData.sellingPricePerCrate.toFixed(2);
        cellTotal.textContent = (saleData.quantityCrates * saleData.sellingPricePerCrate).toFixed(2);
    }

    // Function to load sales history from Firestore
    async function loadSalesHistory() {
        try {
            // Order by timestamp descending to show newest first
            const snapshot = await db.collection("sales").orderBy("saleTimestamp", "desc").get();
            salesTableBody.innerHTML = ''; // Clear existing table rows
            snapshot.forEach((doc) => {
                createSalesRow(doc.data(), doc.id);
            });
        } catch (error) {
            console.error("Error loading sales history: ", error);
            alert("Failed to load sales history.");
        }
    }

    // Event listener for brand dropdown change
    brandDropdown.addEventListener('change', function() {
        const selectedBrand = this.value;
        populateSizes(selectedBrand);
    });

    // Populate brands when the page loads
    populateBrands();

    // Load sales history when the page loads
    loadSalesHistory(); // <-- Add this call

    // Handle form submission (updated with inventory check)
    salesForm.addEventListener('submit', async function(event) { // Make async
        event.preventDefault();

        const selectedBrand = brandDropdown.value;
        const selectedSize = sizeDropdown.value;
        const quantitySold = parseInt(quantityInput.value);
        const sellingPrice = parseFloat(priceInput.value);

        // Validation (as before)
        if (!selectedBrand || !selectedSize || isNaN(quantitySold) || quantitySold <= 0 || isNaN(sellingPrice) || sellingPrice < 0) {
            alert('Please fill in all fields correctly (Quantity > 0, Price >= 0).');
            return;
        }

        // --- Inventory Check and Update Logic --- 
        try {
            // Find the specific inventory item document
            // NOTE: This assumes a unique document per brand/size combination.
            // If multiple docs can exist, this query needs refinement (e.g., get the first one).
            const inventoryQuery = db.collection("inventory")
                                     .where("brandName", "==", selectedBrand)
                                     .where("bottleSize", "==", selectedSize)
                                     .limit(1); // Expect only one matching item

            const inventorySnapshot = await inventoryQuery.get();

            if (inventorySnapshot.empty) {
                alert(`Error: Inventory item not found for ${selectedBrand} - ${selectedSize}. Cannot record sale.`);
                return;
            }

            const inventoryDocRef = inventorySnapshot.docs[0].ref; // Get the DocumentReference
            const inventoryDocId = inventorySnapshot.docs[0].id;
            let saleDocId = null; // To store the ID of the recorded sale

            // Run a transaction to update inventory and record sale atomically
            await db.runTransaction(async (transaction) => {
                const inventoryDoc = await transaction.get(inventoryDocRef);
                if (!inventoryDoc.exists) {
                    throw new Error(`Inventory item ${inventoryDocId} vanished!`); // Should not happen if query worked
                }

                const currentQuantity = inventoryDoc.data().quantityCrates;
                if (currentQuantity < quantitySold) {
                    throw new Error(`Insufficient stock for ${selectedBrand} - ${selectedSize}. Available: ${currentQuantity}, Requested: ${quantitySold}`);
                }

                // Calculate the new quantity
                const newQuantity = currentQuantity - quantitySold;

                // Update the inventory document within the transaction
                transaction.update(inventoryDocRef, { quantityCrates: newQuantity });

                // Prepare sale data (timestamp will be set by server)
                const saleData = {
                    brandName: selectedBrand,
                    bottleSize: selectedSize,
                    quantityCrates: quantitySold,
                    sellingPricePerCrate: sellingPrice,
                    saleTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    inventoryDocId: inventoryDocId // Optional: Link sale to the inventory item updated
                };

                // Create the sale document within the transaction
                // We need a reference first to potentially get the ID later if needed immediately,
                // though we fetch it properly after the transaction.
                const saleDocRef = db.collection("sales").doc(); // Auto-generate ID
                transaction.set(saleDocRef, saleData);
                saleDocId = saleDocRef.id; // Store the generated ID
            });

            console.log("Transaction successful! Inventory updated and sale recorded.");

            // --- Post-Transaction UI Updates --- 
            if (saleDocId) {
                 // Fetch the newly created sale document to get server-generated timestamp
                const newSaleDoc = await db.collection("sales").doc(saleDocId).get();
                if (newSaleDoc.exists) {
                    createSalesRow(newSaleDoc.data(), newSaleDoc.id);
                } else {
                    console.error("Failed to fetch newly added sale document for table update.");
                    // Fallback: Reload the whole table
                    loadSalesHistory(); 
                }

                // Clear the form
                salesForm.reset();
                clearOptions(sizeDropdown);
                sizeDropdown.disabled = true;
                sizeDropdown.options[0].textContent = 'Select brand first...';
            } else {
                 console.error("Sale Doc ID was not set after transaction."); // Should not happen on success
            }

        } catch (error) {
            console.error("Sale transaction failed: ", error);
            alert(`Failed to record sale: ${error.message}`); // Show specific error (e.g., insufficient stock)
        }
    });
});
