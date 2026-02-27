import { renderToReadableStream } from 'react-dom/server';
import { ServerRouter } from 'react-router';
import type { AppLoadContext, EntryContext } from 'react-router';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: AppLoadContext
) {
  const stream = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      signal: request.signal,
      onError(error: unknown) {
        console.error('SSR Error:', error);
        responseStatusCode = 500;
      },
    }
  );

  // Wait for the stream to be ready before responding
  await stream.allReady;

  responseHeaders.set('Content-Type', 'text/html');

  return new Response(stream, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
