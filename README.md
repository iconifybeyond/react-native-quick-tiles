# @iconifybeyond/react-native-quick-tiles

[![npm version](https://img.shields.io/npm/v/@iconifybeyond/react-native-quick-tiles.svg)](https://www.npmjs.com/package/@iconifybeyond/react-native-quick-tiles)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![New Architecture](https://img.shields.io/badge/New%20Architecture-first--class-blue)](https://reactnative.dev/docs/the-new-architecture/landing-page)

**Add and control Android Quick Settings tiles from React Native — built on the New Architecture.**

> ⚠️ **Alpha / Work-in-progress.** This library is in early development. The API is defined and the Kotlin implementation is scaffolded, but **it has not yet been tested end-to-end on a physical device.** Use it for experimentation and contributing — not yet for production apps. Version `0.x` signals semver instability; breaking changes may happen between minor releases.

A React Native library that wraps Android's [Quick Settings Tile API](https://developer.android.com/develop/ui/views/quicksettings-tiles) (`TileService`), letting you:

- 📌 **Declare** a Quick Settings tile backed by your app
- 🎨 **Update** the tile label, subtitle, icon, and active/inactive/unavailable state — even when the JS context isn't running (state is persisted to `SharedPreferences`)
- ⚡ **Listen** for tile lifecycle events (`click`, `added`, `removed`, `startListening`) in JS via the `NativeEventEmitter`
- ➕ **Prompt** the user to add your tile (Android 13 / API 33+)
- 📱 **Degrade gracefully** on iOS — all methods reject with a typed `UNSUPPORTED` error instead of crashing

Built as a **Turbo Module** (React Native New Architecture) from the ground up.

---

## Requirements

| Requirement | Value |
|---|---|
| React Native | `>= 0.73` (New Architecture) |
| Android minSdk | `24` (`TileService` API level) |
| Tile subtitle | Android 10 / API `29+` |
| Request-add tile | Android 13 / API `33+` |
| iOS | Graceful no-op (methods reject with `UNSUPPORTED`) |

> **New Architecture is required.** Enable it in your `android/gradle.properties`:
> ```properties
> newArchEnabled=true
> ```

---

## Installation

```bash
npm install @iconifybeyond/react-native-quick-tiles
# or
yarn add @iconifybeyond/react-native-quick-tiles
```

No manual linking is needed — auto-linking handles it.

---

## Android setup (required)

Quick Settings tiles are a system-level feature that requires **app-side manifest entries**. The library provides the `RNQuickTileService` base class; you must declare a subclass of it in your app's manifest.

### 1. Create a TileService subclass in your app

```kotlin
// android/app/src/main/java/com/yourapp/QuickTileService.kt
package com.yourapp

import com.iconifybeyond.quicktiles.RNQuickTileService

class QuickTileService : RNQuickTileService()
```

### 2. Add a drawable icon for the tile

Create `android/app/src/main/res/drawable/ic_quick_tile.xml`:

```xml
<vector xmlns:android="http://schemas.android.com/apk/res/android"
  android:width="24dp"
  android:height="24dp"
  android:viewportWidth="24"
  android:viewportHeight="24">
  <path
    android:fillColor="#FFFFFF"
    android:pathData="M7,2v11h3v9l7-12h-4l4-8z" />
</vector>
```

### 3. Declare the service in `AndroidManifest.xml`

Add the following inside the `<application>` tag of your app's `android/app/src/main/AndroidManifest.xml`:

```xml
<service
  android:name=".QuickTileService"
  android:label="My Tile"
  android:icon="@drawable/ic_quick_tile"
  android:exported="true"
  android:permission="android.permission.BIND_QUICK_SETTINGS_TILE">
  <intent-filter>
    <action android:name="android.service.quicksettings.action.QS_TILE" />
  </intent-filter>
  <meta-data
    android:name="android.service.quicksettings.TOGGLE_TILE"
    android:value="true" />
</service>
```

### 4. Register the package

In your `MainApplication.kt`, add `QuickTilesPackage` to the packages list:

```kotlin
override fun getPackages(): List<ReactPackage> =
  PackageList(this).packages.apply {
    add(QuickTilesPackage())
  }
```

> **Note:** The user must manually drag the tile into their Quick Settings panel (or you can call `requestAddTile()` on Android 13+ to prompt them).

---

## Usage

```typescript
import {
  QuickTiles,
  TileState,
  RequestAddTileResult,
  QuickTilesErrorCode,
  type TileStatus,
} from '@iconifybeyond/react-native-quick-tiles';
```

### Set tile state

```typescript
// Set tile to active with a custom label and subtitle
await QuickTiles.setTile({
  label: 'My Feature',
  subtitle: 'Tap to toggle',   // Android 10+ only
  iconName: 'ic_quick_tile',   // drawable name in your app
  state: TileState.Active,
});

// Set tile to inactive
await QuickTiles.setTile({ state: TileState.Inactive });

// Make tile unavailable (greyed out)
await QuickTiles.setTile({ state: TileState.Unavailable });
```

### Get current tile state

```typescript
const status: TileStatus = await QuickTiles.getTile();
console.log(status.label, status.state, status.isAdded);
```

### Check if tile is added

```typescript
const added: boolean = await QuickTiles.isTileAdded();
```

### Listen for tile events

```typescript
import { useEffect } from 'react';
import { QuickTiles, TileState } from '@iconifybeyond/react-native-quick-tiles';

useEffect(() => {
  const clickSub = QuickTiles.onTileClick(() => {
    console.log('Tile was tapped!');
  });

  const addedSub = QuickTiles.onTileAdded(() => console.log('Tile added'));
  const removedSub = QuickTiles.onTileRemoved(() => console.log('Tile removed'));

  const listenSub = QuickTiles.addTileListener('startListening', () => {
    console.log('Tile became visible in the shade');
  });

  return () => {
    clickSub.remove();
    addedSub.remove();
    removedSub.remove();
    listenSub.remove();
  };
}, []);
```

### Click → toggle → update round trip

```typescript
const [isActive, setIsActive] = useState(false);

useEffect(() => {
  const sub = QuickTiles.onTileClick(async () => {
    const next = !isActive;
    setIsActive(next);
    await QuickTiles.setTile({
      label: next ? 'Feature ON' : 'Feature OFF',
      state: next ? TileState.Active : TileState.Inactive,
    });
  });
  return () => sub.remove();
}, [isActive]);
```

### Request add tile (Android 13+)

```typescript
import { QuickTiles, RequestAddTileResult } from '@iconifybeyond/react-native-quick-tiles';

const result = await QuickTiles.requestAddTile({
  label: 'My Tile',
  iconName: 'ic_quick_tile',
});

switch (result) {
  case RequestAddTileResult.Added:
    console.log('User added the tile!');
    break;
  case RequestAddTileResult.AlreadyAdded:
    console.log('Tile was already added');
    break;
  case RequestAddTileResult.NotAdded:
    console.log('User dismissed the prompt');
    break;
  case RequestAddTileResult.Unsupported:
    console.log('Device is below Android 13');
    break;
}
```

### Handle errors

```typescript
import { QuickTilesError, QuickTilesErrorCode } from '@iconifybeyond/react-native-quick-tiles';

try {
  await QuickTiles.setTile({ state: TileState.Active });
} catch (err) {
  if (err instanceof QuickTilesError) {
    switch (err.code) {
      case QuickTilesErrorCode.Unsupported:
        // Running on iOS or unsupported platform
        break;
      case QuickTilesErrorCode.NoActivity:
        // No foreground Activity (requestAddTile only)
        break;
      case QuickTilesErrorCode.Unknown:
        // Unexpected error
        break;
    }
  }
}
```

---

## API Reference

### `QuickTiles.setTile(config: TileConfig): Promise<void>`

Persists the tile configuration and immediately applies it if the tile is currently visible in the Quick Settings shade.

| Field | Type | Description |
|---|---|---|
| `label` | `string?` | Short label shown under the tile icon (max ~12 chars) |
| `subtitle` | `string?` | Subtitle below the label (Android 10 / API 29+ only) |
| `iconName` | `string?` | Name of a drawable resource in the host app |
| `state` | `TileStateValue?` | `'active'` \| `'inactive'` \| `'unavailable'` |

### `QuickTiles.getTile(): Promise<TileStatus>`

Returns the last-persisted tile configuration plus `isAdded: boolean`.

### `QuickTiles.isTileAdded(): Promise<boolean>`

Best-effort check whether the tile has been added to the user's Quick Settings panel.

### `QuickTiles.requestAddTile(options?): Promise<RequestAddTileResultValue>`

Android 13+ (API 33): Prompts the user to add the tile. On older devices resolves with `'unsupported'`.

### `QuickTiles.addTileListener(event, handler): EmitterSubscription`

Subscribe to a tile lifecycle event. Returns a subscription with a `.remove()` method.

**Events:**

| Event | Fires when |
|---|---|
| `'click'` | User taps the tile |
| `'added'` | User adds the tile to Quick Settings |
| `'removed'` | User removes the tile from Quick Settings |
| `'startListening'` | Tile becomes visible in the panel (panel opened) |
| `'stopListening'` | Tile is no longer visible (panel closed) |

### Convenience helpers

```typescript
QuickTiles.onTileClick(handler)          // → addTileListener('click', handler)
QuickTiles.onTileAdded(handler)          // → addTileListener('added', handler)
QuickTiles.onTileRemoved(handler)        // → addTileListener('removed', handler)
QuickTiles.onTileStartListening(handler) // → addTileListener('startListening', handler)
```

### Enums

```typescript
enum TileState { Active = 'active', Inactive = 'inactive', Unavailable = 'unavailable' }
enum RequestAddTileResult { Added = 'added', AlreadyAdded = 'already_added', NotAdded = 'not_added', Unsupported = 'unsupported' }
enum QuickTilesErrorCode { Unsupported = 'UNSUPPORTED', NoActivity = 'NO_ACTIVITY', Unknown = 'UNKNOWN' }
```

---

## Running the example app

```bash
# From the repo root:
yarn install
cd example
yarn install
yarn android
```

The example app demonstrates:
- Buttons to set the tile ACTIVE / INACTIVE / custom label / toggle
- A live event log showing incoming tile events
- "Request add tile" button (works on Android 13+)
- "Get current state" button showing the persisted tile config

---

## Roadmap

- [x] Declare and register a `TileService`
- [ ] Update tile label, subtitle, icon, and active/inactive state
- [ ] Listen for tile tap / add / remove events in JS
- [ ] Prompt the user to add the tile (Android 13+)
- [ ] Example app with click→toggle→update demo
- [ ] iOS no-op stub (graceful `UNSUPPORTED` rejection)
- [ ] End-to-end tests on a physical device
- [ ] Publish `0.1.0` to npm

---

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to get started.

---

## License

MIT © [iconifybeyond](https://github.com/iconifybeyond)
