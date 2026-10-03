import {
  ChefHat,
  CircleUserRound,
  ListChecks,
  Palette,
  ShoppingBasket,
  Store,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { appRoutes } from "@/app/routes";
import { Badge } from "@/shared/components/ui/badge";
import { Progress } from "@/shared/components/ui/progress";
import { useAppShellPresenter } from "./useAppShellPresenter";

const primaryNavItems = [
  { href: appRoutes.store, label: "Store", icon: Store },
  { href: appRoutes.kitchen, label: "Kitchen", icon: ChefHat },
  { href: appRoutes.profile, label: "Me", icon: CircleUserRound },
];

const navItems = import.meta.env.DEV
  ? [
      ...primaryNavItems,
      { href: appRoutes.designSystem, label: "Design sys", icon: Palette },
    ]
  : primaryNavItems;

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const presenter = useAppShellPresenter();
  const progress =
    (presenter.wallet.balanceSek / presenter.wallet.capSek) * 100;

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
                (item.href !== "/me" && pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={active ? "nav-link active" : "nav-link"}
                >
                  <Icon size={17} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* <div className="header-actions">
            <div className="wallet-chip" aria-label={`${presenter.wallet.balanceSek} Swedish kronor available`}>
              <span className="wallet-value">{presenter.wallet.balanceSek} SEK</span>
              <Progress value={progress} className="h-1.5" />
            </div>
            <Link to={appRoutes.store} className="icon-chip" aria-label={`${presenter.cartUnits} items in cart`}>
              <ShoppingBasket size={18} />
              {presenter.cartUnits > 0 && <Badge>{presenter.cartUnits}</Badge>}
            </Link>
            <Link to={appRoutes.kitchen} className="icon-chip note-chip" aria-label={`${presenter.shoppingListCount} shopping note items`}>
              <ListChecks size={18} />
              {presenter.shoppingListCount > 0 && <Badge>{presenter.shoppingListCount}</Badge>}
            </Link>
          </div> */}
        </div>
      </header>

      <main className="app-main">{children}</main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={active ? "active" : ""}
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
