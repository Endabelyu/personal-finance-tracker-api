import { useState } from 'react';
import { useNavigate, Form, Link } from 'react-router';
import { useSession, signOut } from '@app/lib/auth-client';
import { User, LogOut, ChevronDown, Loader2, Moon, Sun, Monitor, HelpCircle, Sparkles } from 'lucide-react';
import { useTheme } from '@app/hooks/useTheme';
import { useWalkthrough } from '@app/hooks/useWalkthrough';
import { defaultWalkthroughSteps } from '@app/lib/walkthrough-steps';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { data: session, isPending } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const { theme, effectiveTheme, setTheme, mounted } = useTheme();
  const { startWalkthrough } = useWalkthrough();
  const navigate = useNavigate();
  const [isHelpDropdownOpen, setIsHelpDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const user = session?.user;
  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user?.email?.[0].toUpperCase() || '?';

  // Avoid hydration mismatch by not rendering theme icon until mounted
  const ThemeIcon = mounted && effectiveTheme === 'dark' ? Sun : Moon;

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 lg:px-8 transition-colors duration-300">
      {/* Page Title - Desktop only */}
      <div className="hidden lg:block">
        {title && (
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
        )}
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        )}
      </div>

      {/* User Section */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Theme Toggle */}
        {mounted && (
          <div className="relative">
            <button
              onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
              title="Toggle theme"
            >
              <ThemeIcon className="w-5 h-5" />
            </button>

            {/* Theme Dropdown */}
            {isThemeDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsThemeDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-fade-in">
                  <button
                    onClick={() => { setTheme('light'); setIsThemeDropdownOpen(false); }}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${theme === 'light' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    <Sun className="w-4 h-4" />
                    Light
                  </button>
                  <button
                    onClick={() => { setTheme('dark'); setIsThemeDropdownOpen(false); }}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${theme === 'dark' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    <Moon className="w-4 h-4" />
                    Dark
                  </button>
                  <button
                    onClick={() => { setTheme('system'); setIsThemeDropdownOpen(false); }}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${theme === 'system' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    <Monitor className="w-4 h-4" />
                    System
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        {/* Help Menu */}
        <div className="relative" data-walkthrough="help-menu">
          <button
            onClick={() => setIsHelpDropdownOpen(!isHelpDropdownOpen)}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
            title="Help & Support"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* Help Dropdown */}
          {isHelpDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsHelpDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-fade-in">
                <Link
                  to="/walkthrough"
                  onClick={() => setIsHelpDropdownOpen(false)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                  Help Center
                </Link>
                <button
                  onClick={() => {
                    startWalkthrough(defaultWalkthroughSteps);
                    setIsHelpDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Start Tour
                </button>
              </div>
            </>
          )}
        </div>

        {isPending ? (
          <div className="flex items-center gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        ) : user ? (
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name || user.email}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  userInitials
                )}
              </div>

              {/* User Info */}
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.name || user.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>

              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {/* Dropdown */}
            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-fade-in">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 sm:hidden">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name || user.email}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                  <Form method="POST" action="/logout">
                    <button
                      type="submit"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </Form>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-400">
            <User className="w-5 h-5" />
            <span className="text-sm">Guest</span>
          </div>
        )}
      </div>
    </header>
  );
}
