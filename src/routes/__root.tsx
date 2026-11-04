import { createRootRoute, Outlet } from '@tanstack/react-router';
import { StaffWorkspaceProvider } from '../contexts/StaffWorkspaceContext';
import { LoadingIndicator } from '../components/ui/LoadingIndicator';

export const Route = createRootRoute({
  component: () => (
    <StaffWorkspaceProvider>
      <Outlet />
      <LoadingIndicator />
    </StaffWorkspaceProvider>
  ),
});
