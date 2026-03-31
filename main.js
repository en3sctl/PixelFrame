import './style.css'
import * as THREE from 'three'
import gsap from 'gsap'

// ===== Three.js Scene =====
const container = document.getElementById('canvas-container')
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })

renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
container.appendChild(renderer.domElement)

const geometry = new THREE.IcosahedronGeometry(1, 1)
const material = new THREE.MeshBasicMaterial({
    color: 0x333333,
    wireframe: true,
    transparent: true,
    opacity: 0.3
})

const accentMaterial = new THREE.MeshBasicMaterial({
    color: 0xff5733,
    wireframe: true,
    transparent: true,
    opacity: 0.5
})

const group = new THREE.Group()
const particles = []

for (let i = 0; i < 15; i++) {
    const isAccent = Math.random() > 0.85
    const mesh = new THREE.Mesh(geometry, isAccent ? accentMaterial : material)

    mesh.position.set(
        (Math.random() - 0.5) * 25,
        (Math.random() - 0.5) * 25,
        (Math.random() - 0.5) * 15
    )

    const scale = Math.random() * 2 + 0.5
    mesh.scale.set(scale, scale, scale)
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)

    particles.push({
        mesh,
        rotSpeed: (Math.random() - 0.5) * 0.003
    })

    group.add(mesh)
}

scene.add(group)
camera.position.z = 8

let mouseX = 0
let mouseY = 0
document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth - 0.5) * 0.5
    mouseY = (event.clientY / window.innerHeight - 0.5) * 0.5
})

function animate() {
    requestAnimationFrame(animate)

    group.rotation.y += 0.001
    group.rotation.x = mouseY * 0.3
    group.rotation.y += mouseX * 0.01

    particles.forEach((particle) => {
        particle.mesh.rotation.x += particle.rotSpeed
        particle.mesh.rotation.y += particle.rotSpeed
    })

    renderer.render(scene, camera)
}
animate()

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
})

// ===== Preloader Animation =====
const preloader = document.getElementById('preloader')

gsap.timeline()
    .to({}, { duration: 0.4 })
    .to(preloader, {
        opacity: 0,
        duration: 0.5,
        onComplete: () => {
            preloader.style.display = 'none'
        }
    })
    .from('.hero-title .line', {
        y: 100,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out'
    }, '-=0.3')
    .from('.hero-subtitle', {
        y: 30,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out'
    }, '-=0.4')
    .from('.hero-social', {
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out'
    }, '-=0.3')
    .from('.btn-primary', {
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out'
    }, '-=0.3')

// ===== Catalog Rendering =====
const productGrid = document.getElementById('productGrid')
const catalogNav = document.getElementById('catalogNav')
const catalogTitle = document.getElementById('catalogTitle')
const catalogDesc = document.getElementById('catalogDesc')
const productDetail = document.getElementById('productDetail')
const moreComing = document.getElementById('moreComing')
const productsSection = document.getElementById('products')

const WHATSAPP_ORDER_URL = 'https://wa.me/48881730681'

// Koleksiyon vitrinleri — sadece kapak görseli olarak kullanılır, ürün olarak görünmez
const collectionDefinitions = [
    {
        name: 'Araç Aksesuarları',
        order: 0,
        coverImage: '/assets/qr/qr.jpg'
    },
    {
        name: 'Dekoratif',
        order: 1,
        coverImage: '/assets/knife/WhatsApp Image 2026-01-26 at 13.29.24 (1).jpeg'
    },
    {
        name: 'Cüzdan & Aksesuar',
        order: 2,
        coverImage: '/assets/wallet/WhatsApp Image 2026-01-26 at 13.29.24 (3).jpeg'
    },
    {
        name: 'Anahtarlık',
        order: 3,
        coverImage: '/assets/key/WhatsApp Image 2026-01-26 at 13.29.25 (3).jpeg'
    },
    {
        name: 'Uçak Maketleri',
        order: 4,
        coverImage: '/assets/planes/WhatsApp Image 2026-01-26 at 13.29.25 (1).jpeg'
    },
    {
        name: 'CS2 Koleksiyonu',
        order: 5,
        coverImage: '/assets/gameMaps/WhatsApp Image 2026-01-26 at 13.29.25 (5).jpeg'
    }
]

let products = []
let collections = new Map()

function slugify(text) {
    return String(text || '')
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
}

function escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
}

function normalizeProducts(list = []) {
    return list
        .map((item, index) => {
            const normalizedImages = Array.isArray(item.images)
                ? item.images
                        .map((image) => {
                            if (typeof image === 'string') {
                                return { url: image, publicId: '' }
                            }

                            if (image && image.url) {
                                return {
                                    url: image.url,
                                    publicId: image.publicId || ''
                                }
                            }

                            return null
                        })
                        .filter(Boolean)
                : []

            return {
                _id: item._id || item.id || `product-${index}`,
                name: (item.name || 'İsimsiz Ürün').trim(),
                category: (item.category || 'Genel').trim(),
                description: (item.description || '').trim(),
                featured: Boolean(item.featured),
                order: Number.isFinite(Number(item.order)) ? Number(item.order) : 0,
                images: normalizedImages,
                createdAt: item.createdAt || null
            }
        })
        .sort((a, b) => a.order - b.order)
}

function buildCollections(productList) {
    const map = new Map()

    // Create collections from definitions (vitrin) — always present
    collectionDefinitions.forEach((def) => {
        const slug = slugify(def.name)
        map.set(slug, {
            slug,
            name: def.name,
            order: def.order,
            coverImage: def.coverImage,
            products: []
        })
    })

    // Fill collections with actual products from API
    productList.forEach((item) => {
        const slug = slugify(item.category)

        if (!map.has(slug)) {
            map.set(slug, {
                slug,
                name: item.category,
                order: 999,
                coverImage: '',
                products: []
            })
        }

        map.get(slug).products.push(item)
    })

    map.forEach((collection) => {
        collection.products.sort((a, b) => a.order - b.order)
    })

    return map
}

function getRouteState() {
    const path = window.location.pathname
    const match = path.match(/^\/koleksiyon\/([^/]+)(?:\/(.+))?$/)
    if (match) {
        return {
            category: decodeURIComponent(match[1]),
            product: match[2] ? decodeURIComponent(match[2]) : ''
        }
    }
    return { category: '', product: '' }
}

function pushRoute(nextState, shouldScroll = true) {
    let nextUrl = '/'

    if (nextState.category && nextState.product) {
        nextUrl = `/koleksiyon/${encodeURIComponent(nextState.category)}/${encodeURIComponent(nextState.product)}`
    } else if (nextState.category) {
        nextUrl = `/koleksiyon/${encodeURIComponent(nextState.category)}`
    }

    window.history.pushState({}, '', nextUrl)
    renderCurrentRoute()
    trackPageView()

    if (shouldScroll && productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
}

function setSectionHeader(title, description) {
    if (catalogTitle) {
        catalogTitle.textContent = title
    }

    if (catalogDesc) {
        catalogDesc.textContent = description
    }
}

function getCollectionBySlug(slug) {
    return collections.get(slug) || null
}

function getCoverImage(product) {
    return product?.images?.[0]?.url || ''
}

function renderEmptyState(title, description) {
    if (!productGrid) return

    productGrid.innerHTML = `
        <article class="catalog-empty">
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(description)}</p>
        </article>
    `
}

let carouselIntervals = []

function stopCollectionCarousels() {
    carouselIntervals.forEach(id => clearInterval(id))
    carouselIntervals = []
}

function startCollectionCarousels() {
    stopCollectionCarousels()

    document.querySelectorAll('.collection-carousel').forEach((container, cardIndex) => {
        const images = JSON.parse(container.dataset.images || '[]')
        if (images.length <= 1) return

        const img = container.querySelector('img.carousel-active')
        const dots = container.querySelectorAll('.carousel-dot-mini')
        if (!img) return

        // Preload all images
        images.forEach(src => { const i = new Image(); i.src = src })

        let index = 0
        const delay = cardIndex * 1200

        // Create overlay image for crossfade
        const overlay = document.createElement('img')
        overlay.className = 'carousel-overlay'
        overlay.alt = img.alt
        container.appendChild(overlay)

        // Preload all
        images.forEach(src => { const i = new Image(); i.src = src })

        const timeoutId = setTimeout(() => {
            const intervalId = setInterval(() => {
                index = (index + 1) % images.length
                overlay.src = images[index]
                overlay.classList.add('visible')

                setTimeout(() => {
                    img.src = images[index]
                    overlay.classList.remove('visible')
                }, 800)

                dots.forEach((dot, i) => dot.classList.toggle('active', i === index))
            }, 4000)

            carouselIntervals.push(intervalId)
        }, delay)

        carouselIntervals.push(timeoutId)
    })
}

function renderCollectionsView(animateCards = true) {
    if (!productGrid || !catalogNav || !moreComing || !productDetail) return

    const sortedCollections = Array.from(collections.values())
        .sort((a, b) => a.order - b.order)

    setSectionHeader('Ürün Koleksiyonu', 'Koleksiyona tıkla, ürünleri keşfet')

    catalogNav.innerHTML = `
        <div class="catalog-meta-pill">${sortedCollections.length} kategori</div>
    `

    productDetail.hidden = true
    productDetail.innerHTML = ''
    productGrid.style.display = 'grid'

    if (sortedCollections.length === 0) {
        moreComing.style.display = 'none'
            renderEmptyState('Koleksiyon bulunamadı', 'Admin panelinden ürün ekleyerek listeyi doldurabilirsin.')
        return
    }

    moreComing.style.display = 'block'
    productGrid.innerHTML = sortedCollections.map((collection) => {
        const coverImage = collection.coverImage || ''
        const productCount = collection.products.length

        // Collect product images for carousel (cover + first image of each product)
        const carouselImages = [coverImage]
        collection.products.forEach(p => {
            const img = getCoverImage(p)
            if (img && !carouselImages.includes(img)) carouselImages.push(img)
        })

        return `
            <article class="product-card collection-card" data-action="open-collection" data-collection="${collection.slug}">
                <div class="product-image collection-carousel" data-images='${JSON.stringify(carouselImages)}'>
                    ${coverImage
                        ? `<img class="carousel-active" src="${coverImage}" alt="${escapeHtml(collection.name)}">`
                        : `<div class="no-image"><span>Görsel Yok</span></div>`
                    }
                    ${carouselImages.length > 1 ? `
                        <div class="carousel-dots-mini">
                            ${carouselImages.map((_, i) => `<span class="carousel-dot-mini ${i === 0 ? 'active' : ''}"></span>`).join('')}
                        </div>
                    ` : ''}
                    <span class="collection-chip">${productCount} ürün</span>
                </div>
                <div class="product-info">
                    <h3>${escapeHtml(collection.name)}</h3>
                    <span class="category">Koleksiyonu Aç</span>
                </div>
            </article>
        `
    }).join('')

    // Start auto-carousel for collection cards
    startCollectionCarousels()

    if (animateCards) {
        gsap.killTweensOf('.collection-card')
        gsap.fromTo('.collection-card',
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
        )
    }
}

function renderCategoryView(collection, animateCards = true) {
    stopCollectionCarousels()
    if (!productGrid || !catalogNav || !moreComing || !productDetail) return

    setSectionHeader(`${collection.name} Koleksiyonu`, `${collection.products.length} ürün seçeneği`)

    catalogNav.innerHTML = `
        <button class="catalog-nav-btn" data-action="show-collections">Tüm Koleksiyonlar</button>
        <span class="catalog-crumb">Koleksiyon / ${escapeHtml(collection.name)}</span>
    `

    moreComing.style.display = 'none'
    productDetail.hidden = true
    productDetail.innerHTML = ''
    productGrid.style.display = 'grid'

    if (collection.products.length === 0) {
            renderEmptyState('Bu koleksiyonda henüz ürün yok', 'Ürünler yakında eklenecek, takipte kalın!')
        return
    }

    productGrid.innerHTML = collection.products.map((item) => {
        const imageUrl = getCoverImage(item)

        return `
            <article class="product-card category-product-card ${item.featured ? 'featured' : ''}" data-action="open-product" data-collection="${collection.slug}" data-product-id="${item._id}">
                <div class="product-image">
                    ${imageUrl
                        ? `<img src="${imageUrl}" alt="${escapeHtml(item.name)}">`
                        : `<div class="no-image"><span>Görsel Yok</span></div>`
                    }
                    ${item.images.length > 1 ? `<span class="image-count-badge">${item.images.length} resim</span>` : ''}
                </div>
                <div class="product-info">
                    <h3>${escapeHtml(item.name)}</h3>
                    <span class="category">${escapeHtml(collection.name)}</span>
                </div>
            </article>
        `
    }).join('')

    if (animateCards) {
        gsap.killTweensOf('.category-product-card')
        gsap.fromTo('.category-product-card',
            { y: 32, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.45, stagger: 0.07, ease: 'power2.out' }
        )
    }
}

function renderRelatedProducts(currentItem, collection) {
    const related = (collection?.products || []).filter(p => p._id !== currentItem._id)
    if (related.length === 0) return ''

    return `
        <div class="related-products">
            <h4 class="related-title">${escapeHtml(collection.name)} Koleksiyonundan</h4>
            <div class="related-grid">
                ${related.map(p => {
                    const img = getCoverImage(p)
                    return `
                        <article class="related-card" data-action="open-product" data-collection="${collection.slug}" data-product-id="${p._id}">
                            <div class="related-image">
                                ${img
                                    ? `<img src="${img}" alt="${escapeHtml(p.name)}">`
                                    : `<div class="no-image"><span>Görsel Yok</span></div>`
                                }
                            </div>
                            <span class="related-name">${escapeHtml(p.name)}</span>
                        </article>
                    `
                }).join('')}
            </div>
        </div>
    `
}

function renderProductDetailView(item, collection) {
    if (!productGrid || !catalogNav || !moreComing || !productDetail) return

    const safeCollection = collection || {
        slug: slugify(item.category),
        name: item.category
    }

    const images = item.images || []
    const mainImage = images[0] || null

    setSectionHeader(item.name, safeCollection.name)

    catalogNav.innerHTML = `
        <div class="catalog-actions">
            <button class="catalog-nav-btn" data-action="show-category" data-collection="${safeCollection.slug}">${escapeHtml(safeCollection.name)} Koleksiyonu</button>
            <button class="catalog-nav-btn ghost" data-action="show-collections">Tüm Koleksiyonlar</button>
        </div>
        <span class="catalog-crumb">Ürün Detayı</span>
    `

    moreComing.style.display = 'none'
    productGrid.style.display = 'none'
    productDetail.hidden = false

    productDetail.innerHTML = `
        <article class="product-detail-card">
            <div class="detail-gallery">
                <div class="detail-main-image-wrap">
                    ${mainImage
                        ? `<img id="detailMainImage" class="detail-main-image" src="${mainImage.url}" alt="${escapeHtml(item.name)}" data-action="open-lightbox" style="cursor:zoom-in">`
                        : `<div class="detail-no-image">Detay görseli bulunamadı</div>`
                    }
                </div>
                ${images.length > 1
                    ? `<div class="detail-thumbs">
                            ${images.map((image, index) => `
                                <button type="button" class="detail-thumb ${index === 0 ? 'active' : ''}" data-action="select-detail-image" data-src="${image.url}">
                                    <img src="${image.url}" alt="${escapeHtml(item.name)} ${index + 1}">
                                </button>
                            `).join('')}
                        </div>`
                    : ''
                }
            </div>

            <div class="detail-content">
                <span class="detail-category">${escapeHtml(safeCollection.name)}</span>
                <h3 class="detail-title">${escapeHtml(item.name)}</h3>
                <p class="detail-description">
                    ${escapeHtml(item.description || 'Bu ürün için detay açıklaması yakında eklenecek.')}
                </p>
                <div class="detail-meta">
                    <span>${images.length} görsel</span>
                    ${item.featured ? '<span class="detail-featured">Öne Çıkan Ürün</span>' : ''}
                </div>
                <a class="btn-primary detail-cta" href="${WHATSAPP_ORDER_URL}" target="_blank" rel="noopener">WhatsApp ile Bilgi Al</a>
            </div>
        </article>
        ${renderRelatedProducts(item, safeCollection)}
    `

    // Store images for lightbox
    lightboxImages = images.map(img => img.url)
    lightboxIndex = 0
}

let lightboxImages = []
let lightboxIndex = 0

function selectDetailImage(button) {
    if (!productDetail) return

    const nextSrc = button.dataset.src
    const mainImage = productDetail.querySelector('#detailMainImage')

    if (!mainImage || !nextSrc) return

    mainImage.src = nextSrc

    productDetail.querySelectorAll('.detail-thumb').forEach((thumb) => {
        thumb.classList.remove('active')
    })
    button.classList.add('active')

    // Update lightbox index
    const idx = lightboxImages.indexOf(nextSrc)
    if (idx >= 0) lightboxIndex = idx
}

function openLightbox(index) {
    if (lightboxImages.length === 0) return
    lightboxIndex = index

    let lightbox = document.getElementById('lightbox')
    if (!lightbox) {
        lightbox = document.createElement('div')
        lightbox.id = 'lightbox'
        lightbox.innerHTML = `
            <div class="lightbox-backdrop"></div>
            <button class="lightbox-close">&times;</button>
            <button class="lightbox-prev">&#8249;</button>
            <button class="lightbox-next">&#8250;</button>
            <div class="lightbox-img-wrap">
                <img class="lightbox-img" src="" alt="">
            </div>
            <div class="lightbox-counter"></div>
        `
        document.body.appendChild(lightbox)

        lightbox.querySelector('.lightbox-backdrop').addEventListener('click', closeLightbox)
        lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox)
        lightbox.querySelector('.lightbox-prev').addEventListener('click', () => navigateLightbox(-1))
        lightbox.querySelector('.lightbox-next').addEventListener('click', () => navigateLightbox(1))
    }

    updateLightbox()
    lightbox.classList.add('active')
    document.body.style.overflow = 'hidden'
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox')
    if (lightbox) {
        lightbox.classList.remove('active')
        document.body.style.overflow = ''
    }
}

function navigateLightbox(dir) {
    lightboxIndex = (lightboxIndex + dir + lightboxImages.length) % lightboxImages.length
    updateLightbox()

    // Sync thumb selection in detail view
    const mainImage = productDetail?.querySelector('#detailMainImage')
    if (mainImage) {
        mainImage.src = lightboxImages[lightboxIndex]
        productDetail.querySelectorAll('.detail-thumb').forEach((thumb) => {
            thumb.classList.toggle('active', thumb.dataset.src === lightboxImages[lightboxIndex])
        })
    }
}

function updateLightbox() {
    const lightbox = document.getElementById('lightbox')
    if (!lightbox) return

    lightbox.querySelector('.lightbox-img').src = lightboxImages[lightboxIndex]
    lightbox.querySelector('.lightbox-counter').textContent = `${lightboxIndex + 1} / ${lightboxImages.length}`

    lightbox.querySelector('.lightbox-prev').style.display = lightboxImages.length > 1 ? '' : 'none'
    lightbox.querySelector('.lightbox-next').style.display = lightboxImages.length > 1 ? '' : 'none'
}

// Keyboard navigation for lightbox
document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('lightbox')
    if (!lightbox || !lightbox.classList.contains('active')) return

    if (e.key === 'Escape') closeLightbox()
    if (e.key === 'ArrowLeft') navigateLightbox(-1)
    if (e.key === 'ArrowRight') navigateLightbox(1)
})

function handleCatalogClick(event) {
    const trigger = event.target.closest('[data-action]')
    if (!trigger) return

    const action = trigger.dataset.action

    if (action === 'open-collection') {
        pushRoute({ category: trigger.dataset.collection })
        return
    }

    if (action === 'open-product') {
        pushRoute({
            category: trigger.dataset.collection,
            product: trigger.dataset.productId
        })
        return
    }

    if (action === 'show-collections') {
        pushRoute({}, false)
        return
    }

    if (action === 'show-category') {
        pushRoute({ category: trigger.dataset.collection })
        return
    }

    if (action === 'select-detail-image') {
        selectDetailImage(trigger)
        return
    }

    if (action === 'open-lightbox') {
        openLightbox(lightboxIndex)
    }
}

function renderCurrentRoute(animateCards = true) {
    const route = getRouteState()
    const targetCollection = route.category ? getCollectionBySlug(route.category) : null

    if (route.product) {
        const targetProduct = products.find((item) => item._id === route.product)

        if (targetProduct) {
            const productCollection = getCollectionBySlug(slugify(targetProduct.category))
            renderProductDetailView(targetProduct, targetCollection || productCollection)
            return
        }
    }

    if (targetCollection) {
        renderCategoryView(targetCollection, animateCards)
        return
    }

    renderCollectionsView(animateCards)
}

async function loadProductsFromApi() {
    try {
        const response = await fetch('/api/products')
        const data = await response.json()

        if (!response.ok || !data.success || !Array.isArray(data.data)) {
            return []
        }

        return data.data
    } catch {
        return null
    }
}

async function initializeCatalog() {
    if (!productGrid) return

    // Products come only from the API (admin panel)
    const apiProducts = await loadProductsFromApi()
    products = normalizeProducts(apiProducts || [])

    // Collections are built from definitions (vitrin) + API products fill them
    collections = buildCollections(products)

    renderCurrentRoute(false)
}

// ===== Analytics Tracking =====
const analyticsSessionId = sessionStorage.getItem('pf_sid') || (() => {
    const arr = new Uint8Array(16)
    crypto.getRandomValues(arr)
    const id = Array.from(arr, b => b.toString(16).padStart(2, '0')).join('')
    sessionStorage.setItem('pf_sid', id)
    return id
})()

function trackPageView() {
    fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'pageview',
            page: window.location.pathname + window.location.search,
            referrer: document.referrer,
            sessionId: analyticsSessionId
        })
    }).catch(() => {})
}

function trackClick(target) {
    fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'click',
            page: window.location.pathname,
            target,
            sessionId: analyticsSessionId
        })
    }).catch(() => {})
}

// Track outbound link clicks (WhatsApp, Instagram)
document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="https://wa.me"], a[href^="https://www.instagram"]')
    if (link) trackClick(link.href)
})

document.addEventListener('DOMContentLoaded', () => {
    initializeCatalog()
    productsSection?.addEventListener('click', handleCatalogClick)
    trackPageView()
})

window.addEventListener('popstate', () => {
    renderCurrentRoute(false)
    trackPageView()
})

