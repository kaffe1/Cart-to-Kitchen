import {
  ChefHat,
  CircleUserRound,
  Palette,
  ShoppingBasket,
  Store,
} from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { appRoutes } from '@/app/routes';
import { Button } from '@/shared/components/ui/button';
import { FeedbackBanner } from '@/shared/components/ui/FeedbackBanner';
import { appSession } from '../../api/appSession';
import { useAppShellPresenter } from './useAppShellPresenter';

const primaryNavItems = [
  { href: appRoutes.store, label: 'Store', icon: Store },
  { href: appRoutes.kitchen, label: 'Kitchen', icon: ChefHat },
  { href: appRoutes.profile, label: 'Me', icon: CircleUserRound },
];

const navItems = import.meta.env.DEV
  ? [
      ...primaryNavItems,
      { href: appRoutes.designSystem, label: 'Design sys', icon: Palette },
    ]
  : primaryNavItems;

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const presenter = useAppShellPresenter();
  const navigate = useNavigate();
  useEffect(() => {
    void appSession.ensureShoppingSession().catch(() => undefined);
  }, []);

  async function signOut() {
    try {
      await appSession.logout();
      void navigate('/login', { replace: true });
    } catch {
      /* Session errors are shown below. */
    }
  }

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

          <div className="flex items-center gap-2">
            {presenter.user && (
              <span className="hidden max-w-32 truncate text-sm sm:inline">
                {presenter.user.displayName}
              </span>
            )}
            {presenter.user?.mode !== 'account' && (
              <Link to={appRoutes.login}>Sign in</Link>
            )}
            {presenter.user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void signOut()}
                disabled={
                  presenter.isAuthenticating ||
                  presenter.isCheckingOut ||
                  presenter.pendingCartWrites > 0
                }
              >
                Sign out
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        {presenter.checkoutNotice && (
          <FeedbackBanner tone="success">
            {presenter.checkoutNotice}
          </FeedbackBanner>
        )}
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
