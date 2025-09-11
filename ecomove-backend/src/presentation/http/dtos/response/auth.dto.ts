import { UserResponseDto } from "./user.dto";

export interface AuthResponseDto {
  user: UserResponseDto;
  token: string;
  expiresIn: string;
}