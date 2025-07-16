/**
 * Utility functions for URL handling
 */

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;
const FALLBACK_API_URL = 'http://localhost:3001';

/**
 * Get the API base URL with fallback
 */
export function getApiUrl(): string {
    if (!API_URL || API_URL.trim() === '') {
        console.warn('NEXT_PUBLIC_BE_BASE_URL is not defined, using fallback URL');
        return FALLBACK_API_URL;
    }
    return API_URL;
}

/**
 * Safely construct a photo URL
 */
export function constructPhotoUrl(photoPath: string): string {
    try {
        // Return fallback for empty or invalid paths
        if (!photoPath || photoPath.trim() === '') {
            return '/placeholder-image.svg';
        }

        // Return as-is if already a complete URL
        if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
            return photoPath;
        }

        // Construct URL with API base
        const baseUrl = getApiUrl();
        const cleanPath = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
        const fullUrl = `${baseUrl}${cleanPath}`;

        // Validate the constructed URL
        try {
            new URL(fullUrl);
            return fullUrl;
        } catch (urlError) {
            console.error('Invalid URL constructed:', fullUrl, urlError);
            return '/placeholder-image.svg';
        }
    } catch (error) {
        console.error('Error constructing photo URL:', error);
        return '/placeholder-image.svg';
    }
}

/**
 * Check if URL is valid
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Extract photo path from various photo object formats
 */
export function extractPhotoPath(photo: string | { url?: string; originalUrl?: string; [key: string]: any }): string {
    if (typeof photo === 'string') {
        return photo;
    } else if (typeof photo === 'object' && photo !== null) {
        return photo.url || photo.originalUrl || '';
    }
    return '';
}
