"use client";

import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiEye, FiEyeOff, FiUsers, FiActivity } from 'react-icons/fi';
import { userManagementService, UserLogin, CreateUserRequest, UpdateUserRequest } from '@/services/userManagementService';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import AdminPerformance from '@/components/dashboard/AdminPerformance';
import AdminDetailView from '@/components/dashboard/AdminDetailView';

const UserManagement: React.FC = () => {
    useAuth(); // Protect the route

    const [users, setUsers] = useState<UserLogin[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserLogin | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'users' | 'performance'>('users');
    const [selectedAdminId, setSelectedAdminId] = useState<string | undefined>(undefined);
    const [showAdminDetail, setShowAdminDetail] = useState(false);
    const router = useRouter();

    // Form state
    const [formData, setFormData] = useState<CreateUserRequest>({
        nama_admin: '',
        username: '',
        password: '',
        role: 'Admin'
    });

    const [editFormData, setEditFormData] = useState<UpdateUserRequest>({
        nama_admin: '',
        username: '',
        password: '',
        role: 'Admin'
    });

    // Check user role and load users on component mount
    useEffect(() => {
        const checkUserRole = () => {
            try {
                const userData = localStorage.getItem('user');
                if (userData) {
                    const user = JSON.parse(userData);
                    setUserRole(user.role || null);
                    if (user.role !== 'SuperAdmin') {
                        router.push('/dashboard');
                        return;
                    }
                } else {
                    setUserRole(null);
                }
            } catch (error) {
                console.error('Error parsing user data from localStorage:', error);
                setUserRole(null);
            }
        };

        checkUserRole();
        if (userRole === 'SuperAdmin' || userRole === null) {
            loadUsers();
        }
    }, [router, userRole]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await userManagementService.getAllUsers();
            
            // Filter out any invalid users
            const validUsers = Array.isArray(data) ? data.filter(user => {
                return user && 
                    typeof user === 'object' && 
                    user.username && 
                    user.role;
            }) : [];
            
            setUsers(validUsers);
        } catch (error) {
            console.error('Error loading users:', error);
            alert('Error loading users: ' + (error instanceof Error ? error.message : 'Unknown error'));
            setUsers([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    // Filter users based on search term
    const filteredUsers = users.filter(user => {
        // Check if user and required properties exist
        if (!user || !user.username || !user.role) {
            return false;
        }
        
        const namaAdmin = user.nama_admin || user.username; // Fallback to username if nama_admin is missing
        
        return (
            namaAdmin.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.role.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    // Handle create user
    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Filter out empty nama_admin if not provided
            const userData = {
                username: formData.username,
                password: formData.password,
                role: formData.role,
                ...(formData.nama_admin?.trim() && { nama_admin: formData.nama_admin.trim() })
            };
            
            await userManagementService.createUser(userData);
            setIsCreateModalOpen(false);
            setFormData({ nama_admin: '', username: '', password: '', role: 'Admin' });
            loadUsers();
            alert('User berhasil dibuat!');
        } catch (error) {
            console.error('Error creating user:', error);
            alert('Error creating user: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    // Handle edit user
    const handleEditUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        try {
            // Filter out empty values
            const updateData: UpdateUserRequest = {};
            if (editFormData.nama_admin?.trim()) updateData.nama_admin = editFormData.nama_admin;
            if (editFormData.username?.trim()) updateData.username = editFormData.username;
            if (editFormData.password?.trim()) updateData.password = editFormData.password;
            if (editFormData.role) updateData.role = editFormData.role;

            await userManagementService.updateUser(selectedUser._id!, updateData);
            setIsEditModalOpen(false);
            setSelectedUser(null);
            setEditFormData({ nama_admin: '', username: '', password: '', role: 'Admin' });
            loadUsers();
            alert('User berhasil diupdate!');
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Error updating user');
        }
    };

    // Handle delete user
    const handleDeleteUser = async () => {
        if (!selectedUser) return;

        try {
            await userManagementService.deleteUser(selectedUser._id!);
            setIsDeleteModalOpen(false);
            setSelectedUser(null);
            loadUsers();
            alert('User berhasil dihapus!');
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error deleting user');
        }
    };

    // Open edit modal with user data
    const openEditModal = (user: UserLogin) => {
        setSelectedUser(user);
        setEditFormData({
            nama_admin: user.nama_admin || '',
            username: user.username || '',
            password: '',
            role: user.role
        });
        setIsEditModalOpen(true);
    };

    // Open delete modal
    const openDeleteModal = (user: UserLogin) => {
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
    };

    // Handle view admin performance
    const viewAdminPerformance = (adminId: string) => {
        setSelectedAdminId(adminId);
        setActiveTab('performance');
        setShowAdminDetail(true);
    };

    // Handle back from admin detail
    const handleBackFromDetail = () => {
        setShowAdminDetail(false);
        setSelectedAdminId(undefined);
    };

    if (loading) {
        return (
            <div className="w-full h-full bg-gray-50 flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Loading users...</p>
                </div>
            </div>
        );
    }

    // Show access denied if not SuperAdmin
    if (userRole && userRole !== 'SuperAdmin') {
        return (
            <div className="w-full h-full bg-gray-50 flex items-center justify-center min-h-screen">
                <div className="text-center p-8">
                    <div className="text-red-500 text-6xl mb-6">🚫</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h1>
                    <p className="text-gray-600 mb-2">You don&apos;t have permission to access this page.</p>
                    <p className="text-sm text-gray-500">Only SuperAdmin can access User Management.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-gray-50">
            <div className="max-w-7xl mx-auto p-4 space-y-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                            <p className="text-gray-600 mt-1">Kelola akun pengguna dan monitor performa admin</p>
                        </div>
                        {activeTab === 'users' && (
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                            >
                                <FiPlus size={18} />
                                Tambah User
                            </button>
                        )}
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => {
                                setActiveTab('users');
                                setShowAdminDetail(false);
                                setSelectedAdminId(undefined);
                            }}
                            className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors border-b-2 ${
                                activeTab === 'users' 
                                    ? 'border-blue-500 text-blue-600 bg-blue-50' 
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <FiUsers size={18} />
                            User Management
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('performance');
                                setShowAdminDetail(false);
                                setSelectedAdminId(undefined);
                            }}
                            className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors border-b-2 ${
                                activeTab === 'performance' 
                                    ? 'border-blue-500 text-blue-600 bg-blue-50' 
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <FiActivity size={18} />
                            Admin Performance
                        </button>
                    </div>
                    
                    <div className="p-6">
                        {/* Tab Content */}
                        {activeTab === 'performance' && showAdminDetail && selectedAdminId ? (
                            <AdminDetailView 
                                adminId={selectedAdminId} 
                                onBack={handleBackFromDetail}
                            />
                        ) : activeTab === 'performance' ? (
                            <AdminPerformance selectedAdminId={selectedAdminId} />
                        ) : (
                            <>
                                {/* Search and Stats */}
                                <div className="mb-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                        {/* Search */}
                                        <div className="flex-1 relative">
                                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                placeholder="Cari nama admin, username, atau role..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full h-10 pl-10 pr-4 rounded-full border border-gray-300 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:ring-2 hover:ring-blue-200 transition bg-white"
                                            />
                                        </div>

                                        {/* Stats */}
                                        <div className="flex items-center gap-6">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-blue-600">{filteredUsers.length}</div>
                                                <div className="text-xs text-gray-500">Total Users</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-green-600">{users.filter(u => u.role === 'Admin').length}</div>
                                                <div className="text-xs text-gray-500">Admins</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-purple-600">{users.filter(u => u.role === 'SuperAdmin').length}</div>
                                                <div className="text-xs text-gray-500">SuperAdmins</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Users Table */}
                                <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-100/70 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                        Nama Admin
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                        Username
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                        Role
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                        Created At
                                                    </th>
                                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredUsers.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="px-6 py-16 text-center">
                                                            <div className="text-gray-400 text-sm">
                                                                {searchTerm ? '🔍 Tidak ada user yang ditemukan' : '👤 Belum ada user terdaftar'}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredUsers.map((user) => {
                                                        // Safety check for user data
                                                        if (!user || !user._id || !user.username || !user.role) {
                                                            return null;
                                                        }

                                                        return (
                                                            <tr key={user._id} className="hover:bg-gray-50/70 transition-colors">
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="flex items-center">
                                                                        <div className="flex-shrink-0 h-10 w-10">
                                                                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center shadow-sm">
                                                                                <span className="text-white font-semibold text-sm">
                                                                                    {(user.nama_admin || user.username).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="ml-4">
                                                                            <div className="text-sm font-medium text-gray-900">
                                                                                {user.nama_admin || user.username}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                                                                        {user.username}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                        user.role === 'SuperAdmin' 
                                                                            ? 'bg-purple-100 text-purple-800' 
                                                                            : user.role === 'Bupati'
                                                                            ? 'bg-yellow-100 text-yellow-800'
                                                                            : 'bg-blue-100 text-blue-800'
                                                                    }`}>
                                                                        {user.role}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID', {
                                                                        day: '2-digit',
                                                                        month: 'short',
                                                                        year: 'numeric'
                                                                    }) : '-'}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        {/* View Performance Button - only for Admin and SuperAdmin */}
                                                                        {(user.role === 'Admin' || user.role === 'SuperAdmin') && (
                                                                            <button
                                                                                onClick={() => viewAdminPerformance(user._id!)}
                                                                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:scale-105"
                                                                                title="View Performance"
                                                                            >
                                                                                <FiActivity size={16} />
                                                                            </button>
                                                                        )}
                                                                        
                                                                        {/* Edit Button */}
                                                                        <button
                                                                            onClick={() => openEditModal(user)}
                                                                            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-all duration-200 hover:scale-105"
                                                                            title="Edit User"
                                                                        >
                                                                            <FiEdit2 size={16} />
                                                                        </button>
                                                                        
                                                                        {/* Delete Button */}
                                                                        <button
                                                                            onClick={() => openDeleteModal(user)}
                                                                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-105"
                                                                            title="Delete User"
                                                                        >
                                                                            <FiTrash2 size={16} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Modals */}
                {/* Create User Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Tambah User Baru</h2>
                            <form onSubmit={handleCreateUser} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Nama Admin (Opsional)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nama_admin}
                                        onChange={(e) => setFormData({ ...formData, nama_admin: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-700 bg-white"
                                        placeholder="Masukkan nama admin (opsional)"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-700 bg-white"
                                        placeholder="Masukkan username"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-700 bg-white"
                                            placeholder="Masukkan password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Role
                                    </label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value as 'Admin' | 'SuperAdmin' | 'Bupati' })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-700 bg-white"
                                    >
                                        <option value="Admin">Admin</option>
                                        <option value="SuperAdmin">SuperAdmin</option>
                                        <option value="Bupati">Bupati</option>
                                    </select>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsCreateModalOpen(false);
                                            setFormData({ nama_admin: '', username: '', password: '', role: 'Admin' });
                                        }}
                                        className="flex-1 px-4 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm"
                                    >
                                        Tambah User
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit User Modal */}
                {isEditModalOpen && selectedUser && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Edit User</h2>
                            <form onSubmit={handleEditUser} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Nama Admin
                                    </label>
                                    <input
                                        type="text"
                                        value={editFormData.nama_admin}
                                        onChange={(e) => setEditFormData({ ...editFormData, nama_admin: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-700 bg-white"
                                        placeholder="Masukkan nama admin"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        value={editFormData.username}
                                        onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-700 bg-white"
                                        placeholder="Masukkan username"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Password (Kosongkan jika tidak ingin mengubah)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={editFormData.password}
                                            onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-700 bg-white"
                                            placeholder="Masukkan password baru"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Role
                                    </label>
                                    <select
                                        value={editFormData.role}
                                        onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as 'Admin' | 'SuperAdmin' | 'Bupati' })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-700 bg-white"
                                    >
                                        <option value="Admin">Admin</option>
                                        <option value="SuperAdmin">SuperAdmin</option>
                                        <option value="Bupati">Bupati</option>
                                    </select>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditModalOpen(false);
                                            setSelectedUser(null);
                                            setEditFormData({ nama_admin: '', username: '', password: '', role: 'Admin' });
                                        }}
                                        className="flex-1 px-4 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm"
                                    >
                                        Update User
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {isDeleteModalOpen && selectedUser && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Konfirmasi Hapus</h2>
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                Apakah Anda yakin ingin menghapus user <strong className="text-gray-900">{selectedUser.nama_admin || selectedUser.username}</strong>?{' '}
                                Tindakan ini tidak dapat dibatalkan.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setIsDeleteModalOpen(false);
                                        setSelectedUser(null);
                                    }}
                                    className="flex-1 px-4 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleDeleteUser}
                                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium shadow-sm"
                                >
                                    Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
