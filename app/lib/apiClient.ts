/**
 * API Client Utilities
 * Comprehensive HTTP client with interceptors
 */

export interface RequestConfig {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private interceptors: {
    request: Array<(config: RequestConfig) => RequestConfig | Promise<RequestConfig>>;
    response: Array<(response: ApiResponse) => ApiResponse | Promise<ApiResponse>>;
    error: Array<(error: ApiError) => ApiError | Promise<ApiError>>;
  };

  constructor(baseURL: string = "") {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
    this.interceptors = {
      request: [],
      response: [],
      error: [],
    };
  }

  // Add request interceptor
  addRequestInterceptor(
    interceptor: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>
  ): void {
    this.interceptors.request.push(interceptor);
  }

  // Add response interceptor
  addResponseInterceptor(
    interceptor: (response: ApiResponse) => ApiResponse | Promise<ApiResponse>
  ): void {
    this.interceptors.response.push(interceptor);
  }

  // Add error interceptor
  addErrorInterceptor(
    interceptor: (error: ApiError) => ApiError | Promise<ApiError>
  ): void {
    this.interceptors.error.push(interceptor);
  }

  // Build URL with query params
  private buildURL(path: string, params?: Record<string, string | number | boolean>): string {
    const url = new URL(path, this.baseURL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }
    return url.toString();
  }

  // Apply request interceptors
  private async applyRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let processedConfig = config;
    for (const interceptor of this.interceptors.request) {
      processedConfig = await interceptor(processedConfig);
    }
    return processedConfig;
  }

  // Apply response interceptors
  private async applyResponseInterceptors(response: ApiResponse): Promise<ApiResponse> {
    let processedResponse = response;
    for (const interceptor of this.interceptors.response) {
      processedResponse = await interceptor(processedResponse);
    }
    return processedResponse;
  }

  // Apply error interceptors
  private async applyErrorInterceptors(error: ApiError): Promise<ApiError> {
    let processedError = error;
    for (const interceptor of this.interceptors.error) {
      processedError = await interceptor(processedError);
    }
    return processedError;
  }

  // Make request with retry logic
  private async makeRequest<T>(
    path: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = "GET",
      headers = {},
      body,
      params,
      timeout = 30000,
      retries = 3,
      retryDelay = 1000,
    } = await this.applyRequestInterceptors(config);

    const url = this.buildURL(path, params);
    const requestHeaders = { ...this.defaultHeaders, ...headers };

    let lastError: ApiError | null = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method,
          headers: requestHeaders,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw {
            message: errorData.message || response.statusText,
            status: response.status,
            code: errorData.code,
            details: errorData,
          };
        }

        const data = await response.json().catch(() => null);
        const apiResponse: ApiResponse<T> = {
          data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        };

        return await this.applyResponseInterceptors(apiResponse);
      } catch (error: any) {
        lastError = {
          message: error.message || "Request failed",
          status: error.status,
          code: error.code,
          details: error.details,
        };

        // Don't retry on client errors (4xx)
        if (lastError.status && lastError.status >= 400 && lastError.status < 500) {
          throw await this.applyErrorInterceptors(lastError);
        }

        // Wait before retrying
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }

    throw await this.applyErrorInterceptors(
      lastError || { message: "Request failed after retries" }
    );
  }

  // GET request
  async get<T>(path: string, config?: Omit<RequestConfig, "method" | "body">): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(path, { ...config, method: "GET" });
  }

  // POST request
  async post<T>(path: string, body?: any, config?: Omit<RequestConfig, "method">): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(path, { ...config, method: "POST", body });
  }

  // PUT request
  async put<T>(path: string, body?: any, config?: Omit<RequestConfig, "method">): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(path, { ...config, method: "PUT", body });
  }

  // PATCH request
  async patch<T>(path: string, body?: any, config?: Omit<RequestConfig, "method">): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(path, { ...config, method: "PATCH", body });
  }

  // DELETE request
  async delete<T>(path: string, config?: Omit<RequestConfig, "method" | "body">): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(path, { ...config, method: "DELETE" });
  }
}

// Create default instance
export const apiClient = new ApiClient("/api");

// Add authentication interceptor
apiClient.addRequestInterceptor((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

// Add logging interceptor
apiClient.addResponseInterceptor((response) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`API Response [${response.status}]:`, response.data);
  }
  return response;
});

// Add error logging interceptor
apiClient.addErrorInterceptor((error) => {
  if (process.env.NODE_ENV === "development") {
    console.error(`API Error [${error.status}]:`, error.message);
  }
  return error;
});

// Export for custom instances
export default ApiClient;

// Helper functions for common patterns
export async function fetchData<T>(endpoint: string): Promise<T> {
  const response = await apiClient.get<T>(endpoint);
  return response.data;
}

export async function postData<T>(endpoint: string, data: any): Promise<T> {
  const response = await apiClient.post<T>(endpoint, data);
  return response.data;
}

export async function updateData<T>(endpoint: string, data: any): Promise<T> {
  const response = await apiClient.put<T>(endpoint, data);
  return response.data;
}

export async function deleteData<T>(endpoint: string): Promise<T> {
  const response = await apiClient.delete<T>(endpoint);
  return response.data;
}

