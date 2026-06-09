import React, { useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Card, Button } from '../components';
import { styles } from '../styles';
import { useLocale } from '../locales';
import { timeToMinutes, calculateShiftHours, formatHours, toISODate } from '../utils/date';
import { Employee, Location, Shift } from '../types';

interface GiornataScreenProps {
  date: Date;
  employees: Employee[];
  locations: Location[];
  shifts: Shift[];
  onBack: () => void;
  openNewShift: (date: Date) => void;
  openEditShift: (shift: Shift) => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface EmployeeRow {
  employee: Employee;
  shifts: Shift[];
  startMin: number;
  endMin: number;
  hours: number;
}

const HOUR_HEIGHT = 60;
const TIME_LABEL_WIDTH = 38;
const COLUMN_WIDTH = 40;

export default function GiornataScreen({ date, employees, locations, shifts, onBack, openNewShift, openEditShift }: GiornataScreenProps) {
  const { t, locale } = useLocale();
  const dateISO = toISODate(date);

  const dayShifts = useMemo(() => {
    return shifts
      .filter((s) => s.date === dateISO)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [shifts, dateISO]);

  const totalHours = useMemo(() => {
    return dayShifts.reduce((sum, s) => sum + calculateShiftHours(s), 0);
  }, [dayShifts]);

  const { employeeRows, startHour, endHour, timelineHeight } = useMemo(() => {
    const grouped = new Map<string, Shift[]>();
    for (const s of dayShifts) {
      const list = grouped.get(s.employeeId) || [];
      list.push(s);
      grouped.set(s.employeeId, list);
    }

    const rows: EmployeeRow[] = [];
    let gStart = Infinity;
    let gEnd = -Infinity;

    for (const [empId, empShifts] of grouped) {
      const emp = employees.find((e) => e.id === empId);
      if (!emp) continue;
      const minutes = empShifts.map((s) => ({
        start: timeToMinutes(s.startTime),
        end: timeToMinutes(s.endTime) < timeToMinutes(s.startTime)
          ? timeToMinutes(s.endTime) + 24 * 60
          : timeToMinutes(s.endTime),
      }));
      const startMin = Math.min(...minutes.map((m) => m.start));
      const endMin = Math.max(...minutes.map((m) => m.end));
      const hours = empShifts.reduce((sum, s) => sum + calculateShiftHours(s), 0);
      rows.push({ employee: emp, shifts: empShifts, startMin, endMin, hours });
      if (startMin < gStart) gStart = startMin;
      if (endMin > gEnd) gEnd = endMin;
    }

    rows.sort((a, b) => a.startMin - b.startMin);

    const sHour = gStart === Infinity ? 8 : Math.floor(gStart / 60);
    const eHour = gEnd === -Infinity ? 18 : Math.ceil(gEnd / 60);
    const tHeight = (eHour - sHour) * HOUR_HEIGHT;

    return { employeeRows: rows, startHour: sHour, endHour: eHour, timelineHeight: tHeight };
  }, [dayShifts, employees]);

  const dateLabel = date.toLocaleDateString(locale === 'it' ? 'it-IT' : 'en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <SafeWrapper>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.hamburgerButton}>
          <Text style={{ fontSize: 22, color: '#ffffff', fontWeight: '800' }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.appTitle, { fontSize: 16 }]} numberOfLines={1}>{dateLabel}</Text>
        <View style={styles.flex1} />
        <Button title={t('turni.addDayShift')} onPress={() => openNewShift(date)} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {employeeRows.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>{t('turni.noShifts')}</Text>
          </Card>
        ) : (
          <Card>
            <View style={[styles.rowBetween, { marginBottom: 8 }]}>
              <Text style={styles.sectionTitle}>
                {employeeRows.length} {employeeRows.length === 1 ? (locale === 'it' ? 'dipendente' : 'employee') : (locale === 'it' ? 'dipendenti' : 'employees')}
              </Text>
              <Text style={styles.itemMeta}>{formatHours(totalHours)}</Text>
            </View>

            <View style={{ flexDirection: 'row' }}>
              <View style={{ width: TIME_LABEL_WIDTH, alignItems: 'flex-end', paddingRight: 10, marginRight: 4 }}>
                {Array.from({ length: endHour - startHour + 1 }).map((_, i) => {
                  const hour = startHour + i;
                  return (
                    <View key={hour} style={{ height: HOUR_HEIGHT, justifyContent: 'flex-start', paddingTop: 2 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#374151', lineHeight: 13 }}>
                        {String(hour).padStart(2, '0')}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {employeeRows.map((row) => {
                    const emp = row.employee;
                    const color = emp.color || '#2563eb';
                    const initials = getInitials(emp.name);
                    const barTop = (row.startMin - startHour * 60) * (HOUR_HEIGHT / 60);
                    const barHeight = (row.endMin - row.startMin) * (HOUR_HEIGHT / 60);

                    return (
                      <TouchableOpacity
                        key={emp.id}
                        onPress={() => openEditShift(row.shifts[0])}
                        activeOpacity={0.7}
                        style={{ alignItems: 'center', width: COLUMN_WIDTH }}
                      >
                        <Text style={{ fontSize: 8, fontWeight: '700', color: color, marginBottom: 2, lineHeight: 9 }}>
                          {initials}
                        </Text>

                        <View style={{ height: timelineHeight, width: '100%', position: 'relative' }}>
                          {Array.from({ length: endHour - startHour + 1 }).map((_, i) => {
                            const hour = startHour + i;
                            return (
                              <View
                                key={hour}
                                style={{
                                  position: 'absolute',
                                  left: 0,
                                  right: 0,
                                  top: (hour - startHour) * HOUR_HEIGHT,
                                  height: HOUR_HEIGHT,
                                  borderTopWidth: i === 0 ? 0 : 1,
                                  borderTopColor: '#e5e7eb',
                                }}
                              />
                            );
                          })}

                          {barHeight > 0 && (
                            <View
                              style={{
                                position: 'absolute',
                                left: 1,
                                right: 1,
                                top: barTop,
                                height: Math.max(barHeight, 16),
                                backgroundColor: color,
                                borderRadius: 4,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {initials.split('').map((ch, i) => (
                                <Text
                                  key={i}
                                  style={{
                                    color: '#ffffff',
                                    fontWeight: '800',
                                    fontSize: 9,
                                    lineHeight: 10,
                                    textAlign: 'center',
                                  }}
                                >
                                  {ch}
                                </Text>
                              ))}
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeWrapper>
  );
}

function SafeWrapper({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {children}
    </View>
  );
}
