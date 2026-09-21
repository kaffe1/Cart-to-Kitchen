import { ChefHat, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useState, type SyntheticEvent } from 'react';
import { Link } from 'react-router-dom';
import { appRoutes } from '@/app/routes';
import { Button } from '@/shared/components/ui/button';
import { FeedbackBanner } from '@/shared/components/ui/FeedbackBanner';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { useAuthPresenter } from '../presenter/useAuthPresenter';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const presenter = useAuthPresenter(mode);
  const [displayName, setDisplayName] = useState('Alex');
  const [email, setEmail] = useState('demo@cart.kitchen');
  const [password, setPassword] = useState('demo-password');

  function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    void presenter.submit(mode === 'register' ? { displayName, email, password } : { email, password });
  }

  return (
    <main className="auth-layout">
      <section className="auth-story">
        <Link to={appRoutes.store} className="brand-lockup"><span className="brand-mark"><ChefHat size={20} /></span><span><strong>Cart to Kitchen</strong><small>interactive cooking planner</small></span></Link>
        <div className="auth-story-copy"><span className="eyebrow">From basket to dinner</span><h1>Every ingredient is a possibility.</h1><p>Shop within your budget, arrange your kitchen counter, and discover the dishes already within reach.</p></div>
        <div className="auth-steps"><span><b>01</b> Shop</span><span><b>02</b> Prepare</span><span><b>03</b> Cook</span></div>
      </section>
      <section className="auth-form-side">
        <form className="auth-form" onSubmit={submit}>
          <span className="eyebrow">{mode === 'login' ? 'Welcome back' : 'Create your kitchen'}</span>
          <h2>{mode === 'login' ? 'Sign in' : 'Create account'}</h2>
          <p>{mode === 'login' ? 'Use the prefilled demo credentials or enter any values.' : 'New accounts begin with 500 SEK.'}</p>
          {presenter.error && <FeedbackBanner tone="error">{presenter.error}</FeedbackBanner>}
          {mode === 'register' && <div className="form-field"><Label htmlFor="display-name"><UserRound size={15} /> Display name</Label><Input id="display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required /></div>}
          <div className="form-field"><Label htmlFor="email"><Mail size={15} /> Email</Label><Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
          <div className="form-field"><Label htmlFor="password"><LockKeyhole size={15} /> Password</Label><Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required /></div>
          <Button size="lg" className="w-full" disabled={presenter.isSubmitting}>{presenter.isSubmitting ? 'One moment…' : mode === 'login' ? 'Sign in' : 'Create account'}</Button>
          <div className="demo-notice"><strong>Demo mode</strong><span>TODO(BACKEND): credentials will later be sent to the Python JWT endpoints.</span></div>
          <p className="auth-switch">{mode === 'login' ? 'New here?' : 'Already registered?'} <Link to={mode === 'login' ? appRoutes.register : appRoutes.login}>{mode === 'login' ? 'Create an account' : 'Sign in'}</Link></p>
          <Link to={appRoutes.store} className="guest-link">Continue as guest · progress will not persist</Link>
        </form>
      </section>
    </main>
  );
}
