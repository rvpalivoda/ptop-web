import { describe, it, expect, vi, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Header } from './Header';
import '../i18n';

const authState = { isAuthenticated: false };
vi.mock('@/context', () => ({ useAuth: () => authState }));
vi.mock('./ProfileDrawer', () => ({ ProfileDrawer: () => <div>drawer</div> }));

describe('Header component', () => {
  afterEach(() => {
    cleanup();
  });
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

  it('shows overlay when mobile menu is open', () => {
    authState.isAuthenticated = false;
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByLabelText('Toggle menu'));
    expect(screen.getByTestId('mobile-menu-overlay')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('mobile-menu-overlay'));
    expect(screen.queryByTestId('mobile-menu-overlay')).not.toBeInTheDocument();
  });
});
