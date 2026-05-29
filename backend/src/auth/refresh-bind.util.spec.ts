import {
  isRefreshStrictBindEnabled,
  refreshMetaMismatch,
} from './refresh-bind.util';

describe('refresh-bind.util', () => {
  const prev = process.env.REFRESH_STRICT_BIND;

  afterEach(() => {
    if (prev === undefined) delete process.env.REFRESH_STRICT_BIND;
    else process.env.REFRESH_STRICT_BIND = prev;
  });

  it('is disabled by default', () => {
    delete process.env.REFRESH_STRICT_BIND;
    expect(isRefreshStrictBindEnabled()).toBe(false);
    expect(
      refreshMetaMismatch({ ip: '1.2.3.4', userAgent: 'A' }, { ip: '9.9.9.9' }),
    ).toBe(false);
  });

  it('detects IP mismatch when strict bind is on', () => {
    process.env.REFRESH_STRICT_BIND = '1';
    expect(
      refreshMetaMismatch(
        { ip: '1.2.3.4', userAgent: null },
        { ip: '9.9.9.9', userAgent: null },
      ),
    ).toBe(true);
  });

  it('ignores missing stored metadata', () => {
    process.env.REFRESH_STRICT_BIND = 'true';
    expect(
      refreshMetaMismatch({ ip: null, userAgent: null }, { ip: '9.9.9.9' }),
    ).toBe(false);
  });
});
