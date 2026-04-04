import { request } from './http.js';
import { NonceResponse, AuthResult } from './types.js';

export class AuthClient {
  constructor(
    private readonly baseUrl: string,
    private readonly appId: string,
    private readonly timeout: number,
  ) {}

  /** Step 1: Get a nonce to sign */
  async getNonce(walletAddress: string): Promise<NonceResponse> {
    return request<NonceResponse>(`${this.baseUrl}/v1/auth/nonce`, {
      method: 'POST',
      body: { wallet_address: walletAddress },
      headers: { 'x-app-id': this.appId },
      timeout: this.timeout,
      retries: 1,
    });
  }

  /** Step 3: Verify the signed message and get a JWT */
  async verify(walletAddress: string, signature: string): Promise<AuthResult> {
    return request<AuthResult>(`${this.baseUrl}/v1/auth/verify`, {
      method: 'POST',
      body: { wallet_address: walletAddress, signature },
      headers: { 'x-app-id': this.appId },
      timeout: this.timeout,
      retries: 0,
    });
  }

  async logout(): Promise<void> {
    await request(`${this.baseUrl}/v1/auth/logout`, {
      method: 'POST',
      timeout: this.timeout,
      retries: 0,
    });
  }
}
