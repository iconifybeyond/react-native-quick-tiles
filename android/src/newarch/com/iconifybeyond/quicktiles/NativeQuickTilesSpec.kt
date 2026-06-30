package com.iconifybeyond.quicktiles

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableMap

/**
 * New Architecture base class for the QuickTiles native module.
 * On New Architecture, React Native codegen generates the actual spec;
 * this file is a compatibility shim that mirrors the same interface.
 */
abstract class NativeQuickTilesSpec(reactContext: ReactApplicationContext) :
  com.facebook.react.bridge.ReactContextBaseJavaModule(reactContext) {

  abstract fun setTile(options: ReadableMap, promise: Promise)
  abstract fun getTile(promise: Promise)
  abstract fun isTileAdded(promise: Promise)
  abstract fun requestAddTile(options: ReadableMap, promise: Promise)
  abstract fun addListener(eventName: String)
  abstract fun removeListeners(count: Double)
}
