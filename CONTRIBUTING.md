# Contributing to @iconifybeyond/react-native-quick-tiles

Thank you for your interest in contributing! This is an early-stage library and contributions of all kinds are welcome — bug reports, feature requests, documentation improvements, and code changes.

## Getting started

### Prerequisites

- Node.js 18+
- JDK 17
- Android SDK (API 24+)
- Yarn (preferred) or npm

### Setup

```bash
git clone https://github.com/iconifybeyond/react-native-quick-tiles.git
cd react-native-quick-tiles
yarn install
```

### Build the library

```bash
yarn build
```

### Typecheck

```bash
yarn typecheck
```

### Lint

```bash
yarn lint
```

### Run the example app

```bash
cd example
yarn install
yarn android
```

## Project structure

```
react-native-quick-tiles/
├── src/                        # TypeScript source
│   ├── NativeQuickTiles.ts     # Turbo Module spec (codegen interface)
│   └── index.ts                # Public JS/TS API
├── android/                    # Native Android (Kotlin) implementation
│   └── src/main/kotlin/com/iconifybeyond/quicktiles/
│       ├── QuickTilesModule.kt    # Turbo Module implementation
│       ├── QuickTilesPackage.kt   # React package registration
│       ├── RNQuickTileService.kt  # Base TileService subclass
│       └── TilePrefs.kt           # SharedPreferences helpers
├── example/                    # Example React Native app
│   ├── src/App.tsx
│   └── android/
└── lib/                        # Built output (gitignored)
```

## Reporting issues

Please use [GitHub Issues](https://github.com/iconifybeyond/react-native-quick-tiles/issues). Include:

- OS version and Android API level
- React Native version
- A minimal reproduction

## Pull requests

1. Fork the repo and create a feature branch.
2. Make your changes with clear commit messages.
3. Ensure `yarn typecheck` and `yarn lint` pass.
4. Test on a physical Android device or emulator if changing native code.
5. Open a PR with a clear description.

## Code style

- TypeScript: strict mode, no `any` on public surface.
- Kotlin: idiomatic Kotlin, handle nulls defensively.
- Prettier + ESLint are enforced (run `yarn lint`).

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
