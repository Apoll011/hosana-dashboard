class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private refreshTokenVal: string | null = null;
  private onUnauthorizedCallback: (() => void) | null = null;

  constructor() {
    this.baseURL = localStorage.getItem('chordpro_server_url') || import.meta.env.API_URL || '/api';
    this.token = localStorage.getItem('chordpro_access_token');
    this.refreshTokenVal = localStorage.getItem('chordpro_refresh_token');
  }

  public setBaseURL(url: string) { // TODO: Add it to settings
    this.baseURL = url.endsWith('/') ? url.slice(0, -1) : url;
    localStorage.setItem('chordpro_server_url', this.baseURL);
  }

  public getBaseURL(): string {
    return this.baseURL;
  }

  public setTokens(accessToken: string | null, refreshToken: string | null = null) {
    this.token = accessToken;
    if (accessToken) {
      localStorage.setItem('chordpro_access_token', accessToken);
    } else {
      localStorage.removeItem('chordpro_access_token');
    }

    if (refreshToken !== null) {
      this.refreshTokenVal = refreshToken;
      if (refreshToken) {
        localStorage.setItem('chordpro_refresh_token', refreshToken);
      } else {
        localStorage.removeItem('chordpro_refresh_token');
      }
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  public getRefreshToken(): string | null {
    return this.refreshTokenVal;
  }

  public onUnauthorized(callback: () => void) {
    this.onUnauthorizedCallback = callback;
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('/') ? `${this.baseURL}${endpoint}` : `${this.baseURL}/${endpoint}`;
    
    const requestHeaders: Record<string, string> = {};
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((v, k) => { requestHeaders[k] = v; });
      } else if (typeof options.headers === 'object') {
        Object.entries(options.headers).forEach(([k, v]) => {
          if (v !== undefined) requestHeaders[k] = String(v);
        });
      }
    }
    if (this.token) {
      requestHeaders['Authorization'] = `Bearer ${this.token}`;
    }
    if (!requestHeaders['Content-Type'] && !(options.body instanceof FormData)) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    const config: RequestInit = {
      ...options,
      headers: requestHeaders,
    };

    let response: Response;
    try {
      response = await fetch(url, config);
    } catch (err: any) {
      throw new Error(`Network Error: ${err.message || 'Failed to connect to server'}`);
    }

    // Handle 401 Unauthorized -> Attempt token refresh
    if (response.status === 401 && this.refreshTokenVal && !endpoint.includes('auth/login')) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        // Retry original request with new token
        requestHeaders['Authorization'] = `Bearer ${this.token}`;
        response = await fetch(url, { ...options, headers: requestHeaders });
      } else {
        if (this.onUnauthorizedCallback) {
          this.onUnauthorizedCallback();
        }
        throw new Error('Session expired. Please log in again.');
      }
    } else if (response.status === 401) {
      if (this.onUnauthorizedCallback && !endpoint.includes('auth/login')) {
        this.onUnauthorizedCallback();
      }
      throw new Error('Unauthorized access');
    }

    if (!response.ok) {
      let errorMessage = `Server error (${response.status})`;
      try {
        const errorData = await response.json();
        if (errorData.error) errorMessage = errorData.error;
        else if (errorData.message) errorMessage = errorData.message;
      } catch {
        // Fallback to generic message
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  private async tryRefreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshTokenVal }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.accessToken) {
          this.setTokens(data.accessToken, data.refreshToken || this.refreshTokenVal);
          return true;
        }
      }
    } catch {
      // Refresh failed
    }
    this.setTokens(null, null);
    return false;
  }
}

export const httpClient = new ApiClient();
