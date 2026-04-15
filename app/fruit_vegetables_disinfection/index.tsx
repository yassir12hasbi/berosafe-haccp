import React, { useState, useEffect, useMemo } from 'react';
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
  useWindowDimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import frVegApi, { DisinfectionCatalog, Product } from '../../api/fr_veg';
import Svg, { Path, Circle, Rect, Polyline } from 'react-native-svg';

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const C = {
  navy:        '#1A3B6E',
  navyLight:   '#234F91',
  blueBg:      '#EFF6FF',
  green:       '#15803D',
  greenBg:     '#F0FDF4',
  greenBorder: '#BBF7D0',
  red:         '#DC2626',
  redBg:       '#FEF2F2',
  redBorder:   '#FECACA',
  orange:      '#C2410C',
  orangeBg:    '#FFF7ED',
  orangeBorder:'#FDBA74',
  white:       '#FFFFFF',
  slate50:     '#F8FAFC',
  slate100:    '#F1F5F9',
  slate200:    '#E2E8F0',
  slate300:    '#CBD5E1',
  slate400:    '#94A3B8',
  slate500:    '#64748B',
  slate600:    '#475569',
  slate700:    '#334155',
  slate800:    '#1E293B',
  slate900:    '#0F172A',
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
type IP = { size?: number; color?: string };
const SW = 1.8;

const IcoBack    = ({ size=20, color=C.white   }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcoSearch  = ({ size=16, color=C.slate400}: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth={SW}/>
    <Path d="M16.5 16.5L21 21" stroke={color} strokeWidth={SW} strokeLinecap="round"/>
  </Svg>
);
const IcoCheck   = ({ size=14, color=C.white   }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcoClose   = ({ size=16, color=C.slate400}: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={SW} strokeLinecap="round"/>
  </Svg>
);
const IcoPlus    = ({ size=16, color=C.navy    }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2.2} strokeLinecap="round"/>
  </Svg>
);
const IcoMinus   = ({ size=18, color=C.slate600}: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12h14" stroke={color} strokeWidth={2.2} strokeLinecap="round"/>
  </Svg>
);
const IcoVial    = ({ size=14, color=C.slate500}: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 2h6v2l-2 2h-2L9 4V2z" stroke={color} strokeWidth={SW} strokeLinejoin="round"/>
    <Path d="M12 6l-5 5v9a2 2 0 002 2h6a2 2 0 002-2v-9l-5-5z" stroke={color} strokeWidth={SW} strokeLinejoin="round"/>
    <Path d="M7 14h10" stroke={color} strokeWidth={SW} strokeLinecap="round"/>
  </Svg>
);
const IcoWarning = ({ size=14, color=C.orange  }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={color} strokeWidth={SW} strokeLinejoin="round"/>
    <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth={SW} strokeLinecap="round"/>
  </Svg>
);
const IcoLeaf    = ({ size=44, color=C.slate300}: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M2 22s5.5-5.5 12-5.5c3 0 6 1.5 8 3.5V3s-3 1.5-6 1.5S10 3 10 3v18z" stroke={color} strokeWidth={SW} strokeLinejoin="round"/>
    <Path d="M2 22s1.5-6 5-9" stroke={color} strokeWidth={SW} strokeLinecap="round"/>
  </Svg>
);
const IcoSave    = ({ size=18, color=C.white   }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke={color} strokeWidth={SW} strokeLinejoin="round"/>
    <Polyline points="17 21 17 13 7 13 7 21" stroke={color} strokeWidth={SW} strokeLinejoin="round"/>
    <Polyline points="7 3 7 8 15 8" stroke={color} strokeWidth={SW} strokeLinejoin="round"/>
  </Svg>
);
const IcoSalad   = ({ size=18, color=C.white   }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" stroke={color} strokeWidth={SW} strokeLinejoin="round"/>
    <Path d="M8 14s1.5 2 4 2 4-2 4-2" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M9 9h.01M15 9h.01" stroke={color} strokeWidth={2} strokeLinecap="round"/>
  </Svg>
);

// ─── Reusable Components ─────────────────────────────────────────────────────
function SearchInput({ value, onChangeText, placeholder }: { value: string; onChangeText: (v: string) => void; placeholder: string }) {
  return (
    <View style={si.wrap}>
      <IcoSearch />
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
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.white, borderRadius: 12, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: C.slate200, marginBottom: 12 },
  input: { flex: 1, fontSize: 14, color: C.slate800, fontWeight: '500' },
});

function SectionTitle({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
      {icon}
      <ThemedText style={{ fontSize: 10, fontWeight: '900', color: C.slate500, textTransform: 'uppercase', letterSpacing: 0.8 }}>
        {label}
      </ThemedText>
    </View>
  );
}

// ─── CELERY RULE helper ───────────────────────────────────────────────────────
const CELERY_IDS = ['L4']; // Mettez à jour selon votre API

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DisinfectionScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 900;

  // ── Data ───────────────────────────────────────────────────────────────────
  const [loading, setLoading]   = useState(true);
  const [catalog, setCatalog]   = useState<DisinfectionCatalog | null>(null);

  // ── Selection ──────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]             = useState('');
  const [selectedProducts, setSelectedProducts]   = useState<string[]>([]);
  const [quantities, setQuantities]               = useState<Record<string, string>>({});

  // ── Modal add product ──────────────────────────────────────────────────────
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newProdName, setNewProdName]             = useState('');

  // ── Protocol ──────────────────────────────────────────────────────────────
  const [timer, setTimer]             = useState(8);
  const [washChecked, setWashChecked] = useState(true);
  const [rinseChecked, setRinseChecked] = useState(true);
  const [selectedPpm, setSelectedPpm] = useState<number | null>(null);
  const [checklist, setChecklist]     = useState({ cl_bacs: true, cl_doseur: true, cl_fuite: true });
  const [comment, setComment]         = useState('');
  const [isSaving, setIsSaving]       = useState(false);

  // ── Celery rule ─────────────────────────────────────────────────────────
  const hasCelery  = selectedProducts.some(id => CELERY_IDS.includes(id));
  const hasOthers  = selectedProducts.some(id => !CELERY_IDS.includes(id));
  const showCeleryWarning = hasCelery || hasOthers;

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await frVegApi.getInitialData();
        setCatalog(data);
      } catch {
        Alert.alert('Erreur', 'Impossible de charger le catalogue de produits.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const toggleProduct = (id: string) => {
    const isSelected = selectedProducts.includes(id);
    if (isSelected) {
      setSelectedProducts(prev => prev.filter(p => p !== id));
      setQuantities(prev => { const n = { ...prev }; delete n[id]; return n; });
    } else {
      setSelectedProducts(prev => [...prev, id]);
    }
  };

  const handleAddProduct = () => {
    if (!newProdName.trim() || !catalog) return;
    const newId = 'FL' + Date.now(); // FL pour Fruits & Légumes
    setCatalog(prev => prev ? { ...prev, 'Légumes': [...prev['Légumes'], { id: newId, name: newProdName.trim() }] } : null);
    setIsAddModalVisible(false);
    setNewProdName('');
  };

  const resetProtocol = () => {
    setSelectedProducts([]); setQuantities({}); setComment('');
    setSelectedPpm(null); setTimer(8); setWashChecked(true); setRinseChecked(true);
    setChecklist({ cl_bacs: true, cl_doseur: true, cl_fuite: true });
  };

  const handleSave = async () => {
    if (!catalog) return;
    if (selectedProducts.length === 0) return Alert.alert('Erreur', 'Sélectionnez au moins un produit.');
    if (selectedProducts.some(id => !quantities[id] || parseFloat(quantities[id]) <= 0))
      return Alert.alert('Erreur', 'Veuillez saisir une quantité pour chaque produit.');
    if (!washChecked || !rinseChecked)
      return Alert.alert('Attention', 'Veuillez cocher le lavage et le rinçage.');
    if (!selectedPpm)
      return Alert.alert('Erreur', 'Veuillez sélectionner le résultat de la bandelette.');

    setIsSaving(true);
    try {
      const allProducts = [...(catalog['Légumes'] ?? []), ...(catalog['Fruits'] ?? [])];
      await frVegApi.saveProtocol({
        date: new Date().toISOString(),
        products: selectedProducts.map(id => {
          const product = allProducts.find(p => p.id === id);
          return { id, name: product?.name ?? 'Inconnu', qty: quantities[id] ?? '0' };
        }),
        lavage: washChecked,
        rincage: rinseChecked,
        timer,
        chlorinePpm: selectedPpm,
        checklist,
        comment,
        user: 'Chef',
      });
      Alert.alert('Succès', 'Protocole enregistré avec succès !');
      resetProtocol();
    } catch {
      Alert.alert('Erreur', "Impossible d'enregistrer le protocole.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Filtered products (Flat list combined) ────────────────────────────────
  const filteredProducts = useMemo(() => {
    if (!catalog) return [];
    const q = searchQuery.toLowerCase();
    return [...(catalog['Légumes'] ?? []), ...(catalog['Fruits'] ?? [])].filter(p => p.name.toLowerCase().includes(q));
  }, [catalog, searchQuery]);

  // ── All products flat (for right panel lookup) ────────────────────────────
  const allProducts: Product[] = useMemo(
    () => [...(catalog?.['Légumes'] ?? []), ...(catalog?.['Fruits'] ?? [])],
    [catalog]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: product item
  // ─────────────────────────────────────────────────────────────────────────
  const renderProduct = (item: Product) => {
    const isSelected  = selectedProducts.includes(item.id);
    const isCelery    = CELERY_IDS.includes(item.id);
    const isDisabled  = (hasCelery && !isCelery) || (hasOthers && isCelery);

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          st.prodItem,
          isSelected  && st.prodItemSelected,
          isDisabled  && st.prodItemDisabled,
          !isSelected && !isDisabled && st.prodItemDefault,
        ]}
        onPress={() => !isDisabled && toggleProduct(item.id)}
        activeOpacity={0.8}
      >
        <ThemedText
          style={[st.prodName, isSelected && { color: C.green }, isDisabled && { color: C.slate300 }]}
          numberOfLines={2}
        >
          {item.name}
        </ThemedText>
        {isSelected
          ? <View style={st.prodCheckCircle}><IcoCheck size={12} color={C.green} /></View>
          : <View style={st.prodEmptyCircle} />
        }
      </TouchableOpacity>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: left panel (product selector)
  // ─────────────────────────────────────────────────────────────────────────
  const renderLeftPanel = () => {
    if (!catalog) return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.navy} />
      </View>
    );

    return (
      <View style={st.leftPanel}>
        <SearchInput value={searchQuery} onChangeText={setSearchQuery} placeholder="Rechercher un produit..." />

        {/* Add product button */}
        <TouchableOpacity style={st.btnAddProduct} onPress={() => setIsAddModalVisible(true)} activeOpacity={0.8}>
          <IcoPlus size={14} color={C.navy} />
          <ThemedText style={st.btnAddProductText}>Ajouter un produit</ThemedText>
        </TouchableOpacity>

        {/* Celery warning */}
        {showCeleryWarning && (
          <View style={st.warningBox}>
            <IcoWarning size={13} color={C.orange} />
            <ThemedText style={st.warningText}>Le céleri doit être traité seul (bain unique).</ThemedText>
          </View>
        )}

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={st.grid}>
            {filteredProducts.length > 0
              ? filteredProducts.map(renderProduct)
              : <ThemedText style={st.noResult}>Aucun résultat</ThemedText>
            }
          </View>
        </ScrollView>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: right panel (protocol form)
  // ─────────────────────────────────────────────────────────────────────────
  const renderRightPanel = () => {
    if (selectedProducts.length === 0) {
      return (
        <View style={st.rightPanel}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 }}>
            <IcoLeaf size={44} color={C.slate300} />
            <ThemedText style={{ fontSize: 16, fontWeight: '800', color: C.slate400 }}>Aucun produit sélectionné</ThemedText>
            <ThemedText style={{ fontSize: 13, color: C.slate500, textAlign: 'center' }}>
              Sélectionnez des fruits ou légumes {isLargeScreen ? 'à gauche' : 'ci-dessus'} pour démarrer le protocole.
            </ThemedText>
          </View>
        </View>
      );
    }

    if (!catalog) return <View style={st.rightPanel}><ActivityIndicator color={C.navy} /></View>;

    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={st.rightPanel} contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

          {/* ── Quantités ── */}
          <View style={st.section}>
            <SectionTitle label="Quantités à traiter" icon={<IcoVial />} />
            <View style={st.qtyGrid}>
              {selectedProducts.map(id => {
                const product = allProducts.find(p => p.id === id);
                if (!product) return null;
                return (
                  <View key={id} style={st.qtyCard}>
                    <ThemedText style={st.qtyName} numberOfLines={1}>{product.name}</ThemedText>
                    <View style={st.qtyInputWrap}>
                      <TextInput
                        style={st.qtyInput}
                        placeholder="0.0"
                        placeholderTextColor={C.slate400}
                        keyboardType="decimal-pad"
                        value={quantities[id] ?? ''}
                        onChangeText={v => setQuantities(p => ({ ...p, [id]: v }))}
                        selectTextOnFocus
                      />
                      <ThemedText style={st.qtyUnit}>Kg</ThemedText>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ── Protocole ── */}
          <View style={st.section}>
            <SectionTitle label="Protocole de désinfection" />

            {/* Step 1: Lavage */}
            <TouchableOpacity style={[st.stepCard, washChecked && st.stepCardDone]} onPress={() => setWashChecked(v => !v)} activeOpacity={0.8}>
              <View style={st.stepLeft}>
                <View style={st.stepBadge}><ThemedText style={st.stepNum}>1</ThemedText></View>
                <View>
                  <ThemedText style={st.stepTitle}>Pré-lavage à l'eau claire</ThemedText>
                  <ThemedText style={st.stepSub}>Élimination terre & résidus</ThemedText>
                </View>
              </View>
              <View style={[st.checkbox, washChecked ? st.checkboxDone : st.checkboxPending]}>
                {washChecked ? <IcoCheck size={13} color={C.white} /> : <IcoClose size={13} color={C.orange} />}
              </View>
            </TouchableOpacity>

            {/* Step 2: Timer */}
            <View style={st.stepCard}>
              <View style={st.stepLeft}>
                <View style={st.stepBadge}><ThemedText style={st.stepNum}>2</ThemedText></View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <ThemedText style={st.stepTitle}>Temps de trempage</ThemedText>
                    <View style={st.timerBadge}><ThemedText style={st.timerBadgeText}>Standard: 8-10 min</ThemedText></View>
                  </View>
                </View>
              </View>
              <View style={st.timerControl}>
                <TouchableOpacity style={st.timerBtn} onPress={() => setTimer(t => Math.max(1, t - 1))}>
                  <IcoMinus size={16} color={C.slate500} />
                </TouchableOpacity>
                <View style={st.timerDisplay}>
                  <ThemedText style={st.timerValue}>{timer}</ThemedText>
                  <ThemedText style={st.timerUnit}>min</ThemedText>
                </View>
                <TouchableOpacity style={st.timerBtn} onPress={() => setTimer(t => t + 1)}>
                  <IcoPlus size={16} color={C.navy} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Step 3: Rinçage */}
            <TouchableOpacity style={[st.stepCard, rinseChecked && st.stepCardDone]} onPress={() => setRinseChecked(v => !v)} activeOpacity={0.8}>
              <View style={st.stepLeft}>
                <View style={st.stepBadge}><ThemedText style={st.stepNum}>3</ThemedText></View>
                <View>
                  <ThemedText style={st.stepTitle}>Rinçage final</ThemedText>
                  <ThemedText style={st.stepSub}>Élimination désinfectant</ThemedText>
                </View>
              </View>
              <View style={[st.checkbox, rinseChecked ? st.checkboxDone : st.checkboxPending]}>
                {rinseChecked ? <IcoCheck size={13} color={C.white} /> : <IcoClose size={13} color={C.orange} />}
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Contrôle Chlore ── */}
          <View style={st.section}>
            <SectionTitle label="Contrôle Chlore (ppm)" icon={<IcoVial />} />
            <View style={st.stripRow}>
              {([10, 50, 100, 150, 200] as const).map(val => {
                const shades: Record<number, string> = { 10: C.slate100, 50: '#988d9e', 100: '#6c6878', 150: '#423f51', 200: '#232537' };
                const active = selectedPpm === val;
                return (
                  <TouchableOpacity key={val} style={st.stripCol} onPress={() => setSelectedPpm(val)} activeOpacity={0.8}>
                    <ThemedText style={[st.stripVal, active && { color: C.navy, fontWeight: '900' }]}>{val}</ThemedText>
                    <View style={[st.stripBlock, { backgroundColor: shades[val] }, active && st.stripBlockActive]}>
                      {active && <IcoCheck size={14} color={C.white} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedPpm && (
              <View style={[
                st.alertBox,
                selectedPpm < 100  && st.alertBoxWarning,
                selectedPpm > 100  && st.alertBoxDanger,
                selectedPpm === 100 && st.alertBoxSuccess,
              ]}>
                <View style={[st.alertIcon, {
                  backgroundColor: selectedPpm < 100 ? C.orange : selectedPpm > 100 ? C.red : C.green
                }]}>
                  {selectedPpm === 100 ? <IcoCheck size={13} color={C.white} /> : <IcoWarning size={13} color={C.white} />}
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={[st.alertTitle, {
                    color: selectedPpm < 100 ? C.orange : selectedPpm > 100 ? C.red : C.green
                  }]}>
                    {selectedPpm < 100 ? 'Concentration insuffisante' : selectedPpm > 100 ? 'Concentration trop élevée' : 'Dosage conforme'}
                  </ThemedText>
                  <ThemedText style={st.alertDesc}>
                    {selectedPpm < 100 ? 'Ajustez le dosage de désinfectant.' : selectedPpm > 100 ? 'Rincez abondamment et diluez le bac.' : 'La concentration est optimale.'}
                  </ThemedText>
                </View>
              </View>
            )}
          </View>

          {/* ── Contrôle installations ── */}
          <View style={st.section}>
            <SectionTitle label="Contrôle des installations" />
            {([
              { k: 'cl_bacs',   l: "État de propreté des bacs satisfaisant" },
              { k: 'cl_doseur', l: "Doseur de désinfectant fonctionnel" },
              { k: 'cl_fuite',  l: "Absence de fuite d'eau constatée" },
            ] as const).map(({ k, l }) => {
              const checked = checklist[k];
              return (
                <TouchableOpacity
                  key={k}
                  style={[st.checkItem, checked && st.checkItemChecked]}
                  onPress={() => setChecklist(p => ({ ...p, [k]: !p[k] }))}
                  activeOpacity={0.8}
                >
                  <ThemedText style={[st.checkLabel, checked && { color: C.green }]}>{l}</ThemedText>
                  <View style={[st.checkIcon, checked && st.checkIconChecked]}>
                    {checked ? <IcoCheck size={11} color={C.white} /> : <IcoClose size={11} color={C.white} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Commentaire ── */}
          <View style={st.section}>
            <SectionTitle label="Commentaires" />
            <TextInput
              style={st.textArea}
              placeholder="Actions correctives, observations..."
              placeholderTextColor={C.slate400}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

        </ScrollView>

        {/* Footer */}
        <View style={st.footer}>
          <TouchableOpacity
            style={[st.btnSave, isSaving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            {isSaving
              ? <ActivityIndicator color={C.white} />
              : <><IcoSave size={18} color={C.white} /><ThemedText style={st.btnSaveText}>Enregistrer le protocole</ThemedText></>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Loading screen
  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <ThemedView style={st.root}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={C.navy} />
          <ThemedText style={{ color: C.slate500, fontWeight: '600' }}>Chargement...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <ThemedView style={st.root}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={st.header}>
        <TouchableOpacity onPress={() => router.back()} style={st.headerBtn} activeOpacity={0.8}>
          <IcoBack size={20} color={C.white} />
        </TouchableOpacity>
        <View style={st.headerCenter}>
          <View style={st.headerIconWrap}>
            <IcoSalad size={18} color={C.white} />
          </View>
          <View>
            <ThemedText style={st.headerTitle}>Désinfection</ThemedText>
            <ThemedText style={st.headerSub}>Fruits & Légumes · HACCP</ThemedText>
          </View>
        </View>
        {/* Selection counter */}
        {selectedProducts.length > 0 && (
          <View style={st.headerCounter}>
            <ThemedText style={st.headerCounterText}>{selectedProducts.length}</ThemedText>
          </View>
        )}
      </View>

      {/* Layout */}
      {isLargeScreen ? (
        <View style={st.desktopLayout}>
          <View style={st.leftCol}>{renderLeftPanel()}</View>
          <View style={st.rightCol}>{renderRightPanel()}</View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Mobile: show left panel when nothing selected, right panel otherwise */}
          {selectedProducts.length === 0 ? renderLeftPanel() : renderRightPanel()}
        </View>
      )}

      {/* ── Modal: Add product ── */}
      <Modal visible={isAddModalVisible} transparent animationType="slide" onRequestClose={() => setIsAddModalVisible(false)}>
        <View style={st.overlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setIsAddModalVisible(false)} />
          <View style={st.modalSheet}>
            <View style={st.modalHandle} />
            <View style={st.modalHeader}>
              <ThemedText style={st.modalTitle}>Nouveau produit</ThemedText>
              <TouchableOpacity style={st.modalCloseBtn} onPress={() => setIsAddModalVisible(false)}>
                <IcoClose size={16} color={C.slate500} />
              </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: 20, gap: 14 }}>
              <View>
                <ThemedText style={st.fieldLabel}>Nom du produit</ThemedText>
                <TextInput
                  style={st.modalInput}
                  placeholder="Ex: Aubergines"
                  placeholderTextColor={C.slate400}
                  value={newProdName}
                  onChangeText={setNewProdName}
                  autoFocus
                />
              </View>
            </View>

            <View style={st.modalFooter}>
              <TouchableOpacity style={st.modalCancelBtn} onPress={() => setIsAddModalVisible(false)}>
                <ThemedText style={st.modalCancelText}>Annuler</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[st.modalConfirmBtn, !newProdName.trim() && { opacity: 0.5 }]} onPress={handleAddProduct} disabled={!newProdName.trim()}>
                <IcoPlus size={15} color={C.white} />
                <ThemedText style={st.modalConfirmText}>Ajouter</ThemedText>
              </TouchableOpacity>
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

  // Header
  header:          { backgroundColor: C.navy, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 4, zIndex: 10 },
  headerBtn:       { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerCenter:    { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconWrap:  { width: 32, height: 32, borderRadius: 8, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  headerTitle:     { color: C.white, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  headerSub:       { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600', marginTop: 1 },
  headerCounter:   { backgroundColor: C.green, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  headerCounterText: { color: C.white, fontSize: 12, fontWeight: '800' },

  // Layout
  desktopLayout: { flex: 1, flexDirection: 'row', gap: 12, padding: 12 },
  leftCol:       { width: '36%', backgroundColor: C.white, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.slate200 },
  rightCol:      { flex: 1, backgroundColor: C.white, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.slate200 },
  leftPanel:     { flex: 1, padding: 14, backgroundColor: C.white },
  rightPanel:    { flex: 1, backgroundColor: C.white },

  // Add product button
  btnAddProduct:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.slate300, borderRadius: 10, paddingVertical: 9, marginBottom: 10 },
  btnAddProductText: { fontSize: 12, fontWeight: '700', color: C.navy },

  // Warning box
  warningBox:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: C.orangeBg, borderLeftWidth: 3, borderLeftColor: C.orange, padding: 10, borderRadius: 8, marginBottom: 12 },
  warningText: { flex: 1, color: C.orange, fontSize: 11, fontWeight: '700' },

  // Product grid (affichage direct sans accordéon)
  grid:            { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  prodItem:        { flex: 1, minWidth: '44%', padding: 10, borderRadius: 10, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 },
  prodItemDefault: { backgroundColor: C.white, borderColor: C.slate200 },
  prodItemSelected:{ backgroundColor: C.greenBg, borderColor: C.green },
  prodItemDisabled:{ backgroundColor: C.slate50, borderColor: C.slate100, opacity: 0.45 },
  prodName:        { flex: 1, fontSize: 12, fontWeight: '700', color: C.slate800, marginRight: 6 },
  prodCheckCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.greenBg, borderWidth: 1.5, borderColor: C.green, alignItems: 'center', justifyContent: 'center' },
  prodEmptyCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: C.slate300 },
  noResult:        { width: '100%', textAlign: 'center', color: C.slate400, fontSize: 12, fontWeight: '600', paddingVertical: 8 },

  // Section
  section: { marginBottom: 20 },

  // Quantities
  qtyGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  qtyCard:     { flex: 1, minWidth: '45%', backgroundColor: C.slate50, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: C.slate200, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qtyName:     { flex: 1, fontSize: 12, fontWeight: '700', color: C.navy, marginRight: 8 },
  qtyInputWrap:{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: C.slate200 },
  qtyInput:    { width: 42, fontSize: 14, fontWeight: '800', color: C.navy, textAlign: 'center', padding: 0 },
  qtyUnit:     { fontSize: 10, fontWeight: '700', color: C.slate500, marginLeft: 3 },

  // Protocol steps
  stepCard:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.white, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.slate200, marginBottom: 8 },
  stepCardDone: { backgroundColor: C.greenBg, borderColor: C.greenBorder },
  stepLeft:     { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  stepBadge:    { width: 30, height: 30, borderRadius: 8, backgroundColor: C.blueBg, alignItems: 'center', justifyContent: 'center' },
  stepNum:      { fontSize: 13, fontWeight: '900', color: C.navy },
  stepTitle:    { fontSize: 13, fontWeight: '700', color: C.navy },
  stepSub:      { fontSize: 10, color: C.slate400, fontWeight: '500', marginTop: 1 },
  checkbox:     { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  checkboxDone:    { backgroundColor: C.green, borderColor: C.green },
  checkboxPending: { backgroundColor: C.orangeBg, borderColor: C.orange },

  // Timer
  timerBadge:     { backgroundColor: C.blueBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  timerBadgeText: { fontSize: 9, fontWeight: '800', color: C.navy },
  timerControl:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.slate50, borderRadius: 10, padding: 4, borderWidth: 1, borderColor: C.slate200 },
  timerBtn:       { width: 34, height: 34, backgroundColor: C.white, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  timerDisplay:   { flexDirection: 'row', alignItems: 'baseline', gap: 3, width: 64, justifyContent: 'center' },
  timerValue:     { fontSize: 20, fontWeight: '900', color: C.navy },
  timerUnit:      { fontSize: 11, fontWeight: '700', color: C.slate500 },

  // Strip (chlorine)
  stripRow:        { flexDirection: 'row', gap: 4, marginBottom: 12 },
  stripCol:        { flex: 1, alignItems: 'center', gap: 5 },
  stripVal:        { fontSize: 11, fontWeight: '700', color: C.slate500 },
  stripBlock:      { width: '100%', height: 46, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  stripBlockActive:{ borderWidth: 2.5, borderColor: C.navy, transform: [{ scale: 1.05 }] },

  // Alert box
  alertBox:        { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'flex-start' },
  alertBoxWarning: { backgroundColor: C.orangeBg, borderColor: C.orangeBorder },
  alertBoxDanger:  { backgroundColor: C.redBg, borderColor: C.redBorder },
  alertBoxSuccess: { backgroundColor: C.greenBg, borderColor: C.greenBorder },
  alertIcon:       { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  alertTitle:      { fontSize: 13, fontWeight: '800', marginBottom: 2 },
  alertDesc:       { fontSize: 11, fontWeight: '600', color: C.slate600, lineHeight: 16 },

  // Checklist
  checkItem:        { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: C.orangeBg, borderRadius: 12, borderWidth: 1, borderColor: C.orangeBorder, marginBottom: 8, gap: 10 },
  checkItemChecked: { backgroundColor: C.greenBg, borderColor: C.greenBorder },
  checkLabel:       { flex: 1, fontSize: 13, fontWeight: '600', color: C.slate700 },
  checkIcon:        { width: 24, height: 24, borderRadius: 6, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center' },
  checkIconChecked: { backgroundColor: C.green },

  // Textarea
  textArea: { backgroundColor: C.slate50, borderWidth: 1.5, borderColor: C.slate200, borderRadius: 12, padding: 12, fontSize: 14, color: C.slate800, minHeight: 80 },

  // Footer save button
  footer:      { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.white, padding: 14, borderTopWidth: 1, borderTopColor: C.slate100, paddingBottom: Platform.OS === 'ios' ? 28 : 14 },
  btnSave:     { backgroundColor: C.navy, borderRadius: 14, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: C.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  btnSaveText: { color: C.white, fontSize: 15, fontWeight: '800' },

  // Modal (bottom sheet)
  overlay:          { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'flex-end' },
  modalSheet:       { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: Platform.OS === 'ios' ? 36 : 24 },
  modalHandle:      { width: 40, height: 4, borderRadius: 2, backgroundColor: C.slate200, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  modalHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.slate100 },
  modalTitle:       { fontSize: 17, fontWeight: '800', color: C.slate900 },
  modalCloseBtn:    { width: 30, height: 30, borderRadius: 8, backgroundColor: C.slate100, alignItems: 'center', justifyContent: 'center' },
  fieldLabel:       { fontSize: 10, fontWeight: '800', color: C.slate400, letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase' },
  modalInput:       { backgroundColor: C.slate50, borderWidth: 1.5, borderColor: C.slate200, borderRadius: 12, padding: 13, fontSize: 15, fontWeight: '600', color: C.slate800 },
  modalFooter:      { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 16 },
  modalCancelBtn:   { flex: 1, padding: 14, backgroundColor: C.slate100, borderRadius: 12, alignItems: 'center' },
  modalCancelText:  { color: C.slate600, fontSize: 14, fontWeight: '700' },
  modalConfirmBtn:  { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: C.navy, borderRadius: 12, padding: 14 },
  modalConfirmText: { color: C.white, fontSize: 14, fontWeight: '800' },
});