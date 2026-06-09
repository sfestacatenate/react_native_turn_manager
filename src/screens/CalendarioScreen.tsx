import React, { useMemo, useState } from 'react';
import { Modal, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Card, Button } from '../components';
import { styles } from '../styles';
import { useLocale } from '../locales';
import { toISODate } from '../utils/date';
import { Employee, Location, Shift } from '../types';

interface CalendarioScreenProps {
  employees: Employee[];
  locations: Location[];
  shifts: Shift[];
  openNewShift: (date: Date) => void;
  openEditShift: (shift: Shift) => void;
  onViewDay: (date: Date) => void;
}

const WD = ['Do', 'Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa'];
const MONTHS_IT = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getMonthDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = getDaysInMonth(year, month);
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

export default function CalendarioScreen({ employees, locations, shifts, openNewShift, openEditShift, onViewDay }: CalendarioScreenProps) {
  const { t, locale } = useLocale();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const [pickYear, setPickYear] = useState(today.getFullYear());
  const [pickMonth, setPickMonth] = useState(today.getMonth());

  const days = useMemo(() => getMonthDays(viewYear, viewMonth), [viewYear, viewMonth]);
  const months = locale === 'it' ? MONTHS_IT : MONTHS_EN;
  const monthLabel = `${months[viewMonth]} ${viewYear}`;

  const shiftDates = useMemo(() => {
    const set = new Set<string>();
    shifts.forEach((s) => set.add(s.date));
    return set;
  }, [shifts]);

  function goPrevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
    setSelectedDay(null);
  }

  function goNextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
    setSelectedDay(null);
  }

  function openMonthPicker() {
    setPickYear(viewYear);
    setPickMonth(viewMonth);
    setMonthPickerVisible(true);
  }

  function confirmMonthPicker() {
    setViewYear(pickYear);
    setViewMonth(pickMonth);
    setSelectedDay(null);
    setMonthPickerVisible(false);
  }

  function handleDayPress(day: number) {
    setSelectedDay(day);
    onViewDay(new Date(viewYear, viewMonth, day));
  }

  return (
    <ScrollView>
      <Card>
        <View style={styles.rowBetween}>
          <TouchableOpacity style={styles.smallButton} onPress={goPrevMonth}>
            <Text style={styles.smallButtonText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openMonthPicker}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827' }}>{monthLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallButton} onPress={goNextMonth}>
            <Text style={styles.smallButtonText}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', marginTop: 16 }}>
          {WD.map((wd) => (
            <View key={wd} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={[styles.itemMeta, { fontWeight: '700', fontSize: 12 }]}>{wd}</Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
          {days.map((day, idx) => {
            if (day === null) {
              return <View key={`e-${idx}`} style={{ width: '14.28%', aspectRatio: 1, padding: 2 }} />;
            }
            const dateStr = toISODate(new Date(viewYear, viewMonth, day));
            const hasShift = shiftDates.has(dateStr);
            const isSelected = selectedDay === day;
            const isToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

            return (
              <TouchableOpacity
                key={dateStr}
                style={{ width: '14.28%', aspectRatio: 1, padding: 2 }}
                onPress={() => handleDayPress(day)}
              >
                <View
                  style={{
                    flex: 1,
                    borderRadius: 12,
                    backgroundColor: isSelected ? '#111827' : isToday ? '#eff6ff' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '800',
                      color: isSelected ? '#ffffff' : isToday ? '#2563eb' : '#111827',
                    }}
                  >
                    {day}
                  </Text>
                  {hasShift && (
                    <View
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 2.5,
                        backgroundColor: isSelected ? '#ffffff' : '#2563eb',
                        marginTop: 2,
                      }}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      <Modal visible={monthPickerVisible} animationType="slide" onRequestClose={() => setMonthPickerVisible(false)}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('calendario.selectMonth')}</Text>
            <TouchableOpacity onPress={() => setMonthPickerVisible(false)}><Text style={styles.link}>{t('common.close')}</Text></TouchableOpacity>
          </View>
          <View style={{ padding: 24 }}>
            <View style={[styles.rowBetween, { marginBottom: 24 }]}>
              <TouchableOpacity style={styles.smallButton} onPress={() => setPickYear((y) => y - 1)}>
                <Text style={styles.smallButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827' }}>{pickYear}</Text>
              <TouchableOpacity style={styles.smallButton} onPress={() => setPickYear((y) => y + 1)}>
                <Text style={styles.smallButtonText}>→</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {months.map((name, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={{
                    width: '33.33%',
                    padding: 6,
                  }}
                  onPress={() => setPickMonth(idx)}
                >
                  <View
                    style={{
                      paddingVertical: 14,
                      borderRadius: 14,
                      backgroundColor: pickMonth === idx ? '#111827' : '#f3f4f6',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: '700',
                        fontSize: 14,
                        color: pickMonth === idx ? '#ffffff' : '#374151',
                      }}
                    >
                      {name}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.button, { marginTop: 24 }]} onPress={confirmMonthPicker}>
              <Text style={styles.buttonText}>{t('common.confirm')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
}
