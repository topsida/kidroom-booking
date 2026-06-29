import { useState, useMemo, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Linking, ActivityIndicator, Alert, Platform,
  Modal, Image, TouchableWithoutFeedback,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Room } from '@/types';
import { useTheme, ThemeColors } from '@/context/ThemeContext';

const INITIAL_REGION = {
  latitude: 47.228,
  longitude: 39.703,
  latitudeDelta: 0.10,
  longitudeDelta: 0.10,
};

const GOOGLE_ICON = { uri: 'https://maps.gstatic.com/favicon3.ico' };
const YANDEX_ICON = require('../assets/yandex-maps.png');

interface PendingRoute {
  fromLat: number | null;
  fromLng: number | null;
  toLat: number;
  toLng: number;
}

export function RoomsMap({ rooms }: { rooms: Room[] }) {
  const router = useRouter();
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [selected, setSelected] = useState<Room | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [picker, setPicker] = useState<PendingRoute | null>(null);
  const markerPressed = useRef(false);

  const mappable = rooms
    .map(r => ({ ...r, latitude: Number(r.latitude), longitude: Number(r.longitude) }))
    .filter(r => !isNaN(r.latitude) && !isNaN(r.longitude) && r.latitude !== 0 && r.longitude !== 0);

  async function openRoute(room: Room) {
    setRouteLoading(true);

    const toLat = Number(room.latitude);
    const toLng = Number(room.longitude);
    let fromLat: number | null = null;
    let fromLng: number | null = null;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        fromLat = loc.coords.latitude;
        fromLng = loc.coords.longitude;
      }
    } catch {
      // продолжим без начальной точки
    } finally {
      setRouteLoading(false);
    }

    setPicker({ fromLat, fromLng, toLat, toLng });
  }

  function launchYandex({ fromLat, fromLng, toLat, toLng }: PendingRoute) {
    setPicker(null);
    const hasOrigin = fromLat !== null && fromLng !== null;
    const nativeUrl = hasOrigin
      ? `yandexmaps://maps.yandex.ru/?rtext=${fromLat},${fromLng}~${toLat},${toLng}&rtt=auto`
      : `yandexmaps://maps.yandex.ru/?pt=${toLng},${toLat}&z=16`;
    const webUrl = hasOrigin
      ? `https://yandex.ru/maps/?rtext=${fromLat},${fromLng}~${toLat},${toLng}&rtt=auto`
      : `https://yandex.ru/maps/?pt=${toLng},${toLat}&z=16`;

    Linking.canOpenURL(nativeUrl)
      .then(can => Linking.openURL(can ? nativeUrl : webUrl))
      .catch(() => Linking.openURL(webUrl));
  }

  function launchGoogle({ fromLat, fromLng, toLat, toLng }: PendingRoute) {
    setPicker(null);
    const hasOrigin = fromLat !== null && fromLng !== null;
    const webUrl = hasOrigin
      ? `https://www.google.com/maps/dir/?api=1&origin=${fromLat},${fromLng}&destination=${toLat},${toLng}&travelmode=driving`
      : `https://www.google.com/maps/search/?api=1&query=${toLat},${toLng}`;

    if (Platform.OS === 'ios') {
      const nativeUrl = hasOrigin
        ? `comgooglemaps://?saddr=${fromLat},${fromLng}&daddr=${toLat},${toLng}&directionsmode=driving`
        : `comgooglemaps://?daddr=${toLat},${toLng}&directionsmode=driving`;
      Linking.canOpenURL(nativeUrl)
        .then(can => Linking.openURL(can ? nativeUrl : webUrl))
        .catch(() => Linking.openURL(webUrl));
    } else {
      Linking.openURL(webUrl);
    }
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={INITIAL_REGION}
        showsUserLocation
        showsMyLocationButton
        onPress={() => {
          if (!markerPressed.current) setSelected(null);
          markerPressed.current = false;
        }}
      >
        {mappable.map(room => (
          <Marker
            key={room.id}
            coordinate={{ latitude: room.latitude, longitude: room.longitude }}
            pinColor="red"
            onPress={() => {
              markerPressed.current = true;
              setSelected(room);
            }}
          />
        ))}
      </MapView>

      {selected && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName} numberOfLines={1}>{selected.name}</Text>
              <View style={styles.cardAddrRow}>
                <Ionicons name="location-outline" size={13} color={C.textLight} />
                <Text style={styles.cardAddr} numberOfLines={2}>{selected.address}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setSelected(null)} hitSlop={12}>
              <Ionicons name="close-circle" size={26} color={C.textLight} />
            </TouchableOpacity>
          </View>

          <View style={styles.cardFooter}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.cardPrice}>{selected.rating?.toFixed(1) ?? '—'}</Text>
            </View>
            <TouchableOpacity
              style={styles.detailBtn}
              onPress={() => router.push({ pathname: '/room/[id]', params: { id: selected.id } })}
            >
              <Text style={styles.detailBtnText}>Подробнее →</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.routeBtn}
            onPress={() => openRoute(selected)}
            disabled={routeLoading}
            activeOpacity={0.8}
          >
            {routeLoading ? (
              <ActivityIndicator size="small" color={C.primary} />
            ) : (
              <Ionicons name="navigate-outline" size={18} color={C.primary} />
            )}
            <Text style={[styles.routeBtnText, { color: C.primary }]}>
              {routeLoading ? 'Определяем местоположение...' : 'Маршрут'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {mappable.length === 0 && (
        <View style={styles.noCoords}>
          <Ionicons name="map-outline" size={48} color={C.textLight} />
          <Text style={styles.noCoordsText}>
            Координаты не заданы.{'\n'}Выполните миграцию add-room-coordinates.sql
          </Text>
        </View>
      )}

      {/* Диалог выбора карты */}
      <Modal visible={!!picker} transparent animationType="fade" onRequestClose={() => setPicker(null)}>
        <TouchableWithoutFeedback onPress={() => setPicker(null)}>
          <View style={styles.dialogBackdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.dialogWrap} pointerEvents="box-none">
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Открыть маршрут</Text>
            <Text style={styles.dialogSubtitle}>Выберите приложение для навигации</Text>

            <View style={styles.dialogDivider} />

            <TouchableOpacity
              style={styles.dialogRow}
              onPress={() => picker && launchYandex(picker)}
              activeOpacity={0.7}
            >
              <Image source={YANDEX_ICON} style={styles.appIcon} />
              <Text style={styles.dialogRowText}>Яндекс Карты</Text>
              <Ionicons name="chevron-forward" size={18} color={C.textLight} />
            </TouchableOpacity>

            <View style={styles.dialogDivider} />

            <TouchableOpacity
              style={styles.dialogRow}
              onPress={() => picker && launchGoogle(picker)}
              activeOpacity={0.7}
            >
              <Image source={GOOGLE_ICON} style={styles.appIcon} />
              <Text style={styles.dialogRowText}>Google Maps</Text>
              <Ionicons name="chevron-forward" size={18} color={C.textLight} />
            </TouchableOpacity>

            <View style={styles.dialogDivider} />

            <TouchableOpacity
              style={[styles.dialogRow, styles.dialogCancel]}
              onPress={() => setPicker(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.dialogCancelText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },

    card: {
      position: 'absolute',
      bottom: 16,
      left: 16,
      right: 16,
      backgroundColor: '#fff',
      borderRadius: 18,
      padding: 16,
      gap: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 14,
      elevation: 10,
    },
    cardHeader:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    cardInfo:    { flex: 1 },
    cardName:    { fontSize: 17, fontWeight: '800', color: '#111', marginBottom: 4 },
    cardAddrRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
    cardAddr:    { fontSize: 13, color: C.textLight, flex: 1 },

    cardFooter:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardPrice:     { fontSize: 20, fontWeight: '800', color: C.text },
    perHour:       { fontSize: 13, fontWeight: '400', color: C.textLight },
    detailBtn:     { backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 11 },
    detailBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

    routeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderWidth: 1.5,
      borderColor: C.primary,
      borderRadius: 12,
      paddingVertical: 11,
    },
    routeBtnText: { fontSize: 14, fontWeight: '700' },

    noCoords: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
      padding: 32,
      backgroundColor: 'rgba(255,255,255,0.88)',
    },
    noCoordsText: { textAlign: 'center', color: C.textLight, fontSize: 14, lineHeight: 22 },

    // Диалог выбора карты
    dialogBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    dialogWrap: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    dialog: {
      width: '100%',
      backgroundColor: C.background,
      borderRadius: 20,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
      elevation: 20,
    },
    dialogTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: C.text,
      textAlign: 'center',
      paddingTop: 20,
      paddingHorizontal: 20,
    },
    dialogSubtitle: {
      fontSize: 13,
      color: C.textLight,
      textAlign: 'center',
      paddingBottom: 16,
      paddingHorizontal: 20,
      marginTop: 4,
    },
    dialogDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: C.border,
    },
    dialogRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      gap: 14,
    },
    appIcon: {
      width: 24,
      height: 24,
      borderRadius: 6,
    },
    dialogRowText: {
      flex: 1,
      fontSize: 16,
      color: C.text,
      fontWeight: '500',
    },
    dialogCancel: { justifyContent: 'center' },
    dialogCancelText: {
      flex: 1,
      fontSize: 16,
      color: C.error,
      fontWeight: '600',
      textAlign: 'center',
    },
  });
}
