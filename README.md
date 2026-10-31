# SellerDesk (starter)

Upload one product photo, get listings for Etsy, Shopify, eBay and Temu.

## Run it on your computer
1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env.local` and paste your Anthropic API key.
3. `npm install` then `npm run dev`, and open http://localhost:3000

## Put it online (auto-deploy)
1. Push this folder to a new GitHub repo.
2. On vercel.com choose "Import Project" and pick the repo.
3. Add `ANTHROPIC_API_KEY` in Vercel's Environment Variables.
4. From now on, every push to `main` goes live by itself. GitHub Actions also checks the build first.

## Not built yet
Receipt extractor, Stripe subscriptions, user accounts, Sentry plus auto-fix PRs, free SEO tools.
