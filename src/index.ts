/**
 * QuickTiles public TypeScript API
 *
 * @module @iconifybeyond/react-native-quick-tiles
 */

import {
  NativeEventEmitter,
  NativeModules,
  Platform,
  type EmitterSubscription,
} from 'react-native';

// ─── Types & Enums ───────────────────────────────────────────────────────────

/**
 * The visual/interaction state of the Quick Settings tile.
 */
export enum TileState {
  /** The tile is on / active. Typically shown as a filled/coloured pill. */
  Active = 'active',
  /** The tile is off / inactive. Typically shown as a dimmed pill. */
  Inactive = 'inactive',
  /** The tile is unavailable (greyed out, not tappable). */
  Unavailable = 'unavailable',
}

/** A string-union alias for use in plain JS without the enum. */
export type TileStateValue = `${TileState}`;

/** Configuration object for setTile / requestAddTile. */
export interface TileConfig {
  /** Short label shown under the tile icon (max ~12 chars). */
  label?: string;
  /**
   * Subtitle shown below the label (Android 10 / API 29+).
   * Silently ignored on earlier OS versions.
   */
  subtitle?: string;
  /**
   * Name of a drawable resource in the host app's `res/drawable` folder.
   * Defaults to the icon declared in the manifest if omitted.
   */
  iconName?: string;
  /** Active / inactive / unavailable. Defaults to 'inactive'. */
  state?: TileStateValue;
}

/** Full tile state including server-side metadata. */
export interface TileStatus extends Required<TileConfig> {
  /** Whether the tile is currently in the user's Quick Settings panel. */
  isAdded: boolean;
}

/**
 * Result of requestAddTile().
 * Maps to StatusBarManager result codes on Android 13+.
 */
export enum RequestAddTileResult {
  /** The user confirmed adding the tile. */
  Added = 'added',
  /** The tile was already present in the user's panel. */
  AlreadyAdded = 'already_added',
  /** The user dismissed / denied the dialog. */
  NotAdded = 'not_added',
  /** Device is below Android 13 / API 33. */
  Unsupported = 'unsupported',
}

/** Union type for requestAddTile result strings. */
export type RequestAddTileResultValue = `${RequestAddTileResult}`;

/** Tile lifecycle events forwarded from Android TileService to JS. */
export type TileEvent =
  | 'click'
  | 'added'
  | 'removed'
  | 'startListening'
  | 'stopListening';

/** Error codes for QuickTilesError. */
export enum QuickTilesErrorCode {
  /** Platform is not Android (iOS, web, etc.) */
  Unsupported = 'UNSUPPORTED',
  /** An Activity is required but none is available. */
  NoActivity = 'NO_ACTIVITY',
  /** An unexpected error occurred. */
  Unknown = 'UNKNOWN',
}

/** Typed error thrown / rejected by QuickTiles methods. */
export class QuickTilesError extends Error {
  public readonly code: QuickTilesErrorCode;

  constructor(code: QuickTilesErrorCode, message: string) {
    super(message);
    this.name = 'QuickTilesError';
    this.code = code;
  }
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function unsupportedError(): QuickTilesError {
  return new QuickTilesError(
    QuickTilesErrorCode.Unsupported,
    'QuickTiles is only supported on Android.',
  );
}

/**
 * Lazily load the native module so importing this file on iOS
 * never throws — we only reject at call-time.
 */
function getNativeModule() {
  // Try the Turbo Module first (New Architecture).
  // Fall back to the legacy bridge module for Old Arch compat.
  const mod = require('./NativeQuickTiles').default ?? NativeModules.QuickTiles;
  return mod as import('./NativeQuickTiles').Spec | null;
}

function getModule(): import('./NativeQuickTiles').Spec {
  if (Platform.OS !== 'android') {
    throw unsupportedError();
  }
  const mod = getNativeModule();
  if (!mod) {
    throw new QuickTilesError(
      QuickTilesErrorCode.Unknown,
      'The native QuickTiles module is not available. ' +
        'Make sure the library is properly linked and you are running on Android.',
    );
  }
  return mod;
}

// ─── Event emitter (singleton, lazy) ─────────────────────────────────────────

let _emitter: NativeEventEmitter | null = null;

function getEmitter(): NativeEventEmitter | null {
  if (Platform.OS !== 'android') {
    return null;
  }
  if (!_emitter) {
    try {
      const mod = getNativeModule();
      if (mod) {
        _emitter = new NativeEventEmitter(mod);
      }
    } catch {
      // native module not available — swallow silently
    }
  }
  return _emitter;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Update the tile appearance and/or state.
 *
 * The new config is persisted to SharedPreferences so the TileService can
 * render it even when the JS context is not running. If the tile is currently
 * listening, it is refreshed immediately.
 *
 * @throws {QuickTilesError} with code UNSUPPORTED on non-Android platforms.
 */
async function setTile(config: TileConfig): Promise<void> {
  return getModule().setTile(config);
}

/**
 * Read the last-persisted tile state back from SharedPreferences.
 *
 * @throws {QuickTilesError} with code UNSUPPORTED on non-Android platforms.
 */
async function getTile(): Promise<TileStatus> {
  const raw = await getModule().getTile();
  return {
    label: raw.label,
    subtitle: raw.subtitle,
    iconName: raw.iconName,
    state: raw.state as TileStateValue,
    isAdded: raw.isAdded,
  };
}

/**
 * Best-effort check whether the tile has been added to the user's
 * Quick Settings panel.  Tracked via onTileAdded / onTileRemoved
 * lifecycle events persisted to SharedPreferences.
 *
 * @throws {QuickTilesError} with code UNSUPPORTED on non-Android platforms.
 */
async function isTileAdded(): Promise<boolean> {
  return getModule().isTileAdded();
}

/**
 * Android 13+ (API 33): Prompt the user to add the tile to their panel.
 * On older Android versions this resolves with `RequestAddTileResult.Unsupported`.
 *
 * @throws {QuickTilesError} with code UNSUPPORTED on non-Android platforms.
 * @throws {QuickTilesError} with code NO_ACTIVITY if no foreground Activity.
 */
async function requestAddTile(
  options: Pick<TileConfig, 'label' | 'iconName'> = {},
): Promise<RequestAddTileResultValue> {
  const raw = await getModule().requestAddTile(options);
  return raw as RequestAddTileResultValue;
}

/**
 * Subscribe to a tile lifecycle event.
 *
 * On non-Android platforms this is a no-op (returns a dummy subscription).
 *
 * @param event   One of: 'click' | 'added' | 'removed' | 'startListening' | 'stopListening'
 * @param handler Called when the event fires. The payload is event-specific
 *                (currently an empty object `{}` for all events).
 * @returns An EmitterSubscription you can call `.remove()` on to unsubscribe.
 */
function addTileListener(
  event: TileEvent,
  handler: (payload: Record<string, unknown>) => void,
): EmitterSubscription {
  const emitter = getEmitter();
  if (!emitter) {
    // Return a no-op subscription on non-Android platforms.
    return { remove: () => {} } as unknown as EmitterSubscription;
  }
  return emitter.addListener(event, handler);
}

// ─── Convenience helpers ──────────────────────────────────────────────────────

/**
 * Subscribe to tile tap events.
 * Convenience wrapper around `addTileListener('click', handler)`.
 */
function onTileClick(
  handler: (payload: Record<string, unknown>) => void,
): EmitterSubscription {
  return addTileListener('click', handler);
}

/**
 * Subscribe to the tile-added event (user added tile to Quick Settings).
 */
function onTileAdded(
  handler: (payload: Record<string, unknown>) => void,
): EmitterSubscription {
  return addTileListener('added', handler);
}

/**
 * Subscribe to the tile-removed event (user removed tile from Quick Settings).
 */
function onTileRemoved(
  handler: (payload: Record<string, unknown>) => void,
): EmitterSubscription {
  return addTileListener('removed', handler);
}

/**
 * Subscribe to the startListening event (tile becomes visible in the panel).
 */
function onTileStartListening(
  handler: (payload: Record<string, unknown>) => void,
): EmitterSubscription {
  return addTileListener('startListening', handler);
}

// ─── Namespace export ─────────────────────────────────────────────────────────

export const QuickTiles = {
  setTile,
  getTile,
  isTileAdded,
  requestAddTile,
  addTileListener,
  onTileClick,
  onTileAdded,
  onTileRemoved,
  onTileStartListening,
} as const;

// ─── Named exports ────────────────────────────────────────────────────────────

export {
  setTile,
  getTile,
  isTileAdded,
  requestAddTile,
  addTileListener,
  onTileClick,
  onTileAdded,
  onTileRemoved,
  onTileStartListening,
};
