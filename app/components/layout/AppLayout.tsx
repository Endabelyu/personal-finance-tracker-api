import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Menu, X } from 'lucide-react';
import type { ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
  header?: {
    title?: string;
    subtitle?: string;
  };
}

export function AppLayout({ children, header }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Desktop */}
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar />
      </div>

      {/* Sidebar - Mobile Slide-out */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-out lg:hidden
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Page Title */}
          <div className="flex-1 ml-4 lg:ml-0">
            {header?.title && (
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{header.title}</h1>
            )}
            {header?.subtitle && (
              <p className="hidden sm:block text-sm text-gray-500 truncate">{header.subtitle}</p>
            )}
          </div>

          {/* User section placeholder - actual implementation in Header */}
          <div className="flex items-center gap-2">
            {/* This is handled by Header component below */}
          </div>
        </header>

        {/* Desktop Header with User */}
        <div className="hidden lg:block">
          <Header title={header?.title} subtitle={header?.subtitle} />
        </div>
        
        {/* Mobile User Header */}
        <div className="lg:hidden border-b border-gray-200 bg-white">
          <div className="px-4 py-3">
            <Header />
          </div>
        </div>
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
