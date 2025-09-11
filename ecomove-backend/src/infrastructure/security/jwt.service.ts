const jwt = require('jsonwebtoken');
import { User } from '../../core/domain/entities/user.entity';
import { TokenService } from '../../core/use-cases/user/authenticate-user.use-case';

export interface JWTConfig {
  secret: string;
  expiresIn: string;
  issuer: string;
}

export class JWTTokenService implements TokenService {
  constructor(private readonly config: JWTConfig) {}

  generateToken(user: User): string {
    const payload = {
      userId: user.id,
      email: user.email.value,
      role: user.role
    };

    return jwt.sign(payload, this.config.secret, {
      expiresIn: this.config.expiresIn,
      issuer: this.config.issuer
    });
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.config.secret);
    } catch (error) {
      return null;
    }
  }

  decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  }

  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return true;
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }
}