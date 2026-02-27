import { type MetaFunction } from 'react-router';
import { useWalkthrough, type WalkthroughStep } from '@app/context/WalkthroughContext';
import { Button } from '@app/components/ui/Button';
import { Card } from '@app/components/ui/Card';
import { WalkthroughCompletionBadge } from '@app/components/ui/Walkthrough';
import {
  defaultWalkthroughSteps,
  quickTourSteps,
  transactionsWalkthroughSteps,
  budgetWalkthroughSteps,
  reportsWalkthroughSteps,
} from '@app/lib/walkthrough-steps';
import {
  Sparkles,
  Zap,
  Receipt,
  PiggyBank,
  BarChart3,
  RotateCcw,
  Check,
  Play,
  HelpCircle,
} from 'lucide-react';

export const meta: MetaFunction = () => {
  return [
    { title: 'Walkthrough | Finance Tracker' },
    { name: 'description', content: 'Interactive tour and help guide' },
  ];
};

interface TourCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  steps: WalkthroughStep[];
  onStart: (steps: WalkthroughStep[]) => void;
  isDefault?: boolean;
}

function TourCard({ title, description, icon, steps, onStart, isDefault }: TourCardProps) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        <div className={`
          w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
          ${isDefault ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
        `}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {isDefault && (
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                Recommended
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-4">{description}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {steps.length} steps
            </span>
            <Button
              variant={isDefault ? 'primary' : 'outline'}
              size="sm"
              onClick={() => onStart(steps)}
            >
              <Play className="w-4 h-4 mr-1.5" />
              Start Tour
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function WalkthroughPage() {
  const { startWalkthrough, resetWalkthrough, isCompleted, isSkipped } = useWalkthrough();

  const handleStartTour = (steps: WalkthroughStep[]) => {
    startWalkthrough(steps);
    // Navigate to the first step's route if specified
    if (steps[0]?.route && window.location.pathname !== steps[0].route) {
      window.history.pushState({}, '', steps[0].route);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleResetProgress = () => {
    if (confirm('Are you sure? This will reset your walkthrough progress and you\'ll see the tour again on your next visit.')) {
      resetWalkthrough();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 mb-4">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Help & Walkthrough</h1>
        <p className="text-gray-600 max-w-lg mx-auto">
          New to Finance Tracker? Take a guided tour to learn about all the features
          and get the most out of your financial tracking experience.
        </p>
        <div className="flex items-center justify-center gap-4">
          <WalkthroughCompletionBadge />
        </div>
      </div>

      {/* Available Tours */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Available Tours</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <TourCard
            title="Complete Tour"
            description="A comprehensive walkthrough of all features, perfect for first-time users."
            icon={<Sparkles className="w-6 h-6" />}
            steps={defaultWalkthroughSteps}
            onStart={handleStartTour}
            isDefault
          />
          <TourCard
            title="Quick Tour"
            description="A brief overview of the main features for returning users."
            icon={<Zap className="w-6 h-6" />}
            steps={quickTourSteps}
            onStart={handleStartTour}
          />
          <TourCard
            title="Transactions Guide"
            description="Learn how to add, edit, and manage your transactions effectively."
            icon={<Receipt className="w-6 h-6" />}
            steps={transactionsWalkthroughSteps}
            onStart={handleStartTour}
          />
          <TourCard
            title="Budget Setup"
            description="Learn how to set up and manage your monthly budgets."
            icon={<PiggyBank className="w-6 h-6" />}
            steps={budgetWalkthroughSteps}
            onStart={handleStartTour}
          />
          <TourCard
            title="Reports Guide"
            description="Discover how to analyze your financial data with reports."
            icon={<BarChart3 className="w-6 h-6" />}
            steps={reportsWalkthroughSteps}
            onStart={handleStartTour}
          />
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Keyboard Shortcuts</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">New Transaction</span>
            <kbd className="px-2 py-1 text-sm font-mono bg-white border border-gray-200 rounded">
              Ctrl/Cmd + N
            </kbd>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Focus Search</span>
            <kbd className="px-2 py-1 text-sm font-mono bg-white border border-gray-200 rounded">
              Ctrl/Cmd + K
            </kbd>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Close Modal / Clear Filter</span>
            <kbd className="px-2 py-1 text-sm font-mono bg-white border border-gray-200 rounded">
              Escape
            </kbd>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Navigate Walkthrough</span>
            <div className="flex gap-1">
              <kbd className="px-2 py-1 text-sm font-mono bg-white border border-gray-200 rounded">←</kbd>
              <kbd className="px-2 py-1 text-sm font-mono bg-white border border-gray-200 rounded">→</kbd>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Progress */}
      {(isCompleted || isSkipped) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <RotateCcw className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-900 mb-1">
                Reset Walkthrough Progress
              </h3>
              <p className="text-amber-700 text-sm mb-4">
                Want to see the tour again? Reset your progress to restart the walkthrough
                on your next visit.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetProgress}
                className="border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Reset Progress
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="text-center p-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-green-100 flex items-center justify-center">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Track Daily</h3>
          <p className="text-sm text-gray-500">
            Make it a habit to log transactions daily for accurate tracking.
          </p>
        </div>
        <div className="text-center p-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-purple-100 flex items-center justify-center">
            <PiggyBank className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Set Budgets</h3>
          <p className="text-sm text-gray-500">
            Create realistic budgets to help control your spending.
          </p>
        </div>
        <div className="text-center p-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-100 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Review Weekly</h3>
          <p className="text-sm text-gray-500">
            Check your reports weekly to stay on top of your finances.
          </p>
        </div>
      </div>
    </div>
  );
}
