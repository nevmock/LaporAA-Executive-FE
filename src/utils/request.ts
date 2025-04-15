import axios, {AxiosResponse} from 'axios';
import Cookies from 'js-cookie';

const request = axios.create({
	baseURL: `${process.env.NEXT_PUBLIC_BE_BASE_URL}/api`,
	timeout: 60000 * 5, // 5 menit
	headers: {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Headers': '*',
		'Access-Control-Allow-Credentials': 'false',
	},
});

request.interceptors.request.use(
	(config: any) => {
		const token = Cookies.get('token');
		if (token) {
			config.headers = {
				...config.headers,
				Authorization: `Bearer ${token}`,
			};
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


export default {
	get: <T = any>(url: string, params?: any, headers: Record<string, any> = {}) =>
		request<T>({method: 'get', url, params, headers}),

	post: <T = any>(url: string, data?: any, headers: Record<string, any> = {}) =>
		request<T>({method: 'post', url, data, headers}),

	put: <T = any>(url: string, data?: any, headers: Record<string, any> = {}) =>
		request<T>({method: 'put', url, data, headers}),

	delete: <T = any>(url: string, data?: any, headers: Record<string, any> = {}) =>
		request<T>({method: 'delete', url, data, headers}),

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
