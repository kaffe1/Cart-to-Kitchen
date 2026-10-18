import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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

interface FeedbackToastProps {
  message: string;
  tone?: 'success' | 'error' | 'info';
  duration?: number;
  onDismiss?: () => void;
}

export function FeedbackToast({
  message,
  tone = 'success',
  duration = 3000,
  onDismiss,
}: FeedbackToastProps) {
  const [visible, setVisible] = useState(false);
  // The ref keeps the latest callback available to timers without restarting
  // their lifecycle whenever a parent creates a new function identity.
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const enterFrame = window.requestAnimationFrame(() => setVisible(true));
    const fadeTimer = window.setTimeout(
      () => setVisible(false),
      Math.max(0, duration - 220),
    );
    const dismissTimer = window.setTimeout(
      () => onDismissRef.current?.(),
      duration,
    );
    return () => {
      window.cancelAnimationFrame(enterFrame);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(dismissTimer);
    };
  }, [duration, message]);

  return (
    <div
      className={visible ? 'feedback-toast visible' : 'feedback-toast'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
    >
      <FeedbackBanner tone={tone}>{message}</FeedbackBanner>
    </div>
  );
}
