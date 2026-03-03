import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  // Auth routes (outside app layout)
  route("auth/login", "routes/auth.login.tsx"),
  route("auth/register", "routes/auth.register.tsx"),
  route("auth/logout", "routes/auth.logout.tsx"),
  route("auth/forgot-password", "routes/auth.forgot-password.tsx"),

  // App routes (with layout)
  layout("routes/_app.tsx", [
    index("routes/_app.dashboard.tsx"),
    route("transactions", "routes/_app.transactions.tsx"),
    route("budget", "routes/_app.budget.tsx"),
    route("reports", "routes/_app.reports.tsx"),
    route("profile", "routes/_app.profile.tsx"),
    route("settings", "routes/_app.settings.tsx"),
  ]),
  route("walkthrough", "routes/walkthrough.tsx"),

  // Catch-all API path for Hono internal dev routing
  route("api/*", "routes/api.$.tsx"),

  // Catch-all 404
  route("*", "routes/$.tsx"),
] satisfies RouteConfig;
