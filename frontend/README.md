# FlowStudio frontend

The React/Vite client for [FlowStudio](../README.md).

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm test          # Vitest + Testing Library
npm run test:e2e  # Playwright + Chrome
npm run build     # production bundle
npm audit         # dependency audit
```

The client defaults to `http://localhost:8000` for API calls. Override it with
`VITE_API_URL` when deploying against another service.
