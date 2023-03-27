import { IsString, MinLength } from 'class-validator';
import { Ctx } from '@core/router/router';
import { validateDto } from '@core/validator';
import { Controller, Get, HttpException } from '@core/router';

export class LoginDto {
  @IsString()
  @MinLength(5)
  login: string;

  @IsString()
  password: string;
}

@Controller()
export class AppController {
  @Get()
  index(ctx: Ctx) {
    if (ctx.query['name']) {
      return `Hello, ${ctx.query['name']}!`;
    } else {
      return 'Hello, world!';
    }
  }

  @Get('by_name/:name')
  byName(ctx: Ctx) {
    return `Hello, ${ctx.params.name}!`;
  }

  @Get('throw')
  getThrow(ctx: Ctx) {
    throw new HttpException(
      {
        badError: 'WTF!',
        status: 'emmm... mb 400?!',
      },
      400
    );
  }

  @Get('login')
  async login(ctx: Ctx) {
    const body = await validateDto(ctx.query, LoginDto);

    console.log('body', body);

    return {
      accessToken: (Math.random() * 1e6 + 1e6).toString(32),
    };
  }
}
