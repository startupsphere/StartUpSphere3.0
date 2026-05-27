Local development setup

Backend
- Copy `startupspherev2-backend/.env.local.example` to `startupspherev2-backend/.env.local` and fill values if you need a real datasource or sendgrid key.
- Dev fallbacks: if `SECURITY_JWT_SECRET_KEY` is missing a temporary dev key is generated; if `SPRING_DATASOURCE_URL` is missing an in-memory H2 DB is used.
- Run backend:

  cd startupspherev2-backend
  ./mvnw spring-boot:run

- Backend default port: 8080. If 8080 is busy the app will select a free port; check startup logs for the actual port (e.g., 54759).
- H2 console available at `/h2-console` when running locally.

Frontend
- Copy `startupspherev2-frontend/.env.local.example` to `startupspherev2-frontend/.env.local` and set `VITE_BACKEND_URL` and optionally `VITE_MAPBOX_TOKEN`.
- Run frontend dev server (defaults to port 5173, will pick another port if in use):

  cd startupspherev2-frontend
  npm install
  npm run dev

- The dev Vite server proxies API paths to the backend so `fetch` calls with `credentials: 'include'` will send cookies and work in local dev.

Login (dev test)
- Use the admin account:
  email: admin@startupsphere.com
  password: admin123
- After logging in, cookie-based auth is used for subsequent requests.

Notes & Reverting dev relaxations
- For local development the app relaxes cookie `Secure` to allow HTTP (it sets `Secure` only when the request is HTTPS) and enables H2 console. Before production, revert these in `AuthenticationController` and `SecurityConfiguration` to enforce `Secure` cookies and disable H2 console exposure.

Mapbox
- Add a valid `VITE_MAPBOX_TOKEN` to `startupspherev2-frontend/.env.local` to avoid CORS/map tile failures.

Commit & Branch
- Changes have been committed to the local `dev` branch and pushed to `origin/dev` (if remote exists).
