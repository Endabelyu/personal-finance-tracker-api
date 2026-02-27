import '../styles/animations.css';
import { Outlet, redirect, type LoaderFunctionArgs } from 'react-router';
import { AppLayout } from '@app/components/layout';
import { requireSession } from '@app/lib/auth.server';

/**
 * App layout route with auth guard
 * All child routes under _app.* will be protected
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    await requireSession(request);
    return null;
  } catch {
    // Not authenticated - redirect to login
    const url = new URL(request.url);
    const redirectUrl = encodeURIComponent(url.pathname + url.search);
    return redirect(`/login?redirect=${redirectUrl}`);
  }
}

export default function AppRoot() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
