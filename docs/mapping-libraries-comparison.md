# Perbandingan Mapping Libraries untuk Visualisasi Boundaries

## Masalah dengan Leaflet Saat Ini
- Dark overlay menggunakan polygon dengan holes kurang smooth
- Boundaries visualization terbatas
- Masking effect tidak optimal
- Styling boundaries kurang fleksibel

## Alternatif Libraries

### 1. **Mapbox GL JS** (RECOMMENDED)
**Kelebihan:**
- **Vector-based rendering** - boundaries lebih smooth dan crisp
- **Advanced styling** dengan Mapbox Style Spec
- **Layer masking** native support
- **Fill-extrusion** untuk 3D effect
- **Data-driven styling** yang powerful
- **Performance** sangat baik untuk polygon kompleks
- **Custom shaders** untuk effect khusus

**Fitur untuk Boundaries:**
- `fill-opacity-transition` untuk smooth hover effects
- `fill-pattern` untuk texture
- `line-gradient` untuk boundary styling
- `fill-extrusion-height` untuk 3D boundaries
- Native `mask` layer untuk menggelapkan area luar

**Implementasi Dark Overlay:**
```javascript
// Layer untuk area gelap (seluruh dunia)
map.addLayer({
  id: 'dark-overlay',
  type: 'fill',
  source: 'world-boundaries',
  paint: {
    'fill-color': '#000000',
    'fill-opacity': 0.7
  }
});

// Layer untuk Kabupaten Bekasi (bright area)
map.addLayer({
  id: 'bekasi-highlight',
  type: 'fill',
  source: 'bekasi-boundaries',
  paint: {
    'fill-color': 'transparent',
    'fill-opacity': 1
  }
});

// Menggunakan layer mask
map.setLayoutProperty('dark-overlay', 'visibility', 'visible');
map.setPaintProperty('dark-overlay', 'fill-opacity', [
  'case',
  ['boolean', ['feature-state', 'hover'], false],
  0.9,
  0.7
]);
```

### 2. **Google Maps JavaScript API**
**Kelebihan:**
- **Satellite imagery** yang sangat detail
- **GroundOverlay** untuk custom masking
- **Data Layer** untuk GeoJSON dengan styling advanced
- **Drawing tools** built-in

**Fitur untuk Boundaries:**
- `Data.setStyle()` dengan function-based styling
- `GroundOverlay` untuk masking effects
- `Rectangle` dan `Polygon` dengan advanced options

### 3. **OpenLayers**
**Kelebihan:**
- **Open source** dan free
- **Vector layers** dengan advanced rendering
- **Masking** menggunakan clip geometries
- **WMS/WFS** support untuk server-side boundaries
- **Projection** support yang lengkap

### 4. **Deck.gl**
**Kelebihan:**
- **WebGL-based** rendering
- **3D visualization** capabilities
- **Large dataset** handling
- **Real-time** animation support
- **Masking layers** dengan WebGL shaders

## Rekomendasi: Mapbox GL JS

### Mengapa Mapbox GL JS?
1. **Vector Tiles**: Boundaries akan ter-render smooth di semua zoom level
2. **Native Masking**: Fitur `fill-opacity` dan layer masking yang powerful
3. **Performance**: WebGL rendering untuk handling polygon kompleks
4. **Styling**: JSON-based styling yang sangat fleksibel
5. **Dark Theme**: Built-in dark map styles
6. **Community**: Dokumentasi lengkap dan community besar

### Contoh Implementasi Dark Overlay dengan Mapbox:

```javascript
// Style JSON untuk dark masking effect
const mapStyle = {
  version: 8,
  sources: {
    'world': {
      type: 'geojson',
      data: worldBoundaries // Polygon seluruh dunia
    },
    'bekasi': {
      type: 'geojson', 
      data: bekasiGeoJSON
    }
  },
  layers: [
    {
      id: 'base-map',
      type: 'raster',
      source: 'mapbox://mapbox.streets'
    },
    {
      id: 'dark-mask',
      type: 'fill',
      source: 'world',
      paint: {
        'fill-color': '#000000',
        'fill-opacity': 0.6
      }
    },
    {
      id: 'bekasi-cutout',
      type: 'fill',
      source: 'bekasi',
      paint: {
        'fill-color': 'transparent',
        'fill-opacity': 0
      },
      // Ini akan "memotong" dark mask
      layout: {
        'fill-sort-key': 2
      }
    },
    {
      id: 'bekasi-boundaries',
      type: 'line',
      source: 'bekasi',
      paint: {
        'line-color': '#3B82F6',
        'line-width': 2,
        'line-opacity': 1
      }
    }
  ]
};
```

### Migration Steps dari Leaflet ke Mapbox:

1. **Setup Mapbox**:
   ```bash
   npm install mapbox-gl react-map-gl
   ```

2. **Environment Variables**:
   ```env
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_token_here
   ```

3. **Component Structure**:
   ```typescript
   import Map, { Source, Layer, Marker, Popup } from 'react-map-gl';
   import 'mapbox-gl/dist/mapbox-gl.css';
   ```

4. **Key Changes**:
   - Replace `MapContainer` with `Map`
   - Replace `GeoJSON` with `Source` + `Layer`
   - Update styling dari Leaflet style ke Mapbox paint properties
   - Handle events dengan Mapbox event system

### Performance Benefits:
- **Vector rendering**: Boundaries tidak pixelated saat zoom
- **GPU acceleration**: Smooth interactions dan animations
- **Layer compositing**: Dark overlay lebih efisien
- **Memory management**: Better handling untuk large GeoJSON

### Cost Consideration:
- Mapbox GL JS: Free tier 50,000 map loads/month
- Google Maps: $7/1000 map loads setelah $200 kredit
- OpenLayers: Gratis tapi perlu hosting tiles sendiri

## Kesimpulan
**Mapbox GL JS** adalah pilihan terbaik untuk kebutuhan Anda karena:
1. Dark overlay effect yang native dan smooth
2. Vector boundaries yang crisp
3. Advanced styling capabilities
4. Good performance untuk polygon kompleks
5. Dokumentasi dan contoh yang lengkap

Apakah Anda ingin saya implementasikan migrasi ke Mapbox GL JS?
