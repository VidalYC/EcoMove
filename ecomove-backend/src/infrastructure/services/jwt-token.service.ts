// src/infrastructure/services/jwt-token.service.ts
const jwt = require('jsonwebtoken');
 import { TokenService, TokenPayload } from '../../core/domain/services/token.service';

export class JwtTokenService implements TokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string
  ) {}

  async generate(payload: TokenPayload): Promise<string> {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  async verify(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, this.secret) as any;
      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };
    } catch (error: any) {
      throw new Error(`Invalid token: ${error.message}`);
    }
  }

  decode(token: string): any {
    return jwt.decode(token);
  }
}