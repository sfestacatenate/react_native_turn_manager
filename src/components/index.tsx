import React, { useRef, useState } from 'react';
import { Modal, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import WheelColorPicker from 'react-native-wheel-color-picker';
import { COLORS, styles } from '../styles';
import { useLocale } from '../locales';
import { calculateShiftHours, formatHours } from '../utils/date';
import { Employee, Location, Shift } from '../types';

export function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

interface ButtonProps {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  danger?: boolean;
}

export function Button({ title, onPress, secondary, danger }: ButtonProps) {
  return (
    <TouchableOpacity style={[styles.button, secondary && styles.buttonSecondary, danger && styles.buttonDanger]} onPress={onPress}>
      <Text style={[styles.buttonText, secondary && styles.buttonSecondaryText]}>{title}</Text>
    </TouchableOpacity>
  );
}

interface StatProps {
  label: string;
  value: string;
}

export function Stat({ label, value }: StatProps) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

interface ShiftItemProps {
  shift: Shift;
  employees: Employee[];
  locations: Location[];
  onPress: () => void;
}

export function ShiftItem({ shift, employees, locations, onPress }: ShiftItemProps) {
  const { t } = useLocale();
  const employee = employees.find((item) => item.id === shift.employeeId);
  const location = locations.find((item) => item.id === shift.locationId);
  return (
    <TouchableOpacity style={styles.shiftItem} onPress={onPress}>
      <View style={[styles.colorBar, { backgroundColor: employee?.color || '#2563eb' }]} />
      <View style={styles.flex1}>
        <Text style={styles.itemTitle}>{employee?.name || t('shiftItem.employeeDeleted')}</Text>
        <Text style={styles.itemSubtitle}>{shift.startTime} - {shift.endTime} · {location?.name || t('shiftItem.locationDeleted')}</Text>
        <Text style={styles.itemMeta}>{(shift.breakStartTime && shift.breakMinutes ? `${shift.breakStartTime} (${shift.breakMinutes}') · ` : '')}{shift.role || employee?.role || t('shiftItem.roleNotSet')} · {formatHours(calculateShiftHours(shift))}</Text>
      </View>
    </TouchableOpacity>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  multiline?: boolean;
}

export function Field({ label, value, onChangeText, placeholder, keyboardType, multiline }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textarea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
      />
    </View>
  );
}

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const { t } = useLocale();
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingColor, setPendingColor] = useState(value);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.colorPreview} onPress={() => { setPendingColor(value); setModalVisible(true); }}>
        <View style={[styles.colorPreviewSwatch, { backgroundColor: value }]} />
        <Text style={styles.colorPreviewText}>{value}</Text>
      </TouchableOpacity>
      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('colorPicker.title')}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.link}>{t('common.cancel')}</Text></TouchableOpacity>
          </View>
          <View style={styles.colorPickerContainer}>
            <WheelColorPicker
              color={pendingColor}
              onColorChange={(hex: string) => setPendingColor(hex)}
              thumbSize={40}
              sliderSize={24}
              gapSize={20}
              swatches={true}
              swatchesLast={true}
              palette={COLORS}
            />
          </View>
          <View style={styles.colorPickerActions}>
            <TouchableOpacity style={styles.button} onPress={() => { onChange(pendingColor); setModalVisible(false); }}>
              <Text style={styles.buttonText}>{t('common.confirm')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

interface SelectOption {
  value: string;
  label: string;
}

interface SelectorProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}

interface TimePickerProps {
  label: string;
  value: string;
  onChange: (time: string) => void;
}

export function TimePicker({ label, value, onChange }: TimePickerProps) {
  const { t } = useLocale();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedHour, setSelectedHour] = useState('');
  const [selectedMinute, setSelectedMinute] = useState('');
  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);
  const [hourScrollHeight, setHourScrollHeight] = useState(0);
  const [minuteScrollHeight, setMinuteScrollHeight] = useState(0);

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));
  const ITEM_HEIGHT = 56;

  function openPicker() {
    const [h = '09', m = '00'] = value.split(':');
    setSelectedHour(h);
    setSelectedMinute(m);
    setModalVisible(true);
  }

  function scrollToSelected(ref: React.RefObject<ScrollView | null>, items: string[], value: string, scrollHeight: number) {
    const idx = items.indexOf(value);
    if (idx < 0 || scrollHeight === 0) return;
    const targetY = Math.max(0, idx * ITEM_HEIGHT - (scrollHeight - ITEM_HEIGHT) / 2);
    ref.current?.scrollTo({ y: targetY, animated: false });
  }

  function handleModalShow() {
    setTimeout(() => {
      scrollToSelected(hourScrollRef, hours, selectedHour, hourScrollHeight);
      scrollToSelected(minuteScrollRef, minutes, selectedMinute, minuteScrollHeight);
    }, 100);
  }

  function confirmTime() {
    onChange(`${selectedHour}:${selectedMinute}`);
    setModalVisible(false);
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.timePickerButton} onPress={openPicker}>
        <Text style={styles.timePickerButtonText}>{value}</Text>
      </TouchableOpacity>
      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)} onShow={handleModalShow}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{label}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.link}>{t('common.cancel')}</Text></TouchableOpacity>
          </View>
          <View style={styles.timePickerColumns}>
            <ScrollView ref={hourScrollRef} style={styles.timePickerColumn} onLayout={(e) => setHourScrollHeight(e.nativeEvent.layout.height)}>
              {hours.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[styles.timePickerItem, selectedHour === h && styles.timePickerItemActive]}
                  onPress={() => setSelectedHour(h)}
                >
                  <Text style={[styles.timePickerItemText, selectedHour === h && styles.timePickerItemTextActive]}>{h}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.timePickerSeparator}>:</Text>
            <ScrollView ref={minuteScrollRef} style={styles.timePickerColumn} onLayout={(e) => setMinuteScrollHeight(e.nativeEvent.layout.height)}>
              {minutes.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.timePickerItem, selectedMinute === m && styles.timePickerItemActive]}
                  onPress={() => setSelectedMinute(m)}
                >
                  <Text style={[styles.timePickerItemText, selectedMinute === m && styles.timePickerItemTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={styles.colorPickerActions}>
            <TouchableOpacity style={styles.button} onPress={confirmTime}>
              <Text style={styles.buttonText}>{t('common.confirm')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

interface BreakStepperProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function BreakStepper({ label, value, onChange }: BreakStepperProps) {
  const minutes = parseInt(value || '0', 10);

  function increment() {
    onChange(String(Math.min(180, minutes + 10)));
  }

  function decrement() {
    onChange(String(Math.max(0, minutes - 10)));
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.stepperContainer}>
        <TouchableOpacity style={styles.stepperArrow} onPress={decrement}>
          <Text style={styles.stepperArrowText}>▼</Text>
        </TouchableOpacity>
        <Text style={styles.stepperValue}>{value || '0'}</Text>
        <TouchableOpacity style={styles.stepperArrow} onPress={increment}>
          <Text style={styles.stepperArrowText}>▲</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function Selector({ label, value, options, onChange }: SelectorProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {options.map((option) => (
          <TouchableOpacity key={option.value} style={[styles.choice, value === option.value && styles.choiceActive]} onPress={() => onChange(option.value)}>
            <Text style={[styles.choiceText, value === option.value && styles.choiceTextActive]}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
