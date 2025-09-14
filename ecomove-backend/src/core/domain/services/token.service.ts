// src/core/domain/services/token.service.ts
export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
}

export interface TokenService {
  generate(payload: TokenPayload): Promise<string>;
  verify(token: string): Promise<TokenPayload>;
  decode(token: string): any;
}