---
trigger: always_on
---

# REPP — Project Architecture

## Stack
- Next.js
- TypeScript
- React
- Next.js App Router
- PostgreSQL hosted on Neon
- Drizzle ORM
- Zod
- Tailwind CSS
- shadcn/ui when appropriate
- Vercel for deployment
- Git/GitHub for version control

## Development principles
- Keep TypeScript strict.
- Prefer simple, readable and maintainable solutions.
- Do not change the approved technology stack without explicit approval.
- Do not add dependencies without explaining why they are necessary.
- Never store credentials, tokens or secrets in source code.
- Use environment variables for secrets and environment-specific configuration.
- Use Drizzle migrations for database schema changes.
- Do not perform destructive database operations without explicit approval.
- Do not create Git commits or push changes automatically.

## Code Quality and Design Principles

- use english for all back-end and front-end code: methods names, variables, entities, DTO, etc.
- use Portuguese (BR) for front-end user views. 
- Follow TypeScript and Next.js best practices.
- Apply object-oriented design when it provides clear value.
- Follow SOLID principles where applicable.
- Prefer composition over inheritance.
- Keep functions and classes focused on a single responsibility.
- Keep business logic separate from UI components.
- Avoid unnecessary abstractions and overengineering.
- Prefer clear, maintainable code over clever solutions.
- Use meaningful names for variables, functions, classes, types, and interfaces.
- Avoid code duplication when extracting a reusable abstraction improves clarity.


## Development workflow
For significant features:
1. Understand the requirement and inspect existing code.
2. Identify ambiguities before implementation.
3. Present a short implementation plan.
4. Implement only the approved scope.
5. Run lint.
6. Run build.
7. Run relevant tests.
8. Summarize changed files and important technical decisions concisely.

Avoid unnecessary abstractions and premature complexity.

## Application Strategy

- The application must be designed mobile-first.
- The initial release will be a web application accessed through the browser.
- The architecture must remain compatible with future evolution to a PWA.
- Offline and caching capabilities may be introduced incrementally when justified.
- Native Android/iOS applications are not part of the initial scope.

## Architecture

- Use a modular full-stack Next.js architecture.
- Frontend and backend will initially remain within the same Next.js project.
- PostgreSQL on Neon is the primary database.
- Client-side code must never connect directly to PostgreSQL.
- Do not create a complete REST API unless an actual external consumer requires it.
- Prefer Server Actions for application operations initiated by the Next.js frontend when appropriate.