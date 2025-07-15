# API Endpoint untuk GeoJSON Boundaries

## Endpoint: GET /boundaries/bekasi

### Response Format:
```json
{
  "success": true,
  "message": "Data boundaries berhasil diambil",
  "data": {
    "kabupaten": {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "properties": {
            "name": "Bekasi",
            "admin_level": "6",
            "kode": "3216"
          },
          "geometry": {
            "type": "Polygon",
            "coordinates": [
              // Array koordinat polygon kabupaten bekasi
            ]
          }
        }
      ]
    },
    "kecamatan": {
      "type": "FeatureCollection", 
      "features": [
        {
          "type": "Feature",
          "properties": {
            "name": "Cikarang Barat",
            "admin_level": "7",
            "kode": "3216010"
          },
          "geometry": {
            "type": "Polygon",
            "coordinates": [
              // Array koordinat polygon kecamatan
            ]
          }
        },
        // ... kecamatan lainnya
      ]
    }
  }
}
```

## Contoh Implementasi Backend (Node.js/Express):

```javascript
// routes/boundaries.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// GET /boundaries/bekasi
router.get('/bekasi', async (req, res) => {
  try {
    // Path ke file GeoJSON
    const kabupatenPath = path.join(__dirname, '../data/geojson/bekasi_kabupaten.geojson');
    const kecamatanPath = path.join(__dirname, '../data/geojson/bekasi_kecamatan.geojson');
    
    // Baca file GeoJSON
    const kabupatenData = JSON.parse(fs.readFileSync(kabupatenPath, 'utf8'));
    const kecamatanData = JSON.parse(fs.readFileSync(kecamatanPath, 'utf8'));
    
    res.json({
      success: true,
      message: 'Data boundaries berhasil diambil',
      data: {
        kabupaten: kabupatenData,
        kecamatan: kecamatanData
      }
    });
  } catch (error) {
    console.error('Error fetching boundaries:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data boundaries',
      error: error.message
    });
  }
});

module.exports = router;
```

## Optimasi untuk Performa:

1. **Caching**: Implementasi caching di backend untuk menghindari membaca file berulang kali
2. **Compression**: Gunakan compression middleware untuk mengurangi ukuran response
3. **CDN**: Pertimbangkan untuk host file GeoJSON di CDN
4. **Lazy Loading**: Load boundaries hanya ketika dibutuhkan (sudah diimplementasi di frontend)

```javascript
// Contoh dengan caching
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 }); // Cache selama 1 jam

router.get('/bekasi', async (req, res) => {
  try {
    // Cek cache terlebih dahulu
    const cacheKey = 'bekasi-boundaries';
    let boundaries = cache.get(cacheKey);
    
    if (!boundaries) {
      // Jika tidak ada di cache, baca dari file
      const kabupatenData = JSON.parse(fs.readFileSync(kabupatenPath, 'utf8'));
      const kecamatanData = JSON.parse(fs.readFileSync(kecamatanPath, 'utf8'));
      
      boundaries = {
        kabupaten: kabupatenData,
        kecamatan: kecamatanData
      };
      
      // Simpan ke cache
      cache.set(cacheKey, boundaries);
    }
    
    res.json({
      success: true,
      message: 'Data boundaries berhasil diambil',
      data: boundaries
    });
  } catch (error) {
    // Error handling
  }
});
```

## Tips untuk File GeoJSON:

1. **Simplifikasi**: Gunakan tool seperti mapshaper.org untuk menyederhanakan geometri
2. **Compression**: Pastikan server menggunakan gzip compression
3. **Format**: Pastikan file GeoJSON valid menggunakan validator online
4. **Koordinat**: Gunakan presisi yang sesuai (biasanya 6 decimal places cukup)

## Testing:

Test endpoint dengan curl:
```bash
curl -X GET "http://localhost:3000/api/boundaries/bekasi" \
  -H "Content-Type: application/json"
```
