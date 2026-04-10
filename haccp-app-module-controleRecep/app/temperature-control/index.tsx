import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Modal,
  Dimensions
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
import { useAuth } from '../../context/auth-context'; // Assurez-vous que le chemin est correct

// --- COULEURS ---
const COLORS = {
  brand: '#0284c7',
  brandDark: '#0369a1',
  success: '#22c55e',
  danger: '#ef4444',
  dangerBg: '#fef2f2',
  bg: '#f3f4f6',
  card: '#ffffff',
  textMain: '#1f2937',
  textMuted: '#6b7280',
  border: '#e5e7eb'
};

// --- COMPOSANTS UI ---

const CustomSelect = ({
  label,
  options,
  selectedValue,
  onSelect,
  isDanger = false
}: {
  label: string,
  options: string[],
  selectedValue: string,
  onSelect: (val: string) => void,
  isDanger?: boolean
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.selectWrapper}>
      <ThemedText style={[styles.selectLabel, isDanger && styles.selectLabelDanger]}>{label}</ThemedText>
      <TouchableOpacity
        style={[
          styles.selectButton,
          isDanger && styles.selectButtonDanger
        ]}
        onPress={() => setModalVisible(true)}
      >
        <ThemedText style={selectedValue ? styles.selectValueText : styles.selectPlaceholder}>
          {selectedValue || 'Au choix...'}
        </ThemedText>
        <IconSymbol name="chevron.down" size={16} color={COLORS.textMuted} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
           <View style={styles.modalContent}>
              <ThemedText style={styles.modalTitle}>{label}</ThemedText>
              <ScrollView style={{ maxHeight: 300 }}>
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
                    {selectedValue === opt && <IconSymbol name="checkmark" size={18} color={COLORS.brand} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
           </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const TimelineStep = ({
  label,
  time,
  status,
  onPress,
  isLast,
  recordedBy,
  recordedAt
}: {
  label: string,
  time: string,
  status: 'done' | 'active' | 'pending',
  onPress: () => void,
  isLast?: boolean,
  recordedBy?: string,
  recordedAt?: string
}) => {
  let bgColor = '#f3f4f6';
  let textColor = '#9ca3af';
  let icon = null;

  if (status === 'done') {
    bgColor = COLORS.success;
    textColor = COLORS.success;
    icon = 'checkmark';
  } else if (status === 'active') {
    bgColor = COLORS.brand;
    textColor = COLORS.brand;
  }

  // Formater l'heure réelle si disponible
  const displayRecordTime = recordedAt
    ? new Date(recordedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <View style={styles.timelineStepContainer}>
      <TouchableOpacity
        style={[styles.timelineCircle, { backgroundColor: bgColor, borderColor: status === 'active' ? '#fff' : 'transparent', borderWidth: status === 'active' ? 4 : 0 }]}
        onPress={onPress}
        disabled={status === 'done'}
      >
        {icon ? (
          <IconSymbol name={icon} size={14} color="#fff" />
        ) : (
          <ThemedText style={[styles.timelineNumber, { color: status === 'active' ? '#fff' : COLORS.textMuted }]}>
            {/* Afficher 'O' pour Ouverture si c'est le cas, sinon vide */}
          </ThemedText>
        )}
      </TouchableOpacity>
      <ThemedText style={[styles.timelineLabel, { color: textColor, fontWeight: status === 'active' ? '700' : '400' }]}>
        {time}
      </ThemedText>

      {/* Affichage des infos de validation (Heure réelle + User) */}
      {status === 'done' && (displayRecordTime || recordedBy) && (
        <View style={styles.recordInfo}>
            {displayRecordTime && <ThemedText style={styles.recordTimeText}>{displayRecordTime}</ThemedText>}
            {recordedBy && <ThemedText style={styles.recordUserText}>Par: {recordedBy}</ThemedText>}
        </View>
      )}

      {!isLast && <View style={styles.timelineConnector} />}
    </View>
  );
};

// --- ÉCRAN PRINCIPAL ---

export default function TemperatureControlScreen() {
  const router = useRouter();
  const { user } = useAuth(); // Récupération de l'utilisateur connecté
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

  // Fonction utilitaire pour trouver la zone d'un équipement
  const findZoneForEquipment = (eqId: number): Zone | null => {
    if (!data) return null;
    return data.zones.find(z => z.equipments.some(e => e.id === eqId)) || null;
  };

  const parseLocalizedFloat = (val: string) => parseFloat(val.replace(',', '.'));

  const handleTempChange = (val: string) => setTemp(val.replace(',', '.'));

  // Threshold Logic
  const isAnomalous = useMemo(() => {
    if (!selectedEquipment || temp === '') return false;
    const t = parseLocalizedFloat(temp);
    if (isNaN(t)) return false;
    const min = selectedEquipment.min_temperature;
    const max = selectedEquipment.max_temperature;
    if (min !== null && t < min) return true;
    if (max !== null && t > max) return true;
    return false;
  }, [temp, selectedEquipment]);

  const handleSelectEquipment = useCallback((e: Equipment) => {
    setSelectedEquipment(e);

    // --- CORRECTION 1 : Attribution automatique de la zone ---
    const zone = findZoneForEquipment(e.id);
    setSelectedZone(zone || 'all');

    setTemp('');
    setProbableCause('');
    setCorrectiveAction('');
    setComments('');
    const firstAvailable = e.check_times.find(c => !c.already_done);
    setSelectedCheckTime(firstAvailable || null);
  }, [data]); // Ajout de data dans les dépendances

  const resetForm = () => {
    setSelectedEquipment(null);
    setSelectedCheckTime(null);
    setTemp('');
    setProbableCause('');
    setCorrectiveAction('');
    setComments('');
  };

  // Vérification de la tolérance horaire (2 heures)
  const isWithinTolerance = (targetTimeStr: string): boolean => {
    const now = new Date();
    const [hours, minutes] = targetTimeStr.split(':').map(Number);
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);

    const diffMs = Math.abs(now.getTime() - target.getTime());
    const diffMins = Math.floor(diffMs / 60000); // Conversion en minutes

    return diffMins <= 120; // 120 minutes = 2 heures
  };

      const handleSave = async () => {
        console.log("--- TENTATIVE D'ENREGISTREMENT ---");

        // 1. Vérification Équipement
        if (!selectedEquipment) {
          Alert.alert('Erreur', 'Aucun équipement sélectionné.');
          return;
        }

        // 2. Vérification Créneau (Si le bouton est grisé, c'est que ça échoue ici)
        if (!selectedCheckTime) {
          console.error("AUCUN CRENEAU DISPONIBLE ! Vérifiez les données de l'équipement.");
          Alert.alert(
            'Impossible d\'enregistrer',
            'Il n\'y a aucun créneau horaire disponible ou non-effectué pour cet équipement aujourd\'hui. Vérifiez votre base de données.'
          );
          return;
        }
        console.log("Créneau sélectionné :", selectedCheckTime.label);

        // 3. Vérification Température
        if (temp.trim() === '') {
          Alert.alert('Erreur', 'Veuillez saisir une température.');
          return;
        }
        const t = parseLocalizedFloat(temp);
        if (isNaN(t)) {
          Alert.alert('Erreur', 'Température invalide.');
          return;
        }

        // --- BLOCAGE HORAIRE (COMMENTÉ POUR TEST) ---
        // Si vous voulez tester à n'importe quelle heure, gardez ce bloc en commentaire.
        /*
        if (!isWithinTolerance(selectedCheckTime.check_time)) {
          Alert.alert(
            'Hors tolérance',
            `Il est ${new Date().toLocaleTimeString()}. Le créneau est ${selectedCheckTime.check_time}. Tolérance dépassée.`
          );
          return;
        }
        */

        try {
          setIsSubmitting(true);
          console.log("Envoi API en cours...", {
            equipment_id: selectedEquipment.id,
            check_time_id: selectedCheckTime.id,
            temperature: t
          });

          // Appel API
          await temperatureControlApi.storeControl({
            equipment_id: selectedEquipment.id,
            check_time_id: selectedCheckTime.id,
            temperature: t,
            probable_cause: isAnomalous ? probableCause : null,
            corrective_action: isAnomalous ? correctiveAction : null,
            comments: isAnomalous ? comments : null,
          });

          console.log("SUCCÈS API reçu");

          // Mise à jour locale immédiate
          if (data) {
            const newData = { ...data };
            newData.zones.forEach(z => {
              z.equipments.forEach(eq => {
                if (eq.id === selectedEquipment.id) {
                  const ct = eq.check_times.find(c => c.id === selectedCheckTime.id);
                  if (ct) {
                    ct.already_done = true;
                    ct.recorded_by = user?.name || user?.first_name || 'Utilisateur';
                    ct.recorded_at = new Date().toISOString();
                    console.log("Mise à jour locale OK");
                  }
                }
              });
            });
            setData(newData);
          }

          resetForm();
          Alert.alert('Succès', 'Contrôle enregistré !', [{ text: 'OK' }]);

        } catch (error: any) {
          console.error("ECHEC API :", error);

          // Affichage détaillé de l'erreur Laravel
          let errorMsg = "Erreur inconnue";
          if (error.response?.data?.message) {
            errorMsg = error.response.data.message;
          } else if (error.message) {
            errorMsg = error.message;
          }

          Alert.alert('Erreur lors de la sauvegarde', errorMsg);

          // Si 409 (Conflit), on recharge
          if (error?.response?.status === 409) {
            fetchInitialData();
          }
        } finally {
          setIsSubmitting(false);
        }
      };

  const filteredEquipments = useMemo(() => {
    if (!data) return [];
    if (selectedZone === 'all') {
      return data.zones.reduce((acc, zone) => [...acc, ...zone.equipments], [] as Equipment[]);
    }
    return selectedZone.equipments;
  }, [data, selectedZone]);

  // --- RENDERS ---

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.brand} />
      </View>
    );
  }

  // Liste des équipements (Vue initiale)
  if (!selectedEquipment) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaProvider style={{ flex: 1 }}>
          <View style={styles.header}>
             <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                <IconSymbol name="chevron.left" size={24} color="#fff" />
             </TouchableOpacity>
             <ThemedText style={styles.headerTitle}>Relevé Températures</ThemedText>
             <TouchableOpacity style={styles.headerBtn}>
                <IconSymbol name="list.bullet" size={24} color="#fff" />
             </TouchableOpacity>
          </View>

          <View style={styles.sectionHeader}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.zoneScroll}>
              <TouchableOpacity
                style={[styles.zoneChip, selectedZone === 'all' && styles.zoneChipActive]}
                onPress={() => setSelectedZone('all')}
              >
                <ThemedText style={[styles.zoneChipText, selectedZone === 'all' && styles.zoneChipTextActive]}>Toutes Zones</ThemedText>
              </TouchableOpacity>
              {data?.zones.map(z => (
                <TouchableOpacity
                  key={z.id}
                  style={[styles.zoneChip, selectedZone?.id === z.id && styles.zoneChipActive]}
                  onPress={() => setSelectedZone(z)}
                >
                  <ThemedText style={[styles.zoneChipText, selectedZone?.id === z.id && styles.zoneChipTextActive]}>{z.name}</ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
            {filteredEquipments.map(eq => {
               const doneCount = eq.check_times.filter(c => c.already_done).length;
               const totalCount = eq.check_times.length;
               const isComplete = doneCount === totalCount && totalCount > 0;

               return (
                 <TouchableOpacity
                   key={eq.id}
                   style={[styles.eqCard, isComplete && styles.eqCardDone]}
                   onPress={() => handleSelectEquipment(eq)}
                 >
                    <View style={styles.eqInfo}>
                       <ThemedText style={styles.eqCode}>{eq.code}</ThemedText>
                       <ThemedText style={styles.eqDesc}>{eq.description || 'Équipement'}</ThemedText>
                    </View>
                    <View style={styles.eqStatus}>
                       <ThemedText style={styles.eqStatusText}>{doneCount}/{totalCount}</ThemedText>
                       {isComplete ? <IconSymbol name="checkmark.circle.fill" size={24} color={COLORS.success} /> : <IconSymbol name="chevron.right" size={24} color={COLORS.textMuted} />}
                    </View>
                 </TouchableOpacity>
               );
            })}
          </ScrollView>
        </SafeAreaProvider>
      </ThemedView>
    );
  }

  // --- VUE FORMULAIRE ---
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaProvider style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

          <View style={styles.header}>
             <TouchableOpacity onPress={resetForm} style={styles.headerBtn}>
                <IconSymbol name="chevron.left" size={24} color="#fff" />
             </TouchableOpacity>
             <ThemedText style={styles.headerTitle}>Relevé Températures</ThemedText>
             <View style={{width: 24}} />
          </View>

          <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>

            {/* 1. Localisation (Zone Auto) */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <ThemedText style={styles.cardHeaderLabel}>Localisation</ThemedText>
                <View style={styles.badge}>
                  <ThemedText style={styles.badgeText}>Froid Positif (+)</ThemedText>
                </View>
              </View>

              {/* Affichage dynamique de la zone (Read-only) */}
              <View style={styles.zoneDisplayRow}>
                <ThemedText style={styles.zoneDisplayLabel}>Zone :</ThemedText>
                <ThemedText style={styles.zoneDisplayValue}>
                  {selectedZone === 'all' ? 'Non assignée' : (selectedZone as Zone).name}
                </ThemedText>
              </View>

              <View style={styles.eqDetailBox}>
                 <View>
                    <ThemedText style={styles.eqDetailName}>{selectedEquipment.description || selectedEquipment.code}</ThemedText>
                    <ThemedText style={styles.eqDetailCode}>Code : {selectedEquipment.code}</ThemedText>
                 </View>
                 <View style={styles.targetBox}>
                    <ThemedText style={styles.targetLabel}>Cible</ThemedText>
                    <ThemedText style={styles.targetValue}>{selectedEquipment.min_temperature}°C à {selectedEquipment.max_temperature}°C</ThemedText>
                 </View>
              </View>
            </View>

            {/* 2. Timeline avec Infos User/Heure */}
            <View style={styles.card}>
              <ThemedText style={styles.sectionTitle}><IconSymbol name="clock" size={14} /> Contrôles du jour</ThemedText>

              <View style={styles.timelineContainer}>
                <View style={styles.timelineLine} />
                {selectedEquipment.check_times.map((ct, index) => {
                   const status = ct.already_done ? 'done' : (selectedCheckTime?.id === ct.id ? 'active' : 'pending');
                   return (
                     <TimelineStep
                       key={ct.id}
                       label={ct.label}
                       time={ct.check_time.substring(0, 5)}
                       status={status}
                       recordedBy={ct.recorded_by} // Affichage du nom user
                       recordedAt={ct.recorded_at} // Affichage heure réelle
                       onPress={() => !ct.already_done && setSelectedCheckTime(ct)}
                       isLast={index === selectedEquipment.check_times.length - 1}
                     />
                   );
                })}
              </View>
              <ThemedText style={styles.timelineInfo}>Tolérance de saisie : ± 2 heures</ThemedText>
            </View>

            {/* 3. Température Relevée */}
            <View style={styles.card}>
              <ThemedText style={styles.inputLabel}>Température relevée actuellement</ThemedText>

              <View style={styles.tempControlRow}>
                <TouchableOpacity
                  style={styles.tempBtn}
                  onPress={() => setTemp(t => {
                    const val = parseLocalizedFloat(t);
                    return (isNaN(val) ? 0 : val - 1).toString();
                  })}
                >
                  <IconSymbol name="minus" size={24} color={COLORS.textMain} />
                </TouchableOpacity>

                <View style={styles.tempInputWrapper}>
                  <TextInput
                    style={styles.tempInput}
                    keyboardType="decimal-pad"
                    value={temp}
                    onChangeText={handleTempChange}
                    placeholder="--"
                    placeholderTextColor={COLORS.textMuted}
                  />
                  <ThemedText style={styles.tempUnit}>°C</ThemedText>
                </View>

                <TouchableOpacity
                  style={styles.tempBtn}
                  onPress={() => setTemp(t => {
                    const val = parseLocalizedFloat(t);
                    return (isNaN(val) ? 0 : val + 1).toString();
                  })}
                >
                  <IconSymbol name="plus" size={24} color={COLORS.textMain} />
                </TouchableOpacity>
              </View>

              {isAnomalous && (
                <View style={styles.alertBox}>
                  <IconSymbol name="exclamationmark.triangle.fill" size={20} color={COLORS.danger} />
                  <View style={styles.alertContent}>
                    <ThemedText style={styles.alertTitle}>Température non conforme !</ThemedText>
                    <ThemedText style={styles.alertText}>
                      La limite est {selectedEquipment.max_temperature}°C. Veuillez remplir la fiche d'anomalie.
                    </ThemedText>
                  </View>
                </View>
              )}
            </View>

            {/* 4. Formulaire Anomalie */}
            {isAnomalous && (
              <View style={[styles.card, styles.anomalyCard]}>
                <ThemedText style={styles.anomalyHeaderTitle}><IconSymbol name="doc.text.fill" size={16} /> Fiche de Non-Conformité</ThemedText>

                <CustomSelect
                  label="Cause probable"
                  options={CAUSE_OPTIONS}
                  selectedValue={probableCause}
                  onSelect={setProbableCause}
                  isDanger={true}
                />

                <CustomSelect
                  label="Action corrective immédiate"
                  options={ACTION_OPTIONS}
                  selectedValue={correctiveAction}
                  onSelect={setCorrectiveAction}
                  isDanger={true}
                />

                <View style={styles.selectWrapper}>
                  <ThemedText style={[styles.selectLabel, styles.selectLabelDanger]}>Commentaire / Visa</ThemedText>
                  <TextInput
                    style={[styles.textArea, styles.textAreaDanger]}
                    placeholder="Précisez la situation..."
                    placeholderTextColor="#9ca3af"
                    value={comments}
                    onChangeText={setComments}
                    multiline
                  />
                </View>
              </View>
            )}

             <View style={{ height: 100 }} />
          </ScrollView>

          {/* Footer Bouton */}
          <View style={styles.footer}>
             <TouchableOpacity
               style={[styles.footerBtn, isAnomalous && styles.footerBtnDanger]}
               onPress={handleSave}
               disabled={!selectedCheckTime || isSubmitting}
             >
               {isSubmitting ? (
                 <ActivityIndicator color="#fff" />
               ) : (
                 <>
                   <IconSymbol name={isAnomalous ? "exclamationmark.triangle.fill" : "checkmark.circle.fill"} size={20} color="#fff" />
                   <ThemedText style={styles.footerBtnText}>
                     {isAnomalous ? 'Enregistrer avec anomalie' : 'Enregistrer le contrôle'}
                   </ThemedText>
                 </>
               )}
             </TouchableOpacity>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaProvider>
    </ThemedView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    backgroundColor: COLORS.brand,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  headerBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },

  sectionHeader: { backgroundColor: '#fff', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  zoneScroll: { paddingHorizontal: 16, gap: 10 },
  zoneChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: '#fff'
  },
  zoneChipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  zoneChipText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  zoneChipTextActive: { color: '#fff' },

  listContainer: { flex: 1 },
  listContent: { padding: 16, gap: 12 },
  eqCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2
  },
  eqCardDone: { opacity: 0.7, backgroundColor: '#f9fafb' },
  eqInfo: { flex: 1 },
  eqCode: { fontSize: 16, fontWeight: '800', color: COLORS.textMain },
  eqDesc: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  eqStatus: { alignItems: 'center' },
  eqStatusText: { fontSize: 12, fontWeight: 'bold', color: COLORS.textMuted, marginBottom: 4 },

  scrollContainer: { flex: 1 },
  scrollContent: { padding: 16, gap: 20 },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
    borderWidth: 1, borderColor: '#f3f4f6'
  },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardHeaderLabel: { fontSize: 12, fontWeight: 'bold', color: COLORS.textMuted, textTransform: 'uppercase' },
  badge: { backgroundColor: '#dbeafe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
  badgeText: { fontSize: 11, fontWeight: 'bold', color: COLORS.brand },

  // Zone Display (Read-only)
  zoneDisplayRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 2, borderBottomColor: COLORS.border, marginBottom: 16
  },
  zoneDisplayLabel: { fontSize: 15, fontWeight: '600', color: COLORS.textMain },
  zoneDisplayValue: { fontSize: 15, fontWeight: 'bold', color: COLORS.brand, marginLeft: 8 },

  eqDetailBox: {
    backgroundColor: COLORS.bg, padding: 12, borderRadius: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  eqDetailName: { fontSize: 15, fontWeight: 'bold', color: COLORS.textMain },
  eqDetailCode: { fontSize: 12, color: COLORS.textMuted, marginTop: 2, fontFamily: 'monospace' },
  targetBox: { alignItems: 'center' },
  targetLabel: { fontSize: 10, color: COLORS.textMuted },
  targetValue: { fontSize: 13, fontWeight: 'bold', color: COLORS.success },

  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted, marginBottom: 16 },
  timelineContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', paddingVertical: 10 },
  timelineLine: {
    position: 'absolute', top: 18, left: 20, right: 20, height: 2,
    backgroundColor: '#e5e7eb', zIndex: 0
  },
  timelineStepContainer: { alignItems: 'center', zIndex: 1, width: 50 },
  timelineCircle: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2
  },
  timelineNumber: { fontSize: 14, fontWeight: 'bold' },
  timelineLabel: { fontSize: 11, marginTop: 6, marginBottom: 2 },
  recordInfo: { alignItems: 'center', marginTop: 4 },
  recordTimeText: { fontSize: 10, color: COLORS.success, fontWeight: 'bold' },
  recordUserText: { fontSize: 9, color: COLORS.textMuted, fontStyle: 'italic' },
  timelineConnector: { display: 'none' },
  timelineInfo: { textAlign: 'center', fontSize: 10, color: '#9ca3af', marginTop: 8 },

  inputLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textMain, marginBottom: 20, textAlign: 'center' },
  tempControlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  tempBtn: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#f3f4f6',
    justifyContent: 'center', alignItems: 'center'
  },
  tempInputWrapper: {
    flexDirection: 'row', alignItems: 'flex-end', borderBottomWidth: 2,
    borderBottomColor: COLORS.border, width: 120, justifyContent: 'center'
  },
  tempInput: {
    fontSize: 36, fontWeight: '900', color: COLORS.textMain, textAlign: 'center',
    padding: 0, height: 50, width: 80
  },
  tempUnit: { fontSize: 20, color: COLORS.textMuted, marginBottom: 8, marginLeft: 4 },

  alertBox: {
    flexDirection: 'row', backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca',
    borderRadius: 8, padding: 12, marginTop: 16, alignItems: 'flex-start', gap: 12
  },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: 12, fontWeight: 'bold', color: '#b91c1c', marginBottom: 2 },
  alertText: { fontSize: 11, color: '#b91c1c', lineHeight: 16 },

  anomalyCard: { backgroundColor: COLORS.dangerBg, borderColor: '#fecaca' },
  anomalyHeaderTitle: { fontSize: 14, fontWeight: 'bold', color: '#b91c1c', marginBottom: 16, textTransform: 'uppercase' },

  selectWrapper: { marginBottom: 16 },
  selectLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, marginBottom: 6, textTransform: 'uppercase' },
  selectLabelDanger: { color: '#b91c1c' },
  selectButton: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12
  },
  selectButtonDanger: { borderColor: '#fecaca', backgroundColor: '#fff' },
  selectPlaceholder: { fontSize: 14, color: COLORS.textMuted },
  selectValueText: { fontSize: 14, fontWeight: '600', color: COLORS.textMain },
  textArea: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    padding: 12, fontSize: 14, minHeight: 80, textAlignVertical: 'top'
  },
  textAreaDanger: { borderColor: '#fecaca', backgroundColor: '#fff' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '100%', maxHeight: '80%' },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 12, textAlign: 'center' },
  modalOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 12, backgroundColor: '#f9fafb', borderRadius: 8, marginBottom: 8
  },
  modalOptionActive: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: COLORS.brand },
  modalOptionText: { fontSize: 14, color: COLORS.textMain },
  modalOptionTextActive: { color: COLORS.brand, fontWeight: '600' },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.border,
    padding: 16, paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 10
  },
  footerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: COLORS.brand, paddingVertical: 14, borderRadius: 12,
    shadowColor: COLORS.brand, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4
  },
  footerBtnDanger: { backgroundColor: COLORS.danger, shadowColor: COLORS.danger },
  footerBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold', textTransform: 'uppercase' }
});