import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface FeedbackBannerProps {
  tone?: 'success' | 'error' | 'info';
  children: React.ReactNode;
}

export function FeedbackBanner({ tone = 'info', children }: FeedbackBannerProps) {
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'error' ? AlertCircle : Info;
  return (
    <div className={`feedback-banner feedback-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon aria-hidden="true" size={18} />
      <span>{children}</span>
    </div>
  );
}
