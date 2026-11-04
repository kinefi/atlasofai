const fallbackNodes = [
    {
        id: 0,
        name: 'Salar de Atacama & Kolwezi',
        mapLabel: 'Atacama ve Kolwezi Madenleri',
        location: 'Şili & Kongo Dem. Cumhuriyeti',
        coords: [-68.2, -23.5],
        category: 'Hammadde Çıkarma',
        title: '1. Lityum & Kobalt Madenciliği',
        desc: 'Yapay zekâ çiplerinin, mobil cihazların ve veri merkezi yedek güç ünitelerinin ihtiyaç duyduğu lityum ve kobalt madenleri burada çıkarılır. Şili\'deki Salar de Atacama tuzlasında 1 ton lityum elde etmek için 2.2 milyon litre su buharlaştırılır.',
        eco: 'Su yetersizliği, tuz gölleri ve ağır metal kirliliği',
        labor: 'Ağır iş koşulları ve tehlikeli madencilik emekçiliği',
        quote: 'Yapay zekânın başlangıç noktası algoritmalar değil, Dünya\'nın alt katmanlarında çıkarılan madenlerdir.',
        img: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80'
    },
    {
        id: 1,
        name: 'Baotou Rare Earth Basin',
        mapLabel: 'Baotou Nadir Toprak Havzası',
        location: 'İç Moğolistan, Çin',
        coords: [109.8, 41.6],
        category: 'Nadir Toprak İşleme',
        title: '2. Nadir Toprak ve Kimyasal Rafinasyon',
        desc: 'Manyetik alanlar, ekranlar ve çipler için gerekli olan nadir toprak elementleri burada işlenir. Arıtım sırasında büyük miktarda kimyasal atık ve su kirliliği oluşur.',
        eco: 'Kimyasal atık, su kirliliği ve arazi bozulması',
        labor: 'Yöntemli üretim, düşük ücretli kimyasal iş gücü',
        quote: 'Bir modelin görünmeyen ölçüsü, ekrandaki metin değil, rafinasyon tesislerinin kimyasal yüküdür.',
        img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'
    },
    {
        id: 2,
        name: 'Silicon Valley AI Design',
        mapLabel: 'Silikon Vadisi Çip Tasarımı',
        location: 'Kaliforniya, ABD',
        coords: [-122.42, 37.77],
        category: 'Çip Tasarımı',
        title: '3. Yapay Zekâ Çiplerinin Tasarımı',
        desc: 'NVIDIA, AMD ve Apple gibi şirketler, yapay zekâ hızını artıran GPU ve NPU tasarımlarını burada geliştirir. Bu tasarımlar, ağın bütün fiziksel altyapısını yöneten mantıksal merkezlerdir.',
        eco: 'Yüksek enerji tüketimi ve tasarım ağında yoğun veri kullanımı',
        labor: 'Yüksek vasıflı mühendislik, araştırma ve ürün tasarımı',
        quote: 'Bilgisayarın özü, bir çipin mimarisinde değil, insan zekâsının uzmanlık biçiminde saklıdır.',
        img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'
    },
    {
        id: 3,
        name: 'TSMC Semiconductor Fab',
        mapLabel: 'TSMC Çip Fabrikası',
        location: 'Hsinchu, Tayvan',
        coords: [120.96, 24.81],
        category: 'Yarı İletken Üretimi',
        title: '4. Gelişmiş Mikroçip Fabrikasyonu',
        desc: 'Saf silisyum ve ultra saf suyla çalışan litografi süreçleri, çipleri mikroskobik nano ölçekte üretir. Bu organik olmayan üretim, en hassas ve enerji yoğun aşamalardan geçer.',
        eco: 'Günlük yüzbinlerce ton su ve yüksek karbon ayak izi',
        labor: 'Temiz oda mühendisliği, vardiyalı üretim ve teknik bakım',
        quote: 'En gelişmiş zekâ, gezegenin en hassas ve enerji yoğun üretim tesislerinde şekillenir.',
        img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80'
    },
    {
        id: 4,
        name: 'Nairobi & Manila',
        mapLabel: 'Nairobi ve Manila Veri İşçiliği',
        location: 'Kenya & Filipinler',
        coords: [36.82, -1.29],
        category: 'Veri Etiketleme',
        title: '5. İnsan Duygu ve Görüntü Etiketleme',
        desc: 'Binlerce işçi, modelin güvenlik ve açıklama yeteneklerini oluşturmak için yüzlerce bin veri parçasını etiketler. Bu süreç yalnızca algoritma değil, insan gözünün ve travmasının bir parçasıdır.',
        eco: 'Düşük fiziksel iz, yüksek psikolojik yıpranma',
        labor: 'Düşük ücretli onaylama işçiliği ve travmatik içerik kategorileştirme',
        quote: 'Makine öğrenimi olarak adlandırdığımız şey, görünmeyen insan emeğinin anonimleştirilmesidir.',
        img: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80'
    },
    {
        id: 5,
        name: 'Data Center Alley (AWS / Azure)',
        mapLabel: 'Kuzey Virginia Veri Merkezleri',
        location: 'Northern Virginia, ABD',
        coords: [-77.48, 39.04],
        category: 'Bulut Hesaplama',
        title: '6. Hipersosyal Veri Merkezleri ve Enerji',
        desc: 'Dünyadaki internet trafiğinin ve yapay zekâ model eğitimlerinin çok büyük kısmı burada geçer. Yüksek performanslı GPU kümeleri, büyük su ve elektrik tüketimiyle çalışır.',
        eco: 'Devasa ısı salınımı, soğutma suyu ve karbon yükü',
        labor: '7/24 altyapı, güvenlik ve operasyon yönetimi',
        quote: 'Yapay zekâ modeli eğitmek, bir şehir gibi enerji ve su tüketir.',
        img: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80'
    },
    {
        id: 6,
        name: 'Singapore AI Training Cluster',
        mapLabel: 'Singapur Yapay Zekâ Kümesi',
        location: 'Singapur',
        coords: [103.82, 1.35],
        category: 'Model Eğitimi',
        title: '7. Büyük Dil Modeli Eğitimi',
        desc: 'Yapay zekâ sistemleri, zengin veri setleri üzerinde küresel çapta dağıtılmış GPU kümeleriyle eğitilir. Bu süreç, öğrenme için gerekli olan enerji ve bant genişliği maliyetini dramatik biçimde artırır.',
        eco: 'Yüksek enerji tüketimi ve su soğutma gereksinimi',
        labor: 'Mühendislik operasyonları, veri bilimciler ve altyapı ekipleri',
        quote: 'Bir modelin konuşma gücü, gerçekte çok sayıda ağın, enerji akışının ve operasyonel ısının sonucu olur.',
        img: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=800&q=80'
    },
    {
        id: 7,
        name: 'Tokyo & Seoul Device Layer',
        mapLabel: 'Tokyo ve Seul Cihaz Katmanı',
        location: 'Japonya & Güney Kore',
        coords: [139.69, 35.68],
        category: 'Kullanıcı Cihazları',
        title: '8. Son Kullanıcı Cihazları ve Uygulama Katmanı',
        desc: 'Telefonlar, masaüstü sistemler ve kişisel yardımcılar, modelin her gün yeniden kullanıldığı son kullanım noktalarıdır. Bu cihazlar aynı zamanda emisyon ve elektronik tüketim zincirinin parçası haline gelir.',
        eco: 'Hızlı teknoloji değişimi, tüketim döngüsü ve enerji kullanımı',
        labor: 'Üretim, montaj ve bakım iş gücü',
        quote: 'Yapay zekâ yalnızca sunucu odalarında değil; günlük hayatın en küçük ekranlarında da iş görür.',
        img: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80'
    },
    {
        id: 8,
        name: 'Agbogbloshie & Guiyu',
        mapLabel: 'Agbogbloshie ve Guiyu E-Atık Sahaları',
        location: 'Accra (Gana) & Guiyu (Çin)',
        coords: [-0.22, 5.55],
        category: 'E-Atık & Yok Oluş',
        title: '9. Elektronik Atık Mezarlığı',
        desc: 'Ömrü 2-3 yılda tükenen yapay zekâ sunucuları, akıllı cihazlar ve çipler Batı ülkelerinden e-atık olarak Afrika ve Asya\'daki hurdalıklara gönderilir. Kurşun, cıva ve diğer ağır metaller toprak ve nehire karışır.',
        eco: 'Toprak ve su kirliliği, toksik birikim ve ekolojik yıkım',
        labor: 'Kayıtsız yakma ve çıplak elle bakır ayrıştırma',
        quote: 'Bir cihazın yaşam döngüsü tüketiciyle bitmez; gelişmekte olan ülkelerin topraklarında son bulur.',
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
                <span>${node.title.replace(/^\d+\.\s*/, '')}</span>
            </button>
        `;
    }).join('');
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
        .scaleExtent([1, 18])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
            g.selectAll('.map-node').attr('transform', function () {
                const scale = 1 / event.transform.k;
                return `translate(${this.dataset.x}, ${this.dataset.y}) scale(${scale})`;
            });
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
        const source = projection(normalizeCoords(nodes[i].coords));
        const target = projection(normalizeCoords(nodes[i + 1].coords));
        const dx = target[0] - source[0];
        const dy = target[1] - source[1];
        const distance = Math.max(1, Math.hypot(dx, dy));
        const bend = Math.min(42, Math.max(12, distance * 0.08));
        const direction = i % 2 === 0 ? 1 : -1;
        const controlX = (source[0] + target[0]) / 2 - (dy / distance) * bend * direction;
        const controlY = (source[1] + target[1]) / 2 + (dx / distance) * bend * direction;

        arcsGroup.append('path')
            .attr('class', 'arc-line')
            .attr('data-index', i)
            .attr('d', `M${source[0]},${source[1]}Q${controlX},${controlY} ${target[0]},${target[1]}`)
            .attr('stroke-width', 2);
    }
}

function normalizeCoords(coords) {
    let [lng, lat] = coords;

    if (lng > 180) lng -= 360;
    if (lng < -180) lng += 360;

    return [lng, lat];
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
            .attr('class', `map-node cursor-pointer ${idx === activeIndex ? 'active' : ''}`)
            .attr('data-index', idx)
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
        line.classList.toggle('arc-focused', idx === index || idx === index - 1);
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
    g.selectAll('path').attr('d', path);

    g.selectAll('.nodes-layer').remove();
    g.selectAll('.arcs-layer').remove();
    drawFlowArcs();
    drawNodes();
    selectChapter(activeIndex);
}

window.onload = async function () {
    await loadNodes();
    renderChapterButtons();
    initMap();
};

window.onresize = function () {
    if (nodes.length) {
        initMap();
    }
};
