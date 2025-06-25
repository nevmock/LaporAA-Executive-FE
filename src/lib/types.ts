// components/types.ts

export interface Data {
    _id: string;
    from: string;
    sessionId: string;
    user: {
        name: string;
        phone: string;
        email: string;
        address: string;
    };
    location: {
        latitude: number;
        longitude: number;
        description: string;
    };
    message: string;
    photos: string[];
    tindakan?: TindakanData;
    processed_by?: string;
}

export interface TindakanData {
    _id: string;
    report: string;
    hasil: string;
    kesimpulan: Array<any>;
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
    tags?: string[];
    tindakanId?: string;
    tag?: Array<{ hash_tag: string; _id: string } | string>;
}

export interface TindakanClientState extends TindakanData {
    tempPhotos?: File[];
    processed_by?: string;
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
    kesimpulan: Array<any>;
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
    tags?: string[];
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
    processed_by: ProcessedBy;
    is_pinned?: boolean;
    tags?: string[];
    tag?: Array<{ hash_tag: string; _id: string } | string>;
}

export interface ProcessedBy {
    _id: string;
    nama_admin: string;
    role: string;
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
    processed_by?: string;
    createdAt?: string;
}

export type SortKey = "sessionId" | "user" | "pinned" | "admin" | "bot_switch" | "tag" | "from" | "date" | "lokasi_kejadian" | "desa" | "prioritas" | "situasi" | "status" | "opd" | "timer";