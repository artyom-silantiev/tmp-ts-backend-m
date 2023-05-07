import {
  IsInt,
  Min,
  Max,
  IsIn,
  IsOptional,
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
} from 'class-validator';
import { PaginationParams } from '@lib/grid';
import { Match } from '@lib/decorators/match.decorator';

export class AuthDto {
  @IsEmail()
  email: string;

  password: string;
}

export class UserSignUpDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @Match('password')
  passwordConfirm: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  publicUrl: string;

  @IsString()
  title: string;
}

export class GetUsersDto implements PaginationParams {
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @IsInt()
  @Max(100)
  @IsOptional()
  pageSize?: number;

  @IsIn(['id', 'createdAt'])
  @IsOptional()
  sortBy?: string;

  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortType?: 'asc' | 'desc';
}

export class UserActivationDto {
  @IsString()
  activationToken: string;
}

export class UserForgotDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class UserRecoverytDto {
  @IsString()
  recoveryToken: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @Match('password')
  passwordConfirm: string;
}
