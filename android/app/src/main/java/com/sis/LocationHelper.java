package com.sis;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.Context;
import android.content.pm.PackageManager;
import android.telephony.SmsManager;
import android.util.Log;
import androidx.core.app.ActivityCompat;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;
import java.util.ArrayList;

public class LocationHelper {
    private static final String TAG = "LocationHelper";

    @SuppressLint("MissingPermission")
    public static void sendCurrentLocation(Context context, String recipientPhoneNumber) {
        // First, check if we have location permission
        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            Log.e(TAG, "Location permission not granted. Cannot send location.");
            return;
        }

        FusedLocationProviderClient fusedLocationClient = LocationServices.getFusedLocationProviderClient(context);

        fusedLocationClient.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, null)
            .addOnSuccessListener(location -> {
                if (location != null) {
                    double lat = location.getLatitude();
                    double lon = location.getLongitude();
                    String mapUrl = "https://maps.google.com/?q=" + lat + "," + lon;
                    String message = "Here is my current location: " + mapUrl;
                    sendSms(recipientPhoneNumber, message);
                } else {
                    Log.e(TAG, "Could not get location. GPS might be off.");
                    sendSms(recipientPhoneNumber, "Could not get location. Please ensure GPS is enabled.");
                }
            })
            .addOnFailureListener(e -> {
                Log.e(TAG, "Failed to get location: " + e.getMessage());
                sendSms(recipientPhoneNumber, "Failed to get location due to an error.");
            });
    }

    // Internal SMS sending function
    private static void sendSms(String phoneNumber, String message) {
        try {
            SmsManager smsManager = SmsManager.getDefault();
            ArrayList<String> parts = smsManager.divideMessage(message);
            smsManager.sendMultipartTextMessage(phoneNumber, null, parts, null, null);
            Log.d(TAG, "Reply SMS sent to " + phoneNumber);
        } catch (Exception e) {
            Log.e(TAG, "Failed to send reply SMS", e);
        }
    }
}
