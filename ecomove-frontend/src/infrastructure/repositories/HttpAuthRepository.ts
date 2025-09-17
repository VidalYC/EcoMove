// 🔧 HTTP AUTH REPOSITORY
import { AuthRepository, AuthTokens } from '../../core/repositories';
import { User, CreateUserData } from '../../core/entities/User';
import { ApiClient } from '../http/ApiClient';
import { API_ENDPOINTS } from '../../shared/constants';

export class HttpAuthRepository implements AuthRepository {
  constructor(private apiClient: ApiClient) {}

  async login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await this.apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
      email,
      password,
    });

    const user = User.fromApi(response.data.user);
    const tokens: AuthTokens = {
      accessToken: response.data.tokens.accessToken,
      refreshToken: response.data.tokens.refreshToken,
      expiresIn: response.data.tokens.expiresIn,
      tokenType: 'Bearer',
    };

    // Store tokens in API client
    this.apiClient.setAuthTokens(tokens.accessToken, tokens.refreshToken);

    return { user, tokens };
  }

  async register(userData: CreateUserData): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await this.apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData);

    const user = User.fromApi(response.data.user);
    const tokens: AuthTokens = {
      accessToken: response.data.tokens.accessToken,
      refreshToken: response.data.tokens.refreshToken,
      expiresIn: response.data.tokens.expiresIn,
      tokenType: 'Bearer',
    };

    // Store tokens in API client
    this.apiClient.setAuthTokens(tokens.accessToken, tokens.refreshToken);

    return { user, tokens };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await this.apiClient.post(API_ENDPOINTS.AUTH.REFRESH, {
      refreshToken,
    });

    const tokens: AuthTokens = {
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      expiresIn: response.data.expiresIn,
      tokenType: 'Bearer',
    };

    // Update stored tokens
    this.apiClient.setAuthTokens(tokens.accessToken, tokens.refreshToken);

    return tokens;
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      await this.apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, {
        refreshToken,
      });
    } finally {
      // Always clear tokens, even if logout request fails
      this.apiClient.clearAuthTokens();
    }
  }

  async verifyToken(token: string): Promise<User> {
    const response = await this.apiClient.get('/api/v1/users/verify-token');
    return User.fromApi(response.data);
  }
}