/**
 * useRecipients Hook Tests
 */

import { renderHook, act } from '@testing-library/react';
import { useRecipients } from '../hooks/useRecipients';

describe('useRecipients', () => {
  it('adds recipient correctly', () => {
    const { result } = renderHook(() => useRecipients());

    act(() => {
      result.current.addRecipient({
        address: '0x123',
        name: 'Alice',
        share: 50,
      });
    });

    expect(result.current.recipients).toHaveLength(1);
    expect(result.current.recipients[0].address).toBe('0x123');
  });

  it('calculates total share', () => {
    const { result } = renderHook(() => useRecipients());

    act(() => {
      result.current.addRecipient({ address: '0x1', share: 30 });
      result.current.addRecipient({ address: '0x2', share: 70 });
    });

    expect(result.current.totalShare).toBe(100);
  });

  it('removes recipient', () => {
    const { result } = renderHook(() => useRecipients());

    act(() => {
      result.current.addRecipient({ address: '0x1', share: 50 });
    });

    const id = result.current.recipients[0].id;

    act(() => {
      result.current.removeRecipient(id);
    });

    expect(result.current.recipients).toHaveLength(0);
  });
});

