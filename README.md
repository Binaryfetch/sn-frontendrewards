# Tosh Frontend

Modernized React/Tailwind interface for the product, reward, and invoice network. The UI now follows a restrained white/grey palette with gold accents, supports drag & drop uploads, and surfaces backend validation through toasts.

## Getting started

```bash
cd frontend
npm install
npm start
```

- App runs on http://localhost:3000
- APIs expect the backend (http://localhost:5000) to be online with valid credentials in the same browser session (HTTP-only cookie auth).

## Key screens & code map

| Requirement | Implementation |
|-------------|----------------|
| Premium company shell with sidebar + routing | `src/components/Layout.jsx`, `src/App.js` (React Router) |
| Overview & KPI cards | `src/pages/company/CompanyOverview.jsx` |
| Drag & drop uploads (distributors, dealers, products, invoices) | `src/components/ui/UploadCard.jsx` + `src/pages/company/*.jsx` |
| Distributor & dealer management | `CompanyDistributors.jsx`, `CompanyDealers.jsx`, `components/ui/Pagination.jsx` |
| Horizontal product cards + single form | `CompanyProducts.jsx` |
| Invoice centre (upload, filters, qty/uom) | `CompanyInvoices.jsx`, `components/ui/DataTable.jsx` |
| Wallet portal (company vs all transactions) | `CompanyWallets.jsx` |
| Analytics KPIs + charts | `CompanyAnalytics.jsx` (Recharts) |
| Content hub without bulk upload | `CompanyContent.jsx`, `components/ContentManagement.jsx` (`enableUploads` prop) |
| Formatter helpers | `src/utils/formatters.js` |

## UX guidelines implemented

- White/grey surfaces with gold (#c7a13f) accents.
- Rounded card layout with soft shadows.
- Framer Motion micro-interactions on nav/buttons.
- Drag & drop uploads share one component (`UploadCard`) and surface backend responses (success/failure rows).
- Table lists include search, pagination and consistent spacing.
- All actions guarded with client-side validation; primary buttons disable until payloads are complete.

## Linting & testing

```bash
npm run lint   # if ESLint is configured
npm test       # CRA test runner (optional)
```

Please ensure the backend invoice/distributor upload templates remain in sync with the frontend field labels. Update the reusable `UploadCard` when new upload flows are added so drag & drop + results remain consistent. !*** End Patch
