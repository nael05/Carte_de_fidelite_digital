import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const axiosInstance = axios.create({
  baseURL: API_URL,
})

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  const deviceId = localStorage.getItem('deviceId')
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (deviceId) {
    config.headers['X-Device-Id'] = deviceId
  }
  
  return config
})
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const userRole = localStorage.getItem('userRole')
      
      localStorage.removeItem('token')
      localStorage.removeItem('userRole')
      localStorage.removeItem('deviceId')
      localStorage.removeItem('companyId')
      localStorage.removeItem('companyName')
      const isLoginRequest = error.config.url.includes('login')
      
      if (!isLoginRequest) {
        if (userRole === 'admin') {
          window.location.href = '/master-admin-secret'
        } else {
          window.location.href = '/pro/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
