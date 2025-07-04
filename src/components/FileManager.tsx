import React, { useState, useEffect } from 'react';
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
    FaSort,
    FaFilter,
    FaHdd,
    FaPlus,
    FaTimes,
    FaSync
} from 'react-icons/fa';
import { useFileManagement, FileItem, StorageStats } from '../hooks/useFileManagement';

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL || "http://localhost:3001";

interface FileManagerProps {
    onClose: () => void;
    onFileSelect?: (file: FileItem) => void;
    selectMode?: boolean;
    userId?: string; // Add userId to scope file manager to specific user
    chatSession?: string; // Add chat session ID
}

const FileManager: React.FC<FileManagerProps> = ({
    onClose,
    onFileSelect,
    selectMode = false,
    userId,
    chatSession
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
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'images' | 'videos' | 'audio' | 'documents'>('all');
    const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
    const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
    const [showUpload, setShowUpload] = useState(false);
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

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
    const loadFiles = async () => {
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
    };

    // Load storage statistics
    const loadStorageStats = async () => {
        try {
            const stats = await getStorageStats();
            setStorageStats(stats);
        } catch (err) {
            console.error('Error loading storage stats:', err);
        }
    };

    // Handle file selection
    const handleFileSelect = (file: FileItem) => {
        if (selectMode && onFileSelect) {
            onFileSelect(file);
            onClose();
            return;
        }

        if (file.type === 'folder') {
            setCurrentPath(file.path);
        } else {
            if (selectedFiles.includes(file.id)) {
                setSelectedFiles(selectedFiles.filter(id => id !== file.id));
            } else {
                setSelectedFiles([...selectedFiles, file.id]);
            }
        }
    };

    // Handle file preview
    const handlePreview = (file: FileItem) => {
        setPreviewFile(file);
    };

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
    }, [currentPath, searchQuery, filterType, sortBy, sortOrder]);

    useEffect(() => {
        loadStorageStats();
    }, []);

    // Breadcrumb navigation
    const pathParts = currentPath.split('/').filter(Boolean);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                                className="px-2 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                            >
                                Root
                            </button>
                            {pathParts.map((part, index) => (
                                <React.Fragment key={index}>
                                    <span className="text-gray-400">/</span>
                                    <button
                                        onClick={() => setCurrentPath('/' + pathParts.slice(0, index + 1).join('/'))}
                                        className="px-2 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
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
                            <span className="text-sm text-gray-600">
                                Files shared in this conversation
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
                            placeholder="Search files..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Files</option>
                        <option value="images">Images</option>
                        <option value="videos">Videos</option>
                        <option value="audio">Audio</option>
                        <option value="documents">Documents</option>
                    </select>

                    <select
                        value={`${sortBy}-${sortOrder}`}
                        onChange={(e) => {
                            const [sort, order] = e.target.value.split('-');
                            setSortBy(sort as any);
                            setSortOrder(order as any);
                        }}
                        className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="name-asc">Name (A-Z)</option>
                        <option value="name-desc">Name (Z-A)</option>
                        <option value="date-desc">Date (Newest)</option>
                        <option value="date-asc">Date (Oldest)</option>
                        <option value="size-desc">Size (Largest)</option>
                        <option value="size-asc">Size (Smallest)</option>
                    </select>

                    <div className="flex border rounded-md">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                        >
                            Grid
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
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
                      border rounded-lg p-3 cursor-pointer transition-colors
                      ${selectedFiles.includes(file.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                      ${viewMode === 'list' ? 'flex items-center space-x-3' : 'text-center'}
                    `}
                                        onClick={() => handleFileSelect(file)}
                                    >
                                        <div className={viewMode === 'grid' ? 'mb-2' : ''}>
                                            {file.thumbnail ? (
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
                                            <p className="text-xs text-gray-500">
                                                {file.type === 'folder' ? 'Folder' : formatFileSize(file.size)}
                                            </p>
                                            {viewMode === 'list' && (
                                                <p className="text-xs text-gray-400">
                                                    {new Date(file.updatedAt).toLocaleDateString()}
                                                </p>
                                            )}
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

                    {/* Sidebar - Storage Stats */}
                    <div className="w-80 border-l p-4 overflow-y-auto">
                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                            <FaHdd className="mr-2" />
                            Storage Usage
                        </h3>

                        {storageStats && (
                            <div className="space-y-4">
                                {/* Storage Bar */}
                                <div>
                                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                                        <span>Used: {formatFileSize(storageStats.usedSize)}</span>
                                        <span>Total: {formatFileSize(storageStats.totalSize)}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full"
                                            style={{ width: `${(storageStats.usedSize / storageStats.totalSize) * 100}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formatFileSize(storageStats.availableSize)} available
                                    </p>
                                </div>

                                {/* File Statistics */}
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <h4 className="font-medium text-gray-700 mb-2">File Count</h4>
                                    <div className="text-sm space-y-1">
                                        <div className="flex justify-between">
                                            <span>Files:</span>
                                            <span>{storageStats.fileCount}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Folders:</span>
                                            <span>{storageStats.folderCount}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* File Type Breakdown */}
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <h4 className="font-medium text-gray-700 mb-2">By Type</h4>
                                    <div className="text-sm space-y-1">
                                        <div className="flex justify-between">
                                            <span className="flex items-center">
                                                <FaImage className="text-green-500 mr-1" />
                                                Images:
                                            </span>
                                            <span>{formatFileSize(storageStats.breakdown.images)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="flex items-center">
                                                <FaVideo className="text-red-500 mr-1" />
                                                Videos:
                                            </span>
                                            <span>{formatFileSize(storageStats.breakdown.videos)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="flex items-center">
                                                <FaMusic className="text-purple-500 mr-1" />
                                                Audio:
                                            </span>
                                            <span>{formatFileSize(storageStats.breakdown.audio)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="flex items-center">
                                                <FaFilePdf className="text-red-600 mr-1" />
                                                Documents:
                                            </span>
                                            <span>{formatFileSize(storageStats.breakdown.documents)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Others:</span>
                                            <span>{formatFileSize(storageStats.breakdown.others)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* File Preview Modal */}
                {previewFile && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
                        <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
                            <div className="flex items-center justify-between p-4 border-b">
                                <h3 className="font-semibold">{previewFile.name}</h3>
                                <button
                                    onClick={() => setPreviewFile(null)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="p-4">
                                {previewFile.mimeType.startsWith('image/') ? (
                                    <img 
                                        src={previewFile.url?.startsWith('http') ? previewFile.url : `${API_URL}${previewFile.url}`} 
                                        alt={previewFile.name} 
                                        className="max-w-full max-h-96 mx-auto" 
                                    />
                                ) : previewFile.mimeType.startsWith('video/') ? (
                                    <video controls className="max-w-full max-h-96 mx-auto">
                                        <source src={previewFile.url?.startsWith('http') ? previewFile.url : `${API_URL}${previewFile.url}`} type={previewFile.mimeType} />
                                    </video>
                                ) : previewFile.mimeType.startsWith('audio/') ? (
                                    <audio controls className="w-full">
                                        <source src={previewFile.url?.startsWith('http') ? previewFile.url : `${API_URL}${previewFile.url}`} type={previewFile.mimeType} />
                                    </audio>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="text-6xl mb-4">
                                            {getFileIcon(previewFile.mimeType, previewFile.type)}
                                        </div>
                                        <p className="text-gray-600">Preview not available for this file type</p>
                                        <a
                                            href={previewFile.url?.startsWith('http') ? previewFile.url : `${API_URL}${previewFile.url}`}
                                            download={previewFile.name}
                                            className="inline-flex items-center mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                        >
                                            <FaDownload className="mr-2" />
                                            Download
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Upload Modal */}
                {showUpload && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
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
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
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
