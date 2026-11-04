import { createMap } from './map.js';
import { createAmbientSound } from './audio.js';

let nodes = [];
let sources = new Map();
let mapController = null;
let activeIndex = 0;
let activeLayers = new Set();
let filtersInitialized = false;
let slideshowTimer = null;
let storyObserver = null;
const ambientSound = createAmbientSound();

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
        const sourceIds = [...(node.sourceIds || []), ...(node.chart?.sourceIds || [])];
        if (node.chart && (!node.chart.title
            || !node.chart.description
            || !node.chart.unit
            || !Array.isArray(node.chart.series)
            || node.chart.series.length === 0
            || node.chart.series.some((item) => !item
                || typeof item.label !== 'string'
                || !Number.isFinite(item.value)
                || item.value <= 0))) {
            throw new Error(`Aşama grafiği geçersiz: ${node.id}`);
        }
        for (const sourceId of sourceIds) {
            if (!sources.has(sourceId)) {
                throw new Error(`Aşama kaynağı bulunamadı: ${sourceId}`);
            }
        }
    }
    nodes = nodeData;
}

function previousChapter() {
    navigateVisibleChapter(-1);
}

function nextChapter() {
    navigateVisibleChapter(1);
}

function navigateVisibleChapter(direction) {
    if (!nodes.length) return;
    for (let offset = 1; offset <= nodes.length; offset += 1) {
        const index = (activeIndex + direction * offset + nodes.length) % nodes.length;
        if (activeLayers.has(nodes[index].layer || 'Diğer')) {
            selectChapter(index);
            return;
        }
    }
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
    mapController?.setVisibleNodeIds(visibleIds);

    document.querySelectorAll('.layer-filter').forEach((button) => {
        const active = activeLayers.has(button.dataset.layer);
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
    });

    document.querySelectorAll('.chap-btn').forEach((button) => {
        const node = nodes[Number(button.dataset.index)];
        button.hidden = !node || !activeLayers.has(node.layer || 'Diğer');
    });

    if (visibleNodes.length && nodes[activeIndex] && !activeLayers.has(nodes[activeIndex].layer || 'Diğer')) {
        selectChapter(nodes.indexOf(visibleNodes[0]));
    }
}

function renderLayerFilters() {
    const filterBar = document.getElementById('layer-filter-bar');
    const layers = [...new Set(nodes.map((node) => node.layer || 'Diğer'))];
    if (!filtersInitialized) {
        activeLayers = new Set(layers);
        filtersInitialized = true;
    }

    filterBar.replaceChildren();
    layers.forEach((layer) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `layer-filter ${activeLayers.has(layer) ? 'is-active' : ''}`;
        button.dataset.layer = layer;
        button.dataset.layerFilter = '';
        button.textContent = layer;
        button.title = `${layer} katmanını göster veya gizle`;
        button.setAttribute('aria-label', `${layer} katmanını göster veya gizle`);
        button.setAttribute('aria-pressed', String(activeLayers.has(layer)));
        button.addEventListener('click', () => {
            if (activeLayers.has(layer)) activeLayers.delete(layer);
            else activeLayers.add(layer);
            applyFilters();
        });
        filterBar.append(button);
    });
}

function renderChapterButtons() {
    const chapterBar = document.getElementById('chapter-bar');
    chapterBar.replaceChildren();
    nodes.forEach((node, index) => {
        const chapterButton = document.createElement('button');
        chapterButton.type = 'button';
        chapterButton.className = 'chap-btn min-w-0 w-full px-2 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition flex items-center gap-2 text-left';
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
        chapterBar.append(chapterButton);
    });

    if (storyObserver) storyObserver.disconnect();
    storyObserver = new IntersectionObserver((entries) => {
        const visible = entries
            .filter((entry) => entry.isIntersecting && !entry.target.hidden)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
            const index = Number(visible.target.dataset.index);
            if (index !== activeIndex) {
                selectChapter(index, undefined, undefined, { fromScroll: true, focusMap: true });
            }
        }
    }, { root: chapterBar, threshold: [0.65, 0.85] });
    chapterBar.querySelectorAll('.chap-btn').forEach((button) => storyObserver.observe(button));
}

function selectChapter(index, coords = nodes[index]?.coords, locationLabel, options = {}) {
    const node = nodes[index];
    if (!node) return;
    coords = coords || node.coords;
    activeIndex = index;
    ambientSound.setProfile(node.soundProfile);

    document.querySelectorAll('.chap-btn').forEach((button) => {
        const selected = Number(button.dataset.index) === index;
        button.classList.toggle('is-current', selected);
        button.setAttribute('aria-current', String(selected));
        if (selected && !options.fromScroll) {
            const behavior = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
            button.scrollIntoView({ block: 'nearest', behavior });
        }
    });
    mapController?.setActiveNode(node.id, coords);
    if (options.focusMap) mapController?.focusNode(coords);

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
    const sourceIds = [...new Set([...(node.sourceIds || []), ...(node.chart?.sourceIds || [])])];
    sourceIds.forEach((sourceId) => {
        const source = sources.get(sourceId);
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = source.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'break-words text-cyberblue hover:text-cyberblue';
        link.textContent = `${source.author} (${source.year}) · ${source.type} — ${source.title}`;
        item.append(link);
        sourceList.append(item);
    });
    const relatedArticles = node.relatedArticles || [];
    relatedArticles.slice(1).forEach((article) => {
        const item = document.createElement('li');
        const label = document.createElement('span');
        label.className = 'text-slate-400';
        label.textContent = 'İyimser İrade · ';
        const link = document.createElement('a');
        link.href = article.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'break-words text-emerald-400 hover:text-emerald-300';
        link.textContent = article.title;
        item.append(label, link);
        sourceList.append(item);
    });
    sourceSection.hidden = !sourceList.childElementCount;
    const wikipediaLink = document.getElementById('detail-wikipedia');
    wikipediaLink.href = node.wikipediaUrl || '#';
    wikipediaLink.hidden = !node.wikipediaUrl;
    const featuredArticleLink = document.getElementById('detail-related-article');
    featuredArticleLink.hidden = !relatedArticles.length;
    if (relatedArticles.length) {
        featuredArticleLink.href = relatedArticles[0].url;
        featuredArticleLink.title = relatedArticles[0].title;
        featuredArticleLink.setAttribute('aria-label', `İyimser İrade'de oku: ${relatedArticles[0].title}`);
    } else {
        featuredArticleLink.removeAttribute('href');
        featuredArticleLink.removeAttribute('title');
        featuredArticleLink.removeAttribute('aria-label');
    }
    renderChart(node.chart);
    document.getElementById('metric-eco').innerText = node.eco;
    document.getElementById('metric-labor').innerText = node.labor;
    document.getElementById('detail-insight').innerText = node.quote;
}

function renderChart(chart) {
    const section = document.getElementById('detail-chart');
    const seriesContainer = document.getElementById('detail-chart-series');
    seriesContainer.replaceChildren();
    section.hidden = !chart;
    if (!chart) return;

    document.getElementById('detail-chart-title').textContent = chart.title;
    document.getElementById('detail-chart-description').textContent = chart.description;
    const maxValue = Math.max(...chart.series.map((item) => item.value));
    seriesContainer.setAttribute('aria-label', `${chart.title}. ${chart.description}. ${chart.series
        .map((item) => `${item.label}: ${item.value} ${chart.unit}`)
        .join('; ')}`);

    chart.series.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'chart-row text-[9px] text-slate-300';
        const label = document.createElement('span');
        label.textContent = item.label;
        const value = document.createElement('span');
        value.className = 'font-mono text-slate-200';
        value.textContent = `${item.value} ${chart.unit}`;
        const track = document.createElement('div');
        track.className = 'chart-track';
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.width = `${Math.max(0, Math.min(100, (item.value / maxValue) * 100))}%`;
        track.append(bar);
        row.append(label, value, track);
        seriesContainer.append(row);
    });
}

async function toggleAmbientAudio() {
    const button = document.getElementById('ambient-audio-toggle');
    const icon = document.getElementById('ambient-audio-icon');
    const status = document.getElementById('ambient-audio-status');
    button.disabled = true;
    try {
        const isPlaying = await ambientSound.toggle();
        button.setAttribute('aria-pressed', String(isPlaying));
        button.querySelector('span').textContent = isPlaying ? 'Aşama sesini kapat' : 'Aşama sesini aç';
        button.title = isPlaying ? 'Tarayıcıda üretilen aşama sesini kapat' : 'Tarayıcıda üretilen aşama sesini aç';
        icon.className = `fa-solid ${isPlaying ? 'fa-volume-xmark' : 'fa-volume-high'} text-cyberblue`;
        status.textContent = isPlaying ? 'Aşama ortam sesi açık.' : 'Aşama ortam sesi kapalı.';
        status.hidden = true;
        status.classList.add('hidden');
    } catch (error) {
        console.error(error);
        status.textContent = `Ortam sesi başlatılamadı: ${error.message}`;
        status.hidden = false;
        status.classList.remove('hidden');
        button.querySelector('span').textContent = 'Sesi yeniden dene';
        button.title = error.message;
        icon.className = 'fa-solid fa-triangle-exclamation text-rose-400';
    } finally {
        button.disabled = !ambientSound.supported;
    }
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
        renderLayerFilters();
        mapController = createMap(nodes, selectChapter);
        selectChapter(0);
        const audioButton = document.getElementById('ambient-audio-toggle');
        audioButton.disabled = !ambientSound.supported;
        if (!ambientSound.supported) audioButton.title = 'Bu tarayıcı ortam sesini desteklemiyor.';
        audioButton.addEventListener('click', toggleAmbientAudio);
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
