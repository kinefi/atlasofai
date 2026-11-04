const fallbackNodes = [
    {
        id: 0,
        name: 'Salar de Atacama & Kolwezi',
        location: 'Şili & Kongo Dem. Cumhuriyeti',
        coords: [-68.2, -23.5],
        category: 'Hammadde Çıkarma',
        title: '1. Lityum & Kobalt Madenciliği',
        desc: 'Yapay zekâ çiplerinin, mobil cihazların ve veri merkezi yedek güç ünitelerinin ihtiyaç duyduğu lityum ve kobalt madenleri burada çıkarılır. Şili\'deki Salar de Atacama tuzlasında 1 ton lityum elde etmek için 2.2 milyon litre su buharlaştırılır.',
        eco: 'Su Yataklarının Kuruması, Zehirli Atık Göletleri',
        labor: 'Ağır İş Koşulları, Asgari Ücretin Altında Tehlikeli Emek',
        quote: 'Yapay zekânın başlangıç noktası algoritmalar değil, Dünya\'nın tektonik katmanlarındaki madenlerdir.',
        img: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80'
    },
    {
        id: 1,
        name: 'TSMC Semiconductor Fab',
        location: 'Hsinchu, Tayvan',
        coords: [120.96, 24.81],
        category: 'Yarı İletken Üretimi',
        title: '2. Gelişmiş Mikroçip Fabrikasyonu',
        desc: 'Saf silisyum madenleri ve nadir toprak elementleri, mikroskobik ölçekte NVIDIA ve Apple çiplerine dönüştürülür. Çip lithography süreçleri devasa miktarda elektrik ve aşırı derece arıtılmış ultra saf su gerektirir.',
        eco: 'Günlük Yüzbinlerce Ton Su & Dev Karbon Ayak İzi',
        labor: '7/24 Temiz Oda (Cleanroom) Mühendisliği & Vardiyalı Sistem',
        quote: 'En gelişmiş zekâ, gezegenin en hassas ve enerji yoğun üretim tesislerinde şekillenir.',
        img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'
    },
    {
        id: 2,
        name: 'Nairobi & Caracas Veri Merkezleri',
        location: 'Nairobi (Kenya) & Caracas (Venezuela)',
        coords: [36.82, -1.29],
        category: 'Veri Etiketleme',
        title: '3. Algoritmik Sömürü ve Etiketleme',
        desc: 'Yapay zekâ modellerinin şiddeti, nefret söylemini tanıması veya görselleri sınıflandırması için binlerce düşük ücretli işçi her gün milyonlarca veriyi manuel olarak etiketler.',
        eco: 'Düşük Fiziksel İz / Yüksek Psikolojik Yük',
        labor: 'Saatlik 1.2$ - 2.0$ Ücret, Ağır Travmatik İçerik İnceleme',
        quote: 'Makine öğrenimi olarak adlandırdığımız şey, görünmeyen insan emeğinin anonimleştirilmesidir.',
        img: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80'
    },
    {
        id: 3,
        name: 'Data Center Alley (AWS / Azure)',
        location: 'Northern Virginia, ABD',
        coords: [-77.48, 39.04],
        category: 'Bulut Hesaplama',
        title: '4. Hipersosyal Veri Merkezleri & Enerji',
        desc: 'Dünyadaki internet trafiğinin ve yapay zekâ model eğitimlerinin %70\'inin geçtiği veri merkezleri burada yer alır. LLM modellerini eğitmek ve çalıştırmak bir şehrin yıllık elektrik ihtiyacına denk enerji harcar.',
        eco: 'Devasa Termal Isı Salınımı & Soğutma Suyu Tüketimi',
        labor: '7/24 Altyapı ve Güvenlik Yönetimi',
        quote: 'Yapay zekâ modeli eğitmek, bir uçağın dünyayı yüzlerce kez turlamasına denk karbon salar.',
        img: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80'
    },
    {
        id: 4,
        name: 'Agbogbloshie & Guiyu',
        location: 'Accra (Gana) & Guiyu (Çin)',
        coords: [-0.22, 5.55],
        category: 'E-Atık & Yok Oluş',
        title: '5. Elektronik Atık Mezarlığı',
        desc: 'Ömrü 2-3 yılda tükenen yapay zekâ sunucuları, akıllı hoparlörler ve çipler Batı ülkelerinden e-atık olarak Afrika ve Asya\'daki hurdalıklara gönderilir. Kurşun ve cıva toprağa karışır.',
        eco: 'Toprak ve Nehirlerde Zehirli Ağır Metal Birikimi',
        labor: 'Kayıtsız Atık Yakma ve Çıplak Elle Bakır Ayrıştırma',
        quote: 'Bir cihazın yaşam döngüsü tüketiciyle bitmez; gelişmekte olan ülkelerin toprağında son bulur.',
        img: 'https://images.unsplash.com/photo-1532996122754-e3b4d32a0a57?auto=format&fit=crop&w=800&q=80'
    }
];

let nodes = [];

async function loadNodes() {
    try {
        const response = await fetch('assets/data/nodes.json');
        if (!response.ok) {
            throw new Error('nodes.json yüklenemedi');
        }
        const data = await response.json();
        nodes = Array.isArray(data) ? data : fallbackNodes;
    } catch (error) {
        console.warn('JSON verisi yüklenemedi, yedek veri kullanılıyor:', error);
        nodes = fallbackNodes;
    }
}

let width = 0, height = 0;
let svg, g, path, projection, zoom;
let isGlobe = false;
let worldData = null;
let activeIndex = 0;

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
        .scaleExtent([1, 18])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });

    svg.call(zoom);
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

    for (let i = 0; i < nodes.length - 1; i++) {
        const source = nodes[i].coords;
        const target = nodes[i + 1].coords;

        const geoArc = {
            type: 'LineString',
            coordinates: [source, target]
        };

        arcsGroup.append('path')
            .datum(geoArc)
            .attr('class', 'arc-line')
            .attr('d', path)
            .attr('stroke-width', 2);
    }
}

function drawNodes() {
    const nodesGroup = g.append('g').attr('class', 'nodes-layer');

    nodes.forEach((node, idx) => {
        const [x, y] = projection(node.coords);

        const nodeG = nodesGroup.append('g')
            .attr('transform', `translate(${x}, ${y})`)
            .attr('class', 'cursor-pointer')
            .on('click', () => selectChapter(idx));

        nodeG.append('circle')
            .attr('r', 12)
            .attr('fill', '#00f0ff')
            .attr('opacity', 0.2)
            .attr('class', 'pulse-node');

        nodeG.append('circle')
            .attr('r', 6)
            .attr('fill', '#0a0e17')
            .attr('stroke', '#00f0ff')
            .attr('stroke-width', 2);

        nodeG.append('circle')
            .attr('r', 2.5)
            .attr('fill', '#ffffff');

        nodeG.append('text')
            .text(`${idx + 1}. ${node.name.split('&')[0]}`)
            .attr('x', 10)
            .attr('y', 4)
            .attr('fill', '#cbd5e1')
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

    document.getElementById('detail-img').src = node.img;
    document.getElementById('detail-category').innerText = node.category;
    document.getElementById('detail-coords').innerText = `${node.coords[1]}°, ${node.coords[0]}°`;
    document.getElementById('detail-location').innerText = node.location;
    document.getElementById('detail-title').innerText = node.title;
    document.getElementById('detail-desc').innerText = node.desc;
    document.getElementById('metric-eco').innerText = node.eco;
    document.getElementById('metric-labor').innerText = node.labor;
    document.getElementById('detail-quote').innerText = `"${node.quote}"`;

    const [x, y] = projection(node.coords);
    const scale = 4.5;
    const translate = [width / 2 - scale * x, height / 2 - scale * y];

    svg.transition()
        .duration(1600)
        .ease(d3.easeCubicInOut)
        .call(
            zoom.transform,
            d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
        );
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
    g.selectAll('path').attr('d', path);

    g.selectAll('.nodes-layer').remove();
    g.selectAll('.arcs-layer').remove();
    drawFlowArcs();
    drawNodes();
    selectChapter(activeIndex);
}

window.onload = async function () {
    await loadNodes();
    initMap();
};

window.onresize = function () {
    if (nodes.length) {
        initMap();
    }
};
