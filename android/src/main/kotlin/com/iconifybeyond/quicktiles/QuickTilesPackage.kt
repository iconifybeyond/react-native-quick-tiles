package com.iconifybeyond.quicktiles

import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.TurboReactPackage

class QuickTilesPackage : TurboReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return if (name == QuickTilesModule.NAME) {
      QuickTilesModule(reactContext)
    } else {
      null
    }
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      mapOf(
        QuickTilesModule.NAME to ReactModuleInfo(
          QuickTilesModule.NAME,
          QuickTilesModule.NAME,
          false, // canOverrideExistingModule
          false, // needsEagerInit
          false, // isCxxModule
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED, // isTurboModule
        ),
      )
    }
  }
}
