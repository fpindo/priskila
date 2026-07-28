import { describe, expect, it } from 'vitest';
import { useAuth as contextUseAuth } from '@/context/AuthContext';
import { useAuth } from './useAuth';

describe('useAuth hook export', () => {
  it('re-exports useAuth from AuthContext', () => {
    expect(useAuth).toBe(contextUseAuth);
  });
});
