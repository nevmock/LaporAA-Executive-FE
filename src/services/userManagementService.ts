import axiosInstance from '@/utils/axiosInstance';

export interface UserLogin {
  _id?: string;
  nama_admin?: string; // Made optional since some users might not have this field
  username: string;
  password?: string;
  role: 'Admin' | 'SuperAdmin' | 'Bupati'; // Added 'Bupati' role
  createdAt?: string;
  updatedAt?: string;
  __v?: number; // MongoDB version field
}

export interface CreateUserRequest {
  nama_admin?: string; // Made optional
  username: string;
  password: string;
  role: 'Admin' | 'SuperAdmin' | 'Bupati'; // Added 'Bupati' role
}

export interface UpdateUserRequest {
  nama_admin?: string;
  username?: string;
  password?: string;
  role?: 'Admin' | 'SuperAdmin' | 'Bupati'; // Added 'Bupati' role
}

export const userManagementService = {
  // Get all user logins
  getAllUsers: async (): Promise<UserLogin[]> => {
    const response = await axiosInstance.get('/userLogin');
    return response.data;
  },

  // Get user login by ID
  getUserById: async (userId: string): Promise<UserLogin> => {
    const response = await axiosInstance.get(`/userLogin/${userId}`);
    return response.data;
  },

  // Create new user login
  createUser: async (userData: CreateUserRequest): Promise<UserLogin> => {
    const response = await axiosInstance.post('/userLogin', userData);
    return response.data;
  },

  // Update user login
  updateUser: async (userId: string, userData: UpdateUserRequest): Promise<UserLogin> => {
    const response = await axiosInstance.put(`/userLogin/${userId}`, userData);
    return response.data;
  },

  // Delete user login
  deleteUser: async (userId: string): Promise<void> => {
    await axiosInstance.delete(`/userLogin/${userId}`);
  },
};
