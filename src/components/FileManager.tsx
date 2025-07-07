import React, { useState, useEffect, useCallback } from 'react';
import {
    FaFolder,
    FaFile,
    FaImage,
    FaVideo,
    FaMusic,
    FaFilePdf,
    FaFileWord,
    FaFileExcel,
    FaDownload,
    FaTrash,
    FaEye,
    FaUpload,
    FaSearch,
    FaHdd,
    FaPlus,
    FaTimes,
    FaSync,
    FaSearchPlus,
    FaSearchMinus,
    FaExpand,
    FaCompress
} from 'react-icons/fa';
import { useFileManagement, FileItem, StorageStats } from '../hooks/useFileManagement';
import Portal from './Portal';

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL || "http://localhost:3001";

// Define specific types for better type safety
type FileTypeFilter = 'all' | 'images' | 'videos' | 'audio' | 'documents';
type SortBy = 'name' | 'date' | 'size' | 'type';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

interface FileManagerProps {
    onClose: () => void;
    onFileSelect?: (file: FileItem) => void;
    selectMode?: boolean;
    userId?: string; // Add userId to scope file manager to specific user
    // Note: chatSession parameter removed as it's unused
}

const FileManager: React.FC<FileManagerProps> = ({
    onClose,
    onFileSelect,
    selectMode = false,
    userId
    // Note: chatSession parameter removed as it's unused
}) => {
    const {
        loading,
        error,
        clearError,
        getFiles,
        getStorageStats,
        deleteFile,
        bulkDeleteFiles,
        createDirectory,
        uploadFile,
        cleanupFiles
    } = useFileManagement();

    const [currentPath, setCurrentPath] = useState('/');
    const [files, setFiles] = useState<FileItem[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [sortBy, setSortBy] = useState<SortBy>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<FileTypeFilter>('all');
    const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
    const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
    const [showUpload, setShowUpload] = useState(false);
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    
    // Image zoom and pan states
    const [imageZoom, setImageZoom] = useState(1);
    const [imagePan, setImagePan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Calculate stats from current filtered files for chat context
    const calculateChatStats = useCallback((files: FileItem[]) => {
        const fileList = files.filter(f => f.type === 'file');
        const folderList = files.filter(f => f.type === 'folder');
        
        const breakdown = {
            images: 0,
            videos: 0,
            audio: 0,
            documents: 0,
            others: 0
        };

        fileList.forEach(file => {
            if (file.mimeType.startsWith('image/')) {
                breakdown.images += 1;
            } else if (file.mimeType.startsWith('video/')) {
                breakdown.videos += 1;
            } else if (file.mimeType.startsWith('audio/')) {
                breakdown.audio += 1;
            } else if (file.mimeType.includes('pdf') || file.mimeType.includes('document') || file.mimeType.includes('text')) {
                breakdown.documents += 1;
            } else {
                breakdown.others += 1;
            }
        });

        return {
            fileCount: fileList.length,
            folderCount: folderList.length,
            breakdown
        };
    }, []);

    // File type icons mapping
    const getFileIcon = (mimeType: string, type: string) => {
        if (type === 'folder') return <FaFolder className="text-blue-500" />;

        if (mimeType.startsWith('image/')) return <FaImage className="text-green-500" />;
        if (mimeType.startsWith('video/')) return <FaVideo className="text-red-500" />;
        if (mimeType.startsWith('audio/')) return <FaMusic className="text-purple-500" />;
        if (mimeType.includes('pdf')) return <FaFilePdf className="text-red-600" />;
        if (mimeType.includes('word') || mimeType.includes('document')) return <FaFileWord className="text-blue-600" />;
        if (mimeType.includes('sheet') || mimeType.includes('excel')) return <FaFileExcel className="text-green-600" />;

        return <FaFile className="text-gray-500" />;
    };

    // Format file size
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Load files from current path
    const loadFiles = useCallback(async () => {
        clearError();

        try {
            const data = await getFiles({
                path: currentPath,
                search: searchQuery,
                filter: filterType,
                sort: sortBy,
                order: sortOrder,
                userId: userId // Pass userId to filter files
            });

            setFiles(data.files);
        } catch (err) {
            console.error('Error loading files:', err);
        }
    }, [currentPath, searchQuery, filterType, sortBy, sortOrder, userId, getFiles, clearError]);

    // Load storage statistics
    const loadStorageStats = useCallback(async () => {
        try {
            const stats = await getStorageStats();
            setStorageStats(stats);
        } catch (err) {
            console.error('Error loading storage stats:', err);
        }
    }, [getStorageStats]);

    // Handle checkbox selection
    const handleCheckboxSelect = (file: FileItem, e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        
        if (selectMode && onFileSelect) {
            onFileSelect(file);
            onClose();
            return;
        }

        if (selectedFiles.includes(file.id)) {
            setSelectedFiles(selectedFiles.filter(id => id !== file.id));
        } else {
            setSelectedFiles([...selectedFiles, file.id]);
        }
    };

    // Handle file click (for preview or folder navigation)
    const handleFileSelect = (file: FileItem) => {
        if (file.type === 'folder') {
            setCurrentPath(file.path);
            return;
        }

        // If selectMode is active, clicking image should select file
        if (selectMode && onFileSelect) {
            onFileSelect(file);
            return;
        }

        // For images, videos, and audio - show preview
        if (file.mimeType.startsWith('image/') || file.mimeType.startsWith('video/') || file.mimeType.startsWith('audio/')) {
            handlePreview(file);
        }
    };

    // Handle file preview
    const handlePreview = (file: FileItem) => {
        setPreviewFile(file);
        // Reset zoom and pan when opening new file
        setImageZoom(1);
        setImagePan({ x: 0, y: 0 });
        setIsFullscreen(false);
    };

    // Handle image zoom
    const handleZoomIn = () => {
        setImageZoom(prev => Math.min(prev * 1.2, 5));
    };

    const handleZoomOut = () => {
        setImageZoom(prev => Math.max(prev / 1.2, 0.1));
    };

    const resetZoom = () => {
        setImageZoom(1);
        setImagePan({ x: 0, y: 0 });
    };

    // Handle image pan
    const handleMouseDown = (e: React.MouseEvent) => {
        if (imageZoom <= 1) return;
        setIsDragging(true);
        setDragStart({
            x: e.clientX - imagePan.x,
            y: e.clientY - imagePan.y
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || imageZoom <= 1) return;
        setImagePan({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Handle wheel zoom
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setImageZoom(prev => Math.min(Math.max(prev * delta, 0.1), 5));
    };

    // Handle file download
    const handleDownload = (file: FileItem) => {
        const url = file.url?.startsWith('http') ? file.url : `${API_URL}${file.url}`;
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Toggle fullscreen
    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    // Close preview and reset states
    const closePreview = () => {
        setPreviewFile(null);
        setImageZoom(1);
        setImagePan({ x: 0, y: 0 });
        setIsFullscreen(false);
        setIsDragging(false);
    };

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (previewFile) {
                if (e.key === 'Escape') {
                    if (isFullscreen) {
                        setIsFullscreen(false);
                    } else {
                        closePreview();
                    }
                } else if (e.key === 'f' || e.key === 'F') {
                    if (previewFile.mimeType.startsWith('image/')) {
                        toggleFullscreen();
                    }
                } else if (e.key === '=' || e.key === '+') {
                    if (previewFile.mimeType.startsWith('image/')) {
                        handleZoomIn();
                    }
                } else if (e.key === '-') {
                    if (previewFile.mimeType.startsWith('image/')) {
                        handleZoomOut();
                    }
                } else if (e.key === '0') {
                    if (previewFile.mimeType.startsWith('image/')) {
                        resetZoom();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [previewFile, isFullscreen]); // eslint-disable-line react-hooks/exhaustive-deps

    // Handle file delete
    const handleDelete = async (fileId: string) => {
        if (!confirm('Are you sure you want to delete this file?')) return;

        try {
            await deleteFile(fileId);
            await loadFiles(); // Reload files after deletion
            setSelectedFiles(selectedFiles.filter(id => id !== fileId));
        } catch (err) {
            console.error('Error deleting file:', err);
        }
    };

    // Handle bulk delete
    const handleBulkDelete = async () => {
        if (selectedFiles.length === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedFiles.length} selected files?`)) return;

        try {
            await bulkDeleteFiles(selectedFiles);
            await loadFiles(); // Reload files after deletion
            setSelectedFiles([]);
        } catch (err) {
            console.error('Error deleting files:', err);
        }
    };

    // Handle folder creation
    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        try {
            const folderPath = currentPath === '/' ? `/${newFolderName}` : `${currentPath}/${newFolderName}`;
            await createDirectory(folderPath, newFolderName);
            await loadFiles(); // Reload files after creation
            setNewFolderName('');
            setShowNewFolder(false);
        } catch (err) {
            console.error('Error creating folder:', err);
        }
    };

    // Handle file upload
    const handleFileUpload = async (files: FileList) => {
        if (!files.length) return;

        try {
            for (const file of Array.from(files)) {
                await uploadFile(file, currentPath);
            }
            await loadFiles(); // Reload files after upload
            setShowUpload(false);
        } catch (err) {
            console.error('Error uploading files:', err);
        }
    };

    // Handle cleanup
    const handleCleanup = async () => {
        if (!confirm('This will scan for orphaned files and remove them. Continue?')) return;

        try {
            const result = await cleanupFiles();
            const cleanupResult = result.results;
            alert(`Cleanup completed: ${cleanupResult.deleted} files deleted, ${formatFileSize(cleanupResult.totalSizeReclaimed)} reclaimed`);
            await loadFiles(); // Reload files after cleanup
            await loadStorageStats(); // Reload stats after cleanup
        } catch (err) {
            console.error('Error during cleanup:', err);
        }
    };

    // Handle file organization
    const handleOrganizeFiles = async () => {
        if (!confirm('This will organize all files into proper folders based on their type. This process may take a while. Continue?')) return;

        try {
            const response = await fetch(`${API_URL}/api/file-organization/organize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();
            
            if (result.success) {
                const { results } = result;
                const message = `File organization completed!
                
Scanned: ${results.scanned} files
Organized: ${results.organized} files
Errors: ${results.errors.length} files

File types organized:
- Images: ${results.summary.images}
- Videos: ${results.summary.videos}
- Audio: ${results.summary.audio}
- Documents: ${results.summary.documents}
- Others: ${results.summary.others}`;
                
                alert(message);
                
                // Reload files and stats after organization
                await loadFiles();
                await loadStorageStats();
            } else {
                alert(`Error organizing files: ${result.error}`);
            }
        } catch (err) {
            console.error('Error during file organization:', err);
            alert('Error organizing files. Please try again.');
        }
    };

    // Filter and sort files
    const filteredFiles = files
        .filter(file => {
            if (searchQuery && !file.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }

            if (filterType === 'all') return true;
            if (filterType === 'images') return file.mimeType.startsWith('image/');
            if (filterType === 'videos') return file.mimeType.startsWith('video/');
            if (filterType === 'audio') return file.mimeType.startsWith('audio/');
            if (filterType === 'documents') return file.mimeType.includes('pdf') || file.mimeType.includes('document') || file.mimeType.includes('sheet');

            return true;
        })
        .sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'date':
                    comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
                    break;
                case 'size':
                    comparison = a.size - b.size;
                    break;
                case 'type':
                    comparison = a.mimeType.localeCompare(b.mimeType);
                    break;
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });

    // Load data on mount and path change
    useEffect(() => {
        loadFiles();
    }, [loadFiles]);

    useEffect(() => {
        loadStorageStats();
    }, [loadStorageStats]);

    // Breadcrumb navigation
    const pathParts = currentPath.split('/').filter(Boolean);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[5000]">
            <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">File Manager</h2>
                        {userId && (
                            <p className="text-sm text-gray-600">
                                Files for chat: {userId}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                    {/* Breadcrumb - only for global file manager */}
                    {!userId && (
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentPath('/')}
                                className="px-2 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded text-gray-900"
                            >
                                Root
                            </button>
                            {pathParts.map((part, index) => (
                                <React.Fragment key={index}>
                                    <span className="text-gray-600">/</span>
                                    <button
                                        onClick={() => setCurrentPath('/' + pathParts.slice(0, index + 1).join('/'))}
                                        className="px-2 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded text-gray-900"
                                    >
                                        {part}
                                    </button>
                                </React.Fragment>
                            ))}
                        </div>
                    )}

                    {/* For user-specific files, show a simple info */}
                    {userId && (
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-900">
                                Items shared in this conversation
                            </span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                        {/* Only show upload and create folder for global file manager */}
                        {!userId && (
                            <>
                                <button
                                    onClick={() => setShowNewFolder(true)}
                                    className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center space-x-1"
                                >
                                    <FaPlus className="w-4 h-4" />
                                    <span>New Folder</span>
                                </button>

                                <button
                                    onClick={() => setShowUpload(true)}
                                    className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center space-x-1"
                                >
                                    <FaUpload className="w-4 h-4" />
                                    <span>Upload</span>
                                </button>
                            </>
                        )}

                        {selectedFiles.length > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center space-x-1"
                                disabled={!!userId} // Disable delete for user-specific files
                            >
                                <FaTrash className="w-4 h-4" />
                                <span>Delete ({selectedFiles.length})</span>
                            </button>
                        )}

                        {/* Only show cleanup for global file manager */}
                        {!userId && (
                            <>
                                <button
                                    onClick={handleCleanup}
                                    className="px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 flex items-center space-x-1"
                                    title="Clean up orphaned files"
                                >
                                    <FaTrash className="w-4 h-4" />
                                    <span>Cleanup</span>
                                </button>
                                
                                <button
                                    onClick={handleOrganizeFiles}
                                    className="px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 flex items-center space-x-1"
                                    title="Organize files into proper folders"
                                >
                                    <FaFolder className="w-4 h-4" />
                                    <span>Organize</span>
                                </button>
                            </>
                        )}

                        <button
                            onClick={() => {
                                loadFiles();
                                loadStorageStats();
                            }}
                            className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center space-x-1"
                            title="Refresh file list"
                        >
                            <FaSync className="w-4 h-4" />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="flex items-center space-x-4 p-4 border-b">
                    <div className="flex-1 relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as FileTypeFilter)}
                        className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    >
                        <option value="all" className="text-gray-900">All Items</option>
                        <option value="images" className="text-gray-900">Images</option>
                        <option value="videos" className="text-gray-900">Videos</option>
                        <option value="audio" className="text-gray-900">Audio</option>
                        <option value="documents" className="text-gray-900">Documents</option>
                    </select>

                    <select
                        value={`${sortBy}-${sortOrder}`}
                        onChange={(e) => {
                            const [sort, order] = e.target.value.split('-');
                            setSortBy(sort as SortBy);
                            setSortOrder(order as SortOrder);
                        }}
                        className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    >
                        <option value="name-asc" className="text-gray-900">Name (A-Z)</option>
                        <option value="name-desc" className="text-gray-900">Name (Z-A)</option>
                        <option value="date-desc" className="text-gray-900">Date (Newest)</option>
                        <option value="date-asc" className="text-gray-900">Date (Oldest)</option>
                        <option value="size-desc" className="text-gray-900">Size (Largest)</option>
                        <option value="size-asc" className="text-gray-900">Size (Smallest)</option>
                    </select>

                    <div className="flex border rounded-md">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'}`}
                        >
                            Grid
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'}`}
                        >
                            List
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* File List */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                                <p className="text-red-700">{error}</p>
                            </div>
                        )}

                        {loading ? (
                            <div className="flex items-center justify-center h-40">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            </div>
                        ) : (
                            <div className={viewMode === 'grid' ? 'grid grid-cols-6 gap-4' : 'space-y-2'}>
                                {filteredFiles.map((file) => (
                                    <div
                                        key={file.id}
                                        className={`
                                            border rounded-lg p-3 relative transition-colors
                                            ${selectedFiles.includes(file.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                                            ${viewMode === 'list' ? 'flex items-center space-x-3' : 'text-center'}
                                                            `}
                                    >
                                        {/* Checkbox for selection */}
                                        {file.type === 'file' && (
                                            <div className={`absolute ${viewMode === 'grid' ? 'top-2 left-2' : 'left-2 top-1/2 transform -translate-y-1/2'} z-10`}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedFiles.includes(file.id) || (selectMode && false)}
                                                    onChange={(e) => handleCheckboxSelect(file, e)}
                                                    className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                        )}

                                        {/* File content - clickable for preview */}
                                        <div 
                                            className="cursor-pointer"
                                            onClick={() => handleFileSelect(file)}
                                        >
                                            <div className={viewMode === 'grid' ? 'mb-2' : ''}>
                                                {file.thumbnail ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={file.thumbnail.startsWith('http') ? file.thumbnail : `${API_URL}${file.thumbnail}`}
                                                        alt={file.name}
                                                        className={viewMode === 'grid' ? 'w-16 h-16 mx-auto object-cover rounded' : 'w-10 h-10 object-cover rounded'}
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                        }}
                                                    />
                                                ) : (
                                                    <div className={`${viewMode === 'grid' ? 'text-4xl' : 'text-2xl'}`}>
                                                        {getFileIcon(file.mimeType, file.type)}
                                                    </div>
                                                )}
                                            </div>

                                            <div className={viewMode === 'list' ? 'flex-1' : ''}>
                                                <p className={`font-medium text-gray-800 ${viewMode === 'grid' ? 'text-sm truncate' : ''}`}>
                                                    {file.name}
                                                </p>
                                                {file.type === 'folder' && (
                                                    <p className="text-xs text-gray-500">Folder</p>
                                                )}
                                                {viewMode === 'list' && (
                                                    <p className="text-xs text-gray-400">
                                                        {new Date(file.updatedAt).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {viewMode === 'list' && file.type === 'file' && (
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePreview(file);
                                                    }}
                                                    className="p-1 text-blue-500 hover:bg-blue-100 rounded"
                                                    title="Preview"
                                                >
                                                    <FaEye />
                                                </button>
                                                <a
                                                    href={file.url?.startsWith('http') ? file.url : `${API_URL}${file.url}`}
                                                    download={file.name}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="p-1 text-green-500 hover:bg-green-100 rounded"
                                                    title="Download"
                                                >
                                                    <FaDownload />
                                                </a>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(file.id);
                                                    }}
                                                    className="p-1 text-red-500 hover:bg-red-100 rounded"
                                                    title="Delete"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Storage Stats or Chat Stats */}
                    <div className="w-80 border-l p-4 overflow-y-auto">
                        {userId ? (
                            // Chat context - show only file type breakdown without titles
                            <div className="space-y-4">
                                {(() => {
                                    const chatStats = calculateChatStats(filteredFiles);
                                    return (
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <div className="text-sm space-y-1">
                                                <div className="flex justify-between">
                                                    <span className="flex items-center text-gray-900">
                                                        <FaImage className="text-green-500 mr-1" />
                                                        Images:
                                                    </span>
                                                    <span className="text-gray-900">{chatStats.breakdown.images}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="flex items-center text-gray-900">
                                                        <FaVideo className="text-red-500 mr-1" />
                                                        Videos:
                                                    </span>
                                                    <span className="text-gray-900">{chatStats.breakdown.videos}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="flex items-center text-gray-900">
                                                        <FaMusic className="text-purple-500 mr-1" />
                                                        Audio:
                                                    </span>
                                                    <span className="text-gray-900">{chatStats.breakdown.audio}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="flex items-center text-gray-900">
                                                        <FaFilePdf className="text-red-600 mr-1" />
                                                        Documents:
                                                    </span>
                                                    <span className="text-gray-900">{chatStats.breakdown.documents}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-900">Others:</span>
                                                    <span className="text-gray-900">{chatStats.breakdown.others}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        ) : (
                            // Full file manager - show storage usage stats
                            <>
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                                    <FaHdd className="mr-2" />
                                    Storage Usage
                                </h3>

                                {storageStats && (
                                    <div className="space-y-4">
                                        {/* Storage Bar */}
                                        <div>
                                            <div className="flex justify-between text-sm text-gray-900 mb-1">
                                                <span>Used: {formatFileSize(storageStats.usedSize)}</span>
                                                <span>Total: {formatFileSize(storageStats.totalSize)}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-500 h-2 rounded-full"
                                                    style={{ width: `${(storageStats.usedSize / storageStats.totalSize) * 100}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-gray-700 mt-1">
                                                {formatFileSize(storageStats.availableSize)} available
                                            </p>
                                        </div>

                                        {/* Item Statistics */}
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <h4 className="font-medium text-gray-900 mb-2">Item Count</h4>
                                            <div className="text-sm space-y-1">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-900">Files:</span>
                                                    <span className="text-gray-900">{storageStats.fileCount}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-900">Folders:</span>
                                                    <span className="text-gray-900">{storageStats.folderCount}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Item Type Breakdown */}
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <h4 className="font-medium text-gray-900 mb-2">By Type</h4>
                                            <div className="text-sm space-y-1">
                                                <div className="flex justify-between">
                                                    <span className="flex items-center text-gray-900">
                                                        <FaImage className="text-green-500 mr-1" />
                                                        Images:
                                                    </span>
                                                    <span className="text-gray-900">{formatFileSize(storageStats.breakdown.images)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="flex items-center text-gray-900">
                                                        <FaVideo className="text-red-500 mr-1" />
                                                        Videos:
                                                    </span>
                                                    <span className="text-gray-900">{formatFileSize(storageStats.breakdown.videos)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="flex items-center text-gray-900">
                                                        <FaMusic className="text-purple-500 mr-1" />
                                                        Audio:
                                                    </span>
                                                    <span className="text-gray-900">{formatFileSize(storageStats.breakdown.audio)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="flex items-center text-gray-900">
                                                        <FaFilePdf className="text-red-600 mr-1" />
                                                        Documents:
                                                    </span>
                                                    <span className="text-gray-900">{formatFileSize(storageStats.breakdown.documents)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-900">Others:</span>
                                                    <span className="text-gray-900">{formatFileSize(storageStats.breakdown.others)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* File Preview Modal */}
                {previewFile && (
                    <Portal containerId="file-preview-portal">
                        <div 
                            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[999999] pointer-events-auto"
                            style={{ 
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                zIndex: 999999,
                                backgroundColor: isFullscreen ? 'black' : 'rgba(0, 0, 0, 0.9)',
                                padding: isFullscreen ? '0' : '1rem'
                            }}
                        >
                            <div className={`${isFullscreen ? 'w-full h-full bg-black' : 'bg-white rounded-lg overflow-hidden max-w-6xl w-full max-h-[95vh]'}`}>
                                {/* Header - Hidden in fullscreen */}
                                {!isFullscreen && (
                                    <div className="flex items-center justify-between p-4 border-b bg-white relative z-10">
                                        <div className="flex items-center space-x-3">
                                            <h3 className="font-semibold text-lg truncate max-w-md">{previewFile.name}</h3>
                                            <span className="text-sm text-gray-500">
                                                {formatFileSize(previewFile.size)}
                                            </span>
                                        </div>
                                        
                                        {/* Control buttons */}
                                        <div className="flex items-center space-x-2">
                                            {previewFile.mimeType.startsWith('image/') && (
                                                <>
                                                    <button
                                                        onClick={handleZoomOut}
                                                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                                                        title="Zoom Out"
                                                    >
                                                        <FaSearchMinus />
                                                    </button>
                                                    <span className="text-sm text-gray-600 min-w-[60px] text-center">
                                                        {Math.round(imageZoom * 100)}%
                                                    </span>
                                                    <button
                                                        onClick={handleZoomIn}
                                                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                                                        title="Zoom In"
                                                    >
                                                        <FaSearchPlus />
                                                    </button>
                                                    <button
                                                        onClick={resetZoom}
                                                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded text-xs"
                                                        title="Reset Zoom"
                                                    >
                                                        1:1
                                                    </button>
                                                    <button
                                                        onClick={toggleFullscreen}
                                                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                                                        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                                                    >
                                                        {isFullscreen ? <FaCompress /> : <FaExpand />}
                                                    </button>
                                                </>
                                            )}
                                            
                                            <button
                                                onClick={() => handleDownload(previewFile)}
                                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                                title="Download"
                                            >
                                                <FaDownload />
                                            </button>
                                            
                                            <button
                                                onClick={closePreview}
                                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                                                title="Close"
                                            >
                                                <FaTimes />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Fullscreen Controls Overlay */}
                                {isFullscreen && (
                                    <div className="absolute top-4 right-4 z-[1000000] flex items-center space-x-2 bg-black bg-opacity-90 rounded-lg p-2 backdrop-blur-sm border border-gray-600">
                                        {previewFile.mimeType.startsWith('image/') && (
                                            <>
                                                <button
                                                    onClick={handleZoomOut}
                                                    className="p-2 text-white hover:text-gray-300 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                                                    title="Zoom Out"
                                                >
                                                    <FaSearchMinus />
                                                </button>
                                                <span className="text-sm text-white min-w-[60px] text-center font-medium">
                                                    {Math.round(imageZoom * 100)}%
                                                </span>
                                                <button
                                                    onClick={handleZoomIn}
                                                    className="p-2 text-white hover:text-gray-300 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                                                    title="Zoom In"
                                                >
                                                    <FaSearchPlus />
                                                </button>
                                                <button
                                                    onClick={resetZoom}
                                                    className="p-2 text-white hover:text-gray-300 hover:bg-white hover:bg-opacity-20 rounded text-xs transition-colors"
                                                    title="Reset Zoom"
                                                >
                                                    1:1
                                                </button>
                                            </>
                                        )}
                                        
                                        <button
                                            onClick={() => handleDownload(previewFile)}
                                            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                                            title="Download"
                                        >
                                            <FaDownload />
                                        </button>
                                        
                                        <button
                                            onClick={toggleFullscreen}
                                            className="p-2 text-white hover:text-gray-300 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                                            title="Exit Fullscreen"
                                        >
                                            <FaCompress />
                                        </button>
                                        
                                        <button
                                            onClick={closePreview}
                                            className="p-2 text-white hover:text-gray-300 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                                            title="Close"
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                )}

                                {/* Fullscreen File Info Overlay */}
                                {isFullscreen && (
                                    <div className="absolute top-4 left-4 z-[1000000] bg-black bg-opacity-90 rounded-lg p-3 max-w-md backdrop-blur-sm border border-gray-600">
                                        <h3 className="font-semibold text-white text-lg truncate">{previewFile.name}</h3>
                                        <span className="text-sm text-gray-300">
                                            {formatFileSize(previewFile.size)}
                                        </span>
                                    </div>
                                )}
                                
                                {/* Content */}
                                <div className={`overflow-hidden ${isFullscreen ? 'h-full w-full' : 'max-h-[calc(95vh-73px)]'}`}>
                                    {previewFile.mimeType.startsWith('image/') ? (
                                        <div 
                                            className={`w-full flex items-center justify-center bg-gray-50 relative overflow-hidden ${isFullscreen ? 'h-full bg-black' : 'h-full'}`}
                                            onWheel={handleWheel}
                                            onMouseDown={handleMouseDown}
                                            onMouseMove={handleMouseMove}
                                            onMouseUp={handleMouseUp}
                                            onMouseLeave={handleMouseUp}
                                            style={{ cursor: imageZoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img 
                                                src={previewFile.url?.startsWith('http') ? previewFile.url : `${API_URL}${previewFile.url}`} 
                                                alt={previewFile.name} 
                                                className="max-w-none transition-transform duration-200"
                                                style={{
                                                    transform: `scale(${imageZoom}) translate(${imagePan.x / imageZoom}px, ${imagePan.y / imageZoom}px)`,
                                                    maxHeight: isFullscreen ? '100vh' : '70vh',
                                                    maxWidth: imageZoom === 1 ? '100%' : 'none'
                                                }}
                                                draggable={false}
                                                onLoad={() => {
                                                    // Reset pan when image loads
                                                    setImagePan({ x: 0, y: 0 });
                                                }}
                                            />
                                            
                                            {/* Zoom instructions */}
                                            {imageZoom === 1 && !isFullscreen && (
                                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm z-10">
                                                    Use mouse wheel to zoom • Click and drag to pan when zoomed
                                                </div>
                                            )}

                                            {/* Fullscreen zoom instructions */}
                                            {imageZoom === 1 && isFullscreen && (
                                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-90 text-white px-3 py-1 rounded text-sm z-[1000000] backdrop-blur-sm border border-gray-600">
                                                    Mouse wheel: zoom • Click & drag: pan • ESC: exit fullscreen
                                                </div>
                                            )}
                                        </div>
                                    ) : previewFile.mimeType.startsWith('video/') ? (
                                        <div className="p-4 flex items-center justify-center bg-gray-50">
                                            <video controls className="max-w-full max-h-96">
                                                <source src={previewFile.url?.startsWith('http') ? previewFile.url : `${API_URL}${previewFile.url}`} type={previewFile.mimeType} />
                                                Your browser does not support the video tag.
                                            </video>
                                        </div>
                                    ) : previewFile.mimeType.startsWith('audio/') ? (
                                        <div className="p-8 flex flex-col items-center justify-center bg-gray-50">
                                            <div className="text-6xl mb-6 text-purple-500">
                                                <FaMusic />
                                            </div>
                                            <h4 className="text-lg font-medium mb-4 text-center">{previewFile.name}</h4>
                                            <audio controls className="w-full max-w-md">
                                                <source src={previewFile.url?.startsWith('http') ? previewFile.url : `${API_URL}${previewFile.url}`} type={previewFile.mimeType} />
                                                Your browser does not support the audio tag.
                                            </audio>
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center bg-gray-50">
                                            <div className="text-6xl mb-6 text-gray-400">
                                                {getFileIcon(previewFile.mimeType, previewFile.type)}
                                            </div>
                                            <h4 className="text-lg font-medium mb-2">{previewFile.name}</h4>
                                            <p className="text-gray-600 mb-6">Preview not available for this file type</p>
                                            <p className="text-sm text-gray-500 mb-4">
                                                Size: {formatFileSize(previewFile.size)} • Type: {previewFile.mimeType}
                                            </p>
                                            <button
                                                onClick={() => handleDownload(previewFile)}
                                                className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                            >
                                                <FaDownload className="mr-2" />
                                                Download File
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Portal>
                )}

                {/* Upload Modal */}
                {showUpload && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9998]">
                        <div className="bg-white rounded-lg max-w-md w-full mx-4">
                            <div className="flex items-center justify-between p-4 border-b">
                                <h3 className="font-semibold">Upload Files</h3>
                                <button
                                    onClick={() => setShowUpload(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                            <div className="p-4">
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                                    <div className="text-center">
                                        <FaUpload className="mx-auto text-gray-400 mb-4" size={48} />
                                        <p className="text-gray-600 mb-4">
                                            Drag & drop files here or click to select
                                        </p>
                                        <input
                                            type="file"
                                            multiple
                                            onChange={(e) => {
                                                if (e.target.files) {
                                                    handleFileUpload(e.target.files);
                                                }
                                            }}
                                            className="hidden"
                                            id="upload-input"
                                        />
                                        <label
                                            htmlFor="upload-input"
                                            className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                                        >
                                            Select Files
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* New Folder Modal */}
                {showNewFolder && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9998]">
                        <div className="bg-white rounded-lg max-w-md w-full mx-4">
                            <div className="flex items-center justify-between p-4 border-b">
                                <h3 className="font-semibold">New Folder</h3>
                                <button
                                    onClick={() => {
                                        setShowNewFolder(false);
                                        setNewFolderName('');
                                    }}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                            <div className="p-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Folder Name
                                        </label>
                                        <input
                                            type="text"
                                            value={newFolderName}
                                            onChange={(e) => setNewFolderName(e.target.value)}
                                            placeholder="Enter folder name"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleCreateFolder();
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="flex justify-end space-x-3">
                                        <button
                                            onClick={() => {
                                                setShowNewFolder(false);
                                                setNewFolderName('');
                                            }}
                                            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleCreateFolder}
                                            disabled={!newFolderName.trim()}
                                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Create
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileManager;
