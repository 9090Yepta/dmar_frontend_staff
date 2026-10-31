import { createFileRoute } from '@tanstack/react-router';
import App from '../../App';

export const Route = createFileRoute('/admin/reports-legacy')({
  component: () => <App view="legacy" />,
});
