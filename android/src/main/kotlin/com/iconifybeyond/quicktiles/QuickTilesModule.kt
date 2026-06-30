package com.iconifybeyond.quicktiles

import android.app.StatusBarManager
import android.content.ComponentName
import android.graphics.drawable.Icon
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableNativeMap
import java.lang.ref.WeakReference
import java.util.concurrent.Executor

/**
 * Implementation of the QuickTiles Turbo Module.
 *
 * This class is the bridge between the JS layer and the Android
 * Quick Settings Tile API.  It:
 *  - Persists tile config to SharedPreferences.
 *  - Triggers a live tile refresh when the TileService is active.
 *  - Handles requestAddTile (API 33+).
 *  - Wires up the React event emitter for tile lifecycle events.
 */
class QuickTilesModule(reactContext: ReactApplicationContext) :
  NativeQuickTilesSpec(reactContext) {

  init {
    // Give the TileService companion a weak ref to our React context so it can
    // emit events back to JS.
    RNQuickTileService.reactContextRef = WeakReference(reactContext)
  }

  override fun getName(): String = NAME

  // ── setTile ──────────────────────────────────────────────────────────────

  @ReactMethod
  override fun setTile(options: ReadableMap, promise: Promise) {
    try {
      val prefs = reactApplicationContext
        .getSharedPreferences(TilePrefs.PREFS_NAME, android.content.Context.MODE_PRIVATE)
      val current = TilePrefs.read(prefs)
      val updated = current.copy(
        label = if (options.hasKey("label")) options.getString("label") ?: current.label else current.label,
        subtitle = if (options.hasKey("subtitle")) options.getString("subtitle") ?: current.subtitle else current.subtitle,
        iconName = if (options.hasKey("iconName")) options.getString("iconName") ?: current.iconName else current.iconName,
        state = if (options.hasKey("state")) options.getString("state") ?: current.state else current.state,
      )
      TilePrefs.write(prefs, updated)

      // If the service is currently listening, apply immediately.
      val service = RNQuickTileService.activeInstance?.get()
      if (service != null) {
        service.applyPersistedConfig()
      } else {
        // Ask the system to rebind the service so it re-reads prefs.
        tryRequestListeningRefresh()
      }

      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("UNKNOWN", e.message ?: "setTile failed", e)
    }
  }

  // ── getTile ───────────────────────────────────────────────────────────────

  @ReactMethod
  override fun getTile(promise: Promise) {
    try {
      val prefs = reactApplicationContext
        .getSharedPreferences(TilePrefs.PREFS_NAME, android.content.Context.MODE_PRIVATE)
      val config = TilePrefs.read(prefs)
      val map = WritableNativeMap().apply {
        putString("label", config.label)
        putString("subtitle", config.subtitle)
        putString("iconName", config.iconName)
        putString("state", config.state)
        putBoolean("isAdded", config.isAdded)
      }
      promise.resolve(map)
    } catch (e: Exception) {
      promise.reject("UNKNOWN", e.message ?: "getTile failed", e)
    }
  }

  // ── isTileAdded ───────────────────────────────────────────────────────────

  @ReactMethod
  override fun isTileAdded(promise: Promise) {
    try {
      val prefs = reactApplicationContext
        .getSharedPreferences(TilePrefs.PREFS_NAME, android.content.Context.MODE_PRIVATE)
      promise.resolve(prefs.getBoolean(TilePrefs.KEY_IS_ADDED, false))
    } catch (e: Exception) {
      promise.reject("UNKNOWN", e.message ?: "isTileAdded failed", e)
    }
  }

  // ── requestAddTile ────────────────────────────────────────────────────────

  @ReactMethod
  override fun requestAddTile(options: ReadableMap, promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
      promise.resolve("unsupported")
      return
    }

    val activity = currentActivity
    if (activity == null) {
      promise.reject("NO_ACTIVITY", "No foreground Activity available for requestAddTile.")
      return
    }

    try {
      val label = if (options.hasKey("label")) options.getString("label") else null
      val iconName = if (options.hasKey("iconName")) options.getString("iconName") else null

      // Resolve icon — use provided iconName, else fall back to a generic Android icon.
      val icon: Icon = if (!iconName.isNullOrBlank()) {
        val resId = activity.resources.getIdentifier(iconName, "drawable", activity.packageName)
        if (resId != 0) {
          Icon.createWithResource(activity, resId)
        } else {
          Icon.createWithResource(activity, android.R.drawable.ic_menu_preferences)
        }
      } else {
        Icon.createWithResource(activity, android.R.drawable.ic_menu_preferences)
      }

      // Default to app label if no label provided.
      val tileLabel = label ?: activity.applicationInfo.loadLabel(activity.packageManager).toString()

      // Component name for the TileService — derive from the app package.
      // Consumers must declare their TileService subclass (RNQuickTileService or their own).
      val componentName = ComponentName(
        activity.packageName,
        "${activity.packageName}.QuickTileService",
      )

      @Suppress("NewApi") // Guarded by Build.VERSION.SDK_INT check above
      val statusBarManager = activity.getSystemService(StatusBarManager::class.java)
      val executor: Executor = activity.mainExecutor

      @Suppress("NewApi")
      statusBarManager.requestAddTileService(
        componentName,
        tileLabel,
        icon,
        executor,
      ) { resultCode ->
        when (resultCode) {
          StatusBarManager.TILE_ADD_REQUEST_RESULT_TILE_ADDED -> promise.resolve("added")
          StatusBarManager.TILE_ADD_REQUEST_RESULT_TILE_ALREADY_ADDED -> promise.resolve("already_added")
          StatusBarManager.TILE_ADD_REQUEST_RESULT_TILE_NOT_ADDED -> promise.resolve("not_added")
          else -> promise.resolve("not_added")
        }
      }
    } catch (e: Exception) {
      promise.reject("UNKNOWN", e.message ?: "requestAddTile failed", e)
    }
  }

  // ── NativeEventEmitter boilerplate ─────────────────────────────────────────

  @ReactMethod
  override fun addListener(eventName: String) {
    // Required by NativeEventEmitter — no-op (events are emitted imperatively).
  }

  @ReactMethod
  override fun removeListeners(count: Double) {
    // Required by NativeEventEmitter — no-op.
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  private fun tryRequestListeningRefresh() {
    val ctx = reactApplicationContext
    // Best-effort: try the app's QuickTileService component name.
    val componentName = ComponentName(
      ctx.packageName,
      "${ctx.packageName}.QuickTileService",
    )
    RNQuickTileService.requestSystemRefresh(ctx, componentName)
  }

  companion object {
    const val NAME = "QuickTiles"
  }
}
