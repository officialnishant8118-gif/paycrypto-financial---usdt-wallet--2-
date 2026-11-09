<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/bf469235-2c65-4353-a157-21cc598470cd

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. In Firebase Console, enable **Email/Password** and **Google** under Authentication → Sign-in method. Add `localhost` to Authorized domains for local development.
3. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
4. Run the app:
   `npm run dev`

Email/password accounts are signed in immediately after registration. Admin access is limited to verified allowlisted accounts. Deploy `firestore.rules` to the configured Firebase project when publishing rule changes.
# paycrypto-financial---usdt-wallet--2-
