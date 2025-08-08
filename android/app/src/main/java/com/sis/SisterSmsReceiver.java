package com.sis; // <<-- REPLACE with your actual package name

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;
import android.content.SharedPreferences;
import android.provider.Telephony;
import android.telephony.SmsMessage;

import org.json.JSONObject;

import com.facebook.react.ReactApplication;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * SisterSmsReceiver
 * - DOES NOT ignore messages when sister list is missing.
 * - Always saves incoming SMS (rawMessage) under sender keys.
 * - Tries to find a canonical sister phone (if sister_list exists) and also saves under that key.
 * - Emits SisterLocationReceived event always with rawMessage and parsed flag.
 */
public class SisterSmsReceiver extends BroadcastReceiver {
    private static final String TAG = "SisterSmsReceiver";
    private static final String PREFS_NAME = "SisterPrefs";
    private static final String KEY_SISTER_LIST = "sister_list";
    private static final String KEY_PREFIX_LAST_LOCATION = "lastLocation_";
    private static final String EVENT_NAME = "SisterLocationReceived";

    @Override
    public void onReceive(Context context, Intent intent) {
        try {
            if (!"android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) {
                return;
            }

            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String sisterJson = prefs.getString(KEY_SISTER_LIST, null);

            SmsMessage[] messages = Telephony.Sms.Intents.getMessagesFromIntent(intent);
            if (messages == null || messages.length == 0) {
                Log.d(TAG, "No SMS messages parsed from intent");
                return;
            }

            // combine multi-part
            StringBuilder bodyBuilder = new StringBuilder();
            String sender = null;
            for (SmsMessage msg : messages) {
                if (sender == null) sender = msg.getOriginatingAddress();
                String part = msg.getMessageBody();
                if (part != null) bodyBuilder.append(part);
            }
            String body = bodyBuilder.toString();
            Log.i(TAG, "onReceive sender=" + sender + " body=" + body);

            String senderNorm = normalizeNumber(sender);

            // Try to parse coordinates or map url
            org.json.JSONObject parsed = tryParseLocation(body);
            boolean hasParsed = (parsed != null && (parsed.has("mapUrl") || (parsed.has("latitude") && parsed.has("longitude"))));

            // Build save object (always includes rawMessage)
            org.json.JSONObject saveObj = new org.json.JSONObject();
            saveObj.put("rawMessage", body != null ? body : "");
            saveObj.put("timestamp", System.currentTimeMillis());
            saveObj.put("parsed", hasParsed);
            if (hasParsed) {
                if (parsed.has("mapUrl")) saveObj.put("mapUrl", parsed.getString("mapUrl"));
                if (parsed.has("latitude")) saveObj.put("latitude", parsed.getDouble("latitude"));
                if (parsed.has("longitude")) saveObj.put("longitude", parsed.getDouble("longitude"));
            } else {
                // fallback: if message contains any URL, save that as mapUrl
                Pattern urlPat = Pattern.compile("(https?://[^\\s]+)", Pattern.CASE_INSENSITIVE);
                Matcher urlM = urlPat.matcher(body != null ? body : "");
                if (urlM.find()) {
                    String url = urlM.group(1).replaceAll("[\\.,\\)]+$", "");
                    saveObj.put("mapUrl", url);
                    // still mark parsed true because we saved a URL fallback
                    saveObj.put("parsed", true);
                    hasParsed = true;
                }
            }

            // Always save under sender variants (so JS can find quickly)
            try {
                if (sender != null) prefs.edit().putString(KEY_PREFIX_LAST_LOCATION + sender, saveObj.toString()).apply();
                if (senderNorm != null && senderNorm.length() > 0) prefs.edit().putString(KEY_PREFIX_LAST_LOCATION + senderNorm, saveObj.toString()).apply();
            } catch (Exception e) {
                Log.w(TAG, "Saving sender keys failed", e);
            }

            // If a sister list exists, attempt to find canonical sister phone and also save under that canonical key
            try {
                if (sisterJson != null) {
                    org.json.JSONArray arr = new org.json.JSONArray(sisterJson);
                    for (int i = 0; i < arr.length(); i++) {
                        org.json.JSONObject s = arr.getJSONObject(i);
                        String phone = s.optString("phone", "");
                        if (phone != null && phone.length() > 0) {
                            String phoneNorm = normalizeNumber(phone);
                            if (phoneNorm.length() > 0) {
                                if (senderNorm.endsWith(phoneNorm) || phoneNorm.endsWith(senderNorm) ||
                                   senderNorm.contains(phoneNorm) || phoneNorm.contains(senderNorm)) {
                                    // found match — save under canonical form too
                                    prefs.edit().putString(KEY_PREFIX_LAST_LOCATION + phone, saveObj.toString()).apply();
                                    String canonicalNorm = normalizeNumber(phone);
                                    if (canonicalNorm != null && canonicalNorm.length() > 0) {
                                        prefs.edit().putString(KEY_PREFIX_LAST_LOCATION + canonicalNorm, saveObj.toString()).apply();
                                    }
                                    Log.i(TAG, "Matched canonical sister phone=" + phone + " for sender=" + sender);
                                    break; // save to first match, don't loop more
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                Log.w(TAG, "Checking sister list failed", e);
            }

            // Emit to JS: always emit rawMessage and parsed flag and parsed fields if available
            try {
                ReactContext reactContext = ((ReactApplication) context.getApplicationContext())
                        .getReactNativeHost()
                        .getReactInstanceManager()
                        .getCurrentReactContext();

                org.json.JSONObject emitObj = new org.json.JSONObject();
                emitObj.put("from", sender != null ? sender : "");
                emitObj.put("rawMessage", body != null ? body : "");
                emitObj.put("parsed", hasParsed);
                if (hasParsed) {
                    if (saveObj.has("mapUrl")) emitObj.put("mapUrl", saveObj.optString("mapUrl", ""));
                    if (saveObj.has("latitude")) emitObj.put("latitude", saveObj.optDouble("latitude"));
                    if (saveObj.has("longitude")) emitObj.put("longitude", saveObj.optDouble("longitude"));
                }

                if (reactContext != null) {
                    reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                            .emit(EVENT_NAME, emitObj.toString());
                    Log.i(TAG, "Emitted " + EVENT_NAME + " for " + sender + " parsed=" + hasParsed);
                } else {
                    Log.i(TAG, "ReactContext null - saved to prefs only for " + sender + " parsed=" + hasParsed);
                }
            } catch (Exception e) {
                Log.w(TAG, "Emit to JS failed", e);
            }
        } catch (Exception e) {
            Log.e(TAG, "SisterSmsReceiver onReceive exception", e);
        }
    }

    // same parsing helper as before
    private org.json.JSONObject tryParseLocation(String text) {
        if (text == null) return null;
        try {
            Pattern qPat = Pattern.compile("[?&]q=\\s*([-0-9\\.]+)\\s*,\\s*([-0-9\\.]+)", Pattern.CASE_INSENSITIVE);
            Matcher qM = qPat.matcher(text);
            if (qM.find()) {
                double lat = Double.parseDouble(qM.group(1));
                double lon = Double.parseDouble(qM.group(2));
                org.json.JSONObject out = new org.json.JSONObject();
                out.put("mapUrl", "https://maps.google.com/?q=" + lat + "," + lon);
                out.put("latitude", lat);
                out.put("longitude", lon);
                return out;
            }

            Pattern atPat = Pattern.compile("@\\s*(-?\\d{1,3}\\.\\d+)\\s*,\\s*(-?\\d{1,3}\\.\\d+)");
            Matcher atM = atPat.matcher(text);
            if (atM.find()) {
                double lat = Double.parseDouble(atM.group(1));
                double lon = Double.parseDouble(atM.group(2));
                org.json.JSONObject out = new org.json.JSONObject();
                out.put("mapUrl", "https://maps.google.com/?q=" + lat + "," + lon);
                out.put("latitude", lat);
                out.put("longitude", lon);
                return out;
            }

            Pattern decPat = Pattern.compile("(-?\\d{1,3}\\.\\d+)\\s*[,;]\\s*(-?\\d{1,3}\\.\\d+)");
            Matcher decM = decPat.matcher(text);
            if (decM.find()) {
                double lat = Double.parseDouble(decM.group(1));
                double lon = Double.parseDouble(decM.group(2));
                org.json.JSONObject out = new org.json.JSONObject();
                out.put("mapUrl", "https://maps.google.com/?q=" + lat + "," + lon);
                out.put("latitude", lat);
                out.put("longitude", lon);
                return out;
            }

            Pattern embedPat = Pattern.compile("!2d(-?\\d+\\.\\d+)!3d(-?\\d+\\.\\d+)");
            Matcher embedM = embedPat.matcher(text);
            if (embedM.find()) {
                double lon = Double.parseDouble(embedM.group(1));
                double lat = Double.parseDouble(embedM.group(2));
                org.json.JSONObject out = new org.json.JSONObject();
                out.put("mapUrl", "https://maps.google.com/?q=" + lat + "," + lon);
                out.put("latitude", lat);
                out.put("longitude", lon);
                return out;
            }

            Pattern urlPat = Pattern.compile("(https?://[^\\s]+)", Pattern.CASE_INSENSITIVE);
            Matcher urlM = urlPat.matcher(text);
            if (urlM.find()) {
                String url = urlM.group(1).replaceAll("[\\.,\\)]+$", "");
                String lo = url.toLowerCase();
                if (lo.contains("maps.google.com") || lo.contains("google.com/maps") || lo.contains("maps.app.goo.gl") || lo.contains("goo.gl/maps")) {
                    org.json.JSONObject out = new org.json.JSONObject();
                    out.put("mapUrl", url);
                    return out;
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "parse error", e);
        }
        return null;
    }

    private String normalizeNumber(String num) {
        if (num == null) return "";
        return num.replaceAll("[^0-9]", "");
    }
}
