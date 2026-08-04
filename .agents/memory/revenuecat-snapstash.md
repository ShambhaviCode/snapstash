---
name: RevenueCat integration — SnapStash
description: How RC is wired into the SnapStash Expo app; entitlement ID, key names, provider order, Metro workaround.
---

## Setup

- SDK: `react-native-purchases` + `react-native-purchases-ui` v10.6.0 (in `artifacts/snapstash`)
- Test API key stored as env var `EXPO_PUBLIC_REVENUECAT_TEST_API_KEY` (non-secret — public SDK key)
- For production: set `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` and `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
- Entitlement identifier: **`SnapStash Pro`** (exact string, case-sensitive)
- Products: monthly $4.99, yearly $19.99, lifetime $39.99 (must be created in RC dashboard + App Store Connect / Google Play)

## Provider order (critical)

`SubscriptionProvider` **must** wrap `AppProvider` in `app/_layout.tsx`:

```
QueryClientProvider > SubscriptionProvider > AppProvider
```

`AppProvider` calls `useSubscription()` internally to derive `isPremium = isSubscribed`.

## Key files

- `lib/revenuecat.tsx` — `initializeRevenueCat()`, `SubscriptionProvider`, `useSubscription()`, package helpers
- `context/AppContext.tsx` — consumes `useSubscription().isSubscribed` as `isPremium`; no local premium state
- `app/_layout.tsx` — calls `initializeRevenueCat()` at module level (outside components), wraps with `SubscriptionProvider`
- `app/paywall.tsx` — uses `RevenueCatUI.Paywall` (native RC paywall) on iOS/Android; falls back to custom UI on web
- `app/(tabs)/settings.tsx` — `RevenueCatUI.presentCustomerCenter()` for subscription management

## Metro blockList fix

`react-native-purchases` creates a `_tmp_NNN` directory during install that Metro tries to watch but doesn't exist. Fixed in `metro.config.js`:

```js
config.resolver.blockList = [/node_modules\/.*_tmp_\d+\/.*/];
```

**Why:** Without this, Metro crashes on startup with `ENOENT: watch ... android/src`.

## RevenueCat dashboard checklist (before going live)

1. Create project → get iOS + Android API keys → set as env vars above
2. Create products in App Store Connect / Google Play matching the identifiers
3. Create entitlement `SnapStash Pro` → attach all 3 products
4. Create an Offering (default) → attach packages (monthly, annual, lifetime)
5. (Optional) Design a Paywall template → attach to the offering (enables native `RevenueCatUI.Paywall` rendering)
6. (Optional) Configure Customer Center in RC dashboard
