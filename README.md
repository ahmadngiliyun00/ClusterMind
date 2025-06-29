# ClusterMind

**Empower Your Data. Discover New Segments. Unlock Insights.**

ClusterMind adalah aplikasi web interaktif yang dirancang untuk membantu Anda melakukan clustering data secara mudah dan cepat menggunakan algoritma K-Means dengan Z-score normalization dan Euclidean distance. Analisis data Anda langsung di browser, tanpa perlu menginstal software tambahan.

![ClusterMind Screenshot](https://via.placeholder.com/800x400/6366F1/FFFFFF?text=ClusterMind+Dashboard)

## ✨ Fitur Utama

### 🧠 K-Means + Z-Score
- Clustering dengan normalisasi Z-score dan Euclidean distance untuk hasil yang optimal
- Algoritma K-Means yang berjalan langsung di browser
- Preprocessing data otomatis dengan label encoding untuk data kategorikal

### 📊 Metrik Lengkap
- **Davies-Bouldin Index**: Evaluasi kualitas cluster (semakin kecil semakin baik)
- **Within-Centroid Distance**: Jarak rata-rata dari titik ke centroid cluster
- **Per-Cluster Metrics**: Analisis detail untuk setiap cluster
- **Elbow Method**: Penentuan jumlah cluster optimal

### 📈 Visualisasi Interaktif
- Scatter plot untuk visualisasi cluster dalam 2D
- Bar chart untuk distribusi ukuran cluster
- Grafik Elbow Method untuk analisis optimal K
- Tabel hasil yang dapat difilter dan dipaginasi

### 📁 Multi Format Support
- **CSV**: Dengan pemilihan separator (koma, titik koma, tab, pipe)
- **Excel**: Format XLS dan XLSX
- **Auto-detection**: Deteksi otomatis tipe kolom (numerik/kategorikal)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm atau yarn

### Installation

1. **Clone repository**
```bash
git clone https://github.com/yourusername/clustermind.git
cd clustermind
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

4. **Open browser**
```
http://localhost:5173
```

### Build for Production
```bash
npm run build
npm run preview
```

## 📖 Cara Penggunaan

### 1. Upload Data
- Drag & drop atau pilih file CSV/Excel
- Untuk CSV, pilih separator yang sesuai
- File harus memiliki header dan minimal 2 kolom numerik

### 2. Preview & Preprocessing
- Review struktur data dan tipe kolom
- Konversi data kategorikal ke numerik (label encoding)
- Normalisasi dengan Z-score transformation

### 3. Konfigurasi Clustering
- Tentukan jumlah eksperimen (minimal 5)
- Set nilai K untuk setiap eksperimen
- Jalankan clustering dengan algoritma K-Means

### 4. Analisis Hasil
- Bandingkan metrik antar eksperimen
- Visualisasi cluster dalam scatter plot
- Export hasil ke CSV

### 5. Elbow Method
- Analisis grafik WCSS vs K
- Temukan jumlah cluster optimal
- Rekomendasi berdasarkan titik elbow

## 🎯 Use Cases

### 🛍️ Segmentasi Pelanggan
Kelompokkan pelanggan berdasarkan:
- Perilaku pembelian
- Demografi
- Pola transaksi
- Preferensi produk

### 🎓 Analisis Data Pendidikan
Identifikasi pola dalam:
- Performa akademik siswa
- Gaya belajar
- Tingkat keterlibatan
- Hasil evaluasi

### 🔬 Riset & Eksperimen
Analisis data untuk:
- Penelitian akademik
- Eksperimen machine learning
- Analisis pola tersembunyi
- Validasi hipotesis

### 💼 Business Intelligence
Clustering untuk:
- Analisis pasar
- Segmentasi produk
- Optimasi strategi
- Identifikasi peluang

## 🛠️ Teknologi

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool

### Data Processing
- **ml-kmeans** - K-Means clustering algorithm
- **PapaParse** - CSV parsing
- **XLSX** - Excel file processing
- **Recharts** - Data visualization

### Algorithms
- **K-Means Clustering** - Unsupervised learning
- **Z-Score Normalization** - Data standardization
- **Euclidean Distance** - Distance metric
- **Label Encoding** - Categorical data conversion

## 📊 Metrik Evaluasi

### Davies-Bouldin Index
- **Range**: 0 hingga ∞
- **Interpretasi**: Semakin kecil semakin baik
- **Fungsi**: Mengukur separasi antar cluster dan kompaktness dalam cluster

### Within-Centroid Distance
- **Satuan**: Euclidean distance
- **Interpretasi**: Semakin kecil semakin kompak
- **Fungsi**: Rata-rata jarak titik ke centroid cluster-nya

### Within-Cluster Sum of Squares (WCSS)
- **Fungsi**: Untuk Elbow Method
- **Interpretasi**: Penurunan signifikan menunjukkan K optimal
- **Visualisasi**: Grafik WCSS vs K

## 🔧 Konfigurasi

### Supported File Formats
```
CSV: .csv (dengan berbagai separator)
Excel: .xls, .xlsx
```

### Data Requirements
- Minimal 2 baris data
- Header wajib ada
- Minimal 1 kolom numerik untuk clustering
- Data kategorikal akan dikonversi otomatis

### Clustering Parameters
- **K minimum**: 2
- **K maksimum**: min(10, jumlah_data/3)
- **Max iterations**: 100
- **Initialization**: Random
- **Distance function**: Euclidean

## 📁 Struktur Project

```
clustermind/
├── src/
│   ├── components/          # React components
│   │   ├── FileUpload.tsx
│   │   ├── DataPreview.tsx
│   │   ├── ClusterExperiments.tsx
│   │   ├── ClusterResult.tsx
│   │   ├── Visualization.tsx
│   │   └── ElbowAnalysis.tsx
│   ├── utils/              # Utility functions
│   │   ├── csv.ts          # File parsing
│   │   ├── clustering.ts   # K-Means algorithm
│   │   └── preprocessing.ts # Data preprocessing
│   ├── App.tsx             # Main application
│   └── main.tsx            # Entry point
├── public/                 # Static assets
├── dist/                   # Build output
└── README.md              # Documentation
```

## 🤝 Contributing

Kontribusi sangat diterima! Silakan:

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Development Guidelines
- Gunakan TypeScript untuk type safety
- Follow existing code style
- Add tests untuk fitur baru
- Update dokumentasi jika diperlukan

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

## 🙏 Acknowledgments

- [ml-kmeans](https://github.com/mljs/kmeans) - K-Means clustering implementation
- [PapaParse](https://www.papaparse.com/) - CSV parsing library
- [Recharts](https://recharts.org/) - Chart library for React
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Lucide React](https://lucide.dev/) - Beautiful icons

## 📞 Support

Jika Anda mengalami masalah atau memiliki pertanyaan:

- 🐛 [Report Bug](https://github.com/yourusername/clustermind/issues)
- 💡 [Request Feature](https://github.com/yourusername/clustermind/issues)
- 📧 Email: support@clustermind.app

---

**ClusterMind** - Transforming data into actionable insights through intelligent clustering.

*Made with ❤️ for data enthusiasts and researchers worldwide.*