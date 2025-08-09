import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { Header } from './Header';
import '../i18n';

const authState = { isAuthenticated: false };
vi.mock('@/context', () => ({ useAuth: () => authState }));
vi.mock('./ProfileDrawer', () => ({ ProfileDrawer: () => <div>drawer</div> }));

describe('Header component', () => {
  it('renders login and register links for guest', () => {
    authState.isAuthenticated = false;
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  it('renders profile for authenticated user', () => {
    authState.isAuthenticated = true;
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );
    expect(screen.getByText('drawer')).toBeInTheDocument();
  });
});
