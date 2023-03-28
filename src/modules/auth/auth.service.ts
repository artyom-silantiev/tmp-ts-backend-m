import { HttpException, HttpStatus } from '@core/router';
import { PrismaService } from '@db/prisma.service';
import { UserRepository } from '@db/repositories/user.repository';
import { useBcrypt } from '@lib/bcrypt';
import { useCacheJwtUser } from '@lib/cache/jwt-user';
import { ExErrors } from '@lib/ex_errors.type';
import { JwtUserAuthService } from '@modules/jwt/jwt-user-auth.service';
import { User } from '@prisma/client';
import { JwtUser } from './types';

export class AuthService {
  private bcrypt = useBcrypt();
  private cacheJwtUser = useCacheJwtUser();

  constructor(
    private prismaService: PrismaService,
    private userRepository: UserRepository,
    private jwtUserAuth: JwtUserAuthService
  ) {}

  async passwordCheck(userId: bigint, password: string) {
    const user = await this.userRepository.findFirst({
      id: userId,
    });

    if (!user) {
      throw new Error('user not found');
    }

    const compareResult = await this.bcrypt.compare(
      password,
      user.passwordHash
    );
    if (compareResult) {
      return true;
    }

    return false;
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userRepository.findFirst({
      email,
    });

    if (!user) {
      throw new HttpException(
        ExErrors.Users.PasswordWrongOrNotFound,
        HttpStatus.NOT_FOUND
      );
    }

    const compareResult = await this.bcrypt.compare(
      password,
      user.passwordHash
    );
    if (!compareResult) {
      throw new HttpException(
        ExErrors.Users.PasswordWrongOrNotFound,
        HttpStatus.BAD_REQUEST
      );
    }

    return user;
  }

  async login(user: User) {
    const tokenData = await this.jwtUserAuth.create(user.id);
    return {
      user: user,
      accessToken: tokenData.token,
    };
  }

  async cheackAccessToken(accessToken: string): Promise<JwtUser> {
    const payload = this.jwtUserAuth.verify(accessToken);

    const userId = payload.sub;
    const userJwtCache = await this.cacheJwtUser.get(userId);
    if (userJwtCache) {
      const jwtUser = JSON.parse(userJwtCache);
      return Object.assign(new JwtUser(), jwtUser);
    }

    const user = await this.prismaService.user.findFirst({
      where: {
        id: BigInt(userId),
      },
    });

    if (!user) {
      throw new Error('User not found!');
    }

    const jwtUser = {
      userId: user.id.toString(),
      role: user.role,
    };
    await this.cacheJwtUser.set(userId, jwtUser);

    return Object.assign(new JwtUser(), jwtUser);
  }
}
