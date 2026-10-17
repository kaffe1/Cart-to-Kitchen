import {
  ChefHat,
  CircleUserRound,
  LogIn,
  ShoppingBasket,
  Store,
} from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { appRoutes } from '@/app/routes';
import { Button } from '@/shared/components/ui/button';
import { FeedbackBanner, FeedbackToast } from '@/shared/components/ui/FeedbackBanner';
import { appSession } from '../../api/appSession';
import { useAppShellPresenter } from './useAppShellPresenter';

const navItems = [
  { href: appRoutes.store, label: 'Store', icon: Store },
  { href: appRoutes.kitchen, label: 'Kitchen', icon: ChefHat },
  { href: appRoutes.profile, label: 'Me', icon: CircleUserRound },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const presenter = useAppShellPresenter();
  useEffect(() => {
    void appSession.ensureShoppingSession().catch(() => undefined);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="app-header">
        <div className="app-header-inner">
          <Link
            to={appRoutes.store}
            className="brand-lockup"
            aria-label="Cart to Kitchen home"
          >
            <span className="brand-mark">
              <ShoppingBasket size={20} />
            </span>
            <span>
              <strong>Cart to Kitchen</strong>
              <small>shop smart · cook curious</small>
            </span>
          </Link>

          <nav className="desktop-nav" aria-label="Primary navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                (item.href !== '/me' && pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={active ? 'nav-link active' : 'nav-link'}
                >
                  <Icon size={17} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="header-actions">
            {presenter.user && (
              <span className="header-user-name">
                Hi, {presenter.user.displayName} !
              </span>
            )}
            {presenter.user?.mode !== 'account' && (
              <Link
                className="header-sign-in"
                to={appRoutes.login}
                aria-label="Sign in"
                title="Sign in"
              >
                <LogIn size={18} />
              </Link>
            )}
          </div>
        </div>
      </header>

      {presenter.checkoutNotice && (
        <FeedbackToast
          message={presenter.checkoutNotice}
          onDismiss={appSession.clearCheckoutNotice}
        />
      )}

      <main className="app-main">
        {presenter.status === 'error' && (
          <div role="alert" className="p-4 space-y-3">
            <FeedbackBanner tone="error">{presenter.error}</FeedbackBanner>
            <Button
              onClick={() => void appSession.refresh().catch(() => undefined)}
            >
              Refresh session
            </Button>
            <Link className="ml-4" to={appRoutes.login}>
              Sign in
            </Link>
          </div>
        )}
        {children}
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={active ? 'active' : ''}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
