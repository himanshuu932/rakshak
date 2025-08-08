package com.sis;

import android.content.SharedPreferences;
import android.content.Context;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class SettingsModule extends ReactContextBaseJavaModule {
    private static final String PREFS_NAME = "ResponderSettings";
    private static final String KEY_NUMBER = "trusted_number";
    private static final String KEY_KEYWORD = "secret_keyword";
    private final SharedPreferences prefs;

    public SettingsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    @Override
    public String getName() {
        return "SettingsModule";
    }

    @ReactMethod
    public void setTrustedNumber(String number) {
        prefs.edit().putString(KEY_NUMBER, number).apply();
    }

    @ReactMethod
    public void setSecretKeyword(String keyword) {
        prefs.edit().putString(KEY_KEYWORD, keyword).apply();
    }
}
