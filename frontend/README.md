# Deploy Board Frontend

React-based frontend for the Deploy Board CI/CD Dashboard.

## Tech Stack

- **React 18.2** - UI library
- **React Router 6.x** - Client-side routing
- **Vite** - Build tool and dev server
- **Tailwind CSS 3.x** - Utility-first CSS framework
- **Axios 1.x** - HTTP client for API requests
- **Recharts 2.x** - Data visualization and charts
- **date-fns 3.x** - Date formatting and manipulation
- **React Toastify 10.x** - Toast notifications

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   └── Layout.jsx    # Main layout wrapper
│   ├── context/          # React Context for state management
│   │   └── AppContext.jsx # Global app state
│   ├── pages/            # Route components
│   │   ├── Dashboard.jsx       # Main dashboard view
│   │   ├── BuildDetails.jsx    # Build details view
│   │   └── NotFound.jsx        # 404 page
│   ├── App.jsx           # Main app component with routing
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles with Tailwind
├── public/               # Static assets
├── index.html            # HTML template
├── vite.config.js        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── package.json          # Dependencies and scripts

```

## Available Scripts

### Development

```bash
npm run dev
```

Starts the development server on `http://localhost:3000`. The app will automatically reload when you make changes.

### Build

```bash
npm run build
```

Builds the app for production to the `build` folder. The build is optimized for best performance.

### Preview

```bash
npm run preview
```

Preview the production build locally.

### Lint

```bash
npm run lint
```

Runs ESLint to check code quality.

## Features Implemented

### Routing Structure

- `/` - Dashboard (main view)
- `/pipeline/:jobName/build/:buildNumber` - Build details view
- `*` - 404 Not Found page

### Global State Management

The app uses React Context API for global state management:

- `pipelines` - Array of pipeline data
- `selectedEnvironment` - Current environment filter (dev/staging/production)
- `loading` - Loading state indicator
- `error` - Error message
- `cache` - Cached data with timestamp

### Environment Persistence

Selected environment is persisted in browser session storage and restored on page reload.

### Styling

Tailwind CSS is configured with custom colors for build statuses:
- `success` - Green (#10b981)
- `failed` - Red (#ef4444)
- `running` - Amber (#f59e0b)
- `aborted` - Gray (#6b7280)

## API Integration

The frontend is configured to proxy API requests to the backend:

```javascript
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5001',
      changeOrigin: true,
    }
  }
}
```

All API calls to `/api/*` will be forwarded to the backend server running on port 5001.

## Next Steps

The basic routing structure and state management are in place. Future tasks will implement:

1. API hooks for Jenkins and SonarQube data
2. Pipeline cards with status display
3. Build details with logs and stages
4. Quality metrics visualization
5. Deployment history charts
6. Rollback functionality

## Development Notes

- The app uses React 18 with Strict Mode enabled
- All components use functional components with hooks
- Toast notifications are configured globally via ToastContainer
- Custom scrollbar styles are included for better UX
