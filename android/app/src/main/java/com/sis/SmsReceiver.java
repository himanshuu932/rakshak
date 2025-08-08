// SmsReceiver.java
package com.sis;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class SmsReceiver extends BroadcastReceiver {
    private static final String TAG = "SmsReceiver";
    private static final String PREFS_NAME = "ResponderSettings";
    private static final String KEY_TRUSTED_LIST = "trusted_list";

    @Override
    public void onReceive(Context context, Intent intent) {
        if ("android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) {
            Bundle bundle = intent.getExtras();
            if (bundle != null) {
                Object[] pdus = (Object[]) bundle.get("pdus");
                if (pdus != null) {
                    for (Object pdu : pdus) {
                        SmsMessage smsMessage = SmsMessage.createFromPdu((byte[]) pdu);
                        String sender = smsMessage.getOriginatingAddress();
                        String messageBody = smsMessage.getMessageBody();

                        Log.d(TAG, "SMS received from: " + sender + " body: " + messageBody);

                        // Load trusted list JSON from prefs
                        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                        String jsonList = prefs.getString(KEY_TRUSTED_LIST, null);

                        if (jsonList == null || jsonList.length() == 0) {
                            Log.d(TAG, "No trusted list configured.");
                            continue;
                        }

                        try {
                            JSONArray arr = new JSONArray(jsonList);
                            boolean matched = false;

                            for (int i = 0; i < arr.length(); i++) {
                                JSONObject obj = arr.getJSONObject(i);
                                String phone = obj.optString("phone", "");
                                String keyword = obj.optString("keyword", "");

                                // Basic null/empty checks
                                if (phone.length() == 0 || keyword.length() == 0) continue;

                                // Match sender and keyword (case-insensitive for keyword)
                                if (sender != null && sender.contains(phone) &&
                                        messageBody != null && messageBody.toUpperCase().contains(keyword.toUpperCase())) {
                                    Log.d(TAG, "Trusted sender & matching keyword found for phone: " + phone);
                                    // Send location back to the sender
                                    LocationHelper.sendCurrentLocation(context, sender);
                                    matched = true;
                                    break; // stop after first match
                                }
                            }

                            if (!matched) {
                                Log.d(TAG, "No matching trusted entry for this message.");
                            }

                        } catch (JSONException e) {
                            Log.e(TAG, "Invalid trusted list JSON", e);
                        }
                    }
                }
            }
        }
    }
}
