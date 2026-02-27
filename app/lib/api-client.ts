// Hono RPC client for type-safe API calls
// This will be properly configured once the Hono app is set up

interface ApiClient {
  transactions: {
    $get: (options?: { query?: Record<string, string> }, init?: RequestInit) => Promise<Response>;
    $post: (data: unknown, init?: RequestInit) => Promise<Response>;
  } & {
    [id: string]: {
      $put: (params: { json: unknown }, init?: RequestInit) => Promise<Response>;
      $delete: (init?: RequestInit) => Promise<Response>;
    };
  };
  categories: {
    $get: (_?: unknown, init?: RequestInit) => Promise<Response>;
  };
  budgets: {
    $get: (options?: { query?: Record<string, string> }, init?: RequestInit) => Promise<Response>;
    $post: (data: unknown, init?: RequestInit) => Promise<Response>;
  } & {
    [id: string]: {
      $put: (params: { json: unknown }, init?: RequestInit) => Promise<Response>;
      $delete: (init?: RequestInit) => Promise<Response>;
    };
  };
}

// Placeholder implementation - actual implementation will use hono/client
export const api: ApiClient = {
  transactions: new Proxy({
    $get: async (options?: { query?: Record<string, string> }, init?: RequestInit) => {
      const query = options?.query ? new URLSearchParams(options.query).toString() : '';
      const url = `/api/transactions${query ? `?${query}` : ''}`;
      return fetch(url, { ...init, method: 'GET' });
    },
    $post: async (data: unknown, init?: RequestInit) => {
      return fetch('/api/transactions', {
        ...init,
        method: 'POST',
        headers: { ...init?.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
  } as any, {
    get(target, prop: string) {
      if (prop === '$get' || prop === '$post') {
        return target[prop];
      }
      // Return object with $put and $delete for transaction IDs
      return {
        $put: async (params: { json: unknown }, init?: RequestInit) => {
          return fetch(`/api/transactions/${prop}`, {
            ...init,
            method: 'PUT',
            headers: { ...init?.headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(params.json),
          });
        },
        $delete: async (init?: RequestInit) => {
          return fetch(`/api/transactions/${prop}`, {
            ...init,
            method: 'DELETE',
          });
        },
      };
    },
  }),
  categories: {
    $get: async (_, init) => {
      return fetch('/api/categories', { ...init, method: 'GET' });
    },
  },
  budgets: new Proxy({
    $get: async (options: { query?: Record<string, string> } | undefined, init?: RequestInit) => {
      const query = options?.query ? new URLSearchParams(options.query).toString() : '';
      const url = `/api/budgets${query ? `?${query}` : ''}`;
      return fetch(url, { ...init, method: 'GET' });
    },
    $post: async (data: unknown, init?: RequestInit) => {
      return fetch('/api/budgets', {
        ...init,
        method: 'POST',
        headers: { ...init?.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
  } as any, {
    get(target, prop: string) {
      if (prop === '$get' || prop === '$post') {
        return target[prop];
      }
      return {
        $put: async (params: { json: unknown }, init?: RequestInit) => {
          return fetch(`/api/budgets/${prop}`, {
            ...init,
            method: 'PUT',
            headers: { ...init?.headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(params.json),
          });
        },
        $delete: async (init?: RequestInit) => {
          return fetch(`/api/budgets/${prop}`, {
            ...init,
            method: 'DELETE',
          });
        },
      };
    },
  }),
};

// Type definitions for API responses
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
