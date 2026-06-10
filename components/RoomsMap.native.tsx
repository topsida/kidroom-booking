import { useState, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
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

export function RoomsMap({ rooms }: { rooms: Room[] }) {
  const router = useRouter();
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [selected, setSelected] = useState<Room | null>(null);
  const markerPressed = useRef(false);

  const mappable = rooms.filter(r => r.latitude != null && r.longitude != null);

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
            coordinate={{ latitude: room.latitude!, longitude: room.longitude! }}
            tracksViewChanges={false}
            onPress={() => {
              markerPressed.current = true;
              setSelected(room);
            }}
          >
            <View style={[styles.pin, selected?.id === room.id && styles.pinSelected]}>
              <Text style={[styles.pinText, selected?.id === room.id && styles.pinTextSelected]}>
                {room.price_per_hour} ₽
              </Text>
            </View>
          </Marker>
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
            <Text style={styles.cardPrice}>
              {selected.price_per_hour} ₽
              <Text style={styles.perHour}>/час</Text>
            </Text>
            <TouchableOpacity
              style={styles.detailBtn}
              onPress={() => router.push({ pathname: '/room/[id]', params: { id: selected.id } })}
            >
              <Text style={styles.detailBtnText}>Подробнее →</Text>
            </TouchableOpacity>
          </View>
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
    </View>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },

    pin: {
      backgroundColor: '#fff',
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderWidth: 2,
      borderColor: C.primary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    pinSelected: { backgroundColor: C.primary },
    pinText: { fontSize: 13, fontWeight: '700', color: C.primary },
    pinTextSelected: { color: '#fff' },

    card: {
      position: 'absolute',
      bottom: 16,
      left: 16,
      right: 16,
      backgroundColor: '#fff',
      borderRadius: 18,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 14,
      elevation: 10,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
    cardInfo: { flex: 1 },
    cardName: { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 4 },
    cardAddrRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
    cardAddr: { fontSize: 13, color: C.textLight, flex: 1 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardPrice: { fontSize: 22, fontWeight: '800', color: C.primary },
    perHour: { fontSize: 13, fontWeight: '400', color: C.textLight },
    detailBtn: { backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 11 },
    detailBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

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
  });
}
