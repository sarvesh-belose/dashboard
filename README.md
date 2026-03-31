# Enterprise Dashboard Framework

A fully configurable, enterprise-grade dashboard built with React 19, Mantine v8, and TypeScript. Supports drag-and-drop widget layout, authenticated API integration, role-based access control, and a global filter system.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [User Manual](#user-manual)
  - [Dashboard Overview](#dashboard-overview)
  - [Edit Mode](#edit-mode)
  - [Adding a Widget](#adding-a-widget)
  - [Widget Types](#widget-types)
  - [API Configuration](#api-configuration)
  - [Response Mapping](#response-mapping)
  - [Global Filters](#global-filters)
  - [Filter Bindings](#filter-bindings)
  - [Role-Based Access Control](#role-based-access-control)
- [Architecture](#architecture)
- [Testing](#testing)
- [Configuration Reference](#configuration-reference)

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 + TypeScript |
| Component Library | Mantine v8 |
| Build Tool | Webpack 5 + Babel |
| State Management | Zustand v5 |
| Server State / Caching | TanStack Query v5 |
| Layout | react-grid-layout v2 |
| Charts | Highcharts 12 |
| Data Grid | @tanstack/react-table v8 + Mantine Table |
| HTTP | Native `fetch` with AbortController |
| Forms | React Hook Form + Zod |
| Unit / Component Tests | Jest 30 + React Testing Library |
| E2E Tests | Playwright |

---

## Prerequisites

- **Node.js** 18 or later
- **npm** 9 or later

---

## Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/sarvesh-belose/dashboard.git
cd dashboard

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on port 3000 with HMR |
| `npm run start` | Alias for `npm run dev` |
| `npm run build` | Production build to `dist/` (minified, chunked) |
| `npm test` | Run Jest unit + component + integration tests with coverage |
| `npm run test:watch` | Run Jest in interactive watch mode |
| `npm run test:e2e` | Run Playwright E2E tests (requires running dev server) |
| `npm run test:e2e:ui` | Open Playwright UI mode for interactive E2E debugging |
| `npm run lint` | Run ESLint across the project |

---

## Project Structure

```
dashboard/
├── src/
│   ├── features/
│   │   ├── dashboard/          # DashboardGrid, DashboardToolbar
│   │   ├── filters/            # FilterBar, DateRangeFilter, SingleSelectFilter, etc.
│   │   ├── rbac/               # RbacGate component
│   │   ├── widget-wizard/      # 9-step widget creation wizard
│   │   └── widgets/
│   │       ├── base/           # WidgetShell, WidgetErrorBoundary
│   │       ├── chart/          # ChartWidget (Highcharts)
│   │       ├── grid/           # GridWidget (TanStack Table)
│   │       ├── text/           # TextWidget (Markdown)
│   │       └── custom/         # CustomWidget (bring-your-own component)
│   ├── hooks/                  # useWidgetData, useRbac, useFilterBindings, useDashboardLayout
│   ├── lib/                    # http.ts (native fetch wrapper)
│   ├── registry/               # WidgetRegistry singleton
│   ├── store/                  # Zustand stores (auth, dashboard, filter, wizard)
│   ├── types/                  # TypeScript type definitions
│   ├── utils/                  # filter-param-builder, rbac.utils, chart-adapter, etc.
│   └── test/                   # Jest setup, mocks, integration tests
├── e2e/                        # Playwright E2E specs
├── babel.config.json
├── jest.config.cjs
├── playwright.config.ts
└── webpack.config.cjs
```

---

## User Manual

### Dashboard Overview

When the app loads you see the main dashboard with a **toolbar** at the top and a **grid canvas** below.

```
┌─────────────────────────────────────────────────────────────────┐
│  My Dashboard   [Unsaved ●]          [Add Widget]  [Save]  [✎] [⚙] │
├─────────────────────────────────────────────────────────────────┤
│  [Date Range ▼]  [Status ▼]  [Search…]              [Clear]     │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│ │  Revenue Chart   │  │  Orders Table    │  │  Welcome Note  │ │
│ │  [line chart]    │  │  [data grid]     │  │  # Hello       │ │
│ │                  │  │                  │  │  …             │ │
│ └──────────────────┘  └──────────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Toolbar elements:**

| Element | Description |
|---|---|
| Dashboard name | The name of the current dashboard |
| `Unsaved` badge | Appears when there are unsaved layout or widget changes |
| `Add Widget` button | Opens the widget creation wizard (edit mode only) |
| `Save` button | Persists the current dashboard to localStorage (edit mode + dirty) |
| Edit toggle (✎ / 👁) | Switches between **edit mode** and **view mode** |
| Settings icon (⚙) | Dashboard-level settings |

---

### Edit Mode

Click the **edit toggle** (pencil icon) in the top-right to enter edit mode.

In edit mode you can:
- **Drag** widgets by their title bar to reposition them
- **Resize** widgets by dragging the handle in the bottom-right corner
- **Add** new widgets via the `Add Widget` button
- **Edit** an existing widget by clicking its pencil icon
- **Delete** a widget by clicking its trash icon

Click the **eye icon** to return to view mode. The layout is auto-saved to `localStorage` with a 1.5-second debounce.

```
Edit mode widget card:
┌─────────────────────────────┐
│ ≡ Widget Title   [✎] [🗑]  │   ← drag handle + edit + delete
├─────────────────────────────┤
│                             │
│      widget content         │
│                             │
│                          ↘  │   ← resize handle (bottom-right)
└─────────────────────────────┘
```

---

### Adding a Widget

Click **Add Widget** to open the 9-step creation wizard.

#### Step 1 — Select Type

Choose one of four widget types:

| Type | Description |
|---|---|
| **Chart** | Line, bar, area, pie, donut chart powered by Highcharts |
| **Grid** | Sortable, paginated data table powered by TanStack Table |
| **Text** | Markdown content with optional `{{filterId}}` interpolation |
| **Custom** | Mount any registered React component by key |

#### Step 2 — Basic Info

Enter the **title** and optional **description** for the widget.

#### Step 3 — API Configuration *(Chart / Grid only)*

Configure the HTTP request that fetches widget data:

| Field | Description |
|---|---|
| URL | Full URL with optional `${env.VAR}` substitution |
| Method | GET / POST / PUT / PATCH |
| Auth Type | None / Bearer Token / API Key / Basic Auth |
| Headers | Custom key-value pairs |
| Body | JSON body (POST/PUT/PATCH) |

**Auth examples:**

```
Bearer Token:  Authorization: Bearer eyJhbGc…
API Key:       X-Api-Key: abc123
Basic Auth:    Authorization: Basic base64(user:pass)
```

Environment variable tokens (resolved at runtime, never stored):
```
URL:    https://api.example.com/data?tenant=${env.TENANT_ID}
Token:  ${env.API_SECRET}
```

#### Step 4 — Live API Test *(Chart / Grid only)*

Click **Test** to fire the configured request. You'll see:
- HTTP status code and latency (ms)
- Prettified JSON response preview
- Any error messages

#### Step 5 — Response Mapping *(Chart / Grid only)*

Map the API JSON response to the widget's data model using **dot notation** or **JSONPath** expressions.

**Chart mapping example:**
```
Series data path:   $.data.series          → [ { name: "Revenue", data: [1,2,3] } ]
Categories path:    $.data.categories      → [ "Jan", "Feb", "Mar" ]
```

**Grid mapping example:**
```
Rows path:          $.data.items           → array of row objects
Total count path:   $.meta.total
Field mappings:
  amount  →  Revenue    (coerce: number)
  active  →  Is Active  (coerce: boolean)
  ts      →  Date       (coerce: date)
```

#### Step 6 — Widget Config

**Chart options:**
- Chart type: `line` | `bar` | `area` | `pie` | `donut`
- Stacking: `none` | `normal` | `percent`
- Show data labels
- Height (px)

**Grid options:**
- Page size (rows per page)
- Sortable columns toggle
- Global search toggle
- Column visibility toggle

#### Step 7 — RBAC Roles

Restrict widget visibility to specific roles. Leave empty to make the widget visible to **all authenticated users**. Users with the `admin` role always bypass role checks.

```
Roles (comma-separated):  finance, analyst
Leave empty for:          visible to all authenticated users
```

#### Step 8 — Filter Bindings

Bind global filters to API parameters so the widget automatically refetches when filter values change.

```
Filter: Date Range  →  query param "from"  (field: from)
                    →  query param "to"    (field: to)

Filter: Status      →  query param "status"
```

Only widgets with matching bindings will refetch when a filter changes. Unbound widgets are unaffected.

#### Step 9 — Preview

A live preview of the widget renders with the current draft configuration. Click **Save** to add it to the dashboard.

---

### Widget Types

#### Chart Widget

```
┌────────────────────────────────┐
│  Monthly Revenue               │
│                                │
│  ▲ 120k │    /\               │
│   100k │   /  \    /\        │
│    80k │  /    \  /  \       │
│    60k │ /      \/    \      │
│        └──────────────────→   │
│         Jan  Feb  Mar  Apr    │
└────────────────────────────────┘
```

Supports: `line`, `bar`, `area`, `pie`, `donut`. Powered by Highcharts 12 with optional stacking and data labels.

#### Grid Widget

```
┌────────────────────────────────────────────┐
│  Orders Table        [Search…]             │
├────────────┬──────────┬──────────┬─────────┤
│ Order ID ↕ │ Customer │ Amount ↕ │ Status  │
├────────────┼──────────┼──────────┼─────────┤
│ #1042      │ Acme Co. │ $1,200   │ Paid    │
│ #1041      │ Globex   │ $850     │ Pending │
│ #1040      │ Initech  │ $3,400   │ Paid    │
├────────────┴──────────┴──────────┴─────────┤
│  ← 1  2  3  →                  30 / page  │
└────────────────────────────────────────────┘
```

Features: column sorting, global search, pagination, column-level type coercion.

#### Text Widget

Renders **Markdown** content. Supports `{{filterId}}` interpolation to show the current filter value inline.

```markdown
## Sales Dashboard

Showing data for period: **{{date}}**

Current filter: *{{status}}*
```

#### Custom Widget

Mount any React component registered in the `WidgetRegistry` by its `componentKey`. Pass arbitrary props via the `componentProps` field.

---

### Global Filters

The **Filter Bar** appears below the toolbar when filters are configured. All filter types support a **Clear** button that resets all values at once.

| Filter Type | UI Control | Value Shape |
|---|---|---|
| `date-range` | Date picker (from / to) | `{ from: string, to: string }` |
| `single-select` | Dropdown | `string` |
| `multi-select` | Multi-select dropdown | `string[]` |
| `text-search` | Debounced text input | `string` |

---

### Filter Bindings

Each widget declares **FilterBindings** that map filter values to API request parameters:

```
FilterBinding {
  filterId: "date"
  paramMappings: [
    { paramTarget: "query", paramName: "from", filterField: "from" },
    { paramTarget: "query", paramName: "to",   filterField: "to"  }
  ]
}
```

`paramTarget` can be `"query"` (appended to URL as `?key=value`) or `"body"` (merged into the request JSON body).

The resolved params are part of the **TanStack Query cache key**, so only widgets whose bindings produce a different key will trigger a network request when a filter changes.

---

### Role-Based Access Control

Widgets declare a `roles` array. The RBAC rules are:

| Condition | Result |
|---|---|
| `roles` is empty `[]` | Visible to **all authenticated users** |
| `roles: ["analyst"]` | Visible only to users with the `analyst` role |
| User has `admin` role | Bypasses all role restrictions |
| User is not authenticated | Widget is hidden regardless of `roles` |

The `RbacGate` component prevents the widget from mounting entirely when access is denied — **no API call is made** for unauthorized widgets.

---

## Architecture

### State Management

Four Zustand stores:

| Store | Purpose |
|---|---|
| `auth.store` | Current user, access token, roles |
| `dashboard.store` | Dashboard config, widget map, layout, edit/dirty state |
| `filter.store` | Active filter definitions and current values |
| `widget-wizard.store` | Wizard open/close, step navigation, draft widget |

### Data Fetching

`useWidgetData(widgetId)` combines TanStack Query with the filter engine:

```
queryKey = ['widget-data', widgetId, resolvedFilterParams]
                                      ↑
                          changes only for bound widgets
```

When a filter value changes, only widgets with matching `FilterBindings` get a new cache key and refetch. All other widgets read from cache.

### Widget Registry

Widgets self-register via a singleton `Map`:

```ts
WidgetRegistry.register({
  type: 'chart',
  label: 'Chart',
  component: ChartWidget,
  wizardSteps: [...],
  defaultConfig: () => ({ ... }),
})
```

---

## Testing

### Run all tests

```bash
npm test
```

### Run in watch mode

```bash
npm run test:watch
```

### Run E2E tests

Start the dev server first, then:

```bash
npm run test:e2e
# or with interactive UI:
npm run test:e2e:ui
```

### Test coverage

Coverage reports are generated to `coverage/` (HTML report at `coverage/index.html`).

| Layer | Files |
|---|---|
| Utilities | `filter-param-builder`, `auth-header-builder`, `rbac.utils`, `response-mapper`, `chart-adapter` |
| Stores | `filter.store`, `dashboard.store`, `widget-wizard.store` |
| Components | `RbacGate`, `FilterBar`, `WidgetShell`, `DashboardToolbar` |
| Integration | Filter engine (selective refetch), Widget creation flow |
| E2E | Dashboard load, widget wizard, filter interaction |

---

## Configuration Reference

### Environment Variables

Set in a `.env` file at the project root (or via your hosting environment):

```env
# Example — referenced in widget API configs as ${env.API_BASE_URL}
API_BASE_URL=https://api.example.com
API_SECRET=your-secret-token
TENANT_ID=acme
```

### localStorage Keys

| Key | Content |
|---|---|
| `dashboard-auth` | Persisted auth state (user, token) |
| `dashboard-data` | Dashboard layout, widget configs, filter definitions |

### Webpack Dev Server

Default port: **3000**. Change in `webpack.config.cjs`:

```js
devServer: {
  port: 3000,          // ← change here
  historyApiFallback: true,
  hot: true,
}
```
