/**
 * NativeQuickTiles.ts
 *
 * Turbo Module spec for the QuickTiles native module.
 * This file is processed by React Native codegen to generate
 * native type-safe bindings.
 *
 * NOTE: Method signatures must be codegen-friendly:
 * - Use only primitives, objects of primitives, arrays, and Promise<...>
 * - Avoid complex generics or union types at the spec boundary
 */

import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * Codegen-friendly tile config object.
 * All fields optional so callers can do partial updates.
 */
export interface TileOptions {
  label?: string;
  subtitle?: string;
  /** Name of a drawable resource in the app's res/drawable folder */
  iconName?: string;
  /**
   * Tile state string: 'active' | 'inactive' | 'unavailable'
   * Serialised as a string so codegen can handle it.
   */
  state?: string;
}

/**
 * Codegen-friendly tile state object returned by getTile().
 */
export interface NativeTileState {
  label: string;
  subtitle: string;
  iconName: string;
  /** 'active' | 'inactive' | 'unavailable' */
  state: string;
  /** Whether the tile has been added to the user's Quick Settings panel */
  isAdded: boolean;
}

/**
 * Options for requestAddTile.
 */
export interface RequestAddTileOptions {
  label?: string;
  iconName?: string;
}

export interface Spec extends TurboModule {
  /**
   * Persist + (if active) update the current tile appearance/state.
   */
  setTile(options: TileOptions): Promise<void>;

  /**
   * Read back the last persisted tile state.
   */
  getTile(): Promise<NativeTileState>;

  /**
   * Best-effort check whether the tile has been added to Quick Settings.
   * Tracked via onTileAdded/onTileRemoved lifecycle persisted to SharedPreferences.
   */
  isTileAdded(): Promise<boolean>;

  /**
   * Android 13+ (API 33): Prompt the user to add the tile.
   * Resolves with a result string:
   *   'added' | 'already_added' | 'not_added' | 'unsupported'
   */
  requestAddTile(options: RequestAddTileOptions): Promise<string>;

  /**
   * Required by NativeEventEmitter for Turbo Module event subscriptions.
   */
  addListener(eventName: string): void;

  /**
   * Required by NativeEventEmitter for Turbo Module event subscriptions.
   */
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('QuickTiles');
