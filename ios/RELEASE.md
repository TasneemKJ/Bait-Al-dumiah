# Releasing بيت الدمية · Bait Al-dumiah (iPhone)

Bundle `Tas.BaitAlDumiah` (bundle ID resource `Z79VP7D4Z5`), team `FJ3FMYPK3P`. The general runbook
is `tas-engine/toolkit/release/README.md`; this page is what is particular to this game.

## Signing
- Certificate: Apple Distribution `2PFCH5WWG4`, expires **2027-11-07**.
- Profile: **Bait Al-dumiah AppStore (API)** (`a1c56bbd-d34f-4f76-9910-e6c3211a324a`), expires
  **2027-11-07**. Renew both before then. Capabilities: In-App Purchase only (no iCloud, no Game Center). If the profile predates
  the purchases, regenerate it.

## Before every build
- [ ] `npm run verify` green. Twelve tests in `tests/native-entry.test.mjs` run `python`; on a Mac with
      only `python3`, put a `python` → `python3` link first on `PATH` (2026-11-13: 549/549 that way).
- [ ] iOS suite green (command in `ios/README.md`).
- [ ] Build from a **clean worktree at a pushed commit**, with `tas-engine` beside it:
      `git worktree add --detach <dir>/Bait-Al-dumiah <sha>`, `ln -s …/tas-engine <dir>/tas-engine`,
      `ln -s …/node_modules`, `npm run build`.
- [ ] New `--build` every upload; `--version` for a new store version.
- [ ] Saves: install build N, play, install N+1 over it: the same house opens.

## Upload
```bash
ios/release/upload.sh --project ios/BaitAlDumiah.xcodeproj --scheme BaitAlDumiah \
  --bundle-id Tas.BaitAlDumiah --team FJ3FMYPK3P --profile "Bait Al-dumiah AppStore (API)" \
  --build <n> --key-path ~/.appstoreconnect/private_keys/AuthKey_<KEY_ID>.p8 --key-id <KEY_ID> --issuer <ISSUER_ID>
```

## TestFlight, then review
Before review: the first ten minutes on a **real iPhone** in Arabic and English (WebGL speed and heat
are only real on a device: the simulator proves nothing there), airplane-mode relaunch, rotate during
tea pouring and sewing, background and relaunch (the house is where it was), delete and reinstall
(a new house; nothing is kept outside the app).

Before review also: buy The Fifth Room and the canary with a Sandbox account; Restore on a second
install; cancel the canary in Settings → Apple Account and see it leave.

Review notes: see `ios/store/listing.json` (`reviewNotes`): no account, no network; where each
purchase is and how to reach it.
