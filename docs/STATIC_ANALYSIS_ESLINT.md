# Static Analysis – ESLint

We use **ESLint** as the static analysis tool for both backend (JavaScript) and frontend (TypeScript/React).

---

## 1. Configuration

- Root ESLint flat config: `eslint.config.js`
- We target:
  - Node/Express backend under `src/server`
  - React + TypeScript frontend under `src/client/src`

Example commands:

```bash
# Backend
cd src/server
npx eslint . --ext .js > eslint-backend.txt

# Frontend
cd src/client
npx eslint . --ext .tsx,.ts,.jsx,.js > eslint-frontend.txt```