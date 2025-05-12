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
      var db = firebase.firestore();

document.addEventListener('DOMContentLoaded', function() {
    var inventorySummaryDiv = document.getElementById('inventorySummary');
    var inventoryDetailsDiv = document.getElementById('inventoryDetails');
    var lowStockListDiv = document.getElementById('lowStockList');
    var outOfStockListDiv = document.getElementById('outOfStockList');

    var LOW_STOCK_THRESHOLD = 5;

    // Function to create a summary card
    function createSummaryCard(title, value, bgColorClass, textColorClass) {
        // ES5 default parameter handling
        bgColorClass = typeof bgColorClass !== 'undefined' ? bgColorClass : 'bg-light';
        textColorClass = typeof textColorClass !== 'undefined' ? textColorClass : 'text-dark';

        var col = document.createElement('div');
        col.className = 'col-md-4 mb-3'; // Added mb-3 for spacing
        // Replace template literal with string concatenation
        col.innerHTML =
            '<div class="card text-center ' + bgColorClass + ' ' + textColorClass + '">' +
                '<div class="card-header">' + title + '</div>' +
                '<div class="card-body">' +
                    '<h5 class="card-title">' + value + '</h5>' +
                '</div>' +
            '</div>';
        return col;
    }

    // Function to render the summary cards
    function renderSummaryCards(brandsCount, lowStockCount, outOfStockCount) {
        inventorySummaryDiv.innerHTML = ''; // Clear previous cards
        inventorySummaryDiv.appendChild(createSummaryCard('Total Brands', brandsCount));
        inventorySummaryDiv.appendChild(createSummaryCard('Low Stock Items', lowStockCount, 'text-bg-warning'));
        inventorySummaryDiv.appendChild(createSummaryCard('Out of Stock Items', outOfStockCount, 'text-bg-danger'));
    }

    // Function to render the detailed inventory accordion
    function renderInventoryDetails(groupedInventory) {
        inventoryDetailsDiv.innerHTML = ''; // Clear previous details
        var isFirst = true; // To make the first accordion item open by default

        // Sort brand names alphabetically
        var sortedBrands = Object.keys(groupedInventory).sort();

        // Replace arrow function with function keyword
        sortedBrands.forEach(function(brandName) {
            var items = groupedInventory[brandName];
            var accordionItemId = 'collapse-' + brandName.replace(/\s+/g, '-');
            var headerId = 'header-' + brandName.replace(/\s+/g, '-');

            var accordionItem = document.createElement('div');
            accordionItem.className = 'accordion-item';

            var totalBrandQuantity = 0;
            var listItemsHtml = '<ul class="list-group list-group-flush">';
            // Sort items by size (optional, requires custom sort logic if sizes aren't easily comparable)
            // Replace arrow function with function keyword
            items.sort(function(a, b) { return a.bottleSize.localeCompare(b.bottleSize); }); // Simple string sort
            // Replace arrow function with function keyword
            items.forEach(function(item) {
                totalBrandQuantity += item.quantityCrates;
                // Replace template literal with string concatenation
                listItemsHtml += '<li class="list-group-item d-flex justify-content-between align-items-center">' +
                                    item.bottleSize +
                                    '<span class="badge bg-primary rounded-pill">' + item.quantityCrates + ' Crates</span>' +
                                  '</li>';
            });
            listItemsHtml += '</ul>';

            // Replace template literal with string concatenation
            accordionItem.innerHTML =
                '<h2 class="accordion-header" id="' + headerId + '">' +
                    '<button class="accordion-button ' + (isFirst ? '' : 'collapsed') + '" type="button" data-bs-toggle="collapse" data-bs-target="#' + accordionItemId + '" aria-expanded="' + isFirst + '" aria-controls="' + accordionItemId + '">' +
                        brandName + ' <span class="badge bg-secondary ms-2">Total: ' + totalBrandQuantity + ' Crates</span>' +
                    '</button>' +
                '</h2>' +
                '<div id="' + accordionItemId + '" class="accordion-collapse collapse ' + (isFirst ? 'show' : '') + '" aria-labelledby="' + headerId + '" data-bs-parent="#inventoryDetails">' +
                    '<div class="accordion-body p-0">' +
                        listItemsHtml +
                    '</div>' +
                '</div>';
            inventoryDetailsDiv.appendChild(accordionItem);
            isFirst = false;
        });
    }

    // Function to render low/out of stock lists
    function renderStockList(items, listElement) {
        listElement.innerHTML = ''; // Clear previous list
        if (items.length === 0) {
            listElement.innerHTML = '<p class="text-muted">None</p>';
            return;
        }
        // Replace arrow function with function keyword
        items.forEach(function(item) {
            var listItem = document.createElement('a');
            listItem.href = '#'; // Or link to add/delete page?
            listItem.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
            // Replace template literal with string concatenation
            listItem.innerHTML =
                item.brandName + ' - ' + item.bottleSize +
                '<span class="badge ' + (item.quantityCrates <= 0 ? 'bg-danger' : 'bg-warning text-dark') + ' rounded-pill">Qty: ' + item.quantityCrates + '</span>';
            listElement.appendChild(listItem);
        });
    }

    // Main function to load and process data (Converted to ES5 Promise syntax)
    function loadDashboardData() {
        db.collection("inventory").orderBy("brandName").get()
            .then(function(snapshot) {
                var inventoryItems = [];
                snapshot.forEach(function(doc) {
                    var data = doc.data();
                    data.id = doc.id;
                    inventoryItems.push(data);
                    console.log(inventoryItems);
                    
                });

                // Process data
                var groupedInventory = {};
                var lowStockItems = [];
                var outOfStockItems = [];
                var brands = [];

                inventoryItems.forEach(function(item) {
                    // Add brand if not already present
                    if (brands.indexOf(item.brandName) === -1) {
                        brands.push(item.brandName);
                    }

                    // Group by brand
                    if (!groupedInventory[item.brandName]) {
                        groupedInventory[item.brandName] = [];
                    }
                    groupedInventory[item.brandName].push(item);

                    // Check stock levels
                    if (item.quantityCrates <= 0) {
                        outOfStockItems.push(item);
                    } else if (item.quantityCrates < LOW_STOCK_THRESHOLD) {
                        lowStockItems.push(item);
                    }
                });

                // Render sections
                renderSummaryCards(brands.length, lowStockItems.length, outOfStockItems.length);
                renderInventoryDetails(groupedInventory);
                renderStockList(lowStockItems, lowStockListDiv);
                renderStockList(outOfStockItems, outOfStockListDiv);

            })
            .catch(function(error) {
                console.error("Error loading dashboard data: ", error);
                inventorySummaryDiv.innerHTML = '<p class="text-danger">Error loading summary.</p>';
                inventoryDetailsDiv.innerHTML = '<p class="text-danger">Error loading inventory details.</p>';
                lowStockListDiv.innerHTML = '<p class="text-danger">Error loading low stock list.</p>';
                outOfStockListDiv.innerHTML = '<p class="text-danger">Error loading out of stock list.</p>';
            });
    }

    // Initial load
    loadDashboardData();

});
