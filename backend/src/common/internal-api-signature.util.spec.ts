import { createHmac } from 'crypto';
import type { Request } from 'express';
import { verifyInternalApiSignature } from './internal-api-signature.util';

function mockReq(partial: Partial<Request>): Request {
  return partial as Request;
}

describe('internal-api-signature', () => {
  const secret = 'a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0u1V2w3';
  const bodySha256 =
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  it('accepts a valid signature', () => {
    process.env.INTERNAL_API_REQUEST_SIGNING = '1';
    const timestampSec = Math.floor(Date.now() / 1000);
    const payload = [
      String(timestampSec),
      'POST',
      '/auth/login',
      bodySha256,
    ].join('\n');
    const signature = createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('base64url');

    const req = mockReq({
      method: 'POST',
      path: '/auth/login',
      url: '/auth/login',
      headers: {
        'x-internal-timestamp': String(timestampSec),
        'x-internal-body-sha256': bodySha256,
        'x-internal-signature': signature,
      },
    });

    expect(verifyInternalApiSignature(req, secret)).toEqual({ ok: true });
  });

  it('rejects stale timestamps', () => {
    process.env.INTERNAL_API_REQUEST_SIGNING = '1';
    const timestampSec = Math.floor(Date.now() / 1000) - 9999;
    const req = mockReq({
      method: 'GET',
      path: '/auth/me',
      url: '/auth/me',
      headers: {
        'x-internal-timestamp': String(timestampSec),
        'x-internal-body-sha256': bodySha256,
        'x-internal-signature': 'invalid',
      },
    });
    expect(verifyInternalApiSignature(req, secret).ok).toBe(false);
  });
});
