// ===== API Configuration =====
const API_BASE = '/api';

// ===== Token Management =====
const TokenManager = {
  getAccessToken() {
    return localStorage.getItem('accessToken');
  },
  
  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  },
  
  setTokens(accessToken, refreshToken) {
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  },
  
  clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
  
  isLoggedIn() {
    return !!this.getAccessToken();
  }
};

// ===== API Helper =====
const api = {
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = options.headers || {};
    
    // Add auth header if token exists
    const token = TokenManager.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Don't set Content-Type for FormData
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    // Handle token expiration
    if (response.status === 401) {
      const data = await response.json();
      
      if (data.code === 'TOKEN_EXPIRED') {
        // Try to refresh token
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry original request
          headers['Authorization'] = `Bearer ${TokenManager.getAccessToken()}`;
          return fetch(url, { ...options, headers });
        }
      }
      
      // Redirect to login
      TokenManager.clearTokens();
      window.location.href = '/admin/login.html';
      return null;
    }
    
    return response;
  },
  
  async refreshToken() {
    try {
      const refreshToken = TokenManager.getRefreshToken();
      if (!refreshToken) return false;
      
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      
      if (!response.ok) return false;
      
      const data = await response.json();
      TokenManager.setTokens(data.data.accessToken);
      return true;
    } catch {
      return false;
    }
  },
  
  async get(endpoint) {
    const response = await this.request(endpoint);
    return response ? response.json() : null;
  },
  
  async post(endpoint, body) {
    const options = {
      method: 'POST'
    };
    
    if (body instanceof FormData) {
      options.body = body;
    } else {
      options.body = JSON.stringify(body);
    }
    
    const response = await this.request(endpoint, options);
    return response ? response.json() : null;
  },
  
  async put(endpoint, body) {
    const options = {
      method: 'PUT'
    };
    
    if (body instanceof FormData) {
      options.body = body;
    } else {
      options.body = JSON.stringify(body);
    }
    
    const response = await this.request(endpoint, options);
    return response ? response.json() : null;
  },
  
  async delete(endpoint) {
    const response = await this.request(endpoint, { method: 'DELETE' });
    return response ? response.json() : null;
  }
};

// ===== Toast Notifications =====
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ===== Check if on Login Page =====
const isLoginPage = window.location.pathname.includes('login');

// ===== Login Page Logic =====
if (isLoginPage) {
  // Redirect if already logged in
  if (TokenManager.isLoggedIn()) {
    window.location.href = '/admin/';
  }
  
  const loginForm = document.getElementById('loginForm');
  const errorMessage = document.getElementById('errorMessage');
  const togglePassword = document.querySelector('.toggle-password');
  const passwordInput = document.getElementById('password');
  
  // Toggle password visibility
  if (togglePassword) {
    togglePassword.addEventListener('click', () => {
      const type = passwordInput.type === 'password' ? 'text' : 'password';
      passwordInput.type = type;
      
      const eyeOpen = togglePassword.querySelector('.eye-open');
      const eyeClosed = togglePassword.querySelector('.eye-closed');
      
      if (type === 'text') {
        eyeOpen.style.display = 'none';
        eyeClosed.style.display = 'block';
      } else {
        eyeOpen.style.display = 'block';
        eyeClosed.style.display = 'none';
      }
    });
  }
  
  // Login form submit
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = document.getElementById('loginBtn');
      const btnText = submitBtn.querySelector('.btn-text');
      const btnLoading = submitBtn.querySelector('.btn-loading');
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      // Show loading
      submitBtn.disabled = true;
      btnText.style.display = 'none';
      btnLoading.style.display = 'flex';
      errorMessage.style.display = 'none';
      
      try {
        const response = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
          TokenManager.setTokens(data.data.accessToken, data.data.refreshToken);
          window.location.href = '/admin/';
        } else {
          errorMessage.textContent = data.message || 'Giriş başarısız';
          errorMessage.style.display = 'block';
        }
      } catch (error) {
        errorMessage.textContent = 'Bağlantı hatası. Lütfen tekrar deneyin.';
        errorMessage.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
      }
    });
  }
}

// ===== Dashboard Logic =====
if (!isLoginPage) {
  // Redirect if not logged in
  if (!TokenManager.isLoggedIn()) {
    window.location.href = '/admin/login.html';
  }
  
  // State
  let products = [];
  let editingProduct = null;
  let imagesToRemove = [];
  let newImageFiles = [];
  let nextUploadId = 0;
  
  // DOM Elements
  const productsGrid = document.getElementById('productsGrid');
  const loadingState = document.getElementById('loadingState');
  const emptyState = document.getElementById('emptyState');
  const productModal = document.getElementById('productModal');
  const deleteModal = document.getElementById('deleteModal');
  const productForm = document.getElementById('productForm');

  function getCurrentExistingImageCount() {
    return document.querySelectorAll('#existingImages .existing-image').length;
  }

  function getTotalImageCount() {
    return getCurrentExistingImageCount() + newImageFiles.length;
  }

  function getRemainingImageSlots() {
    return Math.max(0, 10 - getTotalImageCount());
  }

  function updateImageCounter() {
    const imageCountInfo = document.getElementById('imageCountInfo');
    const uploadArea = document.getElementById('imageUploadArea');
    const slots = getRemainingImageSlots();

    if (imageCountInfo) {
      imageCountInfo.textContent = String(getTotalImageCount());
    }

    if (uploadArea) {
      uploadArea.classList.toggle('disabled', slots <= 0);
    }
  }

  function resetUploadState() {
    imagesToRemove = [];
    newImageFiles = [];
    nextUploadId = 0;

    const existingImages = document.getElementById('existingImages');
    const newImagePreviews = document.getElementById('newImagePreviews');
    const imageInput = document.getElementById('imageInput');

    if (existingImages) existingImages.innerHTML = '';
    if (newImagePreviews) newImagePreviews.innerHTML = '';
    if (imageInput) imageInput.value = '';

    updateImageCounter();
  }

  function appendImagePreview(item) {
    const previewsContainer = document.getElementById('newImagePreviews');
    if (!previewsContainer) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const preview = document.createElement('div');
      preview.className = 'image-preview';
      preview.dataset.uploadId = String(item.id);
      preview.innerHTML = `
        <img src="${event.target.result}" alt="">
        <button type="button" class="remove-preview" onclick="removeNewImage(${item.id})">&times;</button>
      `;
      previewsContainer.appendChild(preview);
    };
    reader.readAsDataURL(item.file);
  }
  
  // ===== Load Products =====
  async function loadProducts() {
    loadingState.style.display = 'flex';
    emptyState.style.display = 'none';
    productsGrid.style.display = 'none';
    
    try {
      const data = await api.get('/products/admin/all');
      
      if (data && data.success) {
        products = data.data;
        renderProducts();
      } else {
        showToast('Ürünler yüklenirken hata oluştu', 'error');
      }
    } catch (error) {
      showToast('Bağlantı hatası', 'error');
    } finally {
      loadingState.style.display = 'none';
    }
  }
  
  // ===== Render Products =====
  function renderProducts() {
    if (products.length === 0) {
      emptyState.style.display = 'flex';
      productsGrid.style.display = 'none';
      return;
    }
    
    emptyState.style.display = 'none';
    productsGrid.style.display = 'grid';
    
    productsGrid.innerHTML = products.map(product => `
      <article class="admin-product-card ${product.isActive ? '' : 'inactive'}">
        <div class="admin-product-image">
          ${product.images && product.images.length > 0 
            ? `<img src="${product.images[0].url}" alt="${product.name}">`
            : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#555;">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </div>`
          }
          <div class="product-badges">
            ${product.featured ? '<span class="badge badge-featured">Öne Çıkan</span>' : ''}
            ${!product.isActive ? '<span class="badge badge-inactive">Pasif</span>' : ''}
          </div>
        </div>
        <div class="admin-product-info">
          <h3>${escapeHtml(product.name)}</h3>
          <span class="category">${escapeHtml(product.category)}</span>
          <p class="image-count">${product.images ? product.images.length : 0} görsel</p>
        </div>
        <div class="admin-product-actions">
          <button class="btn-edit" onclick="editProduct('${product._id}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Düzenle
          </button>
          <button class="btn-delete" onclick="confirmDelete('${product._id}', '${escapeHtml(product.name)}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Sil
          </button>
        </div>
      </article>
    `).join('');
  }
  
  // ===== Escape HTML =====
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // ===== Open Modal =====
  function openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  // ===== Add Product =====
  window.openAddModal = function() {
    editingProduct = null;
    resetUploadState();
    
    document.getElementById('modalTitle').textContent = 'Yeni Ürün';
    productForm.reset();
    document.getElementById('productId').value = '';
    document.getElementById('productActive').checked = true;
    document.getElementById('descCharCount').textContent = '0';
    updateImageCounter();
    
    openModal(productModal);
  };
  
  // ===== Edit Product =====
  window.editProduct = function(id) {
    const product = products.find(p => p._id === id);
    if (!product) return;
    
    editingProduct = product;
    resetUploadState();
    
    document.getElementById('modalTitle').textContent = 'Ürünü Düzenle';
    document.getElementById('productId').value = product._id;
    document.getElementById('productName').value = product.name;
    const categorySelect = document.getElementById('productCategory');
    categorySelect.value = product.category;
    // If the category doesn't match any option (e.g. old data), add it dynamically
    if (categorySelect.value !== product.category) {
      const opt = document.createElement('option');
      opt.value = product.category;
      opt.textContent = product.category;
      categorySelect.appendChild(opt);
      categorySelect.value = product.category;
    }
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productOrder').value = product.order || 0;
    document.getElementById('productFeatured').checked = product.featured;
    document.getElementById('productActive').checked = product.isActive;
    document.getElementById('descCharCount').textContent = (product.description || '').length;
    
    // Render existing images
    const existingImagesContainer = document.getElementById('existingImages');
    existingImagesContainer.innerHTML = (product.images || []).map(img => `
      <div class="existing-image" data-public-id="${img.publicId}">
        <img src="${img.url}" alt="">
        <button type="button" class="remove-image" onclick="markImageForRemoval('${img.publicId}')">&times;</button>
      </div>
    `).join('');
    updateImageCounter();
    
    openModal(productModal);
  };
  
  // ===== Mark Image for Removal =====
  window.markImageForRemoval = function(publicId) {
    if (!imagesToRemove.includes(publicId)) {
      imagesToRemove.push(publicId);
    }

    const imageEl = document.querySelector(`[data-public-id="${publicId}"]`);
    if (imageEl) imageEl.remove();
    updateImageCounter();
  };
  
  // ===== Confirm Delete =====
  window.confirmDelete = function(id, name) {
    document.getElementById('deleteProductName').textContent = name;
    deleteModal.dataset.productId = id;
    openModal(deleteModal);
  };
  
  // ===== Delete Product =====
  async function deleteProduct(id) {
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const btnText = confirmBtn.querySelector('.btn-text');
    const btnLoading = confirmBtn.querySelector('.btn-loading');
    
    confirmBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'flex';
    
    try {
      const data = await api.delete(`/products/${id}`);
      
      if (data && data.success) {
        showToast('Ürün başarıyla silindi');
        closeModal(deleteModal);
        loadProducts();
      } else {
        showToast(data?.message || 'Silme işlemi başarısız', 'error');
      }
    } catch (error) {
      showToast('Bağlantı hatası', 'error');
    } finally {
      confirmBtn.disabled = false;
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
    }
  }
  
  // ===== Save Product =====
  async function saveProduct(e) {
    e.preventDefault();
    
    const saveBtn = document.getElementById('saveBtn');
    const btnText = saveBtn.querySelector('.btn-text');
    const btnLoading = saveBtn.querySelector('.btn-loading');
    const formError = document.getElementById('formError');
    
    const formData = new FormData();
    formData.append('name', document.getElementById('productName').value);
    formData.append('category', document.getElementById('productCategory').value);
    formData.append('description', document.getElementById('productDescription').value);
    formData.append('order', document.getElementById('productOrder').value);
    formData.append('featured', document.getElementById('productFeatured').checked);
    formData.append('isActive', document.getElementById('productActive').checked);
    
    // Add images to remove (for edit)
    if (imagesToRemove.length > 0) {
      formData.append('removeImages', JSON.stringify(imagesToRemove));
    }
    
    // Add new images
    newImageFiles.forEach(item => {
      formData.append('images', item.file);
    });
    
    saveBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'flex';
    formError.style.display = 'none';
    
    try {
      const productId = document.getElementById('productId').value;
      let data;
      
      if (productId) {
        data = await api.put(`/products/${productId}`, formData);
      } else {
        data = await api.post('/products', formData);
      }
      
      if (data && data.success) {
        showToast(productId ? 'Ürün güncellendi' : 'Ürün oluşturuldu');
        closeModal(productModal);
        loadProducts();
      } else {
        formError.textContent = data?.message || 'İşlem başarısız';
        formError.style.display = 'block';
      }
    } catch (error) {
      formError.textContent = 'Bağlantı hatası';
      formError.style.display = 'block';
    } finally {
      saveBtn.disabled = false;
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
    }
  }
  
  // ===== Page Navigation =====
  function switchPage(page) {
    // Toggle sidebar active
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    // Toggle page visibility
    const productsSection = document.querySelector('.products-container');
    const analyticsSection = document.getElementById('analyticsPage');
    const pageTitle = document.querySelector('.page-title');
    const addBtn = document.getElementById('addProductBtn');

    if (page === 'analytics') {
      productsSection.style.display = 'none';
      analyticsSection.style.display = 'block';
      pageTitle.textContent = 'İstatistikler';
      addBtn.style.display = 'none';
      loadAnalytics();
    } else {
      productsSection.style.display = '';
      analyticsSection.style.display = 'none';
      pageTitle.textContent = 'Ürünler';
      addBtn.style.display = '';
    }
  }

  // ===== Analytics =====
  async function loadAnalytics() {
    try {
      const data = await api.get('/analytics/summary');
      if (data && data.success) {
        renderAnalytics(data.data);
      } else {
        showToast('İstatistikler yüklenemedi', 'error');
      }
    } catch {
      showToast('Bağlantı hatası', 'error');
    }
  }

  function renderAnalytics(data) {
    const { overview, topPages, topReferrers, dailyStats, recentClicks } = data;

    // Overview cards
    document.getElementById('statTodayViews').textContent = overview.today.views;
    document.getElementById('statTodayUnique').textContent = overview.today.unique;
    document.getElementById('statWeekViews').textContent = overview.week.views;
    document.getElementById('statWeekUnique').textContent = overview.week.unique;
    document.getElementById('statMonthViews').textContent = overview.month.views;
    document.getElementById('statMonthUnique').textContent = overview.month.unique;
    document.getElementById('statTotalViews').textContent = overview.total.views;
    document.getElementById('statTotalUnique').textContent = overview.total.unique;

    // Daily chart
    const chartContainer = document.getElementById('dailyChart');
    if (dailyStats.length === 0) {
      chartContainer.innerHTML = '<div class="analytics-empty">Henüz veri yok</div>';
    } else {
      const maxViews = Math.max(...dailyStats.map(d => d.views), 1);
      chartContainer.innerHTML = dailyStats.map(day => {
        const heightPercent = (day.views / maxViews) * 100;
        const dateLabel = day._id.slice(5); // MM-DD
        return `
          <div class="chart-bar-wrap">
            <div class="chart-bar-tooltip">${day._id}<br>${day.views} görüntülenme, ${day.unique} tekil</div>
            <div class="chart-bar" style="height: ${Math.max(heightPercent, 2)}%"></div>
            <span class="chart-date">${dateLabel}</span>
          </div>
        `;
      }).join('');
    }

    // Top pages
    const topPagesEl = document.getElementById('topPagesList');
    if (topPages.length === 0) {
      topPagesEl.innerHTML = '<div class="analytics-empty">Henüz veri yok</div>';
    } else {
      topPagesEl.innerHTML = topPages.map(p => `
        <div class="analytics-list-item">
          <span class="item-label">${escapeHtml(formatPageName(p._id))}</span>
          <span class="item-count">${p.count} görüntülenme</span>
        </div>
      `).join('');
    }

    // Top referrers
    const topRefEl = document.getElementById('topReferrersList');
    if (topReferrers.length === 0) {
      topRefEl.innerHTML = '<div class="analytics-empty">Henüz veri yok</div>';
    } else {
      topRefEl.innerHTML = topReferrers.map(r => `
        <div class="analytics-list-item">
          <span class="item-label">${escapeHtml(r._id)}</span>
          <span class="item-count">${r.count}</span>
        </div>
      `).join('');
    }

    // Recent clicks
    const clicksEl = document.getElementById('recentClicksList');
    if (recentClicks.length === 0) {
      clicksEl.innerHTML = '<div class="analytics-empty">Henüz tıklama yok</div>';
    } else {
      clicksEl.innerHTML = recentClicks.map(c => {
        const time = new Date(c.createdAt).toLocaleString('tr-TR');
        return `
          <div class="analytics-list-item">
            <span class="item-label">${escapeHtml(c.target || c.page)}</span>
            <span class="item-time">${time}</span>
          </div>
        `;
      }).join('');
    }
  }

  function formatPageName(path) {
    if (path === '/') return 'Ana Sayfa';
    if (path.startsWith('/koleksiyon/')) {
      const parts = path.replace('/koleksiyon/', '').split('/');
      return parts.map(p => decodeURIComponent(p)).join(' / ');
    }
    return path;
  }

  // ===== Event Listeners =====
  document.addEventListener('DOMContentLoaded', () => {
    loadProducts();

    // Sidebar page navigation
    document.querySelectorAll('.sidebar-nav .nav-item[data-page]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        switchPage(item.dataset.page);
      });
    });

    // Add product buttons
    document.getElementById('addProductBtn')?.addEventListener('click', openAddModal);
    document.getElementById('addFirstProductBtn')?.addEventListener('click', openAddModal);
    
    // Modal close buttons
    document.getElementById('closeModal')?.addEventListener('click', () => closeModal(productModal));
    document.getElementById('cancelBtn')?.addEventListener('click', () => closeModal(productModal));
    document.getElementById('closeDeleteModal')?.addEventListener('click', () => closeModal(deleteModal));
    document.getElementById('cancelDeleteBtn')?.addEventListener('click', () => closeModal(deleteModal));
    
    // Modal backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', () => {
        closeModal(productModal);
        closeModal(deleteModal);
      });
    });
    
    // Delete confirm
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', () => {
      const id = deleteModal.dataset.productId;
      if (id) deleteProduct(id);
    });
    
    // Product form submit
    productForm?.addEventListener('submit', saveProduct);
    
    // Character count for description
    document.getElementById('productDescription')?.addEventListener('input', (e) => {
      document.getElementById('descCharCount').textContent = e.target.value.length;
    });
    
    // Image upload area
    const uploadArea = document.getElementById('imageUploadArea');
    const imageInput = document.getElementById('imageInput');
    
    uploadArea?.addEventListener('click', () => {
      if (uploadArea.classList.contains('disabled')) return;
      if (imageInput) imageInput.click();
    });
    
    uploadArea?.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });
    
    uploadArea?.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });
    
    uploadArea?.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      handleFiles(e.dataTransfer.files);
    });
    
    imageInput?.addEventListener('change', (e) => {
      handleFiles(e.target.files);
      e.target.value = '';
    });

    updateImageCounter();
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
      const refreshToken = TokenManager.getRefreshToken();
      await api.post('/auth/logout', { refreshToken });
      TokenManager.clearTokens();
      window.location.href = '/admin/login.html';
    });
    
    // Mobile menu
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.querySelector('.sidebar');
    
    mobileMenuBtn?.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  });
  
  // ===== Handle File Upload =====
  function handleFiles(files) {
    const selectedFiles = Array.from(files || []);
    if (selectedFiles.length === 0) return;

    const remainingSlots = getRemainingImageSlots();

    if (remainingSlots <= 0) {
      showToast('En fazla 10 görsel yükleyebilirsiniz', 'warning');
      updateImageCounter();
      return;
    }

    if (selectedFiles.length > remainingSlots) {
      showToast(`Sadece ${remainingSlots} görsel daha ekleyebilirsiniz`, 'warning');
    }

    selectedFiles.slice(0, remainingSlots).forEach(file => {
      if (!file.type.startsWith('image/')) {
        showToast('Sadece resim dosyaları yüklenebilir', 'error');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        showToast('Dosya boyutu 5MB\'dan küçük olmalı', 'error');
        return;
      }

      const imageItem = {
        id: ++nextUploadId,
        file
      };

      newImageFiles.push(imageItem);
      appendImagePreview(imageItem);
    });

    updateImageCounter();
  }
  
  // ===== Remove New Image Preview =====
  window.removeNewImage = function(uploadId) {
    newImageFiles = newImageFiles.filter(item => item.id !== uploadId);
    const preview = document.querySelector(`[data-upload-id="${uploadId}"]`);
    if (preview) preview.remove();
    updateImageCounter();
  };
}
