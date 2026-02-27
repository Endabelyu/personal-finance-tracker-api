import { Link } from 'react-router';
import { FileQuestion, Home, Search, ArrowLeft } from 'lucide-react';
import '../styles/animations.css';

// Button style constants
const primaryStyles = "inline-flex items-center justify-center font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none transition-all duration-200 ease-out active:scale-[0.98] shadow-sm hover:shadow";
const outlineStyles = "inline-flex items-center justify-center font-semibold rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 focus:outline-none transition-all duration-200 ease-out active:scale-[0.98] hover:border-gray-400";
const lgSize = "px-6 py-3 text-base h-12";

/**
 * 404 Not Found Page
 * Catches all unmatched routes
 * Styled with Tailwind CSS, responsive and accessible
 */
export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full">
        {/* Main content card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
          {/* Illustration */}
          <div className="relative mb-8">
            <div className="w-32 h-32 mx-auto rounded-full bg-blue-50 flex items-center justify-center animate-fade-in">
              <FileQuestion className="w-16 h-16 text-blue-500" aria-hidden="true" />
            </div>
            {/* Decorative elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-32 h-32 rounded-full bg-blue-100 opacity-50 blur-xl" />
          </div>

          {/* Error code */}
          <div className="mb-4">
            <span className="text-8xl font-bold text-gray-200 select-none" aria-hidden="true">
              404
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>

          {/* Description */}
          <p className="text-lg text-gray-600 mb-4 max-w-md mx-auto">
            Oops! The page you're looking for seems to have wandered off into the digital wilderness.
          </p>

          <p className="text-gray-500 mb-8 max-w-sm mx-auto">
            It might have been moved, deleted, or you may have mistyped the URL. Let's get you back on track!
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <Link
              to="/dashboard"
              className={`${primaryStyles} ${lgSize}`}
            >
              <Home className="w-5 h-5 mr-2" aria-hidden="true" />
              Go to Dashboard
            </Link>

            <Link
              to="/transactions"
              className={`${outlineStyles} ${lgSize}`}
            >
              <Search className="w-5 h-5 mr-2" aria-hidden="true" />
              View Transactions
            </Link>
          </div>

          {/* Back link */}
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg px-3 py-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            <span>Go back to previous page</span>
          </button>
        </div>

        {/* Helpful links section */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/dashboard"
            className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Home className="w-5 h-5 text-green-600" aria-hidden="true" />
            </div>
            <span className="text-sm font-medium text-gray-700">Dashboard</span>
          </Link>

          <Link
            to="/transactions"
            className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Search className="w-5 h-5 text-purple-600" aria-hidden="true" />
            </div>
            <span className="text-sm font-medium text-gray-700">Transactions</span>
          </Link>

          <Link
            to="/budget"
            className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg
                className="w-5 h-5 text-orange-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Budget</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
