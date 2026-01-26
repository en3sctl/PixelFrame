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

// Geometry - Wireframe Icosahedrons
const geometry = new THREE.IcosahedronGeometry(1, 1)
const material = new THREE.MeshBasicMaterial({ 
    color: 0x333333, 
    wireframe: true,
    transparent: true,
    opacity: 0.3
})

const accentMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xFF5733, 
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

// Mouse interaction
let mouseX = 0, mouseY = 0
document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 0.5
    mouseY = (e.clientY / window.innerHeight - 0.5) * 0.5
})

// Animation loop
function animate() {
    requestAnimationFrame(animate)
    
    group.rotation.y += 0.001
    group.rotation.x = mouseY * 0.3
    group.rotation.y += mouseX * 0.01
    
    particles.forEach(p => {
        p.mesh.rotation.x += p.rotSpeed
        p.mesh.rotation.y += p.rotSpeed
    })
    
    renderer.render(scene, camera)
}
animate()

// Resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
})

// ===== Preloader Animation =====
const preloader = document.getElementById('preloader')

gsap.timeline()
    .to({}, { duration: 2 }) // Wait for loader bar animation
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
    .from('.btn-primary', {
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out'
    }, '-=0.3')

// ===== Carousel Functionality =====
document.querySelectorAll('.carousel').forEach(carousel => {
    const slides = carousel.querySelectorAll('.carousel-slide')
    const prevBtn = carousel.querySelector('.carousel-btn.prev')
    const nextBtn = carousel.querySelector('.carousel-btn.next')
    const dotsContainer = carousel.querySelector('.carousel-dots')
    let currentIndex = 0
    
    // Create dots
    slides.forEach((_, i) => {
        const dot = document.createElement('span')
        dot.className = `carousel-dot ${i === 0 ? 'active' : ''}`
        dot.addEventListener('click', () => goToSlide(i))
        dotsContainer.appendChild(dot)
    })
    
    const dots = dotsContainer.querySelectorAll('.carousel-dot')
    
    function goToSlide(index) {
        slides[currentIndex].classList.remove('active')
        dots[currentIndex].classList.remove('active')
        currentIndex = (index + slides.length) % slides.length
        slides[currentIndex].classList.add('active')
        dots[currentIndex].classList.add('active')
    }
    
    prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1))
    nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1))
    
    // Auto-advance every 4 seconds
    setInterval(() => goToSlide(currentIndex + 1), 4000)
})
