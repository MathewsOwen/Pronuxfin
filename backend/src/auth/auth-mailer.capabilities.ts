export type PasswordResetDeliveryMode = 'smtp' | 'dev_log' | 'unavailable';

export type PasswordResetDeliveryStatus = {
  available: boolean;
  mode: PasswordResetDeliveryMode;
};

export function resolvePasswordResetDeliveryStatus(input: {
  smtpReady: boolean;
  devLogFallback: boolean;
}): PasswordResetDeliveryStatus {
  if (input.smtpReady) {
    return { available: true, mode: 'smtp' };
  }
  if (input.devLogFallback) {
    return { available: true, mode: 'dev_log' };
  }
  return { available: false, mode: 'unavailable' };
}
