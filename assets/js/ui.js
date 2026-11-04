import { createMap } from './map.js';

let nodes = [];
let sources = new Map();
let mapController = null;
let activeIndex = 0;
let activeLayers = new Set();
let filtersInitialized = false;
let slideshowTimer = null;
let storyObserver = null;

async function loadNodes() {
    const [nodesResponse, sourcesResponse] = await Promise.all([
        fetch('assets/data/nodes.json'),
        fetch('assets/data/sources.json')
    ]);
    if (!nodesResponse.ok) throw new Error('Aşama verileri yüklenemedi.');
    if (!sourcesResponse.ok) throw new Error('Kaynak verileri yüklenemedi.');

    const [nodeData, sourceData] = await Promise.all([
        nodesResponse.json(),
        sourcesResponse.json()
    ]);
    if (!Array.isArray(nodeData)) throw new Error('Aşama verileri bir liste olmalı.');
    if (!Array.isArray(sourceData)) throw new Error('Kaynak verileri bir liste olmalı.');

    sources = new Map(sourceData.map((source) => [source.id, source]));
    for (const node of nodeData) {
        for (const sourceId of node.sourceIds || []) {
            if (!sources.has(sourceId)) {
                throw new Error(`Aşama kaynağı bulunamadı: ${sourceId}`);
            }
        }
    }
    nodes = nodeData;
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

function applyFilters() {
    const visibleNodes = nodes.filter((node) => activeLayers.has(node.layer || 'Diğer'));
    const visibleIds = visibleNodes.map((node) => node.id);
    mapController.setVisibleNodeIds(visibleIds);

    document.querySelectorAll('.category-filter').forEach((button) => {
        const active = activeLayers.has(button.dataset.layer);
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
    });

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
    const layers = [...new Set(nodes.map((node) => node.layer || 'Diğer'))];
    if (!filtersInitialized) {
        activeLayers = new Set(layers);
        filtersInitialized = true;
    }

    chapterBar.replaceChildren();
    nodes.forEach((node, index) => {
        const row = document.createElement('div');
        row.className = 'flex min-w-0 items-center gap-2';

        const chapterButton = document.createElement('button');
        chapterButton.type = 'button';
        chapterButton.className = 'chap-btn min-w-0 flex-1 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition flex items-center gap-2 text-left';
        chapterButton.dataset.index = index;
        chapterButton.setAttribute('aria-current', 'false');

        const number = document.createElement('span');
        number.className = 'w-5 h-5 shrink-0 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono flex items-center justify-center';
        number.textContent = String(index + 1);

        const label = document.createElement('span');
        label.className = 'min-w-0 flex-1 truncate';
        label.textContent = node.title;
        const location = document.createElement('small');
        location.className = 'block truncate text-[9px] text-slate-500';
        location.textContent = node.location;
        label.append(location);

        chapterButton.append(number, label);
        chapterButton.addEventListener('click', () => selectChapter(Number(chapterButton.dataset.index)));

        const layer = node.layer || 'Diğer';
        const filterButton = document.createElement('button');
        filterButton.type = 'button';
        filterButton.className = `category-filter shrink-0 ${activeLayers.has(layer) ? 'is-active' : ''}`;
        filterButton.dataset.layer = layer;
        filterButton.textContent = layer;
        filterButton.title = `${layer} katmanını filtrele`;
        filterButton.setAttribute('aria-label', `${layer} katmanını göster veya gizle`);
        filterButton.setAttribute('aria-pressed', String(activeLayers.has(layer)));
        filterButton.addEventListener('click', () => {
            if (activeLayers.has(layer)) activeLayers.delete(layer);
            else activeLayers.add(layer);
            applyFilters();
        });

        row.append(chapterButton, filterButton);
        chapterBar.append(row);
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
    document.getElementById('detail-img').alt = node.imageAlt || `${node.mapLabel || node.name} konum görseli`;
    const imageCredit = node.imageCredit;
    document.getElementById('detail-image-credit').hidden = !imageCredit;
    if (imageCredit) {
        const sourceLink = document.getElementById('detail-image-source');
        sourceLink.href = imageCredit.sourceUrl;
        sourceLink.textContent = imageCredit.label;
        const licenseLink = document.getElementById('detail-image-license');
        licenseLink.href = imageCredit.licenseUrl;
        licenseLink.textContent = imageCredit.licenseLabel;
    }
    document.getElementById('detail-category').innerText = node.layer || node.category;
    document.getElementById('detail-coords').innerText = `${coords[1]}°, ${coords[0]}°`;
    document.getElementById('detail-location').innerText = locationLabel || node.location;
    document.getElementById('detail-title').innerText = node.title;
    document.getElementById('detail-desc').innerText = node.desc;
    const sourceList = document.getElementById('detail-sources-list');
    const sourceSection = document.getElementById('detail-sources');
    sourceList.replaceChildren();
    (node.sourceIds || []).forEach((sourceId) => {
        const source = sources.get(sourceId);
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = source.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'break-words text-cyan-400 hover:text-cyan-300';
        link.textContent = `${source.author} (${source.year}) · ${source.type} — ${source.title}`;
        item.append(link);
        sourceList.append(item);
    });
    sourceSection.hidden = !sourceList.childElementCount;
    const wikipediaLink = document.getElementById('detail-wikipedia');
    wikipediaLink.href = node.wikipediaUrl || '#';
    wikipediaLink.hidden = !node.wikipediaUrl;
    document.getElementById('metric-eco').innerText = node.eco;
    document.getElementById('metric-labor').innerText = node.labor;
    document.getElementById('detail-insight').innerText = node.quote;
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

function toggleDetailPanel() {
    const layout = document.getElementById('atlas-layout');
    const button = document.getElementById('detail-panel-toggle');
    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    const nextExpanded = !isExpanded;

    layout.classList.toggle('detail-collapsed', !nextExpanded);
    button.setAttribute('aria-expanded', String(nextExpanded));
    button.setAttribute('aria-label', nextExpanded ? 'Bilgi panelini kapat' : 'Bilgi panelini aç');
    button.title = nextExpanded ? 'Bilgi panelini kapat' : 'Bilgi panelini aç';
    button.querySelector('i').className = `fa-solid fa-chevron-${nextExpanded ? 'left' : 'right'}`;
    requestAnimationFrame(() => mapController?.resize());
}

async function initialize() {
    try {
        await loadNodes();
        renderChapterButtons();
        mapController = createMap(nodes, selectChapter);
        selectChapter(0);
        document.getElementById('detail-panel-toggle').addEventListener('click', toggleDetailPanel);
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
