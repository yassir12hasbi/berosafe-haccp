import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  ActivityIndicator, 
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  FlatList
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { BeroColors } from '../../constants/theme';
import traceabilityApi, { 
  TraceabilityBatch, 
  Product, 
  TraceabilityInitialData 
} from '../../api/traceability';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getErrorDetails } from '../../utils/error';

const COLUMN_WIDTH = 50;
const LEFT_COL_WIDTH = 140;

const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DAYS_SHORT = ["D","L","M","M","J","V","S"];

export default function TraceabilityGanttScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TraceabilityInitialData | null>(null);
  const [batches, setBatches] = useState<TraceabilityBatch[]>([]);
  
  // Date selection for the view (month/year)
  const [viewDate, setViewDate] = useState(new Date());
  
  // Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<TraceabilityBatch | null>(null);
  const [isGlobalCreate, setIsGlobalCreate] = useState(false);
  
  // Form State
  const [lotNumber, setLotNumber] = useState('');
  const [zone, setZone] = useState('');
  const [openedAt, setOpenedAt] = useState(new Date());
  const [expiresAt, setExpiresAt] = useState(new Date());
  const [status, setStatus] = useState<'active' | 'closed'>('active');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateMode, setDateMode] = useState<'opened_at' | 'expires_at'>('opened_at');

  const horizontalScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const res = await traceabilityApi.getInitialData();
      setData(res);
      if (res.categories.length > 0) {
        setSelectedCategoryId(null); // Default to all categories
      }
    } catch (error) {
      const { title, message } = getErrorDetails(error, 'Chargement impossible', 'Impossible de charger les produits.');
      console.error('Fetch Initial Data Error:', message);
      Alert.alert(title, message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = useCallback(async () => {
    try {
      const month = viewDate.getMonth() + 1;
      const year = viewDate.getFullYear();
      const res = await traceabilityApi.getBatches(month, year);
      setBatches(res);
    } catch (error) {
      const { message } = getErrorDetails(error, 'Chargement impossible', 'Impossible de charger les lots.');
      console.error('Fetch Batches Error:', message);
      Alert.alert('Chargement impossible', message);
    }
  }, [viewDate]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const calculateExpiresAt = (openDate: Date, maxDlc: number) => {
    const d = new Date(openDate);
    d.setDate(d.getDate() + maxDlc);
    return d;
  };

  const openCreateModal = (product: Product | null, initialDate?: string) => {
    setSelectedProduct(product);
    setIsGlobalCreate(product === null);
    setModalType('create');
    setLotNumber('');
    setZone('');
    const openDate = initialDate ? new Date(initialDate) : new Date();
    setOpenedAt(openDate);
    if (product) {
       setExpiresAt(calculateExpiresAt(openDate, product.max_dlc || 3));
    } else {
       setExpiresAt(calculateExpiresAt(openDate, 3));
    }
    setIsModalOpen(true);
  };

  const openEditModal = (batch: TraceabilityBatch, product: Product) => {
    setSelectedProduct(product);
    setSelectedBatch(batch);
    setIsGlobalCreate(false);
    setModalType('edit');
    setLotNumber(batch.lot_number);
    setZone(batch.zone || '');
    setOpenedAt(new Date(batch.opened_at));
    setExpiresAt(new Date(batch.expires_at));
    setStatus(batch.status);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedProduct || !lotNumber) {
      Alert.alert('Champs requis', 'Veuillez renseigner le numéro de lot.');
      return;
    }

    try {
      if (modalType === 'create') {
        await traceabilityApi.storeBatch({
          product_id: selectedProduct.id,
          lot_number: lotNumber,
          zone: zone || null,
          opened_at: openedAt.toISOString().split('T')[0],
        });
      } else if (selectedBatch) {
        await traceabilityApi.updateBatch(selectedBatch.id, {
          lot_number: lotNumber,
          zone: zone || null,
          expires_at: expiresAt.toISOString().split('T')[0],
          status: status,
        });
      }
      setIsModalOpen(false);
      fetchBatches();
    } catch (error) {
      const { title, message } = getErrorDetails(error, 'Enregistrement impossible', "Echec de l'enregistrement.");
      console.error('Save Error:', message);
      Alert.alert(title, message);
    }
  };

  const handleDelete = () => {
    if (!selectedBatch) return;
    Alert.alert(
      'Supprimer ce lot ?',
      'Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive', 
          onPress: async () => {
            await traceabilityApi.deleteBatch(selectedBatch.id);
            setIsModalOpen(false);
            fetchBatches();
          } 
        }
      ]
    );
  };

  const filteredProducts = useMemo(() => {
    if (!data) return [];
    return data.products.filter(p => {
      const matchCat = selectedCategoryId === null || p.category_id === selectedCategoryId;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [data, selectedCategoryId, searchQuery]);

  const daysInMonth = useMemo(() => {
    return new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  }, [viewDate]);

  const changeMonth = (delta: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1));
  };

  const getStatusColor = (batch: TraceabilityBatch) => {
    if (batch.status === 'closed') return '#3b82f6'; // Blue
    const expiry = new Date(batch.expires_at);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (expiry < today) return '#ef4444'; // Red
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
    if (diffDays <= 1) return '#f59e0b'; // Amber
    return '#10b981'; // Green
  };

  const renderGanttRow = ({ item: prod, index }: { item: Product, index: number }) => {
    const prodBatches = batches.filter(b => b.product_id === prod.id);

    // Stacking logic for overlapping batches
    let tracks: number[] = [];
    let maxTrack = 0;
    const sortedBatches = [...prodBatches].sort((a, b) => new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime());
    
    const processedBatches = sortedBatches.map(batch => {
      const sDate = new Date(batch.opened_at);
      const eDate = new Date(batch.status === 'closed' && batch.closed_at ? batch.closed_at : batch.expires_at);
      
      let ti = 0;
      while (tracks[ti] !== undefined && tracks[ti] >= sDate.getTime()) ti++;
      tracks[ti] = eDate.getTime();
      if (ti > maxTrack) maxTrack = ti;
      
      return { ...batch, _track: ti };
    });

    const rowHeight = Math.max(60, (maxTrack + 1) * 28 + 12);
    const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getTime();
    const monthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth(), daysInMonth).getTime();

    return (
      <View style={[styles.row, { height: rowHeight }]}>
        {/* Left Column: Product Info */}
        <View style={styles.leftCell}>
          <ThemedText numberOfLines={2} style={styles.productName}>{prod.name}</ThemedText>
          <ThemedText style={styles.productDlcLabel}>DLC: {prod.max_dlc || 3}j</ThemedText>
        </View>

        {/* Right Area: Grid + Bars */}
        <View style={[styles.gridArea, { width: daysInMonth * COLUMN_WIDTH }]}>
          {/* Background Grid Cells */}
          <View style={styles.cellsContainer}>
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), i + 1);
              const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
              const dateStr = `${viewDate.getFullYear()}-${(viewDate.getMonth() + 1).toString().padStart(2, '0')}-${(i + 1).toString().padStart(2, '0')}`;
              
              return (
                <TouchableOpacity 
                  key={i} 
                  style={[styles.cell, isWeekend && styles.weekendCell]} 
                  onPress={() => openCreateModal(prod, dateStr)}
                />
              );
            })}
          </View>

          {/* Batch Bars Animation logic can be added here */}
          {processedBatches.map(batch => {
            const oDate = new Date(batch.opened_at);
            const statusDateStr = batch.status === 'closed' && batch.closed_at ? batch.closed_at : batch.expires_at;
            const cDate = new Date(statusDateStr);

            // Clip to current month
            if (cDate.getTime() < monthStart || oDate.getTime() > monthEnd) return null;

            const startDay = oDate.getTime() < monthStart ? 1 : oDate.getDate();
            const endDay = cDate.getTime() > monthEnd ? daysInMonth : cDate.getDate();
            const span = Math.max(endDay - startDay + 1, 0.8);

            const left = (startDay - 1) * COLUMN_WIDTH;
            const barWidth = span * COLUMN_WIDTH - 4; // Minus small gap
            const top = 8 + (batch._track * 26);

            return (
              <TouchableOpacity
                key={batch.id}
                style={[
                  styles.batchBar, 
                  { left, width: barWidth, top, backgroundColor: getStatusColor(batch) }
                ]}
                onPress={() => openEditModal(batch, prod)}
              >
                <ThemedText style={styles.batchBarText} numberOfLines={1}>{batch.lot_number}</ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        title: 'Planning DLC',
        headerShown: true,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
            <IconSymbol name="chevron.left" size={24} color={BeroColors.blue} />
          </TouchableOpacity>
        )
      }} />

      {/* Top Controls */}
      <View style={styles.topBar}>
        {/* Month Navigation */}
        <View style={styles.monthNav}>
           <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
             <IconSymbol name="chevron.left" size={20} color={BeroColors.blue} />
           </TouchableOpacity>
           <ThemedText style={styles.monthTitle}>{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</ThemedText>
           <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
             <IconSymbol name="chevron.right" size={20} color={BeroColors.blue} />
           </TouchableOpacity>
           
           {/* Global "+" Button */}
           <TouchableOpacity 
             onPress={() => openCreateModal(null)} 
             style={styles.addGlobalBtn}
           >
              <IconSymbol name="plus.circle.fill" size={24} color="#fff" />
              <ThemedText style={styles.addGlobalText}>Lot</ThemedText>
           </TouchableOpacity>
        </View>

        {/* Category Tabs */}
        <View style={styles.categoryBar}>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
              <TouchableOpacity 
                style={[styles.catTab, selectedCategoryId === null && styles.activeCatTab]}
                onPress={() => setSelectedCategoryId(null)}
              >
                <ThemedText style={[styles.catTabText, selectedCategoryId === null && styles.activeCatTabText]}>Tous</ThemedText>
              </TouchableOpacity>
              {data?.categories.map(cat => (
                <TouchableOpacity 
                  key={cat.id} 
                  style={[styles.catTab, selectedCategoryId === cat.id && styles.activeCatTab]}
                  onPress={() => setSelectedCategoryId(cat.id)}
                >
                  <ThemedText style={[styles.catTabText, selectedCategoryId === cat.id && styles.activeCatTabText]}>{cat.name}</ThemedText>
                </TouchableOpacity>
              ))}
           </ScrollView>
        </View>

        {/* Dedicated Search Row */}
        <View style={styles.searchRow}>
           <View style={styles.searchContainer}>
             <IconSymbol name="magnifyingglass" size={18} color="#94a3b8" />
             <TextInput 
                style={styles.searchInput}
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChangeText={setSearchQuery}
             />
             {searchQuery.length > 0 && (
               <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <IconSymbol name="xmark.circle.fill" size={18} color="#cbd5e1" />
               </TouchableOpacity>
             )}
           </View>
        </View>
      </View>

      {/* Gantt View Container */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BeroColors.blue} />
        </View>
      ) : (
        <ScrollView style={styles.vScroll}>
          <ScrollView horizontal style={styles.hScroll} ref={horizontalScrollRef}>
            <View>
              {/* Header Row */}
              <View style={styles.headerRow}>
                <View style={styles.leftHeader}>
                  <ThemedText style={styles.headerLabel}>PRODUITS</ThemedText>
                </View>
                <View style={[styles.daysHeader, { width: daysInMonth * COLUMN_WIDTH }]}>
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), i + 1);
                    const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
                    const isToday = new Date().toDateString() === dayDate.toDateString();
                    
                    return (
                      <View key={i} style={[styles.dayCell, isWeekend && styles.weekendHeader]}>
                         <ThemedText style={[styles.dayNameText, isToday && styles.todayText]}>{DAYS_SHORT[dayDate.getDay()]}</ThemedText>
                         <ThemedText style={[styles.dayNumText, isToday && styles.todayText]}>{i + 1}</ThemedText>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Rows */}
              <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderGanttRow}
                scrollEnabled={false} // Since we are inside a vertical ScrollView
                ListEmptyComponent={
                  <View style={[styles.emptyState, { width: LEFT_COL_WIDTH + daysInMonth * COLUMN_WIDTH }]}>
                    <ThemedText style={styles.emptyText}>Aucun produit correspondant.</ThemedText>
                  </View>
                }
              />
            </View>
          </ScrollView>
        </ScrollView>
      )}

      {/* Modal: Open/Edit Batch (Reusing logic from previous implementation) */}
      <Modal 
        visible={isModalOpen} 
        animationType="slide" 
        transparent 
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                {modalType === 'create' ? 'Ouvrir un Lot' : 'Modifier le Lot'}
              </ThemedText>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <IconSymbol name="xmark.circle.fill" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {isGlobalCreate ? (
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>PRODUIT À OUVRIR</ThemedText>
                  <View style={styles.productPickerContainer}>
                    <ScrollView style={styles.productPickerList} nestedScrollEnabled>
                      {data?.products.map(p => (
                        <TouchableOpacity 
                          key={p.id} 
                          style={[styles.productPickItem, selectedProduct?.id === p.id && styles.productPickItemActive]}
                          onPress={() => {
                            setSelectedProduct(p);
                            setExpiresAt(calculateExpiresAt(openedAt, p.max_dlc || 3));
                          }}
                        >
                          <ThemedText style={[styles.productPickText, selectedProduct?.id === p.id && styles.productPickTextActive]}>
                            {p.name}
                          </ThemedText>
                          {selectedProduct?.id === p.id && <IconSymbol name="checkmark" size={16} color="#fff" />}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              ) : (
                <ThemedText style={styles.productHighlight}>{selectedProduct?.name}</ThemedText>
              )}
              
              <View style={styles.formRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <ThemedText style={styles.label}>N° DE LOT</ThemedText>
                  <TextInput 
                    style={styles.input}
                    placeholder="LOT-123..."
                    value={lotNumber}
                    onChangeText={setLotNumber}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <ThemedText style={styles.label}>POINT / ZONE</ThemedText>
                  <TextInput 
                    style={styles.input}
                    placeholder="Cuisine..."
                    value={zone}
                    onChangeText={setZone}
                  />
                </View>
              </View>

              <View style={styles.highlightGroup}>
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>DATE D&apos;OUVERTURE</ThemedText>
                  <TouchableOpacity style={styles.dateField} onPress={() => { setDateMode('opened_at'); setShowDatePicker(true); }}>
                     <ThemedText style={styles.dateTextLabel}>{openedAt.toLocaleDateString()}</ThemedText>
                     <IconSymbol name="calendar" size={18} color={BeroColors.blue} />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>DLC CALCULÉE (+{selectedProduct?.max_dlc || 3}j)</ThemedText>
                  <TouchableOpacity 
                    style={[styles.dateField, styles.expiryField]} 
                    onPress={() => { setDateMode('expires_at'); setShowDatePicker(true); }}
                  >
                     <ThemedText style={styles.expiryValueText}>{expiresAt.toLocaleDateString()}</ThemedText>
                     <IconSymbol name="calendar" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              {modalType === 'edit' && (
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>STATUT DU LOT</ThemedText>
                  <View style={styles.statusRow}>
                    <TouchableOpacity 
                      style={[styles.statusToggle, status === 'active' && styles.statusToggleActive]}
                      onPress={() => setStatus('active')}
                    >
                      <ThemedText style={status === 'active' && styles.whiteText}>En cours</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.statusToggle, status === 'closed' && styles.statusToggleClosed]}
                      onPress={() => setStatus('closed')}
                    >
                      <ThemedText style={status === 'closed' && styles.whiteText}>Clôturé</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {showDatePicker && (
                <DateTimePicker
                  value={dateMode === 'opened_at' ? openedAt : expiresAt}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (date) {
                      if (dateMode === 'opened_at') {
                         setOpenedAt(date);
                         setExpiresAt(calculateExpiresAt(date, selectedProduct?.max_dlc || 3));
                      } else {
                         setExpiresAt(date);
                      }
                    }
                  }}
                />
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              {modalType === 'edit' && (
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                  <IconSymbol name="trash.fill" size={20} color="#ff4444" />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsModalOpen(false)}>
                <ThemedText style={styles.cancelBtnText}>Annuler</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <ThemedText style={styles.saveBtnText}>
                  {modalType === 'create' ? 'Ouvrir le Lot' : 'Mettre à jour'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  topBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingTop: 8,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: BeroColors.dark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    minWidth: 130,
    textAlign: 'center',
  },
  addGlobalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BeroColors.green,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    marginLeft: 'auto',
  },
  addGlobalText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  categoryBar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  categoryScroll: {
    gap: 8,
  },
  catTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  activeCatTab: {
    backgroundColor: BeroColors.blue,
    borderColor: BeroColors.blue,
  },
  catTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  activeCatTabText: {
    color: '#fff',
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 48,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 14,
    color: BeroColors.dark,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vScroll: {
    flex: 1,
  },
  hScroll: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  leftHeader: {
    width: LEFT_COL_WIDTH,
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    justifyContent: 'center',
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94a3b8',
    letterSpacing: 1,
  },
  daysHeader: {
    flexDirection: 'row',
  },
  dayCell: {
    width: COLUMN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  weekendHeader: {
    backgroundColor: '#f1f5f9',
  },
  dayNameText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  dayNumText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
  },
  todayText: {
    color: BeroColors.blue,
    fontWeight: '900',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  leftCell: {
    width: LEFT_COL_WIDTH,
    padding: 12,
    borderRightWidth: 2,
    borderRightColor: '#f1f5f9',
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  productName: {
    fontSize: 12,
    fontWeight: '800',
    color: BeroColors.dark,
    lineHeight: 16,
  },
  productDlcLabel: {
    fontSize: 9,
    color: BeroColors.green,
    fontWeight: '700',
    marginTop: 2,
  },
  gridArea: {
    flexDirection: 'row',
    position: 'relative',
  },
  cellsContainer: {
    flexDirection: 'row',
    height: '100%',
  },
  cell: {
    width: COLUMN_WIDTH,
    borderRightWidth: 1,
    borderRightColor: '#f8fafc',
    height: '100%',
  },
  weekendCell: {
    backgroundColor: '#fbfcfd',
  },
  batchBar: {
    position: 'absolute',
    height: 22,
    borderRadius: 6,
    justifyContent: 'center',
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  batchBarText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#fff',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: BeroColors.dark,
  },
  modalForm: {
    padding: 24,
  },
  productHighlight: {
    fontSize: 20,
    fontWeight: '900',
    color: BeroColors.blue,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    marginBottom: 8,
    letterSpacing: 1,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontWeight: '700',
    color: BeroColors.dark,
  },
  highlightGroup: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  dateField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 10,
  },
  dateTextLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  expiryField: {
    borderColor: '#fecaca',
    backgroundColor: '#fff1f2',
  },
  expiryValueText: {
    color: '#ef4444',
    fontWeight: '900',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statusToggle: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  statusToggleActive: {
     backgroundColor: BeroColors.green,
  },
  statusToggleClosed: {
    backgroundColor: '#3b82f6',
  },
  whiteText: {
    color: '#fff',
    fontWeight: '800',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
  },
  saveBtn: {
    flex: 2,
    backgroundColor: BeroColors.blue,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '900',
  },
  cancelBtn: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#64748b',
    fontWeight: '700',
  },
  deleteBtn: {
    width: 54,
    height: 54,
    backgroundColor: '#fff1f2',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productPickerContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    maxHeight: 200,
    overflow: 'hidden',
  },
  productPickerList: {
    padding: 8,
  },
  productPickItem: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  productPickItemActive: {
    backgroundColor: BeroColors.blue,
    borderColor: BeroColors.blue,
  },
  productPickText: {
    fontSize: 14,
    fontWeight: '700',
    color: BeroColors.dark,
  },
  productPickTextActive: {
    color: '#fff',
  },
});
