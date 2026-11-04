import { useEffect, useState } from 'react';
import { useIsFetching } from '@tanstack/react-query';
import { useRouterState } from '@tanstack/react-router';

export function LoadingIndicator() {
  const fetchingCount = useIsFetching();
  const isNavigating = useRouterState({ select: (state) => state.status === 'pending' });
  const isLoading = fetchingCount > 0 || isNavigating;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setVisible(false);
      return;
    }

    const timer = window.setTimeout(() => setVisible(true), 180);
    return () => window.clearTimeout(timer);
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex justify-center px-4">
      <div
        className="flex items-center gap-2 rounded-full border border-base-300 bg-base-100/95 px-4 py-2 text-sm font-medium text-base-content shadow-lg backdrop-blur"
        role="status"
        aria-live="polite"
      >
        <span className="loading loading-spinner loading-xs text-primary" aria-hidden="true" />
        <span>{isNavigating ? 'Membuka halaman…' : 'Memuat data…'}</span>
      </div>
    </div>
  );
}
