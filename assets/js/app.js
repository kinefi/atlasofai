let nodes = [];

async function loadNodes() {
    const response = await fetch('assets/data/nodes.json');
    if (!response.ok) {
        throw new Error('nodes.json yüklenemedi');
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
        throw new Error('nodes.json bir düğüm listesi içermiyor');
    }

    nodes = data;
}

let width = 0, height = 0;
let svg, g, path, projection, zoom;
let isGlobe = false;
let worldData = null;
let activeIndex = 0;
let slideshowTimer = null;
let activeLayers = new Set();
let filtersInitialized = false;
let storyObserver = null;

function renderCategoryFilters() {
    const filterBar = document.getElementById('category-filters');
    if (!filterBar) return;

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
        button.addEventListener('click', () => toggleLayer(button.dataset.layer));
    });
}

function toggleLayer(layer) {
    if (activeLayers.has(layer)) {
        activeLayers.delete(layer);
    } else {
        activeLayers.add(layer);
    }
    renderCategoryFilters();
    applyFilters();
}

function applyFilters() {
    const visibleNodes = nodes.filter((node) => activeLayers.has(node.layer || 'Diğer'));
    const visibleIds = new Set(visibleNodes.map((node) => node.id));

    d3.selectAll('.map-node').style('display', function () {
        const node = nodes.find((item) => item.id === Number(this.dataset.id));
        return node && activeLayers.has(node.layer || 'Diğer') ? null : 'none';
    });
    d3.selectAll('.arc-line').style('display', function () {
        const source = Number(this.dataset.sourceId);
        const target = Number(this.dataset.targetId);
        return visibleIds.has(source) && visibleIds.has(target) ? null : 'none';
    });
    document.querySelectorAll('.chap-btn').forEach((button) => {
        const node = nodes[Number(button.dataset.index)];
        button.hidden = !node || !activeLayers.has(node.layer || 'Diğer');
    });

    if (visibleNodes.length && !activeLayers.has(nodes[activeIndex].layer || 'Diğer')) {
        selectChapter(nodes.indexOf(visibleNodes[0]));
    }
}

function previousChapter() {
    if (!nodes.length) return;
    selectChapter((activeIndex - 1 + nodes.length) % nodes.length);
}

function nextChapter() {
    if (!nodes.length) return;
    selectChapter((activeIndex + 1) % nodes.length);
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

function renderChapterButtons() {
    const chapterBar = document.getElementById('chapter-bar');
    if (!chapterBar) return;

    chapterBar.innerHTML = nodes.map((node, idx) => {
        const activeClass = idx === activeIndex
            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-lg'
            : 'text-slate-400 hover:text-slate-200';

        return `
            <button onclick="selectChapter(${idx})" class="chap-btn px-3 py-1.5 rounded-lg text-xs font-medium ${activeClass} transition flex items-center gap-2 whitespace-nowrap" data-index="${idx}">
                <span class="w-4 h-4 rounded-full ${idx === activeIndex ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'} text-[10px] font-mono flex items-center justify-center">${idx + 1}</span>
                <span class="block text-left">${node.title.replace(/^\d+\.\s*/, '')}<small class="block text-[9px] text-slate-500">${node.location}</small></span>
            </button>
        `;
    }).join('');

    if (storyObserver) storyObserver.disconnect();
    storyObserver = new IntersectionObserver((entries) => {
        const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) selectChapter(Number(visible.target.dataset.index));
    }, { root: chapterBar, threshold: [0.65, 0.85] });
    chapterBar.querySelectorAll('.chap-btn').forEach((button) => storyObserver.observe(button));
}

function openImageLightbox() {
    const dialog = document.getElementById('image-lightbox');
    const image = document.getElementById('lightbox-img');
    const source = document.getElementById('detail-img');
    if (!dialog || !image || !source || !source.src) return;
    image.src = source.src;
    image.alt = source.alt;
    dialog.showModal();
}

function closeImageLightbox() {
    document.getElementById('image-lightbox')?.close();
}

function initMap() {
    const container = document.getElementById('map-holder');
    width = container.clientWidth;
    height = container.clientHeight;

    d3.select('#map-holder').html('');
    svg = d3.select('#map-holder')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('class', 'w-full h-full');

    const defs = svg.append('defs');
    const grad = defs.append('linearGradient')
        .attr('id', 'arc-gradient')
        .attr('gradientUnits', 'userSpaceOnUse');
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#ff4b3e');
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#00f0ff');

    projection = d3.geoMercator()
        .scale(width / 6.2)
        .translate([width / 2, height / 1.6]);

    path = d3.geoPath().projection(projection);

    zoom = d3.zoom()
        .filter((event) => !isGlobe && (!event.ctrlKey || event.type === 'wheel') && !event.button)
        .scaleExtent([1, 18])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
            g.selectAll('.map-node').attr('transform', function () {
                const scale = 1 / event.transform.k;
                return `translate(${this.dataset.x}, ${this.dataset.y}) scale(${scale})`;
            });
        });

    svg.call(zoom);
    svg.call(d3.drag()
        .filter(() => isGlobe)
        .on('drag', (event) => {
            const rotation = projection.rotate();
            const degreesPerPixel = 180 / (Math.PI * projection.scale());
            projection.rotate([
                rotation[0] + event.dx * degreesPerPixel,
                Math.max(-85, Math.min(85, rotation[1] - event.dy * degreesPerPixel)),
                rotation[2]
            ]);
            renderProjectionLayers();
        }));
    g = svg.append('g');

    g.append('rect')
        .attr('width', width * 4)
        .attr('height', height * 4)
        .attr('x', -width)
        .attr('y', -height)
        .attr('fill', '#070a12');

    const graticule = d3.geoGraticule();
    g.append('path')
        .datum(graticule)
        .attr('class', 'graticule')
        .attr('d', path);

    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
        .then(res => res.json())
        .then(data => {
            worldData = data;
            renderWorld();
        })
        .catch(err => {
            console.warn('CDN harita yüklenemedi, temel coğrafi kontur oluşturuluyor:', err);
            renderFallbackWorld();
        });
}

function renderWorld() {
    const countries = topojson.feature(worldData, worldData.objects.countries);

    g.selectAll('.country')
        .data(countries.features)
        .enter()
        .append('path')
        .attr('class', 'country')
        .attr('d', path);

    drawFlowArcs();
    drawNodes();
    selectChapter(0);
}

function renderFallbackWorld() {
    g.append('path')
        .datum({ type: 'Sphere' })
        .attr('class', 'sphere')
        .attr('d', path);

    drawFlowArcs();
    drawNodes();
    selectChapter(0);
}

function drawFlowArcs() {
    const arcsGroup = g.append('g').attr('class', 'arcs-layer');
    const nodesById = new Map(nodes.map((node) => [node.id, node]));

    nodes.forEach((sourceNode) => {
        const targetNode = nodesById.get(sourceNode.nextNodeId);
        if (!targetNode) return;

        const source = projection(normalizeCoords(sourceNode.coords));
        const target = projection(normalizeCoords(targetNode.coords));
        const dx = target[0] - source[0];
        const dy = target[1] - source[1];
        const distance = Math.max(1, Math.hypot(dx, dy));
        const bend = Math.min(42, Math.max(12, distance * 0.08));
        const direction = sourceNode.id % 2 === 0 ? 1 : -1;
        const controlX = (source[0] + target[0]) / 2 - (dy / distance) * bend * direction;
        const controlY = (source[1] + target[1]) / 2 + (dx / distance) * bend * direction;

        arcsGroup.append('path')
            .attr('class', 'arc-line')
            .attr('data-source-id', sourceNode.id)
            .attr('data-target-id', targetNode.id)
            .style('display', isPointVisible(sourceNode.coords) && isPointVisible(targetNode.coords) ? null : 'none')
            .attr('d', `M${source[0]},${source[1]}Q${controlX},${controlY} ${target[0]},${target[1]}`)
            .attr('stroke-width', 2);
    });
}

function normalizeCoords(coords) {
    let [lng, lat] = coords;

    if (lng > 180) lng -= 360;
    if (lng < -180) lng += 360;

    return [lng, lat];
}

function isPointVisible(coords) {
    if (!isGlobe) return true;
    const center = projection.invert(projection.translate());
    return d3.geoDistance(normalizeCoords(coords), center) <= Math.PI / 2;
}

function renderProjectionLayers() {
    g.selectAll('.country, .sphere, .graticule').attr('d', path);
    g.selectAll('.arcs-layer, .nodes-layer, .atmosphere-ring').remove();

    if (isGlobe) {
        const [cx, cy] = projection.translate();
        g.append('circle')
            .attr('class', 'atmosphere-ring')
            .attr('cx', cx)
            .attr('cy', cy)
            .attr('r', projection.scale() + 4);
    }

    drawFlowArcs();
    drawNodes();
    applyFilters();
    selectChapter(activeIndex);
}

function drawNodes() {
    const nodesGroup = g.append('g').attr('class', 'nodes-layer');

    nodes.forEach((node, idx) => {
        const normalized = normalizeCoords(node.coords);
        const [x, y] = projection(normalized);

        const nodeG = nodesGroup.append('g')
            .attr('transform', `translate(${x}, ${y})`)
            .attr('data-x', x)
            .attr('data-y', y)
            .attr('data-id', node.id)
            .attr('class', `map-node cursor-pointer ${idx === activeIndex ? 'active' : ''}`)
            .attr('data-index', idx)
            .style('display', isPointVisible(node.coords) ? null : 'none')
            .on('click', () => selectChapter(idx));

        nodeG.append('circle')
            .attr('r', 12)
            .attr('class', 'pulse-node node-halo');

        nodeG.append('circle')
            .attr('r', 6)
            .attr('class', 'node-core');

        nodeG.append('circle')
            .attr('r', 2.5)
            .attr('fill', '#ffffff');

        nodeG.append('text')
            .text(`${idx + 1}. ${node.mapLabel || node.name.split('&')[0].trim()}`)
            .attr('x', 10)
            .attr('y', 4)
            .attr('font-size', '10px')
            .attr('font-family', 'JetBrains Mono')
            .attr('class', 'pointer-events-none drop-shadow');
    });
}

function selectChapter(index) {
    activeIndex = index;
    const node = nodes[index];

    document.querySelectorAll('.chap-btn').forEach((btn, idx) => {
        if (idx === index) {
            btn.className = 'chap-btn px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 transition flex items-center gap-2 whitespace-nowrap shadow-lg';
        } else {
            btn.className = 'chap-btn px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition flex items-center gap-2 whitespace-nowrap';
        }
    });

    document.querySelectorAll('.map-node').forEach((item, idx) => {
        item.classList.toggle('active', idx === index);
    });

    document.querySelectorAll('.arc-line').forEach((line, idx) => {
        line.classList.toggle('arc-focused', Number(line.dataset.sourceId) === node.id || Number(line.dataset.targetId) === node.id);
    });

    document.getElementById('detail-img').src = node.img;
    document.getElementById('detail-category').innerText = node.category;
    document.getElementById('detail-coords').innerText = `${node.coords[1]}°, ${node.coords[0]}°`;
    document.getElementById('detail-location').innerText = node.location;
    document.getElementById('detail-title').innerText = node.title;
    document.getElementById('detail-desc').innerText = node.desc;
    document.getElementById('metric-eco').innerText = node.eco;
    document.getElementById('metric-labor').innerText = node.labor;
    document.getElementById('detail-quote').innerText = `"${node.quote}"`;
}

function resetZoom() {
    svg.transition()
        .duration(1200)
        .call(zoom.transform, d3.zoomIdentity);
}

function toggleProjection() {
    isGlobe = !isGlobe;
    document.getElementById('proj-label').innerText = isGlobe ? 'Küre Görünümü' : 'Düz Projeksiyon';

    if (isGlobe) {
        projection = d3.geoOrthographic()
            .scale(height / 2.3)
            .translate([width / 2, height / 2]);
    } else {
        projection = d3.geoMercator()
            .scale(width / 6.2)
            .translate([width / 2, height / 1.6]);
    }

    path.projection(projection);
    document.getElementById('map-holder').classList.toggle('globe-mode', isGlobe);
    svg.call(zoom.transform, d3.zoomIdentity);
    renderProjectionLayers();
}

window.onload = async function () {
    await loadNodes();
    renderCategoryFilters();
    renderChapterButtons();
    initMap();
};

window.onresize = function () {
    if (nodes.length) {
        initMap();
    }
};
