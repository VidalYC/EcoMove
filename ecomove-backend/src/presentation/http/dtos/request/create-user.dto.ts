export interface CreateUserRequestDto {
  name: string;
  email: string;
  document: string;
  phone?: string;
  password: string;
  role?: string;
}