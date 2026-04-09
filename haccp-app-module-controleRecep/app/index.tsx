import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/auth-context';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { IconSymbol } from '../components/ui/icon-symbol';
import { BeroColors } from '../constants/theme';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Renommé en DashboardScreen pour clarté, mais c'est bien un export default
export default function DashboardScreen() {
  const { signOut } = useAuth();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Responsive layout logic
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const numColumns = isTablet ? 4 : 2;
  const GAP = isTablet ? 32 : 20;
  const PADDING = isTablet ? 48 : 24;

  // Calcul dynamique de la taille des tuiles
  const TILE_SIZE = useMemo(() => {
    return (width - (PADDING * 2) - (GAP * (numColumns - 1))) / numColumns;
  }, [width, isTablet, numColumns, GAP, PADDING]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = () => {
    return currentTime.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatTime = () => {
    return currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateTimeLine = () => {
    return `${formatDate()} • ${formatTime()}`;
  };

  // Styles dynamiques basés sur isTablet (pour éviter l'erreur de scope)
  const dynamicHeaderLogo = { width: isTablet ? 160 : 140, height: isTablet ? 40 : 32 };
  const dynamicIconShell = { width: isTablet ? 90 : 80, height: isTablet ? 90 : 80 };

  const modules = [
    {
      key: 'reception',
      title: 'Contrôle à la réception',
      route: '/reception' as any,
      icon: 'reception' as const,
      iconColor: '#2563EB',
      iconBg: '#EFF6FF',
      accent: '#2563EB',
      badgeIcon: 'box' as const,
      badgeColor: '#2563EB',
    },
    {
      key: 'traceability',
      title: 'Suivi de traçabilité',
      route: '/traceability' as any,
      icon: 'traceability' as const,
      iconColor: '#16A34A',
      iconBg: '#F0FDF4',
      accent: '#16A34A',
    },
    {
      key: 'labeling',
      title: 'Impression Étiquettes',
      route: '/labeling' as any,
      icon: 'tags' as const,
      iconColor: '#EA580C',
      iconBg: '#FFF7ED',
      accent: '#EA580C',
      badgeIcon: 'print' as const,
      badgeColor: '#EA580C',
    },
    {
      key: 'oil-control',
      title: 'Contrôle des Huiles',
      route: '/oil-control' as any,
      icon: 'oil' as const,
      iconColor: '#0891B2',
      iconBg: '#ECFEFF',
      accent: '#0891B2',
      badgeIcon: 'fryer' as const,
      badgeColor: '#0891B2',
    },
    {
      key: 'temperature-control',
      title: 'Contrôle Température',
      route: '/temperature-control' as any,
      icon: 'thermometer' as const,
      iconColor: '#F43F5E',
      iconBg: '#FEF2F2',
      accent: '#F43F5E',
      badgeIcon: 'temperature-high' as const,
      badgeColor: '#F43F5E',
    },
    // Nouveaux modules HACCP
    {
      key: 'cleaning',
      title: 'Nettoyage & Désinfection',
      route: '/cleaning' as any,
      icon: 'broom' as const,
      iconColor: '#047857',
      iconBg: '#DCFCE7',
      accent: '#047857',
    },
    {
      key: 'fridge-temp',
      title: 'Températures frigos',
      route: '/fridge-temp' as any,
      icon: 'snowflake' as const,
      iconColor: '#1E3A8A',
      iconBg: '#DBEAFE',
      accent: '#1E3A8A',
    },
    {
      key: 'fruits-vegetables',
      title: 'Fruits & légumes',
      route: '/fruits-vegetables' as any,
      icon: 'apple-alt' as const,
      iconColor: '#16A34A',
      iconBg: '#DCFCE7',
      accent: '#16A34A',
    },
    {
      key: 'cooking',
      title: 'Cuisson',
      route: '/cooking' as any,
      icon: 'utensils' as const,
      iconColor: '#F59E0B',
      iconBg: '#FEF3C7',
      accent: '#F59E0B',
    },
    {
      key: 'cooling',
      title: 'Refroidissement',
      route: '/cooling' as any,
      icon: 'temperature-low' as const,
      iconColor: '#0284C7',
      iconBg: '#E0F2FE',
      accent: '#0284C7',
    },
    {
      key: 'defrosting',
      title: 'Décongélation',
      route: '/defrosting' as any,
      icon: 'ice-cream' as const,
      iconColor: '#0EA5E9',
      iconBg: '#E0F2FE',
      accent: '#0EA5E9',
    },
    {
      key: 'reheating',
      title: 'Réchauffage',
      route: '/reheating' as any,
      icon: 'fire' as const,
      iconColor: '#DC2626',
      iconBg: '#FEE2E2',
      accent: '#DC2626',
    },
    {
      key: 'personal-hygiene',
      title: 'Hygiène personnel',
      route: '/personal-hygiene' as any,
      icon: 'user-shield' as const,
      iconColor: '#9333EA',
      iconBg: '#F3E8FF',
      accent: '#9333EA',
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaProvider style={{ flex: 1 }}>
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerLeft}>
                 <Image
                   source={require('../assets/images/logo.png')}
                   style={[styles.logoImage, dynamicHeaderLogo]}
                   resizeMode="contain"
                 />
              </View>

              <View style={styles.headerRight}>
                <View style={styles.timeContainer}>
                  <IconSymbol name="clock" size={14} color="#64748B" />
                  <ThemedText style={styles.dateTimeLine}>{formatDateTimeLine()}</ThemedText>
                </View>
                 <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
                    <IconSymbol name="logout" size={16} color="#475569" />
                    <ThemedText style={styles.logoutLabel}>Quitter</ThemedText>
                 </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: PADDING, paddingBottom: PADDING * 1.5, paddingTop: isTablet ? 40 : 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.grid, { gap: GAP }]}>
            {modules.map((module) => (
              <TouchableOpacity
                key={module.key}
                activeOpacity={0.85}
                style={[
                  styles.tile,
                  { width: TILE_SIZE, height: TILE_SIZE },
                ]}
                onPress={() => router.push(module.route)}
              >
                <View style={[styles.tileAccent, { backgroundColor: module.accent }]} />

                <View style={styles.tileContent}>
                  {/* Ici on applique les styles dynamiques via tableau */}
                  <View style={[styles.iconShell, dynamicIconShell, { backgroundColor: module.iconBg, borderColor: module.iconColor + '20' }]}>
                    <IconSymbol name={module.icon} size={isTablet ? 42 : 36} color={module.iconColor} />
                    {module.badgeIcon ? (
                      <View style={[styles.subIconBadge, { borderColor: module.iconBg }]}>
                        <IconSymbol name={module.badgeIcon} size={12} color={module.badgeColor ?? module.iconColor} />
                      </View>
                    ) : null}
                  </View>
                  <ThemedText style={styles.tileTitle} numberOfLines={2}>{module.title}</ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaProvider>
    </ThemedView>
  );
}

// Styles statiques (plus de référence à isTablet ici)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  headerSafeArea: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  logoImage: {
    // La largeur/hauteur sont gérées dynamiquement
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 16,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dateTimeLine: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  logoutButton: {
    height: 36,
    minWidth: 90,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  logoutLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    lineHeight: 18,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tile: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  tileAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  tileContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 5,
  },
  iconShell: {
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },
  subIconBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 26,
    height: 26,
    backgroundColor: '#fff',
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  tileTitle: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    color: '#1E293B',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
});