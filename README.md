# Any Needs Production Platform

A complete commerce foundation for Any Needs with a responsive customer website, secure admin dashboard, REST API, PostgreSQL database, and Expo mobile app for Android and iPhone.

## Applications

- `apps/api` — Express 5, TypeScript, Prisma, PostgreSQL, JWT, OTP and Razorpay verification.
- `apps/web` — Next.js customer storefront, checkout, order tracking and admin dashboard.
- `apps/mobile` — Expo React Native customer app with native Razorpay checkout and order tracking.

## Included workflows

Customer features include OTP login, product categories and search, persistent cart, delivery address entry, COD/online checkout, tracking codes and status history. Admin features include JWT login, product creation, price/stock editing, visibility, archive, order list, sales summary and delivery-status updates. Stock reduction and cancellation restoration are performed in database transactions.

## Local setup

See `RUN_ME_FIRST.txt` for the exact commands. The short version is:

```bash
docker compose up -d
npm install
cp apps/api/.env.example apps/api/.env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev:api
```

Then, from another terminal:

```bash
cp apps/web/.env.local.example apps/web/.env.local
npm run dev:web
```

For mobile, set your LAN IP in `apps/mobile/.env`, then run `npm run dev:mobile`.

## Production checklist

1. Change the seeded admin password immediately.
2. Use strong, unrelated JWT and OTP secrets.
3. Connect an SMS provider and rate-limit OTP and login endpoints at the gateway.
4. Configure Razorpay live keys and webhooks; keep all secrets server-side.
5. Serve the API over HTTPS, set the exact `WEB_ORIGIN`, and use a managed PostgreSQL backup plan.
6. Build signed Android/iOS releases through EAS or your own CI and complete Play Store/App Store compliance forms.

## API overview

- `POST /auth/otp/request`, `POST /auth/otp/verify`, `POST /auth/admin/login`
- `GET /products`, admin product CRUD under `/products`
- saved addresses under `/addresses`
- checkout, order history/tracking and admin status updates under `/orders`
- Razorpay order creation and signature verification under `/payments`

The default admin is `admin@anyneeds.in` / `SetYourOwnAdminPassword123!` for local bootstrap only.
