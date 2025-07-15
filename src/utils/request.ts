import axios, {AxiosResponse, InternalAxiosRequestConfig, AxiosRequestConfig} from 'axios';
import Cookies from 'js-cookie';

const request = axios.create({
	baseURL: `${process.env.NEXT_PUBLIC_BE_BASE_URL}/api`,
	timeout: 30000, // 30 seconds timeout
	headers: {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Headers': '*',
		'Access-Control-Allow-Credentials': 'false',
	},
});

request.interceptors.request.use(
	(config: InternalAxiosRequestConfig) => {
		const token = Cookies.get('token');
		if (token && config.headers) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

/**
 * Fungsi untuk menangani token yang sudah kadaluarsa
 */
const expiredTokenHandler = () => {
	localStorage.clear();
	Cookies.remove('token');
	window.location.href = '/auth';
};

request.interceptors.response.use(
	(response: AxiosResponse) => {
		return response;
	},
	(error) => {
		if (error.response) {
			if (error.response.status === 401) {
				expiredTokenHandler();
			}
		} else if (error.code === 'ERR_NETWORK') {
			// window.history.pushState({}, 'Redirect Network Error', '/auth');
			if (error.response?.status === 401) {
				expiredTokenHandler();
			}
		}
		return Promise.reject(error);
	}
);


const requestExports = {
	get: <T = unknown>(url: string, params?: unknown, headers: Record<string, string> = {}) =>
		request<T>({method: 'get', url, params, headers} as AxiosRequestConfig),

	post: <T = unknown>(url: string, data?: unknown, headers: Record<string, string> = {}) =>
		request<T>({method: 'post', url, data, headers} as AxiosRequestConfig),

	put: <T = unknown>(url: string, data?: unknown, headers: Record<string, string> = {}) =>
		request<T>({method: 'put', url, data, headers} as AxiosRequestConfig),

	delete: <T = unknown>(url: string, data?: unknown, headers: Record<string, string> = {}) =>
		request<T>({method: 'delete', url, data, headers} as AxiosRequestConfig),

	setToken: (token?: string) => {
		if (token) {
			request.defaults.headers.common['Authorization'] = `Bearer ${token}`;
			Cookies.set('token', token);
		} else {
			delete request.defaults.headers.common['Authorization'];
			Cookies.remove('token');
		}
	}
};

export default requestExports;
