# Getting BiteSync into the App Store

Where things stand, what's left, and the text to paste into App Store Connect.
Last updated 11 November 2026.

## Where things stand

| | Status |
|---|---|
| iPhone app (Capacitor shell, reminders, share sheet, offline grocery list) | Done, live since 28 Oct |
| Signing, archive, upload from this Mac | Works. Build 1.0 (1) uploaded 11 Nov |
| In-app account deletion (Apple requires it) | Done |
| Privacy manifest | Done |
| In-app purchase for Pro (Apple requires it) | Done. Sandbox test on 11 Nov: bought, Pro unlocked, lapsed, Restore found nothing as expected |
| App record in App Store Connect | Done (app id 6833558001) |
| Price and availability | Free; 147 countries. Not the EU (no trader details yet) or China mainland (needs a licence) |
| Screenshots (6.9-inch, 1320 × 2868) | To do (Claude) |
| Listing text, privacy answers, review notes | Drafted below |

## Your steps, in order

Only you can do these: they need your Apple and RevenueCat accounts.

1. **Paid Apps agreement.** App Store Connect → Business → accept the Paid Apps agreement and add bank and tax details. Subscriptions can't be tested or sold until Apple marks it Active (can take a few days).
2. **Create the app record.** App Store Connect → Apps → **+** → New App.
   - Platform: iOS
   - Name: `BiteSync: Macro Meal Planner` (another app is called "Calorie Counter - BiteSync", so the longer name avoids a clash)
   - Primary language: English (U.K.)
   - Bundle ID: `io.bitesync.app`
   - SKU: `bitesync-ios`
3. **Create the two subscriptions.** In the app record → Monetisation → Subscriptions → create a group called `BiteSync Pro`, then two subscriptions:

   | Product ID | Duration | Price | Display name |
   |---|---|---|---|
   | `bitesync_pro_monthly` | 1 month | £6.99 | BiteSync Pro Monthly |
   | `bitesync_pro_annual` | 1 year | £59.99 (Apple's UK prices go from £49.99 to £59.99) | BiteSync Pro Yearly |

   Description for both (55 characters max): `AI week plans, nutrient checks and unlimited recipes.` No introductory offer: new accounts already get 7 days of Pro free without one.
4. **Set up RevenueCat** (free at this size; it keeps track of who has paid Apple).
   - Create a project called BiteSync and add an App Store app with bundle ID `io.bitesync.app`.
   - Follow its prompt to add an App Store Connect in-app purchase key.
   - Entitlement: `pro`. Attach both products to it.
   - Offering: `default`, with a Monthly package (`bitesync_pro_monthly`) and an Annual package (`bitesync_pro_annual`).
   - Integrations → Webhooks: URL `https://bitesync.io/api/webhooks/revenuecat`, and an Authorization header value of your own (a long random string; keep it for step 5).
5. **Add three settings in Vercel** (Project → Settings → Environment Variables → Production), then redeploy:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_REVENUECAT_IOS_KEY` | RevenueCat's public iOS key (starts `appl_`) |
   | `REVENUECAT_SECRET_KEY` | RevenueCat's secret API key (starts `sk_`) |
   | `REVENUECAT_WEBHOOK_AUTH` | The exact Authorization header value from step 4 |

   Until the first one is set, the app keeps showing "Pro isn't available to buy in the app yet", with no prices.
6. **Make a review account.** Sign up at bitesync.io with a Gmail "+" address just before submitting, finish setup and plan a week, so the reviewer lands on a full account. Put its email and password in App Review Information (below).

After steps 1–5, Claude tests a sandbox purchase on your iPhone, uploads the build and takes the screenshots. Then you press Submit for Review.

## Listing text

- **Name** (30 max): `BiteSync: Macro Meal Planner`
- **Subtitle** (30 max): `Plan meals to your macros`
- **Category:** Health & Fitness (secondary: Food & Drink)
- **Privacy Policy URL:** `https://bitesync.io/privacy`
- **Support URL:** `https://bitesync.io/about`
- **Marketing URL:** `https://bitesync.io`
- **Copyright:** `2026 James Machmouchi`
- **Keywords** (100 max): `meal planner,macros,protein,calories,grocery list,meal prep,nutrition,recipes,diet,weekly meal plan`

**Promotional text** (170 max):

> Plan a week of meals from your own recipes, sized to your calorie and protein targets, with one grocery list. Built by a dietitian. 7 days of Pro free.

**Description:**

> BiteSync is a weekly meal planner built by a dietitian. It plans your week from recipes you actually cook, sized to your calorie and protein targets, and turns the week into one grocery list.
>
> TARGETS SET FOR YOU
> Tell BiteSync your weight, height, age, activity and goal. It works out your daily calories and protein, with safety limits built in.
>
> A WEEK THAT ADDS UP
> Place meals yourself and watch each day's calories and protein update, or let BiteSync Pro fill the whole week from your recipes in seconds.
>
> YOUR RECIPES
> Add your own, or paste a link from a recipe website and BiteSync imports the ingredients and works out the nutrition.
>
> ONE GROCERY LIST
> The whole week merged into one list, grouped by aisle, skipping what's already in your pantry. It still opens in the shop with no signal.
>
> VITAMINS AND MINERALS (PRO)
> BiteSync Pro checks 12 vitamins and minerals across your planned week against recommended intakes, so you can see what the week is short on.
>
> A WEEKLY NUDGE
> An optional Sunday reminder plans next week in one tap.
>
> BITESYNC PRO
> Every new account gets 7 days of Pro free, with no payment details. After that, Pro is a subscription: monthly or yearly. Payment is charged to your Apple Account. Subscriptions renew automatically unless cancelled at least 24 hours before the end of the period; manage or cancel in your Apple Account settings. Without Pro you can still view your recipes, plans and grocery lists.
>
> BiteSync is not a medical device and doesn't give medical advice. Speak to your GP or a dietitian before following a calorie target if you're pregnant or breastfeeding, under 18, have had an eating disorder, have kidney disease, or take medicine for diabetes.
>
> Terms of use: https://bitesync.io/terms
> Privacy policy: https://bitesync.io/privacy

## App Privacy answers

Answer "Yes, we collect data", then:

| Data type | Collected | Linked to the person | Used for tracking | Purpose |
|---|---|---|---|---|
| Contact Info → Email Address | Yes | Yes | No | App Functionality |
| Health & Fitness → Health (weight, height, age, sex, activity, goal, dietary needs) | Yes | Yes | No | App Functionality |
| User Content → Other User Content (recipes, meal plans, grocery lists, feedback) | Yes | Yes | No | App Functionality |
| Identifiers → User ID | Yes | Yes | No | App Functionality |
| Purchases → Purchase History | Yes | Yes | No | App Functionality |
| Usage Data → Product Interaction (anonymous page and feature counts) | Yes | No | No | Analytics |

Everything else: not collected. The app doesn't track people across other companies' apps or websites.

## App Review Information

- **Sign-in required:** yes. Give the review account's email and password (step 6).
- **Notes** (paste):

> BiteSync is a weekly meal planner. The app loads our web service in a native shell and adds on-device features: local-notification reminders (Settings → Reminders), the iOS share sheet for the grocery list, haptics, and an offline copy of the grocery list (turn on Airplane Mode and reopen the app to see it).
>
> In-app purchase: BiteSync Pro (monthly and yearly auto-renewing subscriptions) is on the Billing screen: tap the round account button at the top right → Billing & subscription, or any "See BiteSync Pro" prompt. New accounts start with a 7-day free trial of Pro that needs no payment details; when it ends, planning new weeks needs a subscription and existing content stays viewable.
>
> Account deletion: Settings → Delete account (bottom of the page). It removes the account and its data.
>
> The app gives general nutrition information, not medical advice; the health disclaimer is in the Terms and the description.

## Building and uploading (Claude runs these)

```bash
npx cap sync ios
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release \
  -destination 'generic/platform=iOS' -archivePath build/BiteSync.xcarchive \
  -allowProvisioningUpdates archive
xcodebuild -exportArchive -archivePath build/BiteSync.xcarchive \
  -exportOptionsPlist native/ExportOptions.plist -exportPath build/export \
  -allowProvisioningUpdates
```

Raise `CURRENT_PROJECT_VERSION` in the Xcode project for every upload: App Store Connect refuses a build number it has seen.

## Still to do after the steps above

- Screenshots at 1320 × 2868: Today, the planner, a recipe, the grocery list, the vitamin and mineral check.
- ~~Sandbox purchase test on a real iPhone~~: done 11 Nov.
- A screenshot of the paywall for each subscription's Review Information (the same picture works for both).
- Email confirmation inside the app: the link in the email opens Safari, so a new sign-up has to come back to the app and sign in. It works, but a 6-digit code would be smoother.
- Optional for a later version: a "Today's meals" home-screen widget.
