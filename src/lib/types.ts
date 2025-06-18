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
}

export interface TindakanData {
    _id: string;
    report: string;
    hasil: string;
    kesimpulan: Array<any>;
    situasi: string;
    status: string;
    opd: string;
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
    kesimpulan: Array<any>;
    situasi: string;
    status: string;
    opd: string;
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
}

export type SortKey = "sessionId" | "user" | "from" | "date" | "lokasi_kejadian" | "desa" | "prioritas" | "situasi" | "status" | "opd" | "timer";