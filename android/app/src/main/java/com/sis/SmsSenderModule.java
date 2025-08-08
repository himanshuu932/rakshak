package com.sis; // <-- REPLACE with your real package

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import android.telephony.SmsManager;
import android.util.Log;
import java.util.ArrayList;

public class SmsSenderModule extends ReactContextBaseJavaModule {
    private static final String TAG = "SmsSenderModule";

    public SmsSenderModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "SmsSender";
    }

    @ReactMethod
    public void sendSMS(String phoneNumber, String message, Callback successCallback, Callback errorCallback) {
        try {
            SmsManager smsManager = SmsManager.getDefault();
            // handle long message by splitting
            ArrayList<String> parts = smsManager.divideMessage(message);
            if (parts.size() > 1) {
                smsManager.sendMultipartTextMessage(phoneNumber, null, parts, null, null);
            } else {
                smsManager.sendTextMessage(phoneNumber, null, message, null, null);
            }
            successCallback.invoke(true);
        } catch (Exception e) {
            Log.e(TAG, "sendSMS error", e);
            errorCallback.invoke(e.getMessage());
        }
    }
}
