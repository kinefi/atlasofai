const d3 = window.d3;
const topojson = window.topojson;

export function createMap(nodes, onSelect) {
    const container = document.getElementById('map-holder');
    let width = container.clientWidth;
    let height = container.clientHeight;
    let isGlobe = false;
    let projection = createMercator();
    let path = d3.geoPath().projection(projection);
    let visibleNodeIds = new Set(nodes.map((node) => node.id));
    let activeNodeId = nodes[0]?.id;
    let activeCoordsKey = nodes[0]?.coords.join(',');

    function createMercator() {
        return d3.geoMercator()
            .scale(width / 6.2)
            .translate([width / 2, height / 1.6]);
    }

    function normalizeCoords(coords) {
        let [longitude, latitude] = coords;
        if (longitude > 180) longitude -= 360;
        if (longitude < -180) longitude += 360;
        return [longitude, latitude];
    }

    function isPointVisible(coords) {
        if (!isGlobe) return true;
        const center = projection.invert(projection.translate());
        return d3.geoDistance(normalizeCoords(coords), center) <= Math.PI / 2;
    }

    d3.select(container).selectAll('*').remove();
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('class', 'w-full h-full');
    const tooltip = document.createElement('div');
    tooltip.id = 'map-node-tooltip';
    tooltip.className = 'map-tooltip';
    tooltip.setAttribute('role', 'tooltip');
    tooltip.hidden = true;
    container.append(tooltip);
    const g = svg.append('g');
    let zoom;

    function positionTooltip(event, target) {
        const bounds = container.getBoundingClientRect();
        const targetBounds = target.getBoundingClientRect();
        const x = event?.clientX ? event.clientX - bounds.left : targetBounds.left - bounds.left + targetBounds.width / 2;
        const y = event?.clientY ? event.clientY - bounds.top : targetBounds.top - bounds.top + targetBounds.height / 2;
        const left = Math.max(8, Math.min(width - tooltip.offsetWidth - 8, x + 12));
        const top = Math.max(8, Math.min(height - tooltip.offsetHeight - 8, y + 12));
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }

    function showTooltip(node, location, event) {
        tooltip.replaceChildren();
        const title = document.createElement('strong');
        title.className = 'block text-xs font-semibold text-slate-100';
        title.textContent = node.title;
        tooltip.append(title);

        const locationLabel = document.createElement('span');
        locationLabel.className = 'mt-0.5 block text-[9px] text-slate-400';
        locationLabel.textContent = location.label;
        tooltip.append(locationLabel);

        if (node.chart) {
            const chartTitle = document.createElement('span');
            chartTitle.className = 'mt-2 block text-[9px] font-mono text-slate-300';
            chartTitle.textContent = node.chart.title;
            tooltip.append(chartTitle);
            const chartDescription = document.createElement('span');
            chartDescription.className = 'mt-1 block text-[9px] leading-relaxed text-slate-400';
            chartDescription.textContent = node.chart.description;
            tooltip.append(chartDescription);
            const maxValue = Math.max(...node.chart.series.map((item) => item.value));
            node.chart.series.forEach((item) => {
                const row = document.createElement('div');
                row.className = 'chart-row mt-2 text-[9px] text-slate-300';
                const label = document.createElement('span');
                label.textContent = item.label;
                const value = document.createElement('span');
                value.className = 'font-mono text-slate-200';
                value.textContent = `${item.value} ${node.chart.unit}`;
                const track = document.createElement('div');
                track.className = 'chart-track';
                const bar = document.createElement('div');
                bar.className = 'chart-bar';
                bar.style.width = `${(item.value / maxValue) * 100}%`;
                track.append(bar);
                row.append(label, value, track);
                tooltip.append(row);
            });
        } else {
            const impact = document.createElement('span');
            impact.className = 'mt-2 block text-[9px] leading-relaxed text-slate-300';
            impact.textContent = `${node.eco} · ${node.labor}`;
            tooltip.append(impact);
        }

        tooltip.hidden = false;
        positionTooltip(event, event.currentTarget);
    }

    function drawFlowArcs() {
        const arcsGroup = g.append('g').attr('class', 'arcs-layer');
        const nodesById = new Map(nodes.map((node) => [node.id, node]));

        nodes.forEach((sourceNode) => {
            const targetNodeIds = sourceNode.nextNodeIds
                || (sourceNode.nextNodeId === undefined ? [] : [sourceNode.nextNodeId]);
            targetNodeIds.forEach((targetNodeId) => {
                const targetNode = nodesById.get(targetNodeId);
                if (!targetNode) return;

                let arcPath;
                if (isGlobe) {
                    const interpolate = d3.geoInterpolate(
                        normalizeCoords(sourceNode.coords),
                        normalizeCoords(targetNode.coords)
                    );
                    const steps = Math.max(24, Math.ceil(d3.geoDistance(
                        normalizeCoords(sourceNode.coords),
                        normalizeCoords(targetNode.coords)
                    ) * 48));
                    const coordinates = Array.from({ length: steps + 1 }, (_, step) => interpolate(step / steps));
                    arcPath = path({ type: 'LineString', coordinates });
                } else {
                    const source = projection(normalizeCoords(sourceNode.coords));
                    const target = projection(normalizeCoords(targetNode.coords));
                    const dx = target[0] - source[0];
                    const dy = target[1] - source[1];
                    const distance = Math.max(1, Math.hypot(dx, dy));
                    const bend = Math.min(42, Math.max(12, distance * 0.08));
                    const direction = sourceNode.id % 2 === 0 ? 1 : -1;
                    const controlX = (source[0] + target[0]) / 2 - (dy / distance) * bend * direction;
                    const controlY = (source[1] + target[1]) / 2 + (dx / distance) * bend * direction;
                    arcPath = `M${source[0]},${source[1]}Q${controlX},${controlY} ${target[0]},${target[1]}`;
                }
                const frontFacing = isPointVisible(sourceNode.coords) && isPointVisible(targetNode.coords);

                arcsGroup.append('path')
                    .attr('class', 'arc-line')
                    .attr('data-source-id', sourceNode.id)
                    .attr('data-target-id', targetNode.id)
                    .attr('data-front-facing', String(frontFacing))
                    .style('display', frontFacing ? null : 'none')
                    .attr('d', arcPath)
                    .attr('stroke-width', 2);
            });
        });
    }

    function drawNodes() {
        const nodesGroup = g.append('g').attr('class', 'nodes-layer');

        nodes.forEach((node, index) => {
            const locations = [
                { label: node.mapLabel || node.name.split('&')[0].trim(), coords: node.coords },
                ...(node.additionalLocations || [])
            ];

            locations.forEach((location) => {
                const [x, y] = projection(normalizeCoords(location.coords));
                const frontFacing = isPointVisible(location.coords);
                const nodeGroup = nodesGroup.append('g')
                    .attr('transform', `translate(${x}, ${y})`)
                    .attr('data-x', x)
                    .attr('data-y', y)
                    .attr('data-id', node.id)
                    .attr('data-index', index)
                    .attr('data-coords-key', location.coords.join(','))
                    .attr('data-front-facing', String(frontFacing))
                    .attr('class', 'map-node cursor-pointer')
                    .attr('role', 'button')
                    .attr('tabindex', 0)
                    .attr('aria-label', `${node.title}, ${location.label}`)
                    .attr('aria-describedby', 'map-node-tooltip')
                    .style('display', frontFacing ? null : 'none')
                    .on('click', () => onSelect(index, location.coords, location.label))
                    .on('mouseenter', (event) => showTooltip(node, location, event))
                    .on('mousemove', (event) => {
                        if (!tooltip.hidden) positionTooltip(event, event.currentTarget);
                    })
                    .on('mouseleave', () => { tooltip.hidden = true; })
                    .on('focus', (event) => showTooltip(node, location, event))
                    .on('blur', () => { tooltip.hidden = true; })
                    .on('keydown', (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            onSelect(index, location.coords, location.label);
                        }
                    });

                nodeGroup.append('circle').attr('r', 12).attr('class', 'pulse-node node-halo');
                nodeGroup.append('circle').attr('r', 6).attr('class', 'node-core');
                nodeGroup.append('circle').attr('r', 2.5).attr('fill', '#ffffff');
                nodeGroup.append('text')
                    .text(`${index + 1}. ${location.label}`)
                    .attr('x', 10)
                    .attr('y', 4)
                    .attr('font-size', '10px')
                    .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace')
                    .attr('class', 'pointer-events-none drop-shadow');
            });
        });
    }

    function applyVisibility() {
        g.selectAll('.map-node').style('display', function () {
            return visibleNodeIds.has(Number(this.dataset.id)) && this.dataset.frontFacing === 'true' ? null : 'none';
        });
        g.selectAll('.arc-line').style('display', function () {
            const visible = visibleNodeIds.has(Number(this.dataset.sourceId))
                && visibleNodeIds.has(Number(this.dataset.targetId))
                && this.dataset.frontFacing === 'true';
            return visible ? null : 'none';
        });
    }

    function setActiveNode(nodeId, coords = nodes.find((node) => node.id === nodeId)?.coords) {
        activeNodeId = nodeId;
        activeCoordsKey = coords?.join(',');
        g.selectAll('.map-node').classed('active', function () {
            return Number(this.dataset.id) === nodeId && this.dataset.coordsKey === activeCoordsKey;
        });
        g.selectAll('.arc-line').classed('arc-focused', function () {
            return Number(this.dataset.sourceId) === nodeId || Number(this.dataset.targetId) === nodeId;
        });
    }

    function focusNode(coords) {
        if (!coords) return;
        const duration = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 650;
        if (isGlobe) {
            const currentRotation = projection.rotate();
            const targetRotation = [-coords[0], -coords[1], currentRotation[2]];
            while (targetRotation[0] - currentRotation[0] > 180) targetRotation[0] -= 360;
            while (targetRotation[0] - currentRotation[0] < -180) targetRotation[0] += 360;
            const interpolate = d3.interpolateArray(currentRotation, targetRotation);
            svg.transition()
                .duration(duration)
                .tween('globe-focus', () => (time) => {
                    projection.rotate(interpolate(time));
                    renderProjectionLayers();
                });
            return;
        }

        const [x, y] = projection(normalizeCoords(coords));
        const scale = 2.4;
        svg.transition()
            .duration(duration)
            .call(zoom.transform, d3.zoomIdentity
                .translate(width / 2 - x * scale, height / 2 - y * scale)
                .scale(scale));
    }

    function renderProjectionLayers() {
        tooltip.hidden = true;
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
        applyVisibility();
        setActiveNode(activeNodeId, activeCoordsKey?.split(',').map(Number));
    }

    zoom = d3.zoom()
        .filter((event) => !isGlobe && (!event.ctrlKey || event.type === 'wheel') && !event.button)
        .scaleExtent([1, 18])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
            g.selectAll('.map-node').attr('transform', function () {
                return `translate(${this.dataset.x}, ${this.dataset.y}) scale(${1 / event.transform.k})`;
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

    g.append('rect')
        .attr('width', width * 4)
        .attr('height', height * 4)
        .attr('x', -width)
        .attr('y', -height)
        .attr('fill', '#0b1117');
    g.append('path').datum(d3.geoGraticule()).attr('class', 'graticule').attr('d', path);

    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
        .then((response) => {
            if (!response.ok) throw new Error('Dünya haritası yüklenemedi');
            return response.json();
        })
        .then((worldData) => {
            g.selectAll('.country')
                .data(topojson.feature(worldData, worldData.objects.countries).features)
                .join('path')
                .attr('class', 'country')
                .attr('d', path);
            renderProjectionLayers();
        })
        .catch((error) => {
            console.warn('Dünya haritası yüklenemedi:', error);
            g.append('path').datum({ type: 'Sphere' }).attr('class', 'sphere').attr('d', path);
            renderProjectionLayers();
        });

    return {
        resetZoom() {
            svg.transition().duration(600).call(zoom.transform, d3.zoomIdentity);
        },
        setActiveNode,
        focusNode,
        setVisibleNodeIds(ids) {
            visibleNodeIds = new Set(ids);
            applyVisibility();
        },
        toggleProjection() {
            isGlobe = !isGlobe;
            projection = isGlobe
                ? d3.geoOrthographic().scale(height / 2.3).translate([width / 2, height / 2])
                : createMercator();
            path.projection(projection);
            container.classList.toggle('globe-mode', isGlobe);
            svg.call(zoom.transform, d3.zoomIdentity);
            renderProjectionLayers();
            return isGlobe;
        },
        resize() {
            width = container.clientWidth;
            height = container.clientHeight;
            svg.attr('width', width).attr('height', height);
            projection = isGlobe
                ? d3.geoOrthographic().scale(height / 2.3).translate([width / 2, height / 2])
                : createMercator();
            path.projection(projection);
            renderProjectionLayers();
        }
    };
}
