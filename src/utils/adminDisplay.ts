import type { AdminRole } from '../types/admin';

export function formatAdminRole(role: AdminRole): string {
  if (role === 'mechanic') return 'Mekanik';
  if (role === 'foreman') return 'Foreman';
  return role === 'superadmin' ? 'Superadmin' : 'Admin';
}
