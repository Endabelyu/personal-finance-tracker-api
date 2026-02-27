import { NavLink, useLocation } from 'react-router';
import { LayoutDashboard, Receipt, PiggyBank, BarChart3, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';

const tabs = [
  { path: '/', label: 'Home', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transactions', icon: Receipt },
  { path: '/budget', label: 'Budget', icon: PiggyBank },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
];

export function BottomNav() {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY;

      if (scrollDelta > 10 && currentScrollY > 100) {
        setIsVisible(false);
      } else if (scrollDelta < -5) {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const isAddPage = location.pathname.includes('/transactions/new') || 
                    location.pathname.includes('/budget/new');

  return (
    <>
      {/* Floating Action Button */}
      <div
        className={`
          fixed right-4 z-40 transition-all duration-300 ease-out lg:hidden
          ${isVisible ? 'bottom-[88px]' : 'bottom-4'}
        `}
      >
        <NavLink
          to="/transactions/new"
          className={`
            flex items-center justify-center w-14 h-14 rounded-full 
            bg-blue-600 text-white shadow-lg shadow-blue-600/30
            active:scale-95 transition-transform duration-150
            ${isAddPage ? 'bg-gray-400 shadow-gray-400/30' : 'hover:bg-blue-700'}
          `}
          aria-label="Add transaction"
        >
          <Plus className="w-6 h-6" />
        </NavLink>
      </div>

      {/* Bottom Tab Bar */}
      <nav
        className={`
          fixed bottom-0 left-0 right-0 z-50 lg:hidden
          bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg
          border-t border-gray-200 dark:border-gray-800
          safe-area-pb
          transition-transform duration-300 ease-out
          ${isVisible ? 'translate-y-0' : 'translate-y-full'}
        `}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {tabs.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) => `
                flex flex-col items-center justify-center 
                min-w-[64px] min-h-[48px] px-3 py-1
                rounded-2xl transition-all duration-200
                ${isActive 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }
              `}
            >
              <div className={`
                relative flex items-center justify-center
                transition-transform duration-200
              `}>
                <Icon className="w-6 h-6" strokeWidth={location.pathname === path || (path === '/' && location.pathname === '/') ? 2.5 : 2} />
                {(location.pathname === path || (path === '/' && location.pathname === '/')) && (
                  <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
              </div>
              <span className="text-[11px] font-medium mt-1 leading-none">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
