## Git Workflow

- Default branch for new work: `development`
- Branch from another feature branch only when there is a dependency on unmerged work.
  Merge back to the same branch you started from.
- Branch naming:
  - `feature/<human-readable-name>` for new features
  - `fix/<human-readable-name>` for bug fixes
- All commits use Conventional Commits:
  - `feat(scope): description` for new features
  - `fix(scope): description` for bug fixes
  - `refactor(scope): description` for restructuring
  - `test(scope): description` for test changes
  - `docs(scope): description` for documentation
  - `chore(scope): description` for maintenance
- Never commit as "Claude" — use the project's git user config.


## Pull Requests

- Every PR description must include a link to the related issue(s) in GitHub Issues.
- Format:
```
  ## Related Tasks
  - Closes #<issue-number>
```
- If the PR covers a parent issue with subtasks, link the parent issue.
- If the PR covers multiple standalone issues, link all of them.

## Boy Scout Rule

Leave every file you touch cleaner than you found it. When working on a task, if you encounter code in the files you are already modifying that violates the conventions in this document (imperative loops that should be functional, tests with weak assertions, missing `describe` groups, mutable state that should be immutable, etc.), fix it as part of the same change. Keep the scope reasonable — refactor what you touch, don't go hunting across the entire codebase. Over time, this ensures the codebase converges to the agreed standards incrementally.

## Architecture

This project follows Clean Architecture with strict layered dependency rules:

```
Domain (entities, repository protocols, use cases)
    ^
    | depends on
    |
Data (concrete repository implementations — SQLite)
    ^
    | wired via
    |
API / Presentation (routes, React UI → dependencies → use cases → repositories)
```

### Hard Rules

- **Dependency Rule**: outer layers depend on inner layers, never the reverse. Domain has zero infrastructure dependencies.
- **Repository pattern**: all external data access (SQLite, filesystems) goes through repository interfaces (Python Protocols) defined in the domain layer, with concrete implementations in the data layer.
- **Presentation is wiring only.** Route handlers / React components parse input, call the application layer, and return/render results. No business logic, no direct I/O.
- **No duplicated logic across components.** If two components share identical behavior, extract it into a shared utility immediately — not in a follow-up.

## Code Style

### Python

- Follow PEP 8, enforced by Black (formatter) and Ruff (linter).
- Use type hints everywhere. Prefer `dataclasses` with `frozen=True` or `NamedTuple` for data structures.
- Use list comprehensions, generator expressions, `map`/`filter` instead of manual loops with mutable accumulators.
- Use `Protocol` for repository interfaces (structural subtyping).
- Avoid mutable default arguments, global state, and side effects in pure functions.

### TypeScript / React

- Strict mode, no `any`. Use proper types for all props, state, and API payloads.
- **Derive union types from const arrays.** When a union type also needs runtime values, define a `const` array first and derive the type from it.
  ```ts
  const statuses = ["pending", "active", "done"] as const;
  type Status = (typeof statuses)[number];
  ```
- Prefer `map`/`flatMap`/`filter`/`reduce` over `for...of` + mutable accumulators.
- Never mutate state directly — always return new objects/arrays.

### Functional Programming and Immutability (both languages)

- Prefer declarative, functional patterns over imperative loops with mutable state.
- Avoid mutating function arguments or shared state — return new objects/arrays instead.
- Apply immutability comprehensively at the file level.
- Prefer composition over inheritance when structuring modules and behavior.

### Test Quality

Write tests that validate behavior precisely and are easy to maintain:

- **Assert concrete values.** Never write `assert result is not None` (Python) or `expect(result).toBeDefined()` (TS) when you can assert the exact expected value.
- **Group tests.** Use `describe` blocks (Vitest) or test classes (pytest) by feature or scenario.
- **Use helpers to reduce repetition.** Extract common setup into fixtures (pytest) or helper functions.
- **Extract constants for repeated strings.** Class names, paths, error messages, and other repeated literals should be constants.
- **Remove redundant tests.** If a behavior is already covered, don't add a weaker test.

## CI / Automated Checks

- When CI workflows are added, do not restrict the `pull_request` trigger to specific branches — leave it unrestricted so all PRs get checked regardless of branch naming. Listing patterns like `feature/**` is fragile and misses other conventions (`fix/**`, `hotfix/**`, etc.). Keep `push` triggers limited to `main` and `development`.
- Every PR should get automated feedback (lint, type-check, tests) before merge.

## Verification Before Calling Work Done

Automated unit/integration tests are necessary but not sufficient. Every change — feature, refactor, or bug fix — must also be verified end-to-end before being declared done:

1. **Smoke test in a real browser.** Start the backend (`uvicorn`) and frontend (`vite`) locally, then exercise the changed flow through the UI:
   - The golden path of the feature you changed.
   - At least one obvious edge case (empty state, error state, not-found, unauthorised, etc.).
   - One adjacent flow that could plausibly regress (e.g. if you touched a shared hook or component).
   Use the Chrome DevTools MCP or Playwright MCP to drive the browser. Inspect the network tab to confirm requests look right (correct endpoint, no unexpected extra calls, expected payload size) and the console for errors/warnings.

2. **Visual inspection.** Take a screenshot of the changed screen(s) and check rendering — layout, copy (Spanish for user-facing text on TFM-derived screens), images loading, no broken styles. Compare against the previous behaviour where relevant.

3. **If you cannot run the smoke test**, say so explicitly in the response. Do not claim the work is done. Acceptable reasons: missing credentials, external service down, environment cannot be started. "I forgot" or "the unit tests passed" are not acceptable reasons.

The repo has a `design-smoke-test` skill for building reusable smoke-test skills per feature/PR — use it when a flow will be re-tested often.

## After Every Feature Change

After implementing any feature addition, modification, or bug fix, always update **all** of the following before considering the work done:

1. **README.md** — Update command docs, examples, and feature list if the change affects user-facing behavior.
2. **PR description** — Check for an open PR on the current branch (`gh pr view`). If one exists, update its summary and test plan to reflect the latest changes (`gh pr edit`).
3. **OpenSpec specs** — If the change relates to an existing spec in `openspec/specs/`, update the relevant requirements and scenarios. Also update the archived copy in `openspec/changes/archive/` if it exists.

## Pre-Commit Self-Review

Before every commit, verify the following against the changed files. Do not commit until all items pass:

1. **Architecture** — Does the code respect the dependency rule? Is there any direct I/O bypassing the proper layers?
2. **Patterns** — Does new code follow the same patterns as existing code in the same layer? (Check at least one existing sibling file for reference.)
3. **Functional style** — Are there any `for` loops with mutable accumulators that should be comprehensions/`map`/`filter`/`reduce`?
4. **Test assertions** — Are all assertions concrete values? No `is not None`, `toBeDefined`, `toBeTruthy` when an exact value is knowable?
5. **No duplication** — Is any logic copy-pasted between files? Extract it.
6. **Separation of concerns** — Is business logic properly separated from presentation/wiring?
7. **Type safety** — Are all functions type-annotated (Python)? No `any` (TypeScript)?
8. **Boy Scout Rule** — In the files you touched, are there pre-existing violations of these rules? Fix them.
