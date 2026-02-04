const API_URL = 'https://api.escuelajs.co/api/v1/products';

let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let pageSize = 10;
let sortField = '';
let sortOrder = 'asc';

function sortBy(field) {
    if (sortField === field) {
        sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        sortField = field;
        sortOrder = 'asc';
    }

    filteredProducts.sort(function (a, b) {
        let valueA = a[field];
        let valueB = b[field];

        if (field === 'title') {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
        }

        if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    updateSortIcons();
    currentPage = 1;
    updateDisplay();
}

function updateSortIcons() {
    document.getElementById('sortTitleIcon').textContent = '⇅';
    document.getElementById('sortPriceIcon').textContent = '⇅';

    if (sortField === 'title') {
        document.getElementById('sortTitleIcon').textContent = sortOrder === 'asc' ? '↑' : '↓';
    } else if (sortField === 'price') {
        document.getElementById('sortPriceIcon').textContent = sortOrder === 'asc' ? '↑' : '↓';
    }
}

async function fetchProducts() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const products = await response.json();
        return products;
    } catch (error) {
        throw error;
    }
}

function getImageUrl(images) {
    if (!Array.isArray(images) || images.length === 0) {
        return 'https://via.placeholder.com/80x80?text=No+Image';
    }
    let url = images[0];
    if (typeof url === 'string') {
        url = url.replace(/[\[\]"]/g, '').trim();
    }
    return url || 'https://via.placeholder.com/80x80?text=No+Image';
}

function filterByTitle(keyword) {
    const searchTerm = keyword.toLowerCase().trim();
    if (searchTerm === '') {
        return allProducts;
    }
    return allProducts.filter(function (product) {
        return product.title.toLowerCase().includes(searchTerm);
    });
}

function getTotalPages() {
    return Math.ceil(filteredProducts.length / pageSize);
}

function getPagedProducts() {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredProducts.slice(startIndex, endIndex);
}

function renderProducts(products) {
    const tbody = document.getElementById('productTableBody');
    tbody.innerHTML = '';

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No products found</td></tr>';
        return;
    }

    products.forEach(function (product) {
        const categoryName = product.category ? product.category.name : 'N/A';
        const imageUrl = getImageUrl(product.images);

        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.innerHTML = `
            <td>${product.id}</td>
            <td>${product.title}</td>
            <td>$${product.price}</td>
            <td>${categoryName}</td>
            <td><img src="${imageUrl}" alt="${product.title}" style="width:80px;height:80px;object-fit:cover;" onerror="this.src='https://via.placeholder.com/80x80?text=No+Image'"></td>
        `;

        tr.addEventListener('click', function () {
            openDetailModal(product);
        });

        tbody.appendChild(tr);
    });
}

function renderPagination() {
    const pagination = document.getElementById('pagination');
    const pageInfo = document.getElementById('pageInfo');
    const totalPages = getTotalPages();

    const startItem = filteredProducts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, filteredProducts.length);
    pageInfo.textContent = `Showing ${startItem}-${endItem} of ${filteredProducts.length} items`;

    pagination.innerHTML = '';

    if (totalPages <= 1) {
        return;
    }

    const prevLi = document.createElement('li');
    prevLi.className = 'page-item' + (currentPage === 1 ? ' disabled' : '');
    prevLi.innerHTML = '<a class="page-link" href="#">Previous</a>';
    prevLi.addEventListener('click', function (e) {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            updateDisplay();
        }
    });
    pagination.appendChild(prevLi);

    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = 'page-item' + (i === currentPage ? ' active' : '');
        li.innerHTML = '<a class="page-link" href="#">' + i + '</a>';
        li.addEventListener('click', function (e) {
            e.preventDefault();
            currentPage = i;
            updateDisplay();
        });
        pagination.appendChild(li);
    }

    const nextLi = document.createElement('li');
    nextLi.className = 'page-item' + (currentPage === totalPages ? ' disabled' : '');
    nextLi.innerHTML = '<a class="page-link" href="#">Next</a>';
    nextLi.addEventListener('click', function (e) {
        e.preventDefault();
        if (currentPage < totalPages) {
            currentPage++;
            updateDisplay();
        }
    });
    pagination.appendChild(nextLi);
}

function updateDisplay() {
    const pagedProducts = getPagedProducts();
    renderProducts(pagedProducts);
    renderPagination();
}

function handleSearch(event) {
    const keyword = event.target.value;
    filteredProducts = filterByTitle(keyword);
    currentPage = 1;
    updateDisplay();
}

function handlePageSizeChange(event) {
    pageSize = parseInt(event.target.value);
    currentPage = 1;
    updateDisplay();
}

// Export to CSV function
function exportToCSV() {
    const dataToExport = filteredProducts;

    if (dataToExport.length === 0) {
        alert('No data to export!');
        return;
    }

    const headers = ['ID', 'Title', 'Price', 'Category', 'Description', 'Image URL'];
    const csvRows = [];

    csvRows.push(headers.join(','));

    dataToExport.forEach(function (product) {
        const categoryName = product.category ? product.category.name : 'N/A';
        const imageUrl = getImageUrl(product.images);
        const description = (product.description || '').replace(/"/g, '""').replace(/\n/g, ' ');
        const title = (product.title || '').replace(/"/g, '""');

        const row = [
            product.id,
            `"${title}"`,
            product.price,
            `"${categoryName}"`,
            `"${description}"`,
            `"${imageUrl}"`
        ];
        csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'products_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Open Detail Modal
function openDetailModal(product) {
    document.getElementById('detailProductId').value = product.id;
    document.getElementById('detailTitle').value = product.title;
    document.getElementById('detailPrice').value = product.price;
    document.getElementById('detailDescription').value = product.description || '';
    document.getElementById('detailImageUrl').value = getImageUrl(product.images);
    document.getElementById('detailImage').src = getImageUrl(product.images);

    if (product.category) {
        document.getElementById('detailCategory').value = product.category.id;
    }

    const modal = new bootstrap.Modal(document.getElementById('detailModal'));
    modal.show();
}

// Open Create Modal
function openCreateModal() {
    document.getElementById('createTitle').value = '';
    document.getElementById('createPrice').value = '';
    document.getElementById('createDescription').value = '';
    document.getElementById('createImageUrl').value = '';
    document.getElementById('createCategory').value = '1';

    const modal = new bootstrap.Modal(document.getElementById('createModal'));
    modal.show();
}

// Update Product via API
async function updateProduct() {
    const productId = document.getElementById('detailProductId').value;
    const title = document.getElementById('detailTitle').value;
    const price = parseFloat(document.getElementById('detailPrice').value);
    const description = document.getElementById('detailDescription').value;
    const categoryId = parseInt(document.getElementById('detailCategory').value);
    const imageUrl = document.getElementById('detailImageUrl').value;

    if (!title || !price) {
        alert('Title and Price are required!');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: title,
                price: price,
                description: description,
                categoryId: categoryId,
                images: [imageUrl]
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update product');
        }

        const updatedProduct = await response.json();
        alert('Product updated successfully!');

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('detailModal'));
        modal.hide();

        // Refresh data
        allProducts = await fetchProducts();
        filteredProducts = filterByTitle(document.getElementById('searchInput').value);
        updateDisplay();
    } catch (error) {
        alert('Error updating product: ' + error.message);
    }
}

// Create Product via API
async function createProduct() {
    const title = document.getElementById('createTitle').value;
    const price = parseFloat(document.getElementById('createPrice').value);
    const description = document.getElementById('createDescription').value;
    const categoryId = parseInt(document.getElementById('createCategory').value);
    const imageUrl = document.getElementById('createImageUrl').value || 'https://placeimg.com/640/480/any';

    if (!title || !price || !description) {
        alert('Please fill in all required fields!');
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: title,
                price: price,
                description: description,
                categoryId: categoryId,
                images: [imageUrl]
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create product');
        }

        const newProduct = await response.json();
        alert('Product created successfully! ID: ' + newProduct.id);

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('createModal'));
        modal.hide();

        // Refresh data
        allProducts = await fetchProducts();
        filteredProducts = filterByTitle(document.getElementById('searchInput').value);
        updateDisplay();
    } catch (error) {
        alert('Error creating product: ' + error.message);
    }
}

async function init() {
    try {
        allProducts = await fetchProducts();
        filteredProducts = allProducts;
        updateDisplay();

        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', handleSearch);

        const pageSizeSelect = document.getElementById('pageSizeSelect');
        pageSizeSelect.addEventListener('change', handlePageSizeChange);
    } catch (error) {
        const tbody = document.getElementById('productTableBody');
        tbody.innerHTML = `<tr><td colspan="5" class="text-danger">Error: ${error.message}</td></tr>`;
    }
}

document.addEventListener('DOMContentLoaded', init);

