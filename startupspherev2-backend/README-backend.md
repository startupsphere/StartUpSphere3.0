# StartUpSphere Backend — Development README

Quick start (local):

1. Copy environment example:

```
cp .env.example .env
```

2. (Optional) Edit `.env` to configure a real Postgres instance. If you don't, the app will use an in-memory H2 DB for local development.

3. Run the app:

```powershell
./mvnw spring-boot:run
```

Notes:
- The application reads environment variables from a `.env` file (via `java-dotenv`) and system environment. The following keys are used by `CapstoneApplication`:
  - `SENDGRID_API_KEY` → `sendgrid.api.key`
  - `SPRING_DATASOURCE_URL` → `spring.datasource.url`
  - `SPRING_DATASOURCE_USERNAME` → `spring.datasource.username`
  - `SPRING_DATASOURCE_PASSWORD` → `spring.datasource.password`
  - `SECURITY_JWT_SECRET_KEY` → `security.jwt.secret-key`

- For development the app will automatically generate a JWT secret and use an in-memory H2 database when DB env vars are not present. Do NOT use generated secrets in production.

Docker (Postgres + app):

```powershell
docker compose up --build
```

CI:
- A GitHub Actions workflow is included at `.github/workflows/ci.yml` to build and run tests on push and PRs.
