const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://keze.bissols.com/api';

interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  protected async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
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
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Game-specific API methods
  async getUserData(telegramId: number) {
    return this.get(`/user/${telegramId}`);
  }

  async submitTap(telegramId: number, taps: number) {
    return this.post('/tap', { telegramId, taps });
  }

  async playGame(action: 'spin' | 'treasure' | 'flip', telegramId: number, stake: number, choice?: string) {
    return this.post(`/game/${action}`, { telegramId, stake, choice });
  }

  async getLeaderboard() {
    return this.get('/leaderboard');
  }

  async completeTask(telegramId: number, taskId: string) {
    return this.post('/task/complete', { telegramId, taskId });
  }

  async addReferral(referrerTelegramId: number, newUserTelegramId: number) {
    return this.post('/referral', { referrerTelegramId, newUserTelegramId });
  }

  async getStats() {
    return this.get('/admin/stats');
  }

  async checkHealth() {
    return this.get('/health');
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Utility functions for handling API responses
export const handleApiError = (error: any) => {
  if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
    return 'Network error. Please check your connection.';
  }
  return error.message || 'An unexpected error occurred.';
};

export const isOnline = () => {
  return navigator.onLine;
};

// Cache management for offline support
class CacheManager {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  set(key: string, data: any, ttl: number = 300000) { // 5 minutes default TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }
}

export const cache = new CacheManager();

// Enhanced API client with caching and retry logic
export class EnhancedApiClient extends ApiClient {
  private retryAttempts: number = 3;
  private retryDelay: number = 1000;

  async requestWithRetry<T = any>(
    endpoint: string,
    options: RequestInit = {},
    useCache: boolean = true
  ): Promise<T> {
    const cacheKey = `${endpoint}-${JSON.stringify(options)}`;

    // Try cache first for GET requests
    if (options.method === 'GET' && useCache) {
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    let lastError: any;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const data = await this.request<T>(endpoint, options);

        // Cache successful GET responses
        if (options.method === 'GET' && useCache) {
          cache.set(cacheKey, data);
        }

        return data;
      } catch (error) {
        lastError = error;

        if (attempt < this.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }

    throw lastError;
  }
}

export const enhancedApiClient = new EnhancedApiClient(API_BASE_URL);
