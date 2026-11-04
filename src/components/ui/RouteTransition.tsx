import { useEffect, useRef, type ReactNode } from 'react';
import { useRouterState } from '@tanstack/react-router';

export function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const containerRef = useRef<HTMLDivElement>(null);
  const previousPath = useRef(pathname);

  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;

    const container = containerRef.current;
    if (!container || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const animation = container.animate(
      [
        { opacity: 0.72, transform: 'translateY(5px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      { duration: 180, easing: 'ease-out' },
    );

    return () => animation.cancel();
  }, [pathname]);

  return <div ref={containerRef} className="min-w-0">{children}</div>;
}
