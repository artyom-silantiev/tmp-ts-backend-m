import {
  AuthDto,
  UserSignUpDto,
  GetUsersDto,
  UserActivationDto,
  UserForgotDto,
  UserRecoverytDto,
} from './guest.dto';

import * as _ from 'lodash';
import { UserRole } from '@prisma/client';
import { PrismaService } from '@db/prisma.service';
import { UserRepository, UserViewType } from '@db/repositories/user.repository';
import { AuthService } from '@modules/auth/auth.service';
import { SendEmailService } from '@modules/app-mailer/send-email.service';
import {
  JwtUserActivationService,
  UserActivationType,
} from '@modules/jwt/jwt-user-activation.service';
import { JwtUserRecoveryService } from '@modules/jwt/jwt-user-recovery.service';
import {
  CtxGrpc,
  GrpcException,
  GrpcMethod,
  GrpcService,
} from 'minimal2b/grpc';
import { ExErrors } from '@lib/ex_errors.type';
import { status as GrpcStatus } from '@grpc/grpc-js';

// TODO create guest.proto for this grpc service
@GrpcService('guest.proto', 'GuestService')
export class GuestGrpc {
  constructor(
    private prismaService: PrismaService,
    private userRepository: UserRepository,
    private authService: AuthService,
    private mailer: SendEmailService,
    private jwtUserActivate: JwtUserActivationService,
    private jwtUserRecovery: JwtUserRecoveryService
  ) {}

  /*
  @Get('')
  @ApiOperation({
    summary: '',
  })
  async getUsers(@Query() paginationParams: GetUsersDto) {
    const grid = useGrid(paginationParams);

    const fetchBuilder = this.userRepository.createFetchBuilder();
    fetchBuilder.init({
      where: {
        role: UserRole.USER,
        ...this.userRepository.whereNotDeleted(),
      },
      include: {
        ...this.userRepository.includeImage(),
      },
      skip: grid.skip,
      take: grid.take,
    });

    if (grid.sortBy) {
      fetchBuilder.orderBy({
        [grid.sortBy]: grid.sortType,
      });
    }

    const { rows, rowsTotal } = await fetchBuilder.fetch();
    const rowsResult = rows.map((v) => this.userRepository.toView(v));

    return grid.toWrapedResultRows(rowsResult, rowsTotal);
  }

  @Get(':id')
  @ApiOperation({
    summary: ':id',
  })
  async getUserById(@Param() params: ByIdParamsDto) {
    const userIdBI = BigInt(params.id);

    const user = await this.userRepository.findFirst({
      id: userIdBI,
      role: UserRole.USER,
      ...this.userRepository.whereNotDeleted(),
    });

    if (!user) {
      throw new HttpException(ExErrors.Users.NotFound, HttpStatus.NOT_FOUND);
    }

    return {
      user: this.userRepository.toView(user),
    };
  }
  */

  @GrpcMethod('signup')
  async signup(ctx: CtxGrpc) {
    const body = await ctx.validateDto(ctx.request, UserSignUpDto);

    const email = body.email;
    const password = body.password;
    const phone = body.phone;
    const publicUrl = body.publicUrl;
    const title = body.title;

    const data = await this.userRepository.createUser({
      email,
      password,
      phone,
      firstName: '',
      lastName: '',
    });

    const userActivationData = await this.jwtUserActivate.create(data.user.id, {
      type: UserActivationType.signup,
    });

    await this.mailer.sendUserRegistration({
      activationToken: userActivationData.token,
      userEmail: data.user.email,
      userPassword: data.password,
    });

    const userView = this.userRepository.toView(
      data.user,
      UserViewType.PRIVATE
    );

    return {
      message:
        'The user has been created, an email was sent to activate the account.',
      user: userView,
    };
  }

  @GrpcMethod('activation')
  async userActivate(ctx: CtxGrpc) {
    const userActivationDto = await ctx.validateDto(
      ctx.request,
      UserActivationDto
    );
    const activationToken = userActivationDto.activationToken;

    const checkResult = await this.jwtUserActivate.check(activationToken);
    if (!checkResult) {
      throw new GrpcException(
        ExErrors.JWT.BadOrInvalidToken,
        GrpcStatus.NOT_FOUND
      );
    }

    const user = await this.userRepository.findFirst({
      id: BigInt(checkResult.payload.userId),
      ...this.userRepository.whereNotDeleted(),
    });

    if (!user) {
      throw new GrpcException(ExErrors.Users.NotFound, GrpcStatus.NOT_FOUND);
    }

    let email = user.email;
    if (checkResult.jwtRow.meta.type === UserActivationType.emailChange) {
      email = checkResult.jwtRow.meta.email;
    }

    const activatedUser = await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        email,
        emailActivatedAt: new Date().toISOString(),
        role: UserRole.USER,
      },
    });
    try {
      await this.prismaService.jwt.delete({
        where: {
          id: checkResult.jwtRow.id,
        },
      });
    } catch (error) {
      console.error(error);
    }

    const auth = await this.authService.login(activatedUser);

    return {
      accessToken: auth.accessToken,
      user: this.userRepository.toView(auth.user, UserViewType.PRIVATE),
    };
  }

  @GrpcMethod('login')
  async login(ctx: CtxGrpc) {
    const body = await ctx.validateDto(ctx.request, AuthDto);
    const user = await this.authService.validateUser(body.email, body.password);

    const auth = await this.authService.login(user);
    return {
      accessToken: auth.accessToken,
      user: this.userRepository.toView(auth.user, UserViewType.PRIVATE),
    };
  }

  @GrpcMethod('forgot')
  async forgot(ctx: CtxGrpc) {
    const userForgotDto = await ctx.validateDto(ctx.request, UserForgotDto);
    const userEmail = userForgotDto.email;

    const user = await this.userRepository.findFirst({
      email: userEmail,
      ...this.userRepository.whereNotDeleted(),
    });

    if (!user) {
      throw new GrpcException(ExErrors.Users.NotFound, GrpcStatus.NOT_FOUND);
    }

    const recoveryData = await this.jwtUserRecovery.create(user.id);

    await this.mailer.sendUserPasswordRecovery({
      recoveryToken: recoveryData.token,
      userEmail: user.email,
    });

    return {
      message: 'We have sent you an email to reset your password.',
    };
  }

  @GrpcMethod('recovery')
  async recovery(ctx: CtxGrpc) {
    const recoveryUserDto = await ctx.validateDto(
      ctx.request,
      UserRecoverytDto
    );
    const recoveryToken = recoveryUserDto.recoveryToken;

    const checkResult = await this.jwtUserRecovery.check(recoveryToken);
    if (!checkResult) {
      throw new GrpcException(
        ExErrors.JWT.BadOrInvalidToken,
        GrpcStatus.ABORTED
      );
    }

    const userId = BigInt(checkResult.payload.userId);
    const user = await this.userRepository.findFirst({
      id: userId,
      ...this.userRepository.whereNotDeleted(),
    });

    if (!user) {
      throw new GrpcException(ExErrors.Users.NotFound, GrpcStatus.NOT_FOUND);
    }

    await this.userRepository.changePassword(user.id, recoveryUserDto.password);
    try {
      await this.prismaService.jwt.delete({
        where: {
          id: checkResult.jwtRow.id,
        },
      });
    } catch (error) {}

    const auth = await this.authService.login(user);

    return {
      accessToken: auth.accessToken,
      user: this.userRepository.toView(auth.user, UserViewType.PRIVATE),
    };
  }
}
