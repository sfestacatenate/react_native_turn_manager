import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { loadAppData, resetAppData, saveAppData } from './src/storage/storage';
import {
  addDays,
  calculateShiftHours,
  formatDateLabel,
  formatHours,
  formatWeekRange,
  getMonday,
  getWeekDays,
  hasShiftConflict,
  toISODate
} from './src/utils/date';
import { exportWeeklyPdf } from './src/utils/pdf';
import { Card, Button, ColorPicker, Field, Selector, TimePicker, BreakStepper } from './src/components';
import { styles, COLORS } from './src/styles';
import { LocaleProvider, useLocale } from './src/locales';
import TurniScreen from './src/screens/TurniScreen';
import DipendentiScreen from './src/screens/DipendentiScreen';
import SediScreen from './src/screens/SediScreen';
import CalendarioScreen from './src/screens/CalendarioScreen';
import GiornataScreen from './src/screens/GiornataScreen';
import ExportScreen from './src/screens/ExportScreen';
import { Employee, Location, Shift, Locale } from './src/types';

interface ShiftForm {
  id: string | null;
  employeeId: string;
  locationId: string;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: string;
  breakStartTime: string;
  role: string;
  notes: string;
}

const TABS = ['Turni', 'Dipendenti', 'Sedi', 'Calendario', 'Export'];

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function AppInner() {
  const { t, locale, setLocale } = useLocale();
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState('Turni');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuAnim = useRef(new Animated.Value(0)).current;
  const [businessName, setBusinessName] = useState(t('export.businessNamePlaceholder'));
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [dayViewDate, setDayViewDate] = useState<Date | null>(null);

  const [langModalVisible, setLangModalVisible] = useState(false);
  const [employeeModal, setEmployeeModal] = useState(false);
  const [locationModal, setLocationModal] = useState(false);
  const [shiftModal, setShiftModal] = useState(false);

  const [employeeForm, setEmployeeForm] = useState<Employee | null>(null);
  const [locationForm, setLocationForm] = useState<Location | null>(null);
  const [shiftForm, setShiftForm] = useState<ShiftForm | null>(null);

  useEffect(() => {
    loadAppData()
      .then((data) => {
        setBusinessName(data.businessName || t('export.businessNamePlaceholder'));
        setEmployees(data.employees || []);
        setLocations(data.locations || []);
        setShifts(data.shifts || []);
      })
      .catch(() => Alert.alert(t('errors.loadData')))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveAppData({ businessName, employees, locations, shifts }).catch(() => {
      Alert.alert(t('errors.saveData'));
    });
  }, [ready, businessName, employees, locations, shifts]);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const weekShifts = useMemo(() => {
    const weekDates = weekDays.map(toISODate);
    return shifts.filter((shift) => weekDates.includes(shift.date));
  }, [shifts, weekDays]);

  const totalWeekHours = useMemo(() => {
    return weekShifts.reduce((sum, shift) => sum + calculateShiftHours(shift), 0);
  }, [weekShifts]);

  function openMenu() {
    setMenuOpen(true);
    Animated.timing(menuAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }

  function closeMenu() {
    Animated.timing(menuAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setMenuOpen(false);
    });
  }

  function openNewEmployee() {
    setEmployeeForm({ id: null, name: '', role: '', phone: '', email: '', color: COLORS[employees.length % COLORS.length], notes: '', active: true });
    setEmployeeModal(true);
  }

  function openEditEmployee(employee: Employee) {
    setEmployeeForm({ ...employee });
    setEmployeeModal(true);
  }

  function saveEmployee() {
    if (!employeeForm || !employeeForm.name.trim()) {
      Alert.alert(t('errors.requiredName'), t('errors.requiredNameMsg'));
      return;
    }

    if (employeeForm.id) {
      setEmployees((items) => items.map((item) => (item.id === employeeForm.id ? employeeForm as Employee : item)));
    } else {
      setEmployees((items) => [...items, { ...employeeForm, id: createId('emp') }]);
    }

    setEmployeeModal(false);
  }

  function deleteEmployee(employeeId: string) {
    Alert.alert(t('dipendenti.deleteTitle'), t('dipendenti.deleteMsg'), [
      { text: t('common.cancel'), style: 'cancel' as const },
      { text: t('common.delete'), style: 'destructive' as const, onPress: () => setEmployees((items) => items.filter((item) => item.id !== employeeId)) }
    ]);
  }

  function openNewLocation() {
    setLocationForm({ id: null, name: '', address: '', notes: '' });
    setLocationModal(true);
  }

  function openEditLocation(location: Location) {
    setLocationForm({ ...location });
    setLocationModal(true);
  }

  function saveLocation() {
    if (!locationForm || !locationForm.name.trim()) {
      Alert.alert(t('errors.requiredName'), t('errors.requiredNameMsgLocation'));
      return;
    }

    if (locationForm.id) {
      setLocations((items) => items.map((item) => (item.id === locationForm.id ? locationForm as Location : item)));
    } else {
      setLocations((items) => [...items, { ...locationForm, id: createId('loc') }]);
    }

    setLocationModal(false);
  }

  function deleteLocation(locationId: string) {
    Alert.alert(t('sedi.deleteTitle'), t('sedi.deleteMsg'), [
      { text: t('common.cancel'), style: 'cancel' as const },
      { text: t('common.delete'), style: 'destructive' as const, onPress: () => setLocations((items) => items.filter((item) => item.id !== locationId)) }
    ]);
  }

  function openNewShift(date: Date) {
    if (employees.length === 0 || locations.length === 0) {
      Alert.alert(t('turno.missingData'), t('turno.missingDataMsg'));
      return;
    }

    setShiftForm({
      id: null,
      employeeId: employees[0].id!,
      locationId: locations[0].id!,
      date: toISODate(date || new Date()),
      startTime: '09:00',
      endTime: '15:00',
      breakMinutes: '0',
      breakStartTime: '12:00',
      role: employees[0].role || '',
      notes: ''
    });
    setShiftModal(true);
  }

  function openEditShift(shift: Shift) {
    setShiftForm({ ...shift, breakMinutes: String(shift.breakMinutes || 0), breakStartTime: shift.breakStartTime || '' });
    setShiftModal(true);
  }

  function saveShift() {
    if (!shiftForm || !shiftForm.employeeId || !shiftForm.locationId || !shiftForm.date || !shiftForm.startTime || !shiftForm.endTime) {
      Alert.alert(t('turno.requiredFields'), t('turno.requiredFieldsMsg'));
      return;
    }

    const normalized: Shift = {
      ...shiftForm,
      breakMinutes: Number(shiftForm.breakMinutes || 0),
      breakStartTime: shiftForm.breakStartTime || undefined
    };

    if (hasShiftConflict(normalized, shifts)) {
      Alert.alert(t('turno.conflict'), t('turno.conflictMsg'));
      return;
    }

    if (normalized.id) {
      setShifts((items) => items.map((item) => (item.id === normalized.id ? normalized : item)));
    } else {
      setShifts((items) => [...items, { ...normalized, id: createId('shift') }]);
    }

    setShiftModal(false);
  }

  function deleteShift(shiftId: string) {
    setShifts((items) => items.filter((item) => item.id !== shiftId));
    setShiftModal(false);
  }

  function copyPreviousWeek() {
    const previousStart = addDays(weekStart, -7);
    const previousDates = getWeekDays(previousStart).map(toISODate);
    const currentDates = getWeekDays(weekStart).map(toISODate);
    const previousShifts = shifts.filter((shift) => previousDates.includes(shift.date));

    if (previousShifts.length === 0) {
      Alert.alert(t('turni.noShiftsToCopy'), t('turni.noShiftsToCopyMsg'));
      return;
    }

    const copied = previousShifts.map((shift) => {
      const index = previousDates.indexOf(shift.date);
      return { ...shift, id: createId('shift'), date: currentDates[index] };
    });

    setShifts((items) => [...items, ...copied]);
    Alert.alert(t('turni.copied'), t('turni.copiedMsg', { count: copied.length }));
  }

  async function handleExportPdf() {
    try {
      const result = await exportWeeklyPdf({ businessName, employees, locations, shifts: weekShifts, weekStart });
      if (!result.shared) {
        Alert.alert(t('export.pdfCreated'), t('export.pdfCreatedMsg', { uri: result.uri }));
      }
    } catch (error) {
      Alert.alert(t('export.exportError'), t('export.exportErrorMsg'));
    }
  }

  function handleReset() {
    Alert.alert(t('export.resetTitle'), t('export.resetMsg'), [
      { text: t('common.cancel'), style: 'cancel' as const },
      {
        text: t('common.delete'),
        style: 'destructive' as const,
        onPress: async () => {
          await resetAppData();
          const data = await loadAppData();
          setBusinessName(data.businessName);
          setEmployees(data.employees);
          setLocations(data.locations);
          setShifts(data.shifts);
        }
      }
    ]);
  }

  if (!ready) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}><Text>{t('common.loading')}</Text></View>
      </SafeAreaView>
    );
  }

  if (dayViewDate) {
    return (
      <>
        <GiornataScreen
          date={dayViewDate}
          employees={employees}
          locations={locations}
          shifts={shifts}
          onBack={() => setDayViewDate(null)}
          openNewShift={openNewShift}
          openEditShift={openEditShift}
        />
        <ShiftModal visible={shiftModal} form={shiftForm} setForm={setShiftForm} employees={employees} locations={locations} onSave={saveShift} onClose={() => setShiftModal(false)} onDelete={deleteShift} />
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={openMenu} style={styles.hamburgerButton}>
          <Text style={styles.hamburgerText}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.appTitle}>{t(`menu.${tab.toLowerCase()}`)}</Text>
        <View style={styles.flex1} />
        <TouchableOpacity onPress={() => setLangModalVisible(true)} style={styles.langHeaderButton}>
          <Text style={styles.langHeaderFlag}>{locale === 'it' ? '🇮🇹' : '🇬🇧'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {tab === 'Turni' && (
          <TurniScreen
            weekStart={weekStart}
            setWeekStart={setWeekStart}
            weekDays={weekDays}
            weekShifts={weekShifts}
            totalWeekHours={totalWeekHours}
            employees={employees}
            locations={locations}
            openNewShift={openNewShift}
            openEditShift={openEditShift}
            copyPreviousWeek={copyPreviousWeek}
          />
        )}
        {tab === 'Dipendenti' && (
          <DipendentiScreen
            employees={employees}
            openNewEmployee={openNewEmployee}
            openEditEmployee={openEditEmployee}
          />
        )}
        {tab === 'Sedi' && (
          <SediScreen
            locations={locations}
            openNewLocation={openNewLocation}
            openEditLocation={openEditLocation}
          />
        )}
        {tab === 'Calendario' && (
          <CalendarioScreen
            employees={employees}
            locations={locations}
            shifts={shifts}
            openNewShift={openNewShift}
            openEditShift={openEditShift}
            onViewDay={setDayViewDate}
          />
        )}
        {tab === 'Export' && (
          <ExportScreen
            businessName={businessName}
            setBusinessName={setBusinessName}
            handleExportPdf={handleExportPdf}
            handleReset={handleReset}
          />
        )}
      </ScrollView>

      {menuOpen ? (
        <View style={styles.menuWrapper}>
          <Animated.View style={[styles.menuBackdrop, { opacity: menuAnim }]}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeMenu} />
          </Animated.View>
          <Animated.View
            style={[
              styles.menuDrawer,
              { transform: [{ translateX: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [-280, 0] }) }] }
            ]}
          >
            <View style={styles.menuHeaderSection}>
              <Text style={styles.menuTitle}>{t('menu.navigation')}</Text>
            </View>
            {TABS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.menuItem, tab === item && styles.menuItemActive]}
                onPress={() => { setTab(item); closeMenu(); }}
              >
                <Text style={[styles.menuItemText, tab === item && styles.menuItemTextActive]}>{t(`menu.${item.toLowerCase()}`)}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </View>
      ) : null}

      <LanguageModal visible={langModalVisible} locale={locale} setLocale={setLocale} onClose={() => setLangModalVisible(false)} />
      <EmployeeModal visible={employeeModal} form={employeeForm} setForm={setEmployeeForm} onSave={saveEmployee} onClose={() => setEmployeeModal(false)} onDelete={deleteEmployee} />
      <LocationModal visible={locationModal} form={locationForm} setForm={setLocationForm} onSave={saveLocation} onClose={() => setLocationModal(false)} onDelete={deleteLocation} />
      <ShiftModal visible={shiftModal} form={shiftForm} setForm={setShiftForm} employees={employees} locations={locations} onSave={saveShift} onClose={() => setShiftModal(false)} onDelete={deleteShift} />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <LocaleProvider>
      <AppInner />
    </LocaleProvider>
  );
}

interface LanguageModalProps {
  visible: boolean;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  onClose: () => void;
}

function LanguageModal({ visible, locale, setLocale, onClose }: LanguageModalProps) {
  const { t } = useLocale();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{t('export.language')}</Text>
          <TouchableOpacity onPress={onClose}><Text style={styles.link}>{t('common.close')}</Text></TouchableOpacity>
        </View>
        <View style={styles.langModalContent}>
          <TouchableOpacity style={[styles.langModalOption, locale === 'it' && styles.langModalOptionActive]} onPress={() => { setLocale('it'); onClose(); }}>
            <Text style={styles.langModalFlag}>🇮🇹</Text>
            <Text style={[styles.langModalLabel, locale === 'it' && styles.langModalLabelActive]}>Italiano</Text>
            {locale === 'it' ? <Text style={styles.langModalCheck}>✓</Text> : null}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.langModalOption, locale === 'en' && styles.langModalOptionActive]} onPress={() => { setLocale('en'); onClose(); }}>
            <Text style={styles.langModalFlag}>🇬🇧</Text>
            <Text style={[styles.langModalLabel, locale === 'en' && styles.langModalLabelActive]}>English</Text>
            {locale === 'en' ? <Text style={styles.langModalCheck}>✓</Text> : null}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

interface BaseModalProps {
  visible: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

function BaseModal({ visible, title, children, onClose }: BaseModalProps) {
  const { t } = useLocale();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}><Text style={styles.link}>{t('common.close')}</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

interface EmployeeModalProps {
  visible: boolean;
  form: Employee | null;
  setForm: React.Dispatch<React.SetStateAction<Employee | null>>;
  onSave: () => void;
  onClose: () => void;
  onDelete: (id: string) => void;
}

function EmployeeModal({ visible, form, setForm, onSave, onClose, onDelete }: EmployeeModalProps) {
  const { t } = useLocale();
  if (!form) return null;
  return (
    <BaseModal visible={visible} title={form.id ? t('dipendenti.modalEdit') : t('dipendenti.modalCreate')} onClose={onClose}>
      <Card>
        <Field label={t('dipendenti.name')} value={form.name} onChangeText={(name) => setForm({ ...form, name })} placeholder={t('dipendenti.namePlaceholder')} />
        <Field label={t('dipendenti.role')} value={form.role} onChangeText={(role) => setForm({ ...form, role })} placeholder={t('dipendenti.rolePlaceholder')} />
        <Field label={t('dipendenti.phone')} value={form.phone} onChangeText={(phone) => setForm({ ...form, phone })} placeholder={t('dipendenti.phonePlaceholder')} keyboardType="phone-pad" />
        <Field label={t('dipendenti.email')} value={form.email} onChangeText={(email) => setForm({ ...form, email })} placeholder={t('dipendenti.emailPlaceholder')} keyboardType="email-address" />
        <ColorPicker label={t('dipendenti.color')} value={form.color} onChange={(color) => setForm({ ...form, color })} />
        <Field label={t('dipendenti.notes')} value={form.notes} onChangeText={(notes) => setForm({ ...form, notes })} placeholder={t('dipendenti.notesPlaceholder')} multiline />
        <Button title={t('dipendenti.saveButton')} onPress={onSave} />
        {form.id ? <><View style={styles.spacer} /><Button danger title={t('dipendenti.deleteButton')} onPress={() => onDelete(form.id!)} /></> : null}
      </Card>
    </BaseModal>
  );
}

interface LocationModalProps {
  visible: boolean;
  form: Location | null;
  setForm: React.Dispatch<React.SetStateAction<Location | null>>;
  onSave: () => void;
  onClose: () => void;
  onDelete: (id: string) => void;
}

function LocationModal({ visible, form, setForm, onSave, onClose, onDelete }: LocationModalProps) {
  const { t } = useLocale();
  if (!form) return null;
  return (
    <BaseModal visible={visible} title={form.id ? t('sedi.modalEdit') : t('sedi.modalCreate')} onClose={onClose}>
      <Card>
        <Field label={t('sedi.name')} value={form.name} onChangeText={(name) => setForm({ ...form, name })} placeholder={t('sedi.namePlaceholder')} />
        <Field label={t('sedi.address')} value={form.address} onChangeText={(address) => setForm({ ...form, address })} placeholder={t('sedi.addressPlaceholder')} />
        <Field label={t('sedi.notes')} value={form.notes} onChangeText={(notes) => setForm({ ...form, notes })} placeholder={t('sedi.notesPlaceholder')} multiline />
        <Button title={t('sedi.saveButton')} onPress={onSave} />
        {form.id ? <><View style={styles.spacer} /><Button danger title={t('sedi.deleteButton')} onPress={() => onDelete(form.id!)} /></> : null}
      </Card>
    </BaseModal>
  );
}

interface ShiftModalProps {
  visible: boolean;
  form: ShiftForm | null;
  setForm: React.Dispatch<React.SetStateAction<ShiftForm | null>>;
  employees: Employee[];
  locations: Location[];
  onSave: () => void;
  onClose: () => void;
  onDelete: (id: string) => void;
}

function ShiftModal({ visible, form, setForm, employees, locations, onSave, onClose, onDelete }: ShiftModalProps) {
  const { t } = useLocale();
  if (!form) return null;
  return (
    <BaseModal visible={visible} title={form.id ? t('turno.modalEdit') : t('turno.modalCreate')} onClose={onClose}>
      <Card>
        <Selector label={t('turno.employee')} value={form.employeeId} onChange={(employeeId) => {
          const employee = employees.find((item) => item.id === employeeId);
          setForm({ ...form, employeeId, role: employee?.role || form.role });
        }} options={employees.map((employee) => ({ value: employee.id!, label: employee.name }))} />
        <Selector label={t('turno.location')} value={form.locationId} onChange={(locationId) => setForm({ ...form, locationId })} options={locations.map((location) => ({ value: location.id!, label: location.name }))} />
        <Field label={t('turno.date')} value={form.date} onChangeText={(date) => setForm({ ...form, date })} placeholder={t('turno.datePlaceholder')} />
        <View style={styles.rowGap}>
          <View style={styles.flex1}><TimePicker label={t('turno.start')} value={form.startTime} onChange={(startTime) => setForm({ ...form, startTime })} /></View>
          <View style={styles.flex1}><TimePicker label={t('turno.end')} value={form.endTime} onChange={(endTime) => setForm({ ...form, endTime })} /></View>
        </View>
        <View style={styles.rowGap}>
          <View style={styles.flex1}><TimePicker label={t('turno.breakStart')} value={form.breakStartTime || t('turno.breakStartPlaceholder')} onChange={(breakStartTime) => setForm({ ...form, breakStartTime })} /></View>
          <View style={styles.flex1}><BreakStepper label={t('turno.break')} value={form.breakMinutes} onChange={(breakMinutes) => setForm({ ...form, breakMinutes })} /></View>
        </View>
        <Field label={t('turno.role')} value={form.role} onChangeText={(role) => setForm({ ...form, role })} placeholder={t('turno.rolePlaceholder')} />
        <Field label={t('turno.notes')} value={form.notes} onChangeText={(notes) => setForm({ ...form, notes })} placeholder={t('turno.notesPlaceholder')} multiline />
        <Button title={t('turno.saveButton')} onPress={onSave} />
        {form.id ? <><View style={styles.spacer} /><Button danger title={t('turno.deleteButton')} onPress={() => onDelete(form.id!)} /></> : null}
      </Card>
    </BaseModal>
  );
}
