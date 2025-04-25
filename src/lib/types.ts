// components/types.ts
export interface TindakanData {
    _id: string;
    report: string;
    hasil: string;
    kesimpulan: string;
    situasi: string;
    status: string;
    opd: string;
    trackingId: string;
    photos: string[];
    createdAt: string;
    updatedAt: string;
}

export interface TindakanClientState extends TindakanData {
    tempPhotos?: File[];
}
