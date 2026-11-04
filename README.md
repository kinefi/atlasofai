[![GitHub Pages](https://img.shields.io/badge/Live_Demo-GitHub_Pages-2ea44f?style=for-the-badge&logo=github)](https://kinefi.github.io/atlasofai)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=for-the-badge)](LICENSE)

# Yapay Zekâ Atlası

Yapay zekânın arkasındaki gizli fiziksel altyapıları, ekolojik maliyetleri ve insan emeğini küresel bir harita üzerinde anlatan interaktif bir veri gazeteciliği projesidir.

Bu çalışma, yapay zekâyı soyut bir "bulut" olarak ele almak yerine, bir yapay zekâ sisteminin ham madde çıkarımından elektronik atık sahalarına kadar uzanan tüm yaşam döngüsünü (cradle-to-grave) görselleştirir.

---

## Proje Hakkında

Bu çalışma, yapay zekâ sistemlerinin görünmeyen öncüllerini haritalandırır:

- maden çıkarımı ve su tüketimi,
- yarı iletken üretimi ve enerji yoğunluğu,
- insan emeği ve veri etiketleme,
- veri merkezleri ve e-atık döngüsü.

Amaç, yapay zekâ'nın "saf bir dijital araç" değil; doğa, iş gücü ve coğrafya üzerinde gerçek bir fiziksel altyapı etkisi yaratan bir sistem olduğunu göstermektir.

---

## Teknoloji Yığını

- HTML5
- Tailwind CSS
- D3.js ve TopoJSON
- Harita (`map.js`), arayüz (`ui.js`) ve ortam sesi (`audio.js`) için ES modülleri
- GitHub Pages için statik yayın

## Harici Kütüphaneler ve Veriler

Uygulama harita kütüphanelerini CDN üzerinden yükler; harita için internet bağlantısı gerekir. Yazı tipleri işletim sisteminin yerleşik serif ve monospace fontlarını kullanır.

- [Tailwind CSS Play CDN](https://tailwindcss.com/docs/installation/play-cdn)
- [D3.js](https://d3js.org/) v7
- [TopoJSON Client](https://github.com/topojson/topojson-client) v3
- [World Atlas](https://github.com/topojson/world-atlas) ülke sınırları
- [Font Awesome](https://fontawesome.com/) 6.4

## Kullanım

- Harita üzerindeki katman düğmelerini kullanarak aşamaları filtreleyin.
- Aşama listesinden bir düğüm seçin veya listede kaydırarak haritayı ve bilgi panelini güncelleyin; kaydırma haritayı ilgili konuma odaklar.
- Önceki/sonraki düğmeleriyle ilerleyin ya da slayt gösterisini başlatın; otomatik geçiş aralığı 4 saniyedir.
- İsteğe bağlı tarayıcı sentezli sesi düğmeye tıklayarak açın; aşama değiştikçe ses profili de değişir. Ses için tarayıcının Web Audio desteği gerekir. Tarayıcı sesi başlatmazsa düğmenin yanında hata bilgisi gösterilir.
- Küre görünümünde haritayı sürükleyerek döndürün. Düz haritada sürükleme ve yakınlaştırma kullanılabilir.
- Bilgi panelindeki görsele tıklayarak büyütün; ilgili konu için Vikipedi bağlantısını açın.

## GitHub Pages ile Yayınlama

Bu proje tek sayfalık bir statik web uygulamasıdır; GitHub Pages üzerinden doğrudan yayınlanabilir:

1. GitHub üzerinde bir repository oluşturun.
2. `index.html` ve varsa `assets/` klasörlerini ana dala ekleyin.
3. GitHub deposunda `Settings > Pages` menüsüne girin.
4. Source olarak `Deploy from a branch` seçin ve `main` branch ile `root` klasörünü kullanın.
5. Site adresi şu formatta oluşur: `https://kinefi.github.io/atlasofai`

---

## Proje Yapısı

```text
atlasofai/
├── index.html
├── assets/
│   ├── css/
│   │   └── styles.css
│   ├── data/
│   │   ├── nodes.json
│   │   └── sources.json
│   └── js/
│       ├── audio.js
│       ├── map.js
│       └── ui.js
├── LICENSE
└── README.md
```

---

## Yeni Aşama Ekleme

Haritadaki aşama kaynakları [assets/data/sources.json](assets/data/sources.json) dosyasında tutulur; her düğüm bunlara `sourceIds` ile bağlanır. Kaynakların aşamaya özgü atıfları bilgi panelinde gösterilir. Filistin'deki yüz tanıma ve Gazze'deki hedef belirleme aşamaları, kendi rapor ve haber kaynaklarına bağlanır; haberlerde aktarılan iddialar ile resmî yanıtlar açıklama metninde birbirinden ayrılır.

Yeni bir aşama eklerken `nodes.json` içinde benzersiz bir `id`, harita koordinatı, `nextNodeIds` ve `sourceIds` tanımlayın; `sources.json` içine de kaynak künyesini ekleyin. `nextNodeIds` birden fazla bağlantıya izin verir; böylece harita paralel veri, donanım ve kullanım akışlarını gösterebilir. Aşamalar listedeki sıralarına göre numaralandırılır.

Katman filtreleri haritanın üst kısmından yönetilir; aşama listesini kaydırmak seçili aşamayı ve harita odağını günceller. Küre görünümünde akışlar jeodezik çizilir. Harita düğümleri odaklanabilir; araç ipuçları aşama bilgisini ve varsa mikro grafiği gösterir. İsteğe bağlı ses Web Audio API ile tarayıcıda sentezlenir, harici ses dosyası kullanmaz ve ses profili aşama değiştikçe güncellenir.

Su ayak izi, veri merkezleri ile model eğitimi arasında ayrı bir aşamadır. Grafikteki 2027 küresel su çekimi tahmini Li ve diğerlerinin çalışmasına dayanır; haritadaki düğüm şematiktir ve değerler tek bir veri merkezine ait değildir. Çalışmadaki su çekimi tahmini, GPT-3 eğitimi için verilen doğrudan su tüketimi tahmininden ayrı bir ölçüttür.

Yeni bir aşamada ses profilini `soundProfile` alanıyla seçin (`mining`, `refining`, `chip-design`, `fabrication`, `data`, `annotation`, `data-center`, `water`, `training`, `use`, `surveillance`, `military` veya `e-waste`). Kaynaklı sayısal gösterimler düğümlere `chart` alanıyla eklenir ve dayandıkları kaynak `chart.sourceIds` içinde belirtilir.

## Kaynakça

Bu çalışma, aşağıdaki akademik ve sanatsal araştırmalara dayanan eğitim ve veri gazeteciliği amaçlı bir projedir:

- Crawford, K. (2021). [Atlas of AI: Power, Politics, and the Planetary Costs of Artificial Intelligence](https://katecrawford.net/atlas). Yale University Press.
- Crawford, K., & Joler, V. (2018). [Anatomy of an AI System: The Amazon Echo as an anatomical map of human labor, data and planetary resources](https://anatomyof.ai/). Share Lab & AI Now Institute.

## Lisans

Bu proje [Apache 2.0 lisansıyla](./LICENSE) açık kaynak olarak yayımlanmıştır; katkı, geri bildirim ve geliştirmeler için GitHub repomuzu ziyaret edebilirsiniz.
