# Changelog

All notable changes to the Personal Finance Tracker project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of Personal Finance Tracker
- **Dashboard**: Overview of financial health with charts and recent transactions
- **Transactions**: Full CRUD operations with filtering, search, and pagination
- **Budgets**: Monthly spending limits by category with visual progress tracking
- **Reports**: Income vs expenses trends and category breakdowns with charts
- **Authentication**: Secure email-based authentication using Better Auth
- **Dark Mode**: Full dark mode support with theme toggle
- **CSV Export**: Export transactions to CSV or JSON format
- **Date Range Picker**: Custom date range selection for reports
- **Keyboard Shortcuts**: Quick actions with keyboard shortcuts (Cmd/Ctrl+K, Cmd/Ctrl+N)
- **Responsive Design**: Mobile-first responsive UI
- **Loading States**: Skeleton loaders for better UX

### Tech Stack
- React Router v7 with SSR
- TypeScript throughout
- Hono API framework
- Drizzle ORM with PostgreSQL
- Tailwind CSS for styling
- Recharts for data visualization
- Better Auth for authentication
- Vitest for testing

## [1.0.0] - 2025-02-27

### Added
- Initial stable release
- Complete user authentication (sign up, sign in, sign out)
- Transaction management with categories
- Budget tracking with alerts
- Financial reports with charts
- Category management with default categories
- Responsive dashboard layout
- Error boundaries and error handling
- Toast notifications
- Modal dialogs for forms
- Confirmation dialogs for destructive actions

### Security
- Secure session management
- CSRF protection
- Password hashing with bcrypt
- Protected API routes

## Future Roadmap

### Planned
- [ ] Recurring transactions
- [ ] Multi-currency support
- [ ] Bank account integration
- [ ] Receipt upload and OCR
- [ ] Budget alerts via email
- [ ] Financial goals tracking
- [ ] Investment portfolio tracking
- [ ] Mobile app (React Native)
- [ ] Data import from other finance apps
- [ ] Advanced filtering and search
- [ ] Custom report builder
- [ ] Data backup and restore
- [ ] Two-factor authentication
- [ ] Account sharing (family mode)

### Under Consideration
- [ ] AI-powered spending insights
- [ ] Automatic categorization with ML
- [ ] Bill reminders and due dates
- [ ] Credit score tracking
- [ ] Net worth tracking
- [ ] Tax reporting features
