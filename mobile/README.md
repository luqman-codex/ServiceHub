# ServiceHub — Customer Mobile App

The **customer-facing mobile app** for ServiceHub, built with **React Native + Expo + TypeScript**.
It is a screen-for-screen port of the customer web app (`web/site`): same API contract, same
data shapes — only the view layer is rebuilt with React Native primitives. Customers can browse
services, book them, track and cancel their bookings, and manage their profile.

## Stack

- **Expo SDK 56** + **React Native 0.85** + **TypeScript**
- **React Navigation v7** — native-stack (per-tab drill-downs) + bottom-tabs
- **@tanstack/react-query v5** — server state, caching, mutations
- **axios** — HTTP client with a JWT request interceptor
- **react-hook-form** — login / signup / booking / profile forms
- **expo-secure-store** — encrypted JWT storage on device
- **@react-native-async-storage/async-storage** — non-sensitive persistence
- **@react-native-community/datetimepicker** — booking date/time selection
- **expo-constants** — reads `extra.apiBaseUrl` from `app.config.ts`

> All dependencies are already installed. Do **not** install or change deps.

## Setup & run (beginner-friendly, step by step)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create your local env file** — copy the example and set the API base URL:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and set `EXPO_PUBLIC_API_BASE_URL` to **your computer's LAN IP**, port `4000`,
   and the path **must end in `/api/v1`**. For example:
   ```
   EXPO_PUBLIC_API_BASE_URL=http://10.217.235.204:4000/api/v1
   ```
   Find your computer's LAN IP:
   - **Linux/macOS:** `hostname -I` (Linux) or `ipconfig getifaddr en0` (macOS)
   - **Windows:** `ipconfig` → look for the IPv4 address of your Wi-Fi adapter

   `.env` is gitignored; only `.env.example` is committed.

3. **Run the backend** on your computer at port `4000`, **bound to `0.0.0.0`** (all network
   interfaces), not just `127.0.0.1` — otherwise a phone cannot reach it. Make sure the device's
   origin is allowed by the backend CORS config (`02-API-CONTRACT §10`).

4. **Put your phone on the same Wi-Fi** as your computer.

5. **Start Expo**
   ```bash
   npx expo start
   ```
   While it runs: `r` = reload, `a` = open Android emulator, `i` = open iOS simulator.

6. **Install Expo Go** on your phone (App Store / Play Store) and **scan the QR code** shown in
   the terminal. The app loads on your device.

### Choosing the right API host (the #1 beginner gotcha)

The backend runs on **your computer** at `http://localhost:4000/api/v1`. But on a phone or
emulator, `localhost` means *that device itself*, not your computer. Use the correct host:

| Where the app runs | What `localhost` means there | Correct API host to use |
| --- | --- | --- |
| **Physical phone (Expo Go, same Wi-Fi)** | the phone | Your computer's **LAN IP**, e.g. `http://10.217.235.204:4000/api/v1` |
| **Android emulator (AVD)** | the emulator VM | `http://10.0.2.2:4000/api/v1` (special alias to the host's loopback) |
| **iOS simulator** | the Mac itself | `http://localhost:4000/api/v1` |

## Run in a web browser (easiest — no phone or Expo Go needed)

This Expo app also targets the **web**, so you can run the exact same React Native app in a
browser — ideal if you can't use Expo Go (e.g. an Expo SDK / Expo Go version mismatch). The
native-only bits have web fallbacks: the JWT uses `localStorage` instead of SecureStore, and the
date/time field uses a native browser `<input type="datetime-local">` instead of the native picker
(Metro picks `DateTimeInput.web.tsx` automatically for web).

```bash
# from mobile/  (backend must be running on :4000)
npx expo start --web        # serves the app at http://localhost:8081
```
Then open **http://localhost:8081** in any browser and log in with the sample customer below.
For the web target, set `EXPO_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1` in `.env`
(the browser runs on the same machine as the backend, so `localhost` is correct here).

> **Web deps:** `react-native-web`, `react-dom`, `@expo/metro-runtime` (already installed).

## Sample customer login

```
Email:    customer1@servicehub.test
Password: Customer@12345
```

## Screens

- **Login** — email/password sign-in (JWT stored in SecureStore)
- **Signup** — create a customer account
- **Service List** — browse/search services, filter by category (tab root)
- **Service Detail** — full service info; entry point to booking
- **Create Booking** — pick date/time, optional address/notes, confirm
- **Booking History** — list of the customer's bookings (tab root)
- **Booking Detail** — booking status, details, cancel action
- **Profile** — view/edit profile, change password, log out (tab root)

## Troubleshooting

- **"Network Error" / requests hang:** Your `EXPO_PUBLIC_API_BASE_URL` is almost certainly using
  `localhost` from a physical phone. Use your computer's **LAN IP** instead (see table above).
- **Phone can't connect even with the LAN IP:** Make sure the backend is bound to `0.0.0.0`
  (not `127.0.0.1`), the phone and computer are on the **same Wi-Fi**, and your firewall isn't
  blocking port `4000`.
- **CORS errors:** Add your device origin to the backend's allowed CORS origins (`02 §10`).
- **Changed `.env` but nothing updated:** Env vars are inlined at bundle time — **restart**
  `npx expo start` (and clear cache with `--clear` if needed) after editing `.env`.
- **Path version dropped:** The base URL must end in **`/api/v1`** exactly — don't omit the
  version segment.
