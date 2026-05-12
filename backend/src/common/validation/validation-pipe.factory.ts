import {
  BadRequestException,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import type { ValidationError } from 'class-validator';

function collectValidationMessages(errors: ValidationError[]): string[] {
  const out: string[] = [];
  for (const e of errors) {
    if (e.constraints) {
      out.push(...Object.values(e.constraints));
    }
    if (e.children?.length) {
      out.push(...collectValidationMessages(e.children));
    }
  }
  return out;
}

/**
 * Mensagens continuam vindas principalmente das constraints (class-validator) —
 * útil combinar no front com texto localizado usando `VALIDATION_FAILED` + detalhe.
 */
export function createAppValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (validationErrors: ValidationError[]) => {
      const lines = collectValidationMessages(validationErrors);
      const message = lines.length > 0 ? lines.join(' ') : 'Validation failed.';
      return new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        code: 'VALIDATION_FAILED',
      });
    },
  });
}
