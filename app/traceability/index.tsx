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
  FlatList,
  Animated,
  Image,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import traceabilityApi, {
  TraceabilityBatch,
  Product,
  TraceabilityInitialData,
} from '../../api/traceability';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getErrorDetails } from '../../utils/error';
import Svg, { Path, Circle, Rect, G, Line } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
  navy:      '#13385E',
  navyMid:   '#1F65A7',
  green:     '#22c55e',
  greenDark: '#16a34a',
  greenBg:   '#F0FDF4',
  greenBd:   '#BBF7D0',
  blue:      '#3b82f6',
  blueDark:  '#2563eb',
  blueBg:    '#EFF6FF',
  blueBd:    '#BFDBFE',
  red:       '#ef4444',
  redDark:   '#dc2626',
  redBg:     '#FEF2F2',
  redBd:     '#FECACA',
  amber:     '#f59e0b',
  white:     '#FFFFFF',
  black:     '#000000',
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

const COL_W      = 48;
const LEFT_W     = 200;
const SIDEBAR_W  = 180;
const MONTHS     = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS_SHORT = ['D','L','M','M','J','V','S'];
const PIN_CORRECT = '1234';

// ─── SVG Icons ────────────────────────────────────────────────────────────────
type IP = { size?: number; color?: string };
const SW = 1.8;

const IcoBack    = ({ size=18, color=C.white   }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/></Svg>
);
const IcoChevL   = ({ size=14, color=C.white   }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/></Svg>
);
const IcoChevR   = ({ size=14, color=C.white   }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M9 18l6-6-6-6" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/></Svg>
);
const IcoPlus    = ({ size=18, color=C.white   }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2.2} strokeLinecap="round"/></Svg>
);
const IcoMinus   = ({ size=14, color=C.slate500 }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M5 12h14" stroke={color} strokeWidth={2} strokeLinecap="round"/></Svg>
);
const IcoSearch  = ({ size=14, color=C.slate400}: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Circle cx="11" cy="11" r="7" stroke={color} strokeWidth={SW}/><Path d="M16.5 16.5L21 21" stroke={color} strokeWidth={SW} strokeLinecap="round"/></Svg>
);
const IcoClose   = ({ size=16, color=C.slate400}: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={SW} strokeLinecap="round"/></Svg>
);
const IcoCheck   = ({ size=13, color=C.white   }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></Svg>
);
const IcoCal     = ({ size=16, color=C.navyMid }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth={SW}/><Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth={SW} strokeLinecap="round"/></Svg>
);
const IcoTrash   = ({ size=16, color=C.red     }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/><Path d="M10 11v6M14 11v6" stroke={color} strokeWidth={SW} strokeLinecap="round"/></Svg>
);
const IcoPen     = ({ size=13, color=C.navyMid }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/><Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/></Svg>
);
const IcoIndustry= ({ size=14, color=C.navyMid }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M2 20V8l6-4v4l6-4v4l6-4v16H2z" stroke={color} strokeWidth={SW} strokeLinejoin="round"/><Rect x="6" y="14" width="3" height="6" stroke={color} strokeWidth={SW}/><Rect x="11" y="14" width="3" height="6" stroke={color} strokeWidth={SW}/><Rect x="16" y="14" width="3" height="6" stroke={color} strokeWidth={SW}/></Svg>
);
const IcoBook    = ({ size=13, color=C.navyMid }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke={color} strokeWidth={SW} strokeLinecap="round"/><Path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke={color} strokeWidth={SW} strokeLinejoin="round"/></Svg>
);
const IcoLock    = ({ size=28, color=C.red     }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth={SW}/><Path d="M7 11V7a5 5 0 0110 0v4" stroke={color} strokeWidth={SW} strokeLinecap="round"/></Svg>
);
const IcoTimer   = ({ size=10, color=C.greenDark}: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={SW}/><Path d="M12 7v5l3 3" stroke={color} strokeWidth={SW} strokeLinecap="round"/></Svg>
);
const IcoPkg     = ({ size=10, color=C.navyMid }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke={color} strokeWidth={SW} strokeLinejoin="round"/></Svg>
);
const IcoCamera  = ({ size=20, color=C.slate500 }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/><Circle cx="12" cy="13" r="4" stroke={color} strokeWidth={SW}/></Svg>
);
const IcoCameraRotate = ({ size=14, color=C.navyMid }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/><Circle cx="12" cy="13" r="4" stroke={color} strokeWidth={SW}/><Path d="M1 4l4 4M5 4v4H1" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/></Svg>
);
const IcoPrint   = ({ size=14, color=C.white }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/><Rect x="6" y="14" width="12" height="8" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/></Svg>
);
const IcoCheckCircle = ({ size=18, color='#2A8734' }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={SW} fill={color} fillOpacity={0.1}/><Path d="M9 12l2 2 4-4" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></Svg>
);
const IcoRefresh = ({ size=14, color=C.navyMid }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M1 4v6h6M23 20v-6h-6" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/><Path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/></Svg>
);
const IcoInfo    = ({ size=10, color=C.greenDark }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={SW}/><Path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth={SW} strokeLinecap="round"/></Svg>
);
const IcoChevDown = ({ size=14, color=C.slate400 }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M6 9l6 6 6-6" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/></Svg>
);

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, visible }: { message: string; type: 'success'|'error'|'info'; visible: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(anim, { toValue: visible ? 1 : 0, duration: 280, useNativeDriver: true }).start(); }, [visible]);
  const bg = type === 'success' ? C.greenDark : type === 'error' ? C.redDark : C.navyMid;
  return (
    <Animated.View style={[ts.wrap, { backgroundColor: bg, opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0,1], outputRange: [-50, 0] }) }] }]}>
      <ThemedText style={ts.text}>{message}</ThemedText>
    </Animated.View>
  );
}
const ts = StyleSheet.create({
  wrap: { position: 'absolute', top: 10, left: 30, right: 30, zIndex: 999, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 11, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 10, elevation: 12 },
  text: { color: C.white, fontSize: 13, fontWeight: '700' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function TraceabilityGanttScreen() {
  const router = useRouter();

  const [loading, setLoading]   = useState(true);
  const [data, setData]         = useState<TraceabilityInitialData | null>(null);
  const [batches, setBatches]   = useState<TraceabilityBatch[]>([]);
  const [viewDate, setViewDate] = useState(new Date());
  const [searchQuery, setSearchQuery]               = useState('');
  const [activeZoneId, setActiveZoneId]             = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen]               = useState(false);
  const [modalType, setModalType]                   = useState<'create' | 'edit'>('create');
  const [selectedProduct, setSelectedProduct]       = useState<Product | null>(null);
  const [selectedBatch, setSelectedBatch]           = useState<TraceabilityBatch | null>(null);
  const [isGlobalCreate, setIsGlobalCreate]         = useState(false);
  const [lotNumber, setLotNumber]                   = useState('');
  const [zone, setZone]                             = useState('');
  const [openedAt, setOpenedAt]                     = useState(new Date());
  const [expiresAt, setExpiresAt]                   = useState(new Date());
  const [status, setStatus]                         = useState<'active' | 'closed'>('active');
  const [showDatePicker, setShowDatePicker]         = useState(false);
  const [dateMode, setDateMode]                     = useState<'opened_at' | 'expires_at'>('opened_at');
  const [isCatalogOpen, setIsCatalogOpen]           = useState(false);
  const [catalogSearch, setCatalogSearch]           = useState('');
  const [isPinOpen, setIsPinOpen]                   = useState(false);
  const [pinCode, setPinCode]                       = useState('');
  const [pinError, setPinError]                     = useState(false);
  const [pendingDeleteId, setPendingDeleteId]       = useState<number | null>(null);

  // ── New States for requested features ──
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [isZoneDropdownOpen, setIsZoneDropdownOpen]   = useState(false);
  const [newProductName, setNewProductName]           = useState('');
  const [newProductCatId, setNewProductCatId]         = useState<number | null>(null);
  const [newProductMaxDlc, setNewProductMaxDlc]       = useState('3');

  const [capturedPhoto, setCapturedPhoto]           = useState<string | null>(null);
  const [existingPhoto, setExistingPhoto]           = useState<string | null>(null);
  const [showPrintSection, setShowPrintSection]     = useState(false);

  const [toastMsg, setToastMsg]     = useState('');
  const [toastType, setToastType]   = useState<'success'|'error'|'info'>('info');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const hScrollRef = useRef<ScrollView>(null);

  const showToast = useCallback((msg: string, type: 'success'|'error'|'info' = 'info') => {
    setToastMsg(msg); setToastType(type); setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 3000);
  }, []);

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const res = await traceabilityApi.getInitialData();
      setData(res);
    } catch (error) {
      const { title, message } = getErrorDetails(error, 'Chargement impossible', 'Impossible de charger les produits.');
      Alert.alert(title, message);
    } finally { setLoading(false); }
  };

  const fetchBatches = useCallback(async () => {
    try {
      const res = await traceabilityApi.getBatches(viewDate.getMonth() + 1, viewDate.getFullYear());
      setBatches(res);
    } catch (error) {
      const { message } = getErrorDetails(error, '', 'Impossible de charger les lots.');
      showToast(message, 'error');
    }
  }, [viewDate]);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  const calcExpiry = (d: Date, days: number) => { const r = new Date(d); r.setDate(r.getDate() + days); return r; };

  const daysInMonth = useMemo(() => new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate(), [viewDate]);

  const changeMonth = (delta: number) => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1));

  const getBatchColor = (b: TraceabilityBatch) => {
    if (b.status === 'closed') return C.blue;
    const exp = new Date(b.expires_at); const now = new Date(); now.setHours(0,0,0,0);
    if (exp < now) return C.red;
    if (Math.ceil((exp.getTime() - now.getTime()) / 86400000) <= 1) return C.amber;
    return C.green;
  };

  const todayX = useMemo(() => {
    const now = new Date();
    if (now.getFullYear() === viewDate.getFullYear() && now.getMonth() === viewDate.getMonth()) return (now.getDate() - 1) * COL_W + COL_W / 2;
    return null;
  }, [viewDate]);

  const filteredProducts = useMemo(() => {
    if (!data) return [];
    return data.products.filter(p => {
      const matchCat = activeZoneId === null || p.category_id === activeZoneId;
      const matchQ   = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQ;
    });
  }, [data, activeZoneId, searchQuery]);

  const catalogFiltered = useMemo(() => {
    if (!data) return [];
    return data.products.filter(p => p.name.toLowerCase().includes(catalogSearch.toLowerCase()));
  }, [data, catalogSearch]);

  // Extrait les zones (si l'API ne renvoie pas data.zones, on utilise les catégories)
  const zonesList = useMemo(() => {
    if (!data) return [];
    // Remplacer data.zones par le vrai nom de clé si différent dans votre API
    return data.zones || data.categories.map(c => c.name);
  }, [data]);

  // ── Create Product Logic ──
  const handleCreateProduct = async () => {
    if (!newProductName.trim()) { showToast('Le nom du produit est requis', 'error'); return; }
    try {
      // @ts-ignore - Adapter le nom de la méthode si différent dans votre API
      await traceabilityApi.storeProduct({
        name: newProductName.trim(),
        category_id: newProductCatId,
        max_dlc: parseInt(newProductMaxDlc) || 3
      });
      showToast('Produit ajouté avec succès', 'success');
      setIsCreateProductOpen(false);
      resetCreateProductForm();
      await fetchInitialData(); // Refresh data

      // Auto-sélectionner le nouveau produit si on vient de la modal de lot
      const createdProd = data?.products.find(p => p.name.toLowerCase() === newProductName.trim().toLowerCase());
      if (createdProd && isModalOpen) {
        setSelectedProduct(createdProd);
        setExpiresAt(calcExpiry(openedAt, createdProd.max_dlc || 3));
      }
    } catch (error) {
      const { message } = getErrorDetails(error, '', "Impossible d'ajouter le produit.");
      showToast(message, 'error');
    }
  };

  const resetCreateProductForm = () => {
    setNewProductName('');
    setNewProductCatId(null);
    setNewProductMaxDlc('3');
  };

  const openCreateProductFromModal = () => {
    resetCreateProductForm();
    setIsCreateProductOpen(true);
  };

  // ── Photo capture ──
  const startPhotoCapture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la caméra.'); return; }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, base64: false, allowsEditing: false });
      if (!result.canceled && result.assets && result.assets[0]) { setCapturedPhoto(result.assets[0].uri); showToast('Photo enregistrée', 'success'); }
    } catch (error) { const { message } = getErrorDetails(error, '', 'Erreur photo.'); showToast(message, 'error'); }
  };

  const adjustExpiry = (days: number) => { const d = new Date(expiresAt); d.setDate(d.getDate() + days); setExpiresAt(d); };

  // ── Print label ──
  const generateLabelHtml = useCallback(() => {
    const lot = lotNumber || 'SANS LOT'; const prodName = selectedProduct?.name || 'PRODUIT';
    const zoneName = zone || selectedBatch?.zone || '—'; const openDateStr = openedAt.toLocaleDateString('fr-FR'); const dlcDateStr = expiresAt.toLocaleDateString('fr-FR');
    return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=80mm, height=50mm, initial-scale=1.0"><style>@page { size: 80mm 50mm; margin: 0; } @media print { html, body { width: 80mm !important; height: 50mm !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; background: white !important; } body > *:not(.label) { display: none !important; } } * { margin: 0; padding: 0; box-sizing: border-box; } html, body { width: 80mm; height: 50mm; font-family: Arial, sans-serif; background: #fff; } .label { width: 100%; height: 100%; border: 2px solid #000; border-radius: 6px; padding: 3mm; display: flex; flex-direction: column; justify-content: space-between; } .label-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 1mm; margin-bottom: 1mm; } .badge { background: #000; color: #fff; font-size: 7pt; font-weight: bold; padding: 2px 6px; border-radius: 2px; } .zone-badge { border: 1.5px solid #000; padding: 1px 6px; font-size: 7pt; font-weight: bold; border-radius: 4px; } .product-name { font-size: 12pt; font-weight: 900; margin-bottom: 1mm; text-transform: uppercase; } .lot-line { font-size: 8pt; border-bottom: 1px dashed #999; padding-bottom: 1mm; margin-bottom: 1mm; } .lot-number { font-weight: 900; font-size: 9pt; } .open-date { font-size: 7pt; margin-bottom: 1mm; } .dlc-box { border: 2px solid #000; border-radius: 4px; padding: 2mm; text-align: center; margin: 1mm 0; } .dlc-label { font-size: 7pt; font-weight: bold; text-transform: uppercase; } .dlc-date { font-size: 18pt; font-weight: 900; margin-top: 1mm; } .label-footer { display: flex; justify-content: space-between; font-size: 6pt; margin-top: 1mm; } .footer-italic { font-style: italic; font-weight: bold; } .footer-bold { font-weight: 900; text-transform: uppercase; }</style></head><body><div class="label"><div><div class="label-header"><div class="badge">Produit Entamé</div><div class="zone-badge">${zoneName}</div></div><div class="product-name">${prodName}</div><div class="lot-line">LOT: <span class="lot-number">${lot}</span></div></div><div><div class="open-date">OUVERT LE : <strong>${openDateStr}</strong></div><div class="dlc-box"><div class="dlc-label">À consommer avant le</div><div class="dlc-date">${dlcDateStr}</div></div><div class="label-footer"><span class="footer-italic">Opérateur: —</span><span class="footer-bold">Conserver au frais</span></div></div></div></body></html>`;
  }, [lotNumber, selectedProduct, zone, selectedBatch, openedAt, expiresAt]);

  const printDlcLabel = async () => {
    try { await Print.printAsync({ html: generateLabelHtml(), autoSelectPrinter: true }); }
    catch (error) { const { message } = getErrorDetails(error, '', "Erreur d'impression."); showToast(message, 'error'); }
  };

  useEffect(() => { if (modalType === 'edit') setShowPrintSection(status === 'active'); else setShowPrintSection(false); }, [status, modalType]);

  const openCreateModal = (product: Product | null, dateStr?: string) => {
    setSelectedProduct(product); setIsGlobalCreate(product === null); setModalType('create'); setLotNumber(''); setZone('');
    const d = dateStr ? new Date(dateStr) : new Date(); setOpenedAt(d); setExpiresAt(calcExpiry(d, product?.max_dlc || 3));
    setCapturedPhoto(null); setExistingPhoto(null); setShowPrintSection(false); setIsZoneDropdownOpen(false); setIsModalOpen(true);
  };

  const openEditModal = (batch: TraceabilityBatch, product: Product) => {
    setSelectedProduct(product); setSelectedBatch(batch); setIsGlobalCreate(false); setModalType('edit'); setLotNumber(batch.lot_number); setZone(batch.zone || '');
    setOpenedAt(new Date(batch.opened_at)); setExpiresAt(new Date(batch.expires_at)); setStatus(batch.status);
    setCapturedPhoto(null); setExistingPhoto(batch.photo || null); setShowPrintSection(batch.status === 'active'); setIsZoneDropdownOpen(false); setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedProduct || !lotNumber) { showToast('Veuillez renseigner le numéro de lot.', 'error'); return; }
    try {
      if (modalType === 'create') {
        await traceabilityApi.storeBatch({ product_id: selectedProduct.id, lot_number: lotNumber, zone: zone || null, opened_at: openedAt.toISOString().split('T')[0], photo: capturedPhoto });
        showToast('Nouveau lot déclaré', 'success');
      } else if (selectedBatch) {
        await traceabilityApi.updateBatch(selectedBatch.id, { lot_number: lotNumber, zone: zone || null, expires_at: expiresAt.toISOString().split('T')[0], status, photo: capturedPhoto || existingPhoto });
        showToast('Lot mis à jour', 'success');
      }
      setIsModalOpen(false); fetchBatches();
    } catch (error) { const { message } = getErrorDetails(error, '', "Échec de l'enregistrement."); showToast(message, 'error'); }
  };

  const requestDelete = () => { if (!selectedBatch) return; setPendingDeleteId(selectedBatch.id); setPinCode(''); setPinError(false); setIsPinOpen(true); };

  const confirmPin = async () => {
    if (pinCode !== PIN_CORRECT) { setPinError(true); setPinCode(''); return; }
    setIsPinOpen(false);
    if (pendingDeleteId !== null) {
      try { await traceabilityApi.deleteBatch(pendingDeleteId); setIsModalOpen(false); fetchBatches(); showToast('Lot supprimé', 'info'); }
      catch { showToast('Erreur suppression', 'error'); }
    }
  };

  // ── Gantt row ─────────────────────────────────────────────────────────────
  const renderGanttRow = ({ item: prod }: { item: Product }) => {
    const prodBatches = batches.filter(b => b.product_id === prod.id);
    const monthStart  = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getTime();
    const monthEnd    = new Date(viewDate.getFullYear(), viewDate.getMonth(), daysInMonth, 23, 59).getTime();
    let tracks: number[] = []; let maxTrack = 0;
    const sorted = [...prodBatches].sort((a,b) => new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime());
    const processed = sorted.map(batch => {
      const sDate = new Date(batch.opened_at); const eDate = new Date(batch.status === 'closed' && batch.closed_at ? batch.closed_at : batch.expires_at);
      let ti = 0; while (tracks[ti] !== undefined && tracks[ti] >= sDate.getTime()) ti++; tracks[ti] = eDate.getTime(); if (ti > maxTrack) maxTrack = ti;
      return { ...batch, _track: ti };
    });
    const rowH = Math.max(54, (maxTrack + 1) * 30 + 16); const isEven = filteredProducts.indexOf(prod) % 2 === 0;
    return (
      <View style={[st.row, { height: rowH, backgroundColor: isEven ? C.white : '#FAFBFC' }]}>
        <View style={st.leftCell}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}><IcoPkg size={10} color={C.navyMid} /><ThemedText numberOfLines={2} style={st.prodName}>{prod.name}</ThemedText></View>
          <View style={st.dlcPill}><IcoTimer size={10} color={C.greenDark} /><ThemedText style={st.dlcTxt}>{prod.max_dlc || 3}j</ThemedText></View>
        </View>
        <View style={[st.gridArea, { width: daysInMonth * COL_W }]}>
          <View style={st.cellsRow}>{Array.from({ length: daysInMonth }).map((_, i) => { const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), i + 1); const isWE = d.getDay() === 0 || d.getDay() === 6; const dateStr = `${viewDate.getFullYear()}-${(viewDate.getMonth()+1).toString().padStart(2,'0')}-${(i+1).toString().padStart(2,'0')}`; return <TouchableOpacity key={i} style={[st.cell, isWE && st.cellWE]} onPress={() => openCreateModal(prod, dateStr)} />; })}</View>
          {todayX !== null && <View style={[st.todayLine, { left: todayX }]} />}
          {processed.map(batch => {
            const oDate = new Date(batch.opened_at); const cDate = new Date(batch.status === 'closed' && batch.closed_at ? batch.closed_at : batch.expires_at);
            if (cDate.getTime() < monthStart || oDate.getTime() > monthEnd) return null;
            const startDay = oDate.getTime() < monthStart ? 1 : oDate.getDate(); const endDay = cDate.getTime() > monthEnd ? daysInMonth : cDate.getDate();
            const span = Math.max(endDay - startDay + 1, 0.8); const left = (startDay - 1) * COL_W + 2; const width = span * COL_W - 5;
            const top = 8 + batch._track * 29; const color = getBatchColor(batch); const isOverdue = color === C.red;
            return (<TouchableOpacity key={batch.id} style={[st.bar, { left, width, top, backgroundColor: color }]} onPress={() => openEditModal(batch, prod)} activeOpacity={0.85}><ThemedText style={st.barText} numberOfLines={1}>{batch.status === 'closed' ? '✓ ' : isOverdue ? '⚠ ' : ''}{batch.lot_number}</ThemedText>{batch.zone ? <View style={st.barZone}><ThemedText style={st.barZoneTxt}>{batch.zone}</ThemedText></View> : null}</TouchableOpacity>);
          })}
        </View>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <ThemedView style={st.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <Toast message={toastMsg} type={toastType} visible={toastVisible} />

      {/* ── HEADER ── */}
      <View style={st.header}>
        <TouchableOpacity style={st.headerBtn} onPress={() => router.back()} activeOpacity={0.8}><IcoBack size={18} color={C.white} /></TouchableOpacity>
        <View style={st.headerCenter}>
          <View style={st.headerIconWrap}><IcoCal size={18} color={C.white} /></View>
          <View><ThemedText style={st.headerTitle}>PLANNING DLC</ThemedText><ThemedText style={st.headerSub}>Produits entamés</ThemedText></View>
        </View>
        <View style={st.monthPill}>
          <TouchableOpacity style={st.monthBtn} onPress={() => changeMonth(-1)}><IcoChevL size={14} color={C.white} /></TouchableOpacity>
          <ThemedText style={st.monthLabel}>{MONTHS[viewDate.getMonth()].substring(0,4).toUpperCase()} {viewDate.getFullYear()}</ThemedText>
          <TouchableOpacity style={st.monthBtn} onPress={() => changeMonth(1)}><IcoChevR size={14} color={C.white} /></TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={st.loader}><ActivityIndicator size="large" color={C.navyMid} /><ThemedText style={{ marginTop: 12, color: C.slate500, fontWeight: '600' }}>Chargement...</ThemedText></View>
      ) : (
        <View style={st.body}>
          {/* ── SIDEBAR ── */}
          <View style={st.sidebar}>
            <View style={st.sidebarHead}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><IcoIndustry size={13} color={C.navyMid} /><ThemedText style={st.sidebarTitle}>Points de prod.</ThemedText></View></View>
            <View style={st.sidebarSearch}><IcoSearch size={12} color={C.slate400} /><TextInput style={st.sidebarSearchInput} placeholder="Chercher..." placeholderTextColor={C.slate400} value={searchQuery} onChangeText={setSearchQuery} /></View>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 6, padding: 10, paddingBottom: 16 }}>
              <TouchableOpacity style={[st.zoneItem, activeZoneId === null && st.zoneItemActive]} onPress={() => setActiveZoneId(null)} activeOpacity={0.8}><ThemedText style={[st.zoneItemTxt, activeZoneId === null && st.zoneItemTxtActive]} numberOfLines={1}>Tous les produits</ThemedText></TouchableOpacity>
              {data?.categories.map(cat => (<TouchableOpacity key={cat.id} style={[st.zoneItem, activeZoneId === cat.id && st.zoneItemActive]} onPress={() => setActiveZoneId(cat.id)} activeOpacity={0.8}><ThemedText style={[st.zoneItemTxt, activeZoneId === cat.id && st.zoneItemTxtActive]} numberOfLines={2}>{cat.name}</ThemedText></TouchableOpacity>))}
            </ScrollView>

            {/* BOUTONS D'ACTIONS SIDEBAR */}
            <View style={st.sidebarActions}>
              <TouchableOpacity style={st.addProductBtn} onPress={openCreateProductFromModal} activeOpacity={0.8}>
                <IcoPlus size={12} color={C.greenDark} />
                <ThemedText style={st.addProductBtnTxt}>PRODUIT</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={st.catalogBtn} onPress={() => setIsCatalogOpen(true)} activeOpacity={0.8}>
                <IcoBook size={12} color={C.navyMid} />
                <ThemedText style={st.catalogBtnTxt}>CATALOGUE</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── GANTT AREA ── */}
          <View style={st.ganttContainer}>
            <View style={st.legendBar}>
              {[{ c: C.green, l: 'Lot en cours' }, { c: C.blue, l: 'Clôturé' }, { c: C.red, l: 'Périmé' }, { c: C.amber, l: '≤1j' }].map(({ c, l }) => (<View key={l} style={st.legendItem}><View style={[st.legendDot, { backgroundColor: c }]} /><ThemedText style={st.legendLabel}>{l}</ThemedText></View>))}
            </View>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              <ScrollView horizontal ref={hScrollRef} showsHorizontalScrollIndicator={false}>
                <View>
                  <View style={st.ganttHeader}>
                    <View style={st.ganttHeaderLeft}><ThemedText style={st.ganttHeaderLeftTxt}>PRODUITS</ThemedText><View style={st.countBadge}><ThemedText style={st.countBadgeTxt}>{filteredProducts.length}</ThemedText></View></View>
                    <View style={{ flexDirection: 'row' }}>{Array.from({ length: daysInMonth }).map((_, i) => { const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), i+1); const isWE = d.getDay() === 0 || d.getDay() === 6; const isToday = new Date().toDateString() === d.toDateString(); return (<View key={i} style={[st.dayCol, isWE && st.dayColWE, isToday && st.dayColToday]}><ThemedText style={[st.dayName, isToday && st.dayToday]}>{DAYS_SHORT[d.getDay()]}</ThemedText><ThemedText style={[st.dayNum, isToday && st.dayToday]}>{i + 1}</ThemedText></View>); })}</View>
                  </View>
                  <FlatList data={filteredProducts} keyExtractor={item => item.id.toString()} renderItem={renderGanttRow} scrollEnabled={false} ListEmptyComponent={<View style={[st.empty, { width: LEFT_W + daysInMonth * COL_W }]}><ThemedText style={st.emptyTxt}>{searchQuery ? 'Aucun résultat.' : 'Aucun produit.'}</ThemedText></View>} />
                </View>
              </ScrollView>
            </ScrollView>
            <TouchableOpacity style={st.fab} onPress={() => openCreateModal(null)} activeOpacity={0.85}><IcoPlus size={20} color={C.white} /></TouchableOpacity>
          </View>
        </View>
      )}

      {/* ═══════ MODAL: Create / Edit batch ═══════ */}
      <Modal visible={isModalOpen} animationType="slide" transparent onRequestClose={() => setIsModalOpen(false)}>
        <View style={ms.overlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setIsModalOpen(false)} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={ms.sheet}>
            <View style={ms.handle} />
            <View style={[ms.header, { backgroundColor: modalType === 'create' ? C.greenDark : C.blueDark }]}>
              <View><ThemedText style={ms.headerTitle}>{modalType === 'create' ? "Ouverture d'un Lot" : 'Édition du Lot'}</ThemedText>{selectedProduct && !isGlobalCreate && (<ThemedText style={ms.headerSub}>{selectedProduct.name}</ThemedText>)}</View>
              <TouchableOpacity style={ms.closeBtn} onPress={() => setIsModalOpen(false)}><IcoClose size={15} color="rgba(255,255,255,0.7)" /></TouchableOpacity>
            </View>

            <ScrollView style={ms.body} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
              {/* Global product picker */}
              {isGlobalCreate && (
                <View style={ms.field}>
                  <ThemedText style={ms.fieldLabel}>PRODUIT</ThemedText>
                  {/* Bouton Ajouter produit rapide */}
                  <TouchableOpacity style={ms.addProdInModal} onPress={openCreateProductFromModal}>
                    <IcoPlus size={14} color={C.greenDark} />
                    <ThemedText style={ms.addProdInModalTxt}>Ajouter un nouveau produit</ThemedText>
                  </TouchableOpacity>
                  <View style={ms.pickerBox}>
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 160 }}>
                      {data?.products.map(p => { const active = selectedProduct?.id === p.id; return (<TouchableOpacity key={p.id} style={[ms.pickItem, active && ms.pickItemActive]} onPress={() => { setSelectedProduct(p); setExpiresAt(calcExpiry(openedAt, p.max_dlc || 3)); }} activeOpacity={0.8}><ThemedText style={[ms.pickTxt, active && { color: C.white }]}>{p.name}</ThemedText>{active && <IcoCheck size={13} color={C.white} />}</TouchableOpacity>); })}
                    </ScrollView>
                  </View>
                </View>
              )}

              {!isGlobalCreate && selectedProduct && (<View style={ms.prodHL}><ThemedText style={ms.prodHLLabel}>PRODUIT SÉLECTIONNÉ</ThemedText><ThemedText style={ms.prodHLName}>{selectedProduct.name}</ThemedText></View>)}

              {!isGlobalCreate && (<View style={ms.infoRow}><View style={ms.infoCard}><ThemedText style={ms.infoCardLabel}>DATE D'OUVERTURE</ThemedText><ThemedText style={ms.infoCardValue}>{openedAt.toLocaleDateString('fr-FR')}</ThemedText></View><View style={[ms.infoCard, { borderColor: C.navyMid + '40' }]}><ThemedText style={[ms.infoCardLabel, { color: C.navyMid }]}>POINT DE PROD.</ThemedText><ThemedText style={[ms.infoCardValue, { color: C.navyMid }]}>{zone || '—'}</ThemedText></View></View>)}

              <View style={ms.row}>
                <View style={[ms.field, { flex: 1 }]}>
                  <ThemedText style={ms.fieldLabel}>{modalType === 'create' ? 'SAISIR LE N° DE LOT' : 'N° DE LOT'}</ThemedText>
                  <TextInput style={[ms.input, modalType === 'create' && ms.inputGreen]} placeholder="Ex: LOT-12345..." placeholderTextColor={C.slate400} value={lotNumber} onChangeText={setLotNumber} />
                </View>

                {/* ZONE SELECT DROPDOWN */}
                <View style={[ms.field, { flex: 1, zIndex: 20 }]}>
                  <ThemedText style={ms.fieldLabel}>POINT / ZONE</ThemedText>
                  <TouchableOpacity style={ms.selectInput} onPress={() => setIsZoneDropdownOpen(!isZoneDropdownOpen)}>
                    <ThemedText style={[ms.selectText, !zone && { color: C.slate400 }]}>{zone || 'Sélectionner une zone...'}</ThemedText>
                    <IcoChevDown size={14} color={C.slate400} />
                  </TouchableOpacity>
                  {isZoneDropdownOpen && (
                    <View style={ms.dropdownContainer}>
                      <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }} keyboardShouldPersistTaps="handled">
                        {zonesList.length > 0 ? zonesList.map((z, idx) => (
                          <TouchableOpacity key={idx} style={[ms.dropdownItem, zone === z && ms.dropdownItemActive]} onPress={() => { setZone(z); setIsZoneDropdownOpen(false); }}>
                            <ThemedText style={[ms.dropdownItemText, zone === z && { color: C.white }]}>{z}</ThemedText>
                            {zone === z && <IcoCheck size={12} color={C.white} />}
                          </TouchableOpacity>
                        )) : <ThemedText style={{ padding: 15, color: C.slate400, fontSize: 13, textAlign: 'center' }}>Aucune zone configurée</ThemedText>}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>

              <View style={ms.field}>
                <ThemedText style={ms.fieldLabel}>DATE LIMITE (DLC) +{selectedProduct?.max_dlc || 3}j</ThemedText>
                <View style={ms.dlcControl}>
                  <TouchableOpacity style={ms.dlcBtn} onPress={() => adjustExpiry(-1)} activeOpacity={0.7}><IcoMinus size={14} color={C.slate500} /></TouchableOpacity>
                  <View style={ms.dlcDisplay}><ThemedText style={ms.dlcValue}>{expiresAt.toLocaleDateString('fr-FR')}</ThemedText></View>
                  <TouchableOpacity style={ms.dlcBtn} onPress={() => adjustExpiry(1)} activeOpacity={0.7}><IcoPlus size={14} color={C.slate500} /></TouchableOpacity>
                </View>
                <View style={ms.dlcHint}><IcoInfo size={10} color={C.greenDark} /><ThemedText style={ms.dlcHintTxt}>Calculée selon la règle catalogue.</ThemedText></View>
              </View>

              {modalType === 'create' && (
                <View style={ms.photoSection}>
                  <ThemedText style={ms.fieldLabel}>PREUVE DE L'EMBALLAGE (Optionnel)</ThemedText>
                  {capturedPhoto ? (<View style={ms.photoCaptured}><Image source={{ uri: capturedPhoto }} style={ms.photoImage} resizeMode="cover" /><View style={ms.photoCapturedOverlay}><IcoCheckCircle size={18} color="#2A8734" /><ThemedText style={ms.photoCapturedTxt}>Photo enregistrée</ThemedText></View><TouchableOpacity style={ms.photoClearBtn} onPress={() => setCapturedPhoto(null)}><IcoClose size={14} color={C.white} /></TouchableOpacity></View>) : (<TouchableOpacity style={ms.photoCaptureBtn} onPress={startPhotoCapture} activeOpacity={0.8}><IcoCamera size={20} color={C.slate400} /><ThemedText style={ms.photoCaptureTxt}>Prendre l'étiquette en photo</ThemedText></TouchableOpacity>)}
                </View>
              )}

              {modalType === 'edit' && (
                <View style={ms.photoSection}>
                  <ThemedText style={ms.fieldLabel}>PREUVE PHOTO ATTACHÉE</ThemedText>
                  {(capturedPhoto || existingPhoto) ? (<View style={ms.photoCaptured}><Image source={{ uri: capturedPhoto || existingPhoto || '' }} style={ms.photoImage} resizeMode="cover" /><View style={[ms.photoCapturedOverlay, capturedPhoto ? ms.photoCapturedOverlayNew : null]}><IcoCheckCircle size={18} color={capturedPhoto ? "#2A8734" : C.slate600} /><ThemedText style={[ms.photoCapturedTxt, capturedPhoto && { color: '#2A8734' }]}>{capturedPhoto ? 'Nouvelle photo prête' : 'Image actuelle'}</ThemedText></View>{capturedPhoto && (<TouchableOpacity style={ms.photoClearBtn} onPress={() => setCapturedPhoto(null)}><IcoClose size={14} color={C.white} /></TouchableOpacity>)}</View>) : null}
                  <TouchableOpacity style={ms.photoRetakeBtn} onPress={startPhotoCapture} activeOpacity={0.8}><IcoCameraRotate size={14} color={C.navyMid} /><ThemedText style={ms.photoRetakeTxt}>Prendre une nouvelle photo</ThemedText></TouchableOpacity>
                </View>
              )}

              {modalType === 'edit' && (
                <View style={ms.field}>
                  <ThemedText style={ms.fieldLabel}>STATUT DU LOT</ThemedText>
                  <View style={ms.statusRow}>{(['active', 'closed'] as const).map(s => (<TouchableOpacity key={s} style={[ms.statusBtn, status === s && (s === 'active' ? ms.statusBtnGreen : ms.statusBtnBlue)]} onPress={() => setStatus(s)} activeOpacity={0.85}>{status === s && <IcoCheck size={13} color={C.white} />}<ThemedText style={[ms.statusBtnTxt, status === s && { color: C.white }]}>{s === 'active' ? '🟢 En Cours' : '🔵 Clôturé'}</ThemedText></TouchableOpacity>))}</View>
                </View>
              )}

              {modalType === 'edit' && showPrintSection && (
                <View style={ms.printSection}>
                  <ThemedText style={ms.fieldLabel}>APERÇU ÉTIQUETTE D'OUVERTURE</ThemedText>
                  <View style={ms.printPreviewCard}>
                    <View style={ms.labelPreview}>
                      <View style={ms.labelPreviewHeader}><View style={ms.labelBadge}><ThemedText style={ms.labelBadgeTxt}>PRODUIT ENTAMÉ</ThemedText></View><View style={ms.labelZoneBadge}><ThemedText style={ms.labelZoneBadgeTxt}>{zone || selectedBatch?.zone || '—'}</ThemedText></View></View>
                      <ThemedText style={ms.labelProdName} numberOfLines={1}>{selectedProduct?.name}</ThemedText>
                      <View style={ms.labelLotLine}><ThemedText style={ms.labelLotLabel}>LOT: </ThemedText><ThemedText style={ms.labelLotValue}>{lotNumber || 'SANS LOT'}</ThemedText></View>
                      <ThemedText style={ms.labelOpenDate}>Ouvert le : <ThemedText style={{ fontWeight: '800' }}>{openedAt.toLocaleDateString('fr-FR')}</ThemedText></ThemedText>
                      <View style={ms.labelDlcBox}><ThemedText style={ms.labelDlcLabel}>À consommer avant le</ThemedText><ThemedText style={ms.labelDlcDate}>{expiresAt.toLocaleDateString('fr-FR')}</ThemedText></View>
                      <View style={ms.labelFooter}><ThemedText style={ms.labelFooterTxt}>Opérateur: —</ThemedText><ThemedText style={[ms.labelFooterTxt, { fontWeight: '900' }]}>Conserver au frais</ThemedText></View>
                    </View>
                  </View>
                  <TouchableOpacity style={ms.printBtn} onPress={printDlcLabel} activeOpacity={0.85}><IcoPrint size={14} color={C.white} /><ThemedText style={ms.printBtnTxt}>IMPRIMER L'ÉTIQUETTE POUR CE PRODUIT</ThemedText></TouchableOpacity>
                </View>
              )}

              {showDatePicker && (<DateTimePicker value={dateMode === 'opened_at' ? openedAt : expiresAt} mode="date" display="default" onChange={(_, d) => { setShowDatePicker(false); if (d) { if (dateMode === 'opened_at') { setOpenedAt(d); setExpiresAt(calcExpiry(d, selectedProduct?.max_dlc || 3)); } else setExpiresAt(d); } }} />)}
              <View style={{ height: 16 }} />
            </ScrollView>

            <View style={ms.footer}>
              {modalType === 'edit' && (<TouchableOpacity style={ms.deleteBtn} onPress={requestDelete} activeOpacity={0.8}><IcoTrash size={16} color={C.redDark} /></TouchableOpacity>)}
              <TouchableOpacity style={ms.cancelBtn} onPress={() => setIsModalOpen(false)}><ThemedText style={ms.cancelTxt}>ANNULER</ThemedText></TouchableOpacity>
              <TouchableOpacity style={[ms.saveBtn, { backgroundColor: modalType === 'create' ? C.greenDark : C.blueDark }]} onPress={handleSave} activeOpacity={0.85}><ThemedText style={ms.saveTxt}>{modalType === 'create' ? 'OUVRIR LE LOT' : 'METTRE À JOUR'}</ThemedText></TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ═══════ MODAL: Catalogue ═══════ */}
      <Modal visible={isCatalogOpen} animationType="slide" transparent onRequestClose={() => setIsCatalogOpen(false)}>
        <View style={ct.overlay}>
          <View style={ct.sheet}>
            <View style={ct.header}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><IcoBook size={15} color={C.white} /><ThemedText style={ct.headerTitle}>Catalogue Produits</ThemedText></View><TouchableOpacity style={ct.closeBtn} onPress={() => setIsCatalogOpen(false)}><IcoClose size={15} color="rgba(255,255,255,0.7)" /></TouchableOpacity></View>
            <View style={ct.searchWrap}><IcoSearch size={13} color={C.slate400} /><TextInput style={ct.searchInput} placeholder="Rechercher un produit..." placeholderTextColor={C.slate400} value={catalogSearch} onChangeText={setCatalogSearch} /></View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14, gap: 8 }} showsVerticalScrollIndicator={false}>
              {catalogFiltered.map(p => (<View key={p.id} style={ct.item}><View style={{ flex: 1 }}><ThemedText style={ct.itemName}>{p.name}</ThemedText><ThemedText style={ct.itemMeta}>DLC: {p.max_dlc || '—'}j</ThemedText></View><TouchableOpacity style={ct.editBtn} onPress={() => { setIsCatalogOpen(false); openCreateModal(p); }}><IcoPen size={13} color={C.navyMid} /></TouchableOpacity></View>))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══════ MODAL: Ajout Produit Rapide ═══════ */}
      <Modal visible={isCreateProductOpen} animationType="slide" transparent onRequestClose={() => setIsCreateProductOpen(false)}>
        <View style={ap.overlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setIsCreateProductOpen(false)} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={ap.sheet}>
            <View style={ap.handle} />
            <View style={[ap.header, { backgroundColor: C.greenDark }]}>
              <View><ThemedText style={ap.headerTitle}>NOUVEAU PRODUIT</ThemedText></View>
              <TouchableOpacity style={ap.closeBtn} onPress={() => setIsCreateProductOpen(false)}><IcoClose size={15} color="rgba(255,255,255,0.7)" /></TouchableOpacity>
            </View>
            <View style={ap.body}>
              <View style={ap.field}>
                <ThemedText style={ap.fieldLabel}>NOM DU PRODUIT</ThemedText>
                <TextInput style={ap.input} placeholder="Ex: Sauce Bavaroise..." placeholderTextColor={C.slate400} value={newProductName} onChangeText={setNewProductName} />
              </View>
              <View style={ap.field}>
                <ThemedText style={ap.fieldLabel}>CATÉGORIE</ThemedText>
                <View style={[ap.pickerBox, { maxHeight: 150 }]}>
                  <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {data?.categories.map(c => { const active = newProductCatId === c.id; return (<TouchableOpacity key={c.id} style={[ap.pickItem, active && ap.pickItemActive]} onPress={() => setNewProductCatId(c.id)} activeOpacity={0.8}><ThemedText style={[ap.pickTxt, active && { color: C.white }]}>{c.name}</ThemedText>{active && <IcoCheck size={13} color={C.white} />}</TouchableOpacity>); })}
                  </ScrollView>
                </View>
              </View>
              <View style={ap.field}>
                <ThemedText style={ap.fieldLabel}>DLC PAR DÉFAUT (Jours)</ThemedText>
                <View style={ap.dlcControl}>
                  <TouchableOpacity style={ap.dlcBtn} onPress={() => setNewProductMaxDlc(String(Math.max(0, parseInt(newProductMaxDlc) - 1)))}><IcoMinus size={14} color={C.slate500} /></TouchableOpacity>
                  <View style={ap.dlcDisplay}><ThemedText style={ap.dlcValue}>{newProductMaxDlc}j</ThemedText></View>
                  <TouchableOpacity style={ap.dlcBtn} onPress={() => setNewProductMaxDlc(String(parseInt(newProductMaxDlc) + 1))}><IcoPlus size={14} color={C.slate500} /></TouchableOpacity>
                </View>
              </View>
            </View>
            <View style={ap.footer}>
              <TouchableOpacity style={ap.cancelBtn} onPress={() => setIsCreateProductOpen(false)}><ThemedText style={ap.cancelTxt}>ANNULER</ThemedText></TouchableOpacity>
              <TouchableOpacity style={ap.saveBtn} onPress={handleCreateProduct} activeOpacity={0.85}><ThemedText style={ap.saveTxt}>AJOUTER</ThemedText></TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ═══════ MODAL: PIN security ═══════ */}
      <Modal visible={isPinOpen} animationType="fade" transparent onRequestClose={() => setIsPinOpen(false)}>
        <View style={pn.overlay}>
          <View style={pn.card}>
            <View style={pn.iconWrap}><IcoLock size={26} color={C.redDark} /></View>
            <ThemedText style={pn.title}>Sécurité Requise</ThemedText>
            <ThemedText style={pn.sub}>Saisissez le code d'autorisation pour confirmer la suppression.</ThemedText>
            <TextInput style={[pn.input, pinError && pn.inputError]} placeholder="••••" placeholderTextColor={C.slate300} value={pinCode} onChangeText={v => { setPinCode(v); setPinError(false); }} secureTextEntry maxLength={4} keyboardType="numeric" textAlign="center" onSubmitEditing={confirmPin} autoFocus />
            {pinError && <ThemedText style={pn.errorTxt}>Code PIN incorrect</ThemedText>}
            <View style={pn.actions}>
              <TouchableOpacity style={pn.cancelBtn} onPress={() => setIsPinOpen(false)}><ThemedText style={pn.cancelTxt}>ANNULER</ThemedText></TouchableOpacity>
              <TouchableOpacity style={pn.confirmBtn} onPress={confirmPin}><ThemedText style={pn.confirmTxt}>CONFIRMER</ThemedText></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ThemedView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.slate100 },
  header: { backgroundColor: C.navy, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 5, zIndex: 10 },
  headerBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconWrap: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#2A8734', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: C.white, fontSize: 14, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  headerSub: { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '600' },
  monthPill: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 4, paddingVertical: 3 },
  monthBtn: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { color: C.white, fontSize: 9, fontWeight: '900', minWidth: 76, textAlign: 'center', letterSpacing: 1.2 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, flexDirection: 'row' },
  sidebar: { width: SIDEBAR_W, backgroundColor: C.white, borderRightWidth: 1, borderRightColor: C.slate200, flexDirection: 'column' },
  sidebarHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: C.slate100, backgroundColor: C.slate50 },
  sidebarTitle: { fontSize: 10, fontWeight: '900', color: C.navy, textTransform: 'uppercase', letterSpacing: 0.5 },
  sidebarSearch: { flexDirection: 'row', alignItems: 'center', gap: 7, margin: 10, backgroundColor: C.slate50, borderRadius: 10, paddingHorizontal: 10, height: 34, borderWidth: 1, borderColor: C.slate200 },
  sidebarSearchInput: { flex: 1, fontSize: 11, color: C.slate800, fontWeight: '600' },
  zoneItem: { paddingHorizontal: 10, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: C.slate200, backgroundColor: C.white },
  zoneItemActive: { backgroundColor: C.navy, borderColor: C.navy },
  zoneItemTxt: { fontSize: 11, fontWeight: '700', color: C.slate600 },
  zoneItemTxtActive: { color: C.white },
  sidebarActions: { padding: 10, gap: 8, borderTopWidth: 1, borderTopColor: C.slate100 },
  addProductBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, backgroundColor: C.greenBg, borderWidth: 1.5, borderColor: C.greenBd, borderRadius: 10 },
  addProductBtnTxt: { fontSize: 9, fontWeight: '900', color: C.greenDark, letterSpacing: 1 },
  catalogBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, backgroundColor: C.white, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.navyMid + '80', borderRadius: 10 },
  catalogBtnTxt: { fontSize: 9, fontWeight: '900', color: C.navyMid, letterSpacing: 1 },
  ganttContainer: { flex: 1, backgroundColor: C.white, position: 'relative' },
  legendBar: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: C.slate50, borderBottomWidth: 1, borderBottomColor: C.slate200 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 10, fontWeight: '700', color: C.slate600 },
  ganttHeader: { flexDirection: 'row', backgroundColor: C.slate50, borderBottomWidth: 1.5, borderBottomColor: C.slate200 },
  ganttHeaderLeft: { width: LEFT_W, padding: 10, borderRightWidth: 1.5, borderRightColor: C.slate200, flexDirection: 'row', alignItems: 'center', gap: 6 },
  ganttHeaderLeftTxt: { fontSize: 9, fontWeight: '900', color: C.slate400, letterSpacing: 1.2, textTransform: 'uppercase' },
  countBadge: { backgroundColor: C.navy, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  countBadgeTxt: { fontSize: 9, fontWeight: '700', color: C.white },
  dayCol: { width: COL_W, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, borderRightWidth: 1, borderRightColor: C.slate100 },
  dayColWE: { backgroundColor: '#F5F7FA' },
  dayColToday: { backgroundColor: C.blueBg },
  dayName: { fontSize: 8, fontWeight: '700', color: C.slate400, textTransform: 'uppercase' },
  dayNum: { fontSize: 12, fontWeight: '800', color: C.slate500, marginTop: 1 },
  dayToday: { color: C.blueDark, fontWeight: '900' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.slate100 },
  leftCell: { width: LEFT_W, padding: 10, borderRightWidth: 1.5, borderRightColor: C.slate200, justifyContent: 'center' },
  prodName: { fontSize: 11, fontWeight: '700', color: C.navy, lineHeight: 14, flex: 1 },
  dlcPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.greenBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', borderWidth: 1, borderColor: C.greenBd },
  dlcTxt: { fontSize: 9, fontWeight: '800', color: C.greenDark },
  gridArea: { position: 'relative', overflow: 'hidden' },
  cellsRow: { flexDirection: 'row', height: '100%' },
  cell: { width: COL_W, borderRightWidth: 1, borderRightColor: '#F8FAFC', height: '100%' },
  cellWE: { backgroundColor: '#F8FAFC' },
  todayLine: { position: 'absolute', top: 0, bottom: 0, width: 1.5, backgroundColor: C.blueDark + '70', zIndex: 1 },
  bar: { position: 'absolute', height: 24, borderRadius: 6, justifyContent: 'center', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, gap: 4, overflow: 'hidden', zIndex: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 3, elevation: 3 },
  barText: { fontSize: 9, fontWeight: '800', color: C.white, flex: 1 },
  barZone: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 },
  barZoneTxt: { fontSize: 8, fontWeight: '700', color: C.white },
  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyTxt: { color: C.slate400, fontSize: 13, fontWeight: '700' },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 52, height: 52, borderRadius: 26, backgroundColor: '#2A8734', alignItems: 'center', justifyContent: 'center', shadowColor: '#2A8734', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
});

const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(19,56,94,0.75)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '95%', paddingBottom: Platform.OS === 'ios' ? 36 : 20 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.slate200, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 15, fontWeight: '900', color: C.white, textTransform: 'uppercase', letterSpacing: 0.5 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '600', marginTop: 2 },
  closeBtn: { width: 28, height: 28, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 20, paddingTop: 14 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 9, fontWeight: '900', color: C.slate400, letterSpacing: 1, marginBottom: 7, textTransform: 'uppercase' },
  input: { backgroundColor: C.slate50, borderWidth: 1.5, borderColor: C.slate200, borderRadius: 12, padding: 12, fontSize: 14, fontWeight: '600', color: C.slate900 },
  inputGreen: { borderColor: C.greenBd, backgroundColor: C.greenBg },
  row: { flexDirection: 'row', gap: 10 },
  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  infoCard: { flex: 1, backgroundColor: C.slate50, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.slate200 },
  infoCardLabel: { fontSize: 8, fontWeight: '800', color: C.slate400, letterSpacing: 0.5, marginBottom: 4, textTransform: 'uppercase' },
  infoCardValue: { fontSize: 13, fontWeight: '900', color: C.slate700 },
  dlcControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 12, borderWidth: 1.5, borderColor: C.slate200, overflow: 'hidden', height: 48 },
  dlcBtn: { width: 48, height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: C.slate50, borderRightWidth: 1, borderRightColor: C.slate200 },
  dlcDisplay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dlcValue: { fontSize: 14, fontWeight: '900', color: C.slate800 },
  dlcHint: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  dlcHintTxt: { fontSize: 9, color: C.slate400, fontWeight: '600' },
  pickerBox: { backgroundColor: C.slate50, borderRadius: 12, borderWidth: 1, borderColor: C.slate200, overflow: 'hidden' },
  pickItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 11, borderBottomWidth: 1, borderBottomColor: C.slate100 },
  pickItemActive: { backgroundColor: C.navy },
  pickTxt: { fontSize: 14, fontWeight: '600', color: C.slate700 },
  prodHL: { backgroundColor: C.blueBg, borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: C.blueBd },
  prodHLLabel: { fontSize: 9, fontWeight: '800', color: C.navyMid, letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' },
  prodHLName: { fontSize: 15, fontWeight: '900', color: C.navy },

  // Add product in modal
  addProdInModal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, backgroundColor: C.greenBg, borderWidth: 1.5, borderColor: C.greenBd, borderRadius: 10, marginBottom: 8 },
  addProdInModalTxt: { fontSize: 12, fontWeight: '700', color: C.greenDark },

  // Zone Dropdown
  selectInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.slate50, borderWidth: 1.5, borderColor: C.slate200, borderRadius: 12, padding: 12, height: 48 },
  selectText: { fontSize: 14, fontWeight: '600', color: C.slate900 },
  dropdownContainer: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: C.slate200, marginTop: 4, zIndex: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  dropdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.slate100 },
  dropdownItemActive: { backgroundColor: C.navy },
  dropdownItemText: { fontSize: 14, fontWeight: '600', color: C.slate700 },

  photoSection: { marginBottom: 14 },
  photoCaptureBtn: { width: '100%', height: 64, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: C.slate300, backgroundColor: C.slate50, alignItems: 'center', justifyContent: 'center', gap: 8 },
  photoCaptureTxt: { fontSize: 12, fontWeight: '700', color: C.slate500 },
  photoCaptured: { width: '100%', height: 160, borderRadius: 12, borderWidth: 2, borderColor: '#2A8734', overflow: 'hidden', position: 'relative' },
  photoImage: { width: '100%', height: '100%' },
  photoCapturedOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.92)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 },
  photoCapturedOverlayNew: { backgroundColor: 'rgba(240,253,244,0.95)' },
  photoCapturedTxt: { fontSize: 10, fontWeight: '800', color: C.slate600, textTransform: 'uppercase' },
  photoClearBtn: { position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  photoRetakeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, backgroundColor: C.slate50, borderRadius: 10, borderWidth: 1, borderColor: C.slate200, borderStyle: 'dashed', marginTop: 8 },
  photoRetakeTxt: { fontSize: 11, fontWeight: '700', color: C.navyMid },
  statusRow: { flexDirection: 'row', gap: 10 },
  statusBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: C.slate200, backgroundColor: C.white },
  statusBtnGreen: { backgroundColor: C.greenDark, borderColor: C.greenDark },
  statusBtnBlue: { backgroundColor: C.blueDark, borderColor: C.blueDark },
  statusBtnTxt: { fontSize: 13, fontWeight: '700', color: C.slate600 },
  printSection: { paddingTop: 14, borderTopWidth: 1, borderTopColor: C.slate200, marginBottom: 14 },
  printPreviewCard: { alignItems: 'center', marginBottom: 12 },
  printBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.slate800, borderRadius: 12, paddingVertical: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  printBtnTxt: { fontSize: 12, fontWeight: '900', color: C.white, letterSpacing: 0.5 },
  labelPreview: { width: 280, height: 170, borderWidth: 2.5, borderColor: C.black, borderRadius: 4, padding: 10, backgroundColor: C.white, justifyContent: 'space-between' },
  labelPreviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 6, borderBottomWidth: 2, borderBottomColor: C.black, marginBottom: 4 },
  labelBadge: { backgroundColor: C.black, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2 },
  labelBadgeTxt: { fontSize: 7, fontWeight: '800', color: C.white, textTransform: 'uppercase', letterSpacing: 0.3 },
  labelZoneBadge: { borderWidth: 1, borderColor: C.black, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 2 },
  labelZoneBadgeTxt: { fontSize: 7, fontWeight: '800', color: C.black, textTransform: 'uppercase' },
  labelProdName: { fontSize: 13, fontWeight: '900', color: C.black, textTransform: 'uppercase', lineHeight: 15, marginBottom: 2 },
  labelLotLine: { flexDirection: 'row', borderBottomWidth: 1, borderStyle: 'dashed', borderBottomColor: C.slate400, paddingBottom: 4, marginBottom: 4 },
  labelLotLabel: { fontSize: 9, fontWeight: '700', color: C.black },
  labelLotValue: { fontSize: 11, fontWeight: '900', color: C.black },
  labelOpenDate: { fontSize: 8, fontWeight: '600', color: C.black, marginBottom: 4 },
  labelDlcBox: { borderWidth: 2.5, borderColor: C.black, backgroundColor: '#F9FAFB', paddingVertical: 4, paddingHorizontal: 6, alignItems: 'center' },
  labelDlcLabel: { fontSize: 7, fontWeight: '900', color: C.slate600, textTransform: 'uppercase', letterSpacing: 0.3 },
  labelDlcDate: { fontSize: 20, fontWeight: '900', color: C.black, lineHeight: 22 },
  labelFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  labelFooterTxt: { fontSize: 7, fontWeight: '600', color: C.slate700 },
  footer: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 13, gap: 10, borderTopWidth: 1, borderTopColor: C.slate100 },
  deleteBtn: { width: 46, height: 46, borderRadius: 12, backgroundColor: C.redBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.redBd },
  cancelBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.slate100, borderRadius: 12, paddingVertical: 13 },
  cancelTxt: { color: C.slate600, fontSize: 12, fontWeight: '800' },
  saveBtn: { flex: 2, borderRadius: 12, paddingVertical: 14, alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  saveTxt: { color: C.white, fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
});

const ct = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(19,56,94,0.75)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', paddingBottom: Platform.OS === 'ios' ? 32 : 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.navyMid, paddingHorizontal: 20, paddingVertical: 15, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  headerTitle: { fontSize: 15, fontWeight: '900', color: C.white, textTransform: 'uppercase', letterSpacing: 0.5 },
  closeBtn: { width: 28, height: 28, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 13, backgroundColor: C.slate50, borderRadius: 12, paddingHorizontal: 12, height: 40, borderWidth: 1, borderColor: C.slate200 },
  searchInput: { flex: 1, fontSize: 13, color: C.slate800, fontWeight: '500' },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.slate200, gap: 10 },
  itemName: { fontSize: 12, fontWeight: '800', color: C.navy, textTransform: 'uppercase' },
  itemMeta: { fontSize: 10, color: C.slate400, fontWeight: '600', marginTop: 2 },
  editBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: C.blueBg, alignItems: 'center', justifyContent: 'center' },
});

// Styles spécifiques pour la modal d'ajout de produit
const ap = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(19,56,94,0.75)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '85%', paddingBottom: Platform.OS === 'ios' ? 36 : 20 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.slate200, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: C.greenDark, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  headerTitle: { fontSize: 15, fontWeight: '900', color: C.white, textTransform: 'uppercase', letterSpacing: 0.5 },
  closeBtn: { width: 28, height: 28, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 20, paddingTop: 14, gap: 10 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 9, fontWeight: '900', color: C.slate400, letterSpacing: 1, marginBottom: 7, textTransform: 'uppercase' },
  input: { backgroundColor: C.slate50, borderWidth: 1.5, borderColor: C.slate200, borderRadius: 12, padding: 12, fontSize: 14, fontWeight: '600', color: C.slate900 },
  pickerBox: { backgroundColor: C.slate50, borderRadius: 12, borderWidth: 1, borderColor: C.slate200, overflow: 'hidden' },
  pickItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 11, borderBottomWidth: 1, borderBottomColor: C.slate100 },
  pickItemActive: { backgroundColor: C.navy },
  pickTxt: { fontSize: 14, fontWeight: '600', color: C.slate700 },
  dlcControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 12, borderWidth: 1.5, borderColor: C.slate200, overflow: 'hidden', height: 48 },
  dlcBtn: { width: 48, height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: C.slate50, borderRightWidth: 1, borderRightColor: C.slate200 },
  dlcDisplay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dlcValue: { fontSize: 16, fontWeight: '900', color: C.slate800 },
  footer: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 13, gap: 10, borderTopWidth: 1, borderTopColor: C.slate100 },
  cancelBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.slate100, borderRadius: 12, paddingVertical: 13 },
  cancelTxt: { color: C.slate600, fontSize: 12, fontWeight: '800' },
  saveBtn: { flex: 2, backgroundColor: C.greenDark, borderRadius: 12, paddingVertical: 14, alignItems: 'center', shadowColor: C.greenDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  saveTxt: { color: C.white, fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
});

const pn = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.9)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: C.white, borderRadius: 28, padding: 28, width: '100%', maxWidth: 340, alignItems: 'center', borderTopWidth: 4, borderTopColor: C.redDark, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 12 },
  iconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: C.redBg, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 17, fontWeight: '900', color: C.navy, textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' },
  sub: { fontSize: 12, fontWeight: '600', color: C.slate500, textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  input: { width: '100%', backgroundColor: C.slate50, borderWidth: 2, borderColor: C.slate200, borderRadius: 14, paddingVertical: 16, fontSize: 26, fontWeight: '900', color: C.navy, letterSpacing: 12, marginBottom: 6 },
  inputError: { borderColor: C.redDark, backgroundColor: C.redBg },
  errorTxt: { fontSize: 11, fontWeight: '700', color: C.redDark, marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 8 },
  cancelBtn: { flex: 1, padding: 13, backgroundColor: C.slate100, borderRadius: 12, alignItems: 'center' },
  cancelTxt: { fontSize: 13, fontWeight: '800', color: C.slate600 },
  confirmBtn: { flex: 1.5, padding: 13, backgroundColor: C.redDark, borderRadius: 12, alignItems: 'center', shadowColor: C.redDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  confirmTxt: { fontSize: 13, fontWeight: '900', color: C.white },
});