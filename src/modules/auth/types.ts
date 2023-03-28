import { UserRole } from '@prisma/client';

export class JwtUser {
  userId: string;
  role: UserRole;
}
