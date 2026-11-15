# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Medical history screens for veterinarians and owners.
- Treatments and prescriptions inside the consultation.
- Owner consent before a clinic can see a pet's history from other clinics.
- Plans and subscriptions.
- LLM clinical assistant (consultation step 4) and "Explain with AI" for owners.

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

[Unreleased]: https://github.com/NexoShift/petcarehub-web-application/compare/v1.0.0...develop
[1.0.0]: https://github.com/NexoShift/petcarehub-web-application/releases/tag/v1.0.0
