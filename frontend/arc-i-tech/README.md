## Arc-i-Tech Web Application

This directory contains the Next.js 16 front-end for the Arc-i-Tech platform. It powers the marketing site plus dedicated portals for customers, sub-admins, developers, and super administrators that integrate with the Spring Boot backend located in the repository root.

### Environment Variables

Create an `.env.local` file before running the app:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Available Scripts

```bash
npm install     # install dependencies
npm run dev     # start development server
npm run lint    # lint TypeScript/React code
npm run build   # production build
npm run start   # run production build locally
```

The application expects the backend to be reachable at `NEXT_PUBLIC_API_URL`. JWT tokens are stored in `localStorage` and attached to protected API calls.

### Key Routes

| Route          | Description                                  |
|----------------|----------------------------------------------|
| `/`            | Marketing homepage with services & inquiries |
| `/login`       | Role-aware sign-in (customer/staff)          |
| `/register`    | Customer onboarding                          |
| `/dashboard`   | Customer project tracker & chat              |
| `/admin`       | Sub-admin delivery console                   |
| `/super-admin` | Executive control tower                      |
| `/developer`   | Developer delivery cockpit                   |

Refer to the root `README.md` for the full-stack overview and backend setup steps.
