import { type INestApplication } from '@nestjs/common';

export async function closeE2eApp(
  app: INestApplication | undefined,
): Promise<void> {
  if (!app) return;
  try {
    await app.close();
  } catch {
    /* ignore teardown errors when bootstrap failed */
  }
}
