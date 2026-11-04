import { createMap } from './map.js';

let nodes = [];
let mapController = null;
let activeIndex = 0;
let activeLayers = new Set();
let filtersInitialized = false;
let slideshowTimer = null;
let storyObserver = null;

async function loadNodes() {
    const response = await fetch('assets/data/nodes.json');
    if (!response.ok) throw new Error('Düğüm verileri yüklenemedi.');
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Düğüm verileri bir liste olmalı.');
    nodes = data;
}

function previousChapter() {
    if (nodes.length) selectChapter((activeIndex - 1 + nodes.length) % nodes.length);
}

function nextChapter() {
    if (nodes.length) selectChapter((activeIndex + 1) % nodes.length);
}

function toggleSlideshow() {
    const button = document.getElementById('slideshow-toggle');
    const icon = document.getElementById('slideshow-icon');
    if (!button || !icon || !nodes.length) return;

    const isPlaying = slideshowTimer !== null;
    if (isPlaying) {
        clearInterval(slideshowTimer);
        slideshowTimer = null;
    } else {
        slideshowTimer = window.setInterval(nextChapter, 4000);
    }

    const label = isPlaying ? 'Slayt gösterisini başlat' : 'Slayt gösterisini duraklat';
    button.title = label;
    button.setAttribute('aria-label', label);
    button.setAttribute('aria-pressed', String(!isPlaying));
    icon.className = isPlaying ? 'fa-solid fa-play' : 'fa-solid fa-pause';
}

function renderCategoryFilters() {
    const filterBar = document.getElementById('category-filters');
    const layers = [...new Set(nodes.map((node) => node.layer || 'Diğer'))];
    if (!filtersInitialized) {
        activeLayers = new Set(layers);
        filtersInitialized = true;
    }

    filterBar.innerHTML = layers.map((layer) => `
        <button type="button" class="category-filter ${activeLayers.has(layer) ? 'is-active' : ''}"
            aria-pressed="${activeLayers.has(layer)}" data-layer="${layer}">
            ${layer}
        </button>
    `).join('');

    filterBar.querySelectorAll('.category-filter').forEach((button) => {
        button.addEventListener('click', () => {
            const layer = button.dataset.layer;
            if (activeLayers.has(layer)) activeLayers.delete(layer);
            else activeLayers.add(layer);
            renderCategoryFilters();
            applyFilters();
        });
    });
}

function applyFilters() {
    const visibleNodes = nodes.filter((node) => activeLayers.has(node.layer || 'Diğer'));
    const visibleIds = visibleNodes.map((node) => node.id);
    mapController.setVisibleNodeIds(visibleIds);

    document.querySelectorAll('.chap-btn').forEach((button) => {
        const node = nodes[Number(button.dataset.index)];
        button.hidden = !node || !activeLayers.has(node.layer || 'Diğer');
    });

    if (visibleNodes.length && !activeLayers.has(nodes[activeIndex].layer || 'Diğer')) {
        selectChapter(nodes.indexOf(visibleNodes[0]));
    }
}

function renderChapterButtons() {
    const chapterBar = document.getElementById('chapter-bar');
    chapterBar.innerHTML = nodes.map((node, index) => `
        <button type="button" class="chap-btn px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition flex items-center gap-2 whitespace-nowrap"
            data-index="${index}" aria-current="false">
            <span class="w-4 h-4 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono flex items-center justify-center">${index + 1}</span>
            <span class="block text-left">${node.title.replace(/^\d+\.\s*/, '')}<small class="block text-[9px] text-slate-500">${node.location}</small></span>
        </button>
    `).join('');

    chapterBar.querySelectorAll('.chap-btn').forEach((button) => {
        button.addEventListener('click', () => selectChapter(Number(button.dataset.index)));
    });

    if (storyObserver) storyObserver.disconnect();
    storyObserver = new IntersectionObserver((entries) => {
        const visible = entries
            .filter((entry) => entry.isIntersecting && !entry.target.hidden)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) selectChapter(Number(visible.target.dataset.index));
    }, { root: chapterBar, threshold: [0.65, 0.85] });
    chapterBar.querySelectorAll('.chap-btn').forEach((button) => storyObserver.observe(button));
}

function selectChapter(index, coords = nodes[index]?.coords, locationLabel) {
    const node = nodes[index];
    if (!node) return;
    coords = coords || node.coords;
    activeIndex = index;

    document.querySelectorAll('.chap-btn').forEach((button) => {
        const selected = Number(button.dataset.index) === index;
        button.classList.toggle('is-current', selected);
        button.setAttribute('aria-current', String(selected));
    });
    mapController?.setActiveNode(node.id, coords);

    document.getElementById('detail-img').src = node.img;
    document.getElementById('detail-img').alt = `${node.mapLabel || node.name} konum görseli`;
    document.getElementById('detail-category').innerText = node.layer || node.category;
    document.getElementById('detail-coords').innerText = `${coords[1]}°, ${coords[0]}°`;
    document.getElementById('detail-location').innerText = locationLabel || node.location;
    document.getElementById('detail-title').innerText = node.title;
    document.getElementById('detail-desc').innerText = node.desc;
    const wikipediaLink = document.getElementById('detail-wikipedia');
    wikipediaLink.href = node.wikipediaUrl || '#';
    wikipediaLink.hidden = !node.wikipediaUrl;
    document.getElementById('metric-eco').innerText = node.eco;
    document.getElementById('metric-labor').innerText = node.labor;
    document.getElementById('detail-quote').innerText = `"${node.quote}"`;
}

function openImageLightbox() {
    const dialog = document.getElementById('image-lightbox');
    const image = document.getElementById('lightbox-img');
    const source = document.getElementById('detail-img');
    if (!dialog || !image || !source?.src) return;
    image.src = source.src;
    image.alt = source.alt;
    dialog.showModal();
}

function closeImageLightbox() {
    document.getElementById('image-lightbox')?.close();
}

function toggleProjection() {
    const isGlobe = mapController.toggleProjection();
    document.getElementById('proj-label').innerText = isGlobe ? 'Küre Görünümü' : 'Düz Projeksiyon';
}

async function initialize() {
    try {
        await loadNodes();
        renderCategoryFilters();
        renderChapterButtons();
        mapController = createMap(nodes, selectChapter);
        selectChapter(0);
        document.getElementById('image-lightbox').addEventListener('click', (event) => {
            if (event.target === event.currentTarget) closeImageLightbox();
        });
    } catch (error) {
        console.error(error);
        document.getElementById('chapter-bar').textContent = error.message;
    }
}

window.previousChapter = previousChapter;
window.nextChapter = nextChapter;
window.toggleSlideshow = toggleSlideshow;
window.openImageLightbox = openImageLightbox;
window.closeImageLightbox = closeImageLightbox;
window.toggleProjection = toggleProjection;
window.resetZoom = () => mapController?.resetZoom();
window.addEventListener('resize', () => mapController?.resize());

initialize();
