import { NavLink, Link } from 'react-router';
import { 
  LayoutDashboard, 
  Wallet, 
  PiggyBank, 
  BarChart3, 
  Receipt, 
  X, 
  Settings, 
  User,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  Monitor,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { useSession, signOut } from '@app/lib/auth-client';
import { useTheme } from '@app/hooks/useTheme';
import { useWalkthrough } from '@app/hooks/useWalkthrough';
import { defaultWalkthroughSteps } from '@app/lib/walkthrough-steps';
import { useNavigate } from 'react-router';
import { useState, useEffect, useRef } from 'react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transactions', icon: Receipt },
  { path: '/budget', label: 'Budget', icon: PiggyBank },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { data: session, isPending } = useSession();
  const { theme, effectiveTheme, setTheme, mounted } = useTheme();
  const { startWalkthrough } = useWalkthrough();
  const navigate = useNavigate();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const [activeSection, setActiveSection] = useState<'main' | 'settings'>('main');

  const user = session?.user;
  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user?.email?.[0].toUpperCase() || '?';

  const ThemeIcon = mounted && effectiveTheme === 'dark' ? Sun : Moon;

  // Handle swipe to close
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartX.current === null) return;
      
      const touchX = e.touches[0].clientX;
      const diff = touchX - touchStartX.current;
      
      // Swipe left to close (when diff is negative and significant)
      if (diff < -80 && touchStartX.current < 100) {
        onClose();
        touchStartX.current = null;
      }
    };

    const sidebar = sidebarRef.current;
    if (sidebar) {
      sidebar.addEventListener('touchstart', handleTouchStart, { passive: true });
      sidebar.addEventListener('touchmove', handleTouchMove, { passive: true });
    }

    return () => {
      if (sidebar) {
        sidebar.removeEventListener('touchstart', handleTouchStart);
        sidebar.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, [onClose]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setActiveSection('main');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    await signOut();
    onClose();
    navigate('/login');
  };

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className={`
          fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden
          transition-opacity duration-300
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar Drawer */}
      <aside
        ref={sidebarRef}
        className={`
          fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw]
          bg-white dark:bg-gray-900 
          shadow-2xl shadow-black/20
          transform transition-transform duration-300 ease-out
          lg:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* User Profile Section */}
        <div className="p-6 bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800">
          <div className="flex items-start justify-between">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-xl border-2 border-white/30">
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user.name || user.email}
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                userInitials
              )}
            </div>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="mt-4">
            <p className="text-lg font-semibold text-white">
              {isPending ? 'Loading...' : (user?.name || user?.email || 'Guest')}
            </p>
            <p className="text-sm text-blue-100">
              {user?.email && user.name ? user.email : 'Personal Finance Tracker'}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden relative h-[calc(100%-180px)]">
          {/* Main Menu */}
          <div className={`
            absolute inset-0 transition-transform duration-300 ease-out overflow-y-auto
            ${activeSection === 'main' ? 'translate-x-0' : '-translate-x-full'}
          `}>
            {/* Navigation */}
            <nav className="p-4 space-y-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  end={path === '/'}
                  onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center gap-4 px-4 py-3.5 rounded-xl
                    text-[15px] font-medium transition-all duration-200
                    min-h-[56px]
                    ${isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  <Icon className="w-6 h-6 flex-shrink-0" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="mx-4 my-2 h-px bg-gray-200 dark:bg-gray-800" />

            {/* Secondary Menu */}
            <div className="p-4 space-y-1">
              {/* Help */}
              <button
                onClick={() => {
                  onClose();
                  startWalkthrough(defaultWalkthroughSteps);
                }}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-[15px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-h-[56px]"
              >
                <HelpCircle className="w-6 h-6 flex-shrink-0" />
                <span>Help & Tour</span>
              </button>

              {/* Settings */}
              <button
                onClick={() => setActiveSection('settings')}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-[15px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-h-[56px]"
              >
                <Settings className="w-6 h-6 flex-shrink-0" />
                <span className="flex-1 text-left">Settings</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Settings Submenu */}
          <div className={`
            absolute inset-0 transition-transform duration-300 ease-out overflow-y-auto
            ${activeSection === 'settings' ? 'translate-x-0' : 'translate-x-full'}
          `}>
            {/* Settings Header */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setActiveSection('main')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Settings</span>
            </div>

            {/* Theme Settings */}
            <div className="p-4">
              <p className="px-4 text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Theme</p>
              <div className="space-y-1">
                <button
                  onClick={() => setTheme('light')}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-[15px] font-medium transition-colors min-h-[56px] ${theme === 'light' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <Sun className="w-6 h-6 flex-shrink-0" />
                  <span>Light</span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-[15px] font-medium transition-colors min-h-[56px] ${theme === 'dark' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <Moon className="w-6 h-6 flex-shrink-0" />
                  <span>Dark</span>
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-[15px] font-medium transition-colors min-h-[56px] ${theme === 'system' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <Monitor className="w-6 h-6 flex-shrink-0" />
                  <span>System</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Sign Out */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 safe-area-pb">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-[15px] font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors min-h-[56px]"
          >
            <LogOut className="w-6 h-6 flex-shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 fixed left-0 top-0">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">Finance</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tracker</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 min-h-[48px]
                ${isActive
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-800'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            © {new Date().getFullYear()} Finance Tracker
          </p>
        </div>
      </aside>
    </>
  );
}
