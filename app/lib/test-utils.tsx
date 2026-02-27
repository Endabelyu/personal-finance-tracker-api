import { vi } from 'vitest';
import React, { ReactElement } from 'react';
import { render, RenderOptions, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Custom render function that wraps components with necessary providers.
 * Add Router, Theme, or other providers here as needed.
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const AllProviders = ({ children }: { children: React.ReactNode }) => {
    // Add providers here as needed (Router, Auth, Theme, etc.)
    return <>{children}</>;
  };

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllProviders, ...options }),
  };
}

/**
 * Re-export testing-library utilities
 */
export * from '@testing-library/react';
export { customRender as render, screen };
export { userEvent };

/**
 * Helper to test async operations
 */
export function waitForAsync(ms = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Helper to mock fetch responses
 */
export function mockFetchResponse(data: unknown, status = 200): void {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

/**
 * Helper to mock fetch errors
 */
export function mockFetchError(errorMessage: string): void {
  global.fetch = vi.fn().mockRejectedValue(new Error(errorMessage));
}
