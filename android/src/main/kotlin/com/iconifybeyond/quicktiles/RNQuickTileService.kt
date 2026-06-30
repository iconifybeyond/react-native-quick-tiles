package com.iconifybeyond.quicktiles

import android.annotation.SuppressLint
import android.content.ComponentName
import android.graphics.drawable.Icon
import android.os.Build
import android.service.quicksettings.Tile
import android.service.quicksettings.TileService
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.lang.ref.WeakReference

/**
 * Base TileService subclass that library consumers can extend, or the
 * example app can use directly.
 *
 * To use this in your app:
 * 1. Create a subclass in your app (or use this class directly if your app
 *    package is willing to depend on the library internals).
 * 2. Declare it in your AndroidManifest.xml as shown in the README.
 *
 * This service:
 * - Reads persisted tile config from SharedPreferences in onStartListening()
 *   and applies it — so the tile renders correctly even when JS isn't running.
 * - Forwards tile lifecycle events (added / removed / click / startListening /
 *   stopListening) to JS via DeviceEventEmitter when a React context is alive.
 * - Handles the locked-screen case in onClick() by calling unlockAndRun {}.
 * - Keeps a companion-object weak reference so QuickTilesModule can trigger
 *   an immediate refresh without going through the system binder.
 */
open class RNQuickTileService : TileService() {

  companion object {
    /** Weak reference to the currently-bound (listening) service instance. */
    @SuppressLint("StaticFieldLeak")
    @Volatile
    internal var activeInstance: WeakReference<RNQuickTileService>? = null

    /** Weak reference to the React context (set by the module). */
    @SuppressLint("StaticFieldLeak")
    @Volatile
    internal var reactContextRef: WeakReference<ReactContext>? = null

    /** Emit an event to JS if a React context is currently alive. */
    internal fun emitEvent(eventName: String) {
      val ctx = reactContextRef?.get() ?: return
      if (!ctx.hasActiveReactInstance()) return
      ctx
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        ?.emit(eventName, null)
    }
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  override fun onTileAdded() {
    super.onTileAdded()
    val prefs = getSharedPreferences(TilePrefs.PREFS_NAME, MODE_PRIVATE)
    val current = TilePrefs.read(prefs)
    TilePrefs.write(prefs, current.copy(isAdded = true))
    emitEvent("added")
  }

  override fun onTileRemoved() {
    super.onTileRemoved()
    val prefs = getSharedPreferences(TilePrefs.PREFS_NAME, MODE_PRIVATE)
    val current = TilePrefs.read(prefs)
    TilePrefs.write(prefs, current.copy(isAdded = false))
    emitEvent("removed")
  }

  override fun onStartListening() {
    super.onStartListening()
    activeInstance = WeakReference(this)
    applyPersistedConfig()
    emitEvent("startListening")
  }

  override fun onStopListening() {
    super.onStopListening()
    if (activeInstance?.get() === this) {
      activeInstance = null
    }
    emitEvent("stopListening")
  }

  override fun onClick() {
    super.onClick()
    if (isLocked) {
      // Device is locked — request unlock, then handle the click.
      unlockAndRun { handleClick() }
    } else {
      handleClick()
    }
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  /**
   * Reads persisted config and applies it to the current QS tile.
   * Safe to call from any lifecycle method while the tile is bound.
   */
  internal fun applyPersistedConfig() {
    val tile = qsTile ?: return
    val prefs = getSharedPreferences(TilePrefs.PREFS_NAME, MODE_PRIVATE)
    val config = TilePrefs.read(prefs)

    tile.label = config.label.ifBlank { null }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && config.subtitle.isNotBlank()) {
      tile.subtitle = config.subtitle
    }

    if (config.iconName.isNotBlank()) {
      val resId = resources.getIdentifier(config.iconName, "drawable", packageName)
      if (resId != 0) {
        tile.icon = Icon.createWithResource(this, resId)
      }
    }

    tile.state = when (config.state) {
      "active" -> Tile.STATE_ACTIVE
      "unavailable" -> Tile.STATE_UNAVAILABLE
      else -> Tile.STATE_INACTIVE
    }

    tile.updateTile()
  }

  private fun handleClick() {
    emitEvent("click")
  }

  /**
   * Called by QuickTilesModule.requestListeningStateRefresh() to allow the
   * module to trigger a TileService rebind via the system without a direct
   * reference to an instance.
   *
   * @param componentName Fully-qualified name of the TileService component.
   */
  internal companion object RefreshHelper {
    /**
     * Ask the system to rebind the TileService so it re-reads prefs.
     * Uses [TileService.requestListeningState] (API 24+).
     */
    fun requestSystemRefresh(
      context: android.content.Context,
      componentName: ComponentName,
    ) {
      try {
        requestListeningState(context, componentName)
      } catch (_: Exception) {
        // Silently ignore — the tile will refresh on its own next time the
        // shade is opened.
      }
    }
  }
}
