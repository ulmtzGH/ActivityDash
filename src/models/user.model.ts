
export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'Admin' | 'Colaborador';
  isActive: boolean;
}
