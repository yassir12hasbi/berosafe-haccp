import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  FlatList,
  Alert,
} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";

// Données initiales
const INITIAL_DATABASE = {
  "Cuisine Chaude": [
    { id: "1", code: "FR-CC-01", desc: "Bac Principal 15L" },
    { id: "2", code: "FR-CC-02", desc: "Bac Viandes 10L" },
  ],
  "Garde Manger": [],
  Snack: [{ id: "3", code: "FR-SN-01", desc: "Frites Plage" }],
};

const ZONES = Object.keys(INITIAL_DATABASE);

export default function HomeScreen() {
  const [database, setDatabase] = useState(INITIAL_DATABASE);
  const [activeZone, setActiveZone] = useState(ZONES[0]);
  const [activeFryer, setActiveFryer] = useState<any>(null);
  const [temp, setTemp] = useState(160);
  const [peroxide, setPeroxide] = useState(15);
  const [oilStatus, setOilStatus] = useState<"reused" | "changed">("reused");
  const [checklist, setChecklist] = useState({
    couleur: true,
    aspect: true,
    residus: true,
    etat: true,
  });
  const [comment, setComment] = useState("");

  const handleTempChange = (delta: number) => {
    setTemp((prev) => prev + delta);
  };

  const handlePeroxideChange = (delta: number) => {
    setPeroxide((prev) => prev + delta);
  };

  const toggleOilStatus = () => {
    setOilStatus((prev) => (prev === "reused" ? "changed" : "reused"));
  };

  const toggleChecklistItem = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const saveReport = () => {
    Alert.alert("Rapport enregistré", "Le rapport a été sauvegardé avec succès !");
  };

  const renderFryerItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.fryerItem,
        activeFryer?.id === item.id && styles.activeFryer,
      ]}
      onPress={() => setActiveFryer(item)}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={styles.fryerIcon}>
          <FontAwesome5 name="burn" size={16} color="#64748b" />
        </View>
        <View>
          <Text style={styles.fryerCode}>{item.code}</Text>
          <Text style={styles.fryerDesc}>{item.desc || "Sans description"}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HUILES DE FRITURE</Text>
      </View>

      {/* Main */}
      <View style={styles.main}>
        {/* Left panel */}
        <View style={styles.leftPanel}>
          {/* Zones */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ gap: 8 }}>
            {ZONES.map((zone) => (
              <TouchableOpacity
                key={zone}
                style={[
                  styles.zoneButton,
                  activeZone === zone && styles.activeZone,
                ]}
                onPress={() => {
                  setActiveZone(zone);
                  setActiveFryer(null);
                }}
              >
                <Text
                  style={[
                    styles.zoneText,
                    activeZone === zone && { color: "white" },
                  ]}
                >
                  {zone}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Fryers */}
          <FlatList
            data={database[activeZone]}
            keyExtractor={(item) => item.id}
            renderItem={renderFryerItem}
            ListEmptyComponent={
              <Text style={{ textAlign: "center", marginTop: 20, color: "#64748b" }}>
                Aucune friteuse dans cette zone
              </Text>
            }
          />
        </View>

        {/* Right panel */}
        <ScrollView style={styles.rightPanel}>
          {!activeFryer ? (
            <View style={styles.emptyState}>
              <Ionicons name="hand-pointer" size={64} color="#cbd5e1" />
              <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                Sélectionnez une friteuse
              </Text>
              <Text style={{ color: "#64748b" }}>
                Choisissez un équipement à gauche pour commencer le contrôle.
              </Text>
            </View>
          ) : (
            <>
              {/* Température */}
              <View style={styles.inputBox}>
                <Text style={styles.inputLabel}>Température (°C)</Text>
                <View style={styles.inputRow}>
                  <TouchableOpacity onPress={() => handleTempChange(-1)}>
                    <Ionicons name="remove" size={24} color="#64748b" />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.input}
                    value={temp.toString()}
                    keyboardType="numeric"
                    onChangeText={(t) => setTemp(Number(t))}
                  />
                  <TouchableOpacity onPress={() => handleTempChange(1)}>
                    <Ionicons name="add" size={24} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Peroxyde */}
              <View style={styles.inputBox}>
                <Text style={styles.inputLabel}>Indice de Peroxyde (%)</Text>
                <View style={styles.inputRow}>
                  <TouchableOpacity onPress={() => handlePeroxideChange(-1)}>
                    <Ionicons name="remove" size={24} color="#64748b" />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.input}
                    value={peroxide.toString()}
                    keyboardType="numeric"
                    onChangeText={(t) => setPeroxide(Number(t))}
                  />
                  <TouchableOpacity onPress={() => handlePeroxideChange(1)}>
                    <Ionicons name="add" size={24} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Toggle Oil Status */}
              <TouchableOpacity
                style={[
                  styles.toggleSwitch,
                  oilStatus === "reused" ? styles.reused : styles.changed,
                ]}
                onPress={toggleOilStatus}
              >
                <Text
                  style={[
                    styles.toggleOption,
                    oilStatus === "reused" && { color: "white" },
                  ]}
                >
                  HUILE RÉUTILISÉE
                </Text>
                <Text
                  style={[
                    styles.toggleOption,
                    oilStatus === "changed" && { color: "white" },
                  ]}
                >
                  HUILE CHANGÉE
                </Text>
              </TouchableOpacity>

              {/* Checklist */}
              <View style={{ marginTop: 20 }}>
                {Object.keys(checklist).map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.checklistItem,
                      checklist[key as keyof typeof checklist] &&
                        styles.checklistItemChecked,
                    ]}
                    onPress={() => toggleChecklistItem(key)}
                  >
                    <Text style={styles.checklistText}>{key.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Comment */}
              <TextInput
                placeholder="Commentaires / Actions correctives"
                value={comment}
                onChangeText={setComment}
                multiline
                style={styles.commentBox}
              />

              <TouchableOpacity style={styles.saveButton} onPress={saveReport}>
                <Text style={styles.saveButtonText}>VALIDER LE RAPPORT DE CONTRÔLE</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  header: {
    height: 60,
    backgroundColor: "#13385E",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 10,
  },
  headerTitle: { color: "white", fontWeight: "bold", fontSize: 18 },
  main: { flex: 1, flexDirection: "row", gap: 10 },
  leftPanel: { width: "30%", padding: 10 },
  rightPanel: { flex: 1, padding: 10 },
  zoneButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  activeZone: { backgroundColor: "#13385E" },
  zoneText: { fontWeight: "bold", fontSize: 12 },
  fryerItem: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    marginVertical: 4,
  },
  activeFryer: { borderLeftWidth: 4, borderLeftColor: "#1F65A7", backgroundColor: "#eff6ff" },
  fryerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  fryerCode: { fontWeight: "bold", color: "#13385E" },
  fryerDesc: { fontSize: 10, color: "#64748b" },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8 },
  inputBox: { marginVertical: 10 },
  inputLabel: { fontSize: 11, fontWeight: "bold", marginBottom: 4 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    overflow: "hidden",
  },
  input: { flex: 1, textAlign: "center", fontSize: 20, paddingVertical: 8 },
  toggleSwitch: {
    flexDirection: "row",
    borderRadius: 25,
    overflow: "hidden",
    marginVertical: 10,
  },
  toggleOption: { flex: 1, textAlign: "center", paddingVertical: 10, fontWeight: "bold" },
  reused: { backgroundColor: "#2A8734" },
  changed: { backgroundColor: "#Eab308" },
  checklistItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ef4444",
    borderRadius: 12,
    marginVertical: 4,
  },
  checklistItemChecked: { backgroundColor: "#f0fdf4", borderColor: "#2A8734" },
  checklistText: { fontWeight: "bold", color: "#13385E" },
  commentBox: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    minHeight: 60,
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: "#13385E",
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
    alignItems: "center",
  },
  saveButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },
});