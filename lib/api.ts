const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'mess_owner' | 'project_admin';
}

interface OtpRequest {
  email: string;
  code: string;
}

interface PasswordResetRequest {
  email: string;
  password: string;
  otp: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<ApiResponse<{ token: string; user: any }>> {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<{ userId: string; email: string; name: string; role: string }>> {
    // Convert project_admin to user for backend compatibility
    const backendUserData = {
      ...userData,
      role: userData.role === 'project_admin' ? 'user' : userData.role
    };
    
    return this.request<{ userId: string; email: string; name: string; role: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(backendUserData),
    });
  }

  async verifyOtp(otpData: OtpRequest): Promise<ApiResponse<{ userId: string; email: string; name: string; role: string }>> {
    return this.request<{ userId: string; email: string; name: string; role: string }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(otpData),
    });
  }

  async resendOtp(email: string): Promise<ApiResponse> {
    return this.request('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(resetData: PasswordResetRequest): Promise<ApiResponse> {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(resetData),
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.request('/auth/health');
  }
}

export const apiService = new ApiService();
export default apiService; 