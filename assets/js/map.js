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
    const g = svg.append('g');
    let zoom;

    function drawFlowArcs() {
        const arcsGroup = g.append('g').attr('class', 'arcs-layer');
        const nodesById = new Map(nodes.map((node) => [node.id, node]));

        nodes.forEach((sourceNode) => {
            const targetNodeIds = sourceNode.nextNodeIds
                || (sourceNode.nextNodeId === undefined ? [] : [sourceNode.nextNodeId]);
            targetNodeIds.forEach((targetNodeId) => {
                const targetNode = nodesById.get(targetNodeId);
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
                const frontFacing = isPointVisible(sourceNode.coords) && isPointVisible(targetNode.coords);

                arcsGroup.append('path')
                    .attr('class', 'arc-line')
                    .attr('data-source-id', sourceNode.id)
                    .attr('data-target-id', targetNode.id)
                    .attr('data-front-facing', String(frontFacing))
                    .style('display', frontFacing ? null : 'none')
                    .attr('d', `M${source[0]},${source[1]}Q${controlX},${controlY} ${target[0]},${target[1]}`)
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
                    .style('display', frontFacing ? null : 'none')
                    .on('click', () => onSelect(index, location.coords, location.label));

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
        .attr('fill', '#070a12');
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
