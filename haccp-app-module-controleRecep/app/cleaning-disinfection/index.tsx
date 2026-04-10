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
import { IconSymbol } from '../../components/ui/icon-symbol';
import { getErrorDetails } from '../../utils/error';

const C = {
  bg: '#F0F4F8',
  surface: '#FFFFFF',
  surfaceAlt: '#F7FAFB',
  border: '#D6E4ED',
  blue: '#1E6FB5',
  blueLight: '#DBEAFE',
  blueDark: '#1E40AF',
  teal: '#00B8A0',
  tealLight: '#CCFBF1',
  tealDark: '#0F766E',
  green: '#2DB34A',
  greenLight: '#DCFCE7',
  greenDark: '#1F8A39',
  amber: '#D97706',
  amberLight: '#FEF3C7',
  red: '#DC2626',
  redLight: '#FEE2E2',
  ink: '#0D1B2A',
  inkMuted: '#6B7280',
  inkFaint: '#9CA3AF',
  white: '#FFFFFF',
};

type FeedbackState = { type: 'success' | 'error'; message: string } | null;

const formatPanelDateLabel = (dateString: string) =>
  new Date(`${dateString}T00:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const formatDateParam = (date: Date) => {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const patchTask = (
  tasks: NettDesiTask[],
  taskId: number,
  payload: Pick<NettDesiTask, 'is_completed' | 'notes' | 'completed_at'>
) =>
  tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          ...payload,
        }
      : task
  );

export default function CleaningDisinfectionScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [referenceDate] = useState(() => new Date());
  const todayKey = formatDateParam(referenceDate);
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1)
  );
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'done' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);
  const [data, setData] = useState<NettDesiTasksResponse | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [selectedTask, setSelectedTask] = useState<NettDesiTask | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  useEffect(() => {
    void loadTasks();
  }, []);

  const zoneOptions = useMemo(() => {
    const zones = new Set<string>();
    (data?.tasks ?? []).forEach((task) => {
      zones.add(task.zone?.name ?? 'Sans zone');
    });
    return ['all', ...Array.from(zones).sort((a, b) => a.localeCompare(b, 'fr'))];
  }, [data]);

  const zoneFilteredTasks = useMemo(() => {
    let tasks = data?.tasks ?? [];

    if (selectedZone !== 'all') {
      tasks = tasks.filter((task) => (task.zone?.name ?? 'Sans zone') === selectedZone);
    }

    return tasks;
  }, [data, selectedZone]);

  const applyStatusFilter = (tasks: NettDesiTask[]) => {
    if (statusFilter === 'pending') {
      return tasks.filter((task) => !task.is_completed);
    }
    if (statusFilter === 'done') {
      return tasks.filter((task) => task.is_completed);
    }
    return tasks;
  };

  const todayTasks = useMemo(
    () => applyStatusFilter(zoneFilteredTasks.filter((task) => task.is_today)),
    [zoneFilteredTasks, statusFilter]
  );
  const todayTasksAllStatuses = useMemo(
    () => zoneFilteredTasks.filter((task) => task.is_today),
    [zoneFilteredTasks]
  );
  const overdueTasks = useMemo(
    () => applyStatusFilter(
      zoneFilteredTasks.filter(
        (task) => !task.is_today && !task.is_completed && task.scheduled_date < todayKey
      )
    ),
    [zoneFilteredTasks, todayKey, statusFilter]
  );
  const visibleMainTasksBase = useMemo(
    () =>
      zoneFilteredTasks.filter(
        (task) => task.is_today || (!task.is_today && !task.is_completed && task.scheduled_date < todayKey)
      ),
    [zoneFilteredTasks, todayKey]
  );

  const taskCountByDate = useMemo(
    () =>
      applyStatusFilter(zoneFilteredTasks).reduce<Record<string, number>>((acc, task) => {
        acc[task.scheduled_date] = (acc[task.scheduled_date] ?? 0) + 1;
        return acc;
      }, {}),
    [zoneFilteredTasks, statusFilter]
  );
  const overdueCountByDate = useMemo(
    () =>
      zoneFilteredTasks.reduce<Record<string, number>>((acc, task) => {
        if (!task.is_completed && task.scheduled_date < todayKey) {
          acc[task.scheduled_date] = (acc[task.scheduled_date] ?? 0) + 1;
        }
        return acc;
      }, {}),
    [zoneFilteredTasks, todayKey]
  );
  const tasksByDate = useMemo(
    () =>
      applyStatusFilter(zoneFilteredTasks).reduce<Record<string, NettDesiTask[]>>((acc, task) => {
        if (!acc[task.scheduled_date]) {
          acc[task.scheduled_date] = [];
        }
        acc[task.scheduled_date].push(task);
        return acc;
      }, {}),
    [zoneFilteredTasks, statusFilter]
  );
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    months.add(formatDateParam(referenceDate).slice(0, 7));
    applyStatusFilter(zoneFilteredTasks).forEach((task) => months.add(task.scheduled_date.slice(0, 7)));
    return Array.from(months).sort();
  }, [zoneFilteredTasks, referenceDate, statusFilter]);
  const calendarMonthKey = formatDateParam(calendarMonth).slice(0, 7);
  const canGoPrevMonth = availableMonths.some((month) => month < calendarMonthKey);
  const canGoNextMonth = availableMonths.some((month) => month > calendarMonthKey);
  const zonePaneWidth = width < 420 ? 132 : 156;
  const calendarDays = useMemo(() => {
    const first = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const last = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
    const firstWeekday = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - firstWeekday);
    const todayKey = formatDateParam(referenceDate);
    const lastWeekday = (last.getDay() + 6) % 7;
    const totalCells = firstWeekday + last.getDate() + (6 - lastWeekday);

    return Array.from({ length: totalCells }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = formatDateParam(date);
      return {
        key,
        day: date.getDate(),
        inMonth: date.getMonth() === calendarMonth.getMonth(),
        isToday: key === todayKey,
        count: taskCountByDate[key] ?? 0,
        overdueCount: overdueCountByDate[key] ?? 0,
      };
    });
  }, [calendarMonth, referenceDate, taskCountByDate, overdueCountByDate, todayKey]);
  const monthLabel = calendarMonth.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });
  const calendarPanelTasks = selectedCalendarDate ? tasksByDate[selectedCalendarDate] ?? [] : [];

  const completedTodayCount = todayTasksAllStatuses.filter((task) => task.is_completed).length;
  const pendingTodayCount = todayTasksAllStatuses.filter((task) => !task.is_completed).length;
  const overdueCount = zoneFilteredTasks.filter(
    (task) => !task.is_today && !task.is_completed && task.scheduled_date < todayKey
  ).length;
  const pendingFilterCount = visibleMainTasksBase.filter((task) => !task.is_completed).length;
  const doneFilterCount = visibleMainTasksBase.filter((task) => task.is_completed).length;
  const allFilterCount = visibleMainTasksBase.length;
  const panelPendingCount = calendarPanelTasks.filter((task) => !task.is_completed).length;
  const panelDoneCount = calendarPanelTasks.filter((task) => task.is_completed).length;
  const panelAllCount = calendarPanelTasks.length;

  const loadTasks = async (mode: 'initial' | 'refresh' = 'initial') => {
    try {
      if (mode === 'initial') {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const response = await nettDesiApi.getTasks(formatDateParam(referenceDate));
      setData(response);
    } catch (error) {
      const { title, message } = getErrorDetails(
        error,
        'Chargement impossible',
        'Impossible de charger les taches.'
      );
      setFeedback({ type: 'error', message });
      if (mode === 'initial') {
        Alert.alert(title, message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openTaskModal = (task: NettDesiTask) => {
    setSelectedTask(task);
    setNoteDraft(task.notes ?? '');
  };

  const closeTaskModal = () => {
    setSelectedTask(null);
    setNoteDraft('');
  };

  const handleToggleStatus = async () => {
    if (!selectedTask) {
      return;
    }

    try {
      setUpdatingTaskId(selectedTask.id);
      const response = await nettDesiApi.updateTaskStatus(selectedTask.id, {
        is_completed: !selectedTask.is_completed,
        notes: noteDraft.trim() ? noteDraft.trim() : null,
      });

      setData((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          tasks: patchTask(current.tasks, selectedTask.id, {
            is_completed: response.task.is_completed,
            notes: response.task.notes,
            completed_at: response.task.completed_at,
          }),
        };
      });

      setFeedback({
        type: 'success',
        message: response.message || 'Statut mis a jour.',
      });
      closeTaskModal();
    } catch (error) {
      const { message } = getErrorDetails(
        error,
        'Mise a jour impossible',
        'Le statut n a pas pu etre mis a jour.'
      );
      setFeedback({ type: 'error', message });
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const renderTaskCard = (task: NettDesiTask) => {
    const isUpdating = updatingTaskId === task.id;
    const isEditable =
      task.is_today === true || (!task.is_completed && task.scheduled_date < todayKey);
    const zoneLabel = task.zone?.name ?? 'Sans zone';

    return (
      <TouchableOpacity
        key={task.id}
        style={[
          styles.taskCard,
          task.is_completed && styles.taskCardDone,
          !isEditable && styles.taskCardReadonly,
        ]}
        onPress={() => isEditable && openTaskModal(task)}
        disabled={isUpdating || !isEditable}
        activeOpacity={isEditable ? 0.8 : 1}>
        <View
          style={[
            styles.taskIcon,
            { backgroundColor: task.is_completed ? C.greenLight : C.tealLight },
          ]}>
          <IconSymbol
            name={task.is_completed ? 'checkmark' : 'recycle'}
            size={14}
            color={task.is_completed ? C.green : C.tealDark}
          />
        </View>

        <View style={styles.taskContent}>
          <View style={styles.taskTopRow}>
            <ThemedText style={styles.taskName} numberOfLines={1}>
              {task.equipement.name}
            </ThemedText>
            <ThemedText style={styles.taskFrequency}>{task.equipement.frequency}</ThemedText>
          </View>
          <ThemedText style={styles.taskMeta} numberOfLines={1}>
            {zoneLabel}
          </ThemedText>
          {task.notes ? <ThemedText style={styles.taskNote}>{task.notes}</ThemedText> : null}
        </View>

        <View style={styles.taskRight}>
          {isUpdating ? (
            <ActivityIndicator size="small" color={C.teal} />
          ) : (
            <>
              <ThemedText
                style={[styles.taskState, task.is_completed && styles.taskStateDone]}>
                {isEditable ? (task.is_completed ? 'Fait' : 'A faire') : 'Lecture'}
              </ThemedText>
              <IconSymbol
                name={isEditable ? 'chevron.right' : 'calendar'}
                size={14}
                color={C.inkFaint}
              />
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaProvider style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <IconSymbol name="chevron.left" size={18} color={C.white} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <ThemedText style={styles.headerTitle}>Nettoyage & Désinfection</ThemedText>
            <ThemedText style={styles.headerSubtitle}>TACHES  </ThemedText>
          </View>
          <TouchableOpacity
            onPress={() => loadTasks('refresh')}
            style={styles.refreshBtn}
            disabled={refreshing || loading}>
            {refreshing || loading ? (
              <ActivityIndicator size="small" color={C.white} />
            ) : (
              <IconSymbol name="recycle" size={16} color={C.white} />
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={C.teal} />
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadTasks('refresh')}
                tintColor={C.teal}
              />
            }>
            <View style={styles.summaryCard}>
              <ThemedText style={styles.summaryLabel}>Aujourd&apos;hui</ThemedText>
              <View style={styles.summaryStats}>
                <View style={styles.summaryStat}>
                  <ThemedText style={styles.summaryValue}>{todayTasksAllStatuses.length}</ThemedText>
                  <ThemedText style={styles.summaryCaption}>Total</ThemedText>
                </View>
                <View style={styles.summaryStat}>
                  <ThemedText style={[styles.summaryValue, { color: C.green }]}>
                    {completedTodayCount}
                  </ThemedText>
                  <ThemedText style={styles.summaryCaption}>Faites</ThemedText>
                </View>
                <View style={styles.summaryStat}>
                  <ThemedText style={[styles.summaryValue, { color: C.amber }]}>
                    {pendingTodayCount}
                  </ThemedText>
                  <ThemedText style={styles.summaryCaption}>Restantes</ThemedText>
                </View>
                <View style={styles.summaryStat}>
                  <ThemedText style={[styles.summaryValue, { color: C.red }]}>
                    {overdueCount}
                  </ThemedText>
                  <ThemedText style={styles.summaryCaption}>En retard</ThemedText>
                </View>
              </View>
            </View>

            {feedback ? (
              <View
                style={[
                  styles.feedbackBanner,
                  feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError,
                ]}>
                <ThemedText style={styles.feedbackText}>{feedback.message}</ThemedText>
              </View>
            ) : null}

            <View style={styles.splitLayout}>
              <View style={[styles.zonesPane, { width: zonePaneWidth }]}>
                <ThemedText style={styles.zonesTitle}>Zones</ThemedText>
                <ScrollView
                  style={styles.zonesScroll}
                  contentContainerStyle={styles.zonesList}
                  showsVerticalScrollIndicator={false}>
                  {zoneOptions.map((zone) => {
                    const isActive = zone === selectedZone;
                    const label = zone === 'all' ? 'Toutes' : zone;

                    return (
                      <TouchableOpacity
                        key={zone}
                        style={[styles.zoneItem, isActive && styles.zoneItemActive]}
                        onPress={() => setSelectedZone(zone)}>
                        <ThemedText
                          style={[styles.zoneItemText, isActive && styles.zoneItemTextActive]}
                          numberOfLines={3}>
                          {label}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.tasksPane}>
                <View style={styles.statusFilterRow}>
                  <TouchableOpacity
                    style={[
                      styles.statusFilterChip,
                      statusFilter === 'pending' && styles.statusFilterChipActive,
                    ]}
                    onPress={() => setStatusFilter('pending')}>
                    <ThemedText
                      style={[
                        styles.statusFilterText,
                        statusFilter === 'pending' && styles.statusFilterTextActive,
                      ]}>
                      {pendingFilterCount} A faire
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusFilterChip,
                      statusFilter === 'done' && styles.statusFilterChipActive,
                    ]}
                    onPress={() => setStatusFilter('done')}>
                    <ThemedText
                      style={[
                        styles.statusFilterText,
                        statusFilter === 'done' && styles.statusFilterTextActive,
                      ]}>
                      {doneFilterCount} Fait
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusFilterChip,
                      statusFilter === 'all' && styles.statusFilterChipActive,
                    ]}
                    onPress={() => setStatusFilter('all')}>
                    <ThemedText
                      style={[
                        styles.statusFilterText,
                        statusFilter === 'all' && styles.statusFilterTextActive,
                      ]}>
                      {allFilterCount} Tous
                    </ThemedText>
                  </TouchableOpacity>
                </View>

                <View style={styles.sectionCard}>
                  <ThemedText style={styles.sectionTitle}>Taches du jour</ThemedText>
                  {todayTasks.length === 0 ? (
                    <ThemedText style={styles.emptyText}>Aucune tache marquee `is_today`.</ThemedText>
                  ) : (
                    todayTasks.map(renderTaskCard)
                  )}
                </View>

                <View style={[styles.sectionCard, styles.overdueSectionCard]}>
                  <ThemedText style={[styles.sectionTitle, styles.overdueSectionTitle]}>
                    Taches en retard
                  </ThemedText>
                  {overdueTasks.length === 0 ? (
                    <ThemedText style={styles.emptyText}>Aucune tache en retard.</ThemedText>
                  ) : (
                    overdueTasks.map(renderTaskCard)
                  )}
                </View>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.calendarHeader}>
                <ThemedText style={styles.sectionTitle}>Calendrier</ThemedText>
                <View style={styles.calendarNav}>
                  <TouchableOpacity
                    style={[styles.calendarNavBtn, !canGoPrevMonth && styles.calendarNavBtnDisabled]}
                    onPress={() =>
                      canGoPrevMonth &&
                      setCalendarMonth(
                        new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
                      )
                    }
                    disabled={!canGoPrevMonth}>
                    <IconSymbol
                      name="chevron.left"
                      size={14}
                      color={canGoPrevMonth ? C.teal : C.inkFaint}
                    />
                  </TouchableOpacity>
                  <ThemedText style={styles.calendarMonthLabel}>{monthLabel}</ThemedText>
                  <TouchableOpacity
                    style={[styles.calendarNavBtn, !canGoNextMonth && styles.calendarNavBtnDisabled]}
                    onPress={() =>
                      canGoNextMonth &&
                      setCalendarMonth(
                        new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
                      )
                    }
                    disabled={!canGoNextMonth}>
                    <IconSymbol
                      name="chevron.right"
                      size={14}
                      color={canGoNextMonth ? C.teal : C.inkFaint}
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.calendarLegend}>
                <View style={styles.calendarLegendItem}>
                  <View style={styles.calendarLegendDot} />
                  <ThemedText style={styles.calendarLegendText}>Planifie</ThemedText>
                </View>
                <View style={styles.calendarLegendItem}>
                  <View
                    style={[styles.calendarLegendDot, styles.calendarLegendDotOverdue]}
                  />
                  <ThemedText style={styles.calendarLegendText}>En retard</ThemedText>
                </View>
              </View>
              <View style={styles.weekHeader}>
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((label, index) => (
                  <ThemedText style={styles.weekHeaderText} key={`${label}-${index}`}>
                    {label}
                  </ThemedText>
                ))}
              </View>
              <View style={styles.calendarGrid}>
                {calendarDays.map((day) => (
                  <TouchableOpacity
                    key={day.key}
                    style={[
                      styles.calendarCell,
                      !day.inMonth && styles.calendarCellMuted,
                      day.isToday && styles.calendarCellToday,
                      day.key === selectedCalendarDate && styles.calendarCellSelected,
                    ]}
                    onPress={() => day.count > 0 && setSelectedCalendarDate(day.key)}
                    disabled={day.count === 0}
                    activeOpacity={0.8}>
                    <ThemedText
                      style={[
                        styles.calendarDayText,
                        !day.inMonth && styles.calendarDayTextMuted,
                        day.isToday && styles.calendarDayTextToday,
                        day.key === selectedCalendarDate && styles.calendarDayTextSelected,
                      ]}>
                      {day.day}
                    </ThemedText>
                    {day.count > 0 ? (
                      <View
                        style={[
                          styles.calendarCountBadge,
                          day.overdueCount > 0 && styles.calendarCountBadgeOverdue,
                        ]}>
                        <ThemedText
                          style={[
                            styles.calendarCountText,
                            day.overdueCount > 0 && styles.calendarCountTextOverdue,
                          ]}>
                          {day.overdueCount > 0 ? `${day.count}/${day.overdueCount}` : day.count}
                        </ThemedText>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>


            </View>
          </ScrollView>
        )}

        <Modal
          visible={selectedCalendarDate !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedCalendarDate(null)}>
          <View style={styles.sidePanelOverlay}>
            <TouchableOpacity
              style={styles.sidePanelBackdrop}
              activeOpacity={1}
              onPress={() => setSelectedCalendarDate(null)}
            />
            <View style={styles.sidePanel}>
              <View style={styles.sidePanelHeader}>
                <View style={styles.sidePanelHeaderText}>
                  <ThemedText style={styles.sidePanelTitle}>Taches planifiees</ThemedText>
                  <ThemedText style={styles.sidePanelSubtitle}>
                    {selectedCalendarDate ? formatPanelDateLabel(selectedCalendarDate) : ''}
                  </ThemedText>
                </View>
                <TouchableOpacity
                  style={styles.sidePanelCloseBtn}
                  onPress={() => setSelectedCalendarDate(null)}>
                  <IconSymbol name="xmark.circle.fill" size={20} color={C.inkFaint} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.sidePanelScroll}
                contentContainerStyle={styles.sidePanelContent}>
                {calendarPanelTasks.length === 0 ? (
                  <ThemedText style={styles.emptyText}>Aucune tache pour cette date.</ThemedText>
                ) : (
                  calendarPanelTasks.map(renderTaskCard)
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal
          visible={selectedTask !== null}
          transparent
          animationType="slide"
          onRequestClose={closeTaskModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalTopBar}>
                <View style={styles.modalTopSpacer} />
                <TouchableOpacity style={styles.modalCloseIconBtn} onPress={closeTaskModal}>
                  <IconSymbol name="xmark.circle.fill" size={24} color={C.inkFaint} />
                </TouchableOpacity>
              </View>

              <ThemedText style={styles.modalTitle}>{selectedTask?.equipement.name}</ThemedText>
              <ThemedText style={styles.modalMeta}>
                {selectedTask?.zone?.name ?? 'Sans zone'}
              </ThemedText>

              <TextInput
                style={styles.noteInput}
                value={noteDraft}
                onChangeText={setNoteDraft}
                placeholder="Ajouter une observation..."
                placeholderTextColor={C.inkFaint}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <View style={styles.modalActionsRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={closeTaskModal}>
                  <ThemedText style={styles.cancelBtnText}>Annuler</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleToggleStatus}
                  disabled={updatingTaskId === selectedTask?.id}>
                  {updatingTaskId === selectedTask?.id ? (
                    <ActivityIndicator color={C.white} />
                  ) : (
                    <ThemedText style={styles.primaryBtnText}>
                      {selectedTask?.is_completed
                        ? 'Non terminee'
                        : 'Valider'}
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaProvider>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.green,
    borderBottomWidth: 0,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 15, fontWeight: '800', color: C.white },
  headerSubtitle: { fontSize: 9, fontWeight: '700', color: '#DBEAFE', letterSpacing: 1.1 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 8, gap: 10 },
  summaryCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 14,
  },
  summaryLabel: { fontSize: 11, fontWeight: '800', color: C.greenDark, marginBottom: 10 },
  summaryStats: { flexDirection: 'row', gap: 8 },
  summaryStat: {
    flex: 1,
    backgroundColor: C.surfaceAlt,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  summaryValue: { fontSize: 20, fontWeight: '900', color: C.greenDark },
  summaryCaption: { fontSize: 9, fontWeight: '700', color: C.inkFaint, marginTop: 2 },
  feedbackBanner: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  feedbackSuccess: { backgroundColor: C.greenLight, borderColor: C.green },
  feedbackError: { backgroundColor: C.redLight, borderColor: C.red },
  feedbackText: { fontSize: 11, fontWeight: '700', color: C.ink },
  splitLayout: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  zonesPane: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  zonesTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: C.inkMuted,
    marginBottom: 10,
  },
  zonesScroll: {
    flex: 1,
  },
  zonesList: {
    gap: 8,
    paddingBottom: 4,
  },
  zoneItem: {
    width: '100%',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 0,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.border,
  },
  zoneItemActive: {
    backgroundColor: C.green,
    borderColor: C.green,
  },
  zoneItemText: {
    fontSize: 11,
    fontWeight: '800',
    color: C.inkMuted,
  },
  zoneItemTextActive: {
    color: C.white,
  },
  tasksPane: {
    flex: 1,
    gap: 10,
  },
  statusFilterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusFilterChip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 0,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.border,
  },
  statusFilterChipActive: {
    backgroundColor: C.green,
    borderColor: C.green,
  },
  statusFilterText: {
    fontSize: 9,
    fontWeight: '800',
    color: C.inkMuted,
  },
  statusFilterTextActive: {
    color: C.white,
  },
  sectionCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 14,
  },
  sectionTitle: { fontSize: 12, fontWeight: '900', color: C.greenDark, marginBottom: 10 },
  overdueSectionCard: {
    borderColor: '#FECACA',
    backgroundColor: '#FFF7F7',
  },
  overdueSectionTitle: {
    color: C.red,
  },
  emptyText: { fontSize: 11, color: C.inkFaint },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  calendarNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarNavBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.greenLight,
  },
  calendarNavBtnDisabled: {
    opacity: 0.45,
  },
  calendarMonthLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: C.greenDark,
    textTransform: 'capitalize',
    minWidth: 96,
    textAlign: 'center',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '800',
    color: C.inkFaint,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarCell: {
    width: '10.6%',
    aspectRatio: 1,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    position: 'relative',
  },
  calendarCellMuted: {
    opacity: 0.35,
  },
  calendarCellToday: {
    borderColor: C.green,
    backgroundColor: C.greenLight,
  },
  calendarCellSelected: {
    borderColor: C.greenDark,
    backgroundColor: '#CFF7D8',
  },
  calendarDayText: {
    fontSize: 11,
    fontWeight: '800',
    color: C.ink,
  },
  calendarDayTextMuted: {
    color: C.inkFaint,
  },
  calendarDayTextToday: {
    color: C.greenDark,
  },
  calendarDayTextSelected: {
    color: C.greenDark,
  },
  calendarCountBadge: {
    position: 'absolute',
    right: 6,
    bottom: 5,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  calendarCountBadgeOverdue: {
    backgroundColor: 'transparent',
  },
  calendarCountText: {
    fontSize: 9,
    fontWeight: '900',
    color: C.greenDark,
    letterSpacing: 0.2,
  },
  calendarCountTextOverdue: {
    color: C.red,
  },
  calendarHint: {
    marginTop: 4,
    fontSize: 10,
    color: C.inkFaint,
  },
  calendarLegend: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  calendarLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calendarLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.green,
  },
  calendarLegendDotOverdue: {
    backgroundColor: C.red,
  },
  calendarLegendText: {
    fontSize: 10,
    color: C.inkMuted,
    fontWeight: '700',
  },
  sidePanelOverlay: {
    flex: 1,
    backgroundColor: 'rgba(13,27,42,0.35)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  sidePanelBackdrop: {
    flex: 1,
  },
  sidePanel: {
    width: '82%',
    maxWidth: 420,
    backgroundColor: C.surface,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    paddingTop: 18,
    paddingHorizontal: 14,
    paddingBottom: 18,
    borderLeftWidth: 1,
    borderColor: C.border,
  },
  sidePanelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  sidePanelHeaderText: {
    flex: 1,
  },
  sidePanelTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: C.ink,
  },
  sidePanelSubtitle: {
    fontSize: 11,
    color: C.inkMuted,
    marginTop: 3,
    textTransform: 'capitalize',
  },
  sidePanelCloseBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidePanelScroll: {
    flex: 1,
  },
  sidePanelContent: {
    paddingBottom: 20,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 10,
    marginBottom: 6,
  },
  taskCardDone: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  taskCardReadonly: {
    opacity: 0.78,
  },
  taskIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskContent: { flex: 1 },
  taskTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskName: { fontSize: 13, fontWeight: '800', color: C.ink },
  taskFrequency: {
    fontSize: 9,
    fontWeight: '800',
    color: C.greenDark,
    textTransform: 'uppercase',
  },
  taskMeta: { fontSize: 9, fontWeight: '600', color: C.inkMuted, marginTop: 1 },
  taskNote: { fontSize: 9, color: C.inkMuted, marginTop: 2 },
  taskRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  taskState: { fontSize: 9, fontWeight: '800', color: C.greenDark },
  taskStateDone: { color: C.green },
  modalOverlay: {
    flex: 1,
    backgroundColor: C.surface,
  },
  modalSheet: {
    backgroundColor: C.surface,
    flex: 1,
    padding: 16,
    paddingTop: 22,
    paddingBottom: 18,
  },
  modalTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTopSpacer: {
    width: 24,
    height: 24,
  },
  modalCloseIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.border,
  },
  modalTitle: { fontSize: 15, fontWeight: '900', color: C.ink },
  modalMeta: { fontSize: 11, color: C.inkMuted, marginTop: 4, marginBottom: 12 },
  noteInput: {
    minHeight: 76,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
    color: C.ink,
    marginBottom: 10,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: C.green,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  primaryBtnText: { color: C.white, fontSize: 13, fontWeight: '800' },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.border,
  },
  cancelBtnText: { fontSize: 12, fontWeight: '700', color: C.inkMuted },
});