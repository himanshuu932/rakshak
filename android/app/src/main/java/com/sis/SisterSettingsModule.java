// SisterSettingsModule.java
package com.sis; // <- change this to your actual package if different

import android.content.SharedPreferences;
import android.content.Context;
import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

/**
 * Separate prefs namespace for sister-specific data so original SettingsModule stays untouched.
 * Prefs name: "SisterPrefs"
 * - sister_list  : JSON array string of { phone, name, ... }
 * - lastLocation_<phone> : JSON string saved by receiver
 */
public class SisterSettingsModule extends ReactContextBaseJavaModule {
    private static final String PREFS_NAME = "SisterPrefs";
    private static final String KEY_SISTER_LIST = "sister_list";
    private static final String KEY_PREFIX_LAST_LOCATION = "lastLocation_";

    private final SharedPreferences prefs;

    public SisterSettingsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    @NonNull
    @Override
    public String getName() {
        return "SisterSettingsModule";
    }

    @ReactMethod
    public void setSisterList(String jsonList) {
        prefs.edit().putString(KEY_SISTER_LIST, jsonList).apply();
    }

    @ReactMethod
    public void getSisterList(Promise p) {
        try {
            String v = prefs.getString(KEY_SISTER_LIST, null);
            p.resolve(v);
        } catch (Exception e) {
            p.reject("ERR", e);
        }
    }

    @ReactMethod
    public void setLastLocation(String phone, String json) {
        if (phone == null) return;
        prefs.edit().putString(KEY_PREFIX_LAST_LOCATION + phone, json).apply();
    }

    @ReactMethod
    public void getLastLocation(String phone, Promise p) {
        try {
            if (phone == null) { p.resolve(null); return; }
            String v = prefs.getString(KEY_PREFIX_LAST_LOCATION + phone, null);
            p.resolve(v);
        } catch (Exception e) {
            p.reject("ERR", e);
        }
    }
}
