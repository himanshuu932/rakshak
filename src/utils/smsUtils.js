// utils/smsUtils.js
import { PermissionsAndroid, Platform, NativeModules } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

const { SmsSender } = NativeModules;

export const requestPermissions = async (permissions = []) => {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.requestMultiple(permissions);
    return Object.values(granted).every(
      (s) => s === PermissionsAndroid.RESULTS.GRANTED
    );
  } catch (e) {
    console.warn('Permission request error', e);
    return false;
  }
};

export const sendSms = (phone, text) =>
  new Promise((resolve, reject) => {
    if (!SmsSender || !SmsSender.sendSMS) {
      return reject('SmsSender native module not available');
    }
    SmsSender.sendSMS(
      String(phone),
      String(text),
      (r) => resolve(r),
      (err) => reject(err)
    );
  });

export const sendCurrentLocation = (recipient) =>
  new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const mapUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
        const message = `My current location: ${mapUrl}`;
        try {
          await sendSms(recipient, message);
          resolve({
            success: true,
            latitude,
            longitude,
            mapUrl,
            timestamp: Date.now(),
          });
        } catch (e) {
          reject(e);
        }
      },
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  });
