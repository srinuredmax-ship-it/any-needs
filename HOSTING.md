# Any Needs hosting

Website: https://any-needs.onrender.com
Admin: https://any-needs.onrender.com/admin

Render runs the Next.js website and Express API together in the Docker container. The browser uses /api; Next proxies to the API on localhost:4000. Customers need no terminal or local server. The free Render instance can sleep when idle, so the first visit can take longer.

## Database

Neon project: small-king-40553072, production branch, Free plan. DATABASE_URL is configured securely in Render; never commit it. render.yaml leaves that value externally managed. Free quotas and provider terms apply; no lifetime availability guarantee is made.

For the one-time move, DATABASE_TRANSFER_TARGET points to Neon while DATABASE_URL still points to the original Render database. Startup applies migrations on the target, locks source tables against concurrent changes, copies all seven application models, and compares every row before proceeding. It refuses to overwrite a different populated destination. A successful transfer installs write-blocking triggers on the retired source database, keeping a consistent readable snapshot and preventing the old deployment from accepting writes during switchover. After verification, set DATABASE_URL to Neon and DATABASE_TRANSFER_TARGET to an empty string. Subsequent startups perform ordinary Prisma migrations and preserve existing catalog/admin records.

The old Render free database expires 7 November 2026. It is retained only as a point-in-time fallback. A rollback must account for writes made on Neon since migration; do not simply switch back to the old snapshot. If deliberately restoring the old source, its any_needs_retired triggers must be removed first, after data reconciliation. Neither database is deleted by migration.

## Secrets and remaining launch checks

The initial administrator is admin@anyneeds.in. Its existing bcrypt hash is transferred; do not reset the password or run the demo seed. ADMIN_BOOTSTRAP_PASSWORD is a host secret and only creates an absent administrator.

Customer SMS needs TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_MESSAGING_SERVICE_SID configured in Render, with a working sender. Production does not expose development OTP codes.

Online checkout needs RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET. Configure payment.captured webhook at https://any-needs.onrender.com/api/payments/razorpay/webhook using the same RAZORPAY_WEBHOOK_SECRET configured in Render. Test real SMS, checkout and payment confirmation before customer launch.

The Docker/API/web build, single-origin health endpoint and webhook signature handling have been checked. Database transfer completion and hosted health are checked through deployment logs and direct Neon queries.
