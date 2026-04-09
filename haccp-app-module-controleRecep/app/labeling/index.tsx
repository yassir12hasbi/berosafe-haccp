import React, { useState, useEffect, useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  ActivityIndicator, 
  Alert,
  Platform,
  useWindowDimensions
  
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { BeroColors } from '../../constants/theme';
import labelingApi, { 
  LabelingInitialData, 
  Product, 
  Category 
} from '../../api/labeling';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { getErrorDetails } from '../../utils/error';
import { useAuth } from '../../context/auth-context'; // Import ajouté

export default function LabelingScreen() {
  const router = useRouter();
  const { user } = useAuth(); // Récupération de l'utilisateur connecté
  const [loading, setLoading] = useState(true);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // Data
  const [data, setData] = useState<LabelingInitialData | null>(null);

  // Selection
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Config
  const [lotNumber, setLotNumber] = useState('');
  const [zone, setZone] = useState('');
  const [openedAt] = useState(new Date());
  const [dlcAdjustment, setDlcAdjustment] = useState(0); // Days to add/subtract
  const [quantity, setQuantity] = useState(1);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printFeedback, setPrintFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!selectedProduct && data?.products?.length) {
      setSelectedProduct(data.products[0]);
    }
  }, [data, selectedProduct]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const res = await labelingApi.getInitialData();
      setData(res);
      // Default to "All" (null) or first category
      setSelectedCategory(null);
    } catch (error) {
      const { title, message } = getErrorDetails(error, 'Chargement impossible', 'Impossible de charger les produits.');
      console.error('Fetch Initial Data Error:', message);
      Alert.alert(title, message);
    } finally {
      setLoading(false);
    }
  };

  const calculatedExpiresAt = useMemo(() => {
    if (!selectedProduct) return new Date();
    const baseDlc = selectedProduct.max_dlc || 3;
    const d = new Date(openedAt);
    d.setDate(d.getDate() + baseDlc + dlcAdjustment);
    return d;
  }, [selectedProduct, openedAt, dlcAdjustment]);

  const handlePrint = async () => {
    if (!selectedProduct || !lotNumber) {
      setPrintFeedback({ type: 'error', message: 'Veuillez renseigner le numéro de lot.' });
      return;
    }

    try {
      setIsPrinting(true);
      await labelingApi.printBatch({
        product_id: selectedProduct.id,
        lot_number: lotNumber,
        zone: zone || null,
        opened_at: openedAt.toISOString().split('T')[0],
        expires_at: calculatedExpiresAt.toISOString().split('T')[0],
        quantity: quantity,
      });

      setPrintFeedback({
        type: 'success',
        message: `${quantity} étiquette(s) envoyée(s) à l'impression.`,
      });
    } catch (error) {
       const { message } = getErrorDetails(error, 'Impression impossible', "Echec de l'impression.");
       console.error('Print Error:', message);
       setPrintFeedback({ type: 'error', message });
    } finally {
      setIsPrinting(false);
    }
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

  // Renderer for the Header
  const renderHeader = () => (
    <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={18} color={BeroColors.blue} />
          </TouchableOpacity>
          <View>
            <ThemedText style={styles.headerTitle}>Impression Étiquettes</ThemedText>
            <ThemedText style={styles.headerSubtitle}>Sélection et impression en continu</ThemedText>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );

  const renderProductsPanel = () => (
    <View style={styles.productsPanel}>
      <View style={styles.searchBarContainer}>
        <IconSymbol name="magnifyingglass" size={18} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Chercher un produit..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.categoryTabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.tab, selectedCategory === null && styles.activeTab]}
            onPress={() => setSelectedCategory(null)}
          >
            <ThemedText style={[styles.tabText, selectedCategory === null && styles.activeTabText]}>Tous</ThemedText>
          </TouchableOpacity>
          {data?.categories.map(c => (
            <TouchableOpacity
              key={c.id}
              style={[styles.tab, selectedCategory?.id === c.id && styles.activeTab]}
              onPress={() => setSelectedCategory(c)}
            >
              <ThemedText style={[styles.tabText, selectedCategory?.id === c.id && styles.activeTabText]}>{c.name}</ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.productList}>
        {filteredProducts.map(p => (
          <TouchableOpacity
            key={p.id}
            style={[styles.productCard, selectedProduct?.id === p.id && styles.selectedProductCard]}
            onPress={() => {
              setSelectedProduct(p);
              setPrintFeedback(null);
            }}
          >
            <View>
              <ThemedText style={styles.productName}>{p.name}</ThemedText>
              <ThemedText style={styles.productCat}>{p.category?.name ?? 'Sans catégorie'}</ThemedText>
            </View>
            <IconSymbol
              name={selectedProduct?.id === p.id ? 'checkmark' : 'chevron.right'}
              size={20}
              color={selectedProduct?.id === p.id ? BeroColors.green : '#cbd5e1'}
            />
          </TouchableOpacity>
        ))}
        {!filteredProducts.length ? (
          <View style={styles.productsEmptyState}>
            <ThemedText style={styles.productsEmptyTitle}>Aucun produit</ThemedText>
            <ThemedText style={styles.productsEmptyText}>Essayez une autre recherche ou catégorie.</ThemedText>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );

  const renderConfigPanel = () => (
    <View style={styles.configPanel}>
      <ScrollView style={styles.configScroll} contentContainerStyle={styles.configContent}>
        {!selectedProduct ? (
          <View style={styles.emptyState}>
            <IconSymbol name="tags" size={48} color="#94a3b8" />
            <ThemedText style={styles.emptyTitle}>Choisissez un produit</ThemedText>
            <ThemedText style={styles.emptyText}>Sélectionnez un produit à gauche pour configurer et imprimer les étiquettes.</ThemedText>
          </View>
        ) : (
          <>
        {/* Label Preview Card */}
        <View style={styles.previewSection}>
          <ThemedText style={styles.previewLabel}>Aperçu de l&apos;étiquette</ThemedText>

          <View style={styles.labelGraphic}>
             <View style={styles.labelHeader}>
                <ThemedText style={styles.labelTitle}>{selectedProduct?.name}</ThemedText>
             </View>

             <View style={styles.labelBody}>
                <View style={styles.labelRow}>
                   <ThemedText style={styles.labelInfoKey}>Prod. le : </ThemedText>
                   <ThemedText style={styles.labelInfoVal}>{openedAt.toLocaleDateString()}</ThemedText>
                </View>
                <View style={[styles.labelRow, { marginTop: 10 }]}>
                   <ThemedText style={styles.labelDlcKey}>DLC : </ThemedText>
                   <ThemedText style={styles.labelDlcVal}>{calculatedExpiresAt.toLocaleDateString()}</ThemedText>
                </View>
                {zone.length > 0 && (
                  <View style={[styles.labelRow, { marginTop: 5 }]}>
                    <ThemedText style={styles.labelInfoKey}>Zone : </ThemedText>
                    <ThemedText style={styles.labelInfoVal}>{zone}</ThemedText>
                  </View>
                )}
                <View style={[styles.labelRow, { marginTop: 10 }]}>
                    <ThemedText style={styles.labelInfoKey}>Lot : </ThemedText>
                    <ThemedText style={styles.labelLotVal}>{lotNumber || '------'}</ThemedText>
                </View>
                {/* Ajout de l'acteur (utilisateur connecté) */}
                {user && (
                   <View style={[styles.labelRow, { marginTop: 10 }]}>
                      <ThemedText style={styles.labelInfoKey}>Acteur : </ThemedText>
                      <ThemedText style={styles.labelInfoVal}>
                         {user.first_name} {user.last_name}
                      </ThemedText>
                   </View>
                )}
             </View>

             <View style={styles.labelFooter}>
                <View style={styles.dashedLine} />
                <ThemedText style={styles.labelEstab}>Berocert Traceability</ThemedText>
             </View>
          </View>
        </View>

        {/* Adjustments */}
        <View style={styles.controlsSection}>
           <View style={styles.controlRow}>
              <View style={[styles.controlBox, { flex: 2 }]}>
                 <ThemedText style={styles.controlTitle}>Ajustement DLC (Jours)</ThemedText>
                 <View style={styles.adjuster}>
                    <TouchableOpacity onPress={() => setDlcAdjustment(v => v - 1)} style={styles.adjustBtn}>
                       <IconSymbol name="minus" size={20} color="#64748b" />
                    </TouchableOpacity>
                    <ThemedText style={styles.adjustValue}>{dlcAdjustment > 0 ? `+${dlcAdjustment}` : dlcAdjustment}</ThemedText>
                    <TouchableOpacity onPress={() => setDlcAdjustment(v => v + 1)} style={styles.adjustBtn}>
                       <IconSymbol name="plus" size={20} color="#64748b" />
                    </TouchableOpacity>
                 </View>
              </View>

              <View style={[styles.controlBox, { flex: 1.5 }]}>
                 <ThemedText style={styles.controlTitle}>Quantité</ThemedText>
                 <View style={styles.adjuster}>
                    <TouchableOpacity onPress={() => setQuantity(v => Math.max(1, v - 1))} style={styles.adjustBtn}>
                       <IconSymbol name="minus" size={20} color="#64748b" />
                    </TouchableOpacity>
                    <ThemedText style={styles.adjustValue}>{quantity}</ThemedText>
                    <TouchableOpacity onPress={() => setQuantity(v => v + 1)} style={styles.adjustBtn}>
                       <IconSymbol name="plus" size={20} color="#64748b" />
                    </TouchableOpacity>
                 </View>
              </View>
           </View>

           <View style={styles.inputBox}>
              <ThemedText style={styles.controlTitle}>Numéro de Lot</ThemedText>
              <TextInput
                style={styles.lotInput}
                placeholder="Entrez le lot ou scannez d'abord"
                value={lotNumber}
                onChangeText={setLotNumber}
              />
           </View>

           <View style={styles.inputBox}>
              <ThemedText style={styles.controlTitle}>Point / Zone (Optionnel)</ThemedText>
              <TextInput
                style={styles.lotInput}
                placeholder="Frigo Cuisine, Stock..."
                value={zone}
                onChangeText={setZone}
              />
           </View>
        </View>

          </>
        )}
      </ScrollView>

      <View style={styles.stickyActionBar}>
        {printFeedback ? (
          <View style={[styles.feedbackBox, printFeedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError]}>
            <IconSymbol
              name={printFeedback.type === 'success' ? 'checkmark' : 'xmark.circle.fill'}
              size={16}
              color={printFeedback.type === 'success' ? '#0f766e' : '#b42318'}
            />
            <ThemedText style={[styles.feedbackText, printFeedback.type === 'success' ? styles.feedbackSuccessText : styles.feedbackErrorText]}>
              {printFeedback.message}
            </ThemedText>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.printBtn}
          onPress={handlePrint}
          disabled={isPrinting || !selectedProduct}
        >
          {isPrinting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
               <IconSymbol name="print" size={24} color="#fff" />
               <ThemedText style={styles.printBtnText}>Imprimer {quantity} étiquette{quantity > 1 ? 's' : ''}</ThemedText>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaProvider style={{ flex: 1 }}>
        {renderHeader()}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BeroColors.blue} />
          </View>
        ) : (
          <View style={[styles.mainContent, !isLandscape && styles.mainContentPortrait]}>
            <View style={[styles.leftColumn, !isLandscape && styles.leftColumnPortrait]}>
              {renderProductsPanel()}
            </View>
            <View style={[styles.rightColumn, !isLandscape && styles.rightColumnPortrait]}>
              {renderConfigPanel()}
            </View>
          </View>
        )}
      </SafeAreaProvider>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerSafeArea: {
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: BeroColors.dark,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  mainContentPortrait: {
    flexDirection: 'column',
  },
  leftColumn: {
    width: '40%',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  leftColumnPortrait: {
    width: '100%',
    borderRightWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    maxHeight: 380,
    minHeight: 260,
  },
  rightColumn: {
    flex: 1,
  },
  rightColumnPortrait: {
    flex: 1,
    minHeight: 280,
  },
  productsPanel: {
    flex: 1,
    padding: 20,
  },
  configPanel: {
    flex: 1,
  },
  configScroll: {
    flex: 1,
  },
  configContent: {
    padding: 20,
    paddingBottom: 140,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  categoryTabs: {
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeTab: {
    backgroundColor: BeroColors.blue,
    borderColor: BeroColors.blue,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  activeTabText: {
    color: '#fff',
  },
  productList: {
    flex: 1,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  selectedProductCard: {
    borderColor: '#86efac',
    backgroundColor: '#f0fdf4',
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: BeroColors.dark,
  },
  productCat: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  productsEmptyState: {
    marginTop: 12,
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  productsEmptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: BeroColors.dark,
  },
  productsEmptyText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  previewSection: {
    marginBottom: 24,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  labelGraphic: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: BeroColors.dark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  labelHeader: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    paddingBottom: 8,
    marginBottom: 16,
  },
  labelTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000',
    textTransform: 'uppercase',
  },
  labelBody: {
    paddingBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  labelInfoKey: {
    fontSize: 14,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  labelInfoVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },
  labelDlcKey: {
    fontSize: 16,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  labelDlcVal: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000',
  },
  labelLotVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  labelFooter: {
    marginTop: 'auto',
  },
  dashedLine: {
    height: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    marginBottom: 8,
  },
  labelEstab: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  controlsSection: {
    gap: 16,
  },
  controlRow: {
    flexDirection: 'row',
    gap: 12,
  },
  controlBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  controlTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  adjuster: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 4,
  },
  adjustBtn: {
    width: 32,
    height: 32,
    backgroundColor: '#fff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  adjustValue: {
    fontSize: 18,
    fontWeight: '900',
    color: BeroColors.dark,
  },
  inputBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  lotInput: {
    fontSize: 16,
    fontWeight: '700',
    color: BeroColors.dark,
    paddingVertical: 8,
  },
  printBtn: {
    backgroundColor: BeroColors.blue,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 24,
    shadowColor: BeroColors.blue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  printBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  feedbackBox: {
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stickyActionBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  feedbackSuccess: {
    backgroundColor: '#ecfeff',
    borderColor: '#99f6e4',
  },
  feedbackError: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
  },
  feedbackText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  feedbackSuccessText: {
    color: '#115e59',
  },
  feedbackErrorText: {
    color: '#9f1239',
  },
  emptyState: {
    minHeight: 280,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: BeroColors.dark,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  cancelBtn: {
    padding: 0,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '700',
  },
});