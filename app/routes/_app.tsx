import '../styles/animations.css';
import { Outlet, type LoaderFunctionArgs } from 'react-router';
import { AppLayout } from '@app/components/layout';
import { requireSession } from '@app/lib/auth.server';
import { WalkthroughProvider } from '@app/context/WalkthroughContext';
import { Walkthrough } from '@app/components/ui/Walkthrough';
import { defaultWalkthroughSteps } from '@app/lib/walkthrough-steps';

/**
 * App layout route with auth guard
 * All child routes under _app.* will be protected.
 * requireSession() throws redirect('/auth/login') when not authenticated.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  await requireSession(request);
  return null;
}

export default function AppRoot() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
