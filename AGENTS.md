# Repository Guidelines

## Project Structure & Module Organization
- `src/main.ts` boots the Nest app via `AppModule`.
- `src/app.module.ts` wires feature modules and global filters/middleware.
- Feature modules live in `src/system` (`user`, `role`, `dept`, `menu`) with `*.module.ts`, `*.controller.ts`, `*.service.ts`, DTOs, entities, and mapper helpers in nested folders.
- `src/auth` holds login endpoints, JWT guard, and DTOs; `src/common` contains filters, logging, middleware, ALS context, and utilities; `src/config` exposes `database` and `logging` config factories.
- Build output lands in `dist`; coverage reports appear in `coverage` when generated.

## Build, Test, and Development Commands
- Install dependencies: `pnpm install` (Nest CLI + TypeScript).
- Develop: `pnpm start:dev` for watch mode; `pnpm start:debug` enables the inspector; set env with `NODE_ENV=development` or use `pnpm start:dev:env`.
- Build: `pnpm build` compiles to `dist`; run production with `pnpm start:prod`.
- Lint/format: `pnpm lint` runs ESLint (type-checked); `pnpm format` applies Prettier.
- Tests: `pnpm test` for unit, `pnpm test:e2e` for e2e, `pnpm test:cov` for coverage, `pnpm test:watch` for TDD loops.

## Coding Style & Naming Conventions
- TypeScript everywhere; prefer 2-space indentation, single quotes, trailing commas, and LF endings per `.prettierrc`.
- Follow Nest patterns: `*.module.ts`, `*.controller.ts`, `*.service.ts`; DTOs as `*.dto.ts`, entities `*.entity.ts`, mappers in `mapper/` folders.
- Keep functions small, async/await with typed return values; avoid `any` unless justified (rule is off but discouraged).
- Run lint before committing; Prettier is separate¡ªdo not mix manual formatting styles.

## Testing Guidelines
- Jest runs from `src` with files matching `*.spec.ts`; co-locate specs with implementation.
- Mock external services/DB; favor supertest for controllers. Keep tests deterministic and isolated from real MySQL.
- Aim for meaningful coverage via `pnpm test:cov`; add assertions for auth guards, DTO validation, and role/menu tree helpers.

## Commit & Pull Request Guidelines
- Commit messages use short, imperative summaries similar to existing history (`Add ...`, `Enhance ...`); include scope if helpful (`Role:` or `Auth:`).
- Before opening a PR: describe motivation and changes, link issues/tasks, list key commands run (tests, lint, build), and note config/DB migrations or new env vars.
- Include screenshots or sample payloads for API-affecting changes when relevant; document backward-incompatible changes.

## Security & Configuration Tips
- Configure MySQL via env vars `mysql_host`, `mysql_port`, `mysql_username`, `mysql_password`, `mysql_database`; logging via `LOG_DIR`, `LOG_LEVEL`, `NODE_ENV`.
- Never commit secrets or `.env` files; prefer updating `.env.example` when adding config knobs.
- Logs default to `./logs`; ensure permissions in production and rotate externally if needed.
