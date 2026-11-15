<h1 align="center">PetCare Hub · Web Application</h1>

<p align="center">
  Web client of <b>PetCare Hub</b> for veterinarians, clinics and pet owners:<br>
  consultations, clinical exams, AI image analysis and dashboards.
</p>



---

## Table of contents
1. [About the project](#about-the-project)
2. [Tech stack](#tech-stack)
3. [Architecture](#architecture)
4. [Getting started](#getting-started)
5. [Available scripts](#available-scripts)
6. [CI/CD](#cicd)
7. [Deployment](#deployment)
8. [Features in 1.0.0](#features-in-100)
9. [Project status](#project-status)
10. [Academic information](#academic-information)
11. [Team](#team)
12. [Contributing](#contributing)
13. [License](#license)

---

## About the project

**PetCare Hub** keeps one clinical record **centered on the pet**, so veterinarians can follow a patient over time and owners can understand their pet's health. This repository contains the web application; it consumes the REST API in [petcarehub-web-services](https://github.com/NexoShift/petcarehub-web-services).

## Tech stack

| Area | Technology |
|------|------------|
| Framework | Angular 22.2 (standalone components, signals) |
| Language | TypeScript 6.0 |
| UI | Angular Material 22 + PetCare Hub design system (Inter, navy `#032B59`, turquoise `#0BC3BD`) |
| Internationalization | ngx-translate 18 (Spanish / English) |
| Unit tests | Vitest 5 + jsdom |
| Formatting | Prettier |

## Architecture

The application follows **Domain-Driven Design**, with one folder per bounded context and the same four layers in each:

| Layer | Responsibility |
|-------|----------------|
| `domain` | Entities and value objects of the context |
| `application` | Signal-based stores that hold the state and use cases |
| `infrastructure` | HTTP repositories and assemblers (DTO ↔ entity) |
| `presentation` | Views, components and routes (lazy loaded) |

Rules: views never call `HttpClient` directly, and a context imports another one only through its public `index.ts`.

```
src/app/
├── iam/                 Sign-in, sign-up, password recovery, guards and interceptors
├── profiles/            Owners, pets, clinic, veterinarians, patients, consulting rooms
├── clinical-attention/  Consultation workspace and owner consultations
├── clinical-exams/      Lab worklist, exam request, exam detail and owner exams
├── ai-assistance/       Computer vision for owners and veterinarians
└── shared/              Shell (menu by role), dashboards, icons and common components
```

## Getting started

### Prerequisites
- **Node.js 24 LTS** (24.15+) or 22.22.3+
- **npm 11** or later
- The [backend](https://github.com/NexoShift/petcarehub-web-services) running at `http://localhost:8080`

### Install and run
```bash
git clone https://github.com/NexoShift/petcarehub-web-application.git
cd petcarehub-web-application
npm install
npm start
```
Open `http://localhost:4200`.

### API URL
The backend URL is set in `apiBaseUrl`:

| File | Used by | URL |
|------|---------|-----|
| `src/environments/environment-dev.ts` | `npm start` (`ng serve`, development) | `http://localhost:8080/api/v1` |
| `src/environments/environment.ts` | `npm run build` (production) | Azure API (see [Deployment](#deployment)) |

`angular.json` replaces `environment.ts` with `environment-dev.ts` in the `development` configuration. To run the app locally against the deployed API, use `npx ng serve --configuration production`.

## Available scripts

| Command | Description |
|---------|-------------|
| `npm start` | Development server with live reload |
| `npm run build` | Production build in `dist/` |
| `npm run watch` | Development build in watch mode |
| `npm test` | Unit tests with Vitest (172 tests in 1.0.0) |

## CI/CD

The project uses **GitHub Actions** for continuous integration (`.github/workflows/ci.yml`):

| Workflow | Trigger | Steps |
|----------|---------|-------|
| `ci.yml` | Pull requests and pushes to `develop` and `main` | Install with `npm ci`, run unit tests and build for production (Node 24) |

Continuous deployment is handled by **Cloudflare Pages** through its GitHub integration: every push to `main` (a finished release or hotfix) is built and published automatically. No deployment token is stored in this repository.

## Deployment

The web application is hosted on **Cloudflare Pages** and consumes the PetCare Hub Platform API deployed on Microsoft Azure.

- **Application URL**: `https://petcarehub-web.pages.dev`
- **API base URL**: `https://petcarehub-api.kindwave-02283cc0.westus2.azurecontainerapps.io/api/v1`

### Build settings
| Setting | Value |
|---------|-------|
| Production branch | `main` |
| Build command | `npm run build` |
| Build output directory | `dist/FrontendWeb/browser` |
| Environment variable | `NODE_VERSION=24` |

### Release workflow
1. Finish a `release/*` or `hotfix/*` branch with Git Flow and push `main`, `develop` and the SemVer tag (e.g., `v1.0.0`).
2. Cloudflare Pages detects the push to `main`, builds the production bundle and publishes it (about 1–2 minutes).
3. Check the deployment in **Cloudflare Dashboard → Workers & Pages → petcarehub-web → Deployments**.

To roll back, open a previous deployment in Cloudflare Pages and choose **Rollback to this deployment**.

### Notes
- Cloudflare Pages serves `index.html` for unknown paths (single-page application mode), so deep links such as `/home` work after a page reload.
- The backend allows this origin in `CORS_ALLOWED_ORIGINS`, and password-reset emails link to `https://petcarehub-web.pages.dev/reset-password`.
- The API scales to zero when idle, so the first request after a while can take a few seconds.

See [docs/adrs.md](docs/adrs.md) for the reasons behind the hosting choice.

## Features in 1.0.0

**Veterinarian and clinic**
- Home dashboard: patients of the day, consultations in progress and pending exams.
- Management of patients, consulting rooms and clinic staff.
- Consultation workspace: anamnesis, vital signs and findings, optional images step with computer vision, diagnosis and exam requests, and completion. Closed consultations are read-only.
- Lab worklist with filters, exam results, validation and file attachments.
- Imaging: skin photos with detection boxes and X-rays with probabilities.

**Pet owner**
- Home dashboard and pets with their pet code.
- Consultations and validated exam results of each pet.
- Orientative visual analysis of skin photos.

**Everyone**
- Spanish and English interface.
- Menu and screens adapted to the user's role.

## Project status

| Sprint | Scope | Status |
|--------|-------|--------|
| Sprint 1 | IAM, Profiles, consultations, exams, computer vision, dashboards | ✅ Released as `v1.0.0` |
| Sprint 2 | Medical history, treatments and prescriptions, plans, LLM assistant | 🕓 Planned |

See [CHANGELOG.md](CHANGELOG.md) for the detailed history.

## Academic information

| | |
|---|---|
| University | Universidad Peruana de Ciencias Aplicadas (UPC) |
| Course | Arquitectura de Software Emergentes (1ASI0728) |
| Section | NRC 9061 |
| Professor | Ernesto Ocampo Tello |
| Academic period | 2026-20 |
| Team | NexoShift |

## Team

| Member | Codigo |
|--------|----------------|
| Torres Apolinario, Giovany Smith | u202311601 |
| Cutiri Agüero, Fabrizio Alexander | U201914181 |
| Lopez Roman, Franco Mauricio | U202315890 |
| Aru Acevedo, Yair Christofer | U202125984 |
| Carranza Tesén, Joaquín Enrique | U20191B935|

## Contributing

Branching model, commit convention and pull request rules are described in [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Distributed under the [MIT License](LICENSE). © 2026 NexoShift.
