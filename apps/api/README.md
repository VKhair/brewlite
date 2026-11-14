# BrewLite Products API

NestJS + PostgreSQL, Node.js >= 22. Run commands from `apps/api`.

## Setup

Copy the repository `.env.example` to `.env` and set `DATABASE_URL` to a running PostgreSQL database. The API and database scripts load the repository `.env` automatically; existing environment variables take precedence.

```sh
npm ci
npm run db:migrate
npm run db:seed
npm run build
npm start
```

Default address: `http://localhost:3001` (`API_PORT`). For development: `npm run dev`.
On PowerShell with script execution disabled, use `npm.cmd` instead of `npm`.

## Contract

- `GET /products`: 200, JSON array of available products, ordered by name then ID. No products: `[]`.
- `GET /products/:id`: 200, product plus `sizes` and `toppings`. A nonexistent or unavailable product returns 404 with `message: "Product not found"`. Invalid UUID: 400.
- Public endpoints; no login required. Prices are integer VND. `imageUrl` is relative to the API origin; sample products use a shared placeholder served at `/images/drink.svg`.
- Size `priceDelta` is added to `basePrice`; M is the default. Topping `price` is an additional charge. Unavailable linked toppings remain in the detail response with `isAvailable: false` so the UI can disable them.
- Search, pagination and category filtering are outside this Sprint 1 task.

Example detail (`GET /products/10000000-0000-4000-8000-000000000001`):

```json
{
  "id": "10000000-0000-4000-8000-000000000001",
  "name": "Cà phê sữa",
  "description": "Cà phê phin cùng sữa đặc.",
  "basePrice": 29000,
  "imageUrl": "/images/drink.svg",
  "category": "Cà phê",
  "isAvailable": true,
  "sizes": [
    { "id": "<uuid>", "name": "S", "priceDelta": -5000, "isDefault": false },
    { "id": "<uuid>", "name": "M", "priceDelta": 0, "isDefault": true },
    { "id": "<uuid>", "name": "L", "priceDelta": 10000, "isDefault": false }
  ],
  "toppings": [
    { "id": "20000000-0000-4000-8000-000000000001", "name": "Thạch cà phê", "price": 5000, "isAvailable": true }
  ]
}
```

## Schema and seed

`db/schema.sql` creates products, per-product sizes, toppings and the product/topping join table with foreign keys, price checks and at most one default size per product. Negative size deltas support smaller sizes. Each SQL file runs in a transaction and can be rerun. Schema bootstrap uses `IF NOT EXISTS`; future schema changes need separate versioned migrations.

`db/seed.sql` inserts four drinks (three available), S/M/L sizes and three toppings (one unavailable). Fixed IDs and `ON CONFLICT DO NOTHING` avoid duplicates and preserve existing data. Seed is for local/demo use and is never run automatically on API startup.

## Verification

```sh
npm run lint
npm test
npm run build
```

Tests exercise real HTTP routes against an isolated PGlite PostgreSQL engine: actual schema/seed SQL, rerun safety, availability filtering, sizes/toppings, empty data, 400/404 and constraints. They do not require an external database. Production PostgreSQL connectivity should also be smoke-tested using the setup commands above.
