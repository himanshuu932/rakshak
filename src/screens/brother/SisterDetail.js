// screens/brother/SisterDetail.js
import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Button,
  StyleSheet,
  Linking,
  Alert,
  DeviceEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import { sendSms, requestPermissions } from '../../utils/smsUtils';

const SECRET_CODES_KEY = 'secretCodes';
const SisterSettings = NativeModules.SisterSettingsModule || null;
const EVENT_NAME = 'SisterLocationReceived';

// sleep helper
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

export default function SisterDetail({ route }) {
  const { sister } = route.params; // { name, phone, code? }
  const [status, setStatus] = useState('Idle');
  const [lastLocation, setLastLocation] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(0);
  const pollRef = useRef(null);
  const POLL_INTERVAL_MS = 2000;
  const POLL_TIMEOUT_MS = 60 * 1000;

  const webKey =
    lastLocation && lastLocation.latitude && lastLocation.longitude
      ? `${lastLocation.latitude}-${lastLocation.longitude}-${lastLocation.timestamp || ''}`
      : lastLocation && lastLocation.mapUrl
      ? `url-${(lastLocation.mapUrl || '').slice(0, 40)}-${lastLocation.timestamp || ''}`
      : 'no-loc';

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'android') {
        await requestRuntimeSmsPermissions();
      }
      await loadLastLocationWithFallbacks();
    })();

    const sub = DeviceEventEmitter.addListener(EVENT_NAME, async (payload) => {
      try {
        const obj = typeof payload === 'string' ? JSON.parse(payload) : payload;
        console.log('SisterDetail: received event', obj);

        const from = obj.from || '';
        const canonicalPhone = obj.canonicalPhone || null;
        const rawMessage = obj.rawMessage || '';
        const incomingTs = obj.timestamp || Date.now();
        const incomingParsed = obj.parsed || false;
        const incomingLat = obj.latitude ?? null;
        const incomingLon = obj.longitude ?? null;
        const incomingMapUrl = obj.mapUrl ?? null;

        // decide if this event is for this sister
        const matchesCanonical = canonicalPhone && phonesMatch(canonicalPhone, sister.phone);
        const matchesFrom = phonesMatch(from, sister.phone);

        if (!matchesCanonical && !matchesFrom) {
          console.log('SisterDetail: event not for this sister - ignoring', { from, canonicalPhone, sisterPhone: sister.phone });
          return;
        }

        // If incoming timestamp older than currently displayed -> ignore
        if (lastLocation && lastLocation.timestamp && incomingTs <= lastLocation.timestamp) {
          console.log('SisterDetail: incoming is not newer - ignoring', { incomingTs, currentTs: lastLocation.timestamp });
          // still refresh native prefs to be safe (but only if different) — wait 2s then call
          await sleep(2000);
          await handleRefreshFromNativeIfNewer(incomingTs);
          return;
        }

        // If incoming has parsed coords/mapUrl -> persist + show
        if ((incomingLat !== null && incomingLon !== null) || incomingMapUrl) {
          const payloadToSave = {
            latitude: incomingLat,
            longitude: incomingLon,
            mapUrl: incomingMapUrl,
            rawMessage,
            timestamp: incomingTs,
          };
          await persistAndSet(payloadToSave);
          setStatus('Location received (native event).');
          setLastUpdatedAt(Date.now());
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }

          // ALSO refresh from native prefs to get canonical/native-saved version (auto, bypass button)
          await sleep(2000);
          await handleRefreshFromNative();
          return;
        }

        // If native didn't parse but rawMessage exists -> try JS parsing
        if (rawMessage) {
          const parsed = parseLocationFromText(rawMessage);
          if (parsed) {
            const enriched = { ...parsed, rawMessage, timestamp: incomingTs };
            await persistAndSet(enriched);
            setStatus('Parsed location from message (JS).');
            setLastUpdatedAt(Date.now());
            if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }

            // After JS parse & persist, refresh native prefs too (to keep them synced)
            await sleep(2000);
            await handleRefreshFromNative();
          } else {
            // JS couldn't parse: delete raw message from AsyncStorage (user requested behavior)
            await removeRawMessageStored();
            setStatus('Message received but no URL/coords — raw message removed.');
            setLastUpdatedAt(Date.now());
            if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }

            // still try refresh native prefs (maybe native has stored something)
            await sleep(2000);
            await handleRefreshFromNative();
          }
        } else {
          // no raw message present in payload — still refresh native prefs to be safe
          await sleep(2000);
          await handleRefreshFromNative();
        }
      } catch (e) {
        console.warn('SisterDetail event handler error', e);
      }
    });

    return () => {
      if (sub && sub.remove) sub.remove();
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastLocation]); // include lastLocation so incomingTs comparison sees updates

  /* ---------------- Helpers ---------------- */
  const requestRuntimeSmsPermissions = async () => {
    try {
      const perms = [
        'android.permission.RECEIVE_SMS',
        'android.permission.READ_SMS',
        'android.permission.SEND_SMS',
      ];
      const ok = await requestPermissions(perms);
      if (!ok) setStatus('SMS permissions not granted — receiving may be blocked.');
      return ok;
    } catch (e) {
      console.warn('requestRuntimeSmsPermissions error', e);
      return false;
    }
  };

  const normalizePhone = (p = '') => (p || '').replace(/[^0-9]/g, '');
  const phonesMatch = (a = '', b = '') => {
    const na = normalizePhone(a || '');
    const nb = normalizePhone(b || '');
    if (!na || !nb) return false;
    return na === nb || na.endsWith(nb) || nb.endsWith(na) || na.includes(nb) || nb.includes(na);
  };

  const persistAndSet = async (payload) => {
    try {
      const key = `lastLocation_${sister.phone}`;
      await AsyncStorage.setItem(key, JSON.stringify(payload));
      setLastLocation(payload);
    } catch (e) {
      console.warn('persistAndSet error', e);
    }

    try {
      if (SisterSettings && SisterSettings.setLastLocation) {
        await SisterSettings.setLastLocation(sister.phone, JSON.stringify(payload));
      }
    } catch (e) {
      // ignore native persist failure
    }
  };

  const removeRawMessageStored = async () => {
    try {
      const key = `lastLocation_${sister.phone}`;
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!hasCoordsOrUrl(parsed)) {
          await AsyncStorage.removeItem(key);
          setLastLocation(null);
        }
      }
    } catch (e) {
      console.warn('removeRawMessageStored error', e);
    }
  };

  const hasCoordsOrUrl = (obj) => {
    if (!obj) return false;
    if ((obj.latitude || obj.latitude === 0) && (obj.longitude || obj.longitude === 0)) return true;
    if (obj.mapUrl) return true;
    return false;
  };

  /* ---------------- Load fallback (on mount) ---------------- */
  const loadLastLocationWithFallbacks = async () => {
    try {
      // direct key
      const direct = await AsyncStorage.getItem(`lastLocation_${sister.phone}`);
      if (direct) {
        const parsed = JSON.parse(direct);
        setLastLocation(parsed);
        setStatus('Loaded saved location.');
           // Run a refresh from native prefs after 2 seconds (non-blocking)
      setTimeout(async () => {
        try {
          await handleRefreshFromNative();
        } catch (e) {
          console.warn('handleRefreshFromNative error', e);
        }
      }, 2000);
        return;
      }

      // scan keys (sender variants)
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        const lastKeys = allKeys.filter((k) => k && k.startsWith('lastLocation_'));
        for (const k of lastKeys) {
          const suffix = k.substring('lastLocation_'.length);
          if (phonesMatch(suffix, sister.phone)) {
            const raw = await AsyncStorage.getItem(k);
            if (raw) {
              const parsed = JSON.parse(raw);
              await AsyncStorage.setItem(`lastLocation_${sister.phone}`, JSON.stringify(parsed));
              setLastLocation(parsed);
              setStatus('Loaded saved location (found under variant).');
              return;
            }
          }
        }
      } catch (e) {
        console.warn('AsyncStorage scan failed', e);
      }

      // try native SisterSettingsModule (variants)
      if (SisterSettings && SisterSettings.getLastLocation) {
        const candidates = [
          sister.phone,
          normalizePhone(sister.phone),
          (sister.phone || '').replace(/^\+/, ''),
        ];
        for (const candidate of candidates) {
          if (!candidate) continue;
          try {
            const nativeVal = await SisterSettings.getLastLocation(candidate);
            if (nativeVal) {
              const parsed = typeof nativeVal === 'string' ? JSON.parse(nativeVal) : nativeVal;
              await AsyncStorage.setItem(`lastLocation_${sister.phone}`, JSON.stringify(parsed));
              setLastLocation(parsed);
              setStatus('Loaded saved location from native prefs.');
              return;
            }
          } catch (e) { /* ignore candidate error */ }
        }
      }

      setStatus('No saved location found.');
    } catch (e) {
      console.warn('loadLastLocationWithFallbacks error', e);
    }
  };

  /* ---------------- Polling fallback ---------------- */
  const pollForLocation = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    const started = Date.now();
    pollRef.current = setInterval(async () => {
      try {
        if (Date.now() - started > POLL_TIMEOUT_MS) {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setStatus('Timed out waiting for reply.');
          return;
        }

        const direct = await AsyncStorage.getItem(`lastLocation_${sister.phone}`);
        if (direct) {
          const parsed = JSON.parse(direct);
          // if it's raw and needs parsing, try; otherwise set
          if (!hasCoordsOrUrl(parsed) && parsed.rawMessage) {
            const p = parseLocationFromText(parsed.rawMessage);
            if (p) {
              const enriched = { ...p, rawMessage: parsed.rawMessage, timestamp: Date.now() };
              await persistAndSet(enriched);
              setStatus('Parsed location from message.');
              clearInterval(pollRef.current);
              pollRef.current = null;
              return;
            } else {
              // remove raw message as per your request
              await AsyncStorage.removeItem(`lastLocation_${sister.phone}`);
              setLastLocation(null);
              setStatus('Received raw message had no URL/coords — discarded.');
              clearInterval(pollRef.current);
              pollRef.current = null;
              return;
            }
          }
          setLastLocation(parsed);
          setStatus('Location received!');
          clearInterval(pollRef.current);
          pollRef.current = null;
          return;
        }

      } catch (e) {
        console.warn('pollForLocation error', e);
      }
    }, POLL_INTERVAL_MS);
  };

  /* ---------------- Send check ---------------- */
  const handleCheck = async () => {
    let code = sister?.code ?? '';
    if (!code) {
      try {
        const rawCodes = await AsyncStorage.getItem(SECRET_CODES_KEY);
        const codes = rawCodes ? JSON.parse(rawCodes) : {};
        code = codes[sister.phone] || codes[normalizePhone(sister.phone)] || '';
      } catch (e) {
        console.warn('read legacy secretCodes failed', e);
      }
    }

    if (!code) {
      Alert.alert('No secret code', 'Secret code is not set for this sister.');
      return;
    }

    const ok = await requestPermissions(['android.permission.SEND_SMS']);
    if (!ok) {
      Alert.alert('Permission needed', 'SMS permission required.');
      return;
    }

    setStatus('Sending check...');
    try {
      await sendSms(sister.phone, `${code}`);
      setStatus('Check sent — waiting for location...');
      pollForLocation();
    } catch (e) {
      setStatus('Send failed');
      Alert.alert('Error', `Failed to send check: ${String(e)}`);
    }
  };

  /* ---------------- Refresh from native prefs (auto-invoked by event) ---------------- */
  const handleRefreshFromNative = async () => {
    try {
      if (!SisterSettings || !SisterSettings.getLastLocation) {
        console.warn('SisterSettingsModule.getLastLocation not available');
        return;
      }
      const candidates = [
        sister.phone,
        normalizePhone(sister.phone),
        (sister.phone || '').replace(/^\+/, ''),
      ];
      for (const candidate of candidates) {
        if (!candidate) continue;
        try {
          const nativeVal = await SisterSettings.getLastLocation(candidate);
          if (nativeVal) {
            const parsed = typeof nativeVal === 'string' ? JSON.parse(nativeVal) : nativeVal;
            console.log('handleRefreshFromNative: got nativeVal for candidate', candidate, parsed);
            // only update if newer or different
            const incomingTs = parsed.timestamp || Date.now();
            if (!lastLocation || !lastLocation.timestamp || incomingTs > lastLocation.timestamp || !isSameCoord(parsed, lastLocation)) {
              await AsyncStorage.setItem(`lastLocation_${sister.phone}`, JSON.stringify(parsed));
              setLastLocation(parsed);
              setStatus('Refreshed from native prefs.');
            } else {
              console.log('handleRefreshFromNative: native value not newer');
            }
            return;
          }
        } catch (e) {
          console.warn('candidate native read failed', candidate, e);
        }
      }
      console.log('handleRefreshFromNative: no native data found for candidates');
    } catch (e) {
      console.warn('handleRefreshFromNative error', e);
    }
  };

  // variant that refreshes only if incomingTs is newer than current lastLocation
  const handleRefreshFromNativeIfNewer = async (incomingTs) => {
    try {
      if (!SisterSettings || !SisterSettings.getLastLocation) return;
      const candidates = [
        sister.phone,
        normalizePhone(sister.phone),
        (sister.phone || '').replace(/^\+/, ''),
      ];
      for (const candidate of candidates) {
        if (!candidate) continue;
        try {
          const nativeVal = await SisterSettings.getLastLocation(candidate);
          if (nativeVal) {
            const parsed = typeof nativeVal === 'string' ? JSON.parse(nativeVal) : nativeVal;
            const nativeTs = parsed.timestamp || 0;
            if (nativeTs >= incomingTs) {
              // native prefs have value as new or newer — update UI
              await AsyncStorage.setItem(`lastLocation_${sister.phone}`, JSON.stringify(parsed));
              setLastLocation(parsed);
              setStatus('Refreshed from native prefs (newer).');
            }
            return;
          }
        } catch (e) {
          /* ignore */
        }
      }
    } catch (e) {
      console.warn('handleRefreshFromNativeIfNewer error', e);
    }
  };

  const isSameCoord = (a, b) => {
    if (!a || !b) return false;
    if ((a.latitude || a.latitude === 0) && (b.latitude || b.latitude === 0) && (a.longitude || a.longitude === 0) && (b.longitude || b.longitude === 0)) {
      return Number(a.latitude) === Number(b.latitude) && Number(a.longitude) === Number(b.longitude);
    }
    if (a.mapUrl && b.mapUrl) return String(a.mapUrl) === String(b.mapUrl);
    return false;
  };

  /* ---------------- WebView helpers ---------------- */
  const makeLeafletHtml = (lat, lon) => `<!doctype html>
  <html><head><meta name="viewport" content="initial-scale=1.0"/><style>html,body,#map{height:100%;margin:0;padding:0}</style><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/></head>
  <body><div id="map"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>
  const lat=${lat}, lon=${lon};
  const map = L.map('map',{zoomControl:false, attributionControl:false}).setView([lat, lon], 16);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
  L.marker([lat, lon]).addTo(map);
  </script></body></html>`;

  const makeUrlWrapperHtml = (url) => `<!doctype html><html><head><meta name="viewport" content="initial-scale=1.0"/></head><body style="margin:0;padding:0"><iframe src="${url}" style="border:0;width:100%;height:100%"></iframe></body></html>`;

  /* ---------------- Render ---------------- */
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.name}>{sister.name}</Text>
      <Text style={styles.phone}>{sister.phone}</Text>

      <View style={{ marginVertical: 12 }}>
        <Button title="Check" onPress={handleCheck} />
        <View style={{ height: 8 }} />
        <Button title="Refresh from native prefs" onPress={handleRefreshFromNative} />
      </View>

      <Text style={{ marginTop: 10 }}>Status: {status}</Text>

      <View style={{ marginTop: 14, flex: 1 }}>
        {lastLocation && lastLocation.latitude && lastLocation.longitude ? (
          <>
            <Text style={{ fontWeight: '600', marginBottom: 6 }}>Last known location</Text>
            <View style={styles.webWrap}>
              <WebView
                key={webKey}
                originWhitelist={['*']}
                source={{ html: makeLeafletHtml(lastLocation.latitude, lastLocation.longitude) }}
                style={styles.web}
                javaScriptEnabled
                domStorageEnabled
                scalesPageToFit
              />
            </View>
            <Text numberOfLines={1} style={{ marginTop: 8 }}>
              {lastLocation.mapUrl || `${lastLocation.latitude}, ${lastLocation.longitude}`}
            </Text>
            <View style={{ marginTop: 8 }}>
              <Button title="Open in Maps" onPress={() => {
                const url = lastLocation.mapUrl || `https://maps.google.com/?q=${lastLocation.latitude},${lastLocation.longitude}`;
                Linking.openURL(url);
              }} />
            </View>
          </>
        ) : lastLocation && lastLocation.mapUrl ? (
          <>
            <Text style={{ fontWeight: '600', marginBottom: 6 }}>Map Link</Text>
            <View style={styles.webWrap}>
              <WebView
                key={webKey}
                originWhitelist={['*']}
                source={{ html: makeUrlWrapperHtml(lastLocation.mapUrl) }}
                style={styles.web}
                javaScriptEnabled
                domStorageEnabled
                scalesPageToFit
              />
            </View>
            <Text numberOfLines={1} style={{ marginTop: 8 }}>{lastLocation.mapUrl}</Text>
            <View style={{ marginTop: 8 }}>
              <Button title="Open in External Browser" onPress={() => Linking.openURL(lastLocation.mapUrl)} />
            </View>
          </>
        ) : lastLocation && lastLocation.rawMessage ? (
          <>
            <Text style={{ fontWeight: '600', marginBottom: 6 }}>Message received (no link/coords)</Text>
            <Text style={{ color: '#222' }}>{lastLocation.rawMessage}</Text>
            <View style={{ marginTop: 10 }}>
              <Button title="Try Parse Message" onPress={async () => {
                if (!lastLocation || !lastLocation.rawMessage) { Alert.alert('No message'); return; }
                const p = parseLocationFromText(lastLocation.rawMessage);
                if (p) {
                  const enriched = { ...p, rawMessage: lastLocation.rawMessage, timestamp: Date.now() };
                  await persistAndSet(enriched);
                  setStatus('Parsed location from message.');
                } else {
                  await removeRawMessageStored();
                  setStatus('Could not parse — raw message deleted.');
                }
              }} />
            </View>
          </>
        ) : (
          <Text style={{ color: '#666' }}>No location plotted yet.</Text>
        )}

        <Text style={styles.attribution}>Map tiles © OpenStreetMap contributors</Text>
      </View>
    </SafeAreaView>
  );
}

/* ---------------- Parsing helper (JS) - tolerant ---------------- */
function parseLocationFromText(text) {
  if (!text || typeof text !== 'string') return null;
  const cleaned = text.replace(/[\u2018\u2019\u201C\u201D]/g, '').replace(/[\.,\)\]]+$/,'').trim();

  // q=lat,lon
  const qMatch = cleaned.match(/[?&]q=([-0-9.,]+)/i);
  if (qMatch && qMatch[1]) {
    const parts = qMatch[1].split(',');
    if (parts.length >= 2) {
      const lat = parseFloat(parts[0]);
      const lon = parseFloat(parts[1]);
      if (isFinite(lat) && isFinite(lon)) return { mapUrl: `https://maps.google.com/?q=${lat},${lon}`, latitude: lat, longitude: lon };
    }
  }

  // @lat,lon
  const atMatch = cleaned.match(/@(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lon = parseFloat(atMatch[2]);
    if (isFinite(lat) && isFinite(lon)) return { mapUrl: `https://maps.google.com/?q=${lat},${lon}`, latitude: lat, longitude: lon };
  }

  // decimal coords lat,lon
  const decMatch = cleaned.match(/(-?\d{1,3}\.\d+)\s*[,;]\s*(-?\d{1,3}\.\d+)/);
  if (decMatch) {
    const lat = parseFloat(decMatch[1]);
    const lon = parseFloat(decMatch[2]);
    if (isFinite(lat) && isFinite(lon)) return { mapUrl: `https://maps.google.com/?q=${lat},${lon}`, latitude: lat, longitude: lon };
  }

  // embed !2d lon !3d lat
  const embedPbMatch = cleaned.match(/!2d(-?\d+\.\d+)!3d(-?\d+\.\d+)/);
  if (embedPbMatch) {
    const lon = parseFloat(embedPbMatch[1]);
    const lat = parseFloat(embedPbMatch[2]);
    if (isFinite(lat) && isFinite(lon)) return { mapUrl: `https://maps.google.com/?q=${lat},${lon}`, latitude: lat, longitude: lon };
  }

  // any URL - prefer maps-related
  const urlMatch = cleaned.match(/https?:\/\/[^\s]+/i);
  if (urlMatch) {
    let url = urlMatch[0].replace(/[.,)\]]+$/,'');
    if (/maps\.google\.com|google\.com\/maps|maps\.app\.goo\.gl|goo\.gl\/maps/i.test(url)) {
      return { mapUrl: url };
    }
  }

  return null;
}

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  name: { fontSize: 20, fontWeight: '700' },
  phone: { color: '#666', marginBottom: 8 },
  webWrap: { flex: 1, height: 320, borderRadius: 10, overflow: 'hidden', backgroundColor: '#eee' },
  web: { flex: 1, backgroundColor: 'transparent' },
  attribution: { fontSize: 11, color: '#666', marginTop: 8, textAlign: 'center' },
});
