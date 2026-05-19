# QA Dashboard

A modern, responsive QA Dashboard built with Next.js, TypeScript, and TailwindCSS for tracking test execution and quality metrics.

## 🚀 Features

- **Dashboard Overview**: Comprehensive view of test execution metrics
- **Summary Cards**: Display total test cases, passed/failed/blocked counts, and pass rate
- **Interactive Charts**: Visual representation of weekly test execution trends using Recharts
- **Execution Table**: Detailed table of recent test executions with status badges
- **Dark Mode**: Full dark mode support with theme toggle
- **Responsive Design**: Mobile-friendly UI that works on all screen sizes
- **Modern UI**: Built with shadcn/ui components for a polished look

## 🛠️ Tech Stack

- **Framework**: Next.js 16.2 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS v4
- **UI Components**: shadcn/ui (Radix UI)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Theme**: next-themes

## 📁 Project Structure

```
qa-dashboard/
├── app/
│   ├── dashboard/
│   │   ├── layout.tsx       # Dashboard layout with sidebar
│   │   └── page.tsx         # Main dashboard page
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout with theme provider
│   └── page.tsx             # Home page (redirects to dashboard)
├── components/
│   ├── dashboard/
│   │   ├── execution-table.tsx      # Test execution table
│   │   ├── sidebar.tsx              # Navigation sidebar
│   │   ├── stats-card.tsx           # Statistics card component
│   │   └── test-execution-chart.tsx # Chart component
│   ├── ui/                  # shadcn/ui components
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── table.tsx
│   ├── theme-provider.tsx   # Theme provider wrapper
│   └── theme-toggle.tsx     # Dark mode toggle button
├── lib/
│   ├── api.ts              # API service layer (mock data)
│   ├── mock-data.ts        # Mock test data
│   ├── types.ts            # TypeScript type definitions
│   └── utils.ts            # Utility functions
└── public/                 # Static assets
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

The app will automatically redirect to `/dashboard`.

## 📊 Dashboard Components

### Summary Cards

Display key metrics:
- Total Test Cases
- Passed Tests (with percentage and trend)
- Failed Tests (with percentage and trend)
- Blocked Tests (with percentage)
- Overall Pass Rate (with trend)

### Test Execution Chart

A bar chart showing weekly test execution trends with:
- Passed tests (green)
- Failed tests (red)
- Blocked tests (amber)

### Execution Table

A detailed table showing recent test executions with:
- Test Case ID
- Test Name
- Status (with color-coded badges)
- Execution Date
- Duration
- Assignee

## 🎨 Theming

The dashboard supports both light and dark modes. Toggle between themes using the moon/sun icon in the sidebar header.

## 🔄 API Integration

Currently using mock data from `lib/mock-data.ts`. To integrate with AIO Test Management API:

1. Update `lib/api.ts` with real API endpoints
2. Add environment variables for API keys
3. Replace mock data calls with actual API requests

Example:

```typescript
// lib/api.ts
export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stats`, {
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`
      }
    });
    return response.json();
  },
  // ... other methods
};
```

## 📦 Build for Production

```bash
npm run build
npm start
```

## 🎯 Next Steps

- [ ] Connect to real AIO Test Management API
- [ ] Add authentication and user management
- [ ] Implement test case details page
- [ ] Add filtering and search functionality
- [ ] Create reports page
- [ ] Add export functionality (PDF, CSV)
- [ ] Implement real-time updates with WebSockets
- [ ] Add test case creation and editing

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 📄 License

MIT

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
