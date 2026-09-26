# SnapStash

The fastest way to save and find your text, links, and code, before you 
forget where you put it.

<img width="1536" height="1024" alt="ChatGPT Image Aug 4, 2026, 11_44_48 PM" src="https://github.com/user-attachments/assets/abd244cf-c12e-4a96-ad5c-5f8758da7f23" />

<img width="1536" height="1024" alt="ChatGPT Image Aug 4, 2026, 11_52_44 PM" src="https://github.com/user-attachments/assets/39f13478-d34d-42c3-b3cd-1b14d772671b" />

<img width="1536" height="1024" alt="ChatGPT Image Aug 4, 2026, 11_46_09 PM" src="https://github.com/user-attachments/assets/762601de-1f3c-4812-bbeb-197372e1b33b" />

## What it does

SnapStash is a snippet manager for saving and retrieving reusable text, 
links, and code. Save something once, search for it instantly, and copy 
it back with a single tap.

- **Instant search** — filters results as you type across title, content, 
  and tags
- **Auto-detection** — automatically identifies whether a snippet is a 
  link, code, or plain text
- **Folders and tags** — organize snippets your way
- **One-tap copy** — tap any saved item to copy it to your clipboard

## Monetization

SnapStash uses a freemium model powered by [RevenueCat](https://www.revenuecat.com/):

| Plan | Price | Includes |
|------|-------|----------|
| Free | $0 | 20 snippets, 1 folder |
| Monthly | $4.99/mo | Unlimited snippets & folders, cloud sync |
| Yearly | $19.99/yr | Same as Monthly, better value |
| Lifetime | $39.99 | One-time purchase, unlimited access forever |

## Tech stack

- **React Native / Expo** — cross-platform mobile framework
- **RevenueCat** — subscription management, entitlements, and paywall
- **TypeScript**
- Built with the help of **Replit's AI Agent**

## Getting started

SnapStash is a [pnpm](https://pnpm.io/) workspace. The Expo app lives in
`artifacts/snapstash`. Snippets are stored on the device, so no backend is
needed to run it.

Requirements: Node.js 20.19+ (Expo SDK 54) and pnpm 10.16+ for the
workspace's `minimumReleaseAge` setting (`npm install -g pnpm@latest`).
Installing with npm or yarn is blocked by the workspace's `preinstall`
check.

```bash
git clone https://github.com/ShambhaviCode/snapstash.git
cd snapstash
pnpm install

cd artifacts/snapstash
cp .env.example .env   # then add your RevenueCat key (see below)
pnpm exec expo start
```

Scan the QR code with the **Expo Go** app on your phone, or press `w` to
open the web build.

> `pnpm run dev` inside `artifacts/snapstash` is wired to Replit's
> environment variables; use `pnpm exec expo start` when running locally.

### Environment variables

The paywall uses RevenueCat. The app reads these from
`artifacts/snapstash/.env`:

| Variable | When it is used |
| --- | --- |
| `EXPO_PUBLIC_REVENUECAT_TEST_API_KEY` | Development, Expo Go and web. **Required**: the app throws on startup without it. |
| `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` | Production iOS builds (falls back to the test key) |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` | Production Android builds (falls back to the test key) |

Create a free RevenueCat project and copy its test-store API key from
**Project settings → API keys**. The entitlement the app checks is named
`SnapStash Pro`.

## License

MIT



