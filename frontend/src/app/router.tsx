import { BrowserRouter, Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom';
import { AuthPage } from '@/features/auth/view/AuthPage';
import { CookPage } from '@/features/cooking/view/CookPage';
import { CookingFinishedPage } from '@/features/cooking/view/CookingFinishedPage';
import { KitchenPage } from '@/features/kitchen/view/KitchenPage';
import { ProfilePage } from '@/features/profile/view/ProfilePage';
import { RecipeDetailPage } from '@/features/recipes/view/RecipeDetailPage';
import { StorePage } from '@/features/store/view/StorePage';
import { AppShell } from '@/shared/components/layout/AppShell';
import { appRoutes } from './routes';

function RecipeRoute() {
  const { recipeId = '' } = useParams();
  return <RecipeDetailPage recipeId={recipeId} />;
}

function CookRoute() {
  const { recipeId = '' } = useParams();
  return <CookPage key={recipeId} recipeId={recipeId} />;
}

function CookingFinishedRoute() {
  const { historyId = '' } = useParams();
  return <CookingFinishedPage key={historyId} historyId={historyId} />;
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
          <Route path="/recipes/:recipeId" element={<RecipeRoute />} />
          <Route path="/cook/:recipeId" element={<CookRoute />} />
          <Route path="/cooking-finished/:historyId" element={<CookingFinishedRoute />} />
        </Route>
        <Route path="*" element={<Navigate to={appRoutes.store} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
