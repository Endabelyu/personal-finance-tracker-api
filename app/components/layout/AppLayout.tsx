import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { InstallPrompt, OfflineIndicator, UpdatePrompt } from '@app/components/pwa';
import type { ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
}

// Pull-to-refresh indicator component
function PullToRefreshIndicator({ 
  isPulling, 
  pullProgress, 
  isRefreshing 
}: { 
  isPulling: boolean; 
  pullProgress: number;
  isRefreshing: boolean;
}) {
  if (!isPulling && !isRefreshing) return null;

  return (
    <div 
      className={`
        fixed top-14 left-0 right-0 z-20 flex items-center justify-center
        pointer-events-none transition-opacity duration-200
        ${isPulling || isRefreshing ? 'opacity-100' : 'opacity-0'}
      `}
    >
      <div className={`
        flex items-center gap-2 px-4 py-2 rounded-full
        bg-white/90 dark:bg-gray-900/90 backdrop-blur shadow-lg
        transform transition-transform duration-200
      `}>
        <div 
          className={`
            w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full
            ${isRefreshing ? 'animate-spin' : ''}
          `}
          style={{
            transform: !isRefreshing ? `rotate(${pullProgress * 360}deg)` : undefined
          }}
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isRefreshing ? 'Refreshing...' : pullProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
        </span>
      </div>
    </div>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const touchStartY = useRef(0);
  const mainRef = useRef<HTMLElement>(null);
  const location = useLocation();

  // Close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Pull-to-refresh implementation
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only enable pull-to-refresh when at top of page
      if (main.scrollTop === 0 || window.scrollY === 0) {
        touchStartY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touchY = e.touches[0].clientY;
      const diff = touchY - touchStartY.current;
      
      // Only trigger if pulling down at top of page
      if ((main.scrollTop === 0 || window.scrollY === 0) && diff > 0 && diff < 200) {
        setIsPulling(true);
        setPullProgress(Math.min(diff / 100, 1));
        
        // Prevent default scrolling when pulling
        if (diff > 20) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = () => {
      if (pullProgress >= 1 && !isRefreshing) {
        setIsRefreshing(true);
        // Simulate refresh - in real app, this would refresh data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
      setIsPulling(false);
      setPullProgress(0);
    };

    main.addEventListener('touchstart', handleTouchStart, { passive: true });
    main.addEventListener('touchmove', handleTouchMove, { passive: false });
    main.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      main.removeEventListener('touchstart', handleTouchStart);
      main.removeEventListener('touchmove', handleTouchMove);
      main.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullProgress, isRefreshing]);

  // Add safe area CSS variable for notched phones
  useEffect(() => {
    const safeAreaTop = getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0px';
    const safeAreaBottom = getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0px';
    
    document.documentElement.style.setProperty('--safe-area-top', safeAreaTop);
    document.documentElement.style.setProperty('--safe-area-bottom', safeAreaBottom);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Mobile Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Desktop Sidebar (Fixed) */}
      <div className="hidden lg:block">
        <Sidebar isOpen={false} onClose={() => {}} />
      </div>

      {/* App Shell */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <Header 
          onMenuClick={() => setIsSidebarOpen(true)} 
        />

        {/* Pull-to-refresh Indicator */}
        <PullToRefreshIndicator 
          isPulling={isPulling} 
          pullProgress={pullProgress}
          isRefreshing={isRefreshing}
        />

        {/* Main Content */}
        <main
          ref={mainRef}
          className="
            flex-1 overflow-y-auto overflow-x-hidden
            pt-14 lg:pt-0
            pb-20 lg:pb-8
            lg:h-screen
            overscroll-y-contain
            -webkit-overflow-scrolling-touch
          "
        >
          <div className="min-h-full p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />


      {/* PWA Components */}
      <InstallPrompt />
      <OfflineIndicator />
      <UpdatePrompt />
      {/* Safe Area Styles */}
      <style>{`
        .safe-area-pt {
          padding-top: max(env(safe-area-inset-top), 0px);
        }
        .safe-area-pb {
          padding-bottom: max(env(safe-area-inset-bottom), 16px);
        }
        
        /* Momentum scrolling for iOS */
        .momentum-scroll {
          -webkit-overflow-scrolling: touch;
        }
        
        /* Prevent rubber-band effect on body */
        body {
          overscroll-behavior-y: none;
        }
        
        /* Ensure 44px minimum touch targets */
        @media (pointer: coarse) {
          button, a, [role="button"] {
            min-height: 44px;
            min-width: 44px;
          }
        }
      `}</style>
    </div>
  );
}
