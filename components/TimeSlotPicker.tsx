import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, ThemeColors } from '@/context/ThemeContext';
import { PricingRule } from '@/types';
import { getSlotPrice } from '@/lib/pricing';

interface Props {
  workStart: string;
  workEnd: string;
  bookedSlots: string[];
  selected: string;
  onSelect: (slot: string) => void;
  date: string;
  basePrice: number;
  pricingRules: PricingRule[];
}

export function TimeSlotPicker({
  workStart, workEnd, bookedSlots, selected, onSelect,
  date, basePrice, pricingRules,
}: Props) {
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
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
        const booked     = bookedSlots.includes(slot);
        const isSelected = selected === slot;
        const price      = getSlotPrice(basePrice, slot, date, pricingRules);
        const hasDiscount = price < basePrice;
        const hasSurcharge = price > basePrice;

        return (
          <TouchableOpacity
            key={slot}
            style={[styles.slot, booked && styles.slotBooked, isSelected && styles.slotSelected]}
            onPress={() => !booked && onSelect(slot)}
            disabled={booked}
            activeOpacity={0.7}
          >
            <Text style={[styles.slotTime, booked && styles.slotTextBooked, isSelected && styles.slotTextSelected]}>
              {slot}
            </Text>

            {booked ? (
              <Text style={styles.slotSub}>занято</Text>
            ) : (
              <>
                <Text style={[
                  styles.slotPrice,
                  isSelected && styles.slotTextSelected,
                  !isSelected && hasDiscount  && { color: '#16a34a' },
                  !isSelected && hasSurcharge && { color: C.primary },
                ]}>
                  {price} ₽
                </Text>
                {(hasDiscount || hasSurcharge) && !isSelected && (
                  <Text style={styles.slotBasePrice}>{basePrice} ₽</Text>
                )}
              </>
            )}
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

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

    slot: {
      width: '22%',
      paddingVertical: 10,
      paddingHorizontal: 4,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: C.border,
      alignItems: 'center',
      backgroundColor: C.white,
      gap: 2,
    },
    slotBooked:   { backgroundColor: C.background, borderColor: C.border, opacity: 0.5 },
    slotSelected: { backgroundColor: C.primary, borderColor: C.primary },

    slotTime: { fontSize: 14, fontWeight: '700', color: C.text },
    slotTextBooked:   { color: C.textLight, fontWeight: '400' },
    slotTextSelected: { color: '#FFFFFF' },

    slotPrice:    { fontSize: 11, fontWeight: '600', color: C.textLight },
    slotBasePrice: {
      fontSize: 9,
      color: C.textLight,
      textDecorationLine: 'line-through',
    },
    slotSub: { fontSize: 9, color: C.textLight },

    emptyBox:  { backgroundColor: C.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.border },
    emptyText: { color: C.textLight, fontSize: 14 },
  });
}
