"use client";

import React, { useState } from 'react';
import Image from 'next/image';

interface SafeImageProps {
    src: string;
    alt: string;
    className?: string;
    style?: React.CSSProperties;
    width?: number;
    height?: number;
    onClick?: () => void;
    fallbackText?: string;
    showDirectLink?: boolean;
}

/**
 * SafeImage component that handles loading errors gracefully
 * with fallback UI and direct link option
 */
const SafeImage: React.FC<SafeImageProps> = ({
    src,
    alt,
    className = '',
    style = {},
    width = 200,
    height = 200,
    onClick,
    fallbackText = 'Gambar tidak dapat dimuat',
    showDirectLink = true,
}) => {
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const handleError = () => {
        console.error(`Failed to load image: ${src}`);
        setHasError(true);
        setIsLoading(false);
    };

    const handleLoad = () => {
        setIsLoading(false);
    };

    const handleDirectOpen = (e: React.MouseEvent) => {
        e.stopPropagation();
        window.open(src, '_blank');
    };

    if (hasError) {
        return (
            <div 
                className={`flex flex-col items-center justify-center bg-gray-100 border border-gray-200 rounded ${className}`}
                style={{
                    ...style,
                    minHeight: style.height || `${height}px`,
                    cursor: onClick ? 'pointer' : 'default',
                }}
                onClick={onClick}
            >
                <div className="text-gray-500 text-center p-4">
                    <div className="text-2xl mb-2">📷</div>
                    <div className="text-sm mb-2">{fallbackText}</div>
                    {showDirectLink && (
                        <button
                            onClick={handleDirectOpen}
                            className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                        >
                            Buka Langsung
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            {isLoading && (
                <div 
                    className={`absolute inset-0 flex items-center justify-center bg-gray-100 ${className}`}
                    style={style}
                >
                    <div className="flex flex-col items-center">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <div className="text-xs text-gray-500">Memuat...</div>
                    </div>
                </div>
            )}
            <Image
                src={src}
                alt={alt}
                className={className}
                style={style}
                width={width}
                height={height}
                unoptimized={true}
                loading="lazy"
                onClick={onClick}
                onError={handleError}
                onLoad={handleLoad}
            />
        </div>
    );
};

export default SafeImage;
