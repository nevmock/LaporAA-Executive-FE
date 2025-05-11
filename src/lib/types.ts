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
    kesimpulan: string;
    situasi: string;
    status: string;
    opd: string;
    disposisi: string;
    trackingId: string;
    photos: string[];
    createdAt: string;
    updatedAt: string;
    rating: number;
}

export interface TindakanClientState extends TindakanData {
    tempPhotos?: File[];
}

export interface Location {
    latitude: number;
    longitude: number;
    description: string;
}

export interface Tindakan {
    _id: string;
    report: string;
    hasil: string;
    kesimpulan: string;
    prioritas: string;
    situasi: string;
    status: string;
    opd: string;
    photos: string[];
    createdAt: string;
    updatedAt: string;
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

export type SortKey = "sessionId" | "user" | "from" | "address" | "description" | "prioritas" | "situasi" | "status" | "opd" | "timer";