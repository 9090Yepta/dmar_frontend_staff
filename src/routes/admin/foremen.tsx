import { createFileRoute, Outlet, useRouterState } from '@tanstack/react-router';
import App from '../../App';

export const Route = createFileRoute('/admin/foremen')({
  component: function ForemenRoute() {
    const pathname = useRouterState({ select: (state) => state.location.pathname });
    return pathname === '/admin/foremen' ? <App view="foremen" /> : <Outlet />;
  },
});
