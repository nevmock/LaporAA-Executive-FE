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
 * Safely construct a photo URL with fallback handling for different storage structures
 */
export function constructPhotoUrl(photoPath: string | object | any): string {
    try {
        // Handle different photoPath types
        let pathString: string = '';
        
        if (typeof photoPath === 'string') {
            pathString = photoPath;
        } else if (typeof photoPath === 'object' && photoPath !== null) {
            // Handle object format with url property
            const pathObj = photoPath as { url?: string; originalUrl?: string; [key: string]: any };
            pathString = pathObj.url || pathObj.originalUrl || '';
        } else {
            // Invalid type
            return '/placeholder-image.svg';
        }

        // Return fallback for empty or invalid paths
        if (!pathString || typeof pathString !== 'string' || pathString.trim() === '') {
            return '/placeholder-image.svg';
        }

        // Return as-is if already a complete URL
        if (pathString.startsWith('http://') || pathString.startsWith('https://')) {
            return pathString;
        }

        // Construct URL with API base
        const baseUrl = getApiUrl();
        const cleanPath = pathString.startsWith('/') ? pathString : `/${pathString}`;
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
 * Safe version of constructPhotoUrl that never returns empty string
 */
export function safeConstructPhotoUrl(photoPath: string | object | any): string {
    const result = constructPhotoUrl(photoPath);
    return result || '/placeholder-image.svg';
}

/**
 * Handle photo URL with fallback for different storage structures
 * Tries multiple path combinations to find the actual file location
 */
export async function constructPhotoUrlWithFallback(photoPath: string | object | any): Promise<string> {
    try {
        // Handle different photoPath types
        let pathString: string = '';
        
        if (typeof photoPath === 'string') {
            pathString = photoPath;
        } else if (typeof photoPath === 'object' && photoPath !== null) {
            // Handle object format with url property
            const pathObj = photoPath as { url?: string; originalUrl?: string; [key: string]: any };
            pathString = pathObj.url || pathObj.originalUrl || '';
        } else {
            // Invalid type
            return '/placeholder-image.svg';
        }

        if (!pathString || typeof pathString !== 'string' || pathString.trim() === '') {
            return '/placeholder-image.svg';
        }

        // Return as-is if already a complete URL
        if (pathString.startsWith('http://') || pathString.startsWith('https://')) {
            return pathString;
        }

        const baseUrl = getApiUrl();
        const cleanPath = pathString.startsWith('/') ? pathString : `/${pathString}`;
        
        // Try the original path first
        const originalUrl = `${baseUrl}${cleanPath}`;
        if (await checkUrlExists(originalUrl)) {
            return originalUrl;
        }

        // If original path doesn't work, try alternative structures
        const fileName = cleanPath.split('/').pop();
        if (fileName) {
            // Try different folder structures based on file extension
            const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
            const alternativePaths = [];
            
            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
                // For images: try both /uploads/ and /uploads/images/
                alternativePaths.push(`/uploads/${fileName}`);
                alternativePaths.push(`/uploads/images/${fileName}`);
            } else if (['mp4', 'avi', 'mov', 'webm'].includes(fileExt)) {
                // For videos: try both /uploads/videos/ and /uploads/
                alternativePaths.push(`/uploads/videos/${fileName}`);
                alternativePaths.push(`/uploads/${fileName}`);
            } else if (['mp3', 'wav', 'ogg', 'aac'].includes(fileExt)) {
                // For audio: try both /uploads/audio/ and /uploads/
                alternativePaths.push(`/uploads/audio/${fileName}`);
                alternativePaths.push(`/uploads/${fileName}`);
            } else if (['pdf', 'doc', 'docx'].includes(fileExt)) {
                // For documents: try both /uploads/documents/ and /uploads/
                alternativePaths.push(`/uploads/documents/${fileName}`);
                alternativePaths.push(`/uploads/${fileName}`);
            }

            // Try each alternative path
            for (const altPath of alternativePaths) {
                const altUrl = `${baseUrl}${altPath}`;
                if (await checkUrlExists(altUrl)) {
                    return altUrl;
                }
            }
        }

        // If all attempts fail, return fallback
        console.warn(`Photo not found at any location for path: ${photoPath}`);
        return '/placeholder-image.svg';
        
    } catch (error) {
        console.error('Error constructing photo URL with fallback:', error);
        return '/placeholder-image.svg';
    }
}

/**
 * Check if URL exists by attempting to fetch it
 */
async function checkUrlExists(url: string): Promise<boolean> {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch {
        return false;
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
 * Returns empty string for invalid inputs to ensure safe string operations
 */
export function extractPhotoPath(photo: string | { url?: string; originalUrl?: string; [key: string]: any } | null | undefined): string {
    // Handle null, undefined, or other falsy values
    if (!photo) {
        return '';
    }
    
    // Handle string type
    if (typeof photo === 'string') {
        return photo;
    }
    
    // Handle object type
    if (typeof photo === 'object' && photo !== null) {
        const url = photo.url || photo.originalUrl || '';
        // Ensure we return a string
        return typeof url === 'string' ? url : '';
    }
    
    // Handle any other type (numbers, booleans, etc.)
    return '';
}

/**
 * Safely validate if a media path is usable
 * Returns true only if the path is a non-empty string
 */
export function isValidMediaPath(mediaPath: any): mediaPath is string {
    return typeof mediaPath === 'string' && mediaPath.trim() !== '';
}

/**
 * Safe extraction and validation of photo path in one function
 * Returns null if path is invalid, otherwise returns the valid string path
 */
export function extractAndValidatePhotoPath(photo: any): string | null {
    const path = extractPhotoPath(photo);
    return isValidMediaPath(path) ? path : null;
}
