import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom';
import { AuthPage } from '@/features/auth/view/AuthPage';
import { CookPage } from '@/features/cooking/view/CookPage';
import { KitchenPage } from '@/features/kitchen/view/KitchenPage';
import { ProfilePage } from '@/features/profile/view/ProfilePage';
import { RecipeDetailPage } from '@/features/recipes/view/RecipeDetailPage';
import { StorePage } from '@/features/store/view/StorePage';
import { AppShell } from '@/shared/components/layout/AppShell';
import { appRoutes } from './routes';

const DesignSystemPage = import.meta.env.DEV
  ? lazy(() =>
      import('./design-system/DesignSystemPage').then((module) => ({
        default: module.DesignSystemPage,
      })),
    )
  : null;

function RecipeRoute() {
  const { recipeId = '' } = useParams();
  return <RecipeDetailPage recipeId={recipeId} />;
}

function CookRoute() {
  const { recipeId = '' } = useParams();
  return <CookPage recipeId={recipeId} />;
}

function ApplicationLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={appRoutes.login} element={<AuthPage mode="login" />} />
        <Route path={appRoutes.register} element={<AuthPage mode="register" />} />
        <Route element={<ApplicationLayout />}>
          <Route index element={<Navigate to={appRoutes.store} replace />} />
          <Route path={appRoutes.store} element={<StorePage />} />
          <Route path={appRoutes.kitchen} element={<KitchenPage />} />
          <Route path={appRoutes.profile} element={<ProfilePage />} />
          {DesignSystemPage && (
            <Route
              path={appRoutes.designSystem}
              element={
                <Suspense fallback={<div className="page-shell">Loading design system…</div>}>
                  <DesignSystemPage />
                </Suspense>
              }
            />
          )}
          <Route path="/recipes/:recipeId" element={<RecipeRoute />} />
          <Route path="/cook/:recipeId" element={<CookRoute />} />
        </Route>
        <Route path="*" element={<Navigate to={appRoutes.store} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
