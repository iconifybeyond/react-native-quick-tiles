# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - Unreleased

### Added

- Initial scaffold of `@iconifybeyond/react-native-quick-tiles`
- TypeScript public API: `setTile`, `getTile`, `isTileAdded`, `requestAddTile`
- Event listener API: `addTileListener`, `onTileClick`, `onTileAdded`, `onTileRemoved`, `onTileStartListening`
- Typed enums: `TileState`, `RequestAddTileResult`, `QuickTilesErrorCode`
- Typed error class `QuickTilesError` with error codes
- Kotlin implementation of `QuickTilesModule` (Turbo Module / New Architecture)
- `RNQuickTileService` base class (extend in your app)
- `SharedPreferences`-based tile state persistence (renders correctly even when JS context is not running)
- Tile lifecycle events forwarded to JS via `DeviceEventEmitter`
- `requestAddTile` with Android 13+ (API 33) guard
- Graceful iOS degradation (all methods reject with `UNSUPPORTED`)
- Example app with click→toggle→update demo and live event log
- GitHub Actions CI (typecheck + lint + build)
- MIT License
