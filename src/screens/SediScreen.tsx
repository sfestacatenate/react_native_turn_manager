import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Card, Button } from '../components';
import { styles } from '../styles';
import { useLocale } from '../locales';
import { Location } from '../types';

interface SediScreenProps {
  locations: Location[];
  openNewLocation: () => void;
  openEditLocation: (location: Location) => void;
}

export default function SediScreen({ locations, openNewLocation, openEditLocation }: SediScreenProps) {
  const { t } = useLocale();
  return (
    <View>
      <Card>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>{t('sedi.title')}</Text>
          <Button title={t('sedi.addButton')} onPress={openNewLocation} />
        </View>
      </Card>
      {locations.map((location) => (
        <Card key={location.id}>
          <TouchableOpacity onPress={() => openEditLocation(location)}>
            <Text style={styles.itemTitle}>{location.name}</Text>
            <Text style={styles.itemSubtitle}>{location.address || t('sedi.notSet')}</Text>
            {location.notes ? <Text style={styles.itemMeta}>{location.notes}</Text> : null}
          </TouchableOpacity>
        </Card>
      ))}
    </View>
  );
}
