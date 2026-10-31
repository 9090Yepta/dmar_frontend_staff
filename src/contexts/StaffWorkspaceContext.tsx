import { createContext, useContext, type ReactNode } from 'react';
import { useStaffWorkspaceState } from '../hooks/useStaffWorkspace';

type StaffWorkspace = ReturnType<typeof useStaffWorkspaceState>;

const StaffWorkspaceContext = createContext<StaffWorkspace | null>(null);

export function StaffWorkspaceProvider({ children }: { children: ReactNode }) {
  const workspace = useStaffWorkspaceState();
  return <StaffWorkspaceContext.Provider value={workspace}>{children}</StaffWorkspaceContext.Provider>;
}

export function useStaffWorkspace(): StaffWorkspace {
  const workspace = useContext(StaffWorkspaceContext);
  if (!workspace) throw new Error('useStaffWorkspace harus digunakan di dalam StaffWorkspaceProvider');
  return workspace;
}
