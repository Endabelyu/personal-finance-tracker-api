import './tailwind.css';
import './styles/dark-mode.css';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
  Link,
} from 'react-router';
import type { ReactNode } from 'react';
import './styles/animations.css';
import { ToastProvider } from '@app/components/ui';
import { defaultWalkthroughSteps } from '@app/lib/walkthrough-steps';

import type { MetaFunction } from 'react-router';

export const meta: MetaFunction = () => {
  return [
    { title: "Personal Finance Tracker" },
    { name: "description", content: "Personal Finance Tracker - Manage your finances with ease" }
  ];
};

// Development mode check
const isDevelopment = process.env.NODE_ENV === 'development';

// Button style constants
const primaryStyles = "inline-flex items-center justify-center font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none transition-all duration-200 ease-out active:scale-[0.98] shadow-sm hover:shadow";
const outlineStyles = "inline-flex items-center justify-center font-semibold rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 focus:outline-none transition-all duration-200 ease-out active:scale-[0.98] hover:border-gray-400";
const mdSize = "px-4 py-2 text-sm h-10";

/**
 * Document layout component
 * Wraps the entire application with HTML document structure
 */
export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta name="description" content="Personal Finance Tracker - Manage your finances with ease" />
        
        {/* PWA Meta Tags */}
        <meta name="theme-color" content="#3b82f6" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1e3a8a" media="(prefers-color-scheme: dark)" />
        <meta name="background-color" content="#ffffff" />
        <meta name="color-scheme" content="light dark" />
        
        {/* Apple iOS Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Finance" />
        
        {/* Microsoft Windows Meta Tags */}
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-TileImage" content="/icons/icon.svg" />
        
        {/* Mobile Optimization */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Personal Finance Tracker" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/icons/favicon.svg" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.svg" />
        
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap" rel="stylesheet" />

        {/* Web App Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Service Worker Cleanup (Dev) */}
        <script dangerouslySetInnerHTML={{__html: `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
              for(let registration of registrations) {
                registration.unregister();
              }
            });
          }
        `}} />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen antialiased touch-manipulation">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

/**
 * Default export - main app outlet
 */
export default function App() {
  return (
    <ToastProvider>
      <Outlet />
    </ToastProvider>
  );
}

/**
 * ErrorBoundary - Catches all unhandled errors in the app
 * Displays a user-friendly 500 error page
 */
export function ErrorBoundary() {
  const error = useRouteError();

  // Handle route error responses (4xx, 5xx from loaders/actions)
  if (isRouteErrorResponse(error)) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-12 h-12 text-red-600" aria-hidden="true" />
            </div>

            <h1 className="text-6xl font-bold text-gray-900 mb-4">
              {error.status}
            </h1>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              {error.statusText || 'An error occurred'}
            </h2>

            <p className="text-gray-600 mb-8">
              {error.data || 'Something went wrong while processing your request.'}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/" className={`${primaryStyles} ${mdSize}`}>
                <Home className="w-4 h-4 mr-2" />
                Go Back Home
              </Link>

              <Link to="/dashboard" className={`${outlineStyles} ${mdSize}`}>
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Handle thrown Error objects
  if (error instanceof Error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
          <div className="max-w-lg w-full">
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-12 h-12 text-red-600" aria-hidden="true" />
              </div>

              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Something Went Wrong
              </h1>

              <p className="text-gray-600">
                We're sorry, but an unexpected error occurred.
              </p>
            </div>

            {/* Show error details in development only */}
            {isDevelopment && (
              <div className="mb-8 bg-gray-900 rounded-lg overflow-hidden">
                <div className="px-4 py-2 bg-gray-800 border-b border-gray-700">
                  <span className="text-xs font-mono text-gray-400">Error Details (Development Only)</span>
                </div>
                <div className="p-4 overflow-auto">
                  <p className="text-red-400 font-mono text-sm mb-2">{error.message}</p>
                  {error.stack && (
                    <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap">
                      {error.stack}
                    </pre>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className={`${primaryStyles} ${mdSize}`}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </button>

              <Link to="/" className={`${outlineStyles} ${mdSize}`}>
                <Home className="w-4 h-4 mr-2" />
                Go Back Home
              </Link>
            </div>

            {!isDevelopment && (
              <p className="mt-6 text-center text-sm text-gray-500">
                If this problem persists, please contact support.
              </p>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // Fallback for unknown error types
  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-red-600" aria-hidden="true" />
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Unexpected Error
          </h1>

          <p className="text-gray-600 mb-8">
            An unknown error occurred. Please try again or contact support if the problem persists.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className={`${primaryStyles} ${mdSize}`}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>

            <Link to="/" className={`${outlineStyles} ${mdSize}`}>
              <Home className="w-4 h-4 mr-2" />
              Go Back Home
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
