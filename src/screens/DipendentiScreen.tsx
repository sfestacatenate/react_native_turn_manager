import React, { useMemo, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Card, Button } from '../components';
import { styles } from '../styles';
import { useLocale } from '../locales';
import { Employee } from '../types';

interface DipendentiScreenProps {
  employees: Employee[];
  openNewEmployee: () => void;
  openEditEmployee: (employee: Employee) => void;
}

export default function DipendentiScreen({ employees, openNewEmployee, openEditEmployee }: DipendentiScreenProps) {
  const { t } = useLocale();
  const [searchText, setSearchText] = useState('');
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = useMemo(() => {
    const list = employees.filter((e) =>
      e.name.toLowerCase().includes(searchText.toLowerCase())
    );
    list.sort((a, b) => {
      const cmp = a.name.localeCompare(b.name);
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [employees, searchText, sortAsc]);

  return (
    <View>
      <Card>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>{t('dipendenti.title')}</Text>
          <Button title={t('dipendenti.addButton')} onPress={openNewEmployee} />
        </View>
        <View style={styles.filterRow}>
          <TextInput
            style={[styles.input, styles.filterInput]}
            value={searchText}
            onChangeText={setSearchText}
            placeholder={t('dipendenti.filterPlaceholder')}
            placeholderTextColor="#9ca3af"
          />
          <TouchableOpacity style={styles.sortButton} onPress={() => setSortAsc(!sortAsc)}>
            <Text style={styles.sortButtonText}>{sortAsc ? t('common.AtoZ') : t('common.ZtoA')}</Text>
          </TouchableOpacity>
        </View>
      </Card>
      {filtered.length === 0 ? (
        <Text style={[styles.emptyText, { textAlign: 'center', marginTop: 24 }]}>
          {searchText ? t('dipendenti.notFound') : t('dipendenti.empty')}
        </Text>
      ) : (
        filtered.map((employee) => (
          <Card key={employee.id}>
            <TouchableOpacity onPress={() => openEditEmployee(employee)}>
              <View style={styles.row}>
                <View style={[styles.colorDot, { backgroundColor: employee.color || '#2563eb' }]} />
                <View style={styles.flex1}>
                  <Text style={styles.itemTitle}>{employee.name}</Text>
                  <Text style={styles.itemSubtitle}>{employee.role || t('common.notSet')}</Text>
                  {employee.phone ? <Text style={styles.itemMeta}>{employee.phone}</Text> : null}
                </View>
              </View>
            </TouchableOpacity>
          </Card>
        ))
      )}
    </View>
  );
}
