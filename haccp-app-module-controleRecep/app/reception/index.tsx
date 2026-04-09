import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
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
  View
} from 'react-native';
import receptionApi, {
  Category,
  Product,
  ProductChecklistResponse,
  ReceptionInitialData,
  ReceptionLine,
  Supplier
} from '../../api/reception';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { BeroColors } from '../../constants/theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getErrorDetails } from '../../utils/error';

type Step = 'supplier' | 'product' | 'form' | 'summary';

export default function ReceptionScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>('supplier');

  // Data from API
  const [data, setData] = useState<ReceptionInitialData | null>(null);
  const [currentProductChecklists, setCurrentProductChecklists] = useState<ProductChecklistResponse | null>(null);

  // Selection State
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Current Form State
  const [measuredTemp, setMeasuredTemp] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [isCompliant, setIsCompliant] = useState(true);
  const [nonComplianceReason, setNonComplianceReason] = useState('');
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [checklistResults, setChecklistResults] = useState<Record<number, boolean>>({});

  // All added lines for this reception
  const [receptionLines, setReceptionLines] = useState<ReceptionLine[]>([]);
  const [editingLineIndex, setEditingLineIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search filters
  const [searchQuery, setSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [isDeliveryModalVisible, setIsDeliveryModalVisible] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const res = await receptionApi.getInitialData();
      setData(res);
      setSelectedCategory(null); // 'null' represents 'Tours' (All)
    } catch (error) {
      const { title, message } = getErrorDetails(error, 'Chargement impossible', 'Impossible de charger les donnees initiales.');
      console.error('Fetch Initial Data Error:', message);
      Alert.alert(title, message);
    } finally {
      setLoading(false);
    }
  };

  const loadProductDetails = async (product: Product) => {
    try {
      setLoading(true);
      const res = await receptionApi.getProductChecklists(product.id);
      setCurrentProductChecklists(res);

      // Initialize checklist with all compliant (true)
      const initialChecklist: Record<number, boolean> = {};
      res.checklists.forEach(c => {
        initialChecklist[c.id] = true;
      });
      setChecklistResults(initialChecklist);

      setStep('form');
    } catch (error) {
      const { title, message } = getErrorDetails(error, 'Chargement impossible', 'Impossible de charger les details du produit.');
      console.error('Load Product Details Error:', message);
      Alert.alert(title, message);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      base64: true,
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0].base64) {
      setCapturedPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const isTempValid = useMemo(() => {
    if (!measuredTemp || !currentProductChecklists) return true;
    const temp = parseFloat(measuredTemp);
    const min = currentProductChecklists.min_temperature;
    const max = currentProductChecklists.max_temperature;

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
      expiration_date: expirationDate ? expirationDate.toISOString().split('T')[0] : undefined, // YYYY-MM-DD
      is_compliant: isCompliant,
      non_compliance_reason: isCompliant ? null : (nonComplianceReason || 'Non conforme'),
      photo: capturedPhoto || undefined,
      checklists: Object.entries(checklistResults).map(([id, value]) => ({
        checklist_id: parseInt(id),
        recorded_value: value
      }))
    };

    if (editingLineIndex !== null) {
      const updatedLines = [...receptionLines];
      updatedLines[editingLineIndex] = newLine;
      setReceptionLines(updatedLines);
    } else {
      setReceptionLines([...receptionLines, newLine]);
    }

    // Reset form for next product
    resetForm();
    setStep('summary');
  };

  const resetForm = () => {
    setMeasuredTemp('');
    setLotNumber('');
    setNonComplianceReason('');
    setIsCompliant(true);
    setExpirationDate(null);
    setCapturedPhoto(null);
    setEditingLineIndex(null);
  };

  const editLine = async (index: number) => {
    const line = receptionLines[index];
    const product = data?.products.find(p => p.id === line.product_id);
    if (!product) return;

    try {
      setLoading(true);
      setSelectedProduct(product);

      // Load checklists for this product
      const res = await receptionApi.getProductChecklists(product.id);
      setCurrentProductChecklists(res);

      // Load saved values
      setMeasuredTemp(line.measured_temperature?.toString() || '');
      setLotNumber(line.lot_number || '');
      setIsCompliant(line.is_compliant);
      setNonComplianceReason(line.non_compliance_reason || '');
      setExpirationDate(line.expiration_date ? new Date(line.expiration_date) : null);
      setCapturedPhoto(line.photo || null);

      const newChecklist: Record<number, boolean> = {};
      line.checklists?.forEach(c => {
        newChecklist[c.checklist_id] = c.recorded_value;
      });
      setChecklistResults(newChecklist);

      setEditingLineIndex(index);
      setStep('form');
    } catch (error) {
      const { title, message } = getErrorDetails(error, 'Chargement impossible', 'Impossible de charger les details pour modification.');
      console.error('Edit Line Error:', message);
      Alert.alert(title, message);
    } finally {
      setLoading(false);
    }
  };

  const removeLine = (index: number) => {
    Alert.alert(
      'Supprimer',
      'Voulez-vous supprimer ce produit de la réception ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            const updatedLines = [...receptionLines];
            updatedLines.splice(index, 1);
            setReceptionLines(updatedLines);
          }
        }
      ]
    );
  };

  const submitReception = async () => {
    if (!selectedSupplier || receptionLines.length === 0) return;

    try {
      setIsSubmitting(true);
      await receptionApi.storeReception({
        supplier_id: selectedSupplier.id,
        delivery_note_number: deliveryNoteNumber || null,
        received_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        lines: receptionLines,
      });

      Alert.alert('Succès', 'Réception enregistrée avec succès !', [
        { text: 'OK', onPress: () => router.push('/') }
      ]);
    } catch (error) {
      const { title, message } = getErrorDetails(error, 'Erreur de soumission', "Echec de l'enregistrement de la reception.");
      console.error('Submit Error:', message);
      Alert.alert(title, message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // UI Renderers
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTitleContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={20} color={BeroColors.blue} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Contrôle Réception</ThemedText>
      </View>
      <View style={styles.stepIndicator}>
        <View style={[styles.stepDot, step === 'supplier' && styles.activeDot]} />
        <View style={[styles.stepDot, step === 'product' && styles.activeDot]} />
        <View style={[styles.stepDot, step === 'form' && styles.activeDot]} />
        <View style={[styles.stepDot, step === 'summary' && styles.activeDot]} />
      </View>
    </View>
  );

  const renderSupplierStep = () => {
    const filteredSuppliers = data?.suppliers.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return (
      <View style={styles.stepContainer}>
        <ThemedText style={styles.stepTitle}>1. Choisir le fournisseur</ThemedText>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un fournisseur..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <FlatList
          data={filteredSuppliers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.itemCard,
                selectedSupplier?.id === item.id && styles.selectedItem
              ]}
              onPress={() => {
                setSelectedSupplier(item);
                setIsDeliveryModalVisible(true);
              }}
            >
              <ThemedText style={[
                styles.itemName,
                selectedSupplier?.id === item.id && styles.selectedText
              ]}>
                {item.name}
              </ThemedText>
              {selectedSupplier?.id === item.id && (
                <IconSymbol name="checkmark.circle.fill" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={{ gap: 8 }}
        />

        <Modal
          visible={isDeliveryModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsDeliveryModalVisible(false)}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>N° Bon de Livraison</ThemedText>
                <TouchableOpacity onPress={() => setIsDeliveryModalVisible(false)}>
                  <IconSymbol name="xmark.circle.fill" size={24} color="#94a3b8" />
                </TouchableOpacity>
              </View>
              
              <ThemedText style={styles.modalSubtitle}>
                Fournisseur : {selectedSupplier?.name}
              </ThemedText>

              <TextInput
                style={styles.modalInput}
                placeholder="Ex: BL-12345 (Optionnel)"
                value={deliveryNoteNumber}
                onChangeText={setDeliveryNoteNumber}
                autoFocus={true}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.modalSecondaryButton} 
                  onPress={() => setIsDeliveryModalVisible(false)}
                >
                  <ThemedText style={styles.modalSecondaryButtonText}>Annuler</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalPrimaryButton} 
                  onPress={() => {
                    setIsDeliveryModalVisible(false);
                    setStep('product');
                  }}
                >
                  <ThemedText style={styles.modalPrimaryButtonText}>Continuer</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <TouchableOpacity 
           style={[styles.secondaryButton, { marginTop: 10 }]} 
           onPress={() => router.back()}
        >
          <ThemedText style={styles.secondaryButtonText}>Retour</ThemedText>
        </TouchableOpacity>
      </View>
    );
  };

  const renderProductStep = () => {
    const filteredProducts = data?.products.filter(p => {
      const matchCat = selectedCategory === null || p.category_id === selectedCategory.id;
      const matchSearch = p.name.toLowerCase().includes(productSearchQuery.toLowerCase());
      return matchCat && matchSearch;
    }) || [];

    return (
      <View style={styles.stepContainer}>
        <ThemedText style={styles.stepTitle}>2. Choisir le produit</ThemedText>

        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <IconSymbol name="magnifyingglass" size={18} color="#94a3b8" />
            <TextInput
              style={styles.searchInputSmall}
              placeholder="Rechercher un produit..."
              value={productSearchQuery}
              onChangeText={setProductSearchQuery}
            />
            {productSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setProductSearchQuery('')}>
                <IconSymbol name="xmark.circle.fill" size={18} color="#cbd5e1" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.categoryTabs}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4 }}>
            <TouchableOpacity
              style={[styles.tab, selectedCategory === null && styles.activeTab]}
              onPress={() => setSelectedCategory(null)}
            >
              <ThemedText style={[styles.tabText, selectedCategory === null && styles.activeTabText]}>
                Touts
              </ThemedText>
            </TouchableOpacity>
            {data?.categories.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[styles.tab, selectedCategory?.id === c.id && styles.activeTab]}
                onPress={() => setSelectedCategory(c)}
              >
                <ThemedText style={[styles.tabText, selectedCategory?.id === c.id && styles.activeTabText]}>
                  {c.name}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <ScrollView style={styles.list}>
          {filteredProducts.map(p => (
            <TouchableOpacity
              key={p.id}
              style={styles.itemCard}
              onPress={() => {
                setSelectedProduct(p);
                loadProductDetails(p);
              }}
            >
              <ThemedText style={styles.itemName}>{p.name}</ThemedText>
              <IconSymbol name="plus.circle.fill" size={24} color={BeroColors.blue} />
            </TouchableOpacity>
          ))}
          {filteredProducts.length === 0 && (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ThemedText style={{ color: '#94a3b8' }}>Aucun produit trouvé</ThemedText>
            </View>
          )}
        </ScrollView>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep('supplier')}>
          <ThemedText style={styles.secondaryButtonText}>Changer fournisseur</ThemedText>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFormStep = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.stepContainer}>
        <ThemedText style={styles.stepTitle}>3. Contrôle : {selectedProduct?.name}</ThemedText>

        {editingLineIndex !== null && (
          <View style={styles.editingBanner}>
            <IconSymbol name="pencil" size={16} color="#fff" />
            <ThemedText style={styles.editingBannerText}>Vous modifiez ce produit</ThemedText>
          </View>
        )}

        {/* Photo Section */}
        <TouchableOpacity style={styles.photoBox} onPress={handlePickImage}>
          {capturedPhoto ? (
            <Image source={{ uri: capturedPhoto }} style={styles.capturedImage} />
          ) : (
            <>
              <IconSymbol name="camera.fill" size={32} color={BeroColors.blue} />
              <ThemedText style={styles.photoText}>Prendre l&apos;étiquette en photo</ThemedText>
            </>
          )}
        </TouchableOpacity>

        {/* Temperature */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <ThemedText style={styles.label}>Température à cœur (°C)</ThemedText>
            {currentProductChecklists && (
              <View style={styles.targetBadge}>
                <ThemedText style={styles.targetBadgeText}>
                  Cible: {currentProductChecklists.min_temperature}°C | {currentProductChecklists.max_temperature}°C
                </ThemedText>
              </View>
            )}
          </View>
          <TextInput
            style={[styles.input, !isTempValid && styles.inputError]}
            placeholder="Ex: 2.5"
            keyboardType="numeric"
            value={measuredTemp}
            onChangeText={setMeasuredTemp}
          />
          {!isTempValid && (
            <ThemedText style={styles.errorText}>Hors des normes autorisées</ThemedText>
          )}
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <ThemedText style={styles.label}>DLUO / DLC</ThemedText>
            <TouchableOpacity
              style={styles.dateSelector}
              onPress={() => setShowDatePicker(true)}
            >
              <IconSymbol name="calendar" size={20} color={BeroColors.blue} />
              <ThemedText style={styles.dateSelectorText}>
                {expirationDate ? expirationDate.toLocaleDateString() : 'Choisir date'}
              </ThemedText>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={expirationDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setExpirationDate(selectedDate);
                }}
              />
            )}
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <ThemedText style={styles.label}>N° de Lot</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Ex: L123"
              value={lotNumber}
              onChangeText={setLotNumber}
            />
          </View>
        </View>

        {/* Checklists */}
        {currentProductChecklists?.checklists.map(c => (
          <TouchableOpacity
            key={c.id}
            style={styles.checklistRow}
            onPress={() => setChecklistResults(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
          >
            <ThemedText style={styles.checklistName}>{c.name}</ThemedText>
            <View style={[styles.checkbox, checklistResults[c.id] && styles.checkboxActive]}>
              {checklistResults[c.id] && <IconSymbol name="checkmark" size={14} color="#fff" />}
            </View>
          </TouchableOpacity>
        ))}

        {/* Compliance Judgment moved here */}
        <View style={styles.complianceSection}>
          <ThemedText style={styles.sectionLabel}>Décision de conformité</ThemedText>
          <View style={styles.complianceToggleContainer}>
            <TouchableOpacity
              style={[styles.complianceButton, isCompliant && styles.compliantActive]}
              onPress={() => setIsCompliant(true)}
            >
              <IconSymbol name="checkmark.circle.fill" size={22} color={isCompliant ? '#fff' : '#10b981'} />
              <ThemedText style={[styles.complianceButtonText, isCompliant && styles.whiteText]}>Conforme</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.complianceButton, !isCompliant && styles.nonCompliantActive]}
              onPress={() => setIsCompliant(false)}
            >
              <IconSymbol name="xmark.circle.fill" size={22} color={!isCompliant ? '#fff' : '#ef4444'} />
              <ThemedText style={[styles.complianceButtonText, !isCompliant && styles.whiteText]}>Non Conforme</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {!isCompliant && (
          <View style={styles.reasonContainer}>
            <ThemedText style={styles.reasonLabel}>Motif de refus / Observation</ThemedText>
            <TextInput
              style={styles.reasonInput}
              placeholder="Ex: Carton endommagé, ou température critique..."
              value={nonComplianceReason}
              onChangeText={setNonComplianceReason}
              multiline
              numberOfLines={3}
            />
          </View>
        )}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={addLine}
        >
          <ThemedText style={styles.primaryButtonText}>
            {editingLineIndex !== null ? 'Mettre à jour' : 'Valider ce produit'}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => {
          resetForm();
          setStep(receptionLines.length > 0 ? 'summary' : 'product');
        }}>
          <ThemedText style={styles.secondaryButtonText}>Annuler</ThemedText>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderSummaryStep = () => (
    <View style={styles.stepContainer}>
      <ThemedText style={styles.stepTitle}>Récapitulatif : {selectedSupplier?.name}</ThemedText>

      <ScrollView style={styles.list}>
        {receptionLines.map((line, idx) => {
          const product = data?.products.find(p => p.id === line.product_id);
          return (
            <View key={idx} style={styles.lineItem}>
              <View style={styles.lineHeader}>
                <ThemedText style={styles.lineProductName}>{product?.name}</ThemedText>
                <View style={styles.lineActions}>
                  <TouchableOpacity onPress={() => editLine(idx)} style={styles.actionIcon}>
                    <IconSymbol name="pencil" size={18} color={BeroColors.blue} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeLine(idx)} style={styles.actionIcon}>
                    <IconSymbol name="trash.fill" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.lineBody}>
                <ThemedText style={[styles.lineBadge, line.is_compliant ? styles.compliantBadge : styles.nonCompliantBadge]}>
                  {line.is_compliant ? 'Conforme' : 'Non-Conforme'}
                </ThemedText>
                <ThemedText style={styles.lineDetail}>
                  Temp: {line.measured_temperature}°C | Lot: {line.lot_number || '-'}
                </ThemedText>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[styles.secondaryButton, { flex: 1 }]}
          onPress={() => setStep('product')}
        >
          <ThemedText style={styles.secondaryButtonText}>+ Ajouter produit</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, { flex: 2 }]}
          onPress={submitReception}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.primaryButtonText}>Finaliser la réception</ThemedText>
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
            <ThemedText style={{ marginTop: 10 }}>Chargement...</ThemedText>
          </View>
        ) : (
          <>
            {step === 'supplier' && renderSupplierStep()}
            {step === 'product' && renderProductStep()}
            {step === 'form' && renderFormStep()}
            {step === 'summary' && renderSummaryStep()}
          </>
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: BeroColors.dark,
    marginLeft: 8,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  stepDot: {
    width: 24,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e2e8f0',
  },
  activeDot: {
    backgroundColor: BeroColors.blue,
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: '#64748b',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  list: {
    flex: 1,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  selectedItem: {
    backgroundColor: BeroColors.blue,
    borderColor: BeroColors.blue,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: BeroColors.dark,
  },
  categoryTabs: {
    marginBottom: 20,
    backgroundColor: '#fff',
    paddingVertical: 5,
  },
  searchRow: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 48,
  },
  searchInputSmall: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 14,
    color: BeroColors.dark,
    fontWeight: '600',
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
  photoBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: BeroColors.blue,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  capturedImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  photoText: {
    marginTop: 8,
    color: BeroColors.blue,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
    color: '#ef4444',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  dateSelectorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  tempInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tempBadge: {
    backgroundColor: '#f1f5f9',
    padding: 8,
    borderRadius: 8,
    flex: 1,
  },
  tempBadgeText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  checklistRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  checklistName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: BeroColors.green,
    borderColor: BeroColors.green,
  },
  primaryButton: {
    backgroundColor: BeroColors.blue,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: BeroColors.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    padding: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '700',
  },
  lineItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: BeroColors.blue,
  },
  lineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lineProductName: {
    fontSize: 16,
    fontWeight: '800',
    color: BeroColors.dark,
    flex: 1,
  },
  lineActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionIcon: {
    padding: 4,
  },
  lineBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lineBadge: {
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    textTransform: 'uppercase',
  },
  compliantBadge: {
    backgroundColor: '#f0fdf4',
    color: BeroColors.green,
  },
  nonCompliantBadge: {
    backgroundColor: '#fef2f2',
    color: '#ef4444',
  },
  lineDetail: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 12,
    borderTopColor: '#e2e8f0',
  },
  deliveryNoteContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
    shadowColor: 'transparent',
  },
  selectedText: {
    color: '#fff',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  targetBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  targetBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: BeroColors.blue,
  },
  complianceSection: {
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 1,
  },
  reasonContainer: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  reasonLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#b91c1c',
    marginBottom: 8,
  },
  reasonInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#fee2e2',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  complianceToggleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  complianceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  compliantActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nonCompliantActive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  complianceButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#64748b',
  },
  whiteText: {
    color: '#fff',
  },
  editingBanner: {
    backgroundColor: BeroColors.blue,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  editingBannerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: BeroColors.blue,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: BeroColors.dark,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalPrimaryButton: {
    flex: 2,
    backgroundColor: BeroColors.blue,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalPrimaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  modalSecondaryButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalSecondaryButtonText: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '800',
  },
});
