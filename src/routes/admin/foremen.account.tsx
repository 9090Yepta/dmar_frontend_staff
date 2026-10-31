import { createFileRoute } from '@tanstack/react-router';
import App from '../../App';

export const Route = createFileRoute('/admin/foremen/account')({
  component: () => <App view="foreman-account" />,
});
