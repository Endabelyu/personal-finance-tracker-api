import { redirect, type ActionFunctionArgs } from 'react-router';

export async function action({ request }: ActionFunctionArgs) {
  const origin = new URL(request.url).origin;

  // Call the Better Auth API to sign out
  const response = await fetch(`${origin}/api/auth/sign-out`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: request.headers.get('Cookie') || '',
    },
  });

  // Get the Set-Cookie header to clear the session
  const setCookieHeader = response.headers.get('Set-Cookie');
  const headers = new Headers();
  if (setCookieHeader) {
    headers.append('Set-Cookie', setCookieHeader);
  }

  return redirect('/auth/login', { headers });
}

// This route handles POST requests for logout
// Usage: <Form method="post" action="/auth/logout">...</Form>
