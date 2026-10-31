import { createFileRoute } from '@tanstack/react-router';
import App from '../../App';

export const Route = createFileRoute('/admin/foremen/history')({
  component: () => <App view="foreman-history" />,
});
