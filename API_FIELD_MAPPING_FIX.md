# API Field Mapping Fix - Force Mode

## Masalah yang Diperbaiki

Bot mode switch di TableSection tidak menampilkan status yang benar karena mapping field API response yang salah.

## API Response Actual

```json
{
    "from": "6281385138754",
    "mode": "manual",
    "effectiveMode": "manual",
    "forceModeManual": true,  // <-- Field yang benar
    "manualModeUntil": null,
    "isManualModeExpired": null,
    "timeLeft": null
}
```

## Perubahan yang Dilakukan

### 1. BotModeService (`/src/services/botModeService.ts`)

**Sebelum:**
```typescript
const forceMode = response.data?.forceMode || response.data?.force || false;
```

**Sesudah:**
```typescript
const forceMode = response.data?.forceModeManual || response.data?.forceMode || response.data?.force || false;
```

### 2. Laporan Component (`/src/components/pengaduan/laporan.tsx`)

**Sebelum:**
```typescript
force: response.data?.forceMode || response.data?.force || false 
```

**Sesudah:**
```typescript
force: response.data?.forceModeManual || response.data?.forceMode || response.data?.force || false 
```

### 3. Message Component Refactor

- Menghapus redundant force mode checking yang menyebabkan infinite loop
- Force mode sekarang diterima sebagai prop dari parent component
- Mengurangi duplicate API calls `/mode/{from}`

**Interface MessageProps:**
```typescript
interface MessageProps {
    from: string;
    mode: "bot" | "manual";
    onModeChange?: (newMode: "bot" | "manual") => void;
    forceMode?: boolean; // <-- Prop baru
}
```

**Parent component mengirim forceMode:**
```typescript
<MemoMessage 
  from={data?.from || ""} 
  mode={botMode.mode} 
  onModeChange={handleModeChange}
  forceMode={botMode.forceMode} // <-- Prop dikirim dari useBotModeWithTab
/>
```

## Benefit

1. **Field Mapping yang Benar**: Switch force mode sekarang menampilkan status yang akurat sesuai API response
2. **Menghilangkan Infinite Loop**: Menghapus redundant API calls yang menyebabkan loop pada `/mode/{from}`
3. **Konsistensi Data**: Single source of truth untuk force mode status
4. **Performa**: Mengurangi duplicate API calls dengan menggunakan cache dan prop passing

## Testing

Untuk memastikan fix berfungsi:

1. Buka halaman Pengaduan
2. Periksa kolom "Bot Switch" - switch harus menampilkan status yang benar sesuai API
3. Periksa Network Tab - tidak ada lagi infinite loop pada endpoint `/mode/{from}`
4. Test toggle switch - perubahan harus tersimpan dan ditampilkan dengan benar

## Backward Compatibility

Kode tetap kompatibel dengan API response lama melalui fallback chain:
```typescript
response.data?.forceModeManual || response.data?.forceMode || response.data?.force || false
```
