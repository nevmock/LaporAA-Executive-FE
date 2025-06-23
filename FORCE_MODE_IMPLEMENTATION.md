# 🚀 Force Mode Implementation - WhatsApp Bot Management

## 📋 Overview

Implementasi force mode untuk mengelola mode bot WhatsApp sesuai dokumentasi API terbaru. Force mode adalah saklar utama yang memberikan kontrol penuh kepada admin untuk mengatur mode bot tanpa timeout.

## 🎯 Fitur Utama

### 1. **Force Mode (Saklar Utama)**
- ❌ **TANPA TIMEOUT** - Permanen sampai admin matikan
- 🔴 **Override semua mode switching** - Jika aktif, mode manual tetap walau masuk/keluar halaman message
- 🎛 **Toggle switch di TableSection** - Kolom "Bot Switch" untuk setiap user

### 2. **Manual Mode dengan Timeout**
- ✅ **ADA TIMEOUT** - Auto-expire kembali ke bot mode (default: 30 menit)
- 🕐 **Auto-aktif saat masuk halaman message** - Jika force mode tidak aktif
- 💡 **Protection** - Tidak bisa set manual mode jika force mode aktif

### 3. **UI Integration**
- 🔴/🟢 **Visual indicator** - Merah = Bot OFF (Force), Hijau = Bot ON
- ⚡ **Loading states** - Spinner saat toggle dalam proses
- 🔒 **Role-based access** - Hanya Bupati/SuperAdmin yang bisa toggle

## 🔧 API Endpoints

| Endpoint | Method | Purpose | Timeout |
|----------|--------|---------|---------|
| `/mode/force/:from` | POST | Toggle force mode | ❌ Tidak ada |
| `/mode/manual/:from` | POST | Set manual mode | ✅ 30 menit |
| `/mode/:from` | GET | Get mode info | - |

## 📁 Files Modified

### 1. **BotModeService** (`/src/services/botModeService.ts`)
```typescript
// New Methods Added:
- setForceMode(from: string, force: boolean): Promise<void>
- setManualMode(from: string, minutes?: number): Promise<void>
- getForceMode(from: string): Promise<boolean>
- isManualModeActive(from: string): Promise<boolean>
```

### 2. **useBotMode Hook** (`/src/hooks/useBotMode.ts`)
```typescript
// Enhanced Features:
- Force mode state management
- Manual mode with timeout (30 minutes)
- Automatic mode switching with force mode protection
- Tab-based mode management (useBotModeWithTab)
```

### 3. **TableSection** (`/src/components/pengaduan/tableSection.tsx`)
```typescript
// New Props:
- toggleForceMode: (from: string, currentForceMode: boolean) => void
- forceModeStates: Record<string, boolean>
- loadingForceMode: Record<string, boolean>

// Updated UI:
- Bot Switch kolom dengan visual feedback
- Loading states dan error handling
- Role-based access control
```

### 4. **Laporan Component** (`/src/components/pengaduan/laporan.tsx`)
```typescript
// New State:
- forceModeStates: Record<string, boolean>
- loadingForceMode: Record<string, boolean>

// New Functions:
- toggleForceMode(from: string, currentForceMode: boolean)
- loadForceModeStates()
```

## 🎮 How to Use

### For Admin (Toggle Force Mode):
1. **Buka halaman Pengaduan** - Lihat tabel laporan
2. **Kolom "Bot Switch"** - Switch untuk setiap user
3. **Toggle switch** - Merah = Bot OFF (Force), Hijau = Bot ON
4. **Konfirmasi visual** - Loading spinner selama proses

### Force Mode Logic:
```typescript
// Force Mode Active (Switch: RED)
- Bot tidak merespon apapun
- Mode manual tetap walau masuk/keluar halaman message
- Hanya force mode toggle yang bisa override

// Force Mode Inactive (Switch: GREEN)  
- Bot normal operation
- Manual mode auto-aktif saat masuk halaman message (30 menit timeout)
- Auto-expire kembali ke bot mode
```

## 🔒 Protection System

### 1. **Force Mode Override**
- ✅ Force mode aktif → Tidak bisa set manual timeout
- ✅ Force mode aktif → Mode manual tetap permanent
- ✅ Hanya force mode toggle yang bisa override

### 2. **Auto-Management**
```typescript
// Masuk halaman message (tab "pesan"):
if (!forceMode) {
  setManualMode(30); // 30 minutes timeout
}

// Keluar halaman message:
if (!forceMode) {
  changeMode('bot'); // Kembali ke bot mode
}
```

## 🧪 Testing Scenarios

### ✅ Test Cases:
1. **Force Mode ON** → Bot stop response, manual permanent
2. **Force Mode OFF** → Bot active, normal operation
3. **Manual Mode Timeout** → Auto-expire ke bot (30 menit)
4. **Force Mode Protection** → Reject manual timeout jika force aktif
5. **UI Visual Feedback** → Loading states, color indicators
6. **Role Access** → Hanya Bupati/SuperAdmin bisa toggle

## 📊 Visual Indicators

| State | Color | Icon | Description |
|-------|--------|------|------------|
| Force Mode ON | 🔴 Red | Switch Right | Bot OFF - Manual Forever |
| Force Mode OFF | 🟢 Green | Switch Left | Bot ON - Normal Operation |
| Loading | 🔵 Blue | Spinner | Processing Toggle |
| No Access | ⚫ Gray | Dot | View Only (other roles) |

## 🚨 Important Notes

### For Users:
- **Force mode = Bot berhenti permanent** sampai admin matikan
- **Manual mode = Bot berhenti sementara** (30 menit timeout)
- **Halaman message** otomatis aktifkan manual mode (jika force tidak aktif)

### For Admins:
- **Toggle dengan hati-hati** - Force mode permanent sampai dimatikan
- **Monitor status** - Gunakan visual indicators untuk tracking
- **Role requirement** - Hanya Bupati/SuperAdmin yang punya akses

## 🎉 Implementation Complete

✅ **Force Mode API Integration** - POST `/mode/force/:from`
✅ **Manual Mode with Timeout** - POST `/mode/manual/:from` 
✅ **TableSection UI Enhancement** - Visual toggle switches
✅ **Protection System** - Force mode override logic
✅ **Auto-Management** - Tab-based mode switching
✅ **Error Handling** - Loading states and feedback
✅ **Role-based Access** - Security controls
✅ **Documentation** - Complete implementation guide

**Mode Management System** sekarang memberikan **kontrol penuh** dan **fleksibilitas maksimal** untuk mengelola bot WhatsApp! 🚀
