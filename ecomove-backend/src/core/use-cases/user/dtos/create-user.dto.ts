export interface CreateUserDto {
  name: string;
  email: string;
  document: string;
  phone?: string;
  password: string;
  role?: string;
}