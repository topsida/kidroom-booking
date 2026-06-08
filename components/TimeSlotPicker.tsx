import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

interface Props {
  workStart: string;
  workEnd: string;
  bookedSlots: string[];
  selected: string;
  onSelect: (slot: string) => void;
  date: string;
}

export function TimeSlotPicker({ workStart, workEnd, bookedSlots, selected, onSelect, date }: Props) {
  const slots = generateSlots(workStart, workEnd, date);

  if (slots.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>На сегодня слоты закончились. Выберите другую дату.</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {slots.map(slot => {
        const booked = bookedSlots.includes(slot);
        const selected_ = selected === slot;
        return (
          <TouchableOpacity
            key={slot}
            style={[styles.slot, booked && styles.slotBooked, selected_ && styles.slotSelected]}
            onPress={() => !booked && onSelect(slot)}
            disabled={booked}
            activeOpacity={0.7}
          >
            <Text style={[styles.slotText, booked && styles.slotTextBooked, selected_ && styles.slotTextSelected]}>
              {slot}
            </Text>
            {booked && <Text style={styles.slotSub}>занято</Text>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function generateSlots(start: string, end: string, date: string): string[] {
  const slots: string[] = [];
  const sh = parseInt(start.split(':')[0], 10);
  const eh = parseInt(end.split(':')[0], 10);
  const isToday = date === new Date().toISOString().split('T')[0];
  const nowH = new Date().getHours();
  for (let h = sh; h < eh; h++) {
    if (isToday && h <= nowH) continue;
    slots.push(`${String(h).padStart(2, '0')}:00`);
  }
  return slots;
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slot: { width: '22%', paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', backgroundColor: Colors.white },
  slotBooked: { backgroundColor: '#F5F5F5', borderColor: '#E0E0E0' },
  slotSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  slotText: { fontSize: 14, fontWeight: '700', color: Colors.text },
  slotTextBooked: { color: '#BDBDBD', fontWeight: '400' },
  slotTextSelected: { color: Colors.white },
  slotSub: { fontSize: 9, color: '#BDBDBD', marginTop: 2 },
  emptyBox: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border },
  emptyText: { color: Colors.textLight, fontSize: 14 },
});
