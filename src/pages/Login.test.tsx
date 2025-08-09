import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import Login from './Login';
import '../i18n';

const loginMock = vi.fn();
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ login: loginMock }),
}));

describe('Login page', () => {
  it('submits credentials', async () => {
    loginMock.mockResolvedValue(undefined);
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText(/username/i), {
      target: { value: 'user' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter password/i), {
      target: { value: 'pass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await screen.findByText(/Forgot password\?/i);
    expect(loginMock).toHaveBeenCalledWith('user', 'pass');
  });
});
