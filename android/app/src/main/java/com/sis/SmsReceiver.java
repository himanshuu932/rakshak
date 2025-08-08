package com.sis;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;

public class SmsReceiver extends BroadcastReceiver {
    private static final String TAG = "SmsReceiver";
    private static final String PREFS_NAME = "ResponderSettings";
    private static final String KEY_NUMBER = "trusted_number";
    private static final String KEY_KEYWORD = "secret_keyword";

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

                        Log.d(TAG, "SMS received from: " + sender);

                        // Get saved settings
                        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                        String trustedNumber = prefs.getString(KEY_NUMBER, "");
                        String secretKeyword = prefs.getString(KEY_KEYWORD, "FINDSIS"); // Default keyword

                        // Check if sender is trusted and keyword matches
                        if (sender != null && trustedNumber.length() > 0 && sender.contains(trustedNumber) && messageBody.toUpperCase().contains(secretKeyword.toUpperCase())) {
                            Log.d(TAG, "Trusted sender and keyword match! Calling LocationHelper.");
                            // If trusted, get location and send it back
                            LocationHelper.sendCurrentLocation(context, sender);
                        } else {
                            // If not from a trusted number, log it.
                            // We don't send an alert back to avoid spamming unknown numbers.
                            Log.d(TAG, "Message received from untrusted number or with incorrect keyword. Ignoring.");
                        }
                    }
                }
            }
        }
    }
}
