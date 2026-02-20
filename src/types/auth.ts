export interface LoginRequest {
  username: string;
  password: string;
}

export interface User {
  userId: number;
  roleId: number;
  username: string;
  fullName: string;
  email: string;
  roleName: string;
  isActive?: boolean;
  lastLogin?: string;
  createdAt?: string;
  photoUrl?: string;
  permissions?: string[];
  employeeId?: string;
  division?: string;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: User;
  permissions: string[];
}