/**
 * Custom fetch utility for handling image requests with better error handling
 * and timeout management specifically for the LaporAA backend
 */

interface FetchImageOptions {
    timeout?: number;
    retries?: number;
    fallbackToDirectLink?: boolean;
}

class ImageFetchError extends Error {
    constructor(
        message: string,
        public status?: number,
        public isTimeout?: boolean
    ) {
        super(message);
        this.name = 'ImageFetchError';
    }
}

/**
 * Fetch image with timeout, retries, and better error handling
 */
export async function fetchImageWithTimeout(
    url: string,
    options: FetchImageOptions = {}
): Promise<Response> {
    const {
        timeout = 15000, // 15 seconds
        retries = 2,
        fallbackToDirectLink = true
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.log(`Image fetch timeout (${timeout}ms) for: ${url}`);
                controller.abort();
            }, timeout);

            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'Accept': 'image/*,*/*;q=0.8',
                    'Cache-Control': 'no-cache',
                    'User-Agent': 'Mozilla/5.0 (compatible; LaporAA-App/1.0)',
                },
                mode: 'cors',
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new ImageFetchError(
                    `HTTP ${response.status}: ${response.statusText}`,
                    response.status
                );
            }

            return response;
        } catch (error) {
            lastError = error as Error;

            if (error instanceof Error && error.name === 'AbortError') {
                console.warn(`Attempt ${attempt + 1}/${retries + 1} timed out for: ${url}`);
                lastError = new ImageFetchError(
                    `Request timed out after ${timeout}ms`,
                    undefined,
                    true
                );
            } else {
                console.warn(`Attempt ${attempt + 1}/${retries + 1} failed for: ${url}`, error);
            }

            // Wait before retry (exponential backoff)
            if (attempt < retries) {
                const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // All attempts failed
    if (fallbackToDirectLink) {
        console.log(`All fetch attempts failed for ${url}, suggesting direct link fallback`);
    }

    throw lastError || new ImageFetchError('Unknown error occurred');
}

/**
 * Download image blob with proper error handling
 */
export async function downloadImageBlob(
    url: string,
    filename: string,
    options: FetchImageOptions = {}
): Promise<void> {
    try {
        const response = await fetchImageWithTimeout(url, options);
        const blob = await response.blob();
        
        // Create download link
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        
        console.log(`Successfully downloaded: ${filename}`);
    } catch (error) {
        console.error(`Failed to download ${filename}:`, error);
        
        // Fallback: open in new tab
        console.log(`Fallback: Opening ${url} in new tab`);
        window.open(url, '_blank');
        
        throw error;
    }
}

/**
 * Batch download images with delay between requests
 */
export async function batchDownloadImages(
    images: Array<{ url: string; filename: string }>,
    options: FetchImageOptions & { delayBetween?: number } = {}
): Promise<Array<{ filename: string; success: boolean; error?: string }>> {
    const { delayBetween = 1000, ...fetchOptions } = options;
    const results: Array<{ filename: string; success: boolean; error?: string }> = [];

    for (let i = 0; i < images.length; i++) {
        const { url, filename } = images[i];
        
        try {
            await downloadImageBlob(url, filename, fetchOptions);
            results.push({ filename, success: true });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            results.push({ filename, success: false, error: errorMessage });
        }

        // Add delay between downloads (except for the last one)
        if (i < images.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delayBetween));
        }
    }

    return results;
}

export { ImageFetchError };
