import { createFileRoute } from '@tanstack/react-router';
import App from '../../App';

export const Route = createFileRoute('/admin/admin-users')({
  component: () => <App view="admins" />,
});
