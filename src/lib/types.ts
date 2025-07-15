// components/types.ts

export interface ProcessedBy {
    _id: string;
    username: string;
    nama_admin: string;
    role: string;
}

export interface Data {
    _id: string;
    from: string;
    sessionId: string;
    user: {
        _id?: string;
        name: string;
        phone: string;
        email: string;
        address: string;
        nik?: string;
        jenis_kelamin?: string;
        reportHistory?: string[];
    };
    location: {
        latitude: number;
        longitude: number;
        description: string;
        desa?: string;
        kecamatan?: string;
        kabupaten?: string;
    };
    message: string;
    photos: string[];
    tindakan?: TindakanData;
    processed_by?: {
        _id: string;
        username: string;
        nama_admin: string;
        role: string;
    };
    createdAt: string;
}

export interface KesimpulanItem {
    text: string;
    timestamp: string;
}

export interface TindakanData {
    _id: string;
    report: string;
    hasil: string;
    kesimpulan: KesimpulanItem[];
    situasi: string;
    status: string;
    opd: string[] | string;
    disposisi: string;
    trackingId: string;
    photos: string[];
    createdAt: string;
    updatedAt: string;
    rating: number;
    url: string;
    keterangan: string;
    status_laporan: string;
    prioritas: string;
    tindakanId?: string;
    tag?: Array<{ hash_tag: string; _id: string } | string>;
    processed_by?: ProcessedBy;
}

export interface TindakanClientState extends TindakanData {
    tempPhotos?: File[];
}

export interface Location {
    latitude: number;
    longitude: number;
    description: string;
    desa: string;
    kecamatan: string;
    kabupaten: string;
}

export interface Tindakan {
    _id: string;
    report: string;
    hasil: string;
    kesimpulan: KesimpulanItem[];
    situasi: string;
    status: string;
    opd: string[] | string;
    disposisi: string;
    trackingId: string;
    photos: string[];
    createdAt: string;
    updatedAt: string;
    rating: number;
    url: string;
    keterangan: string;
    status_laporan: string;
    prioritas: string;
    tag?: Array<{ hash_tag: string; _id: string } | string>;
}

export interface Chat {
    _id: string;
    sessionId: string;
    from: string;
    user: string;
    address: string;
    location: Location;
    message: string;
    photos: string[];
    createdAt?: string;
    updatedAt?: string;
    tindakan?: Tindakan;
    rating?: number;
    processed_by?: ProcessedBy;
    is_pinned?: boolean;
    tags?: string;
}

export interface Report {
    _id: string;
    sessionId: string;
    message: string;
    location: {
        latitude: number;
        longitude: number;
        description: string;
        desa?: string;
        kecamatan?: string;
        kabupaten?: string;
    };
    user?: {
        name: string;
    };
    photos?: string[];
    tindakan?: {
        situasi?: string;
        status?: string;
    };
    processed_by?: ProcessedBy;
    createdAt?: string;
}

export type SortKey = "sessionId" | "user" | "pinned" | "admin" | "detail" | "tracking_id" | "bot_switch" | "tag" | "from" | "date" | "lokasi_kejadian" | "desa" | "prioritas" | "situasi" | "status" | "opd" | "timer";

// Backend supported sort keys - only these columns can be sorted
export type BackendSortKey = "prioritas" | "status" | "situasi" | "lokasi_kejadian" | "opd" | "date" | "admin" | "from";

// Message-related types
export interface MessageData {
    message?: string;
    type: 'text' | 'image' | 'file' | 'video' | 'audio';
    mediaUrl?: string;
    file?: File;
    caption?: string;
    part?: number;
    totalParts?: number;
    [key: string]: unknown; // Allow additional properties
}

export interface QueuedMessage extends MessageData {
    id: string;
    timestamp: Date;
}

export interface FailedMessage extends MessageData {
    id: string;
    error: string;
    failedAt: Date;
}

export interface SaveDataFunction {
    (nextStatus?: string): Promise<{ success: boolean; message?: string; data?: unknown }>;
}

// Router type for Next.js
export interface NextRouter {
    push: (url: string) => Promise<boolean>;
    replace: (url: string) => Promise<boolean>;
    reload: () => void;
    back: () => void;
    query: Record<string, string | string[] | undefined>;
    pathname: string;
    asPath: string;
}