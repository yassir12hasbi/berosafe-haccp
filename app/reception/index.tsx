import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import receptionApi, {
  Category,
  Product,
  ProductChecklistResponse,
  ReceptionInitialData,
  ReceptionLine,
  Supplier,
} from '../../api/reception';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { BeroColors } from '../../constants/theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getErrorDetails } from '../../utils/error';
import Svg, { Path, Circle, Rect, Line, G } from 'react-native-svg';

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const C = {
  navy:       '#1A3B6E',
  navyLight:  '#234F91',
  green:      '#15803D',
  greenBg:    '#F0FDF4',
  greenBorder:'#BBF7D0',
  red:        '#DC2626',
  redBg:      '#FEF2F2',
  redBorder:  '#FECACA',
  amber:      '#B45309',
  amberBg:    '#FFFBEB',
  white:      '#FFFFFF',
  slate50:    '#F8FAFC',
  slate100:   '#F1F5F9',
  slate200:   '#E2E8F0',
  slate300:   '#CBD5E1',
  slate400:   '#94A3B8',
  slate500:   '#64748B',
  slate600:   '#475569',
  slate700:   '#334155',
  slate800:   '#1E293B',
  slate900:   '#0F172A',
};

type Step = 'supplier' | 'product' | 'form' | 'summary';

// ─── SVG Icons ────────────────────────────────────────────────────────────────
type IP = { size?: number; color?: string };
const SW = 1.8;

const IcoBack    = ({ size = 20, color = C.navy }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcoSearch  = ({ size = 18, color = C.slate400 }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth={SW}/>
    <Path d="M16.5 16.5L21 21" stroke={color} strokeWidth={SW} strokeLinecap="round"/>
  </Svg>
);
const IcoClose   = ({ size = 20, color = C.slate400 }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={SW} strokeLinecap="round"/>
  </Svg>
);
const IcoCheck   = ({ size = 14, color = C.white }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcoPlus    = ({ size = 22, color = C.navy }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={SW}/>
    <Path d="M12 8v8M8 12h8" stroke={color} strokeWidth={SW} strokeLinecap="round"/>
  </Svg>
);
const IcoCamera  = ({ size = 32, color = C.navy }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke={color} strokeWidth={SW} strokeLinejoin="round"/>
    <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth={SW}/>
  </Svg>
);
const IcoCalendar= ({ size = 20, color = C.navy }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth={SW}/>
    <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth={SW} strokeLinecap="round"/>
  </Svg>
);
const IcoThermo  = ({ size = 20, color = C.navy }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M14 14.76V5a2 2 0 00-4 0v9.76A4 4 0 1014 14.76z" stroke={color} strokeWidth={SW} strokeLinejoin="round"/>
  </Svg>
);
const IcoEdit    = ({ size = 18, color = C.navy }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcoTrash   = ({ size = 18, color = C.red }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M10 11v6M14 11v6" stroke={color} strokeWidth={SW} strokeLinecap="round"/>
  </Svg>
);
const IcoWarning = ({ size = 16, color = C.red }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={color} strokeWidth={SW} strokeLinejoin="round"/>
    <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth={SW} strokeLinecap="round"/>
  </Svg>
);
const IcoFlag    = ({ size = 16, color = C.white }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke={color} strokeWidth={SW} strokeLinejoin="round"/>
    <Line x1="4" y1="22" x2="4" y2="15" stroke={color} strokeWidth={SW} strokeLinecap="round"/>
  </Svg>
);
const IcoSupplier= ({ size = 28, color = C.navy }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={color} strokeWidth={SW} strokeLinejoin="round"/>
    <Path d="M9 22V12h6v10" stroke={color} strokeWidth={SW} strokeLinejoin="round"/>
  </Svg>
);
const IcoProduct = ({ size = 28, color = C.navy }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke={color} strokeWidth={SW} strokeLinejoin="round"/>
    <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth={SW} strokeLinecap="round"/>
  </Svg>
);
const IcoForm    = ({ size = 28, color = C.navy }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={color} strokeWidth={SW} strokeLinejoin="round"/>
    <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth={SW} strokeLinecap="round"/>
  </Svg>
);
const IcoSummary = ({ size = 28, color = C.navy }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth={SW}/>
    <Path d="M9 9h6M9 12h6M9 15h4" stroke={color} strokeWidth={SW} strokeLinecap="round"/>
  </Svg>
);

// ─── Step Progress Bar ────────────────────────────────────────────────────────
const STEPS: { key: Step; label: string; Icon: React.FC<IP> }[] = [
  { key: 'supplier', label: 'Fournisseur', Icon: IcoSupplier },
  { key: 'product',  label: 'Produit',     Icon: IcoProduct  },
  { key: 'form',     label: 'Contrôle',    Icon: IcoForm     },
  { key: 'summary',  label: 'Résumé',      Icon: IcoSummary  },
];
const STEP_ORDER: Step[] = ['supplier','product','form','summary'];

function StepBar({ current }: { current: Step }) {
  const currentIdx = STEP_ORDER.indexOf(current);
  return (
    <View style={sb.row}>
      {STEPS.map(({ key, label, Icon }, i) => {
        const done    = i < currentIdx;
        const active  = i === currentIdx;
        const future  = i > currentIdx;
        return (
          <React.Fragment key={key}>
            <View style={sb.item}>
              <View style={[
                sb.circle,
                done   && sb.circleDone,
                active && sb.circleActive,
                future && sb.circleFuture,
              ]}>
                {done
                  ? <IcoCheck size={14} color={C.white} />
                  : <Icon size={15} color={active ? C.white : C.slate400} />
                }
              </View>
              <ThemedText style={[sb.label, active && sb.labelActive, done && sb.labelDone]}>
                {label}
              </ThemedText>
            </View>
            {i < STEPS.length - 1 && (
              <View style={[sb.connector, done && sb.connectorDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}
const sb = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  item: { alignItems: 'center', gap: 4 },
  circle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: C.slate100, borderWidth: 2, borderColor: C.slate200 },
  circleActive: { backgroundColor: C.navy, borderColor: C.navy },
  circleDone: { backgroundColor: C.green, borderColor: C.green },
  circleFuture: { backgroundColor: C.slate100, borderColor: C.slate200 },
  connector: { flex: 1, height: 2, backgroundColor: C.slate200, marginBottom: 16, marginHorizontal: 4 },
  connectorDone: { backgroundColor: C.green },
  label: { fontSize: 9, fontWeight: '600', color: C.slate400, textAlign: 'center', letterSpacing: 0.3 },
  labelActive: { color: C.navy, fontWeight: '800' },
  labelDone: { color: C.green },
});

// ─── Section header ───────────────────────────────────────────────────────────
function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: sub ? 4 : 0 }}>
        <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: C.navy }} />
        <ThemedText style={{ fontSize: 15, fontWeight: '800', color: C.slate800, letterSpacing: -0.2 }}>{title}</ThemedText>
      </View>
      {sub && <ThemedText style={{ fontSize: 12, color: C.slate400, marginLeft: 12 }}>{sub}</ThemedText>}
    </View>
  );
}

// ─── Search input ─────────────────────────────────────────────────────────────
function SearchInput({ value, onChangeText, placeholder }: { value: string; onChangeText: (v: string) => void; placeholder: string }) {
  return (
    <View style={si.wrap}>
      <IcoSearch size={16} color={C.slate400} />
      <TextInput
        style={si.input}
        placeholder={placeholder}
        placeholderTextColor={C.slate400}
        value={value}
        onChangeText={onChangeText}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <IcoClose size={16} color={C.slate300} />
        </TouchableOpacity>
      )}
    </View>
  );
}
const si = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.white, borderRadius: 12, paddingHorizontal: 14, height: 46, borderWidth: 1, borderColor: C.slate200, marginBottom: 14 },
  input: { flex: 1, fontSize: 14, color: C.slate800, fontWeight: '500' },
});

// ─── Main component ───────────────────────────────────────────────────────────
export default function ReceptionScreen() {
  const router = useRouter();
  const [loading, setLoading]   = useState(true);
  const [step, setStep]         = useState<Step>('supplier');

  const [data, setData]         = useState<ReceptionInitialData | null>(null);
  const [currentProductChecklists, setCurrentProductChecklists] = useState<ProductChecklistResponse | null>(null);

  const [selectedSupplier, setSelectedSupplier]   = useState<Supplier | null>(null);
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState('');
  const [selectedCategory, setSelectedCategory]   = useState<Category | null>(null);
  const [selectedProduct, setSelectedProduct]     = useState<Product | null>(null);

  const [measuredTemp, setMeasuredTemp]           = useState('');
  const [lotNumber, setLotNumber]                 = useState('');
  const [isCompliant, setIsCompliant]             = useState(true);
  const [nonComplianceReason, setNonComplianceReason] = useState('');
  const [expirationDate, setExpirationDate]       = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker]       = useState(false);
  const [capturedPhoto, setCapturedPhoto]         = useState<string | null>(null);
  const [checklistResults, setChecklistResults]   = useState<Record<number, boolean>>({});

  const [receptionLines, setReceptionLines]       = useState<ReceptionLine[]>([]);
  const [editingLineIndex, setEditingLineIndex]   = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting]           = useState(false);

  const [searchQuery, setSearchQuery]             = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [isDeliveryModalVisible, setIsDeliveryModalVisible] = useState(false);

  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 900;

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const res = await receptionApi.getInitialData();
      setData(res);
      setSelectedCategory(null);
    } catch (error) {
      const { title, message } = getErrorDetails(error, 'Chargement impossible', 'Impossible de charger les données.');
      Alert.alert(title, message);
    } finally { setLoading(false); }
  };

  const loadProductDetails = async (product: Product) => {
    try {
      setLoading(true);
      const res = await receptionApi.getProductChecklists(product.id);
      setCurrentProductChecklists(res);
      const init: Record<number, boolean> = {};
      res.checklists.forEach(c => { init[c.id] = true; });
      setChecklistResults(init);
      setStep('form');
    } catch (error) {
      const { title, message } = getErrorDetails(error, 'Chargement impossible', 'Impossible de charger les détails.');
      Alert.alert(title, message);
    } finally { setLoading(false); }
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) { Alert.alert('Permission refusée', "Autorisez l'accès à la caméra."); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, base64: true, quality: 0.5 });
    if (!result.canceled && result.assets?.length > 0) {
      setCapturedPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const isTempValid = useMemo(() => {
    if (!measuredTemp || !currentProductChecklists) return true;
    const temp = parseFloat(measuredTemp);
    const { min_temperature: min, max_temperature: max } = currentProductChecklists;
    if (min !== null && temp < min) return false;
    if (max !== null && temp > max) return false;
    return true;
  }, [measuredTemp, currentProductChecklists]);

  const addLine = () => {
    if (!selectedProduct) return;
    const newLine: ReceptionLine = {
      product_id: selectedProduct.id,
      measured_temperature: measuredTemp ? parseFloat(measuredTemp) : undefined,
      lot_number: lotNumber || undefined,
      expiration_date: expirationDate ? expirationDate.toISOString().split('T')[0] : undefined,
      is_compliant: isCompliant,
      non_compliance_reason: isCompliant ? null : (nonComplianceReason || 'Non conforme'),
      photo: capturedPhoto || undefined,
      checklists: Object.entries(checklistResults).map(([id, value]) => ({ checklist_id: parseInt(id), recorded_value: value })),
    };
    if (editingLineIndex !== null) {
      const updated = [...receptionLines]; updated[editingLineIndex] = newLine; setReceptionLines(updated);
    } else { setReceptionLines([...receptionLines, newLine]); }
    resetForm(); setStep('summary');
  };

  const resetForm = () => { setMeasuredTemp(''); setLotNumber(''); setNonComplianceReason(''); setIsCompliant(true); setExpirationDate(null); setCapturedPhoto(null); setEditingLineIndex(null); };

  const editLine = async (index: number) => {
    const line = receptionLines[index];
    const product = data?.products.find(p => p.id === line.product_id);
    if (!product) return;
    try {
      setLoading(true); setSelectedProduct(product);
      const res = await receptionApi.getProductChecklists(product.id);
      setCurrentProductChecklists(res);
      setMeasuredTemp(line.measured_temperature?.toString() || '');
      setLotNumber(line.lot_number || '');
      setIsCompliant(line.is_compliant);
      setNonComplianceReason(line.non_compliance_reason || '');
      setExpirationDate(line.expiration_date ? new Date(line.expiration_date) : null);
      setCapturedPhoto(line.photo || null);
      const nc: Record<number, boolean> = {};
      line.checklists?.forEach(c => { nc[c.checklist_id] = c.recorded_value; });
      setChecklistResults(nc); setEditingLineIndex(index); setStep('form');
    } catch (error) {
      const { title, message } = getErrorDetails(error, 'Chargement impossible', 'Impossible de charger les détails.');
      Alert.alert(title, message);
    } finally { setLoading(false); }
  };

  const removeLine = (index: number) => {
    Alert.alert('Supprimer', 'Voulez-vous supprimer ce produit de la réception ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => { const u = [...receptionLines]; u.splice(index,1); setReceptionLines(u); } },
    ]);
  };

  const submitReception = async () => {
    if (!selectedSupplier || receptionLines.length === 0) return;
    try {
      setIsSubmitting(true);
      await receptionApi.storeReception({ supplier_id: selectedSupplier.id, delivery_note_number: deliveryNoteNumber || null, received_at: new Date().toISOString().slice(0,19).replace('T',' '), lines: receptionLines });
      Alert.alert('Succès', 'Réception enregistrée !', [{ text: 'OK', onPress: () => router.push('/') }]);
    } catch (error) {
      const { title, message } = getErrorDetails(error, 'Erreur', "Échec de l'enregistrement.");
      Alert.alert(title, message);
    } finally { setIsSubmitting(false); }
  };

  // ── Header ─────────────────────────────────────────────────────────────────
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <IcoBack size={20} color={C.navy} />
        </TouchableOpacity>
        <View>
          <ThemedText style={styles.headerTitle}>Contrôle Réception</ThemedText>
          {selectedSupplier && (
            <ThemedText style={styles.headerSub}>{selectedSupplier.name}</ThemedText>
          )}
        </View>
        {receptionLines.length > 0 && (
          <View style={styles.headerBadge}>
            <ThemedText style={styles.headerBadgeText}>{receptionLines.length}</ThemedText>
          </View>
        )}
      </View>
      <StepBar current={step} />
    </View>
  );

  // ── Step 1: Supplier ────────────────────────────────────────────────────────
  const renderSupplierStep = () => {
    const filtered = data?.suppliers.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())) || [];
    return (
      <View style={{ flex: 1 }}>
        <Modal visible={isDeliveryModalVisible} transparent animationType="fade" onRequestClose={() => setIsDeliveryModalVisible(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
            <View style={styles.modal}>
              <View style={styles.modalTop}>
                <View>
                  <ThemedText style={styles.modalTitle}>Bon de livraison</ThemedText>
                  <ThemedText style={styles.modalSub}>{selectedSupplier?.name}</ThemedText>
                </View>
                <TouchableOpacity onPress={() => setIsDeliveryModalVisible(false)} style={styles.modalClose}>
                  <IcoClose size={18} color={C.slate500} />
                </TouchableOpacity>
              </View>
              <View style={styles.modalInputWrap}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Ex: BL-12345 (Optionnel)"
                  placeholderTextColor={C.slate400}
                  value={deliveryNoteNumber}
                  onChangeText={setDeliveryNoteNumber}
                  autoFocus
                />
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.btnSecondary} onPress={() => setIsDeliveryModalVisible(false)}>
                  <ThemedText style={styles.btnSecondaryText}>Annuler</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnPrimary} onPress={() => { setIsDeliveryModalVisible(false); setStep('product'); }}>
                  <ThemedText style={styles.btnPrimaryText}>Continuer →</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.pad}
          ListHeaderComponent={
            <View>
              <SectionTitle title="Choisir le fournisseur" sub={`${filtered.length} fournisseur(s) disponible(s)`} />
              <SearchInput value={searchQuery} onChangeText={setSearchQuery} placeholder="Rechercher un fournisseur..." />
            </View>
          }
          renderItem={({ item }) => {
            const active = selectedSupplier?.id === item.id;
            return (
              <TouchableOpacity
                style={[styles.card, active && styles.cardActive]}
                onPress={() => { setSelectedSupplier(item); setIsDeliveryModalVisible(true); }}
                activeOpacity={0.8}
              >
                <View style={[styles.cardIcon, active && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <IcoSupplier size={20} color={active ? C.white : C.navy} />
                </View>
                <ThemedText style={[styles.cardName, active && styles.cardNameActive]}>{item.name}</ThemedText>
                {active && <IcoCheck size={16} color={C.white} />}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={<EmptyState label="Aucun fournisseur trouvé" />}
          ListFooterComponent={<TouchableOpacity style={styles.linkBtn} onPress={() => router.back()}><ThemedText style={styles.linkBtnText}>← Retour tableau de bord</ThemedText></TouchableOpacity>}
        />
      </View>
    );
  };

  // ── Step 2: Product ─────────────────────────────────────────────────────────
  const renderProductStep = () => {
    const filtered = data?.products.filter(p => {
      const matchCat  = selectedCategory === null || p.category_id === selectedCategory.id;
      const matchSearch = p.name.toLowerCase().includes(productSearchQuery.toLowerCase());
      return matchCat && matchSearch;
    }) || [];

    return (
      <FlatList
        data={filtered}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.pad}
        ListHeaderComponent={
          <View>
            <SectionTitle title="Choisir le produit" sub={selectedSupplier?.name} />
            <SearchInput value={productSearchQuery} onChangeText={setProductSearchQuery} placeholder="Rechercher un produit..." />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {[null, ...(data?.categories || [])].map((cat, i) => {
                const active = cat === null ? selectedCategory === null : selectedCategory?.id === cat.id;
                return (
                  <TouchableOpacity key={i} style={[styles.tab, active && styles.tabActive]} onPress={() => setSelectedCategory(cat)} activeOpacity={0.8}>
                    <ThemedText style={[styles.tabText, active && styles.tabTextActive]}>{cat === null ? 'Tous' : cat.name}</ThemedText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => { setSelectedProduct(item); loadProductDetails(item); }} activeOpacity={0.8}>
            <View style={styles.cardIcon}><IcoProduct size={18} color={C.navy} /></View>
            <ThemedText style={styles.cardName}>{item.name}</ThemedText>
            <IcoPlus size={22} color={C.navy} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<EmptyState label="Aucun produit trouvé" />}
        ListFooterComponent={<TouchableOpacity style={styles.linkBtn} onPress={() => setStep('supplier')}><ThemedText style={styles.linkBtnText}>← Changer de fournisseur</ThemedText></TouchableOpacity>}
      />
    );
  };

  // ── Step 3: Form ────────────────────────────────────────────────────────────
  const renderFormStep = () => (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[styles.pad, { paddingBottom: 60 }]} showsVerticalScrollIndicator={false}>
        <SectionTitle title={`Contrôle : ${selectedProduct?.name}`} sub={selectedSupplier?.name} />

        {editingLineIndex !== null && (
          <View style={styles.editBanner}>
            <IcoEdit size={14} color={C.white} />
            <ThemedText style={{ color: C.white, fontSize: 13, fontWeight: '700' }}>Mode modification</ThemedText>
          </View>
        )}

        {/* Photo */}
        <TouchableOpacity style={[styles.photoBox, capturedPhoto && styles.photoBoxFilled]} onPress={handlePickImage} activeOpacity={0.85}>
          {capturedPhoto ? (
            <Image source={{ uri: capturedPhoto }} style={styles.photo} />
          ) : (
            <View style={{ alignItems: 'center', gap: 8 }}>
              <IcoCamera size={30} color={C.navy} />
              <ThemedText style={{ color: C.navy, fontWeight: '700', fontSize: 14 }}>Photographier l'étiquette</ThemedText>
              <ThemedText style={{ color: C.slate400, fontSize: 12 }}>Appuyer pour ouvrir la caméra</ThemedText>
            </View>
          )}
        </TouchableOpacity>

        {/* Temperature */}
        <View style={styles.fieldGroup}>
          <View style={styles.fieldLabelRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <IcoThermo size={16} color={C.slate600} />
              <ThemedText style={styles.fieldLabel}>Température à cœur (°C)</ThemedText>
            </View>
            {currentProductChecklists && (
              <View style={styles.rangeBadge}>
                <ThemedText style={styles.rangeBadgeText}>
                  {currentProductChecklists.min_temperature ?? '—'}° / {currentProductChecklists.max_temperature ?? '—'}°
                </ThemedText>
              </View>
            )}
          </View>
          <TextInput
            style={[styles.input, !isTempValid && styles.inputError]}
            placeholder="Ex: 2.5"
            placeholderTextColor={C.slate400}
            keyboardType="numeric"
            value={measuredTemp}
            onChangeText={setMeasuredTemp}
          />
          {!isTempValid && (
            <View style={styles.errorRow}>
              <IcoWarning size={14} color={C.red} />
              <ThemedText style={styles.errorText}>Température hors des normes autorisées</ThemedText>
            </View>
          )}
        </View>

        {/* Date + Lot */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <IcoCalendar size={15} color={C.slate600} />
              <ThemedText style={styles.fieldLabel}>DLUO / DLC</ThemedText>
            </View>
            <TouchableOpacity style={styles.datePicker} onPress={() => setShowDatePicker(true)}>
              <ThemedText style={[styles.datePickerText, !expirationDate && { color: C.slate400 }]}>
                {expirationDate ? expirationDate.toLocaleDateString('fr-FR') : 'Choisir date'}
              </ThemedText>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker value={expirationDate || new Date()} mode="date" display="default"
                onChange={(_, d) => { setShowDatePicker(false); if (d) setExpirationDate(d); }} />
            )}
          </View>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <ThemedText style={[styles.fieldLabel, { marginBottom: 8 }]}>N° de Lot</ThemedText>
            <TextInput style={styles.input} placeholder="Ex: L123" placeholderTextColor={C.slate400} value={lotNumber} onChangeText={setLotNumber} />
          </View>
        </View>

        {/* Checklists */}
        {currentProductChecklists?.checklists.length ? (
          <View style={styles.checklistBox}>
            <ThemedText style={styles.checklistBoxTitle}>Points de contrôle</ThemedText>
            {currentProductChecklists.checklists.map(c => (
              <TouchableOpacity key={c.id} style={styles.checkRow} onPress={() => setChecklistResults(prev => ({ ...prev, [c.id]: !prev[c.id] }))} activeOpacity={0.8}>
                <ThemedText style={styles.checkLabel}>{c.name}</ThemedText>
                <View style={[styles.checkbox, checklistResults[c.id] && styles.checkboxOn]}>
                  {checklistResults[c.id] && <IcoCheck size={12} color={C.white} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {/* Compliance */}
        <View style={styles.complianceBox}>
          <ThemedText style={styles.complianceTitle}>Décision de conformité</ThemedText>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity style={[styles.compBtn, isCompliant && styles.compBtnGreen]} onPress={() => setIsCompliant(true)} activeOpacity={0.85}>
              <IcoCheck size={18} color={isCompliant ? C.white : C.green} />
              <ThemedText style={[styles.compBtnText, isCompliant && { color: C.white }]}>Conforme</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.compBtn, !isCompliant && styles.compBtnRed]} onPress={() => setIsCompliant(false)} activeOpacity={0.85}>
              <IcoClose size={18} color={!isCompliant ? C.white : C.red} />
              <ThemedText style={[styles.compBtnText, !isCompliant && { color: C.white }]}>Non conforme</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {!isCompliant && (
          <View style={styles.reasonBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <IcoFlag size={14} color={C.red} />
              <ThemedText style={{ fontSize: 13, fontWeight: '700', color: C.red }}>Motif de refus</ThemedText>
            </View>
            <TextInput
              style={styles.reasonInput}
              placeholder="Ex: Carton endommagé, température critique..."
              placeholderTextColor={C.slate400}
              value={nonComplianceReason}
              onChangeText={setNonComplianceReason}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        )}

        <TouchableOpacity style={styles.btnPrimary} onPress={addLine} activeOpacity={0.85}>
          <ThemedText style={styles.btnPrimaryText}>
            {editingLineIndex !== null ? '✓ Mettre à jour' : '✓ Valider ce produit'}
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkBtn} onPress={() => { resetForm(); setStep(receptionLines.length > 0 ? 'summary' : 'product'); }}>
          <ThemedText style={styles.linkBtnText}>Annuler</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // ── Step 4: Summary ─────────────────────────────────────────────────────────
  const renderSummaryStep = () => (
    <FlatList
      data={receptionLines}
      keyExtractor={(_, i) => i.toString()}
      contentContainerStyle={styles.pad}
      ListHeaderComponent={
        <View>
          <SectionTitle title="Récapitulatif" sub={`${selectedSupplier?.name} · ${receptionLines.length} produit(s)`} />
          {receptionLines.length > 0 && (
            <View style={styles.summaryStats}>
              <View style={[styles.statChip, { backgroundColor: C.greenBg, borderColor: C.greenBorder }]}>
                <ThemedText style={{ fontSize: 11, fontWeight: '700', color: C.green }}>
                  ✓ {receptionLines.filter(l => l.is_compliant).length} Conforme(s)
                </ThemedText>
              </View>
              {receptionLines.filter(l => !l.is_compliant).length > 0 && (
                <View style={[styles.statChip, { backgroundColor: C.redBg, borderColor: C.redBorder }]}>
                  <ThemedText style={{ fontSize: 11, fontWeight: '700', color: C.red }}>
                    ✗ {receptionLines.filter(l => !l.is_compliant).length} Non-Conforme(s)
                  </ThemedText>
                </View>
              )}
            </View>
          )}
        </View>
      }
      renderItem={({ item, index }) => {
        const product = data?.products.find(p => p.id === item.product_id);
        return (
          <View style={[styles.lineCard, { borderLeftColor: item.is_compliant ? C.green : C.red }]}>
            <View style={styles.lineTop}>
              <ThemedText style={styles.lineName}>{product?.name}</ThemedText>
              <View style={styles.lineActions}>
                <TouchableOpacity onPress={() => editLine(index)} style={styles.actionBtn}>
                  <IcoEdit size={16} color={C.navy} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeLine(index)} style={styles.actionBtn}>
                  <IcoTrash size={16} color={C.red} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.lineBottom}>
              <View style={[styles.badge, item.is_compliant ? styles.badgeGreen : styles.badgeRed]}>
                <ThemedText style={[styles.badgeText, { color: item.is_compliant ? C.green : C.red }]}>
                  {item.is_compliant ? 'Conforme' : 'Non-Conforme'}
                </ThemedText>
              </View>
              <ThemedText style={styles.lineInfo}>
                {item.measured_temperature != null ? `${item.measured_temperature}°C` : '—'} · Lot: {item.lot_number || '—'}
              </ThemedText>
            </View>
          </View>
        );
      }}
      ListEmptyComponent={<EmptyState label="Aucun produit ajouté" />}
      ListFooterComponent={
        <View style={{ gap: 10, marginTop: 8 }}>
          <TouchableOpacity style={styles.btnOutline} onPress={() => setStep('product')} activeOpacity={0.8}>
            <ThemedText style={styles.btnOutlineText}>+ Ajouter un produit</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnPrimary, receptionLines.length === 0 && styles.btnDisabled]}
            onPress={submitReception}
            disabled={isSubmitting || receptionLines.length === 0}
            activeOpacity={0.85}
          >
            {isSubmitting
              ? <ActivityIndicator color={C.white} />
              : <ThemedText style={styles.btnPrimaryText}>Finaliser la réception</ThemedText>
            }
          </TouchableOpacity>
        </View>
      }
    />
  );

  return (
    <ThemedView style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaProvider style={{ flex: 1 }}>
        {renderHeader()}
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={C.navy} />
            <ThemedText style={{ marginTop: 12, color: C.slate500, fontWeight: '600' }}>Chargement...</ThemedText>
          </View>
        ) : isLargeScreen ? (
          <View style={styles.desktop}>
            <View style={styles.col}>{renderSupplierStep()}</View>
            <View style={styles.col}>{renderProductStep()}</View>
            <View style={styles.col}>{renderFormStep()}</View>
            <View style={styles.col}>{renderSummaryStep()}</View>
          </View>
        ) : (
          <>
            {step === 'supplier' && renderSupplierStep()}
            {step === 'product'  && renderProductStep()}
            {step === 'form'     && renderFormStep()}
            {step === 'summary'  && renderSummaryStep()}
          </>
        )}
      </SafeAreaProvider>
    </ThemedView>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ label }: { label: string }) {
  return (
    <View style={{ paddingVertical: 48, alignItems: 'center', gap: 8 }}>
      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: C.slate100, alignItems: 'center', justifyContent: 'center' }}>
        <IcoSearch size={22} color={C.slate300} />
      </View>
      <ThemedText style={{ color: C.slate400, fontWeight: '600', fontSize: 14 }}>{label}</ThemedText>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.slate100 },

  // Header
  header: { backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.slate100, paddingTop: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 3, zIndex: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: C.slate900, letterSpacing: -0.3 },
  headerSub: { fontSize: 11, color: C.slate400, fontWeight: '500', marginTop: 1 },
  headerBadge: { marginLeft: 'auto', backgroundColor: C.navy, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  headerBadgeText: { color: C.white, fontSize: 12, fontWeight: '800' },

  // Layout
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  desktop: { flex: 1, flexDirection: 'row', gap: 12, padding: 12 },
  col: { flex: 1, backgroundColor: C.white, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.slate200 },
  pad: { padding: 18, paddingBottom: 40 },

  // Cards
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.white, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.slate200, shadowColor: '#1A3B6E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardActive: { backgroundColor: C.navy, borderColor: C.navy },
  cardIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.slate50, alignItems: 'center', justifyContent: 'center' },
  cardName: { flex: 1, fontSize: 15, fontWeight: '700', color: C.slate800 },
  cardNameActive: { color: C.white },

  // Tabs
  tab: { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: C.white, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: C.slate200 },
  tabActive: { backgroundColor: C.navy, borderColor: C.navy },
  tabText: { fontSize: 13, fontWeight: '600', color: C.slate500 },
  tabTextActive: { color: C.white },

  // Form
  fieldGroup: { marginBottom: 18 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: C.slate600 },
  input: { backgroundColor: C.white, borderWidth: 1.5, borderColor: C.slate200, borderRadius: 12, padding: 13, fontSize: 15, fontWeight: '600', color: C.slate900 },
  inputError: { borderColor: C.red, backgroundColor: C.redBg },
  datePicker: { backgroundColor: C.white, borderWidth: 1.5, borderColor: C.slate200, borderRadius: 12, padding: 13, flexDirection: 'row', alignItems: 'center' },
  datePickerText: { fontSize: 14, fontWeight: '600', color: C.slate800 },
  rangeBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#DBEAFE' },
  rangeBadgeText: { fontSize: 10, fontWeight: '800', color: C.navy },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 },
  errorText: { fontSize: 12, color: C.red, fontWeight: '600' },

  // Photo
  photoBox: { borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: C.slate200, backgroundColor: C.slate50, padding: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  photoBoxFilled: { borderStyle: 'solid', padding: 0, overflow: 'hidden', height: 180 },
  photo: { width: '100%', height: '100%', borderRadius: 14 },

  // Checklist
  checklistBox: { backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.slate200, padding: 14, marginBottom: 16 },
  checklistBoxTitle: { fontSize: 11, fontWeight: '800', color: C.slate400, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  checkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.slate100 },
  checkLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: C.slate700 },
  checkbox: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: C.slate300, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: C.green, borderColor: C.green },

  // Compliance
  complianceBox: { backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.slate200, padding: 14, marginBottom: 16 },
  complianceTitle: { fontSize: 11, fontWeight: '800', color: C.slate400, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  compBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: C.slate200, backgroundColor: C.white },
  compBtnGreen: { backgroundColor: C.green, borderColor: C.green },
  compBtnRed: { backgroundColor: C.red, borderColor: C.red },
  compBtnText: { fontSize: 14, fontWeight: '700', color: C.slate600 },

  // Reason
  reasonBox: { backgroundColor: C.redBg, borderRadius: 14, borderWidth: 1, borderColor: C.redBorder, padding: 14, marginBottom: 16 },
  reasonInput: { backgroundColor: C.white, borderRadius: 10, padding: 12, fontSize: 14, color: C.slate800, borderWidth: 1, borderColor: C.redBorder, minHeight: 80 },

  // Edit banner
  editBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.amber, padding: 12, borderRadius: 10, marginBottom: 16 },

  // Summary
  summaryStats: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  statChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  lineCard: { backgroundColor: C.white, borderRadius: 14, padding: 14, marginBottom: 10, borderLeftWidth: 4, borderWidth: 1, borderColor: C.slate100, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  lineTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  lineName: { flex: 1, fontSize: 15, fontWeight: '800', color: C.slate800 },
  lineActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.slate50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.slate200 },
  lineBottom: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  badgeGreen: { backgroundColor: C.greenBg, borderColor: C.greenBorder },
  badgeRed: { backgroundColor: C.redBg, borderColor: C.redBorder },
  badgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  lineInfo: { fontSize: 12, color: C.slate400, fontWeight: '600' },

  // Buttons
  btnPrimary: { backgroundColor: C.navy, borderRadius: 14, padding: 17, alignItems: 'center', shadowColor: C.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  btnPrimaryText: { color: C.white, fontSize: 16, fontWeight: '800' },
  btnSecondary: { flex: 1, backgroundColor: C.slate100, borderRadius: 12, padding: 15, alignItems: 'center' },
  btnSecondaryText: { color: C.slate600, fontSize: 14, fontWeight: '700' },
  btnOutline: { borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: C.navy, backgroundColor: C.white },
  btnOutlineText: { color: C.navy, fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.45 },
  linkBtn: { padding: 14, alignItems: 'center' },
  linkBtnText: { color: C.slate400, fontSize: 14, fontWeight: '600' },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(15,37,71,0.55)', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: C.white, borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 12 },
  modalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.slate900 },
  modalSub: { fontSize: 13, color: C.slate400, marginTop: 2 },
  modalClose: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.slate100, alignItems: 'center', justifyContent: 'center' },
  modalInputWrap: { marginBottom: 20 },
  modalInput: { backgroundColor: C.slate50, borderRadius: 12, padding: 14, fontSize: 15, color: C.slate800, borderWidth: 1, borderColor: C.slate200 },
  modalActions: { flexDirection: 'row', gap: 10 },
});