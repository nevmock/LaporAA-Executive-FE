# Media Pendukung Component Documentation

## Overview
Komponen **Media Pendukung** adalah penggantian dari "Foto Pendukung" yang sekarang mendukung berbagai jenis file media dengan preview yang sesuai.

## Fitur Yang Didukung

### Jenis File
1. **Gambar**: JPG, JPEG, PNG, GIF, WebP, BMP
2. **Video**: MP4, AVI, MOV, MKV, WebM, 3GP
3. **Dokumen**: PDF

### Batasan File
- **Maksimal file**: 5 file
- **Ukuran maksimal**: 
  - Gambar/PDF: 5MB
  - Video: 10MB

## Perubahan yang Dilakukan

### 1. Import Icons
```tsx
import { Plus, FileText, Video, Download } from "lucide-react";
```

### 2. Konstanta
```tsx
const MAX_MEDIA = 5; // Mengganti MAX_PHOTOS
```

### 3. Helper Functions
```tsx
const getFileInfo = (filePath: string) => {
    const extension = filePath.toLowerCase().split('.').pop() || '';
    const fileName = filePath.split('/').pop() || '';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)) {
        return { type: 'image', extension, fileName };
    } else if (['mp4', 'avi', 'mov', 'mkv', 'webm', '3gp'].includes(extension)) {
        return { type: 'video', extension, fileName };
    } else if (extension === 'pdf') {
        return { type: 'pdf', extension, fileName };
    } else {
        return { type: 'other', extension, fileName };
    }
};
```

### 4. MediaPreview Component
Komponen ini menampilkan preview yang berbeda berdasarkan jenis file:

- **Gambar**: Preview image dengan Image component
- **Video**: Icon video dengan ekstensi file
- **PDF**: Icon document dengan label PDF
- **File lain**: Icon download dengan ekstensi file

Setiap preview memiliki:
- Tombol hapus (X) di pojok kanan atas
- Overlay dengan tombol lihat (👁️) dan download (💾)
- Click handler untuk membuka file di tab baru

### 5. Upload Handler
```tsx
const handleMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Validasi jenis file
    const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
        'video/mp4', 'video/avi', 'video/mov', 'video/mkv', 'video/webm', 'video/3gp',
        'application/pdf'
    ];

    // Validasi ukuran file
    const maxSize = file.type.startsWith('video/') ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    
    // Upload ke backend
    const res = await axios.post(`${API_URL}/api/upload-tindakan`, formDataUpload);
};
```

## UI Changes

### Label
```tsx
<label className="col-span-1 font-medium">Media Pendukung
    <span className="text-red-500">*</span>
    <p className="text-gray-500">(Evidence Tindak Lanjut dari SP4N Lapor)</p>
    <p className="text-xs text-blue-600 mt-1">Foto, Video, PDF</p>
</label>
```

### File Input
```tsx
<input
    type="file"
    accept="image/*,video/*,application/pdf"
    multiple
    className="hidden"
    ref={fileRef}
    onChange={handleMediaSelect}
/>
```

### Preview Grid
Menggunakan `MediaPreview` component untuk setiap file yang diupload, dengan tampilan yang berbeda untuk setiap jenis file.

### Info Text
```tsx
<div className="text-xs text-gray-500 space-y-1">
    <p>• Maksimal {MAX_MEDIA} file</p>
    <p>• Format: Gambar (JPG, PNG, GIF, WebP), Video (MP4, AVI, MOV, MKV), PDF</p>
    <p>• Ukuran: Max 5MB untuk gambar/PDF, 10MB untuk video</p>
</div>
```

## Error Handling

1. **Validasi jenis file**: Alert jika file tidak didukung
2. **Validasi ukuran**: Alert jika file terlalu besar
3. **Error upload**: Alert jika gagal upload
4. **Timeout handling**: 30 detik timeout untuk operasi save

## Backend Requirements

Backend harus mendukung:
1. Upload multiple file types di endpoint `/api/upload-tindakan`
2. Serving file dengan URL yang benar
3. Validasi file type dan size di server side

## Testing

Komponen ini dapat ditest dengan:
1. Upload berbagai jenis file
2. Preview file yang berbeda
3. Download dan view functionality
4. Error handling untuk file yang tidak valid
5. Size limitation testing

### Manual Testing Checklist
- [ ] Upload JPG, PNG, GIF, WebP images → Should show image preview
- [ ] Upload MP4, AVI, MOV videos → Should show video icon
- [ ] Upload PDF documents → Should show document icon
- [ ] Try upload 6+ files → Should show error
- [ ] Try upload large video (>10MB) → Should show error
- [ ] Try upload large image (>5MB) → Should show error
- [ ] Try upload .txt file → Should show error
- [ ] Click view button → Should open file in new tab
- [ ] Click download button → Should download file
- [ ] Click remove button → Should remove file from list
- [ ] Save form dengan media → Should persist media

## Browser Compatibility

- Modern browsers yang mendukung:
  - File API
  - FormData
  - HTML5 video/audio
  - CSS3 transitions

## Performance Considerations

1. **File size validation** di client side untuk mengurangi upload yang tidak perlu
2. **Preview optimization** dengan ukuran thumbnail yang sesuai
3. **Lazy loading** untuk video preview jika diperlukan di masa depan
