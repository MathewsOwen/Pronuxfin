import { resolvePasswordResetDeliveryStatus } from './auth-mailer.capabilities';

describe('resolvePasswordResetDeliveryStatus', () => {
  it('prefers smtp when ready', () => {
    expect(
      resolvePasswordResetDeliveryStatus({
        smtpReady: true,
        devLogFallback: true,
      }),
    ).toEqual({ available: true, mode: 'smtp' });
  });

  it('uses dev log fallback when smtp is off', () => {
    expect(
      resolvePasswordResetDeliveryStatus({
        smtpReady: false,
        devLogFallback: true,
      }),
    ).toEqual({ available: true, mode: 'dev_log' });
  });

  it('marks unavailable when neither smtp nor dev log', () => {
    expect(
      resolvePasswordResetDeliveryStatus({
        smtpReady: false,
        devLogFallback: false,
      }),
    ).toEqual({ available: false, mode: 'unavailable' });
  });
});
