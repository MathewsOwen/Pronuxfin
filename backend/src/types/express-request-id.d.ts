import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    /** Definido por `RequestIdMiddleware` antes de controllers/guards. */
    requestId: string;
  }
}

export {};
