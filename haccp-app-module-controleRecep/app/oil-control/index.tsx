import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

interface Fryer {
  id: string;
  code: string;
  desc: string;
}

interface Database {
  [key: string]: Fryer[];
}

const COLORS = {
  primary: '#13385E',
  secondary: '#1F65A7',
  green: '#2A8734',
  yellow: '#Eab308',
  red: '#ef4444',
  bg: '#f1f5f9',
  white: '#ffffff',
  slate200: '#e2e8f0',
  slate500: '#64748b',
  slate700: '#334155',
};

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

const OilControlScreen: React.FC = () => {
  const [database, setDatabase] = useState<Database>({
    "Cuisine Chaude": [
      { id: "1", code: "FR-CC-01", desc: "Bac Principal 15L" },
      { id: "2", code: "FR-CC-02", desc: "Bac Viandes 10L" }
    ],
    "Garde Manger": [],
    "Snack": [
      { id: "3", code: "FR-SN-01", desc: "Frites Plage" }
    ]
  });

  const [zones] = useState<string[]>(Object.keys(database));
  const [activeZone, setActiveZone] = useState<string>(zones[0]);
  const [activeFryer, setActiveFryer] = useState<Fryer | null>(null);

  const [inputTemp, setInputTemp] = useState<string>('');
  const [inputPeroxide, setInputPeroxide] = useState<string>('');
  const [oilStatus, setOilStatus] = useState<'reused' | 'changed'>('reused');
  const [comment, setComment] = useState<string>('');
  const [checklist, setChecklist] = useState({
    cl_couleur: true,
    cl_aspect: true,
    cl_residus: true,
    cl_etat: true,
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [newFryerCode, setNewFryerCode] = useState('');
  const [newFryerDesc, setNewFryerDesc] = useState('');
  const [showToast, setShowToast] = useState(false);

  const isTempHigh = parseFloat(inputTemp) > 180;
  const isPeroxideHigh = parseFloat(inputPeroxide) >= 24;
  const hasNC = isTempHigh || isPeroxideHigh;

  useEffect(() => {
    if (hasNC) {
      setOilStatus('changed');
    } else if (inputTemp && inputPeroxide) {
      setOilStatus('reused');
    }
  }, [inputTemp, inputPeroxide, hasNC]);

  const handleSelectFryer = (fryer: Fryer) => {
    setActiveFryer(fryer);
    setInputTemp('');
    setInputPeroxide('');
    setComment('');
    setOilStatus('reused');
    setChecklist({
      cl_couleur: true,
      cl_aspect: true,
      cl_residus: true,
      cl_etat: true,
    });
  };

  const adjustValue = (type: 'temp' | 'peroxide', delta: number) => {
    const currentVal = parseFloat(type === 'temp' ? inputTemp : inputPeroxide) || (type === 'temp' ? 160 : 15);
    const setter = type === 'temp' ? setInputTemp : setInputPeroxide;
    setter((currentVal + delta).toString());
  };

  const toggleCheckItem = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleOilStatusToggle = () => {
    if (isPeroxideHigh) {
      Alert.alert("Action impossible", "Indice de peroxyde ≥ 24%. Changement obligatoire !");
      return;
    }
    setOilStatus(prev => prev === 'reused' ? 'changed' : 'reused');
  };

  const handleSaveReport = () => {
    if (!activeFryer) return;
    if (!inputTemp || !inputPeroxide) {
      Alert.alert("Erreur", "Saisissez température et indice de peroxyde.");
      return;
    }

    const report = {
      date: new Date().toISOString(),
      zone: activeZone,
      fryer: activeFryer.code,
      temperature: inputTemp,
      peroxide: inputPeroxide,
      decision: oilStatus === 'changed' ? 'Changée' : 'Réutilisée',
      checklist,
      comment,
      user: "Chef MAY"
    };
    console.log("Rapport Sauvegardé :", report);

    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      setActiveFryer(null);
    }, 2000);
  };

  const handleAddFryer = () => {
    if (!newFryerCode.trim()) {
      Alert.alert("Erreur", "Le code est requis.");
      return;
    }
    const newFryer: Fryer = { id: Date.now().toString(), code: newFryerCode.toUpperCase(), desc: newFryerDesc };
    setDatabase(prev => ({ ...prev, [activeZone]: [...(prev[activeZone] || []), newFryer] }));
    setModalVisible(false);
    setNewFryerCode('');
    setNewFryerDesc('');
    handleSelectFryer(newFryer);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn}>
            <FontAwesome5 name="arrow-left" size={18} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>HUILES DE FRITURE</Text>
          <View style={styles.userBadge}>
            <FontAwesome5 name="user-tie" size={16} color="white" />
            <Text style={styles.userName}>Chef MAY</Text>
          </View>
        </View>

        {/* CONTENU PRINCIPAL */}
        <View style={[styles.mainContent, { flexDirection: isTablet ? 'row' : 'column' }]}>
          {/* LISTE FRITEUSES */}
          <View style={[styles.leftPanel, { width: isTablet ? '35%' : '100%' }]}>
            <ScrollView style={styles.zonesScroll} horizontal={!isTablet}>
              {zones.map(z => (
                <TouchableOpacity
                  key={z}
                  onPress={() => { setActiveZone(z); setActiveFryer(null); }}
                  style={[styles.zoneBtn, activeZone === z && styles.zoneBtnActive]}
                >
                  <Text style={[styles.zoneBtnText, activeZone === z && styles.zoneBtnTextActive]}>{z}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView style={styles.fryerList}>
              {database[activeZone]?.length === 0 ? (
                <Text style={styles.emptyText}>Aucune friteuse.</Text>
              ) : (
                database[activeZone].map(f => (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => handleSelectFryer(f)}
                    style={[styles.fryerItem, activeFryer?.id === f.id && styles.fryerItemActive]}
                  >
                    <View style={styles.fryerIconBg}>
                      <FontAwesome5 name="fire-burner" color={COLORS.slate500} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fryerCode}>{f.code}</Text>
                      <Text style={styles.fryerDesc}>{f.desc || 'Sans description'}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>

          {/* FORMULAIRE */}
          <View style={[styles.rightPanel, { width: isTablet ? '65%' : '100%' }]}>
            {!activeFryer ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>Sélectionnez une friteuse</Text>
              </View>
            ) : (
              <ScrollView style={styles.formScroll}>
                <Text style={styles.formTitle}>Rapport: {activeFryer.code}</Text>

                <View style={styles.measuresRow}>
                  <View style={styles.inputCard}>
                    <Text>Température (°C)</Text>
                    <View style={styles.inputGroup}>
                      <TouchableOpacity onPress={() => adjustValue('temp', -1)}>
                        <FontAwesome5 name="minus" size={14} />
                      </TouchableOpacity>
                      <TextInput
                        value={inputTemp}
                        onChangeText={setInputTemp}
                        keyboardType="numeric"
                        style={styles.numericInput}
                        placeholder="160"
                      />
                      <TouchableOpacity onPress={() => adjustValue('temp', 1)}>
                        <FontAwesome5 name="plus" size={14} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.inputCard}>
                    <Text>Indice Peroxyde (%)</Text>
                    <View style={styles.inputGroup}>
                      <TouchableOpacity onPress={() => adjustValue('peroxide', -1)}>
                        <FontAwesome5 name="minus" size={14} />
                      </TouchableOpacity>
                      <TextInput
                        value={inputPeroxide}
                        onChangeText={setInputPeroxide}
                        keyboardType="numeric"
                        style={styles.numericInput}
                        placeholder="15"
                      />
                      <TouchableOpacity onPress={() => adjustValue('peroxide', 1)}>
                        <FontAwesome5 name="plus" size={14} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <TouchableOpacity onPress={handleSaveReport} style={styles.saveBtn}>
                  <Text style={styles.saveBtnText}>VALIDER LE RAPPORT</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    backgroundColor: COLORS.primary,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 },
  headerTitle: { color: 'white', fontWeight: '700', fontSize: 18 },
  userBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userName: { color: 'white', fontWeight: '600' },

  mainContent: { flex: 1, gap: 12 },
  leftPanel: { backgroundColor: 'white', padding: 8, borderRadius: 12 },
  rightPanel: { backgroundColor: 'white', padding: 12, borderRadius: 12 },

  zonesScroll: { marginBottom: 8 },
  zoneBtn: { padding: 8, marginRight: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.slate200 },
  zoneBtnActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  zoneBtnText: { fontSize: 12, color: COLORS.slate700 },
  zoneBtnTextActive: { color: 'white' },

  fryerList: { flex: 1 },
  fryerItem: { flexDirection: 'row', alignItems: 'center', padding: 8, borderBottomWidth: 1, borderColor: COLORS.slate200 },
  fryerItemActive: { backgroundColor: '#eff6ff' },
  fryerIconBg: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.slate200, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  fryerCode: { fontWeight: '700' },
  fryerDesc: { fontSize: 12, color: COLORS.slate500 },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyStateTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.slate500 },

  formScroll: { flex: 1 },
  formTitle: { fontWeight: '700', fontSize: 16, marginBottom: 12 },

  measuresRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  inputCard: { flex: 1, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.slate200 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  numericInput: { borderWidth: 1, borderColor: COLORS.slate200, padding: 4, width: 60, textAlign: 'center', borderRadius: 4 },

  saveBtn: { backgroundColor: COLORS.primary, padding: 12, marginTop: 12, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: '700' },
});

export default OilControlScreen;