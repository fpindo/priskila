import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import { ApiService, apiClient } from '@priskila/api';

vi.mock('@priskila/api', () => ({
  ApiService: {
    get: vi.fn(),
    post: vi.fn(),
  },
  apiClient: {
    defaults: {
      headers: {
        common: {},
      },
    },
  },
}));

const mockedPost = vi.mocked(ApiService.post);
const mockedGet = vi.mocked(ApiService.get);

function AuthProbe() {
  const { isAuthenticated, login, token } = useAuth();

  return (
    <div>
      <span data-testid="auth-state">{isAuthenticated ? 'yes' : 'no'}</span>
      <span data-testid="token-state">{token ?? 'empty'}</span>
      <button onClick={() => void login('admin@example.com', 'password')}>Login</button>
    </div>
  );
}

function InvalidHookProbe() {
  useAuth();

  return null;
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    apiClient.defaults.headers.common = {};
    mockedPost.mockReset();
    mockedGet.mockReset();
  });

  it('throws when useAuth is rendered outside AuthProvider', () => {
    expect(() => render(<InvalidHookProbe />)).toThrow('useAuth must be used within an AuthProvider');
  });

  it('logs in and stores the token in sessionStorage by default', async () => {
    mockedGet.mockResolvedValue({ success: false, message: 'Guest', data: { user: null } });
    mockedPost.mockResolvedValue({
      success: true,
      message: 'Login sukses',
      data: {
        token: 'token-123',
        user: { id: 1, name: 'Admin', email: 'admin@example.com' },
      },
    });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('no'));
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('yes'));
    expect(screen.getByTestId('token-state')).toHaveTextContent('token-123');
    expect(sessionStorage.getItem('token')).toBe('token-123');
    expect(apiClient.defaults.headers.common.Authorization).toBe('Bearer token-123');
  });

  it('returns two factor requirement without storing a token', async () => {
    mockedGet.mockResolvedValue({ success: false, message: 'Guest', data: { user: null } });
    mockedPost.mockResolvedValue({
      success: true,
      message: '2FA required',
      data: {
        two_factor_required: true,
        user_id: 7,
      },
    });

    function TwoFactorProbe() {
      const { login } = useAuth();
      const [result, setResult] = React.useState('idle');

      return (
        <button
          onClick={async () => {
            const response = await login('admin@example.com', 'password');
            setResult(response?.twoFactorRequired ? `2fa-${response.userId}` : 'none');
          }}
        >
          {result}
        </button>
      );
    }

    render(
      <AuthProvider>
        <TwoFactorProbe />
      </AuthProvider>
    );

    await userEvent.click(await screen.findByRole('button', { name: 'idle' }));

    await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent('2fa-7'));
    expect(sessionStorage.getItem('token')).toBeNull();
  });
});
