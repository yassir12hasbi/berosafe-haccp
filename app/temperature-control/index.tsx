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
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import temperatureControlApi, {
  TemperatureControlInitialData,
  Zone,
  Equipment,
  TemperatureCheckTime,
} from '../../api/temperature-control';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getErrorDetails } from '../../utils/error';
import { useAuth } from '../../context/auth-context';
import Svg, { Path, Circle, Rect, G, Line, Polyline } from 'react-native-svg';

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const C = {
  navy:      '#1A3B6E',
  navyDark:  '#0F2547',
  blue:      '#1D4ED8',
  blueBg:    '#EFF6FF',
  blueBd:    '#BFDBFE',
  green:     '#15803D',
  greenBg:   '#F0FDF4',
  greenBd:   '#BBF7D0',
  red:       '#DC2626',
  redBg:     '#FEF2F2',
  redBd:     '#FECACA',
  amber:     '#B45309',
  amberBg:   '#FFFBEB',
  amberBd:   '#FDE68A',
  white:     '#FFFFFF',
  slate50:   '#F8FAFC',
  slate100:  '#F1F5F9',
  slate200:  '#E2E8F0',
  slate300:  '#CBD5E1',
  slate400:  '#94A3B8',
  slate500:  '#64748B',
  slate600:  '#475569',
  slate700:  '#334155',
  slate800:  '#1E293B',
  slate900:  '#0F172A',
};

const CAUSE_OPTIONS = [
  'Porte restée ouverte',
  'Panne moteur',
  'Surcharge de produit',
  'Coupure de courant',
  'Autre',
];
const ACTION_OPTIONS = [
  'Marchandise jetée',
  'Marchandise déplacée',
  'Technicien appelé',
  'Réglage thermostat',
  'Autre',
];

// ─── SVG Icons ────────────────────────────────────────────────────────────────
type IP = { size?: number; color?: string };
const SW = 1.8;

const IcoBack     = ({ size=20, color=C.white   }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcoCheck    = ({ size=14, color=C.white   }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcoChevR    = ({ size=18, color=C.slate400}: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcoChevD    = ({ size=16, color=C.slate400}: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcoMinus    = ({ size=22, color=C.navy    }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12h14" stroke={color} strokeWidth={2.2} strokeLinecap="round"/>
  </Svg>
);
const IcoPlus     = ({ size=22, color=C.navy    }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2.2} strokeLinecap="round"/>
  </Svg>
);
const IcoWarning  = ({ size=18, color=C.red     }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={color} strokeWidth={SW} strokeLinejoin="round"/>
    <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth={SW} strokeLinecap="round"/>
  </Svg>
);
const IcoClock    = ({ size=14, color=C.slate500}: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={SW}/>
    <Path d="M12 7v5l3 3" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcoThermo   = ({ size=20, color=C.navy    }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M14 14.76V5a2 2 0 00-4 0v9.76A4 4 0 1014 14.76z" stroke={color} strokeWidth={SW} strokeLinejoin="round"/>
  </Svg>
);
const IcoPin      = ({ size=14, color=C.navy    }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke={color} strokeWidth={SW} strokeLinejoin="round"/>
    <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth={SW}/>
  </Svg>
);
const IcoFridge   = ({ size=18, color=C.navy    }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="4" y="2" width="16" height="20" rx="2" stroke={color} strokeWidth={SW}/>
    <Path d="M4 10h16" stroke={color} strokeWidth={SW} strokeLinecap="round"/>
    <Path d="M9 6v2M9 14v4" stroke={color} strokeWidth={SW} strokeLinecap="round"/>
  </Svg>
);
const IcoDoc      = ({ size=16, color=C.red     }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={color} strokeWidth={SW} strokeLinejoin="round"/>
    <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth={SW} strokeLinecap="round"/>
  </Svg>
);
const IcoUser     = ({ size=10, color=C.slate400}: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={SW}/>
    <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth={SW} strokeLinecap="round"/>
  </Svg>
);

// ─── Gauge bar ────────────────────────────────────────────────────────────────
function GaugeBar({ value, min, max, dangerMin, dangerMax }: { value: number; min: number; max: number; dangerMin?: number | null; dangerMax?: number | null }) {
  const range   = (dangerMax ?? max + 10) - (dangerMin ?? min - 5);
  const origin  = dangerMin ?? min - 5;
  const fillPct = Math.min(Math.max((value - origin) / range, 0), 1);
  const isOk    = value >= min && value <= max;
  const color   = isOk ? C.green : C.red;
  return (
    <View style={gb.track}>
      <View style={[gb.fill, { width: `${fillPct * 100}%` as any, backgroundColor: color }]} />
      {/* Target zone markers */}
      <View style={[gb.marker, { left: `${((min - origin) / range) * 100}%` as any }]} />
      <View style={[gb.marker, { left: `${((max - origin) / range) * 100}%` as any }]} />
    </View>
  );
}
const gb = StyleSheet.create({
  track:  { height: 6, backgroundColor: C.slate100, borderRadius: 3, overflow: 'visible', marginTop: 8, position: 'relative' },
  fill:   { height: '100%', borderRadius: 3 },
  marker: { position: 'absolute', top: -3, width: 2, height: 12, backgroundColor: C.navy, borderRadius: 1 },
});

// ─── Custom Select ────────────────────────────────────────────────────────────
function CustomSelect({ label, options, value, onSelect, danger = false }: {
  label: string; options: string[]; value: string; onSelect: (v: string) => void; danger?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={sel.wrap}>
      <ThemedText style={[sel.label, danger && sel.labelDanger]}>{label}</ThemedText>
      <TouchableOpacity style={[sel.btn, danger && sel.btnDanger]} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <ThemedText style={value ? sel.valText : sel.placeholder}>{value || 'Sélectionner...'}</ThemedText>
        <IcoChevD size={16} color={danger ? C.red : C.slate400} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity style={sel.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={sel.sheet}>
            <View style={sel.sheetHeader}>
              <ThemedText style={sel.sheetTitle}>{label}</ThemedText>
              <TouchableOpacity onPress={() => setOpen(false)} style={sel.closeBtn}>
                <ThemedText style={{ fontSize: 18, color: C.slate400 }}>✕</ThemedText>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 280 }}>
              {options.map((opt, i) => {
                const active = value === opt;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[sel.option, active && sel.optionActive]}
                    onPress={() => { onSelect(opt); setOpen(false); }}
                    activeOpacity={0.8}
                  >
                    <ThemedText style={[sel.optText, active && sel.optTextActive]}>{opt}</ThemedText>
                    {active && <IcoCheck size={16} color={C.navy} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
const sel = StyleSheet.create({
  wrap:        { marginBottom: 14 },
  label:       { fontSize: 10, fontWeight: '800', color: C.slate400, letterSpacing: 0.8, marginBottom: 7, textTransform: 'uppercase' },
  labelDanger: { color: C.red },
  btn:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.white, borderWidth: 1.5, borderColor: C.slate200, borderRadius: 12, padding: 13 },
  btnDanger:   { borderColor: C.redBd, backgroundColor: C.redBg },
  placeholder: { fontSize: 14, color: C.slate400 },
  valText:     { fontSize: 14, fontWeight: '600', color: C.slate800 },
  overlay:     { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'flex-end' },
  sheet:       { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sheetTitle:  { fontSize: 16, fontWeight: '800', color: C.slate900 },
  closeBtn:    { width: 32, height: 32, borderRadius: 8, backgroundColor: C.slate100, alignItems: 'center', justifyContent: 'center' },
  option:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 10, marginBottom: 6, backgroundColor: C.slate50 },
  optionActive:{ backgroundColor: C.blueBg, borderWidth: 1, borderColor: C.blueBd },
  optText:     { fontSize: 14, fontWeight: '500', color: C.slate700 },
  optTextActive:{ color: C.navy, fontWeight: '700' },
});

// ─── Timeline step ────────────────────────────────────────────────────────────
function TimelineStep({ time, status, onPress, recordedBy, recordedAt, isLast }: {
  time: string; status: 'done' | 'active' | 'pending'; onPress: () => void;
  recordedBy?: string; recordedAt?: string; isLast?: boolean;
}) {
  const recordTime = recordedAt
    ? new Date(recordedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : null;

  const bg     = status === 'done' ? C.green : status === 'active' ? C.navy : C.slate200;
  const ring   = status === 'active';

  return (
    <View style={ts.col}>
      <TouchableOpacity
        style={[ts.circle, { backgroundColor: bg }, ring && ts.circleRing]}
        onPress={onPress}
        disabled={status === 'done'}
        activeOpacity={0.8}
      >
        {status === 'done'
          ? <IcoCheck size={13} color={C.white} />
          : <ThemedText style={[ts.dot, { color: status === 'active' ? C.white : C.slate400 }]}>•</ThemedText>
        }
      </TouchableOpacity>
      <ThemedText style={[ts.time, status === 'active' && ts.timeActive, status === 'done' && ts.timeDone]}>
        {time}
      </ThemedText>
      {status === 'done' && (recordTime || recordedBy) && (
        <View style={ts.meta}>
          {recordTime && (
            <View style={ts.metaRow}>
              <IcoClock size={9} color={C.green} />
              <ThemedText style={ts.metaTime}>{recordTime}</ThemedText>
            </View>
          )}
          {recordedBy && (
            <View style={ts.metaRow}>
              <IcoUser size={9} color={C.slate400} />
              <ThemedText style={ts.metaUser}>{recordedBy}</ThemedText>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
const ts = StyleSheet.create({
  col:        { alignItems: 'center', zIndex: 1, minWidth: 56 },
  circle:     { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  circleRing: { borderWidth: 3, borderColor: 'rgba(26,59,110,0.2)' },
  dot:        { fontSize: 18, lineHeight: 20 },
  time:       { fontSize: 11, fontWeight: '600', color: C.slate400, marginTop: 5, textAlign: 'center' },
  timeActive: { color: C.navy, fontWeight: '800' },
  timeDone:   { color: C.green },
  meta:       { alignItems: 'center', gap: 2, marginTop: 4 },
  metaRow:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaTime:   { fontSize: 9, fontWeight: '700', color: C.green },
  metaUser:   { fontSize: 9, color: C.slate400, fontStyle: 'italic' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function TemperatureControlScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading]       = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData]             = useState<TemperatureControlInitialData | null>(null);
  const [selectedZone, setSelectedZone]           = useState<Zone | 'all'>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [selectedCheckTime, setSelectedCheckTime] = useState<TemperatureCheckTime | null>(null);
  const [temp, setTemp]             = useState('');
  const [probableCause, setProbableCause]         = useState('');
  const [correctiveAction, setCorrectiveAction]   = useState('');
  const [comments, setComments]     = useState('');

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const res = await temperatureControlApi.getInitialData();
      setData(res);
    } catch (error) {
      const { title, message } = getErrorDetails(error, 'Chargement impossible', 'Impossible de charger les équipements.');
      Alert.alert(title, message);
    } finally { setLoading(false); }
  };

  const parse = (v: string) => parseFloat(v.replace(',', '.'));

  const isAnomalous = useMemo(() => {
    if (!selectedEquipment || temp === '') return false;
    const t = parse(temp);
    if (isNaN(t)) return false;
    const { min_temperature: mn, max_temperature: mx } = selectedEquipment;
    if (mn !== null && t < mn) return true;
    if (mx !== null && t > mx) return true;
    return false;
  }, [temp, selectedEquipment]);

  const handleSelectEquipment = useCallback((eq: Equipment) => {
    setSelectedEquipment(eq);
    const zone = data?.zones.find(z => z.equipments.some(e => e.id === eq.id));
    setSelectedZone(zone || 'all');
    setTemp(''); setProbableCause(''); setCorrectiveAction(''); setComments('');
    setSelectedCheckTime(eq.check_times.find(c => !c.already_done) || null);
  }, [data]);

  const resetForm = () => {
    setSelectedEquipment(null); setSelectedCheckTime(null);
    setTemp(''); setProbableCause(''); setCorrectiveAction(''); setComments('');
  };

  const handleSave = async () => {
    if (!selectedEquipment) { Alert.alert('Erreur', 'Aucun équipement sélectionné.'); return; }
    if (!selectedCheckTime) { Alert.alert('Impossible', 'Aucun créneau disponible pour cet équipement aujourd\'hui.'); return; }
    if (temp.trim() === '') { Alert.alert('Erreur', 'Veuillez saisir une température.'); return; }
    const t = parse(temp);
    if (isNaN(t)) { Alert.alert('Erreur', 'Température invalide.'); return; }
    try {
      setIsSubmitting(true);
      await temperatureControlApi.storeControl({
        equipment_id:     selectedEquipment.id,
        check_time_id:    selectedCheckTime.id,
        temperature:      t,
        probable_cause:   isAnomalous ? probableCause : null,
        corrective_action:isAnomalous ? correctiveAction : null,
        comments:         isAnomalous ? comments : null,
      });
      // Mise à jour locale immédiate
      if (data) {
        const d = { ...data };
        d.zones.forEach(z => z.equipments.forEach(eq => {
          if (eq.id === selectedEquipment.id) {
            const ct = eq.check_times.find(c => c.id === selectedCheckTime.id);
            if (ct) { ct.already_done = true; ct.recorded_by = user?.name || user?.first_name || 'Utilisateur'; ct.recorded_at = new Date().toISOString(); }
          }
        }));
        setData(d);
      }
      resetForm();
      Alert.alert('Succès', 'Contrôle enregistré !', [{ text: 'OK' }]);
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Erreur inconnue';
      Alert.alert('Erreur lors de la sauvegarde', msg);
      if (error?.response?.status === 409) fetchInitialData();
    } finally { setIsSubmitting(false); }
  };

  const filteredEquipments = useMemo(() => {
    if (!data) return [];
    if (selectedZone === 'all') return data.zones.flatMap(z => z.equipments);
    return selectedZone.equipments;
  }, [data, selectedZone]);

  const tempNum = useMemo(() => parse(temp) || 0, [temp]);

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={C.navy} />
        <ThemedText style={{ marginTop: 12, color: C.slate500, fontWeight: '600' }}>Chargement...</ThemedText>
      </View>
    );
  }

  // ── Equipment list view ─────────────────────────────────────────────────────
  if (!selectedEquipment) {
    return (
      <ThemedView style={styles.root}>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaProvider style={{ flex: 1 }}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.back()} activeOpacity={0.8}>
              <IcoBack size={20} color={C.white} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.headerTitle}>Relevé Températures</ThemedText>
              <ThemedText style={styles.headerSub}>Sélectionner un équipement</ThemedText>
            </View>
          </View>

          {/* Zone filter */}
          <View style={styles.zoneBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.zoneBarContent}>
              {[{ id: 'all', name: 'Toutes les zones' }, ...(data?.zones || [])].map((z: any) => {
                const active = z.id === 'all' ? selectedZone === 'all' : (selectedZone !== 'all' && (selectedZone as Zone).id === z.id);
                return (
                  <TouchableOpacity
                    key={z.id}
                    style={[styles.zoneTab, active && styles.zoneTabActive]}
                    onPress={() => setSelectedZone(z.id === 'all' ? 'all' : z)}
                    activeOpacity={0.8}
                  >
                    <ThemedText style={[styles.zoneTabText, active && styles.zoneTabTextActive]}>{z.name}</ThemedText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Summary bar */}
          {data && (
            <View style={styles.summaryBar}>
              {[
                { label: 'Total', value: filteredEquipments.length, color: C.navy },
                { label: 'Complets', value: filteredEquipments.filter(e => e.check_times.length > 0 && e.check_times.every(c => c.already_done)).length, color: C.green },
                { label: 'En attente', value: filteredEquipments.filter(e => e.check_times.some(c => !c.already_done)).length, color: C.amber },
              ].map(({ label, value, color }) => (
                <View key={label} style={styles.summaryItem}>
                  <ThemedText style={[styles.summaryValue, { color }]}>{value}</ThemedText>
                  <ThemedText style={styles.summaryLabel}>{label}</ThemedText>
                </View>
              ))}
            </View>
          )}

          {/* Equipment list */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {filteredEquipments.map(eq => {
              const done  = eq.check_times.filter(c => c.already_done).length;
              const total = eq.check_times.length;
              const complete = done === total && total > 0;
              const pct   = total > 0 ? done / total : 0;
              const zone  = data?.zones.find(z => z.equipments.some(e => e.id === eq.id));
              return (
                <TouchableOpacity
                  key={eq.id}
                  style={[styles.eqCard, complete && styles.eqCardDone]}
                  onPress={() => handleSelectEquipment(eq)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.eqIcon, complete && styles.eqIconDone]}>
                    <IcoFridge size={22} color={complete ? C.green : C.navy} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <ThemedText style={[styles.eqCode, complete && styles.eqCodeDone]}>{eq.code}</ThemedText>
                      {zone && selectedZone === 'all' && (
                        <View style={styles.zonePill}>
                          <IcoPin size={9} color={C.navy} />
                          <ThemedText style={styles.zonePillText}>{zone.name}</ThemedText>
                        </View>
                      )}
                    </View>
                    <ThemedText style={styles.eqDesc}>{eq.description || 'Équipement réfrigéré'}</ThemedText>
                    {/* Progress bar */}
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${pct * 100}%` as any, backgroundColor: complete ? C.green : C.navy }]} />
                    </View>
                  </View>
                  <View style={styles.eqRight}>
                    <ThemedText style={[styles.eqCount, complete && { color: C.green }]}>{done}/{total}</ThemedText>
                    {complete ? <IcoCheck size={16} color={C.green} /> : <IcoChevR size={16} color={C.slate300} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

        </SafeAreaProvider>
      </ThemedView>
    );
  }

  // ── Form view ───────────────────────────────────────────────────────────────
  const zone = selectedZone !== 'all' ? (selectedZone as Zone) : null;
  const doneAll = selectedEquipment.check_times.every(c => c.already_done);

  return (
    <ThemedView style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaProvider style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

          {/* Header */}
          <View style={[styles.header, isAnomalous && styles.headerDanger]}>
            <TouchableOpacity style={styles.headerBackBtn} onPress={resetForm} activeOpacity={0.8}>
              <IcoBack size={20} color={C.white} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.headerTitle}>{selectedEquipment.code}</ThemedText>
              <ThemedText style={styles.headerSub}>{selectedEquipment.description || 'Relevé de température'}</ThemedText>
            </View>
            {isAnomalous && (
              <View style={styles.headerAlert}>
                <IcoWarning size={14} color={C.white} />
                <ThemedText style={styles.headerAlertText}>Anomalie</ThemedText>
              </View>
            )}
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>

            {/* ── Card 1 : Localisation ── */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <View style={styles.cardHeadAccent} />
                <ThemedText style={styles.cardHeadLabel}>Localisation</ThemedText>
                <View style={styles.froidBadge}>
                  <ThemedText style={styles.froidBadgeText}>Froid positif +</ThemedText>
                </View>
              </View>

              {zone && (
                <View style={styles.zoneRow}>
                  <IcoPin size={13} color={C.navy} />
                  <ThemedText style={styles.zoneRowText}>{zone.name}</ThemedText>
                </View>
              )}

              <View style={styles.eqDetailBox}>
                <View style={styles.eqDetailLeft}>
                  <IcoFridge size={28} color={C.navy} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.eqDetailName}>{selectedEquipment.description || selectedEquipment.code}</ThemedText>
                  <ThemedText style={styles.eqDetailCode}>{selectedEquipment.code}</ThemedText>
                </View>
                <View style={styles.targetBox}>
                  <ThemedText style={styles.targetLabel}>Plage cible</ThemedText>
                  <ThemedText style={styles.targetValue}>
                    {selectedEquipment.min_temperature}° / {selectedEquipment.max_temperature}°C
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* ── Card 2 : Timeline ── */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <View style={styles.cardHeadAccent} />
                <IcoClock size={14} color={C.slate500} />
                <ThemedText style={styles.cardHeadLabel}>Contrôles du jour</ThemedText>
                {doneAll && (
                  <View style={styles.completeBadge}>
                    <IcoCheck size={10} color={C.green} />
                    <ThemedText style={styles.completeBadgeText}>Terminé</ThemedText>
                  </View>
                )}
              </View>

              {/* Timeline row */}
              <View style={styles.timelineWrap}>
                {/* Connector line */}
                <View style={styles.timelineLine} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.timelineRow}>
                    {selectedEquipment.check_times.map(ct => {
                      const status = ct.already_done ? 'done' : (selectedCheckTime?.id === ct.id ? 'active' : 'pending');
                      return (
                        <TimelineStep
                          key={ct.id}
                          time={ct.check_time.substring(0, 5)}
                          status={status}
                          recordedBy={ct.recorded_by}
                          recordedAt={ct.recorded_at}
                          onPress={() => !ct.already_done && setSelectedCheckTime(ct)}
                        />
                      );
                    })}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.toleranceRow}>
                <IcoClock size={11} color={C.slate400} />
                <ThemedText style={styles.toleranceText}>Tolérance de saisie : ±2 heures</ThemedText>
              </View>
            </View>

            {/* ── Card 3 : Température ── */}
            <View style={[styles.card, isAnomalous && styles.cardDanger]}>
              <View style={styles.cardHead}>
                <View style={[styles.cardHeadAccent, isAnomalous && { backgroundColor: C.red }]} />
                <IcoThermo size={16} color={isAnomalous ? C.red : C.navy} />
                <ThemedText style={[styles.cardHeadLabel, isAnomalous && { color: C.red }]}>Température relevée</ThemedText>
              </View>

              {/* Stepper */}
              <View style={styles.tempRow}>
                <TouchableOpacity
                  style={[styles.tempBtn, isAnomalous && styles.tempBtnDanger]}
                  onPress={() => setTemp(v => { const n = parse(v); return (isNaN(n) ? 0 : n - 1).toString(); })}
                  activeOpacity={0.8}
                >
                  <IcoMinus size={22} color={isAnomalous ? C.red : C.navy} />
                </TouchableOpacity>

                <View style={[styles.tempDisplay, isAnomalous && styles.tempDisplayDanger]}>
                  <TextInput
                    style={[styles.tempInput, isAnomalous && { color: C.red }]}
                    keyboardType="decimal-pad"
                    value={temp}
                    onChangeText={v => setTemp(v.replace(',', '.'))}
                    placeholder="--"
                    placeholderTextColor={C.slate300}
                    selectTextOnFocus
                  />
                  <ThemedText style={[styles.tempUnit, isAnomalous && { color: C.red }]}>°C</ThemedText>
                </View>

                <TouchableOpacity
                  style={[styles.tempBtn, isAnomalous && styles.tempBtnDanger]}
                  onPress={() => setTemp(v => { const n = parse(v); return (isNaN(n) ? 0 : n + 1).toString(); })}
                  activeOpacity={0.8}
                >
                  <IcoPlus size={22} color={isAnomalous ? C.red : C.navy} />
                </TouchableOpacity>
              </View>

              {/* Gauge */}
              {temp !== '' && !isNaN(tempNum) && (
                <GaugeBar
                  value={tempNum}
                  min={selectedEquipment.min_temperature ?? 0}
                  max={selectedEquipment.max_temperature ?? 10}
                  dangerMin={(selectedEquipment.min_temperature ?? 0) - 5}
                  dangerMax={(selectedEquipment.max_temperature ?? 10) + 5}
                />
              )}

              {isAnomalous && (
                <View style={styles.anomalyAlert}>
                  <IcoWarning size={16} color={C.red} />
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.anomalyAlertTitle}>Température non conforme !</ThemedText>
                    <ThemedText style={styles.anomalyAlertSub}>
                      Limite : {selectedEquipment.max_temperature}°C. Renseignez la fiche d'anomalie ci-dessous.
                    </ThemedText>
                  </View>
                </View>
              )}
            </View>

            {/* ── Card 4 : Fiche anomalie ── */}
            {isAnomalous && (
              <View style={[styles.card, styles.anomalyCard]}>
                <View style={styles.cardHead}>
                  <View style={[styles.cardHeadAccent, { backgroundColor: C.red }]} />
                  <IcoDoc size={15} color={C.red} />
                  <ThemedText style={[styles.cardHeadLabel, { color: C.red }]}>Fiche de non-conformité</ThemedText>
                </View>

                <CustomSelect
                  label="Cause probable"
                  options={CAUSE_OPTIONS}
                  value={probableCause}
                  onSelect={setProbableCause}
                  danger
                />
                <CustomSelect
                  label="Action corrective immédiate"
                  options={ACTION_OPTIONS}
                  value={correctiveAction}
                  onSelect={setCorrectiveAction}
                  danger
                />

                <View>
                  <ThemedText style={[sel.label, { color: C.red }]}>COMMENTAIRE / VISA</ThemedText>
                  <TextInput
                    style={styles.textarea}
                    placeholder="Précisez la situation..."
                    placeholderTextColor={C.slate400}
                    value={comments}
                    onChangeText={setComments}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            )}

            <View style={{ height: 110 }} />
          </ScrollView>

          {/* ── Footer ── */}
          <View style={[styles.footer, isAnomalous && styles.footerDanger]}>
            <TouchableOpacity
              style={[styles.footerBtn, (!selectedCheckTime || isSubmitting) && styles.footerBtnDisabled]}
              onPress={handleSave}
              disabled={!selectedCheckTime || isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color={C.white} />
              ) : (
                <>
                  {isAnomalous
                    ? <IcoWarning size={18} color={C.white} />
                    : <IcoCheck size={18} color={C.white} />
                  }
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.slate100 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.slate100 },

  // Header
  header:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.navy, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 6 },
  headerDanger:  { backgroundColor: C.red },
  headerBackBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:   { fontSize: 17, fontWeight: '800', color: C.white, letterSpacing: -0.3 },
  headerSub:     { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '500', marginTop: 1 },
  headerAlert:   { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  headerAlertText:{ fontSize: 11, fontWeight: '700', color: C.white },

  // Zone bar
  zoneBar:        { backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.slate100, paddingVertical: 10 },
  zoneBarContent: { paddingHorizontal: 16, gap: 8 },
  zoneTab:        { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: C.slate50, borderRadius: 20, borderWidth: 1, borderColor: C.slate200 },
  zoneTabActive:  { backgroundColor: C.navy, borderColor: C.navy },
  zoneTabText:    { fontSize: 12, fontWeight: '600', color: C.slate500 },
  zoneTabTextActive:{ color: C.white },

  // Summary bar
  summaryBar:   { flexDirection: 'row', backgroundColor: C.white, paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: C.slate100, gap: 0 },
  summaryItem:  { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: '800' },
  summaryLabel: { fontSize: 10, color: C.slate400, fontWeight: '600', marginTop: 1 },

  // Equipment list
  listContent:  { padding: 14, gap: 10 },
  eqCard:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.slate100, shadowColor: '#1A3B6E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  eqCardDone:   { backgroundColor: C.greenBg, borderColor: C.greenBd },
  eqIcon:       { width: 44, height: 44, borderRadius: 12, backgroundColor: C.blueBg, alignItems: 'center', justifyContent: 'center' },
  eqIconDone:   { backgroundColor: C.greenBg },
  eqCode:       { fontSize: 15, fontWeight: '800', color: C.slate800 },
  eqCodeDone:   { color: C.green },
  eqDesc:       { fontSize: 12, color: C.slate400, fontWeight: '500', marginBottom: 6 },
  eqRight:      { alignItems: 'center', gap: 3 },
  eqCount:      { fontSize: 11, fontWeight: '700', color: C.slate500 },
  zonePill:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.blueBg, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  zonePillText: { fontSize: 9, fontWeight: '700', color: C.navy },
  progressTrack:{ height: 3, backgroundColor: C.slate100, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },

  // Form layout
  formContent:  { padding: 14, gap: 14 },

  // Cards
  card:         { backgroundColor: C.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.slate100, shadowColor: '#1A3B6E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardDanger:   { borderColor: C.redBd, backgroundColor: C.redBg },
  cardHead:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardHeadAccent:{ width: 4, height: 16, borderRadius: 2, backgroundColor: C.navy },
  cardHeadLabel:{ flex: 1, fontSize: 13, fontWeight: '800', color: C.slate700 },

  // Froid badge
  froidBadge:    { backgroundColor: C.blueBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: C.blueBd },
  froidBadgeText:{ fontSize: 10, fontWeight: '700', color: C.blue },

  // Zone row
  zoneRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.slate100 },
  zoneRowText: { fontSize: 14, fontWeight: '700', color: C.navy },

  // Equipment detail box
  eqDetailBox:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.slate50, borderRadius: 12, padding: 12 },
  eqDetailLeft: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.blueBg, alignItems: 'center', justifyContent: 'center' },
  eqDetailName: { fontSize: 14, fontWeight: '700', color: C.slate800, marginBottom: 2 },
  eqDetailCode: { fontSize: 11, color: C.slate400, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  targetBox:    { alignItems: 'center' },
  targetLabel:  { fontSize: 9, color: C.slate400, fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  targetValue:  { fontSize: 13, fontWeight: '800', color: C.green },

  // Timeline
  timelineWrap:  { position: 'relative', marginBottom: 4 },
  timelineLine:  { position: 'absolute', top: 17, left: 28, right: 28, height: 2, backgroundColor: C.slate200, zIndex: 0 },
  timelineRow:   { flexDirection: 'row', gap: 8, paddingHorizontal: 4, paddingVertical: 8 },
  toleranceRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center' },
  toleranceText: { fontSize: 10, color: C.slate400, fontWeight: '500' },

  // Complete badge
  completeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.greenBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: C.greenBd },
  completeBadgeText:{ fontSize: 10, fontWeight: '700', color: C.green },

  // Temperature input
  tempRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginVertical: 8 },
  tempBtn:        { width: 50, height: 50, borderRadius: 14, backgroundColor: C.slate50, borderWidth: 1.5, borderColor: C.slate200, alignItems: 'center', justifyContent: 'center' },
  tempBtnDanger:  { borderColor: C.redBd, backgroundColor: C.redBg },
  tempDisplay:    { flexDirection: 'row', alignItems: 'flex-end', borderBottomWidth: 2.5, borderBottomColor: C.navy, paddingBottom: 4, minWidth: 110, justifyContent: 'center' },
  tempDisplayDanger:{ borderBottomColor: C.red },
  tempInput:      { fontSize: 40, fontWeight: '900', color: C.slate900, textAlign: 'center', padding: 0, width: 90 },
  tempUnit:       { fontSize: 22, fontWeight: '700', color: C.slate400, marginBottom: 6, marginLeft: 4 },

  // Anomaly alert
  anomalyAlert:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: C.redBg, borderRadius: 12, padding: 12, marginTop: 12, borderWidth: 1, borderColor: C.redBd },
  anomalyAlertTitle:{ fontSize: 13, fontWeight: '800', color: C.red, marginBottom: 2 },
  anomalyAlertSub:  { fontSize: 12, color: C.red, lineHeight: 17 },
  anomalyCard:      { borderColor: C.redBd },

  // Textarea
  textarea: { backgroundColor: C.white, borderWidth: 1.5, borderColor: C.redBd, borderRadius: 12, padding: 13, fontSize: 14, color: C.slate800, minHeight: 80 },

  // Footer
  footer:           { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.slate100, padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 10 },
  footerDanger:     { borderTopColor: C.redBd, backgroundColor: C.redBg },
  footerBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.navy, paddingVertical: 16, borderRadius: 14, shadowColor: C.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  footerBtnDisabled:{ opacity: 0.45 },
  footerBtnText:    { color: C.white, fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
});