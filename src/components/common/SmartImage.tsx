"use client";

import React, { useState, useEffect } from 'react';
import SafeImage from './SafeImage';

interface SmartImageProps {
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
 * SmartImage component that tries multiple URL paths to find the correct image
 * in uploads folder structure
 */
const SmartImage: React.FC<SmartImageProps> = ({
    src,
    alt,
    className = '',
    style = {},
    width = 200,
    height = 200,
    onClick,
    fallbackText = 'Foto tidak dapat dimuat',
    showDirectLink = true,
}) => {
    const [finalUrl, setFinalUrl] = useState<string>('');
    const [isSearching, setIsSearching] = useState<boolean>(true);

    // Fungsi untuk mengekstrak nama file dari path
    const extractFileName = (path: string): string => {
        const parts = path.split('/');
        return parts[parts.length - 1];
    };

    // Fungsi untuk konstruksi multiple URLs
    const constructPossibleUrls = (originalSrc: string): string[] => {
        const baseUrl = process.env.NEXT_PUBLIC_BE_BASE_URL;
        
        if (!baseUrl) {
            return [originalSrc];
        }

        const cleanBaseUrl = baseUrl.replace(/\/$/, '');
        const fileName = extractFileName(originalSrc);
        
        // Jika sudah URL lengkap, return as is
        if (originalSrc.startsWith('http://') || originalSrc.startsWith('https://')) {
            return [originalSrc];
        }

        // Daftar kemungkinan path yang akan dicoba
        const possiblePaths = [
            // Path asli
            originalSrc.startsWith('/') ? originalSrc : `/${originalSrc}`,
            
            // Path dengan uploads prefix jika belum ada
            originalSrc.includes('/uploads/') 
                ? (originalSrc.startsWith('/') ? originalSrc : `/${originalSrc}`)
                : `/uploads/${originalSrc.replace(/^\//, '')}`,
            
            // Path langsung di folder uploads dengan nama file saja
            `/uploads/${fileName}`,
            
            // Kemungkinan sub-folder umum dalam uploads
            `/uploads/images/${fileName}`,
            `/uploads/photos/${fileName}`,
            `/uploads/reports/${fileName}`,
            `/uploads/pengaduan/${fileName}`,
            `/uploads/laporan/${fileName}`,
            
            // Kemungkinan dengan struktur tahun/bulan
            ...((() => {
                const now = new Date();
                const year = now.getFullYear();
                const month = (now.getMonth() + 1).toString().padStart(2, '0');
                const prevMonth = month === '01' ? '12' : (parseInt(month) - 1).toString().padStart(2, '0');
                const prevYear = month === '01' ? year - 1 : year;
                
                return [
                    `/uploads/${year}/${month}/${fileName}`,
                    `/uploads/${year}/${fileName}`,
                    `/uploads/${prevYear}/${prevMonth}/${fileName}`, // Bulan sebelumnya
                ];
            })()),
            
            // Fallback patterns
            `/uploads/temp/${fileName}`,
            `/uploads/files/${fileName}`,
            `/static/uploads/${fileName}`,
            `/public/uploads/${fileName}`,
            
            // Path original tanpa processing
            originalSrc
        ];

        // Remove duplicates dan construct full URLs
        const uniquePaths = [...new Set(possiblePaths)];
        return uniquePaths.map(path => `${cleanBaseUrl}${path}`);
    };

    // Fungsi untuk mencoba load gambar dari multiple URLs
    const findWorkingUrl = async (urls: string[]): Promise<string> => {
        for (const url of urls) {
            try {
                // Gunakan fetch dengan HEAD request untuk cek existence tanpa download penuh
                const response = await fetch(url, { 
                    method: 'HEAD',
                    signal: AbortSignal.timeout(3000) // 3 second timeout per URL
                });
                
                if (response.ok) {
                    console.log(`✅ SmartImage found working URL: ${url}`);
                    return url;
                }
            } catch (error) {
                // Silently continue to next URL
                continue;
            }
        }
        
        // Jika semua gagal, return URL pertama sebagai fallback
        console.warn(`⚠️ SmartImage: All URLs failed for ${src}, using fallback: ${urls[0]}`);
        return urls[0];
    };

    useEffect(() => {
        const searchForImage = async () => {
            try {
                setIsSearching(true);
                const possibleUrls = constructPossibleUrls(src);
                const workingUrl = await findWorkingUrl(possibleUrls);
                setFinalUrl(workingUrl);
            } catch (error) {
                console.error('SmartImage search error:', error);
                setFinalUrl(src); // Fallback to original
            } finally {
                setIsSearching(false);
            }
        };

        searchForImage();
    }, [src]);

    // Show loading state while searching
    if (isSearching) {
        return (
            <div 
                className={`flex items-center justify-center bg-gray-100 border border-gray-200 rounded ${className}`}
                style={{
                    ...style,
                    minHeight: style.height || `${height}px`,
                }}
            >
                <div className="flex flex-col items-center text-gray-500">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-1"></div>
                    <div className="text-xs">Mencari...</div>
                </div>
            </div>
        );
    }

    // Use SafeImage with the found URL
    return (
        <SafeImage
            src={finalUrl}
            alt={alt}
            className={className}
            style={style}
            width={width}
            height={height}
            onClick={onClick}
            fallbackText={fallbackText}
            showDirectLink={showDirectLink}
        />
    );
};

export default SmartImage;
