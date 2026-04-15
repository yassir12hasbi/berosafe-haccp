import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import nettDesiApi, { NettDesiTask, NettDesiTasksResponse } from '../../api/nett-desi';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { getErrorDetails } from '../../utils/error';
import Svg, { Path, Circle, Rect, G, Line } from 'react-native-svg';

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
  navy:      '#1A3B6E',
  navyDark:  '#0F2547',
  green:     '#15803D',
  greenBg:   '#F0FDF4',
  greenBd:   '#BBF7D0',
  greenDark: '#166534',
  teal:      '#0F766E',
  tealBg:    '#F0FDFA',
  tealBd:    '#99F6E4',
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

type FeedbackState = { type: 'success' | 'error'; message: string } | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtPanelDate = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const fmtDate = (d: Date) => {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const dd = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

const patchTask = (
  tasks: NettDesiTask[],
  id: number,
  p: Pick<NettDesiTask, 'is_completed' | 'notes' | 'completed_at'>
) => tasks.map(t => (t.id === id ? { ...t, ...p } : t));

// ─── SVG Icons ────────────────────────────────────────────────────────────────
type IP = { size?: number; color?: string };
const SW = 1.8;

const IcoBack    = ({ size=18, color=C.white   }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcoRefresh = ({ size=16, color=C.white   }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M23 4v6h-6" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M1 20v-6h6" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcoCheck   = ({ size=14, color=C.white   }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcoClose   = ({ size=18, color=C.slate400}: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={SW} strokeLinecap="round"/>
  </Svg>
);
const IcoChevR   = ({ size=14, color=C.slate400}: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcoChevL   = ({ size=14, color=C.teal    }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcoSprayer = ({ size=14, color=C.teal    }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M8 3h4v4H8zM3 8h2M3 11h2M3 14h2M6 8v10a2 2 0 002 2h4a2 2 0 002-2V8H6z" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M14 10h4l2-3h-4" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcoCalendar= ({ size=12, color=C.slate400}: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth={SW}/>
    <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth={SW} strokeLinecap="round"/>
  </Svg>
);
const IcoWarning = ({ size=14, color=C.red     }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={color} strokeWidth={SW} strokeLinejoin="round"/>
    <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth={SW} strokeLinecap="round"/>
  </Svg>
);
const IcoZone    = ({ size=12, color=C.navy    }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke={color} strokeWidth={SW} strokeLinejoin="round"/>
    <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth={SW}/>
  </Svg>
);
const IcoNote    = ({ size=12, color=C.slate500}: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={color} strokeWidth={SW} strokeLinejoin="round"/>
    <Path d="M14 2v6h6M16 13H8M16 17H8" stroke={color} strokeWidth={SW} strokeLinecap="round"/>
  </Svg>
);

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={sc.wrap}>
      <ThemedText style={[sc.value, { color }]}>{value}</ThemedText>
      <ThemedText style={sc.label}>{label}</ThemedText>
    </View>
  );
}
const sc = StyleSheet.create({
  wrap:  { flex: 1, backgroundColor: C.slate50, borderRadius: 12, paddingVertical: 10, alignItems: 'center', gap: 2 },
  value: { fontSize: 22, fontWeight: '900' },
  label: { fontSize: 9, fontWeight: '700', color: C.slate400, textTransform: 'uppercase', letterSpacing: 0.5 },
});

// ─── Task card ────────────────────────────────────────────────────────────────
function TaskCard({
  task, isUpdating, todayKey, onPress,
}: {
  task: NettDesiTask; isUpdating: boolean; todayKey: string; onPress: () => void;
}) {
  const isEditable = task.is_today === true || (!task.is_completed && task.scheduled_date < todayKey);
  const done = task.is_completed;
  return (
    <TouchableOpacity
      style={[styles.taskCard, done && styles.taskCardDone, !isEditable && styles.taskCardReadonly]}
      onPress={() => isEditable && onPress()}
      disabled={isUpdating || !isEditable}
      activeOpacity={isEditable ? 0.8 : 1}
    >
      {/* Left accent */}
      <View style={[styles.taskAccent, { backgroundColor: done ? C.green : C.teal }]} />

      {/* Icon */}
      <View style={[styles.taskIconWrap, { backgroundColor: done ? C.greenBg : C.tealBg }]}>
        {done ? <IcoCheck size={13} color={C.green} /> : <IcoSprayer size={13} color={C.teal} />}
      </View>

      {/* Content */}
      <View style={styles.taskBody}>
        <View style={styles.taskTopRow}>
          <ThemedText style={[styles.taskName, done && styles.taskNameDone]} numberOfLines={1}>
            {task.equipement.name}
          </ThemedText>
          <View style={[styles.freqBadge, done && styles.freqBadgeDone]}>
            <ThemedText style={[styles.freqText, done && styles.freqTextDone]}>
              {task.equipement.frequency}
            </ThemedText>
          </View>
        </View>
        <View style={styles.taskMetaRow}>
          <IcoZone size={10} color={done ? C.green : C.slate400} />
          <ThemedText style={styles.taskMeta} numberOfLines={1}>
            {task.zone?.name ?? 'Sans zone'}
          </ThemedText>
        </View>
        {task.notes ? (
          <View style={styles.taskNoteRow}>
            <IcoNote size={10} color={C.slate400} />
            <ThemedText style={styles.taskNote} numberOfLines={1}>{task.notes}</ThemedText>
          </View>
        ) : null}
      </View>

      {/* Right */}
      <View style={styles.taskRight}>
        {isUpdating ? (
          <ActivityIndicator size="small" color={C.teal} />
        ) : isEditable ? (
          <>
            <View style={[styles.statusDot, { backgroundColor: done ? C.green : C.amber }]} />
            <IcoChevR size={14} color={C.slate300} />
          </>
        ) : (
          <IcoCalendar size={13} color={C.slate300} />
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title, color = C.green, icon }: { title: string; color?: string; icon?: React.ReactNode }) {
  return (
    <View style={[styles.sectionHead, { borderLeftColor: color }]}>
      {icon}
      <ThemedText style={[styles.sectionTitle, { color }]}>{title}</ThemedText>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function CleaningDisinfectionScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [referenceDate]    = useState(() => new Date());
  const todayKey           = fmtDate(referenceDate);
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1)
  );
  const [selectedZone, setSelectedZone]           = useState<string>('all');
  const [statusFilter, setStatusFilter]           = useState<'pending' | 'done' | 'all'>('pending');
  const [loading, setLoading]                     = useState(true);
  const [refreshing, setRefreshing]               = useState(false);
  const [updatingTaskId, setUpdatingTaskId]       = useState<number | null>(null);
  const [data, setData]                           = useState<NettDesiTasksResponse | null>(null);
  const [feedback, setFeedback]                   = useState<FeedbackState>(null);
  const [selectedTask, setSelectedTask]           = useState<NettDesiTask | null>(null);
  const [selectedCalDate, setSelectedCalDate]     = useState<string | null>(null);
  const [noteDraft, setNoteDraft]                 = useState('');

  useEffect(() => { loadTasks(); }, []);
  useEffect(() => { if (feedback) { const t = setTimeout(() => setFeedback(null), 3500); return () => clearTimeout(t); } }, [feedback]);

  const zoneOptions = useMemo(() => {
    const z = new Set<string>();
    (data?.tasks ?? []).forEach(t => z.add(t.zone?.name ?? 'Sans zone'));
    return ['all', ...Array.from(z).sort((a, b) => a.localeCompare(b, 'fr'))];
  }, [data]);

  const zoneFiltered = useMemo(() => {
    let t = data?.tasks ?? [];
    if (selectedZone !== 'all') t = t.filter(task => (task.zone?.name ?? 'Sans zone') === selectedZone);
    return t;
  }, [data, selectedZone]);

  const applyStatus = (tasks: NettDesiTask[]) => {
    if (statusFilter === 'pending') return tasks.filter(t => !t.is_completed);
    if (statusFilter === 'done') return tasks.filter(t => t.is_completed);
    return tasks;
  };

  const todayAll      = useMemo(() => zoneFiltered.filter(t => t.is_today), [zoneFiltered]);
  const todayTasks    = useMemo(() => applyStatus(todayAll), [todayAll, statusFilter]);
  const overdueTasks  = useMemo(() => applyStatus(zoneFiltered.filter(t => !t.is_today && !t.is_completed && t.scheduled_date < todayKey)), [zoneFiltered, todayKey, statusFilter]);
  const mainBase      = useMemo(() => zoneFiltered.filter(t => t.is_today || (!t.is_today && !t.is_completed && t.scheduled_date < todayKey)), [zoneFiltered, todayKey]);

  const taskCountByDate   = useMemo(() => applyStatus(zoneFiltered).reduce<Record<string, number>>((a, t) => { a[t.scheduled_date] = (a[t.scheduled_date] ?? 0) + 1; return a; }, {}), [zoneFiltered, statusFilter]);
  const overdueCountByDate = useMemo(() => zoneFiltered.reduce<Record<string, number>>((a, t) => { if (!t.is_completed && t.scheduled_date < todayKey) { a[t.scheduled_date] = (a[t.scheduled_date] ?? 0) + 1; } return a; }, {}), [zoneFiltered, todayKey]);
  const tasksByDate        = useMemo(() => applyStatus(zoneFiltered).reduce<Record<string, NettDesiTask[]>>((a, t) => { if (!a[t.scheduled_date]) a[t.scheduled_date] = []; a[t.scheduled_date].push(t); return a; }, {}), [zoneFiltered, statusFilter]);

  const availableMonths  = useMemo(() => { const m = new Set<string>(); m.add(fmtDate(referenceDate).slice(0, 7)); applyStatus(zoneFiltered).forEach(t => m.add(t.scheduled_date.slice(0, 7))); return Array.from(m).sort(); }, [zoneFiltered, referenceDate, statusFilter]);
  const calMonthKey      = fmtDate(calendarMonth).slice(0, 7);
  const canPrevMonth     = availableMonths.some(m => m < calMonthKey);
  const canNextMonth     = availableMonths.some(m => m > calMonthKey);

  const calDays = useMemo(() => {
    const first = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const last  = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
    const firstWD = (first.getDay() + 6) % 7;
    const start = new Date(first); start.setDate(first.getDate() - firstWD);
    const total = firstWD + last.getDate() + (6 - (last.getDay() + 6) % 7);
    return Array.from({ length: total }, (_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const k = fmtDate(d);
      return { key: k, day: d.getDate(), inMonth: d.getMonth() === calendarMonth.getMonth(), isToday: k === todayKey, count: taskCountByDate[k] ?? 0, overdueCount: overdueCountByDate[k] ?? 0 };
    });
  }, [calendarMonth, referenceDate, taskCountByDate, overdueCountByDate, todayKey]);

  const monthLabel       = calendarMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const panelTasks       = selectedCalDate ? tasksByDate[selectedCalDate] ?? [] : [];
  const completedToday   = todayAll.filter(t => t.is_completed).length;
  const pendingToday     = todayAll.filter(t => !t.is_completed).length;
  const overdueCount     = zoneFiltered.filter(t => !t.is_today && !t.is_completed && t.scheduled_date < todayKey).length;
  const zonePaneWidth    = width < 420 ? 130 : 150;

  const loadTasks = async (mode: 'initial' | 'refresh' = 'initial') => {
    try {
      mode === 'initial' ? setLoading(true) : setRefreshing(true);
      const res = await nettDesiApi.getTasks(fmtDate(referenceDate));
      setData(res);
    } catch (error) {
      const { title, message } = getErrorDetails(error, 'Chargement impossible', 'Impossible de charger les tâches.');
      setFeedback({ type: 'error', message });
      if (mode === 'initial') Alert.alert(title, message);
    } finally { setLoading(false); setRefreshing(false); }
  };

  const openTask  = (t: NettDesiTask) => { setSelectedTask(t); setNoteDraft(t.notes ?? ''); };
  const closeTask = () => { setSelectedTask(null); setNoteDraft(''); };

  const handleToggle = async () => {
    if (!selectedTask) return;
    try {
      setUpdatingTaskId(selectedTask.id);
      const res = await nettDesiApi.updateTaskStatus(selectedTask.id, { is_completed: !selectedTask.is_completed, notes: noteDraft.trim() || null });
      setData(cur => cur ? { ...cur, tasks: patchTask(cur.tasks, selectedTask.id, { is_completed: res.task.is_completed, notes: res.task.notes, completed_at: res.task.completed_at }) } : cur);
      setFeedback({ type: 'success', message: res.message || 'Statut mis à jour.' });
      closeTask();
    } catch (error) {
      const { message } = getErrorDetails(error, 'Mise à jour impossible', 'Le statut n\'a pas pu être mis à jour.');
      setFeedback({ type: 'error', message });
    } finally { setUpdatingTaskId(null); }
  };

  // ── Filter chips ──────────────────────────────────────────────────────────
  const filterChips: { key: 'pending' | 'done' | 'all'; label: string; count: number }[] = [
    { key: 'pending', label: 'À faire',  count: mainBase.filter(t => !t.is_completed).length },
    { key: 'done',    label: 'Faites',   count: mainBase.filter(t => t.is_completed).length },
    { key: 'all',     label: 'Toutes',   count: mainBase.length },
  ];

  return (
    <ThemedView style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaProvider style={{ flex: 1 }}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <IcoBack size={18} color={C.white} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.headerTitle}>Nettoyage & Désinfection</ThemedText>
            <ThemedText style={styles.headerSub}>Plan de nettoyage HACCP</ThemedText>
          </View>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => loadTasks('refresh')} disabled={refreshing || loading} activeOpacity={0.8}>
            {refreshing || loading
              ? <ActivityIndicator size="small" color={C.white} />
              : <IcoRefresh size={16} color={C.white} />
            }
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={C.green} />
            <ThemedText style={{ marginTop: 12, color: C.slate500, fontWeight: '600' }}>Chargement...</ThemedText>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadTasks('refresh')} tintColor={C.green} />}
            showsVerticalScrollIndicator={false}
          >

            {/* ── Summary card ── */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryTop}>
                <View style={styles.summaryTitleRow}>
                  <View style={styles.summaryAccent} />
                  <ThemedText style={styles.summaryTitle}>Aujourd'hui</ThemedText>
                  <ThemedText style={styles.summaryDate}>{referenceDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</ThemedText>
                </View>
                {/* Progress bar */}
                {todayAll.length > 0 && (
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${(completedToday / todayAll.length) * 100}%` as any }]} />
                  </View>
                )}
              </View>
              <View style={styles.statsRow}>
                <StatCard value={todayAll.length}  label="Total"     color={C.navy} />
                <StatCard value={completedToday}   label="Faites"    color={C.green} />
                <StatCard value={pendingToday}     label="Restantes" color={C.amber} />
                <StatCard value={overdueCount}     label="En retard" color={C.red} />
              </View>
            </View>

            {/* ── Feedback ── */}
            {feedback && (
              <View style={[styles.feedback, feedback.type === 'success' ? styles.feedbackOk : styles.feedbackErr]}>
                {feedback.type === 'success'
                  ? <IcoCheck size={14} color={C.green} />
                  : <IcoWarning size={14} color={C.red} />
                }
                <ThemedText style={[styles.feedbackText, { color: feedback.type === 'success' ? C.green : C.red }]}>
                  {feedback.message}
                </ThemedText>
              </View>
            )}

            {/* ── Split: zones + tasks ── */}
            <View style={styles.split}>

              {/* Zones sidebar */}
              <View style={[styles.zonesPane, { width: zonePaneWidth }]}>
                <ThemedText style={styles.zonesPaneTitle}>Zones</ThemedText>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {zoneOptions.map(z => {
                    const active = z === selectedZone;
                    return (
                      <TouchableOpacity
                        key={z}
                        style={[styles.zoneItem, active && styles.zoneItemActive]}
                        onPress={() => setSelectedZone(z)}
                        activeOpacity={0.8}
                      >
                        {active && <View style={styles.zoneActiveDot} />}
                        <ThemedText style={[styles.zoneItemText, active && styles.zoneItemTextActive]} numberOfLines={2}>
                          {z === 'all' ? 'Toutes' : z}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Tasks pane */}
              <View style={styles.tasksPane}>

                {/* Filter chips */}
                <View style={styles.filterRow}>
                  {filterChips.map(chip => {
                    const active = statusFilter === chip.key;
                    return (
                      <TouchableOpacity
                        key={chip.key}
                        style={[styles.filterChip, active && styles.filterChipActive]}
                        onPress={() => setStatusFilter(chip.key)}
                        activeOpacity={0.8}
                      >
                        <ThemedText style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                          {chip.count} {chip.label}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Today section */}
                <View style={styles.sectionCard}>
                  <SectionHeader title="Tâches du jour" />
                  {todayTasks.length === 0
                    ? <ThemedText style={styles.emptyText}>Aucune tâche pour aujourd'hui.</ThemedText>
                    : todayTasks.map(t => (
                        <TaskCard key={t.id} task={t} isUpdating={updatingTaskId === t.id} todayKey={todayKey} onPress={() => openTask(t)} />
                      ))
                  }
                </View>

                {/* Overdue section */}
                {overdueTasks.length > 0 && (
                  <View style={[styles.sectionCard, styles.sectionCardDanger]}>
                    <SectionHeader title="Tâches en retard" color={C.red} icon={<IcoWarning size={14} color={C.red} />} />
                    {overdueTasks.map(t => (
                      <TaskCard key={t.id} task={t} isUpdating={updatingTaskId === t.id} todayKey={todayKey} onPress={() => openTask(t)} />
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* ── Calendar ── */}
            <View style={styles.sectionCard}>
              {/* Calendar header */}
              <View style={styles.calHead}>
                <SectionHeader title="Calendrier" />
                <View style={styles.calNav}>
                  <TouchableOpacity style={[styles.calNavBtn, !canPrevMonth && { opacity: 0.3 }]} onPress={() => canPrevMonth && setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} disabled={!canPrevMonth}>
                    <IcoChevL size={14} color={C.green} />
                  </TouchableOpacity>
                  <ThemedText style={styles.calMonthLabel}>{monthLabel}</ThemedText>
                  <TouchableOpacity style={[styles.calNavBtn, !canNextMonth && { opacity: 0.3 }]} onPress={() => canNextMonth && setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} disabled={!canNextMonth}>
                    <IcoChevR size={14} color={C.green} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Legend */}
              <View style={styles.calLegend}>
                {[{ color: C.green, label: 'Planifié' }, { color: C.red, label: 'En retard' }].map(l => (
                  <View key={l.label} style={styles.calLegendItem}>
                    <View style={[styles.calLegendDot, { backgroundColor: l.color }]} />
                    <ThemedText style={styles.calLegendText}>{l.label}</ThemedText>
                  </View>
                ))}
              </View>

              {/* Day headers */}
              <View style={styles.calWeekRow}>
                {['L','M','M','J','V','S','D'].map((d, i) => (
                  <ThemedText key={i} style={styles.calWeekDay}>{d}</ThemedText>
                ))}
              </View>

              {/* Grid */}
              <View style={styles.calGrid}>
                {calDays.map(day => (
                  <TouchableOpacity
                    key={day.key}
                    style={[
                      styles.calCell,
                      !day.inMonth && styles.calCellMuted,
                      day.isToday && styles.calCellToday,
                      day.key === selectedCalDate && styles.calCellSelected,
                      day.overdueCount > 0 && styles.calCellOverdue,
                    ]}
                    onPress={() => day.count > 0 && setSelectedCalDate(day.key)}
                    disabled={day.count === 0}
                    activeOpacity={0.75}
                  >
                    <ThemedText style={[
                      styles.calDayNum,
                      !day.inMonth && styles.calDayNumMuted,
                      day.isToday && styles.calDayNumToday,
                      day.key === selectedCalDate && styles.calDayNumSelected,
                    ]}>
                      {day.day}
                    </ThemedText>
                    {day.count > 0 && (
                      <View style={[styles.calDotWrap, day.overdueCount > 0 && styles.calDotWrapOverdue]}>
                        <ThemedText style={[styles.calCount, day.overdueCount > 0 && styles.calCountOverdue]}>
                          {day.overdueCount > 0 ? `${day.count}!` : day.count}
                        </ThemedText>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>
        )}

        {/* ── Side panel modal (calendar date) ── */}
        <Modal visible={selectedCalDate !== null} transparent animationType="slide" onRequestClose={() => setSelectedCalDate(null)}>
          <View style={styles.panelOverlay}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setSelectedCalDate(null)} />
            <View style={styles.panel}>
              <View style={styles.panelHandle} />
              <View style={styles.panelHeader}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.panelTitle}>Tâches planifiées</ThemedText>
                  <ThemedText style={styles.panelSubtitle}>{selectedCalDate ? fmtPanelDate(selectedCalDate) : ''}</ThemedText>
                </View>
                <TouchableOpacity style={styles.panelClose} onPress={() => setSelectedCalDate(null)}>
                  <IcoClose size={16} color={C.slate500} />
                </TouchableOpacity>
              </View>
              {/* Panel stats */}
              {panelTasks.length > 0 && (
                <View style={styles.panelStats}>
                  <View style={[styles.panelStatChip, { backgroundColor: C.greenBg, borderColor: C.greenBd }]}>
                    <ThemedText style={{ fontSize: 11, fontWeight: '700', color: C.green }}>
                      ✓ {panelTasks.filter(t => t.is_completed).length} faite(s)
                    </ThemedText>
                  </View>
                  {panelTasks.filter(t => !t.is_completed).length > 0 && (
                    <View style={[styles.panelStatChip, { backgroundColor: C.amberBg, borderColor: C.amberBd }]}>
                      <ThemedText style={{ fontSize: 11, fontWeight: '700', color: C.amber }}>
                        {panelTasks.filter(t => !t.is_completed).length} restante(s)
                      </ThemedText>
                    </View>
                  )}
                </View>
              )}
              <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }} showsVerticalScrollIndicator={false}>
                {panelTasks.length === 0
                  ? <ThemedText style={styles.emptyText}>Aucune tâche pour cette date.</ThemedText>
                  : panelTasks.map(t => (
                      <TaskCard key={t.id} task={t} isUpdating={updatingTaskId === t.id} todayKey={todayKey} onPress={() => { setSelectedCalDate(null); openTask(t); }} />
                    ))
                }
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ── Task action modal ── */}
        <Modal visible={selectedTask !== null} transparent animationType="slide" onRequestClose={closeTask}>
          <View style={styles.sheetOverlay}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeTask} />
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />

              {/* Task info */}
              <View style={styles.sheetHeader}>
                <View style={[styles.sheetIconWrap, { backgroundColor: selectedTask?.is_completed ? C.greenBg : C.tealBg }]}>
                  {selectedTask?.is_completed ? <IcoCheck size={18} color={C.green} /> : <IcoSprayer size={18} color={C.teal} />}
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.sheetTitle}>{selectedTask?.equipement.name}</ThemedText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 }}>
                    <IcoZone size={11} color={C.slate400} />
                    <ThemedText style={styles.sheetMeta}>{selectedTask?.zone?.name ?? 'Sans zone'}</ThemedText>
                    <View style={[styles.sheetFreqBadge]}>
                      <ThemedText style={styles.sheetFreqText}>{selectedTask?.equipement.frequency}</ThemedText>
                    </View>
                  </View>
                </View>
                <TouchableOpacity style={styles.sheetClose} onPress={closeTask}>
                  <IcoClose size={16} color={C.slate500} />
                </TouchableOpacity>
              </View>

              {/* Note input */}
              <View style={styles.sheetBody}>
                <ThemedText style={styles.sheetLabel}>OBSERVATION / VISA</ThemedText>
                <TextInput
                  style={styles.sheetInput}
                  value={noteDraft}
                  onChangeText={setNoteDraft}
                  placeholder="Ajouter une observation..."
                  placeholderTextColor={C.slate400}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Actions */}
              <View style={styles.sheetFooter}>
                <TouchableOpacity style={styles.sheetCancelBtn} onPress={closeTask}>
                  <ThemedText style={styles.sheetCancelText}>Annuler</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sheetConfirmBtn, selectedTask?.is_completed && styles.sheetConfirmBtnUndo]}
                  onPress={handleToggle}
                  disabled={updatingTaskId === selectedTask?.id}
                  activeOpacity={0.85}
                >
                  {updatingTaskId === selectedTask?.id
                    ? <ActivityIndicator color={C.white} />
                    : <>
                        {selectedTask?.is_completed
                          ? <IcoClose size={16} color={C.white} />
                          : <IcoCheck size={16} color={C.white} />
                        }
                        <ThemedText style={styles.sheetConfirmText}>
                          {selectedTask?.is_completed ? 'Marquer non faite' : 'Valider la tâche'}
                        </ThemedText>
                      </>
                  }
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </SafeAreaProvider>
    </ThemedView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.slate100 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 13, backgroundColor: C.green, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 5 },
  headerIconBtn: { width: 34, height: 34, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '800', color: C.white, letterSpacing: -0.2 },
  headerSub: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.65)', letterSpacing: 0.8, marginTop: 1 },

  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 12, gap: 10 },

  // Summary card
  summaryCard: { backgroundColor: C.white, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.slate200 },
  summaryTop: { marginBottom: 12 },
  summaryTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  summaryAccent: { width: 4, height: 16, borderRadius: 2, backgroundColor: C.green },
  summaryTitle: { flex: 1, fontSize: 13, fontWeight: '800', color: C.greenDark },
  summaryDate: { fontSize: 11, color: C.slate400, fontWeight: '500', textTransform: 'capitalize' },
  progressTrack: { height: 5, backgroundColor: C.slate100, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: C.green, borderRadius: 3 },
  statsRow: { flexDirection: 'row', gap: 8 },

  // Feedback
  feedback: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, padding: 10, borderWidth: 1 },
  feedbackOk:  { backgroundColor: C.greenBg, borderColor: C.greenBd },
  feedbackErr: { backgroundColor: C.redBg,   borderColor: C.redBd },
  feedbackText: { flex: 1, fontSize: 12, fontWeight: '700' },

  // Split layout
  split: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },

  // Zones pane
  zonesPane: { backgroundColor: C.white, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.slate200, maxHeight: 380 },
  zonesPaneTitle: { fontSize: 10, fontWeight: '800', color: C.slate400, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  zoneItem: { paddingHorizontal: 10, paddingVertical: 10, borderRadius: 8, backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200, flexDirection: 'row', alignItems: 'center', gap: 6 },
  zoneItemActive: { backgroundColor: C.green, borderColor: C.greenDark },
  zoneActiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.white },
  zoneItemText: { fontSize: 11, fontWeight: '700', color: C.slate600, flex: 1 },
  zoneItemTextActive: { color: C.white },

  // Tasks pane
  tasksPane: { flex: 1, gap: 10 },
  filterRow: { flexDirection: 'row', gap: 6 },
  filterChip: { flex: 1, paddingVertical: 7, paddingHorizontal: 4, borderRadius: 8, backgroundColor: C.white, borderWidth: 1, borderColor: C.slate200, alignItems: 'center' },
  filterChipActive: { backgroundColor: C.green, borderColor: C.greenDark },
  filterChipText: { fontSize: 10, fontWeight: '800', color: C.slate500, textAlign: 'center' },
  filterChipTextActive: { color: C.white },

  // Section card
  sectionCard: { backgroundColor: C.white, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.slate200 },
  sectionCardDanger: { borderColor: C.redBd, backgroundColor: C.redBg },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: C.green, paddingLeft: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: C.greenDark },
  emptyText: { fontSize: 12, color: C.slate400, fontWeight: '500', paddingVertical: 4 },

  // Task card
  taskCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.slate50, borderRadius: 10, marginBottom: 6, overflow: 'hidden', borderWidth: 1, borderColor: C.slate200 },
  taskCardDone: { backgroundColor: C.greenBg, borderColor: C.greenBd },
  taskCardReadonly: { opacity: 0.75 },
  taskAccent: { width: 4, alignSelf: 'stretch' },
  taskIconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  taskBody: { flex: 1, paddingVertical: 8 },
  taskTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  taskName: { fontSize: 12, fontWeight: '800', color: C.slate800, flex: 1 },
  taskNameDone: { color: C.green },
  freqBadge: { backgroundColor: C.tealBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  freqBadgeDone: { backgroundColor: C.greenBg },
  freqText: { fontSize: 8, fontWeight: '800', color: C.teal, textTransform: 'uppercase', letterSpacing: 0.5 },
  freqTextDone: { color: C.green },
  taskMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  taskMeta: { fontSize: 10, color: C.slate400, fontWeight: '500' },
  taskNoteRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  taskNote: { fontSize: 10, color: C.slate400, fontStyle: 'italic', flex: 1 },
  taskRight: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingRight: 10 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },

  // Calendar
  calHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  calNav: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  calNavBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.greenBg, borderWidth: 1, borderColor: C.greenBd, alignItems: 'center', justifyContent: 'center' },
  calMonthLabel: { fontSize: 11, fontWeight: '800', color: C.greenDark, minWidth: 96, textAlign: 'center', textTransform: 'capitalize' },
  calLegend: { flexDirection: 'row', gap: 14, marginBottom: 10 },
  calLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  calLegendDot: { width: 8, height: 8, borderRadius: 4 },
  calLegendText: { fontSize: 10, color: C.slate500, fontWeight: '600' },
  calWeekRow: { flexDirection: 'row', marginBottom: 6 },
  calWeekDay: { flex: 1, textAlign: 'center', fontSize: 9, fontWeight: '800', color: C.slate400, textTransform: 'uppercase' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: '14.28%', aspectRatio: 1, borderRadius: 6, borderWidth: 1, borderColor: C.slate200, backgroundColor: C.slate50, alignItems: 'center', justifyContent: 'center', marginBottom: 4, padding: 1 },
  calCellMuted: { opacity: 0.3 },
  calCellToday: { borderColor: C.green, backgroundColor: C.greenBg, borderWidth: 1.5 },
  calCellSelected: { borderColor: C.greenDark, backgroundColor: '#D1FAE5', borderWidth: 2 },
  calCellOverdue: { borderColor: C.redBd, backgroundColor: C.redBg },
  calDayNum: { fontSize: 11, fontWeight: '700', color: C.slate700 },
  calDayNumMuted: { color: C.slate300 },
  calDayNumToday: { color: C.greenDark, fontWeight: '900' },
  calDayNumSelected: { color: C.greenDark },
  calDotWrap: { position: 'absolute', bottom: 2, right: 2, backgroundColor: C.greenBg, borderRadius: 4, paddingHorizontal: 2 },
  calDotWrapOverdue: { backgroundColor: C.redBg },
  calCount: { fontSize: 8, fontWeight: '900', color: C.greenDark },
  calCountOverdue: { color: C.red },

  // Side panel (calendar)
  panelOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  panel: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', paddingBottom: 24 },
  panelHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.slate200, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  panelHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.slate100 },
  panelTitle: { fontSize: 16, fontWeight: '800', color: C.slate900 },
  panelSubtitle: { fontSize: 12, color: C.slate400, marginTop: 2, textTransform: 'capitalize' },
  panelClose: { width: 30, height: 30, borderRadius: 8, backgroundColor: C.slate100, alignItems: 'center', justifyContent: 'center' },
  panelStats: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  panelStatChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },

  // Task action sheet
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: Platform.OS === 'ios' ? 36 : 24 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.slate200, alignSelf: 'center', marginTop: 12 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.slate100 },
  sheetIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: C.slate900 },
  sheetMeta: { fontSize: 12, color: C.slate400, fontWeight: '500' },
  sheetFreqBadge: { backgroundColor: C.tealBg, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  sheetFreqText: { fontSize: 9, fontWeight: '800', color: C.teal, textTransform: 'uppercase' },
  sheetClose: { width: 30, height: 30, borderRadius: 8, backgroundColor: C.slate100, alignItems: 'center', justifyContent: 'center' },
  sheetBody: { paddingHorizontal: 20, paddingTop: 16 },
  sheetLabel: { fontSize: 10, fontWeight: '800', color: C.slate400, letterSpacing: 0.8, marginBottom: 8 },
  sheetInput: { backgroundColor: C.slate50, borderWidth: 1.5, borderColor: C.slate200, borderRadius: 12, padding: 12, fontSize: 14, color: C.slate800, minHeight: 80 },
  sheetFooter: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 16 },
  sheetCancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200 },
  sheetCancelText: { fontSize: 14, fontWeight: '700', color: C.slate500 },
  sheetConfirmBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.green, borderRadius: 12, paddingVertical: 14, shadowColor: C.green, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  sheetConfirmBtnUndo: { backgroundColor: C.amber },
  sheetConfirmText: { color: C.white, fontSize: 15, fontWeight: '800' },
});

// platform import needed for footer padding
import { Platform } from 'react-native';