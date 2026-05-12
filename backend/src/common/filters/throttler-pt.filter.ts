import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ThrottlerException } from '@nestjs/throttler';
import { acceptLanguagePrefersPortuguese } from '../http/accept-language.util';

const RATE_LIMIT_MSG = {
  en: {
    generic: 'Too many requests. Please wait before trying again.',
    login: 'Too many login attempts. Please wait before retrying.',
    register: 'Too many registration attempts. Please wait before retrying.',
    forgot: 'Too many password recovery attempts. Please wait before retrying.',
    reset: 'Too many password reset attempts. Please wait before retrying.',
  },
  pt: {
    generic:
      'Muitas solicitações. Aguarde um momento antes de tentar novamente.',
    login:
      'Muitas tentativas de login. Aguarde um momento antes de tentar novamente.',
    register:
      'Muitas tentativas de cadastro. Aguarde um momento antes de tentar novamente.',
    forgot:
      'Muitas tentativas de recuperação. Aguarde um momento antes de tentar novamente.',
    reset:
      'Muitas tentativas de redefinição. Aguarde um momento antes de tentar novamente.',
  },
} as const;

@Catch(ThrottlerException)
export class ThrottlerExceptionPtFilter implements ExceptionFilter {
  catch(_exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const rawAl = req.headers['accept-language'];
    const lang = acceptLanguagePrefersPortuguese(
      typeof rawAl === 'string' ? rawAl : undefined,
    )
      ? 'pt'
      : 'en';
    const path = req.path ?? '';
    let message: string = RATE_LIMIT_MSG[lang].generic;
    let code = 'AUTH_RATE_LIMIT';
    if (path.includes('/auth/login')) {
      message = RATE_LIMIT_MSG[lang].login;
      code = 'AUTH_RATE_LIMIT_LOGIN';
    } else if (path.includes('/auth/register')) {
      message = RATE_LIMIT_MSG[lang].register;
      code = 'AUTH_RATE_LIMIT_REGISTER';
    } else if (path.includes('/auth/forgot-password')) {
      message = RATE_LIMIT_MSG[lang].forgot;
      code = 'AUTH_RATE_LIMIT_FORGOT_PASSWORD';
    } else if (path.includes('/auth/reset-password')) {
      message = RATE_LIMIT_MSG[lang].reset;
      code = 'AUTH_RATE_LIMIT_RESET_PASSWORD';
    }

    if (res.headersSent) return;

    res.status(HttpStatus.TOO_MANY_REQUESTS).json({
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      message,
      code,
    });
  }
}
