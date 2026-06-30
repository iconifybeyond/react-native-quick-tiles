package com.iconifybeyond.quicktiles

import android.content.SharedPreferences

/**
 * Keys used in SharedPreferences to persist the tile state and "added" flag.
 */
internal object TilePrefs {
  const val PREFS_NAME = "rn_quick_tiles_prefs"

  const val KEY_LABEL = "tile_label"
  const val KEY_SUBTITLE = "tile_subtitle"
  const val KEY_ICON_NAME = "tile_icon_name"
  const val KEY_STATE = "tile_state"
  const val KEY_IS_ADDED = "tile_is_added"

  const val DEFAULT_STATE = "inactive"

  fun read(prefs: SharedPreferences): TileConfig {
    return TileConfig(
      label = prefs.getString(KEY_LABEL, "") ?: "",
      subtitle = prefs.getString(KEY_SUBTITLE, "") ?: "",
      iconName = prefs.getString(KEY_ICON_NAME, "") ?: "",
      state = prefs.getString(KEY_STATE, DEFAULT_STATE) ?: DEFAULT_STATE,
      isAdded = prefs.getBoolean(KEY_IS_ADDED, false),
    )
  }

  fun write(prefs: SharedPreferences, config: TileConfig) {
    prefs.edit()
      .putString(KEY_LABEL, config.label)
      .putString(KEY_SUBTITLE, config.subtitle)
      .putString(KEY_ICON_NAME, config.iconName)
      .putString(KEY_STATE, config.state)
      .putBoolean(KEY_IS_ADDED, config.isAdded)
      .apply()
  }
}

/** Simple data container for tile configuration. */
internal data class TileConfig(
  val label: String = "",
  val subtitle: String = "",
  val iconName: String = "",
  val state: String = TilePrefs.DEFAULT_STATE,
  val isAdded: Boolean = false,
)
