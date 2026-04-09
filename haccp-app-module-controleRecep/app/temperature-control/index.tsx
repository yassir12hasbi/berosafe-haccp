import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { BeroColors } from '../../constants/theme';
import temperatureControlApi, {
  TemperatureControlInitialData,
  Zone,
  Equipment,
  TemperatureCheckTime
} from '../../api/temperature-control';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getErrorDetails } from '../../utils/error';

interface SidebarProps {
  data: TemperatureControlInitialData | null;
  selectedZone: Zone | 'all';
  setSelectedZone: (zone: Zone | 'all') => void;
  filteredEquipments: Equipment[];
  selectedEquipment: Equipment | null;
  onSelectEquipment: (e: Equipment) => void;
}

const Sidebar = memo(({ data, selectedZone, setSelectedZone, filteredEquipments, selectedEquipment, onSelectEquipment }: SidebarProps) => {
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
         {filteredEquipments.map(f => {
           const isSelected = selectedEquipment?.id === f.id;
           const completedChecks = f.check_times.filter(c => c.already_done).length;
           const totalChecks = f.check_times.length;
           const isAllDone = completedChecks === totalChecks && totalChecks > 0;

           return (
             <TouchableOpacity
               key={f.id}
               style={[
                 styles.itemCard,
                 isSelected && styles.activeItemCard,
                 isAllDone && styles.completedItemCard
               ]}
               onPress={() => onSelectEquipment(f)}
               disabled={isAllDone && !isSelected}
             >
               <View style={styles.itemInfo}>
                  <View style={[styles.iconBg, isSelected && styles.activeIconBg, isAllDone && styles.completedIconBg]}>
                     <IconSymbol
                       name="snowflake"
                       size={24}
                       color={isSelected || isAllDone ? '#fff' : BeroColors.blue}
                     />
                  </View>
                  <View>
                     <ThemedText style={[styles.itemName, isSelected && styles.activeItemName, isAllDone && styles.completedText]}>{f.code}</ThemedText>
                     <ThemedText style={[styles.itemDesc, isSelected && styles.activeItemDesc, isAllDone && styles.completedText]}>
                       {f.description || 'Frigo'}
                       {selectedZone === 'all' && (
                         <ThemedText style={[styles.zoneLabel, isAllDone && styles.completedText]}> • {data?.zones.find(z => z.equipments.some(e => e.id === f.id))?.name}</ThemedText>
                       )}
                     </ThemedText>
                     <ThemedText style={[styles.progressText, isAllDone && styles.completedText]}>{completedChecks}/{totalChecks} relevés faits</ThemedText>
                  </View>
               </View>
               {isAllDone ? (
                  <IconSymbol name="checkmark" size={20} color={BeroColors.green} />
               ) : (
                  isSelected ? (
                   <IconSymbol name="chevron.right" size={20} color={BeroColors.blue} />
                  ) : (
                   <IconSymbol name="chevron.right" size={20} color="#cbd5e1" />
                  )
               )}
             </TouchableOpacity>
           );
         })}
      </ScrollView>
    </View>
  );
});

// Select Composant
const CustomSelect = ({
  label,
  options,
  selectedValue,
  onSelect
}: {
  label: string,
  options: string[],
  selectedValue: string,
  onSelect: (val: string) => void
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.selectWrapper}>
      <ThemedText style={styles.selectLabel}>{label}</ThemedText>
      <TouchableOpacity style={styles.selectButton} onPress={() => setModalVisible(true)}>
        <ThemedText style={selectedValue ? styles.selectValueText : styles.selectPlaceholder}>
          {selectedValue || 'Au choix...'}
        </ThemedText>
        <IconSymbol name="chevron.right" size={20} color="#94a3b8" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
           <View style={styles.modalContent}>
              <ThemedText style={styles.modalTitle}>{label}</ThemedText>
              {options.map((opt, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.modalOption, selectedValue === opt && styles.modalOptionActive]}
                  onPress={() => {
                    onSelect(opt);
                    setModalVisible(false);
                  }}
                >
                  <ThemedText style={[styles.modalOptionText, selectedValue === opt && styles.modalOptionTextActive]}>{opt}</ThemedText>
                  {selectedValue === opt && <IconSymbol name="checkmark" size={18} color={BeroColors.blue} />}
                </TouchableOpacity>
              ))}
           </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default function TemperatureControlScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data
  const [data, setData] = useState<TemperatureControlInitialData | null>(null);

  // Selection
  const [selectedZone, setSelectedZone] = useState<Zone | 'all'>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  // Form State
  const [selectedCheckTime, setSelectedCheckTime] = useState<TemperatureCheckTime | null>(null);
  const [temp, setTemp] = useState('');
  const [probableCause, setProbableCause] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [comments, setComments] = useState('');

  const CAUSE_OPTIONS = [
    "Porte restée ouverte",
    "Panne moteur",
    "Surcharge de produit",
    "Coupure de courant",
    "Autre"
  ];

  const ACTION_OPTIONS = [
    "Marchandise jetée",
    "Marchandise déplacée",
    "Technicien appelé",
    "Réglage thermostat",
    "Autre"
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const res = await temperatureControlApi.getInitialData();
      setData(res);
    } catch (error) {
      const { title, message } = getErrorDetails(error, 'Chargement impossible', 'Impossible de charger les equipements.');
      console.error('Fetch Temp Data Error:', message);
      Alert.alert(title, message);
    } finally {
      setLoading(false);
    }
  };

  const parseLocalizedFloat = (val: string) => {
    return parseFloat(val.replace(',', '.'));
  };

  const handleTempChange = (val: string) => {
    setTemp(val.replace(',', '.'));
  };

  // Threshold Logic
  const isAnomalous = useMemo(() => {
    if (!selectedEquipment || temp === '') return false;
    const t = parseLocalizedFloat(temp);
    if (isNaN(t)) return false;

    // Check ranges
    const min = selectedEquipment.min_temperature;
    const max = selectedEquipment.max_temperature;

    if (min !== null && t < min) return true;
    if (max !== null && t > max) return true;
    return false;
  }, [temp, selectedEquipment]);

  const handleSelectEquipment = useCallback((e: Equipment) => {
    setSelectedEquipment(e);

    // Reset Form
    setTemp('');
    setProbableCause('');
    setCorrectiveAction('');
    setComments('');

    // Auto-select first not done check time
    const firstAvailable = e.check_times.find(c => !c.already_done);
    setSelectedCheckTime(firstAvailable || null);
  }, []);

  const resetForm = () => {
    setSelectedEquipment(null);
    setSelectedCheckTime(null);
    setTemp('');
    setProbableCause('');
    setCorrectiveAction('');
    setComments('');
  };

  const handleSave = async () => {
    if (!selectedEquipment || !selectedCheckTime) return;

    if (temp.trim() === '') {
      Alert.alert('Erreur', 'Veuillez saisir une température valide avant de valider.', [{ text: 'OK' }]);
      return;
    }

    const t = parseLocalizedFloat(temp);
    if (isNaN(t)) {
      Alert.alert('Erreur', 'Format de température invalide.', [{ text: 'OK' }]);
      return;
    }

    try {
      setIsSubmitting(true);

      await temperatureControlApi.storeControl({
        equipment_id: selectedEquipment.id,
        check_time_id: selectedCheckTime.id,
        temperature: t,
        probable_cause: isAnomalous ? probableCause : null,
        corrective_action: isAnomalous ? correctiveAction : null,
        comments: isAnomalous ? comments : null,
      });

      // Update local state to reflect that this check_time is now done
      if (data) {
        const newData = { ...data };
        newData.zones.forEach(z => {
          z.equipments.forEach(eq => {
            if (eq.id === selectedEquipment.id) {
              const ct = eq.check_times.find(c => c.id === selectedCheckTime.id);
              if (ct) ct.already_done = true;
            }
          });
        });
        setData(newData);
      }

      resetForm();
      Alert.alert('Succès', 'Relevé enregistré avec succès !', [{ text: 'OK' }]);

    } catch (error: any) {
      const isConflict = error?.response?.status === 409;
      const msg = isConflict
        ? "Un relevé pour ce créneau a déjà été enregistré aujourd'hui."
        : "Echec de l'enregistrement.";
      const { title, message } = getErrorDetails(error, 'Enregistrement impossible', msg);

      console.error('Save Temp Error:', message);
      Alert.alert(title, message);

      if (isConflict) fetchInitialData();
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
          <ThemedText style={styles.headerTitle}>Contrôle Températures</ThemedText>
       </View>
    </View>
  );

  const renderFormContainer = () => {
    if (!selectedEquipment) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBg}>
            <IconSymbol name="snowflake" size={48} color="#94a3b8" />
          </View>
          <ThemedText style={styles.emptyTitle}>Aucun équipement sélectionné</ThemedText>
          <ThemedText style={styles.emptySub}>Veuillez choisir un frigo ou chambre froide dans la liste à gauche pour commencer le contrôle.</ThemedText>
        </View>
      );
    }

    const allTimesDone = selectedEquipment.check_times.length > 0 && selectedEquipment.check_times.every(c => c.already_done);

    return (
      <View style={styles.formContainer}>
        <ThemedText style={styles.sectionTitle}>2. Relevé : {selectedEquipment.code}</ThemedText>

        <View style={styles.checkTimesRow}>
          {selectedEquipment.check_times.map(ct => {
            const isSelected = selectedCheckTime?.id === ct.id;
            return (
              <TouchableOpacity
                key={ct.id}
                style={[
                  styles.timeCard,
                  ct.already_done && styles.timeCardDone,
                  isSelected && styles.timeCardActive
                ]}
                disabled={ct.already_done}
                onPress={() => setSelectedCheckTime(ct)}
              >
                {ct.already_done ? (
                   <IconSymbol name="checkmark" size={16} color={BeroColors.green} />
                ) : (
                   <IconSymbol name="calendar" size={16} color={isSelected ? '#fff' : '#64748b'} />
                )}
                <ThemedText style={[
                  styles.timeCardLabel,
                  ct.already_done && styles.timeCardLabelDone,
                  isSelected && styles.timeCardLabelActive
                ]}>{ct.label}</ThemedText>
                <ThemedText style={[
                  styles.timeCardValue,
                  ct.already_done && styles.timeCardValueDone,
                  isSelected && styles.timeCardValueActive
                ]}>{ct.check_time.substring(0, 5)}</ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>

        {allTimesDone ? (
          <View style={styles.allDoneBox}>
             <IconSymbol name="checkmark" size={32} color={BeroColors.green} />
             <ThemedText style={styles.allDoneTitle}>Tous les relevés sont effectués</ThemedText>
             <ThemedText style={styles.allDoneDesc}>Cet équipement est à jour pour aujourd'hui.</ThemedText>
          </View>
        ) : (
          <>
            <View style={[styles.measureCard, isAnomalous && styles.criticalCard]}>
               <View style={styles.measureHeader}>
                 <ThemedText style={styles.measureLabel}>Température Relevée (°C)</ThemedText>
                 <ThemedText style={styles.seuilBadge}>
                   Min {selectedEquipment.min_temperature}°C / Max {selectedEquipment.max_temperature}°C
                 </ThemedText>
               </View>

               <View style={styles.adjusterLarge}>
                  <TouchableOpacity
                    onPress={() => setTemp(t => {
                      const val = parseLocalizedFloat(t);
                      return (isNaN(val) ? 0 : val - 1).toString();
                    })}
                    style={styles.adjustBtnLarge}
                  >
                     <IconSymbol name="minus" size={24} color={BeroColors.blue} />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.measureInputLarge}
                    keyboardType="numeric"
                    value={temp}
                    onChangeText={handleTempChange}
                    placeholder="--"
                  />
                  <TouchableOpacity
                    onPress={() => setTemp(t => {
                      const val = parseLocalizedFloat(t);
                      return (isNaN(val) ? 0 : val + 1).toString();
                    })}
                    style={styles.adjustBtnLarge}
                  >
                     <IconSymbol name="plus" size={24} color={BeroColors.blue} />
                  </TouchableOpacity>
               </View>
               {isAnomalous && (
                  <ThemedText style={styles.criticalNote}>Température hors normes détectée !</ThemedText>
               )}
            </View>

            {isAnomalous && (
               <View style={styles.anomalyContainer}>
                  <ThemedText style={styles.anomalyTitle}>Action requise (Anomalie)</ThemedText>

                  <CustomSelect
                    label="Cause Probable"
                    options={CAUSE_OPTIONS}
                    selectedValue={probableCause}
                    onSelect={setProbableCause}
                  />

                  <CustomSelect
                    label="Action Corrective Immédiate"
                    options={ACTION_OPTIONS}
                    selectedValue={correctiveAction}
                    onSelect={setCorrectiveAction}
                  />

                  <View style={styles.selectWrapper}>
                    <ThemedText style={styles.selectLabel}>Commentaires (Optionnel)</ThemedText>
                    <TextInput
                      style={styles.largeInput}
                      multiline
                      value={comments}
                      onChangeText={setComments}
                      placeholder="Détails supplémentaires..."
                    />
                  </View>
               </View>
            )}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!selectedCheckTime || isSubmitting) && styles.buttonDisabled
              ]}
              onPress={handleSave}
              disabled={!selectedCheckTime || isSubmitting}
            >
               {isSubmitting ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.primaryButtonText}>Enregistrer le relevé</ThemedText>}
            </TouchableOpacity>
          </>
        )}

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
               selectedEquipment={selectedEquipment}
               onSelectEquipment={handleSelectEquipment}
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

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: 320, backgroundColor: '#fff', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width:0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: BeroColors.dark, marginBottom: 16, textAlign: 'center' },
  modalOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, backgroundColor: '#f8fafc', marginBottom: 8 },
  modalOptionActive: { backgroundColor: '#eff6ff' },
  modalOptionText: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  modalOptionTextActive: { color: BeroColors.blue },

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
  completedItemCard: { borderColor: '#e2e8f0', backgroundColor: '#f8fafc', opacity: 0.8 },
  itemInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBg: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  activeIconBg: { backgroundColor: BeroColors.blue },
  completedIconBg: { backgroundColor: '#f1f5f9' },
  itemName: { fontSize: 16, fontWeight: '800', color: BeroColors.dark },
  activeItemName: { color: BeroColors.blue },
  itemDesc: { fontSize: 12, color: '#94a3b8' },
  zoneLabel: { color: '#64748b', fontStyle: 'italic' },
  activeItemDesc: { color: '#64748b' },
  progressText: { fontSize: 11, fontWeight: '700', color: BeroColors.green, marginTop: 4 },
  completedText: { color: '#94a3b8' },

  checkTimesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  timeCard: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16 },
  timeCardActive: { backgroundColor: BeroColors.blue, borderColor: BeroColors.blue },
  timeCardDone: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', opacity: 0.7 },
  timeCardLabel: { fontSize: 15, fontWeight: '800', color: BeroColors.dark },
  timeCardLabelActive: { color: '#fff' },
  timeCardLabelDone: { color: BeroColors.green },
  timeCardValue: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  timeCardValueActive: { color: '#bfdbfe' },
  timeCardValueDone: { color: '#22c55e' },

  allDoneBox: { backgroundColor: '#f0fdf4', borderRadius: 20, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0', marginTop: 20 },
  allDoneTitle: { fontSize: 18, fontWeight: '800', color: BeroColors.green, marginTop: 12, marginBottom: 6 },
  allDoneDesc: { fontSize: 14, color: '#166534', textAlign: 'center' },

  measureCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24 },
  criticalCard: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
  measureHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  measureLabel: { fontSize: 14, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' },
  seuilBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, fontSize: 12, fontWeight: '800', color: '#64748b', overflow: 'hidden' },

  adjusterLarge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', borderRadius: 20, padding: 12 },
  adjustBtnLarge: { width: 64, height: 64, backgroundColor: '#fff', borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  measureInputLarge: { flex: 1, fontSize: 42, fontWeight: '900', color: BeroColors.dark, textAlign: 'center' },
  criticalNote: { color: '#ef4444', fontSize: 14, fontWeight: '900', textAlign: 'center', marginTop: 20 },

  anomalyContainer: { backgroundColor: '#fff', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#fee2e2', marginBottom: 24 },
  anomalyTitle: { fontSize: 16, fontWeight: '900', color: '#ef4444', textTransform: 'uppercase', marginBottom: 20 },

  selectWrapper: { marginBottom: 16 },
  selectLabel: { fontSize: 12, fontWeight: '800', color: '#64748b', marginBottom: 8, textTransform: 'uppercase' },
  selectButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, padding: 16 },
  selectPlaceholder: { fontSize: 15, color: '#94a3b8' },
  selectValueText: { fontSize: 15, fontWeight: '700', color: BeroColors.dark },

  largeInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, padding: 16, fontSize: 15, color: BeroColors.dark, minHeight: 100, textAlignVertical: 'top' },

  primaryButton: { backgroundColor: '#13385E', padding: 22, borderRadius: 24, alignItems: 'center', shadowColor: '#13385E', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '900', textTransform: 'uppercase' },
  buttonDisabled: { backgroundColor: '#94a3b8', shadowOpacity: 0 }
});