# Block Blast — native iOS app

A native iOS wrapper (SwiftUI + `WKWebView`) around the Block Blast web game.
The web assets are bundled inside the app, so it runs **fully offline** — no
server, no internet needed.

## Requirements

- A Mac with **Xcode** installed.
- **XcodeGen** (`brew install xcodegen`) — generates the `.xcodeproj`.
- A free **Apple ID** to run it on your own iPad (see below).

## Build & run on your iPad

1. **Generate the project** (first time, and after editing `project.yml`):
   ```sh
   cd ios
   ./sync-web.sh          # copy the latest web game into the app bundle
   xcodegen generate      # creates BlockBlast.xcodeproj
   open BlockBlast.xcodeproj
   ```

2. **Set signing** (one time) in Xcode:
   - Select the **BlockBlast** target → **Signing & Capabilities**.
   - Check **Automatically manage signing**.
   - **Team:** click *Add an Account…* and sign in with your Apple ID, then pick
     it as the team. (A free Apple ID works.)
   - If the bundle id is taken, change it to something unique, e.g.
     `com.yourname.blockblast`.

3. **Plug in your iPad** (or use it wirelessly once paired):
   - Select your iPad from the device dropdown at the top of Xcode.
   - Press **▶ Run** (`Cmd+R`).
   - First run: on the iPad, go to **Settings → General → VPN & Device
     Management** and **trust** your developer certificate.

4. The app installs with its own **Home Screen icon** and launches full-screen.

## Free Apple ID limitation

Apps signed with a **free** Apple ID expire after **7 days** — just press Run
again in Xcode to reinstall. A paid **Apple Developer Program** membership
($99/yr) extends this to 1 year and enables TestFlight / App Store.

## Updating the game

The web game lives at the **repo root**. After changing it:

```sh
cd ios
./sync-web.sh          # re-copy assets into BlockBlast/www
# then rebuild / re-run in Xcode
```

## Project layout

| Path | Purpose |
|------|---------|
| `project.yml` | XcodeGen spec (source of truth for the project) |
| `BlockBlast/BlockBlastApp.swift` | SwiftUI app + `WKWebView` host |
| `BlockBlast/www/` | Bundled copy of the web game (generated) |
| `BlockBlast/Assets.xcassets/` | App icon |
| `sync-web.sh` | Copies the web game into `BlockBlast/www/` |

Both `BlockBlast.xcodeproj/` and `BlockBlast/www/` are generated and git-ignored.
