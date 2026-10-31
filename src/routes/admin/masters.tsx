import { createFileRoute } from '@tanstack/react-router';
import App from '../../App';

export const Route = createFileRoute('/admin/masters')({
  component: () => <App view="masters" />,
});
