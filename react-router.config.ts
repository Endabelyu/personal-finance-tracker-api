import type { Config } from '@react-router/dev/config';

export default {
  // Config options...
  appDirectory: 'app',
  buildDirectory: 'build',
  future: {
    // Enable future flags
    unstable_optimizeDeps: true,
  },
} satisfies Config;
