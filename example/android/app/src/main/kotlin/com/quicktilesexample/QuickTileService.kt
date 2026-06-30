package com.quicktilesexample

import com.iconifybeyond.quicktiles.RNQuickTileService

/**
 * Example TileService implementation.
 *
 * Extend RNQuickTileService to get all the built-in behaviour:
 * - Reads persisted config from SharedPreferences in onStartListening()
 * - Forwards lifecycle events to JS via DeviceEventEmitter
 * - Handles the locked-screen case in onClick()
 *
 * You can override any of the lifecycle methods to add custom behaviour.
 */
class QuickTileService : RNQuickTileService()
