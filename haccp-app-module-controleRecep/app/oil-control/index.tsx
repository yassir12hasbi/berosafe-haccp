import { Stack, useRouter } from 'expo-router';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import oilControlApi, {
  Equipment,
  OilControlInitialData,
  Zone
} from '../../api/oil-control';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { BeroColors } from '../../constants/theme';
import { getErrorDetails } from '../../utils/error';

interface SidebarProps {
  data: OilControlInitialData | null;
  selectedZone: Zone | 'all';
  setSelectedZone: (zone: Zone | 'all') => void;
  filteredEquipments: Equipment[];
  selectedFryer: Equipment | null;
  onSelectFryer: (f: Equipment) => void;
}

// memorisation du sidbar
const Sidebar = memo(({ data, selectedZone, setSelectedZone, filteredEquipments, selectedFryer, onSelectFryer }: SidebarProps) => {
  return (
    <View style={styles.sidebar}>
      <ThemedText style={styles.sectionTitle}>1. Choisir l&apos;équipement</ThemedText>

      <View style={styles.zoneTabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
          <TouchableOpacity
            style={[styles.tab, selectedZone === 'all' && styles.activeTab]}
            onPress={() => setSelectedZone('all')}
          >
            <ThemedText style={[styles.tabText, selectedZone === 'all' && styles.activeTabText]}>Toutes</ThemedText>
          </TouchableOpacity>

          {data?.zones.map(z => (
            <TouchableOpacity
              key={z.id}
              style={[styles.tab, selectedZone !== 'all' && selectedZone?.id === z.id && styles.activeTab]}
              onPress={() => setSelectedZone(z)}
            >
              <ThemedText style={[styles.tabText, selectedZone !== 'all' && selectedZone?.id === z.id && styles.activeTabText]}>{z.name}</ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.list}>
        {filteredEquipments.map(f => (
          <TouchableOpacity
            key={f.id}
            style={[
              styles.itemCard,
              selectedFryer?.id === f.id && styles.activeItemCard
            ]}
            onPress={() => onSelectFryer(f)}
          >
            <View style={styles.itemInfo}>
              <View style={[styles.fryerIconBg, selectedFryer?.id === f.id && styles.activeFryerIconBg]}>
                <IconSymbol name="fryer" size={24} color={selectedFryer?.id === f.id ? '#fff' : BeroColors.blue} />
              </View>
              <View>
                <ThemedText style={[styles.itemName, selectedFryer?.id === f.id && styles.activeItemName]}>{f.code}</ThemedText>
                <ThemedText style={[styles.itemDesc, selectedFryer?.id === f.id && styles.activeItemDesc]}>
                  {f.description || 'Friteuse'}
                  {selectedZone === 'all' && (
                    <ThemedText style={styles.zoneLabel}> • {data?.zones.find(z => z.equipments.some(e => e.id === f.id))?.name}</ThemedText>
                  )}
                </ThemedText>
              </View>
            </View>
            {selectedFryer?.id === f.id ? (
              <IconSymbol name="checkmark" size={20} color={BeroColors.blue} />
            ) : (
              <IconSymbol name="chevron.right" size={20} color="#cbd5e1" />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
});

export default function OilControlScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [data, setData] = useState<OilControlInitialData | null>(null);

  const [selectedZone, setSelectedZone] = useState<Zone | 'all'>('all');
  const [selectedFryer, setSelectedFryer] = useState<Equipment | null>(null);

  const [temp, setTemp] = useState('160');
  const [peroxide, setPeroxide] = useState('15');
  const [status, setStatus] = useState<'reused' | 'changed'>('reused');
  const [checklistResults, setChecklistResults] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const res = await oilControlApi.getInitialData();
      setData(res);
    } catch (error) {
      const { title, message } = getErrorDetails(error, 'Chargement impossible', 'Impossible de charger les equipements.');
      console.error('Fetch Oil Data Error:', message);
      Alert.alert(title, message);
    } finally {
      setLoading(false);
    }
  };

  const parseLocalizedFloat = (val: string) => {
    return parseFloat(val.replace(',', '.')) || 0;
  };

  const handleTempChange = (val: string) => {
    setTemp(val.replace(',', '.'));
  };

  const handlePeroxideChange = (val: string) => {
    setPeroxide(val.replace(',', '.'));
  };

  const tempAlert = useMemo(() => {
    const t = parseLocalizedFloat(temp);
    return t > 180;
  }, [temp]);

  const peroxideCritical = useMemo(() => {
    const p = parseLocalizedFloat(peroxide);
    return p >= 24;
  }, [peroxide]);

  useEffect(() => {
    if (peroxideCritical) {
      setStatus('changed');
    }
  }, [peroxideCritical]);

  const toggleChecklist = useCallback((id: number) => {
    setChecklistResults(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);

  const handleSelectFryer = useCallback((f: Equipment) => {
    setSelectedFryer(f);

    setTemp('160');
    setPeroxide('15');
    setStatus('reused');

    const initial: Record<number, boolean> = {};
    f.checklists.forEach(c => initial[c.id] = true);
    setChecklistResults(initial);
  }, []);

  const resetForm = () => {
    setSelectedFryer(null);
    setTemp('160');
    setPeroxide('15');
    setStatus('reused');
    setChecklistResults({});
  };

  const handleSave = async () => {
    if (!selectedFryer) return;

    try {
      setIsSubmitting(true);

      const payloadChecklists = selectedFryer.checklists.map(c => ({
        checklist_id: c.id,
        recorded_value: !!checklistResults[c.id]
      }));

      await oilControlApi.storeControl({
        equipment_id: selectedFryer.id,
        temperature: temp ? parseLocalizedFloat(temp) : null,
        peroxide_value: peroxide ? parseLocalizedFloat(peroxide) : null,
        status: status,
        checklists: payloadChecklists
      });

      resetForm();
      Alert.alert('Succès', 'Rapport de contrôle enregistré avec succès !', [{ text: 'OK' }]);

    } catch (error) {
      const { title, message } = getErrorDetails(error, 'Enregistrement impossible', "Echec de l'enregistrement.");
      console.error('Save Oil Error:', message);
      Alert.alert(title, message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEquipments = useMemo(() => {
    if (!data) return [];
    if (selectedZone === 'all') {
      return data.zones.reduce((acc, zone) => {
        return [...acc, ...zone.equipments];
      }, [] as Equipment[]);
    }
    return selectedZone.equipments;
  }, [data, selectedZone]);

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTitleContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={20} color={BeroColors.blue} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Contrôle des Huiles</ThemedText>
      </View>
    </View>
  );

  const renderFormContainer = () => {
    if (!selectedFryer) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBg}>
            <IconSymbol name="fryer" size={48} color="#94a3b8" />
          </View>
          <ThemedText style={styles.emptyTitle}>Aucune friteuse sélectionnée</ThemedText>
          <ThemedText style={styles.emptySub}>Veuillez choisir une friteuse dans la liste à gauche pour commencer le contrôle.</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.formContainer}>
        <ThemedText style={styles.sectionTitle}>2. Rapport : {selectedFryer.code}</ThemedText>

        <View style={styles.measureRow}>
          <View style={[styles.measureCard, tempAlert && styles.alertCard]}>
            <ThemedText style={styles.measureLabel}>Température (°C)</ThemedText>
            <View style={styles.adjuster}>
              <TouchableOpacity onPress={() => setTemp(t => (parseLocalizedFloat(t) - 1).toString())} style={styles.adjustBtn}>
                <IconSymbol name="minus" size={20} color={BeroColors.blue} />
              </TouchableOpacity>
              <TextInput
                style={styles.measureInput}
                keyboardType="numeric"
                value={temp}
                onChangeText={handleTempChange}
              />
              <TouchableOpacity onPress={() => setTemp(t => (parseLocalizedFloat(t) + 1).toString())} style={styles.adjustBtn}>
                <IconSymbol name="plus" size={20} color={BeroColors.blue} />
              </TouchableOpacity>
            </View>
            {tempAlert && (
              <ThemedText style={styles.alertNote}>T° Trop élevée ({'>'}180°C)</ThemedText>
            )}
          </View>

          <View style={[styles.measureCard, peroxideCritical && styles.criticalCard]}>
            <ThemedText style={styles.measureLabel}>Indice Peroxyde (%)</ThemedText>
            <View style={styles.adjuster}>
              <TouchableOpacity onPress={() => setPeroxide(p => (parseLocalizedFloat(p) - 1).toString())} style={styles.adjustBtn}>
                <IconSymbol name="minus" size={20} color={BeroColors.blue} />
              </TouchableOpacity>
              <TextInput
                style={styles.measureInput}
                keyboardType="numeric"
                value={peroxide}
                onChangeText={handlePeroxideChange}
              />
              <TouchableOpacity onPress={() => setPeroxide(p => (parseLocalizedFloat(p) + 1).toString())} style={styles.adjustBtn}>
                <IconSymbol name="plus" size={20} color={BeroColors.blue} />
              </TouchableOpacity>
            </View>
            {peroxideCritical && (
              <ThemedText style={styles.criticalNote}>SEUIL CRITIQUE (≥24%)</ThemedText>
            )}
          </View>
        </View>

        <View style={styles.statusContainer}>
          <ThemedText style={styles.subsectionTitle}>Action sur l&apos;huile</ThemedText>
          <View style={styles.toggleTrack}>
            <TouchableOpacity
              style={[styles.toggleBtn, status === 'reused' && styles.reusedActive]}
              onPress={() => {
                if (peroxideCritical) {
                  Alert.alert(
                    'Attention',
                    "L'indice de peroxyde est élevé (≥ 24%). Souhaitez-vous vraiment réutiliser cette huile ?",
                    [
                      { text: 'Annuler', style: 'cancel' },
                      { text: 'Réutiliser quand même', onPress: () => setStatus('reused') }
                    ]
                  );
                } else {
                  setStatus('reused');
                }
              }}
            >
              <IconSymbol name="recycle" size={20} color={status === 'reused' ? '#fff' : '#64748b'} />
              <ThemedText style={[styles.toggleText, status === 'reused' && styles.whiteText]}>Réutilisée</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleBtn, status === 'changed' && styles.changedActive]}
              onPress={() => setStatus('changed')}
            >
              <IconSymbol name="trash.can" size={20} color={status === 'changed' ? '#fff' : '#64748b'} />
              <ThemedText style={[styles.toggleText, status === 'changed' && styles.whiteText]}>Changée</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.checklistSection}>
          <ThemedText style={styles.subsectionTitle}>Contrôle Visuel</ThemedText>
          {selectedFryer.checklists.map(c => (
            <TouchableOpacity
              key={c.id}
              style={[styles.checkItem, checklistResults[c.id] ? styles.checkItemChecked : styles.checkItemUnchecked]}
              onPress={() => toggleChecklist(c.id)}
            >
              <ThemedText style={[styles.checkText, !checklistResults[c.id] && styles.checkTextError]}>{c.name}</ThemedText>
              <View style={[styles.checkBox, checklistResults[c.id] ? styles.checkBoxChecked : styles.checkBoxError]}>
                <IconSymbol
                  name={checklistResults[c.id] ? "checkmark" : "chevron.left.forwardslash.chevron.right"}
                  size={14}
                  color="#fff"
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={isSubmitting}
        >
          {isSubmitting ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.primaryButtonText}>Valider le rapport</ThemedText>}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaProvider style={{ flex: 1 }}>
        {renderHeader()}
        {loading && !data ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BeroColors.blue} />
          </View>
        ) : (
          <View style={styles.splitContainer}>
            <Sidebar
              data={data}
              selectedZone={selectedZone}
              setSelectedZone={setSelectedZone}
              filteredEquipments={filteredEquipments}
              selectedFryer={selectedFryer}
              onSelectFryer={handleSelectFryer}
            />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.formArea}>
              <ScrollView style={{ flex: 1 }}>
                {renderFormContainer()}
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        )}
      </SafeAreaProvider>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: BeroColors.dark, marginLeft: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  splitContainer: { flex: 1, flexDirection: 'row' },

  sidebar: {
    width: '35%',
    maxWidth: 400,
    minWidth: 300,
    backgroundColor: '#f1f5f9',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    padding: 20,
  },
  formArea: { flex: 1, backgroundColor: '#fff' },
  formContainer: { padding: 24, flex: 1 },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 80,
  },
  emptyIconBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#64748b', marginBottom: 12 },
  emptySub: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 22 },

  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: 20 },
  subsectionTitle: { fontSize: 11, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 16 },

  zoneTabs: { marginBottom: 20 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff', borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  activeTab: { backgroundColor: BeroColors.blue, borderColor: BeroColors.blue },
  tabText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  activeTabText: { color: '#fff' },

  list: { flex: 1 },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1
  },
  activeItemCard: { borderColor: BeroColors.blue, backgroundColor: '#eff6ff' },
  itemInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fryerIconBg: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  activeFryerIconBg: { backgroundColor: BeroColors.blue },
  itemName: { fontSize: 16, fontWeight: '800', color: BeroColors.dark },
  activeItemName: { color: BeroColors.blue },
  itemDesc: { fontSize: 12, color: '#94a3b8' },
  zoneLabel: { color: '#64748b', fontStyle: 'italic' },
  activeItemDesc: { color: '#64748b' },

  measureRow: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  measureCard: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  alertCard: { borderColor: '#f97316', backgroundColor: '#fff7ed' },
  criticalCard: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
  measureLabel: { fontSize: 11, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 16 },
  adjuster: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', borderRadius: 12, padding: 8 },
  adjustBtn: { width: 44, height: 44, backgroundColor: '#fff', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  measureInput: { flex: 1, fontSize: 24, fontWeight: '900', color: BeroColors.dark, textAlign: 'center' },
  alertNote: { color: '#f97316', fontSize: 11, fontWeight: '800', textAlign: 'center', marginTop: 12 },
  criticalNote: { color: '#ef4444', fontSize: 11, fontWeight: '900', textAlign: 'center', marginTop: 12 },

  statusContainer: { marginBottom: 32 },
  toggleTrack: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 24, padding: 8, gap: 8 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 18 },
  toggleText: { fontSize: 15, fontWeight: '800', color: '#64748b' },
  reusedActive: { backgroundColor: BeroColors.green },
  changedActive: { backgroundColor: '#eab308' },
  whiteText: { color: '#fff' },

  checklistSection: { marginBottom: 40 },
  checkItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderRadius: 20, marginBottom: 12, borderWidth: 1 },
  checkItemChecked: { backgroundColor: '#f0fdf4', borderColor: BeroColors.green },
  checkItemUnchecked: { backgroundColor: '#fef2f2', borderColor: '#ef4444' },
  checkText: { fontSize: 15, fontWeight: '700', color: '#13385E' },
  checkTextError: { color: '#b91c1c' },
  checkBox: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  checkBoxChecked: { backgroundColor: BeroColors.green },
  checkBoxError: { backgroundColor: '#ef4444' },

  primaryButton: { backgroundColor: '#13385E', padding: 22, borderRadius: 24, alignItems: 'center', shadowColor: '#13385E', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '900', textTransform: 'uppercase' },
  buttonDisabled: { backgroundColor: '#94a3b8', shadowOpacity: 0 }
});