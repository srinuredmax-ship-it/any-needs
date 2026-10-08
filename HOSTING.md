# Any Needs browser access

Goal: customers open one permanent HTTPS website and use the shop without
starting PowerShell, Docker, an API process, or a temporary tunnel on their PCs.

## Prepared changes

The web client defaults to `/api`. Next.js proxies that path to the backend.
Set `API_INTERNAL_URL` on the web host before building to the hosted API address.
Leave `NEXT_PUBLIC_API_URL` unset for this arrangement. The API production start
command now matches TypeScript's actual output directory.

## Hosting requirements

Deploy the web service, API service and persistent PostgreSQL database to an
always-running host. Host settings, rather than customers' terminals, must start
and restart these services. Configure database backups and HTTPS.

API setup: install dependencies, generate Prisma client, build the API, run
`npm run db:deploy -w @anyneeds/api`, and start with
`npm run start -w @anyneeds/api`.

Web setup: install dependencies, set `API_INTERNAL_URL`, build the web app and
start with `npm run start -w @anyneeds/web`.

Configure `DATABASE_URL`, `JWT_SECRET`, `OTP_SECRET`, `WEB_ORIGIN` and payment
credentials in the host's secret settings. Never include secrets in source.
`WEB_ORIGIN` must be the HTTPS website origin. Use `NODE_ENV=production`.

## Work required before going live

- Configure Twilio SMS delivery using the account SID, auth token and messaging
  service SID in the host settings. The adapter is implemented; actual delivery
  requires an active sender and approved configuration for India. Production
  never logs the OTP or exposes it as a development code. Test delivery before launch.
- Import existing product and account data or safely provision it. Do not run
  the current demo seed on a live database: it resets stock and sets a known
  admin password. Use a private admin password.
- The hosted branch implements signature-checked, idempotent payment confirmation.
  Compare it with the uncommitted Windows webhook work before merging. Configure
  Razorpay payment.captured at https://YOUR-HOST/api/payments/razorpay/webhook
  using the freshly generated host webhook secret.
- Verify login, saved addresses, COD, payment confirmation, tracking and admin
  management with the user's laptop servers switched off.
- Configure live Razorpay credentials for real payments. UPI authorisation may
  still require a bank/UPI app; hosting removes the development terminal steps.

These changes prepare the code; they do not create a hosted website or activate
SMS and real payments. Deployment requires access to the selected hosting
account and secure service configuration.

## Prepared Render deployment

`render.yaml` provisions an always-running web service and a private PostgreSQL
database. `Dockerfile` builds both applications; `deploy/start.mjs` applies
existing Prisma migrations and starts both services. If either exits, the
container exits so the hosting platform can restart it. The blueprint uses
paid plans; review Render pricing before creating resources. No services or
charges have been created by preparing these files.

Connect GitHub and Render to publish this branch and deploy the blueprint.
Enter service credentials only in Render secret settings. After Render provides
the website URL, set WEB_ORIGIN to that HTTPS origin. Configure Razorpay's
webhook with the same URL, and import the existing database safely.

Validation: API and web builds passed. A local HTTP check verified `/api/health`,
invalid webhook rejection and valid signed raw-body acceptance through the
website proxy. Docker image building, hosted migrations, real SMS delivery and
real checkout are pending; Docker is unavailable in this workspace.
