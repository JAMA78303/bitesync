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
