import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { Card, Button } from '../components';
import { styles } from '../styles';
import { useLocale } from '../locales';

interface ExportScreenProps {
  businessName: string;
  setBusinessName: (name: string) => void;
  handleExportPdf: () => void;
  handleReset: () => void;
}

export default function ExportScreen({ businessName, setBusinessName, handleExportPdf, handleReset }: ExportScreenProps) {
  const { t } = useLocale();
  return (
    <View>
      <Card>
        <Text style={styles.sectionTitle}>{t('export.settings')}</Text>
        <Text style={styles.label}>{t('export.businessName')}</Text>
        <TextInput style={styles.input} value={businessName} onChangeText={setBusinessName} placeholder={t('export.businessNamePlaceholder')} />
      </Card>
      <Card>
        <Text style={styles.sectionTitle}>{t('export.exportPdf')}</Text>
        <Text style={styles.itemSubtitle}>{t('export.exportPdfDesc')}</Text>
        <View style={styles.spacer} />
        <Button title={t('export.exportButton')} onPress={handleExportPdf} />
      </Card>
      <Card>
        <Text style={styles.sectionTitle}>{t('export.localData')}</Text>
        <Text style={styles.itemSubtitle}>{t('export.localDataDesc')}</Text>
        <View style={styles.spacer} />
        <Button danger title={t('export.resetButton')} onPress={handleReset} />
      </Card>
    </View>
  );
}
