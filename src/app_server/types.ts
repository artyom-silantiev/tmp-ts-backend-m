import { JwtUser } from '@modules/auth/types';

export const AppUserKey = Symbol('AppUserKey');
export type AppUser = JwtUser;
