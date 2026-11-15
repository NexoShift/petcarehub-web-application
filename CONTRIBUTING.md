# Contributing to PetCare Hub

Thank you for contributing to **PetCare Hub** (`petcarehub-web-application`). This guide explains how the NexoShift team works so that the history stays clean and every release is predictable.

> PetCare Hub is an academic project of the course *Arquitectura de Software Emergentes* (UPC). Contributions are made by the members of the NexoShift team.

## Table of contents
1. [Workflow](#workflow)
2. [Branching model](#branching-model)
3. [Commit messages](#commit-messages)
4. [Code guidelines](#code-guidelines)
5. [Before opening a pull request](#before-opening-a-pull-request)
6. [Pull requests and reviews](#pull-requests-and-reviews)
7. [Releases and versioning](#releases-and-versioning)
8. [Reporting issues](#reporting-issues)

## Workflow

1. Take a user story or task from the sprint backlog (Jira).
2. Create a branch from `develop` following the naming rules below.
3. Commit small, focused changes.
4. Open a pull request to `develop` and ask a teammate for review.
5. After approval, merge it and delete the branch.

## Branching model

The team uses **Git Flow**.

| Branch | Created from | Merged into | Purpose |
|--------|--------------|-------------|---------|
| `main` | — | — | Released code only. Every release is tagged (`v1.0.0`). |
| `develop` | `main` | — | Integration of the next release. |
| `feature/<name>` | `develop` | `develop` | New functionality, e.g. `feature/clinical-exams`. |
| `fix/<name>` · `chore/<name>` | `develop` | `develop` | Bug fixes and maintenance, e.g. `chore/upgrade-dependencies`. |
| `release/<version>` | `develop` | `main` and `develop` | Release preparation: version, docs and last fixes. |
| `hotfix/<version>` | `main` | `main` and `develop` | Urgent fix of a released version. |

Rules:
- Never commit directly to `main` or `develop`.
- Branch names in English, lower case and kebab-case.
- Delete the branch once its pull request is merged.

## Commit messages

Commits follow **[Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)**:

```
<type>(<scope>): <description>
```

| Type | Use |
|------|-----|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `chore` | Build, dependencies or tooling |
| `ci` | Continuous integration |

- **scope**: the bounded context or module: `iam`, `profiles`, `clinical-attention`, `clinical-exams`, `ai-assistance`, `shared`, `i18n`, `deps`.
- **description**: in English, imperative mood, lower case, no final period, at most 72 characters.

Examples:
```
feat(clinical-exams): add exam result validation
fix(iam): reject expired password reset tokens
test(profiles): cover clinic patients access rules
chore(deps): upgrade dependencies
```

## Code guidelines

- Respect the DDD layers: `domain` → `application` (stores) → `infrastructure` (HTTP) → `presentation` (views).
- Views never call `HttpClient` directly; they use a store.
- A bounded context imports another one **only** through its `index.ts`.
- Standalone components with signals; keep the PetCare Hub design system (colors, Inter, 8 px grid).
- All user-facing texts go through ngx-translate, in both `es.json` and `en.json`.
- Format with Prettier before committing.
- Code, identifiers, branches and commits in **English**.
- Never commit secrets (API keys, passwords, tokens) or local files such as `.env` or `uploads/`.

## Before opening a pull request

1. Bring the latest `develop` into your branch:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout <your-branch>
   git merge develop
   ```
2. Run the tests and the build; both must pass:
   ```bash
   npm test -- --watch=false
   npm run build
   ```
3. Add or update tests for every business rule you changed.
4. The **CI** check in GitHub Actions must be green before merging.

## Pull requests and reviews

- Target branch: `develop` (`main` only for releases and hotfixes).
- Title in Conventional Commits format.
- The description explains **what** changed, **why**, and **how it was tested**, and links the user story.
- At least **one teammate** reviews and approves before merging.
- Use **Create a merge commit** so each feature stays visible in the history.

## Releases and versioning

Versions follow **[Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html)** (`MAJOR.MINOR.PATCH`):

| Change | Example |
|--------|---------|
| Incompatible API change | `1.0.0` → `2.0.0` |
| New backward-compatible feature (usually a sprint) | `1.0.0` → `1.1.0` |
| Bug fix | `1.0.0` → `1.0.1` |

Each release:
1. Starts a `release/<version>` branch from `develop`.
2. Updates the version and [CHANGELOG.md](CHANGELOG.md).
3. Is merged into `main`, tagged `v<version>` and merged back into `develop`.
4. Is published as a GitHub Release with the changelog notes.

## Reporting issues

Open a GitHub issue that includes the steps to reproduce, the expected result, the actual result and screenshots or logs when possible. Do not include personal data or secrets.
