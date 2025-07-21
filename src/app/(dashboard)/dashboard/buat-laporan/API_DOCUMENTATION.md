# API Documentation - Laporan AA Report Generator

## Overview
API untuk menggenerate laporan statistik pengaduan masyarakat dengan data dinamis berdasarkan parameter tanggal dan filter yang diberikan.

## Endpoints

### 1. GET /api/reports/data
**Deskripsi**: Mengambil data laporan berdasarkan parameter filter

**Query Parameters**:
- `startDate` (string, required): Tanggal mulai (format: YYYY-MM-DD)
- `endDate` (string, required): Tanggal akhir (format: YYYY-MM-DD)  
- `period` (string, optional): Preset periode (Harian, Mingguan, Bulanan, Tahunan, Custom)
- `reportGeneratedAt` (string, optional): Timestamp pembuatan laporan (format: DD MMMM YYYY | HH.mm WIB)

**Response**:
```json
{
  "success": true,
  "data": {
    "template": {
      "title": "LAPORAN STATISTIK PENGADUAN MASYARAKAT",
      "subtitle": "Kabupaten Bekasi",
      "period": "Custom",
      "startDate": "2025-06-21",
      "endDate": "2025-07-21",
      "reportGeneratedAt": "21 Juli 2025 | 14.30 WIB",
      "summary": {
        "totalReports": 583,
        "resolvedReports": 492,
        "averageResolutionDays": 5,
        "pendingReports": 91,
        "resolutionRate": 84
      }
    },
    "chartData": {
      "trendData": [...],
      "locationData": [...],
      "agencyData": [...],
      "categoryData": [...],
      "satisfactionData": [...]
    },
    "mapData": {
      "markers": [...]
    }
  }
}
```

### 2. POST /api/reports/generate
**Deskripsi**: Generate laporan PDF (future enhancement)

**Request Body**:
```json
{
  "template": { /* ReportTemplate object */ },
  "selectedPages": ["cover", "summary", "chart", "map", "location", "agency", "category", "satisfaction", "closing"],
  "options": {
    "format": "pdf",
    "orientation": "landscape"
  }
}
```

## Data Types

### ReportTemplate
```typescript
interface ReportTemplate {
    title: string;
    subtitle: string;
    period: string;
    year: number;
    month: number;
    startDate: string;  // Format: YYYY-MM-DD
    endDate: string;    // Format: YYYY-MM-DD
    reportGeneratedAt: string;  // Format: DD MMMM YYYY | HH.mm WIB
    reportGeneratedDateTime: Dayjs;
    coverData?: {
        logoPath: string;
        maskotPath: string;
        dinasName: string;
        weekInfo: string;
    };
    summary?: {
        totalReports: number;
        resolvedReports: number;
        averageResolutionDays: number;
        pendingReports: number;
        resolutionRate: number;
    };
}
```

## Implementation Plan

### Phase 1: Frontend Integration ✅
- [x] Dynamic date system in all components
- [x] Template props passing to all pages
- [x] Date picker for report generation time
- [x] Common interface for ReportTemplate

### Phase 2: Backend API Development (Next)
- [ ] Create backend endpoint `/api/reports/data`
- [ ] Database queries for statistics
- [ ] Date range filtering
- [ ] Response formatting

### Phase 3: Data Integration (Final)
- [ ] Replace dummy data with real API calls
- [ ] Loading states during API fetch
- [ ] Error handling
- [ ] Cache implementation

## Usage Example

```typescript
// Frontend API call
const fetchReportData = async (startDate: string, endDate: string) => {
  const response = await fetch(`/api/reports/data?startDate=${startDate}&endDate=${endDate}`);
  const data = await response.json();
  return data.template;
};

// Update template with API data
const handleGenerateReport = async () => {
  const apiData = await fetchReportData(template.startDate, template.endDate);
  setTemplate(prev => ({
    ...prev,
    ...apiData
  }));
};
```

## Files Modified
1. `types/ReportTemplate.ts` - Common interface
2. `page.tsx` - Main page with date system
3. `components/ReportPageWrapper.tsx` - Dynamic date display
4. `components/ReportContentWrapper.tsx` - Footer date
5. All `Page*.tsx` components - Template props support

## Next Steps
1. Implement backend API endpoints
2. Connect frontend to real data
3. Add loading and error states
4. Add validation for date ranges
5. Implement PDF generation API
