import { createRootRoute, Outlet } from '@tanstack/react-router';
import { StaffWorkspaceProvider } from '../contexts/StaffWorkspaceContext';

export const Route = createRootRoute({
  component: () => <StaffWorkspaceProvider><Outlet /></StaffWorkspaceProvider>,
});
