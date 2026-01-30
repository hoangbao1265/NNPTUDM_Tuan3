/**
 * Product Management Application
 * Sử dụng API: https://api.escuelajs.co/api/v1/products
 */

// ========================================
// GLOBAL VARIABLES
// ========================================
const API_URL = 'https://api.escuelajs.co/api/v1/products';

let allProducts = [];           // Lưu trữ tất cả sản phẩm từ API
let filteredProducts = [];      // Sản phẩm sau khi lọc/tìm kiếm
let currentPage = 1;            // Trang hiện tại
let itemsPerPage = 10;          // Số sản phẩm mỗi trang
let currentSort = null;         // Trạng thái sắp xếp hiện tại

// ========================================
// DOM ELEMENTS
// ========================================
const searchInput = document.getElementById('searchInput');
const itemsPerPageSelect = document.getElementById('itemsPerPage');
const productsTableBody = document.getElementById('productsTableBody');
const tableContainer = document.getElementById('tableContainer');
const loadingSpinner = document.getElementById('loadingSpinner');
const paginationContainer = document.getElementById('paginationContainer');
const paginationList = document.getElementById('paginationList');
const paginationInfo = document.getElementById('paginationInfo');
const noResultsMessage = document.getElementById('noResultsMessage');

// Sort buttons
const sortPriceAsc = document.getElementById('sortPriceAsc');
const sortPriceDesc = document.getElementById('sortPriceDesc');
const sortNameAsc = document.getElementById('sortNameAsc');
const sortNameDesc = document.getElementById('sortNameDesc');
const resetSort = document.getElementById('resetSort');

// ========================================
// API FUNCTIONS
// ========================================

/**
 * Hàm getAll - Lấy tất cả sản phẩm từ API
 * @returns {Promise<Array>} Mảng các sản phẩm
 */
async function getAllProducts() {
    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const products = await response.json();
        console.log(`Đã tải ${products.length} sản phẩm từ API`);
        return products;
    } catch (error) {
        console.error('Lỗi khi tải sản phẩm:', error);
        throw error;
    }
}

// ========================================
// RENDER FUNCTIONS
// ========================================

/**
 * Hiển thị bảng sản phẩm
 * @param {Array} products - Mảng sản phẩm cần hiển thị
 */
function renderProductsTable(products) {
    // Tính toán sản phẩm cho trang hiện tại
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = products.slice(startIndex, endIndex);

    // Xóa nội dung cũ
    productsTableBody.innerHTML = '';

    if (paginatedProducts.length === 0) {
        tableContainer.classList.add('d-none');
        paginationContainer.classList.add('d-none');
        noResultsMessage.classList.remove('d-none');
        return;
    }

    noResultsMessage.classList.add('d-none');
    tableContainer.classList.remove('d-none');
    paginationContainer.classList.remove('d-none');

    // Render từng sản phẩm
    paginatedProducts.forEach((product, index) => {
        const row = document.createElement('tr');
        const rowNumber = startIndex + index + 1;
        
        // Xử lý hình ảnh - lấy hình đầu tiên hoặc placeholder
        let imageUrl = 'https://via.placeholder.com/80x80?text=No+Image';
        if (product.images && product.images.length > 0) {
            // Loại bỏ các ký tự không hợp lệ trong URL hình ảnh
            imageUrl = product.images[0].replace(/[\[\]"]/g, '');
        }

        // Xử lý category
        const categoryName = product.category ? product.category.name : 'Không có';

        // Format giá
        const formattedPrice = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(product.price);

        // Mô tả ngắn gọn
        const shortDescription = product.description 
            ? (product.description.length > 100 
                ? product.description.substring(0, 100) + '...' 
                : product.description)
            : 'Không có mô tả';

        row.innerHTML = `
            <td class="text-center">
                <span class="row-number">${rowNumber}</span>
            </td>
            <td class="text-center">
                <img src="${imageUrl}" 
                     alt="${product.title}" 
                     class="product-image"
                     onerror="this.src='https://via.placeholder.com/80x80?text=Error'">
            </td>
            <td>
                <p class="product-title">${product.title}</p>
            </td>
            <td>
                <span class="category-badge">${categoryName}</span>
            </td>
            <td class="text-end">
                <span class="product-price">${formattedPrice}</span>
            </td>
            <td>
                <p class="product-description">${shortDescription}</p>
            </td>
        `;

        productsTableBody.appendChild(row);
    });

    // Render phân trang
    renderPagination(products.length);
}

/**
 * Render phân trang
 * @param {number} totalItems - Tổng số sản phẩm
 */
function renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // Cập nhật thông tin phân trang
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    paginationInfo.textContent = `Hiển thị ${startItem} - ${endItem} trong tổng số ${totalItems} sản phẩm`;

    // Xóa pagination cũ
    paginationList.innerHTML = '';

    // Nút Previous
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `
        <a class="page-link" href="#" aria-label="Previous">
            <i class="bi bi-chevron-left"></i>
        </a>
    `;
    prevLi.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            renderProductsTable(filteredProducts);
        }
    });
    paginationList.appendChild(prevLi);

    // Tính toán các trang cần hiển thị
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    // Điều chỉnh để luôn hiển thị 5 trang nếu có thể
    if (endPage - startPage < 4) {
        if (startPage === 1) {
            endPage = Math.min(5, totalPages);
        } else if (endPage === totalPages) {
            startPage = Math.max(1, totalPages - 4);
        }
    }

    // Hiển thị trang đầu nếu cần
    if (startPage > 1) {
        const firstLi = document.createElement('li');
        firstLi.className = 'page-item';
        firstLi.innerHTML = `<a class="page-link" href="#">1</a>`;
        firstLi.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = 1;
            renderProductsTable(filteredProducts);
        });
        paginationList.appendChild(firstLi);

        if (startPage > 2) {
            const dotsLi = document.createElement('li');
            dotsLi.className = 'page-item disabled';
            dotsLi.innerHTML = `<span class="page-link">...</span>`;
            paginationList.appendChild(dotsLi);
        }
    }

    // Các nút số trang
    for (let i = startPage; i <= endPage; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        pageLi.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = i;
            renderProductsTable(filteredProducts);
        });
        paginationList.appendChild(pageLi);
    }

    // Hiển thị trang cuối nếu cần
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const dotsLi = document.createElement('li');
            dotsLi.className = 'page-item disabled';
            dotsLi.innerHTML = `<span class="page-link">...</span>`;
            paginationList.appendChild(dotsLi);
        }

        const lastLi = document.createElement('li');
        lastLi.className = 'page-item';
        lastLi.innerHTML = `<a class="page-link" href="#">${totalPages}</a>`;
        lastLi.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = totalPages;
            renderProductsTable(filteredProducts);
        });
        paginationList.appendChild(lastLi);
    }

    // Nút Next
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `
        <a class="page-link" href="#" aria-label="Next">
            <i class="bi bi-chevron-right"></i>
        </a>
    `;
    nextLi.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
            currentPage++;
            renderProductsTable(filteredProducts);
        }
    });
    paginationList.appendChild(nextLi);
}

// ========================================
// FILTER & SORT FUNCTIONS
// ========================================

/**
 * Tìm kiếm sản phẩm theo title
 * @param {string} searchTerm - Từ khóa tìm kiếm
 */
function searchProducts(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    
    if (term === '') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product => 
            product.title.toLowerCase().includes(term)
        );
    }

    // Áp dụng sắp xếp nếu có
    if (currentSort) {
        applySorting(currentSort);
    }

    // Reset về trang 1 khi tìm kiếm
    currentPage = 1;
    renderProductsTable(filteredProducts);
}

/**
 * Áp dụng sắp xếp cho danh sách sản phẩm
 * @param {string} sortType - Loại sắp xếp
 */
function applySorting(sortType) {
    currentSort = sortType;

    switch (sortType) {
        case 'price-asc':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name-asc':
            filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'name-desc':
            filteredProducts.sort((a, b) => b.title.localeCompare(a.title));
            break;
        default:
            break;
    }

    // Cập nhật trạng thái active của nút
    updateSortButtonsState(sortType);
    renderProductsTable(filteredProducts);
}

/**
 * Cập nhật trạng thái active của các nút sắp xếp
 * @param {string} activeSort - Loại sắp xếp đang active
 */
function updateSortButtonsState(activeSort) {
    // Remove active class from all buttons
    sortPriceAsc.classList.remove('active');
    sortPriceDesc.classList.remove('active');
    sortNameAsc.classList.remove('active');
    sortNameDesc.classList.remove('active');

    // Add active class to current button
    switch (activeSort) {
        case 'price-asc':
            sortPriceAsc.classList.add('active');
            break;
        case 'price-desc':
            sortPriceDesc.classList.add('active');
            break;
        case 'name-asc':
            sortNameAsc.classList.add('active');
            break;
        case 'name-desc':
            sortNameDesc.classList.add('active');
            break;
    }
}

/**
 * Reset sắp xếp về mặc định
 */
function resetSorting() {
    currentSort = null;
    searchProducts(searchInput.value);
    updateSortButtonsState(null);
}

// ========================================
// EVENT LISTENERS
// ========================================

// Tìm kiếm - onChange
searchInput.addEventListener('input', (e) => {
    searchProducts(e.target.value);
});

// Thay đổi số sản phẩm mỗi trang
itemsPerPageSelect.addEventListener('change', (e) => {
    itemsPerPage = parseInt(e.target.value);
    currentPage = 1;
    renderProductsTable(filteredProducts);
});

// Sắp xếp theo giá tăng
sortPriceAsc.addEventListener('click', () => {
    applySorting('price-asc');
});

// Sắp xếp theo giá giảm
sortPriceDesc.addEventListener('click', () => {
    applySorting('price-desc');
});

// Sắp xếp theo tên A-Z
sortNameAsc.addEventListener('click', () => {
    applySorting('name-asc');
});

// Sắp xếp theo tên Z-A
sortNameDesc.addEventListener('click', () => {
    applySorting('name-desc');
});

// Reset sắp xếp
resetSort.addEventListener('click', () => {
    resetSorting();
});

// ========================================
// INITIALIZATION
// ========================================

/**
 * Khởi tạo ứng dụng
 */
async function initApp() {
    try {
        // Hiển thị loading
        loadingSpinner.classList.remove('d-none');
        tableContainer.classList.add('d-none');
        paginationContainer.classList.add('d-none');

        // Lấy dữ liệu từ API
        allProducts = await getAllProducts();
        filteredProducts = [...allProducts];

        // Ẩn loading, hiển thị bảng
        loadingSpinner.classList.add('d-none');

        // Render bảng sản phẩm
        renderProductsTable(filteredProducts);

        console.log('Ứng dụng đã khởi tạo thành công!');
    } catch (error) {
        loadingSpinner.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.
                <br><small class="text-muted">${error.message}</small>
            </div>
        `;
        console.error('Lỗi khởi tạo ứng dụng:', error);
    }
}

// Khởi chạy ứng dụng khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', initApp);
