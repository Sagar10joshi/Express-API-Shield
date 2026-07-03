import { describe, it, expect } from 'vitest';
import { ipMatchesList } from '../../src/utils/ip';

describe('ipMatchesList', () => {
  it('matches an exact IPv4 address', () => {
    expect(ipMatchesList('1.2.3.4', ['1.2.3.4'])).toBe(true);
    expect(ipMatchesList('1.2.3.5', ['1.2.3.4'])).toBe(false);
  });

  it('matches a CIDR range', () => {
    expect(ipMatchesList('10.0.0.5', ['10.0.0.0/8'])).toBe(true);
    expect(ipMatchesList('11.0.0.5', ['10.0.0.0/8'])).toBe(false);
  });

  it('matches IPv6 exact and CIDR', () => {
    expect(ipMatchesList('::1', ['::1'])).toBe(true);
    expect(ipMatchesList('2001:db8::1', ['2001:db8::/32'])).toBe(true);
    expect(ipMatchesList('2002:db8::1', ['2001:db8::/32'])).toBe(false);
  });

  it('ignores malformed list entries instead of throwing', () => {
    expect(() => ipMatchesList('1.2.3.4', ['not-an-ip', '1.2.3.4'])).not.toThrow();
    expect(ipMatchesList('1.2.3.4', ['not-an-ip', '1.2.3.4'])).toBe(true);
  });

  it('returns false for an unparsable input IP', () => {
    expect(ipMatchesList('garbage', ['1.2.3.4'])).toBe(false);
  });
});
