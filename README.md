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
- GitHub Pages için statik yayın

---

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
│   │   └── nodes.json
│   └── js/
│       └── app.js
├── LICENSE
└── README.md
```

---

## Kaynakça

Bu çalışma, aşağıdaki akademik ve sanatsal araştırmalara dayanan eğitim ve veri gazeteciliği amaçlı bir projedir:

- Crawford, K. (2021). [Atlas of AI: Power, Politics, and the Planetary Costs of Artificial Intelligence](https://katecrawford.net/atlas). Yale University Press.
- Joler, V., & Parikka, J. (2018). [Anatomy of an AI System: The Amazon Echo as an anatomical map of human labor, data and planetary resources](https://anatomyof.ai/). Share Lab & AI Now Institute.

## Lisans

Bu proje [Apache 2.0 lisansıyla](./LICENSE) açık kaynak olarak yayımlanmıştır; katkı, geri bildirim ve geliştirmeler için GitHub repomuzu ziyaret edebilirsiniz.

## Geliştirme Sırası

1. Kategori filtresi eklemek: ham madde, üretim, insan emeği, veri merkezi ve e-atık kategorilerini ayrı ayrı göstermek.
2. Scrollytelling akışı kurmak: kullanıcı aşağı kaydırdıkça ilgili düğüme odaklanması ve haritanın o bölüme zoomlaması.
3. Akış çizgileri ve tooltip geliştirmek: bağlantıları daha net göstermek, animasyon eklemek ve her düğüm için daha zengin mini veri kartları hazırlamak.
