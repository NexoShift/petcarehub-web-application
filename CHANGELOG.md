# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.1] - 2026-11-26

### Fixed
- **IAM**: Sign in and sign up with Google now appear in production (web Client ID set).

## [2.0.0] - 2026-11-26

Final release.

### Added
- **Subscriptions**
  - Plan notice: when the API answers that a plan is required, that the plan does not include a registration, that the plan limit was reached or that the AI credits ran out, a notice offers to open the plans page.
- **Medical History**
  - Veterinarians see whether the owner granted temporary access to the history from other clinics. Owners grant and revoke it from the mobile app.
- **IAM**
  - Sign in and sign up with Google (shown only when `googleClientId` is set).

### Changed
- **BREAKING**: registering a clinic patient sends the pet code (`petCode`) that the owner shares. Requires API 2.0.0 or later.
- **BREAKING**: this version works only with API 2.0.x (Stripe, Google, OpenAI and Roboflow are required in the backend).

## [1.4.0] - 2026-11-26

Clinical assistant with LLM.

### Added
- **AI Assistance**
  - Veterinarian clinical assistant (`/ai-assistant`): SOAP draft with up to 10 clinical backgrounds, regenerate, accept or reject, and PDF report.
  - Step 4 of the consultation workspace opens the assistant.
  - Owner "Explain with AI" chat (`/ai-explain`) about the pet's consultations.
  - Imaging results can be used as background in the clinical assistant.
- **Dashboards**
  - Veterinarian home: AI assistant card that opens the ongoing consultation.
  - AI entries in the menu and in the owner quick actions.

## [1.3.0] - 2026-11-26

Medical history.

### Added
- **Medical History** (new bounded context `medical-history`)
  - Allergies, vaccinations and clinical timeline of each pet, for owners and veterinarians.
  - Owners report allergies; veterinarians record vaccinations with the next dose date.
- **Dashboards**
  - Owner home priority alert: overdue vaccine first, then severe allergy, linking to the pet's history.
  - Medical history in the menu and in the owner quick actions.

## [1.2.0] - 2026-11-26

Treatments and prescriptions.

### Added
- **Clinical Attention**
  - Treatment and prescription step in the consultation workspace (up to 15 medications per prescription).
  - Owner treatments page (`/treatments`) with current and finished treatments per pet.
  - Owner consultation detail shows the treatments and the prescription.
- **Dashboards**
  - Owner home: active treatment card with the prescription medications and day progress.
  - Owner home: contact card of the clinic of the last consultation (phone and address).

### Removed
- Simulated dose tracking and the 24-hour emergency card on the owner home.

## [1.1.0] - 2026-11-26

Subscriptions and payments with Stripe.

### Added
- **Subscriptions**
  - After Stripe Checkout, the plan page waits until Stripe confirms the payment and shows the active plan without reloading (up to 60 seconds).
  - New accounts land on the plan page after completing their profile, with a welcome notice.
- **Dashboards**
  - Owner home shows the AI credits of the current period (explanations and visual analyses) with the renewal date.
- **AI Assistance**
  - Radiograph results as a percentage table per finding (multi-label model), with a "no relevant findings" notice and low-reliability marks.
  - Visual analysis shows the remaining vision credits.
- **Shell**
  - Not-found page for unknown addresses.
  - Connection status and app version at the bottom of the menu.

### Changed
- `/subscription` (the Stripe return URL of the API) redirects to `/plan`.

### Removed
- Placeholders without a backend: header search, notification bell, disabled Google and Apple buttons, notification preferences, "coming soon" cards and menu links to screens that did not exist yet.

## [1.0.0] - 2026-11-15

First stable release, delivered at the end of **Sprint 1**.

### Added
- **IAM**
  - Sign-in and two-step sign-up (pet owner or clinic).
  - Password recovery and reset.
  - Forced password change for veterinarians created with a temporary password.
  - Route guards by role and JWT interceptor.
- **Shell**
  - Angular Material layout with a side menu adapted to each role.
  - Spanish / English switch with ngx-translate.
- **Dashboards**
  - Veterinarian and owner home pages with real consultation and exam data.
- **Profiles**
  - Owner profile and pets with photo and pet code.
  - Clinic profile, veterinarians, patients, consulting rooms and assignments.
- **Clinical Attention**
  - Consultation list and creation.
  - Workspace by phases: anamnesis, assessment and findings, images, diagnosis and exams, and completion.
  - Read-only view of closed consultations.
  - Owner consultations list and detail.
- **Clinical Exams**
  - Lab worklist with filters.
  - Exam request from the consultation.
  - Exam detail with result, validation and file upload and download.
  - Owner exams view with validated results only.
- **AI Assistance**
  - Imaging for veterinarians (skin photos and X-rays).
  - Orientative visual analysis for owners.
  - Optional images step inside the consultation.
- **Quality**
  - 172 unit tests with Vitest, including i18n parity checks (es/en).
- **CI/CD**
  - GitHub Actions: tests and production build on every pull request and push to `develop` and `main`.
  - Production deployment on Cloudflare Pages from `main`, consuming the API on Azure Container Apps.
  - Separate environments: `environment-dev.ts` for `ng serve` and `environment.ts` for production builds.
- **Documentation**
  - README with architecture, deployment and release workflow, and ADRs in `docs/adrs.md`.

### Changed
- Upgraded to Angular 22.2.5, Angular Material and CDK 22.2.7, Vitest 5 and jsdom 31.

[Unreleased]: https://github.com/NexoShift/petcarehub-web-application/compare/v2.0.0...develop
[2.0.0]: https://github.com/NexoShift/petcarehub-web-application/compare/v1.4.0...v2.0.0
[1.4.0]: https://github.com/NexoShift/petcarehub-web-application/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/NexoShift/petcarehub-web-application/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/NexoShift/petcarehub-web-application/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/NexoShift/petcarehub-web-application/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/NexoShift/petcarehub-web-application/releases/tag/v1.0.0
