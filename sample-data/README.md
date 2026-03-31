# Sample Datasets

This folder contains mock JSON datasets that are automatically served as REST API endpoints
when the development server is running (`npm run dev`).

No extra setup or external tools are needed — the webpack dev server mounts them directly.

---

## Available Endpoints

| Endpoint | File | Description |
|---|---|---|
| `GET /api/sales/monthly` | `sales-monthly.json` | Monthly Revenue / Expenses / Profit (line or bar chart) |
| `GET /api/sales/by-region` | `sales-by-region.json` | Sales split by region (pie chart) |
| `GET /api/sales/by-product` | `sales-by-product.json` | Revenue split by product tier (donut chart) |
| `GET /api/sales/weekly` | `sales-weekly.json` | This week vs last week daily sales (bar chart) |
| `GET /api/orders` | `orders.json` | Orders table with status, region, amount (grid) |
| `GET /api/employees` | `employees.json` | Employee directory with salary (grid + RBAC demo) |
| `GET /api/kpis` | `kpis.json` | KPI summary metrics (text widget) |
| `GET /api/pipeline` | `pipeline.json` | Sales pipeline funnel by stage (bar chart) |
| `GET /api/support-tickets` | `support-tickets.json` | Support ticket list (grid) |

Base URL: **`http://localhost:3000`**

---

## Widget Configuration Examples

Use these exact settings when walking through the widget creation wizard.

---

### 1. Monthly Revenue — Line Chart

**Step 1 — Type:** `Chart`

**Step 2 — Basic Info**
- Title: `Monthly Revenue 2024`
- Description: `Revenue, expenses and profit by month`

**Step 3 — API Config**
- URL: `http://localhost:3000/api/sales/monthly`
- Method: `GET`
- Auth: `None`

**Step 5 — Response Mapping**
- Series data path: `$.data.series`
- Categories path: `$.data.categories`

**Step 6 — Widget Config**
- Chart type: `line`
- Stacking: `none`
- Show data labels: off
- Height: `320`

---

### 2. Sales by Region — Pie Chart

**Step 1 — Type:** `Chart`

**Step 2 — Basic Info**
- Title: `Sales by Region`

**Step 3 — API Config**
- URL: `http://localhost:3000/api/sales/by-region`
- Method: `GET`
- Auth: `None`

**Step 5 — Response Mapping**
- Series data path: `$.data.series`
- Categories path: *(leave empty — pie uses name/y pairs)*

**Step 6 — Widget Config**
- Chart type: `pie`
- Show data labels: on

---

### 3. Revenue by Product — Donut Chart

**Step 1 — Type:** `Chart`

**Step 2 — Basic Info**
- Title: `Revenue by Product Tier`

**Step 3 — API Config**
- URL: `http://localhost:3000/api/sales/by-product`
- Method: `GET`
- Auth: `None`

**Step 5 — Response Mapping**
- Series data path: `$.data.series`

**Step 6 — Widget Config**
- Chart type: `donut`
- Show data labels: on

---

### 4. Weekly Sales — Bar Chart

**Step 1 — Type:** `Chart`

**Step 2 — Basic Info**
- Title: `Weekly Sales Comparison`

**Step 3 — API Config**
- URL: `http://localhost:3000/api/sales/weekly`
- Method: `GET`
- Auth: `None`

**Step 5 — Response Mapping**
- Series data path: `$.data.series`
- Categories path: `$.data.categories`

**Step 6 — Widget Config**
- Chart type: `bar`
- Stacking: `none`

---

### 5. Sales Pipeline — Bar Chart (Stacked)

**Step 1 — Type:** `Chart`

**Step 2 — Basic Info**
- Title: `Sales Pipeline by Stage`

**Step 3 — API Config**
- URL: `http://localhost:3000/api/pipeline`
- Method: `GET`
- Auth: `None`

**Step 5 — Response Mapping**
- Series data path: `$.data.series`
- Categories path: `$.data.categories`

**Step 6 — Widget Config**
- Chart type: `bar`
- Stacking: `normal`
- Show data labels: on

---

### 6. Orders Table — Grid Widget

**Step 1 — Type:** `Grid`

**Step 2 — Basic Info**
- Title: `Orders`

**Step 3 — API Config**
- URL: `http://localhost:3000/api/orders`
- Method: `GET`
- Auth: `None`

**Step 5 — Response Mapping**
- Rows path: `$.data.items`
- Total count path: `$.data.total`
- Field mappings:

| Source Field | Display Label | Coerce |
|---|---|---|
| `id` | Order ID | — |
| `customer` | Customer | — |
| `product` | Product | — |
| `amount` | Amount ($) | `number` |
| `status` | Status | — |
| `region` | Region | — |
| `date` | Date | `date` |
| `sales_rep` | Sales Rep | — |

**Step 6 — Widget Config**
- Page size: `10`
- Sortable: on
- Search: on

---

### 7. Employee Directory — Grid + RBAC

**Step 1 — Type:** `Grid`

**Step 2 — Basic Info**
- Title: `Employee Directory`
- Description: `Restricted to HR and Finance roles`

**Step 3 — API Config**
- URL: `http://localhost:3000/api/employees`
- Method: `GET`
- Auth: `None`

**Step 5 — Response Mapping**
- Rows path: `$.data.items`
- Total count path: `$.data.total`
- Field mappings:

| Source Field | Display Label | Coerce |
|---|---|---|
| `id` | ID | — |
| `name` | Name | — |
| `department` | Department | — |
| `role` | Role | — |
| `salary` | Salary ($) | `number` |
| `active` | Active | `boolean` |
| `start_date` | Start Date | `date` |
| `region` | Region | — |

**Step 6 — Widget Config**
- Page size: `10`

**Step 7 — RBAC Roles**
- Roles: `admin, finance, hr`
*(Only users with these roles will see this widget)*

---

### 8. Support Tickets — Grid Widget

**Step 1 — Type:** `Grid`

**Step 2 — Basic Info**
- Title: `Support Tickets`

**Step 3 — API Config**
- URL: `http://localhost:3000/api/support-tickets`
- Method: `GET`
- Auth: `None`

**Step 5 — Response Mapping**
- Rows path: `$.data.items`
- Total count path: `$.data.total`
- Field mappings:

| Source Field | Display Label | Coerce |
|---|---|---|
| `id` | Ticket ID | — |
| `subject` | Subject | — |
| `customer` | Customer | — |
| `priority` | Priority | — |
| `status` | Status | — |
| `category` | Category | — |
| `assignee` | Assignee | — |
| `sla_breach` | SLA Breach | `boolean` |

---

### 9. KPI Summary — Text Widget

**Step 1 — Type:** `Text`

**Step 2 — Basic Info**
- Title: `KPI Summary`

**Step 6 — Widget Config (content)**

```markdown
## Business KPIs

**Revenue YTD:** $2,233,000 ↑ 12.4%
**Total Orders:** 1,482 ↑ 12.7%
**Active Customers:** 348

---

### Customer Health
- New this month: **42**
- Churned: **7** (2.0% churn rate)
- Avg order value: **$1,506**

### Support
- Open tickets: **23**
- Avg resolution: **4.2 hrs**
```

---

### 10. Filter Binding Demo — Orders with Date + Status Filter

This example shows how filters drive widget refetch.

**Add two global filters first** (via Dashboard Settings):

| Filter ID | Label | Type | Options |
|---|---|---|---|
| `date` | Date Range | `date-range` | — |
| `status` | Order Status | `single-select` | paid, pending, overdue, cancelled |

**Then configure an Orders widget with Step 8 — Filter Bindings:**

| Filter | Param Target | Param Name | Filter Field |
|---|---|---|---|
| `date` | `query` | `from` | `from` |
| `date` | `query` | `to` | `to` |
| `status` | `query` | `status` | — |

When you change the Status filter, only this widget refetches.
The mock server ignores query params and always returns the full dataset,
but the network request will include `?from=...&to=...&status=...` —
visible in the browser DevTools Network tab.

---

## Data Shapes Reference

### Chart response shape
```json
{
  "data": {
    "series": [
      { "name": "Series Name", "data": [1, 2, 3] }
    ],
    "categories": ["Jan", "Feb", "Mar"]
  }
}
```

For pie/donut charts the `data` array uses `{ "name": "...", "y": 42 }` objects instead of numbers.

### Grid response shape
```json
{
  "data": {
    "items": [ { "field": "value" } ],
    "total": 100
  }
}
```
