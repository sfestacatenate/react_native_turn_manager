import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Card, Button, Stat, ShiftItem } from '../components';
import { styles } from '../styles';
import { useLocale } from '../locales';
import { addDays, formatDateLabel, formatHours, formatWeekRange, toISODate } from '../utils/date';
import { Employee, Location, Shift } from '../types';

interface TurniScreenProps {
  weekStart: Date;
  setWeekStart: (date: Date) => void;
  weekDays: Date[];
  weekShifts: Shift[];
  totalWeekHours: number;
  employees: Employee[];
  locations: Location[];
  openNewShift: (date: Date) => void;
  openEditShift: (shift: Shift) => void;
  copyPreviousWeek: () => void;
}

const localeMap: Record<string, string> = { it: 'it-IT', en: 'en-GB' };

export default function TurniScreen({ weekStart, setWeekStart, weekDays, weekShifts, totalWeekHours, employees, locations, openNewShift, openEditShift, copyPreviousWeek }: TurniScreenProps) {
  const { t, locale } = useLocale();
  const dateLocale = localeMap[locale] || 'it-IT';
  return (
    <View>
      <Card>
        <View style={styles.rowBetween}>
          <TouchableOpacity style={styles.smallButton} onPress={() => setWeekStart(addDays(weekStart, -7))}>
            <Text style={styles.smallButtonText}>{t('turni.prevWeek')}</Text>
          </TouchableOpacity>
          <View style={styles.weekTitleWrap}>
            <Text style={styles.weekTitle}>{t('turni.week')}</Text>
            <Text style={styles.weekRange}>{formatWeekRange(weekStart, dateLocale)}</Text>
          </View>
          <TouchableOpacity style={styles.smallButton} onPress={() => setWeekStart(addDays(weekStart, 7))}>
            <Text style={styles.smallButtonText}>{t('turni.nextWeek')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statsRow}>
          <Stat label={t('menu.turni')} value={String(weekShifts.length)} />
          <Stat label={t('turni.totalHours')} value={formatHours(totalWeekHours)} />
          <Stat label={t('menu.dipendenti')} value={String(employees.filter((employee) => employee.active !== false).length)} />
        </View>
        <View style={styles.actionRow}>
          <Button title={t('turni.addShift')} onPress={() => openNewShift(weekStart)} />
          <Button secondary title={t('turni.copyWeek')} onPress={copyPreviousWeek} />
        </View>
      </Card>

      {weekDays.map((day) => {
        const date = toISODate(day);
        const dayShifts = weekShifts.filter((shift) => shift.date === date).sort((a, b) => a.startTime.localeCompare(b.startTime));
        return (
          <Card key={date}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>{formatDateLabel(day, dateLocale)}</Text>
              <TouchableOpacity onPress={() => openNewShift(day)}>
                <Text style={styles.link}>{t('turni.addDayShift')}</Text>
              </TouchableOpacity>
            </View>
            {dayShifts.length === 0 ? (
              <Text style={styles.emptyText}>{t('turni.noShifts')}</Text>
            ) : (
              dayShifts.map((shift) => <ShiftItem key={shift.id} shift={shift} employees={employees} locations={locations} onPress={() => openEditShift(shift)} />)
            )}
          </Card>
        );
      })}
    </View>
  );
}
