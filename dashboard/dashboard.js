document.addEventListener('DOMContentLoaded', function() {
    const inventorySummaryDiv = document.getElementById('inventorySummary');
    const inventoryDetailsDiv = document.getElementById('inventoryDetails');
    const lowStockListDiv = document.getElementById('lowStockList');
    const outOfStockListDiv = document.getElementById('outOfStockList');

    const LOW_STOCK_THRESHOLD = 5;

    // Function to create a summary card
    function createSummaryCard(title, value, bgColorClass = 'bg-light', textColorClass = 'text-dark') {
        const col = document.createElement('div');
        col.className = 'col-md-4 mb-3'; // Added mb-3 for spacing
        col.innerHTML = `
            <div class="card text-center ${bgColorClass} ${textColorClass}">
                <div class="card-header">${title}</div>
                <div class="card-body">
                    <h5 class="card-title">${value}</h5>
                </div>
            </div>
        `;
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
        let isFirst = true; // To make the first accordion item open by default

        // Sort brand names alphabetically
        const sortedBrands = Object.keys(groupedInventory).sort();

        sortedBrands.forEach(brandName => {
            const items = groupedInventory[brandName];
            const accordionItemId = `collapse-${brandName.replace(/\s+/g, '-')}`;
            const headerId = `header-${brandName.replace(/\s+/g, '-')}`;

            const accordionItem = document.createElement('div');
            accordionItem.className = 'accordion-item';

            let totalBrandQuantity = 0;
            let listItemsHtml = '<ul class="list-group list-group-flush">';
            // Sort items by size (optional, requires custom sort logic if sizes aren't easily comparable)
            items.sort((a, b) => a.bottleSize.localeCompare(b.bottleSize)); // Simple string sort
            items.forEach(item => {
                totalBrandQuantity += item.quantityCrates;
                listItemsHtml += `<li class="list-group-item d-flex justify-content-between align-items-center">
                                    ${item.bottleSize}
                                    <span class="badge bg-primary rounded-pill">${item.quantityCrates} Crates</span>
                                  </li>`;
            });
            listItemsHtml += '</ul>';

            accordionItem.innerHTML = `
                <h2 class="accordion-header" id="${headerId}">
                    <button class="accordion-button ${isFirst ? '' : 'collapsed'}" type="button" data-bs-toggle="collapse" data-bs-target="#${accordionItemId}" aria-expanded="${isFirst}" aria-controls="${accordionItemId}">
                        ${brandName} <span class="badge bg-secondary ms-2">Total: ${totalBrandQuantity} Crates</span>
                    </button>
                </h2>
                <div id="${accordionItemId}" class="accordion-collapse collapse ${isFirst ? 'show' : ''}" aria-labelledby="${headerId}" data-bs-parent="#inventoryDetails">
                    <div class="accordion-body p-0">
                        ${listItemsHtml}
                    </div>
                </div>
            `;
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
        items.forEach(item => {
            const listItem = document.createElement('a');
            listItem.href = '#'; // Or link to add/delete page?
            listItem.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
            listItem.innerHTML = `
                ${item.brandName} - ${item.bottleSize}
                <span class="badge ${item.quantityCrates <= 0 ? 'bg-danger' : 'bg-warning text-dark'} rounded-pill">Qty: ${item.quantityCrates}</span>
            `;
            listElement.appendChild(listItem);
        });
    }

    // Main function to load and process data
    async function loadDashboardData() {
        try {
            const snapshot = await db.collection("inventory").orderBy("brandName").get();

            const inventoryItems = [];
            snapshot.forEach(doc => {
                inventoryItems.push({ id: doc.id, ...doc.data() });
            });

            // Process data
            const groupedInventory = {};
            const lowStockItems = [];
            const outOfStockItems = [];
            const brands = new Set();

            inventoryItems.forEach(item => {
                brands.add(item.brandName);

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
            renderSummaryCards(brands.size, lowStockItems.length, outOfStockItems.length);
            renderInventoryDetails(groupedInventory);
            renderStockList(lowStockItems, lowStockListDiv);
            renderStockList(outOfStockItems, outOfStockListDiv);

        } catch (error) {
            console.error("Error loading dashboard data: ", error);
            inventorySummaryDiv.innerHTML = '<p class="text-danger">Error loading summary.</p>';
            inventoryDetailsDiv.innerHTML = '<p class="text-danger">Error loading inventory details.</p>';
            lowStockListDiv.innerHTML = '<p class="text-danger">Error loading low stock list.</p>';
            outOfStockListDiv.innerHTML = '<p class="text-danger">Error loading out of stock list.</p>';
        }
    }

    // Initial load
    loadDashboardData();

});
