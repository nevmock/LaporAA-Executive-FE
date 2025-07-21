import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getApiUrl } from '../../utils/urlUtils';

interface PhotoDisplayProps {
    photoPath: string;
    alt?: string;
    className?: string;
    onClick?: () => void;
    onError?: () => void;
}

/**
 * PhotoDisplay component with intelligent fallback handling
 * Automatically tries different storage structures for backward compatibility
 */
export function PhotoDisplay({ photoPath, alt = "Photo", className, onClick, onError }: PhotoDisplayProps) {
    const [currentSrc, setCurrentSrc] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [attemptIndex, setAttemptIndex] = useState(0);

    // Generate possible URLs for the photo based on different storage structures
    const generatePossibleUrls = (path: string): string[] => {
        if (!path || path.trim() === '') return [];
        
        const baseUrl = getApiUrl();
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        
        // If it's already a complete URL, just return it
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return [path];
        }

        const urls = [];
        
        // Try the original path first
        const originalUrl = `${baseUrl}${cleanPath}`;
        if (originalUrl && originalUrl.trim() !== '') {
            urls.push(originalUrl);
        }
        
        // Extract filename for alternative structure attempts
        const fileName = cleanPath.split('/').pop();
        if (fileName && fileName.trim() !== '') {
            const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
            
            // Generate alternative paths based on file type
            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
                // For images: try both structures
                if (!cleanPath.includes('/images/')) {
                    const imgUrl = `${baseUrl}/uploads/images/${fileName}`;
                    if (imgUrl && imgUrl.trim() !== '') urls.push(imgUrl);
                }
                if (!cleanPath.startsWith('/uploads/') || cleanPath.includes('/images/')) {
                    const directUrl = `${baseUrl}/uploads/${fileName}`;
                    if (directUrl && directUrl.trim() !== '') urls.push(directUrl);
                }
            } else if (['mp4', 'avi', 'mov', 'webm', 'mkv', 'wmv'].includes(fileExt)) {
                // For videos: try both structures
                if (!cleanPath.includes('/videos/')) {
                    const vidUrl = `${baseUrl}/uploads/videos/${fileName}`;
                    if (vidUrl && vidUrl.trim() !== '') urls.push(vidUrl);
                }
                if (!cleanPath.startsWith('/uploads/') || cleanPath.includes('/videos/')) {
                    const directUrl = `${baseUrl}/uploads/${fileName}`;
                    if (directUrl && directUrl.trim() !== '') urls.push(directUrl);
                }
            } else if (['mp3', 'wav', 'ogg', 'aac'].includes(fileExt)) {
                // For audio: try both structures
                if (!cleanPath.includes('/audio/')) {
                    const audioUrl = `${baseUrl}/uploads/audio/${fileName}`;
                    if (audioUrl && audioUrl.trim() !== '') urls.push(audioUrl);
                }
                if (!cleanPath.startsWith('/uploads/') || cleanPath.includes('/audio/')) {
                    const directUrl = `${baseUrl}/uploads/${fileName}`;
                    if (directUrl && directUrl.trim() !== '') urls.push(directUrl);
                }
            } else if (['pdf', 'doc', 'docx'].includes(fileExt)) {
                // For documents: try both structures
                if (!cleanPath.includes('/documents/')) {
                    const docUrl = `${baseUrl}/uploads/documents/${fileName}`;
                    if (docUrl && docUrl.trim() !== '') urls.push(docUrl);
                }
                if (!cleanPath.startsWith('/uploads/') || cleanPath.includes('/documents/')) {
                    const directUrl = `${baseUrl}/uploads/${fileName}`;
                    if (directUrl && directUrl.trim() !== '') urls.push(directUrl);
                }
            }
        }

        // Remove duplicates and empty strings while preserving order
        return Array.from(new Set(urls.filter(url => url && url.trim() !== '')));
    };

    // Generate possible URLs with STABLE memoization to prevent infinite loops
    const possibleUrls = useMemo(() => {
        // Early return for invalid paths
        if (!photoPath || typeof photoPath !== 'string' || photoPath.trim() === '') {
            return [];
        }
        
        return generatePossibleUrls(photoPath);
    }, [photoPath]); // Only depend on photoPath, not the function

    // FIXED useEffect - REMOVED aggressive timeout that was causing thumbnails to disappear
    useEffect(() => {
        // Reset states first
        setAttemptIndex(0);
        setHasError(false);
        setIsLoading(true);
        
        if (possibleUrls.length === 0) {
            setHasError(true);
            setIsLoading(false);
            setCurrentSrc('');
            return;
        }

        const firstUrl = possibleUrls[0];
        if (!firstUrl || firstUrl.trim() === '') {
            setHasError(true);
            setIsLoading(false);
            setCurrentSrc('');
            return;
        }

        setCurrentSrc(firstUrl);
        
        // REMOVED: Aggressive timeout that was forcing error state after 10 seconds
        // The image onLoad/onError handlers will manage the loading state properly
        
    }, [possibleUrls]);

    // CONSERVATIVE error handler - only try alternatives if really needed
    const handleImageError = useCallback(() => {
        const nextIndex = attemptIndex + 1;
        
        // Only try alternative URLs if we haven't exhausted options and haven't hit limit
        if (nextIndex < possibleUrls.length && nextIndex < 2) { // Reduced limit to 2 attempts
            const nextUrl = possibleUrls[nextIndex];
            if (nextUrl && nextUrl.trim() !== '' && nextUrl !== currentSrc) {
                setAttemptIndex(nextIndex);
                setCurrentSrc(nextUrl);
                setIsLoading(true); // Reset loading for next attempt
            } else {
                // No valid next URL
                setHasError(true);
                setIsLoading(false);
                onError?.();
            }
        } else {
            // No more URLs to try or hit limit
            setHasError(true);
            setIsLoading(false);
            onError?.();
        }
    }, [attemptIndex, possibleUrls, onError, currentSrc]);

    // OPTIMIZED load handler
    const handleImageLoad = useCallback(() => {
        setIsLoading(false);
        setHasError(false);
    }, []);

    // Early return for invalid paths after hooks
    if (!photoPath || photoPath.trim() === '') {
        return (
            <div className={`flex items-center justify-center bg-gray-100 text-gray-500 ${className || ''}`}>
                <div className="text-center">
                    <div className="text-2xl mb-2">📷</div>
                    <div className="text-xs">No Media</div>
                </div>
            </div>
        );
    }

    // IMPROVED rendering logic - only show error when truly failed
    if (hasError && !currentSrc) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 text-gray-500 ${className || ''}`}>
                <div className="text-center">
                    <div className="text-2xl mb-2">📷</div>
                    <div className="text-xs">No Media</div>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative ${className || ''}`}>
            {isLoading && currentSrc && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
            )}
            {currentSrc && (
                <img
                    src={currentSrc}
                    alt={alt}
                    className={`${className || ''} ${isLoading ? 'opacity-50' : 'opacity-100'} transition-opacity duration-200`}
                    onError={handleImageError}
                    onLoad={handleImageLoad}
                    onClick={onClick}
                    style={{ cursor: onClick ? 'pointer' : 'default' }}
                />
            )}
            {/* Only show fallback when both error AND no valid src */}
            {hasError && !currentSrc && (
                <div className={`flex items-center justify-center bg-gray-100 text-gray-500 ${className || ''}`}>
                    <div className="text-center">
                        <div className="text-2xl mb-2">📷</div>
                        <div className="text-xs">No Media</div>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * VideoDisplay component with similar fallback handling for videos
 */
export function VideoDisplay({ photoPath, className, onClick }: PhotoDisplayProps) {
    const [currentSrc, setCurrentSrc] = useState<string>('');
    const [hasError, setHasError] = useState(false);
    const [attemptIndex, setAttemptIndex] = useState(0);

    const possibleUrls = useMemo(() => {
        if (!photoPath || photoPath.trim() === '') return [];
        
        const baseUrl = getApiUrl();
        const cleanPath = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
        
        if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
            return [photoPath];
        }

        const urls = [];
        
        // Try the original path first
        const originalUrl = `${baseUrl}${cleanPath}`;
        if (originalUrl && originalUrl.trim() !== '') {
            urls.push(originalUrl);
        }
        
        const fileName = cleanPath.split('/').pop();
        if (fileName && fileName.trim() !== '') {
            // Try video-specific paths
            if (!cleanPath.includes('/videos/')) {
                const vidUrl = `${baseUrl}/uploads/videos/${fileName}`;
                if (vidUrl && vidUrl.trim() !== '') urls.push(vidUrl);
            }
            if (!cleanPath.startsWith('/uploads/') || cleanPath.includes('/videos/')) {
                const directUrl = `${baseUrl}/uploads/${fileName}`;
                if (directUrl && directUrl.trim() !== '') urls.push(directUrl);
            }
        }

        return Array.from(new Set(urls.filter(url => url && url.trim() !== '')));
    }, [photoPath]);

    useEffect(() => {
        if (possibleUrls.length === 0 || !photoPath || photoPath.trim() === '') {
            setHasError(true);
            setCurrentSrc('');
            return;
        }

        setAttemptIndex(0);
        setCurrentSrc(possibleUrls[0] || '');
        setHasError(false);
    }, [photoPath, possibleUrls]);

    // Early return for invalid paths after hooks
    if (!photoPath || photoPath.trim() === '') {
        return (
            <div className={`flex items-center justify-center bg-gray-100 text-gray-500 ${className || ''}`}>
                <div className="text-center">
                    <div className="text-2xl mb-2">🎥</div>
                    <div className="text-xs">No Video</div>
                </div>
            </div>
        );
    }

    const handleVideoError = () => {
        const nextIndex = attemptIndex + 1;
        
        if (nextIndex < possibleUrls.length) {
            setAttemptIndex(nextIndex);
            setCurrentSrc(possibleUrls[nextIndex]);
        } else {
            setHasError(true);
        }
    };

    if (hasError || !currentSrc || currentSrc.trim() === '') {
        return (
            <div className={`flex items-center justify-center bg-gray-100 text-gray-500 ${className || ''}`}>
                <div className="text-center">
                    <div className="text-2xl mb-2">🎥</div>
                    <div className="text-xs">Video Not Found</div>
                </div>
            </div>
        );
    }

    return (
        <video
            src={currentSrc || undefined}
            className={className}
            controls
            onError={handleVideoError}
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            Your browser does not support video playback.
        </video>
    );
}

export default PhotoDisplay;
