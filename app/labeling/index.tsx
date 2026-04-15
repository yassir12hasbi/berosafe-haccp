import React, { useState, useEffect, useMemo } from 'react';
import { 
  StyleSheet, View, TouchableOpacity, ScrollView, TextInput,
  ActivityIndicator, Alert, Platform, KeyboardAvoidingView, Modal, Dimensions
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import labelingApi, {
  LabelingInitialData,
  Product,
  Category
} from '../../api/labeling'; // Assurez-vous que ce fichier existe (voir partie 2)
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { getErrorDetails } from '../../utils/error';
import { useAuth } from '../../context/auth-context';
import Svg, { Path, Circle, Rect, Line, G, Polyline } from 'react-native-svg';

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const C = {
  navy:       '#1A3B6E',
  navyLight:  '#234F91',
  navyDark:   '#0F2547',
  green:      '#15803D',
  greenBg:    '#F0FDF4',
  greenBorder:'#BBF7D0',
  red:        '#DC2626',
  redBg:      '#FEF2F2',
  redBorder:  '#FECACA',
  amber:      '#B45309',
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
  blue600:    '#2563EB',
  blue500:    '#3B82F6',
  blue50:     '#EFF6FF',
};

// ─── Base de données des 14 Allergènes ────────────────────────────────────────
const ALLERGENS_DB = [
  { id: 'gluten', name: 'Gluten', icon: '🌾' },
  { id: 'crustaces', name: 'Crustacés', icon: '🦐' },
  { id: 'oeufs', name: 'Œufs', icon: '🥚' },
  { id: 'poissons', name: 'Poissons', icon: '🐟' },
  { id: 'arachides', name: 'Arachides', icon: '🥜' },
  { id: 'soja', name: 'Soja', icon: '🫘' },
  { id: 'lait', name: 'Lait', icon: '🥛' },
  { id: 'coque', name: 'Fruits à coque', icon: '🌰' },
  { id: 'celeri', name: 'Céleri', icon: '🥬' },
  { id: 'moutarde', name: 'Moutarde', icon: '🟡' },
  { id: 'sesame', name: 'Sésame', icon: '⚪' },
  { id: 'sulfites', name: 'Sulfites', icon: '🍷' },
  { id: 'lupin', name: 'Lupin', icon: '🌸' },
  { id: 'mollusques', name: 'Mollusques', icon: '🐚' },
];

// ─── SVG Icons ────────────────────────────────────────────────────────────────
type IP = { size?: number; color?: string };
const SW = 1.8;

const IcoBack    = ({ size = 20, color = C.navy }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/></Svg>
);
const IcoSearch  = ({ size = 18, color = C.slate400 }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Circle cx="11" cy="11" r="7" stroke={color} strokeWidth={SW}/><Path d="M16.5 16.5L21 21" stroke={color} strokeWidth={SW} strokeLinecap="round"/></Svg>
);
const IcoClose   = ({ size = 20, color = C.slate400 }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={SW} strokeLinecap="round"/></Svg>
);
const IcoCheck   = ({ size = 14, color = C.white }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></Svg>
);
const IcoPlus    = ({ size = 22, color = C.navy }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M12 8v8M8 12h8" stroke={color} strokeWidth={2.2} strokeLinecap="round"/></Svg>
);
const IcoMinus   = ({ size = 22, color = C.slate600 }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M8 12h8" stroke={color} strokeWidth={2.2} strokeLinecap="round"/></Svg>
);
const IcoPrinter = ({ size = 24, color = C.white }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M6 9V2h12v7" stroke={color} strokeWidth={SW} strokeLinejoin="round"/><Path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" stroke={color} strokeWidth={SW} strokeLinejoin="round"/><Path d="M6 14h12v8H6z" stroke={color} strokeWidth={SW} strokeLinejoin="round"/></Svg>
);
const IcoTags    = ({ size = 48, color = C.slate300 }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke={color} strokeWidth={SW} strokeLinejoin="round"/><Line x1="7" y1="7" x2="7.01" y2="7" stroke={color} strokeWidth={2.5} strokeLinecap="round"/></Svg>
);

// ─── Reusable Search Input ────────────────────────────────────────────────────
function SearchInput({ value, onChangeText, placeholder }: { value: string; onChangeText: (v: string) => void; placeholder: string }) {
  return (
    <View style={si.wrap}>
      <IcoSearch size={16} color={C.slate400} />
      <TextInput style={si.input} placeholder={placeholder} placeholderTextColor={C.slate400} value={value} onChangeText={onChangeText} />
      {value.length > 0 && <TouchableOpacity onPress={() => onChangeText('')}><IcoClose size={16} color={C.slate300} /></TouchableOpacity>}
    </View>
  );
}
const si = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.white, borderRadius: 12, paddingHorizontal: 14, height: 46, borderWidth: 1, borderColor: C.slate200, marginBottom: 14 },
  input: { flex: 1, fontSize: 14, color: C.slate800, fontWeight: '500' },
});

function EmptyState({ label, sub }: { label: string; sub?: string }) {
  return (
    <View style={{ paddingVertical: 48, alignItems: 'center', gap: 8 }}>
      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: C.slate100, alignItems: 'center', justifyContent: 'center' }}><IcoTags size={22} color={C.slate300} /></View>
      <ThemedText style={{ color: C.slate400, fontWeight: '800', fontSize: 15 }}>{label}</ThemedText>
      {sub && <ThemedText style={{ color: C.slate500, fontWeight: '600', fontSize: 12 }}>{sub}</ThemedText>}
    </View>
  );
}

export default function LabelingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const [windowDimensions, setWindowDimensions] = useState(Dimensions.get('window'));
  const isLandscape = windowDimensions.width > windowDimensions.height;

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => setWindowDimensions(window));
    return () => subscription.remove();
  }, []);

  const [data, setData] = useState<LabelingInitialData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [lotNumber, setLotNumber] = useState('');
  const [zone, setZone] = useState('');
  const [openedAt] = useState(new Date());
  const [dlcAdjustment, setDlcAdjustment] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printFeedback, setPrintFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // States pour les modales
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);

  // States pour la création (Formulaire)
  const [newCatName, setNewCatName] = useState('');
  const [newProdName, setNewProdName] = useState('');
  const [newProdCatId, setNewProdCatId] = useState<number | null>(null);
  const [newProdDlc, setNewProdDlc] = useState(3);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);

  // States de chargement pour l'ajout (API)
  const [isSavingCat, setIsSavingCat] = useState(false);
  const [isSavingProd, setIsSavingProd] = useState(false);

  useEffect(() => { fetchInitialData(); }, []);
  useEffect(() => { if (!selectedProduct && data?.products?.length) setSelectedProduct(data.products[0]); }, [data, selectedProduct]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const res = await labelingApi.getInitialData();
      setData(res); setSelectedCategory(null);
    } catch (error) {
      const { title, message } = getErrorDetails(error, 'Chargement impossible', 'Impossible de charger les produits.');
      Alert.alert(title, message);
    } finally { setLoading(false); }
  };

  const calculatedExpiresAt = useMemo(() => {
    if (!selectedProduct) return new Date();
    const baseDlc = selectedProduct.max_dlc || 3;
    const d = new Date(openedAt); d.setDate(d.getDate() + baseDlc + dlcAdjustment); return d;
  }, [selectedProduct, openedAt, dlcAdjustment]);

  const handlePrint = async () => {
    if (!selectedProduct || !lotNumber) { setPrintFeedback({ type: 'error', message: 'Veuillez renseigner le numéro de lot.' }); return; }
    try {
      setIsPrinting(true);
      await labelingApi.printBatch({ product_id: selectedProduct.id, lot_number: lotNumber, zone: zone || null, opened_at: openedAt.toISOString().split('T')[0], expires_at: calculatedExpiresAt.toISOString().split('T')[0], quantity: quantity });
      setPrintFeedback({ type: 'success', message: `${quantity} étiquette(s) envoyée(s) à l'impression.` });
    } catch (error) { const { message } = getErrorDetails(error, 'Impression impossible', "Echec de l'impression."); setPrintFeedback({ type: 'error', message }); } finally { setIsPrinting(false); }
  };

  const filteredProducts = useMemo(() => {
    if (!data) return [];
    const search = searchQuery.trim().toLowerCase();
    return data.products.filter(p => {
      const matchCat = selectedCategory === null || p.category_id === selectedCategory.id;
      const matchSearch = p.name.toLowerCase().includes(search);
      return matchCat && matchSearch;
    });
  }, [data, selectedCategory, searchQuery]);

  // ── AJOUT CATÉGORIE API ──
  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    setIsSavingCat(true);
    try {
      // Appel API pour stocker en base
      await labelingApi.storeCategory({ name: newCatName.trim() });

      // Succès : on ferme, on reset et on rafraîchit les données
      setIsCatModalOpen(false);
      setNewCatName('');
      await fetchInitialData(); // Important pour récupérer l'ID généré par la BDD
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'ajouter la catégorie via l'API");
    } finally {
      setIsSavingCat(false);
    }
  };

  // ── AJOUT PRODUIT API ──
  const handleAddProduct = async () => {
    if (!newProdName.trim() || !newProdCatId) {
      Alert.alert("Erreur", "Nom et catégorie requis.");
      return;
    }
    setIsSavingProd(true);
    try {
      // Appel API pour stocker en base
      await labelingApi.storeProduct({
        name: newProdName,
        category_id: newProdCatId,
        max_dlc: newProdDlc,
        allergens: selectedAllergens
      });

      // Succès
      setIsProdModalOpen(false);
      setNewProdName('');
      setNewProdCatId(null);
      setNewProdDlc(3);
      setSelectedAllergens([]);
      await fetchInitialData(); // Important pour récupérer l'ID et les données fraîches
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'ajouter le produit via l'API");
    } finally {
      setIsSavingProd(false);
    }
  };

  const toggleAllergen = (id: string) => setSelectedAllergens(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);

  // ── Header ──
  const renderHeader = () => (
    <SafeAreaView edges={['top']} style={st.headerSafe}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => router.back()} style={st.backBtn}><IcoBack size={20} color={C.navy} /></TouchableOpacity>
        <View><ThemedText style={st.headerTitle}>Impression Étiquettes</ThemedText><ThemedText style={st.headerSub}>Sélection et impression en continu</ThemedText></View>
      </View>
    </SafeAreaView>
  );

  // ── Left Panel ──
  const renderProductsPanel = () => (
    <View style={st.productsPanel}>
      <TouchableOpacity style={st.btnNewCat} onPress={() => setIsCatModalOpen(true)}><IcoPlus size={14} color={C.white} /><ThemedText style={st.btnNewTxt}>NOUVELLE CATÉGORIE</ThemedText></TouchableOpacity>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', paddingBottom: 8 }}>
        <TouchableOpacity style={[st.tab, selectedCategory === null && st.tabActive]} onPress={() => setSelectedCategory(null)}><ThemedText style={[st.tabText, selectedCategory === null && st.tabTextActive]}>Tous</ThemedText></TouchableOpacity>
        {data?.categories.map(c => (<TouchableOpacity key={c.id} style={[st.tab, selectedCategory?.id === c.id && st.tabActive]} onPress={() => setSelectedCategory(c)}><ThemedText style={[st.tabText, selectedCategory?.id === c.id && st.tabTextActive]}>{c.name}</ThemedText></TouchableOpacity>))}
      </ScrollView>

      <View style={st.prodCol}>
        <TouchableOpacity style={st.btnNewProd} onPress={() => setIsProdModalOpen(true)}><IcoPlus size={14} color={C.white} /><ThemedText style={st.btnNewTxt}>NOUVEAU PRODUIT</ThemedText></TouchableOpacity>
        <SearchInput value={searchQuery} onChangeText={setSearchQuery} placeholder="Rechercher un produit..." />

        <ScrollView style={st.prodListScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {filteredProducts.map(p => {
            const isSelected = selectedProduct?.id === p.id;
            return (<TouchableOpacity key={p.id} style={[st.card, isSelected && st.cardActive]} onPress={() => { setSelectedProduct(p); setPrintFeedback(null); }} activeOpacity={0.8}><ThemedText style={[st.cardName, isSelected && st.cardNameActive]}>{p.name}</ThemedText>{isSelected && <IcoCheck size={16} color={C.white} />}</TouchableOpacity>);
          })}
          {filteredProducts.length === 0 && <EmptyState label="Aucun produit trouvé" sub="Changez de catégorie ou de recherche." />}
        </ScrollView>
      </View>
    </View>
  );

  // ── Right Panel ──
  const renderConfigPanel = () => (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={styles.flex1} contentContainerStyle={st.configContent}>
        {!selectedProduct ? (
          <EmptyState label="Choisissez un produit" sub="Sélectionnez un produit pour configurer l'étiquette." />
        ) : (
          <>
            <View style={st.previewSection}>
              <View style={st.previewLabelRow}><View style={{width: 4, height: 14, backgroundColor: C.navy, borderRadius: 2}}/><ThemedText style={st.previewLabel}>Aperçu de l'étiquette</ThemedText></View>
              <View style={st.labelGraphic}>
                <View style={st.labelHeader}><ThemedText style={st.labelTitle}>{selectedProduct.name.toUpperCase()}</ThemedText></View>
                <View style={st.labelBody}>
                  <View style={st.labelRow}><ThemedText style={st.labelKey}>Prod. le : </ThemedText><ThemedText style={st.labelVal}>{openedAt.toLocaleDateString('fr-FR')}</ThemedText></View>
                  <View style={[st.labelRow, { marginTop: 8 }]}><ThemedText style={[st.labelKey, {color: C.red}]}>DLC : </ThemedText><ThemedText style={[st.labelVal, {color: C.red, fontSize: 24}]}>{calculatedExpiresAt.toLocaleDateString('fr-FR')}</ThemedText></View>
                  {zone.length > 0 && <View style={[st.labelRow, { marginTop: 4 }]}><ThemedText style={st.labelKey}>Zone : </ThemedText><ThemedText style={st.labelVal}>{zone}</ThemedText></View>}
                  <View style={[st.labelRow, { marginTop: 8 }]}><ThemedText style={st.labelKey}>Lot : </ThemedText><ThemedText style={[st.labelVal, {fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'}]}>{lotNumber || '------'}</ThemedText></View>
                  {user && <View style={[st.labelRow, { marginTop: 4 }]}><ThemedText style={st.labelKey}>Par : </ThemedText><ThemedText style={st.labelValSmall}>{user.first_name} {user.last_name}</ThemedText></View>}
                </View>

                <View style={st.labelAllergenSection}>
                  <ThemedText style={st.labelAllergenTitle}>ALLERGÈNES DÉCLARÉS :</ThemedText>
                  <View style={st.labelAllergenGrid}>
                    {selectedProduct?.allergens && selectedProduct.allergens.length > 0 ? (
                      selectedProduct.allergens.map((allergenId: string) => {
                        const allergenData = ALLERGENS_DB.find(a => a.id === allergenId);
                        if (!allergenData) return null;
                        return (
                          <View key={allergenId} style={st.labelAllergenTag}>
                            <ThemedText style={st.labelAllergenIcon}>{allergenData.icon}</ThemedText>
                          </View>
                        );
                      })
                    ) : (
                      <ThemedText style={st.labelNoAllergen}>SANS ALLERGÈNES</ThemedText>
                    )}
                  </View>
                </View>

                <View style={st.labelFooter}><View style={st.dashedLine} /><ThemedText style={st.labelEstab}>BEROCERT TRACEABILITY</ThemedText></View>
              </View>
            </View>

            <View style={st.controlsSection}>
              <View style={st.row}>
                <View style={[st.fieldGroup, {flex: 1}]}><ThemedText style={st.fieldLabel}>Ajustement DLC</ThemedText><View style={st.adjuster}><TouchableOpacity onPress={() => setDlcAdjustment(v => v - 1)} style={st.adjustBtn}><IcoMinus size={18} color={C.slate600} /></TouchableOpacity><ThemedText style={st.adjustValue}>{dlcAdjustment > 0 ? `+${dlcAdjustment}` : dlcAdjustment}</ThemedText><TouchableOpacity onPress={() => setDlcAdjustment(v => v + 1)} style={st.adjustBtn}><IcoPlus size={18} color={C.navy} /></TouchableOpacity></View></View>
                <View style={[st.fieldGroup, {flex: 1, marginLeft: 12}]}><ThemedText style={st.fieldLabel}>Quantité</ThemedText><View style={st.adjuster}><TouchableOpacity onPress={() => setQuantity(v => Math.max(1, v - 1))} style={st.adjustBtn}><IcoMinus size={18} color={C.slate600} /></TouchableOpacity><ThemedText style={st.adjustValue}>{quantity}</ThemedText><TouchableOpacity onPress={() => setQuantity(v => v + 1)} style={st.adjustBtn}><IcoPlus size={18} color={C.navy} /></TouchableOpacity></View></View>
              </View>
              <View style={st.fieldGroup}><ThemedText style={st.fieldLabel}>Numéro de Lot</ThemedText><TextInput style={st.input} placeholder="Scanner ou saisir..." placeholderTextColor={C.slate400} value={lotNumber} onChangeText={setLotNumber} /></View>
              <View style={st.fieldGroup}><ThemedText style={st.fieldLabel}>Point / Zone <ThemedText style={{color: C.slate400, fontWeight:'400'}}>(Optionnel)</ThemedText></ThemedText><TextInput style={st.input} placeholder="Ex: Frigo Cuisine" placeholderTextColor={C.slate400} value={zone} onChangeText={setZone} /></View>
            </View>
          </>
        )}
      </ScrollView>
      <View style={st.footer}>
        {printFeedback && <View style={[st.feedback, printFeedback.type === 'success' ? st.feedbackSuccess : st.feedbackError]}><ThemedText style={{ flex: 1, fontSize: 13, fontWeight: '700', color: printFeedback.type === 'success' ? C.green : C.red }}>{printFeedback.message}</ThemedText></View>}
        <TouchableOpacity style={[st.btnPrimary, (!selectedProduct || isPrinting) && st.btnDisabled]} onPress={handlePrint} disabled={isPrinting || !selectedProduct} activeOpacity={0.85}>
          {isPrinting ? <ActivityIndicator color={C.white} /> : <><IcoPrinter size={20} color={C.white} /><ThemedText style={st.btnPrimaryText}>Imprimer {quantity} étiquette{quantity > 1 ? 's' : ''}</ThemedText></>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  return (
    <ThemedView style={st.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaProvider style={{ flex: 1 }}>
        {renderHeader()}
        {loading ? (
          <View style={st.loader}><ActivityIndicator size="large" color={C.navy} /><ThemedText style={{ marginTop: 12, color: C.slate500, fontWeight: '600' }}>Chargement...</ThemedText></View>
        ) : (
          <View style={[st.mainContent, !isLandscape && st.mainContentPortrait]}>
            <View style={[st.leftCol, !isLandscape && st.leftColPortrait]}>{renderProductsPanel()}</View>
            <View style={[st.rightCol, !isLandscape && st.rightColPortrait]}>{renderConfigPanel()}</View>
          </View>
        )}
      </SafeAreaProvider>

      {/* MODAL CATEGORIE */}
      <Modal visible={isCatModalOpen} animationType="fade" transparent onRequestClose={() => setIsCatModalOpen(false)}>
        <View style={catM.overlay}><View style={catM.card}>
          <ThemedText style={catM.title}>Nouvelle Catégorie</ThemedText>
          <TextInput style={catM.input} placeholder="Ex: SAUCES" placeholderTextColor={C.slate400} value={newCatName} onChangeText={setNewCatName} autoCapitalize="characters" />
          <View style={catM.actions}>
            <TouchableOpacity style={catM.btnCancel} onPress={() => { setIsCatModalOpen(false); setNewCatName(''); }}><ThemedText style={catM.btnCancelTxt}>ANNULER</ThemedText></TouchableOpacity>
            <TouchableOpacity style={catM.btnConfirm} onPress={handleAddCategory} disabled={isSavingCat}>
              {isSavingCat ? <ActivityIndicator color={C.white} /> : <ThemedText style={catM.btnConfirmTxt}>AJOUTER</ThemedText>}
            </TouchableOpacity>
          </View>
        </View></View>
      </Modal>

      {/* MODAL PRODUIT */}
      <Modal visible={isProdModalOpen} animationType="slide" transparent onRequestClose={() => setIsProdModalOpen(false)}>
        <View style={prodM.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={prodM.sheet}>
            <View style={prodM.header}>
              <ThemedText style={prodM.headerTitle}>NOUVEAU PRODUIT</ThemedText>
              <TouchableOpacity onPress={() => setIsProdModalOpen(false)} style={prodM.closeBtn}><IcoClose size={18} color="rgba(255,255,255,0.7)" /></TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={prodM.body}>
              <View style={prodM.row}>
                <View style={prodM.field}>
                  <ThemedText style={prodM.label}>CATÉGORIE</ThemedText>
                  <View style={prodM.selectBox}>
                    <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 120 }}>
                      {data?.categories.map(c => {
                        const isActive = newProdCatId === c.id;
                        return (
                          <TouchableOpacity
                            key={c.id}
                            style={[prodM.selectItem, isActive && prodM.selectItemActive]}
                            onPress={() => setNewProdCatId(c.id)}
                          >
                            <ThemedText style={[prodM.selectItemTxt, isActive && { color: C.white }]}>{c.name}</ThemedText>
                            {isActive && <IcoCheck size={14} color={C.white} />}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>
                <View style={prodM.field}>
                  <ThemedText style={prodM.label}>DLC PAR DÉFAUT (Jours)</ThemedText>
                  <View style={prodM.dlcControl}>
                    <TouchableOpacity style={prodM.dlcBtn} onPress={() => setNewProdDlc(Math.max(0, newProdDlc - 1))}><IcoMinus size={16} color={C.slate600} /></TouchableOpacity>
                    <TextInput style={prodM.dlcInput} value={String(newProdDlc)} onChangeText={(v) => setNewProdDlc(parseInt(v) || 0)} keyboardType="numeric" textAlign="center" editable={false} />
                    <TouchableOpacity style={prodM.dlcBtn} onPress={() => setNewProdDlc(newProdDlc + 1)}><IcoPlus size={16} color={C.slate600} /></TouchableOpacity>
                  </View>
                </View>
              </View>
              <View style={prodM.field}>
                <ThemedText style={prodM.label}>NOM DU PRODUIT</ThemedText>
                <TextInput style={prodM.textInput} placeholder="NOM DU PRODUIT" placeholderTextColor={C.slate400} value={newProdName} onChangeText={setNewProdName} autoCapitalize="characters" />
              </View>
              <View style={prodM.allergenSection}>
                <ThemedText style={prodM.label}>COCHEZ LES ALLERGÈNES PRÉSENTS :</ThemedText>
                <View style={prodM.allergenGrid}>
                  {ALLERGENS_DB.map(allergen => {
                    const isSelected = selectedAllergens.includes(allergen.id);
                    return (
                      <TouchableOpacity key={allergen.id} style={[prodM.allergenCard, isSelected && prodM.allergenCardActive]} onPress={() => toggleAllergen(allergen.id)} activeOpacity={0.7}>
                        <View style={[prodM.checkbox, isSelected && prodM.checkboxActive]}>{isSelected && <IcoCheck size={10} color={C.white} />}</View>
                        <ThemedText style={prodM.allergenIcon}>{allergen.icon}</ThemedText>
                        <ThemedText style={[prodM.allergenName, isSelected && { color: C.blue600 }]} numberOfLines={1}>{allergen.name.toUpperCase()}</ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
            <View style={prodM.footer}>
              <TouchableOpacity style={prodM.btnCancel} onPress={() => { setIsProdModalOpen(false); setNewProdName(''); setNewProdCatId(null); setNewProdDlc(3); setSelectedAllergens([]); }}><ThemedText style={prodM.btnCancelTxt}>ANNULER</ThemedText></TouchableOpacity>
              <TouchableOpacity style={prodM.btnConfirm} onPress={handleAddProduct} disabled={isSavingProd}>
                {isSavingProd ? <ActivityIndicator color={C.white} /> : <ThemedText style={prodM.btnConfirmTxt}>CRÉER LE PRODUIT</ThemedText>}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({ flex1: { flex: 1 } });

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.slate100 },
  headerSafe: { backgroundColor: C.white, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2, zIndex: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.white },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: C.slate900, letterSpacing: -0.3 },
  headerSub: { fontSize: 11, color: C.slate400, fontWeight: '600', marginTop: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mainContent: { flex: 1, flexDirection: 'row', backgroundColor: C.slate100 },
  mainContentPortrait: { flexDirection: 'column' },
  leftCol: { width: '40%', borderRightWidth: 1, borderRightColor: C.slate200, backgroundColor: C.white },
  leftColPortrait: { width: '100%', height: 380, borderBottomWidth: 1, borderBottomColor: C.slate200 },
  rightCol: { flex: 1, backgroundColor: C.slate100 },
  rightColPortrait: { flex: 1 },
  productsPanel: { flex: 1, padding: 18, backgroundColor: C.white },
  btnNewCat: { width: '100%', backgroundColor: C.slate800, paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4, marginBottom: 14 },
  btnNewProd: { width: '100%', backgroundColor: C.blue600, paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: C.blue600, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4, marginBottom: 14 },
  btnNewTxt: { color: C.white, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  prodCol: { flex: 1, backgroundColor: C.white, borderRadius: 24, borderWidth: 1, borderColor: C.slate200, overflow: 'hidden' },
  tab: { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: C.white, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: C.slate200 ,alignSelf: 'flex-start' },
  tabActive: { backgroundColor: C.navy, borderColor: C.navy },
  tabText: { fontSize: 13, fontWeight: '700', color: C.slate500 },
  tabTextActive: { color: C.white },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.white, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.slate200, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  cardActive: { backgroundColor: C.navy, borderColor: C.navy },
  cardName: { flex: 1, fontSize: 15, fontWeight: '700', color: C.slate800 },
  cardNameActive: { color: C.white },
  configContent: { padding: 18, paddingBottom: 100 },
  previewSection: { marginBottom: 24 },
  previewLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  previewLabel: { fontSize: 13, fontWeight: '800', color: C.slate600, letterSpacing: 0.2 },
  labelGraphic: { backgroundColor: C.white, borderRadius: 16, borderWidth: 2, borderColor: C.slate900, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  labelHeader: { borderBottomWidth: 2, borderBottomColor: C.slate900, paddingBottom: 8, marginBottom: 16 },
  labelTitle: { fontSize: 20, fontWeight: '900', color: C.slate900, textAlign: 'center' },
  labelBody: { minHeight: 80 },
  labelRow: { flexDirection: 'row', alignItems: 'baseline' },
  labelKey: { fontSize: 13, color: C.slate600, fontWeight: '600' },
  labelVal: { fontSize: 15, fontWeight: '800', color: C.slate900, flex: 1 },
  labelValSmall: { fontSize: 13, fontWeight: '700', color: C.slate700 },
  labelAllergenSection: { marginTop: 12, borderTopWidth: 1, borderTopColor: C.slate900, paddingTop: 8 },
  labelAllergenTitle: { fontSize: 8, fontWeight: '900', color: C.slate900, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' },
  labelAllergenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  labelAllergenTag: { backgroundColor: C.slate900, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 3, alignItems: 'center', justifyContent: 'center', marginRight: 4, marginBottom: 4 },
  labelAllergenIcon: { fontSize: 16 },
  labelNoAllergen: { fontSize: 10, fontStyle: 'italic', fontWeight: '700', color: C.slate600 },
  labelFooter: { marginTop: 16 },
  dashedLine: { height: 1, borderWidth: 1, borderColor: '#cbd5e1', borderStyle: 'dashed', marginBottom: 8 },
  labelEstab: { fontSize: 10, color: C.slate400, textAlign: 'center', fontWeight: '800', letterSpacing: 1.5 },
  controlsSection: { gap: 16 },
  row: { flexDirection: 'row' },
  fieldGroup: { marginBottom: 4 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: C.slate600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: C.white, borderWidth: 1.5, borderColor: C.slate200, borderRadius: 12, padding: 14, fontSize: 15, fontWeight: '600', color: C.slate900 },
  adjuster: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.slate50, borderRadius: 10, padding: 4 },
  adjustBtn: { width: 32, height: 32, backgroundColor: C.white, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.slate200, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 1 },
  adjustValue: { fontSize: 18, fontWeight: '900', color: C.slate800 },
  footer: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 20, backgroundColor: C.slate100, borderTopWidth: 1, borderTopColor: C.slate200 },
  feedback: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1 },
  feedbackSuccess: { backgroundColor: C.greenBg, borderColor: C.greenBorder },
  feedbackError: { backgroundColor: C.redBg, borderColor: C.redBorder },
  btnPrimary: { backgroundColor: C.navy, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, shadowColor: C.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  btnPrimaryText: { color: C.white, fontSize: 16, fontWeight: '800' },
  btnDisabled: { opacity: 0.5 },
  prodListScroll: { flex: 1, scrollEventThrottle: 16, overScrollMode: 'never' },
});

const catM = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { backgroundColor: C.white, borderRadius: 16, width: '100%', maxWidth: 400, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 },
  title: { fontSize: 18, fontWeight: '900', color: C.slate900, textTransform: 'uppercase', marginBottom: 20 },
  input: { width: '100%', borderWidth: 1, borderColor: C.slate300, borderRadius: 12, padding: 14, fontSize: 15, fontWeight: '700', textTransform: 'uppercase', color: C.slate900, marginBottom: 24 },
  actions: { flexDirection: 'row', gap: 12 },
  btnCancel: { flex: 1, backgroundColor: C.slate100, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnCancelTxt: { color: C.slate700, fontSize: 14, fontWeight: '700' },
  btnConfirm: { flex: 1, backgroundColor: C.slate900, paddingVertical: 14, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  btnConfirmTxt: { color: C.white, fontSize: 14, fontWeight: '700' },
});

const prodM = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', paddingBottom: Platform.OS === 'ios' ? 34 : 16, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 18, backgroundColor: C.slate900, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: C.white, textTransform: 'uppercase' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10 },
  row: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  field: { flex: 1 },
  label: { fontSize: 9, fontWeight: '900', color: C.slate500, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  textInput: { borderWidth: 1, borderColor: C.slate300, borderRadius: 12, padding: 14, fontSize: 15, fontWeight: '700', textTransform: 'uppercase', color: C.slate900 },
  selectBox: { borderWidth: 1, borderColor: C.slate300, borderRadius: 12, backgroundColor: C.white, overflow: 'hidden' },
  selectItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.slate100 },
  selectItemActive: { backgroundColor: '#1e40af' },
  selectItemTxt: { fontSize: 14, fontWeight: '700', color: C.slate700 },
  dlcControl: { flexDirection: 'row', borderWidth: 1, borderColor: C.slate300, borderRadius: 12, overflow: 'hidden', backgroundColor: C.white },
  dlcBtn: { width: 50, height: 50, backgroundColor: C.slate100, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: C.slate300 },
  dlcInput: { flex: 1, height: 50, textAlign: 'center', fontSize: 22, fontWeight: '900', color: C.slate900, paddingVertical: 0 },
  allergenSection: { marginTop: 10, marginBottom: 10 },
  allergenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, borderWidth: 1, borderColor: C.slate200, borderRadius: 12, backgroundColor: C.slate50, padding: 12 },
  allergenCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.white, borderWidth: 1, borderColor: C.slate200, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 10, width: '48%', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  allergenCardActive: { backgroundColor: C.blue50, borderColor: C.blue500 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: C.slate300, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: C.blue500, borderColor: C.blue500 },
  allergenIcon: { fontSize: 16 },
  allergenName: { fontSize: 9, fontWeight: '800', color: C.slate600, flex: 1, letterSpacing: 0.5 },
  footer: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.slate100 },
  btnCancel: { flex: 1, backgroundColor: C.slate100, paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  btnCancelTxt: { color: C.slate700, fontSize: 14, fontWeight: '700' },
  btnConfirm: { flex: 1, backgroundColor: C.blue600, paddingVertical: 15, borderRadius: 12, alignItems: 'center', shadowColor: C.blue600, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  btnConfirmTxt: { color: C.white, fontSize: 14, fontWeight: '700' },
});