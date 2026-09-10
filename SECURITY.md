# Security

This repository contains example local-development configuration only.

- Never commit `.env` files, production database URLs, API keys, JWT secrets, OTP secrets, payment secrets, or credentials.
- Copy `.env.example` files locally and replace every placeholder with your own development values.
- Change the seeded local admin password before any deployment.
- Keep Razorpay and other payment secrets server-side only.

If you discover a security issue, please avoid posting secrets in a public GitHub issue. Contact the maintainer privately first.
