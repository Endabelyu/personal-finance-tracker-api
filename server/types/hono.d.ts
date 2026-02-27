import type { User } from '@db/schema';

declare module 'hono' {
  interface ContextVariableMap {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
    };
  }
}

export {};
