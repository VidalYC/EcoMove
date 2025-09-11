export interface UserResponseDto {
  id: number;
  name: string;
  email: string;
  document: string;
  phone?: string;
  role: string;
  status: string;
  registrationDate: Date;
  createdAt: Date;
  updatedAt: Date;
}