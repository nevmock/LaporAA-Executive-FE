import { useState, useCallback } from 'react';
import axios from '../utils/axiosInstance';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size: number;
  mimeType: string;
  path: string;
  createdAt: string;
  updatedAt: string;
  url?: string;
  thumbnail?: string;
}

interface StorageStats {
  totalSize: number;
  usedSize: number;
  availableSize: number;
  fileCount: number;
  folderCount: number;
  breakdown: {
    images: number;
    videos: number;
    audio: number;
    documents: number;
    others: number;
  };
  directories?: {
    uploads: {
      size: number;
      fileCount: number;
      folderCount: number;
    };
    assets: {
      size: number;
      fileCount: number;
      folderCount: number;
    };
    uploadsTindakan: {
      size: number;
      fileCount: number;
      folderCount: number;
    };
  };
}

interface FileListResponse {
  files: FileItem[];
  total: number;
  hasMore: boolean;
  currentPath: string;
}

interface CleanupResult {
  scanned: number;
  deleted: number;
  failed: number;
  totalSizeReclaimed: number;
  files: Array<{
    path: string;
    relativePath: string;
    size: number;
    mtime: string;
  }>;
}

export const useFileManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get file list
  const getFiles = useCallback(async (options: {
    path?: string;
    search?: string;
    filter?: 'all' | 'images' | 'videos' | 'audio' | 'documents';
    sort?: 'name' | 'date' | 'size' | 'type';
    order?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
    userId?: string; // Add userId parameter
  } = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      
      if (options.path) params.append('path', options.path);
      if (options.search) params.append('search', options.search);
      if (options.filter) params.append('filter', options.filter);
      if (options.sort) params.append('sort', options.sort);
      if (options.order) params.append('order', options.order);
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.offset) params.append('offset', options.offset.toString());
      if (options.userId) params.append('userId', options.userId); // Add userId to params

      const response = await axios.get(`/files?${params}`);
      return response.data as FileListResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch files';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get storage statistics
  const getStorageStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/files/stats');
      return response.data as StorageStats;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch storage statistics';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete file
  const deleteFile = useCallback(async (fileId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.delete(`/files/${fileId}`);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete file';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Bulk delete files
  const bulkDeleteFiles = useCallback(async (fileIds: string[]) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/files/bulk-delete', { fileIds });
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete files';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create directory
  const createDirectory = useCallback(async (path: string, name: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/files/mkdir', { path, name });
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create directory';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cleanup old files
  const cleanupFiles = useCallback(async (options: {
    olderThanDays?: number;
    fileTypes?: string[];
    dryRun?: boolean;
  } = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/files/cleanup', {
        olderThanDays: options.olderThanDays || 30,
        fileTypes: options.fileTypes || [],
        dryRun: options.dryRun !== false // Default to true
      });
      return response.data as { message: string; dryRun: boolean; results: CleanupResult };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cleanup files';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload file
  const uploadFile = useCallback(async (
    file: File, 
    path: string = '/', 
    onProgress?: (progress: number) => void
  ) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', path);

      const response = await axios.post('/chat/send/document/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });

      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    clearError,
    
    // File operations
    getFiles,
    deleteFile,
    bulkDeleteFiles,
    uploadFile,
    
    // Directory operations
    createDirectory,
    
    // Maintenance operations
    cleanupFiles,
    
    // Statistics
    getStorageStats,
  };
};

export type {
  FileItem,
  StorageStats,
  FileListResponse,
  CleanupResult,
};
