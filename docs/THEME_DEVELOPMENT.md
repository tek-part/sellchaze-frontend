# Sellchaze official theme development

Official theme authors get an isolated preview URL backed by Vite hot-module reload:

```sh
npm run theme:dev -- --theme=luxury-fashion
```

The accepted theme keys are discovered from `src/apps/storefront/themes`; an unknown key fails before starting the server. Use `npm run pack:themes` to validate and package the server-distributed bundles, then run `npm run test:visual`, `npm run test:a11y`, and `npm run test:perf` before submitting a lifecycle revision for review.

Merchant customization remains in Theme Studio. It exposes schema-approved settings and scoped CSS, never arbitrary JavaScript.
