# Architectural Decision Records (ADRs)

This document records the principal architectural decisions made for the PetCare Hub web application.

---

## ADR 001: Domain-Driven Design with One Folder per Bounded Context

### Status
Accepted

### Context
The application covers several business capabilities (identity, profiles, consultations, exams and AI assistance) that evolve at different speeds and are developed by different team members. The backend is a modular monolith organized by the same bounded contexts.

### Decision
Organize `src/app` by bounded context (`iam`, `profiles`, `clinical-attention`, `clinical-exams`, `medical-history`, `ai-assistance`, `subscriptions`) plus `shared`, each with four layers:
- `domain`: entities and value objects.
- `application`: signal-based stores and use cases.
- `infrastructure`: HTTP repositories and assemblers (DTO ↔ entity).
- `presentation`: views, components and lazy-loaded routes.

A context imports another one only through its public `index.ts`, and views never call `HttpClient` directly.

### Consequences
- **Positive**: The frontend mirrors the backend contexts, ownership per member is clear, and each context can be tested in isolation.
- **Negative**: More files per feature (assemblers, stores) than a component-only structure.

---

## ADR 002: Signal-Based Stores for Application State

### Status
Accepted

### Context
Screens need shared, reactive state (current user, pets, consultations in progress) with predictable updates and without the boilerplate of an external state library.

### Decision
Use domain-scoped stores built with Angular Signals (`signal`, `computed`, `inject()`). Mutable state stays private; components read public read-only signals and call store methods.

### Consequences
- **Positive**: Native to Angular 22, works with `OnPush` change detection, no extra dependencies.
- **Negative**: The team must follow conventions for immutable updates inside store methods.

---

## ADR 003: Angular Material and ngx-translate

### Status
Accepted

### Context
The application needs a consistent, accessible UI in Spanish and English, adapted to the PetCare Hub design system (Inter, navy `#032B59`, turquoise `#0BC3BD`).

### Decision
Use **Angular Material 22** (Material 3 tokens customized with the brand colors) for the shell and components, and **ngx-translate** with JSON dictionaries in `public/i18n/` for runtime language switching.

### Consequences
- **Positive**: Accessible components out of the box, one design system, language switch without reloading. A unit test checks that `es.json` and `en.json` have the same keys.
- **Negative**: Material styles must be overridden to match the Figma designs, and translation keys must be kept in sync manually.

---

## ADR 004: Cloudflare Pages for Frontend Hosting

### Status
Accepted

### Context
The web application is a static single-page application that must be reachable over HTTPS from any device, support deep links such as `/home`, and be published automatically after each release without storing deployment credentials in the repository. The team works with a student budget, and the API already runs on Azure Container Apps.

### Decision
Host the production build on **Cloudflare Pages** using its GitHub integration:
- `main` is the production branch; every merge from a `release/*` or `hotfix/*` branch triggers a deployment.
- Cloudflare builds with `npm run build` on Node 24 and publishes `dist/FrontendWeb/browser`.
- GitHub Actions keeps the continuous integration responsibility (tests and build on pull requests).

### Consequences
- **Positive**: Free tier with global CDN and automatic HTTPS; native SPA fallback with no extra configuration; no deployment token in GitHub; one-click rollback to any previous deployment.
- **Negative**: Frontend (Cloudflare) and backend (Azure) are on different providers and domains, so CORS must be configured on the API; build settings live in the Cloudflare dashboard instead of the repository.

---

## ADR 005: Owner Consent for History Access Only in the Mobile App

### Status
Accepted

### Context
API 2.0.0 lets the owner grant a clinic temporary access (1 to 72 hours) to the pet's history from other clinics, and revoke it. The owner is usually at the clinic with the phone when the veterinarian asks for it.

### Decision
Owners grant and revoke access only in the mobile app. The web application only reads the grants: the veterinarian sees in the medical history whether access is active and until when, or a message to ask the owner.

### Consequences
- **Positive**: One place to manage consent, simpler owner web screens, and the decision happens where the owner is.
- **Negative**: An owner without the mobile app cannot grant access from the web.
