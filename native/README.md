# BiteSync iPhone app

The iPhone app is a Capacitor shell (`ios/`, `capacitor.config.ts`) that loads the
live site, `https://bitesync.io`, opening on `/today`. Web releases reach the app
without a new App Store build. Only a native change needs a new build: a new
plugin, the icon, the launch screen or Info.plist.

- `native/www/` is the only web content bundled in the app:
  - `offline.html` is shown when the site can't load;
  - `today/` is a placeholder, because Capacitor checks that `appStartPath` exists locally.
- The app adds `BiteSyncApp` to its user agent (`lib/native/app.ts`). The site uses
  it to keep Stripe out of the app, as Apple's rules require:
  - `/billing` shows `AppBillingNotice`;
  - the checkout and portal actions redirect;
  - `/` redirects to `/today`.

## Build and run

```bash
npx cap sync ios        # copies native/www and writes ios/App/App/capacitor.config.json
npx cap open ios        # opens Xcode; pick a simulator or your iPhone and press Run
```

To test against a local dev server instead of the live site:

```bash
CAP_SERVER_URL=http://localhost:3000 npx cap sync ios
```

Run `npx cap sync ios` again, without the variable, before building for TestFlight.

## Native features

The site calls these Capacitor plugins only when it runs inside the app (`lib/native/bridge.ts`):

- **Reminders** (`@capacitor/local-notifications`, `lib/native/reminders.ts`). The app can't receive web push, so the phone schedules the Sunday and evening reminders itself and re-plans them on open, on resume and after a plan changes. Sign-out and account deletion cancel them.
- **Share list** (`@capacitor/share`): the iPhone share sheet.
- **A light tap** when ticking a grocery item (`@capacitor/haptics`).
- **Offline grocery list** (`@capacitor/preferences`): the last list opened is kept on the phone and shown by `offline.html`.

`ios/App/App/PrivacyInfo.xcprivacy` declares the UserDefaults use that `@capacitor/preferences` needs. Adding a plugin is a native change: run `npx cap sync ios` and ship a new build.
