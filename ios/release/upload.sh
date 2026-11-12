#!/usr/bin/env bash
# TasKit toolkit: archive a TasKit game and upload it to App Store Connect (TestFlight).
#
# TEMPLATE. Copy it into the game's repo (e.g. ios/release/upload.sh), read it, and run it only from a
# clean worktree at a pushed commit, after the game's web tests and iOS tests are green.
# Nothing here is specific to one game or one account: every identity is an argument.
#
# The API key must be an App Store Connect API key (.p8). An App Manager key cannot use Apple's
# cloud-managed distribution certificate, so the archive signs automatically and the export signs
# MANUALLY, with a distribution certificate and an App Store provisioning profile on this Mac.
#
# Usage:
#   upload.sh --project ios/MyGame.xcodeproj --scheme MyGame --bundle-id Tas.MyGame \
#             --team ABCDE12345 --profile "My Game AppStore" --build 7 \
#             --key-path /path/to/AuthKey_XXXX.p8 --key-id XXXX --issuer xxxxxxxx-xxxx-… \
#             [--version 1.1] [--out build/release] [--dry-run]
#
# --dry-run prints the commands without running them.
set -euo pipefail

die() { echo "upload.sh: $*" >&2; exit 1; }

PROJECT="" SCHEME="" BUNDLE_ID="" TEAM="" PROFILE="" BUILD="" VERSION=""
KEY_PATH="" KEY_ID="" ISSUER="" OUT="build/release" DRY=0
while [ $# -gt 0 ]; do
  case "$1" in
    --project) PROJECT="$2"; shift 2 ;;
    --scheme) SCHEME="$2"; shift 2 ;;
    --bundle-id) BUNDLE_ID="$2"; shift 2 ;;
    --team) TEAM="$2"; shift 2 ;;
    --profile) PROFILE="$2"; shift 2 ;;
    --build) BUILD="$2"; shift 2 ;;
    --version) VERSION="$2"; shift 2 ;;
    --key-path) KEY_PATH="$2"; shift 2 ;;
    --key-id) KEY_ID="$2"; shift 2 ;;
    --issuer) ISSUER="$2"; shift 2 ;;
    --out) OUT="$2"; shift 2 ;;
    --dry-run) DRY=1; shift ;;
    -h|--help) sed -n '2,21p' "$0"; exit 0 ;;
    *) die "unknown argument: $1 (see --help)" ;;
  esac
done

for v in PROJECT SCHEME BUNDLE_ID TEAM PROFILE BUILD KEY_PATH KEY_ID ISSUER; do
  [ -n "${!v}" ] || die "missing --$(echo "$v" | tr 'A-Z_' 'a-z-')"
done
[[ "$BUILD" =~ ^[0-9]+$ ]] || die "--build must be a whole number (CURRENT_PROJECT_VERSION), got $BUILD"
[ "$DRY" = 1 ] || [ -f "$KEY_PATH" ] || die "no key file at --key-path"
[ "$DRY" = 1 ] || [ -d "$PROJECT" ] || die "no project at $PROJECT"

# Refuse a dirty tree: a build must be reproducible from a commit.
if [ "$DRY" = 0 ] && [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  die "the working tree has changes; archive from a clean worktree at a pushed commit"
fi

run() { if [ "$DRY" = 1 ]; then printf '+'; printf ' %q' "$@"; printf '\n'; else "$@"; fi; }

AUTH=(-authenticationKeyPath "$KEY_PATH" -authenticationKeyID "$KEY_ID" -authenticationKeyIssuerID "$ISSUER")
TAG="${SCHEME}-${VERSION:-current}b${BUILD}"
ARCHIVE="$OUT/$TAG.xcarchive"
EXPORT="$OUT/export-$BUILD"
OPTIONS="$OUT/ExportOptions-manual.plist"

run mkdir -p "$OUT"

# Export options for a manual-signing upload, written fresh for this build.
if [ "$DRY" = 1 ]; then
  echo "+ write $OPTIONS (method app-store-connect, destination upload, manual signing, $BUNDLE_ID → $PROFILE)"
else
  cat > "$OPTIONS" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key><string>app-store-connect</string>
  <key>destination</key><string>upload</string>
  <key>teamID</key><string>${TEAM}</string>
  <key>signingStyle</key><string>manual</string>
  <key>signingCertificate</key><string>Apple Distribution</string>
  <key>provisioningProfiles</key>
  <dict><key>${BUNDLE_ID}</key><string>${PROFILE}</string></dict>
  <key>uploadSymbols</key><true/>
</dict>
</plist>
PLIST
  plutil -lint "$OPTIONS" >/dev/null
fi

EXTRA=(CURRENT_PROJECT_VERSION="$BUILD")
[ -n "$VERSION" ] && EXTRA+=(MARKETING_VERSION="$VERSION")

run xcodebuild archive -project "$PROJECT" -scheme "$SCHEME" -configuration Release \
  -destination 'generic/platform=iOS' -archivePath "$ARCHIVE" "${EXTRA[@]}" \
  -allowProvisioningUpdates "${AUTH[@]}"

run xcodebuild -exportArchive -archivePath "$ARCHIVE" -exportOptionsPlist "$OPTIONS" \
  -exportPath "$EXPORT" "${AUTH[@]}"

echo "upload.sh: $TAG sent. TestFlight processing takes 5–15 minutes; check App Store Connect."
