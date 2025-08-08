// SettingsModule.java
package com.sis;

import android.content.SharedPreferences;
import android.content.Context;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class SettingsModule extends ReactContextBaseJavaModule {
    private static final String PREFS_NAME = "ResponderSettings";
    private static final String KEY_TRUSTED_LIST = "trusted_list"; // JSON array string
    private final SharedPreferences prefs;

    public SettingsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    @Override
    public String getName() {
        return "SettingsModule";
    }

    /**
     * Replace the whole trusted list. `jsonList` should be a JSON array string
     * like: [{"phone":"+9112345","keyword":"CODE1"},{"phone":"+9199999","keyword":"SIS"}]
     */
    @ReactMethod
    public void setTrustedList(String jsonList) {
        prefs.edit().putString(KEY_TRUSTED_LIST, jsonList).apply();
    }

    // Optional helper methods (not required by JS, but kept for completeness)
    @ReactMethod
    public void clearTrustedList() {
        prefs.edit().remove(KEY_TRUSTED_LIST).apply();
    }
}
