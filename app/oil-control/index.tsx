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
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import oilControlApi, { Equipment, OilControlInitialData, Zone } from '../../api/oil-control';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { getErrorDetails } from '../../utils/error';
import Svg, { Path, Circle, Rect, G, Line, Polyline } from 'react-native-svg';

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const C = {
  navy:      '#1A3B6E',
  navyDark:  '#0F2547',
  green:     '#15803D',
  greenBg:   '#F0FDF4',
  greenBd:   '#BBF7D0',
  amber:     '#B45309',
  amberBg:   '#FFFBEB',
  amberBd:   '#FDE68A',
  orange:    '#C2410C',
  orangeBg:  '#FFF7ED',
  orangeBd:  '#FDBA74',
  red:       '#DC2626',
  redBg:     '#FEF2F2',
  redBd:     '#FECACA',
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

// ─── SVG Icons ────────────────────────────────────────────────────────────────
type IP = { size?: number; color?: string };
const SW = 1.8;

const IcoBack      = ({ size=20, color=C.navy }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcoCheck     = ({ size=16, color=C.white }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcoX         = ({ size=14, color=C.white }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={2.5} strokeLinecap="round"/>
  </Svg>
);
const IcoChevR     = ({ size=18, color=C.slate300 }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcoMinus     = ({ size=20, color=C.navy }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12h14" stroke={color} strokeWidth={2.2} strokeLinecap="round"/>
  </Svg>
);
const IcoPlus      = ({ size=20, color=C.navy }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2.2} strokeLinecap="round"/>
  </Svg>
);
const IcoWarning   = ({ size=16, color=C.orange }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={color} strokeWidth={SW} strokeLinejoin="round"/>
    <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth={SW} strokeLinecap="round"/>
  </Svg>
);
const IcoCritical  = ({ size=16, color=C.red }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={SW}/>
    <Path d="M12 8v4M12 16h.01" stroke={color} strokeWidth={SW} strokeLinecap="round"/>
  </Svg>
);
const IcoRecycle   = ({ size=20, color=C.green }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M7 19H4.5a2.5 2.5 0 010-5H5M17 19h2.5a2.5 2.5 0 000-5H19M12 3v10M9 6l3-3 3 3" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M5 14l-1 1 1 1M19 14l1 1-1 1" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcoTrash     = ({ size=20, color=C.amber }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M10 11v6M14 11v6" stroke={color} strokeWidth={SW} strokeLinecap="round"/>
  </Svg>
);
const IcoFryer     = ({ size=28, color=C.navy }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="6" width="18" height="14" rx="2" stroke={color} strokeWidth={SW}/>
    <Path d="M3 10h18" stroke={color} strokeWidth={SW} strokeLinecap="round"/>
    <Path d="M8 6V4M12 6V3M16 6V4" stroke={color} strokeWidth={SW} strokeLinecap="round"/>
    <Circle cx="12" cy="15" r="2" stroke={color} strokeWidth={SW}/>
  </Svg>
);
const IcoThermo    = ({ size=22, color=C.navy }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M14 14.76V5a2 2 0 00-4 0v9.76A4 4 0 1014 14.76z" stroke={color} strokeWidth={SW} strokeLinejoin="round"/>
  </Svg>
);
const IcoDroplet   = ({ size=22, color=C.amber }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2C6.5 9 4 13 4 16a8 8 0 0016 0c0-3-2.5-7-8-14z" stroke={color} strokeWidth={SW} strokeLinejoin="round"/>
  </Svg>
);
const IcoEye       = ({ size=18, color=C.navy }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth={SW}/>
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={SW}/>
  </Svg>
);

// ─── Gauge bar ────────────────────────────────────────────────────────────────
function GaugeBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(Math.max(value / max, 0), 1);
  return (
    <View style={gauge.track}>
      <View style={[gauge.fill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
    </View>
  );
}
const gauge = StyleSheet.create({
  track: { height: 6, backgroundColor: C.slate100, borderRadius: 3, overflow: 'hidden', marginTop: 8 },
  fill:  { height: '100%', borderRadius: 3 },
});

// ─── Sidebar ─────────────────────────────────────────────────────────────────
interface SidebarProps {
  data: OilControlInitialData | null;
  selectedZone: Zone | 'all';
  setSelectedZone: (z: Zone | 'all') => void;
  filteredEquipments: Equipment[];
  selectedFryer: Equipment | null;
  onSelectFryer: (f: Equipment) => void;
}

const Sidebar = memo(({ data, selectedZone, setSelectedZone, filteredEquipments, selectedFryer, onSelectFryer }: SidebarProps) => (
  <View style={styles.sidebar}>
    {/* Sidebar header */}
    <View style={styles.sidebarHeader}>
      <View style={styles.sidebarHeaderAccent} />
      <View>
        <ThemedText style={styles.sidebarTitle}>Équipements</ThemedText>
        <ThemedText style={styles.sidebarCount}>{filteredEquipments.length} friteuse(s)</ThemedText>
      </View>
    </View>

    {/* Zone tabs */}
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsContent}>
      {[{ id: 'all', name: 'Toutes' }, ...(data?.zones || [])].map((z: any) => {
        const active = z.id === 'all' ? selectedZone === 'all' : (selectedZone !== 'all' && selectedZone.id === z.id);
        return (
          <TouchableOpacity key={z.id} style={[styles.tab, active && styles.tabActive]} onPress={() => setSelectedZone(z.id === 'all' ? 'all' : z)} activeOpacity={0.8}>
            <ThemedText style={[styles.tabText, active && styles.tabTextActive]}>{z.name}</ThemedText>
          </TouchableOpacity>
        );
      })}
    </ScrollView>

    {/* Equipment list */}
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      {filteredEquipments.map(f => {
        const active = selectedFryer?.id === f.id;
        const zone   = data?.zones.find(z => z.equipments.some(e => e.id === f.id));
        return (
          <TouchableOpacity key={f.id} style={[styles.equipCard, active && styles.equipCardActive]} onPress={() => onSelectFryer(f)} activeOpacity={0.85}>
            <View style={[styles.equipIcon, active && styles.equipIconActive]}>
              <IcoFryer size={22} color={active ? C.white : C.navy} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.equipCode, active && { color: C.white }]}>{f.code}</ThemedText>
              <ThemedText style={[styles.equipDesc, active && { color: 'rgba(255,255,255,0.65)' }]} numberOfLines={1}>
                {f.description || 'Friteuse'}{selectedZone === 'all' && zone ? ` · ${zone.name}` : ''}
              </ThemedText>
            </View>
            {active ? <IcoCheck size={16} color={C.white} /> : <IcoChevR size={16} color={C.slate300} />}
          </TouchableOpacity>
        );
      })}
      {filteredEquipments.length === 0 && (
        <View style={{ paddingVertical: 40, alignItems: 'center', gap: 8 }}>
          <IcoFryer size={28} color={C.slate300} />
          <ThemedText style={{ color: C.slate400, fontSize: 13, fontWeight: '600' }}>Aucun équipement</ThemedText>
        </View>
      )}
    </ScrollView>
  </View>
));

// ─── Stepper button ───────────────────────────────────────────────────────────
function Stepper({ value, onDecrement, onIncrement, onChange, color }: {
  value: string; onDecrement: () => void; onIncrement: () => void; onChange: (v: string) => void; color: string;
}) {
  return (
    <View style={step.row}>
      <TouchableOpacity style={step.btn} onPress={onDecrement} activeOpacity={0.7}>
        <IcoMinus size={20} color={color} />
      </TouchableOpacity>
      <TextInput style={[step.input, { color }]} keyboardType="numeric" value={value} onChangeText={onChange} selectTextOnFocus />
      <TouchableOpacity style={step.btn} onPress={onIncrement} activeOpacity={0.7}>
        <IcoPlus size={20} color={color} />
      </TouchableOpacity>
    </View>
  );
}
const step = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', backgroundColor: C.slate50, borderRadius: 14, padding: 6, gap: 4 },
  btn:   { width: 42, height: 42, borderRadius: 10, backgroundColor: C.white, borderWidth: 1, borderColor: C.slate200, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, fontSize: 26, fontWeight: '900', textAlign: 'center', paddingVertical: 4 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function OilControlScreen() {
  const router = useRouter();
  const [loading, setLoading]       = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData]             = useState<OilControlInitialData | null>(null);
  const [selectedZone, setSelectedZone]   = useState<Zone | 'all'>('all');
  const [selectedFryer, setSelectedFryer] = useState<Equipment | null>(null);
  const [temp, setTemp]             = useState('160');
  const [peroxide, setPeroxide]     = useState('15');
  const [status, setStatus]         = useState<'reused' | 'changed'>('reused');
  const [checklistResults, setChecklistResults] = useState<Record<number, boolean>>({});

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const res = await oilControlApi.getInitialData();
      setData(res);
    } catch (error) {
      const { title, message } = getErrorDetails(error, 'Chargement impossible', 'Impossible de charger les équipements.');
      Alert.alert(title, message);
    } finally { setLoading(false); }
  };

  const parse = (v: string) => parseFloat(v.replace(',', '.')) || 0;

  const tempVal      = useMemo(() => parse(temp),    [temp]);
  const peroxideVal  = useMemo(() => parse(peroxide), [peroxide]);
  const tempAlert    = tempVal > 180;
  const peroxideCrit = peroxideVal >= 24;
  const peroxideWarn = peroxideVal >= 18 && !peroxideCrit;

  useEffect(() => { if (peroxideCrit) setStatus('changed'); }, [peroxideCrit]);

  const toggleChecklist = useCallback((id: number) => {
    setChecklistResults(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleSelectFryer = useCallback((f: Equipment) => {
    setSelectedFryer(f);
    setTemp('160'); setPeroxide('15'); setStatus('reused');
    const init: Record<number, boolean> = {};
    f.checklists.forEach(c => { init[c.id] = true; });
    setChecklistResults(init);
  }, []);

  const resetForm = () => { setSelectedFryer(null); setTemp('160'); setPeroxide('15'); setStatus('reused'); setChecklistResults({}); };

  const handleSave = async () => {
    if (!selectedFryer) return;
    try {
      setIsSubmitting(true);
      await oilControlApi.storeControl({
        equipment_id: selectedFryer.id,
        temperature: temp ? parse(temp) : null,
        peroxide_value: peroxide ? parse(peroxide) : null,
        status,
        checklists: selectedFryer.checklists.map(c => ({ checklist_id: c.id, recorded_value: !!checklistResults[c.id] })),
      });
      resetForm();
      Alert.alert('Succès', 'Rapport de contrôle enregistré !', [{ text: 'OK' }]);
    } catch (error) {
      const { title, message } = getErrorDetails(error, 'Enregistrement impossible', "Échec de l'enregistrement.");
      Alert.alert(title, message);
    } finally { setIsSubmitting(false); }
  };

  const filteredEquipments = useMemo(() => {
    if (!data) return [];
    if (selectedZone === 'all') return data.zones.flatMap(z => z.equipments);
    return selectedZone.equipments;
  }, [data, selectedZone]);

  // ── Temp card color ─────────────────────────────────────────────────────────
  const tempBg    = tempAlert ? C.orangeBg : C.slate50;
  const tempBd    = tempAlert ? C.orangeBd : C.slate200;
  const tempColor = tempAlert ? C.orange   : C.navy;
  const tempGaugeColor = tempVal > 180 ? C.orange : tempVal > 160 ? C.amber : C.green;

  // ── Peroxide card color ─────────────────────────────────────────────────────
  const peroxBg    = peroxideCrit ? C.redBg  : peroxideWarn ? C.amberBg  : C.slate50;
  const peroxBd    = peroxideCrit ? C.redBd  : peroxideWarn ? C.amberBd  : C.slate200;
  const peroxColor = peroxideCrit ? C.red    : peroxideWarn ? C.amber    : C.navy;
  const peroxGaugeColor = peroxideCrit ? C.red : peroxideWarn ? C.amber : C.green;

  return (
    <ThemedView style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaProvider style={{ flex: 1 }}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <IcoBack size={20} color={C.navy} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.headerTitle}>Contrôle des Huiles</ThemedText>
            <ThemedText style={styles.headerSub}>Friteuses · Analyse qualité HACCP</ThemedText>
          </View>
          {selectedFryer && (
            <View style={styles.headerSelectedPill}>
              <IcoFryer size={14} color={C.navy} />
              <ThemedText style={styles.headerSelectedText}>{selectedFryer.code}</ThemedText>
            </View>
          )}
        </View>

        {loading && !data ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={C.navy} />
            <ThemedText style={{ marginTop: 12, color: C.slate500, fontWeight: '600' }}>Chargement...</ThemedText>
          </View>
        ) : (
          <View style={styles.split}>
            {/* ── Sidebar ── */}
            <Sidebar
              data={data}
              selectedZone={selectedZone}
              setSelectedZone={setSelectedZone}
              filteredEquipments={filteredEquipments}
              selectedFryer={selectedFryer}
              onSelectFryer={handleSelectFryer}
            />

            {/* ── Form area ── */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {!selectedFryer ? (
                  // Empty state
                  <View style={styles.emptyState}>
                    <View style={styles.emptyRing}>
                      <IcoFryer size={44} color={C.slate300} />
                    </View>
                    <ThemedText style={styles.emptyTitle}>Sélectionner un équipement</ThemedText>
                    <ThemedText style={styles.emptySub}>Choisissez une friteuse dans le panneau gauche pour démarrer le contrôle d'huile HACCP.</ThemedText>
                    <View style={styles.emptyHint}>
                      <ThemedText style={styles.emptyHintText}>← Sélectionner dans la liste</ThemedText>
                    </View>
                  </View>
                ) : (
                  <View style={styles.form}>

                    {/* Form title */}
                    <View style={styles.formTitle}>
                      <View style={styles.formTitleAccent} />
                      <View>
                        <ThemedText style={styles.formTitleText}>Rapport · {selectedFryer.code}</ThemedText>
                        <ThemedText style={styles.formTitleSub}>{selectedFryer.description || 'Friteuse'}</ThemedText>
                      </View>
                    </View>

                    {/* ── Measure cards ── */}
                    <View style={styles.measureRow}>
                      {/* Temperature */}
                      <View style={[styles.measureCard, { backgroundColor: tempBg, borderColor: tempBd }]}>
                        <View style={styles.measureCardHead}>
                          <IcoThermo size={18} color={tempColor} />
                          <ThemedText style={[styles.measureCardLabel, { color: tempColor }]}>Température</ThemedText>
                          <ThemedText style={[styles.measureCardUnit, { color: tempColor }]}>°C</ThemedText>
                        </View>
                        <Stepper
                          value={temp}
                          onDecrement={() => setTemp(v => Math.max(0, parse(v) - 1).toString())}
                          onIncrement={() => setTemp(v => (parse(v) + 1).toString())}
                          onChange={v => setTemp(v.replace(',', '.'))}
                          color={tempColor}
                        />
                        <GaugeBar value={tempVal} max={220} color={tempGaugeColor} />
                        {tempAlert && (
                          <View style={styles.alertBanner}>
                            <IcoWarning size={13} color={C.orange} />
                            <ThemedText style={[styles.alertText, { color: C.orange }]}>Température élevée (>180°C)</ThemedText>
                          </View>
                        )}
                      </View>

                      {/* Peroxide */}
                      <View style={[styles.measureCard, { backgroundColor: peroxBg, borderColor: peroxBd }]}>
                        <View style={styles.measureCardHead}>
                          <IcoDroplet size={18} color={peroxColor} />
                          <ThemedText style={[styles.measureCardLabel, { color: peroxColor }]}>Indice peroxyde</ThemedText>
                          <ThemedText style={[styles.measureCardUnit, { color: peroxColor }]}>%</ThemedText>
                        </View>
                        <Stepper
                          value={peroxide}
                          onDecrement={() => setPeroxide(v => Math.max(0, parse(v) - 1).toString())}
                          onIncrement={() => setPeroxide(v => (parse(v) + 1).toString())}
                          onChange={v => setPeroxide(v.replace(',', '.'))}
                          color={peroxColor}
                        />
                        <GaugeBar value={peroxideVal} max={30} color={peroxGaugeColor} />
                        {peroxideCrit && (
                          <View style={[styles.alertBanner, { backgroundColor: C.redBg }]}>
                            <IcoCritical size={13} color={C.red} />
                            <ThemedText style={[styles.alertText, { color: C.red }]}>Seuil critique ≥24% — Changement obligatoire</ThemedText>
                          </View>
                        )}
                        {peroxideWarn && (
                          <View style={styles.alertBanner}>
                            <IcoWarning size={13} color={C.amber} />
                            <ThemedText style={[styles.alertText, { color: C.amber }]}>Attention : proche du seuil critique</ThemedText>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* ── Action huile ── */}
                    <View style={styles.section}>
                      <View style={styles.sectionHead}>
                        <ThemedText style={styles.sectionLabel}>Action sur l'huile</ThemedText>
                        {peroxideCrit && (
                          <View style={styles.forcedBadge}>
                            <ThemedText style={styles.forcedBadgeText}>Changement forcé</ThemedText>
                          </View>
                        )}
                      </View>
                      <View style={styles.toggleTrack}>
                        <TouchableOpacity
                          style={[styles.toggleBtn, status === 'reused' && styles.toggleBtnGreen]}
                          onPress={() => {
                            if (peroxideCrit) {
                              Alert.alert('Attention', "L'indice de peroxyde est critique (≥24%). Réutiliser quand même ?", [
                                { text: 'Annuler', style: 'cancel' },
                                { text: 'Confirmer', onPress: () => setStatus('reused') },
                              ]);
                            } else { setStatus('reused'); }
                          }}
                          activeOpacity={0.85}
                        >
                          <IcoRecycle size={20} color={status === 'reused' ? C.white : C.green} />
                          <ThemedText style={[styles.toggleText, status === 'reused' && { color: C.white }]}>Réutilisée</ThemedText>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.toggleBtn, status === 'changed' && styles.toggleBtnAmber]}
                          onPress={() => setStatus('changed')}
                          activeOpacity={0.85}
                        >
                          <IcoTrash size={20} color={status === 'changed' ? C.white : C.amber} />
                          <ThemedText style={[styles.toggleText, status === 'changed' && { color: C.white }]}>Changée</ThemedText>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* ── Checklist visuelle ── */}
                    {selectedFryer.checklists.length > 0 && (
                      <View style={styles.section}>
                        <View style={styles.sectionHead}>
                          <IcoEye size={15} color={C.slate500} />
                          <ThemedText style={styles.sectionLabel}>Contrôle visuel</ThemedText>
                          <ThemedText style={styles.sectionCount}>
                            {Object.values(checklistResults).filter(Boolean).length}/{selectedFryer.checklists.length}
                          </ThemedText>
                        </View>
                        <View style={styles.checklistBox}>
                          {selectedFryer.checklists.map((c, idx) => {
                            const ok = !!checklistResults[c.id];
                            return (
                              <TouchableOpacity
                                key={c.id}
                                style={[
                                  styles.checkRow,
                                  idx < selectedFryer.checklists.length - 1 && styles.checkRowBorder,
                                  !ok && styles.checkRowError,
                                ]}
                                onPress={() => toggleChecklist(c.id)}
                                activeOpacity={0.8}
                              >
                                <ThemedText style={[styles.checkText, !ok && styles.checkTextError]}>{c.name}</ThemedText>
                                <View style={[styles.checkbox, ok ? styles.checkboxOk : styles.checkboxFail]}>
                                  {ok ? <IcoCheck size={12} color={C.white} /> : <IcoX size={11} color={C.white} />}
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    )}

                    {/* ── Submit ── */}
                    <TouchableOpacity
                      style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                      onPress={handleSave}
                      disabled={isSubmitting}
                      activeOpacity={0.85}
                    >
                      {isSubmitting
                        ? <ActivityIndicator color={C.white} />
                        : <ThemedText style={styles.submitBtnText}>Valider le rapport</ThemedText>
                      }
                    </TouchableOpacity>

                    <View style={{ height: 48 }} />
                  </View>
                )}
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        )}
      </SafeAreaProvider>
    </ThemedView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.slate100 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.slate100, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: C.slate900, letterSpacing: -0.3 },
  headerSub: { fontSize: 11, color: C.slate400, fontWeight: '500', marginTop: 1 },
  headerSelectedPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.blueBg ?? '#EFF6FF', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#BFDBFE' },
  headerSelectedText: { fontSize: 12, fontWeight: '700', color: C.navy },

  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Layout
  split: { flex: 1, flexDirection: 'row' },

  // Sidebar
  sidebar: { width: '36%', minWidth: 220, maxWidth: 320, backgroundColor: C.white, borderRightWidth: 1, borderRightColor: C.slate200, padding: 16 },
  sidebarHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sidebarHeaderAccent: { width: 4, height: 20, borderRadius: 2, backgroundColor: C.navy },
  sidebarTitle: { fontSize: 14, fontWeight: '800', color: C.slate800, letterSpacing: -0.2 },
  sidebarCount: { fontSize: 11, color: C.slate400, fontWeight: '500' },
  tabsScroll: { marginBottom: 14 },
  tabsContent: { gap: 6, paddingBottom: 4 },
  tab: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: C.slate50, borderRadius: 20, borderWidth: 1, borderColor: C.slate200 },
  tabActive: { backgroundColor: C.navy, borderColor: C.navy },
  tabText: { fontSize: 12, fontWeight: '600', color: C.slate500 },
  tabTextActive: { color: C.white },
  equipCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.slate50, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1.5, borderColor: 'transparent' },
  equipCardActive: { backgroundColor: C.navy, borderColor: C.navyDark },
  equipIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  equipIconActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  equipCode: { fontSize: 14, fontWeight: '800', color: C.slate800, marginBottom: 1 },
  equipDesc: { fontSize: 11, color: C.slate400, fontWeight: '500' },

  // Empty state
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 48, marginTop: 60 },
  emptyRing: { width: 96, height: 96, borderRadius: 48, backgroundColor: C.slate100, borderWidth: 2, borderColor: C.slate200, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: C.slate600, marginBottom: 8 },
  emptySub: { fontSize: 13, color: C.slate400, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  emptyHint: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.slate50, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: C.slate200 },
  emptyHintText: { fontSize: 12, color: C.slate500, fontWeight: '600' },

  // Form
  form: { padding: 20, backgroundColor: C.white, flex: 1 },
  formTitle: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  formTitleAccent: { width: 4, height: 24, borderRadius: 2, backgroundColor: C.navy },
  formTitleText: { fontSize: 16, fontWeight: '800', color: C.slate900, letterSpacing: -0.2 },
  formTitleSub: { fontSize: 11, color: C.slate400, fontWeight: '500', marginTop: 1 },

  // Measure cards
  measureRow: { flexDirection: 'row', gap: 14, marginBottom: 24 },
  measureCard: { flex: 1, borderRadius: 16, padding: 14, borderWidth: 1.5 },
  measureCardHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  measureCardLabel: { flex: 1, fontSize: 12, fontWeight: '700' },
  measureCardUnit: { fontSize: 11, fontWeight: '600', opacity: 0.7 },
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10, backgroundColor: C.orangeBg, borderRadius: 8, padding: 8 },
  alertText: { fontSize: 10, fontWeight: '700', flex: 1 },

  // Section
  section: { marginBottom: 24 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: C.slate500, textTransform: 'uppercase', letterSpacing: 0.6, flex: 1 },
  sectionCount: { fontSize: 11, fontWeight: '700', color: C.navy, backgroundColor: C.slate100, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  forcedBadge: { backgroundColor: C.redBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: C.redBd },
  forcedBadgeText: { fontSize: 10, fontWeight: '800', color: C.red },

  // Toggle (oil action)
  toggleTrack: { flexDirection: 'row', backgroundColor: C.slate100, borderRadius: 16, padding: 6, gap: 6 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  toggleBtnGreen: { backgroundColor: C.green },
  toggleBtnAmber: { backgroundColor: C.amber },
  toggleText: { fontSize: 14, fontWeight: '700', color: C.slate500 },

  // Checklist
  checklistBox: { backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.slate200, overflow: 'hidden' },
  checkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: C.white },
  checkRowBorder: { borderBottomWidth: 1, borderBottomColor: C.slate100 },
  checkRowError: { backgroundColor: C.redBg },
  checkText: { flex: 1, fontSize: 14, fontWeight: '600', color: C.slate700 },
  checkTextError: { color: C.red },
  checkbox: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  checkboxOk: { backgroundColor: C.green },
  checkboxFail: { backgroundColor: C.red },

  // Submit
  submitBtn: { backgroundColor: C.navy, borderRadius: 14, padding: 18, alignItems: 'center', shadowColor: C.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  submitBtnText: { color: C.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  submitBtnDisabled: { opacity: 0.5 },
});

// token manquant dans C, ajout en bas pour éviter TS error
const blueBg = '#EFF6FF';