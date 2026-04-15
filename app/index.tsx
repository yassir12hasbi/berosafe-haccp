import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  ScrollView,
  useWindowDimensions,
  Animated,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/auth-context';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Line, G, ClipPath } from 'react-native-svg';

// ─── Brand Tokens ─────────────────────────────────────────────────────────────
const B = {
  dark:      '#13385E',
  blue:      '#1F65A7',
  green:     '#2A8734',
  white:     '#FFFFFF',
  slate50:   '#F8FAFC',
  slate100:  '#F1F5F9',
  slate200:  '#E2E8F0',
  slate300:  '#CBD5E1',
  slate400:  '#94A3B8',
  slate500:  '#64748B',
  slate600:  '#475569',
  slate700:  '#334155',
  slate800:  '#1E293B',
  red50:     '#FEF2F2',
  red100:    '#FECACA',
  red500:    '#EF4444',
  red600:    '#DC2626',
};

// ─── SVG Components ──────────────────────────────────────────────────────────
type IP = { size?: number; color?: string };
const S = 1.8;

// Logo BEROCERT
const LogoBerocert = ({ size = 40 }: { size?: number }) => (
  <View style={{ alignItems: 'center' }}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <ThemedText style={{ fontSize: size * 0.5, fontWeight: '900', color: B.green, letterSpacing: 2 }}>BER</ThemedText>
      <View style={{ width: size * 0.25, height: size * 0.25, position: 'relative', marginHorizontal: 4, justifyContent: 'center', alignItems: 'center' }}>
        <Svg width="100%" height="100%" viewBox="0 0 24 24"><Circle cx="12" cy="12" r="10" fill={B.blue} /></Svg>
        <Svg width="60%" height="60%" viewBox="0 0 24 24" style={{ position: 'absolute' }}><Path d="M20 6L9 17l-5-5" stroke={B.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></Svg>
      </View>
      <ThemedText style={{ fontSize: size * 0.5, fontWeight: '900', color: B.blue, letterSpacing: 2 }}>CERT</ThemedText>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginTop: 2 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: B.dark }} />
      <ThemedText style={{ fontSize: 6, fontWeight: '800', color: B.dark, letterSpacing: 3, marginHorizontal: 6, textTransform: 'uppercase' }}>Consulting</ThemedText>
      <View style={{ flex: 1, height: 1, backgroundColor: B.dark }} />
    </View>
  </View>
);

// Header Icons
const IcoMenu = ({ size = 20, color = B.blue }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M3 12h18M3 6h18M3 18h18" stroke={color} strokeWidth={S} strokeLinecap="round"/></Svg>
);
const IcoPower = ({ size = 20, color = B.red600 }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M18.36 6.64a9 9 0 11-12.73 0M12 2v10" stroke={color} strokeWidth={S} strokeLinecap="round" strokeLinejoin="round"/></Svg>
);
const IcoClose = ({ size = 18, color = B.slate400 }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={2} strokeLinecap="round"/></Svg>
);
const IcoMail = ({ size = 18, color = B.dark }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth={S}/><Path d="M22 7l-10 7L2 7" stroke={color} strokeWidth={S} strokeLinecap="round" strokeLinejoin="round"/></Svg>
);

// Module Main Icons
const IcoTruck = ({ size = 32, color = B.blue }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Rect x="1" y="3" width="15" height="13" rx="2" stroke={color} strokeWidth={S}/><Path d="M16 8h4l3 4v4h-7V8z" stroke={color} strokeWidth={S} strokeLinejoin="round"/><Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth={S}/><Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth={S}/></Svg>
);
const IcoBarcode = ({ size = 32, color = B.blue }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M3 5v14M6 5v14M8 5v14M11 5v14M14 5v14M16 5v14M19 5v14M21 5v14" stroke={color} strokeWidth={S} strokeLinecap="round"/></Svg>
);
const IcoChart = ({ size = 32, color = B.blue }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M12 20V10M18 20V4M6 20v-4" stroke={color} strokeWidth={S} strokeLinecap="round"/><Circle cx="12" cy="7" r="3" stroke={color} strokeWidth={S}/></Svg>
);
const IcoSpray = ({ size = 32, color = B.blue }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M9 3h6v4H9zM12 7v5M8 12h8l-1.5 8h-5L8 12z" stroke={color} strokeWidth={S} strokeLinejoin="round"/><Path d="M12 9v.01" stroke={color} strokeWidth={3} strokeLinecap="round"/></Svg>
);
const IcoFridge = ({ size = 32, color = B.blue }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Rect x="5" y="2" width="14" height="20" rx="2" stroke={color} strokeWidth={S}/><Path d="M5 10h14" stroke={color} strokeWidth={S}/><Path d="M9 6v2M9 14v4" stroke={color} strokeWidth={S} strokeLinecap="round"/></Svg>
);
const IcoApple = ({ size = 32, color = B.green }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M12 4c-1-2-3-2-3-2s1 3 2 4" stroke={color} strokeWidth={S} strokeLinecap="round"/><Path d="M12 8C8.5 8 6 11 6 15c0 4 2.5 7 6 7s6-3 6-7c0-4-2.5-7-6-7z" stroke={color} strokeWidth={S}/></Svg>
);
const IcoFire = ({ size = 32, color = B.blue }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" stroke={color} strokeWidth={S} strokeLinejoin="round"/></Svg>
);
const IcoSnowflake = ({ size = 32, color = B.blue }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9L4.9 19.1" stroke={color} strokeWidth={S} strokeLinecap="round"/></Svg>
);
const IcoMeat = ({ size = 32, color = B.blue }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M8 2v6M16 2v6M3 8h18l-1.5 9A2 2 0 0115.51 19H8.49A2 2 0 016.5 17L5 8z" stroke={color} strokeWidth={S} strokeLinejoin="round"/><Path d="M3 8v-2a2 2 0 012-2h0" stroke={color} strokeWidth={S} strokeLinecap="round"/></Svg>
);
const IcoPot = ({ size = 32, color = B.blue }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M8 7V5a1 1 0 011-1h6a1 1 0 011 1v2" stroke={color} strokeWidth={S}/><Rect x="4" y="7" width="16" height="2" rx="1" fill={color}/><Rect x="4" y="9" width="16" height="13" rx="2" stroke={color} strokeWidth={S}/><Circle cx="8" cy="13" r="1.5" fill={color}/><Circle cx="16" cy="13" r="1.5" fill={color}/></Svg>
);
const IcoUsers = ({ size = 32, color = B.blue }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={color} strokeWidth={S} strokeLinecap="round"/><Circle cx="9" cy="7" r="4" stroke={color} strokeWidth={S}/><Path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke={color} strokeWidth={S} strokeLinecap="round"/></Svg>
);
const IcoFolder = ({ size = 32, color = B.white }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" stroke={color} strokeWidth={S} strokeLinejoin="round"/></Svg>
);

// Micro Icons (Pour les badges des tuiles)
const MicroBox = ({ size = 20, color = B.green }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0022 16z" stroke={color} strokeWidth={2} strokeLinejoin="round"/></Svg>
);
const MicroTag = ({ size = 20, color = B.green }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke={color} strokeWidth={2}/><Circle cx="7" cy="7" r="1" fill={color}/></Svg>
);
const MicroDrop = ({ size = 20, color = B.green }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" stroke={color} strokeWidth={2} strokeLinejoin="round"/></Svg>
);
const MicroTemp = ({ size = 20, color = B.green }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M14 14.76V5a2 2 0 00-4 0v9.76A4 4 0 1014 14.76z" stroke={color} strokeWidth={2} strokeLinejoin="round"/><Path d="M10 9h4" stroke={color} strokeWidth={2} strokeLinecap="round"/></Svg>
);
const MicroSnow = ({ size = 20, color = B.white }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9L4.9 19.1" stroke={color} strokeWidth={2} strokeLinecap="round"/></Svg>
);
const MicroArrow = ({ size = 20, color = B.green }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M12 5v14M19 12l-7 7-7-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></Svg>
);
const MicroNurse = ({ size = 20, color = B.green }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M12 2a5 5 0 015 5v3H7V7a5 5 0 015-5z" stroke={color} strokeWidth={2}/><Path d="M4 21v-2a7 7 0 0116 0v2" stroke={color} strokeWidth={2} strokeLinecap="round"/></Svg>
);

// Sidebar Icons
const IcoShield = ({ size = 20, color = B.blue }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth={S} strokeLinejoin="round"/></Svg>
);
const IcoContract = ({ size = 20, color = B.green }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={color} strokeWidth={S}/><Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth={S} strokeLinecap="round" strokeLinejoin="round"/></Svg>
);
const IcoHeadset = ({ size = 18, color = B.blue }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M3 18v-6a9 9 0 0118 0v6" stroke={color} strokeWidth={S}/><Path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" stroke={color} strokeWidth={S}/></Svg>
);

// ─── Module definitions ────────────────────────────────────────────────────────
const MODULES = [
  { key: 'reception', title: 'Contrôle à la réception', route: '/reception', Icon: IcoTruck, Micro: MicroBox, isDark: false },
  { key: 'labeling', title: 'Impression des étiquettes', route: '/labeling', Icon: IcoBarcode, Micro: MicroTag, isDark: false },
  { key: 'traceability', title: 'Suivi de traçabilité', route: '/traceability', Icon: IcoChart, Micro: null, isDark: false },
  { key: 'cleaning', title: 'Nettoyage & Désinfection', route: '/cleaning-disinfection', Icon: IcoSpray, Micro: MicroDrop, isDark: false },
  { key: 'fridge', title: 'Températures des frigos', route: '/temperature-control', Icon: IcoFridge, Micro: MicroSnow, isDark: false },
  { key: 'fruits', title: 'Désinfection Fruits & Légumes', route: '/fruit_vegetables_disinfection', Icon: IcoApple, Micro: MicroNurse, isDark: false },
  { key: 'cooking', title: 'Suivi de cuisson', route: '/cooking', Icon: IcoFire, Micro: MicroTemp, isDark: false },
  { key: 'cooling', title: 'Suivi de refroidissement', route: '/cooling', Icon: IcoSnowflake, Micro: MicroArrow, isDark: false },
  { key: 'reheating', title: 'Suivi de réchauffage', route: '/reheating', Icon: IcoMeat, Micro: MicroTemp, isDark: false },
  { key: 'oil', title: 'Huiles de friture', route: '/oil-control', Icon: IcoPot, Micro: MicroDrop, isDark: false },
  { key: 'hygiene', title: 'Hygiène personnel & visiteurs', route: '/personal-hygiene', Icon: IcoUsers, Micro: MicroNurse, isDark: false },
  { key: 'records', title: 'Accès aux enregistrements', route: '/records', Icon: IcoFolder, Micro: null, isDark: true },
];

// ─── Tile Component ────────────────────────────────────────────────────────────
function ModuleTile({ module, size, isTablet, onPress }: { module: typeof MODULES[number]; size: number; isTablet: boolean; onPress: () => void }) {
  const iconSize = isTablet ? 56 : 48;
  const microSize = isTablet ? 28 : 22;
  const isDarkTile = module.isDark;
  const mainColor = isDarkTile ? B.white : B.blue;
  const secColor = isDarkTile ? B.white : B.green;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.tile,
        {
          width: size,
          height: size,
          backgroundColor: isDarkTile ? B.dark : B.white,
          borderColor: isDarkTile ? B.blue : B.slate200,
          transform: [{ scale: pressed ? 0.95 : 1 }] // active:scale-95
        }
      ]}
      onPress={onPress}
    >
      {isDarkTile && <View style={styles.darkTileHalo} />}

      <View style={styles.tileContent}>
        <View style={styles.iconContainer}>
          {/* Blob Fluide (icon-bg-shape) */}
          <View style={[
            styles.iconBlob,
            { backgroundColor: isDarkTile ? 'rgba(255,255,255,0.1)' : 'rgba(31, 101, 167, 0.08)', transform: [{ rotate: isDarkTile ? '45deg' : '0deg' }] }
          ]} />

          <module.Icon size={iconSize} color={mainColor} />

          {module.Micro && (
            <View style={[styles.microIconShell, { backgroundColor: isDarkTile ? 'rgba(255,255,255,0.2)' : B.white, borderColor: isDarkTile ? 'transparent' : B.white }]}>
              <module.Micro size={microSize} color={secColor} />
            </View>
          )}
        </View>

        <ThemedText style={[styles.tileTitle, isDarkTile && styles.tileTitleDark, isTablet && styles.tileTitleTablet]} numberOfLines={2}>
          {module.title}
        </ThemedText>
      </View>
    </Pressable>
  );
}

// ─── Dashboard Screen ──────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { signOut, user } = useAuth();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const { width } = useWindowDimensions();

  // Sidebar Animation
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const slideAnim = useState(new Animated.Value(-320))[0]; // -width par défaut

  const isTablet   = width >= 768;
  const numColumns = isTablet ? (width >= 1024 ? 5 : 4) : 2;
  const GAP        = isTablet ? 24 : 16;
  const PADDING    = isTablet ? 40 : 20;

  const TILE_SIZE = useMemo(
    () => (width - PADDING * 2 - GAP * (numColumns - 1)) / numColumns,
    [width, numColumns, GAP, PADDING],
  );

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const dateStr = currentTime.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const toggleSidebar = () => {
    if (sidebarOpen) {
      Animated.timing(slideAnim, { toValue: -320, duration: 300, useNativeDriver: true }).start(() => setSidebarOpen(false));
    } else {
      setSidebarOpen(true);
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaProvider style={{ flex: 1 }}>

        {/* ── Sidebar Overlay ── */}
        {sidebarOpen && (
          <Pressable style={styles.overlay} onPress={toggleSidebar}>
            <View style={styles.overlayBg} />
          </Pressable>
        )}

        {/* ── Sidebar Drawer ── */}
        {sidebarOpen && (
          <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
            <View style={styles.sidebarHeader}>
              <LogoBerocert size={28} />
              <Pressable onPress={toggleSidebar} style={styles.sidebarCloseBtn}>
                <IcoClose color={B.slate400} />
              </Pressable>
            </View>

            <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
              <ThemedText style={styles.sidebarSectionTitle}>MON ESPACE</ThemedText>

              <Pressable style={styles.sidebarLink}>
                <View style={[styles.sidebarIconBox, { backgroundColor: B.blue + '15' }]}>
                  <IcoShield size={20} color={B.blue} />
                </View>
                <ThemedText style={styles.sidebarText}>Mon profil</ThemedText>
              </Pressable>

              <Pressable style={styles.sidebarLink}>
                <View style={[styles.sidebarIconBox, { backgroundColor: B.green + '15' }]}>
                  <IcoContract size={20} color={B.green} />
                </View>
                <ThemedText style={styles.sidebarText}>Licence d'utilisation</ThemedText>
              </Pressable>
            </ScrollView>

            <View style={styles.sidebarFooter}>
              <ThemedText style={styles.sidebarSectionTitle}>ASSISTANCE TECHNIQUE</ThemedText>
              <Pressable style={styles.sidebarLinkSm}>
                <View style={[styles.sidebarIconBoxSm, { backgroundColor: B.blue + '10' }]}>
                  <IcoHeadset size={18} color={B.blue} />
                </View>
                <ThemedText style={styles.sidebarTextSm}>Contacter le support</ThemedText>
              </Pressable>
              <Pressable style={styles.sidebarLinkSm} onPress={() => Linking.openURL('mailto:contact@berocert.ma')}>
                <View style={[styles.sidebarIconBoxSm, { backgroundColor: B.slate100 }]}>
                  <IcoMail size={18} color={B.dark} />
                </View>
                <View>
                  <ThemedText style={styles.sidebarTextSm}>Envoyer un mail</ThemedText>
                  <ThemedText style={styles.sidebarMailSub}>contact@berocert.ma</ThemedText>
                </View>
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* ── Header ── */}
        <SafeAreaView edges={['top']} style={styles.headerSafe}>
          <View style={styles.header}>
            {/* Left */}
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable onPress={toggleSidebar} style={styles.menuBtn} activeOpacity={0.7}>
                <IcoMenu size={20} color={B.blue} />
              </Pressable>
              {isTablet && (
                <View style={styles.userPill}>
                  <View style={styles.userPillAvatar}><ThemedText style={{color: B.white, fontWeight: '800', fontSize: 12}}>{user?.first_name?.[0] || 'U'}</ThemedText></View>
                  <View>
                    <ThemedText style={styles.userPillName}>{user?.first_name || 'UTILISATEUR'}</ThemedText>
                    <ThemedText style={styles.userPillRole}>Cuisine Centrale</ThemedText>
                  </View>
                </View>
              )}
            </View>

            {/* Center */}
            <View style={{ flex: 1, alignItems: 'center' }}>
              <LogoBerocert size={isTablet ? 45 : 35} />
            </View>

            {/* Right */}
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
              <View style={styles.langToggle}>
                <View style={styles.langBtnActive}><ThemedText style={styles.langTextActive}>FR</ThemedText></View>
                <View style={styles.langBtn}><ThemedText style={styles.langText}>AR</ThemedText></View>
              </View>

              {isTablet && (
                <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
                  <ThemedText style={styles.clockTime}>{timeStr}</ThemedText>
                  <ThemedText style={styles.clockDate}>{dateStr}</ThemedText>
                </View>
              )}

              <Pressable onPress={signOut} style={styles.logoutBtn} activeOpacity={0.7}>
                <IcoPower size={18} color={B.red600} />
              </Pressable>
            </View>
          </View>
        </SafeAreaView>

        {/* ── Grid ── */}
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: PADDING, paddingTop: GAP, paddingBottom: PADDING * 2 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.grid, { gap: GAP }]}>
            {MODULES.map((mod) => (
              <ModuleTile
                key={mod.key}
                module={mod}
                size={TILE_SIZE}
                isTablet={isTablet}
                onPress={() => router.push(mod.route as any)}
              />
            ))}
          </View>
        </ScrollView>

      </SafeAreaProvider>
    </ThemedView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: B.slate100 },

  // Sidebar
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 60, justifyContent: 'center', alignItems: 'center' },
  overlayBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(19, 56, 94, 0.6)' },
  sidebar: {
    position: 'absolute', top: 0, bottom: 0, left: 0, width: 320,
    backgroundColor: B.white, zIndex: 70,
    borderTopRightRadius: 24, borderBottomRightRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 10, height: 0 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10,
    flexDirection: 'column'
  },
  sidebarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: B.slate100, backgroundColor: B.slate50 },
  sidebarCloseBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: B.white, borderWidth: 1, borderColor: B.slate200, alignItems: 'center', justifyContent: 'center' },
  sidebarSectionTitle: { fontSize: 10, fontWeight: '900', color: B.slate400, letterSpacing: 1.5, marginBottom: 12, textTransform: 'uppercase' },
  sidebarLink: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16, marginBottom: 4 },
  sidebarIconBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sidebarText: { fontSize: 15, fontWeight: '700', color: B.dark },
  sidebarFooter: { padding: 24, backgroundColor: B.slate50, borderTopWidth: 1, borderTopColor: B.slate100 },
  sidebarLinkSm: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, backgroundColor: B.white, borderWidth: 1, borderColor: B.slate200, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  sidebarIconBoxSm: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sidebarTextSm: { fontSize: 14, fontWeight: '700', color: B.dark },
  sidebarMailSub: { fontSize: 11, color: B.blue, fontWeight: '600', marginTop: 2 },

  // Header
  headerSafe: { backgroundColor: B.white, borderBottomWidth: 1, borderBottomColor: B.slate200, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 3, zIndex: 50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, height: 80 },
  menuBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: B.slate100, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  userPill: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: B.slate50, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: B.slate100 },
  userPillAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: B.blue, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  userPillName: { fontSize: 12, fontWeight: '900', color: B.dark, textTransform: 'uppercase', letterSpacing: 1 },
  userPillRole: { fontSize: 10, fontWeight: '700', color: B.green },
  langToggle: { flexDirection: 'row', backgroundColor: B.slate100, padding: 4, borderRadius: 12, borderWidth: 1, borderColor: B.slate200 },
  langBtnActive: { backgroundColor: B.white, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  langBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  langTextActive: { fontSize: 10, fontWeight: '900', color: B.blue },
  langText: { fontSize: 10, fontWeight: '900', color: B.slate400 },
  clockTime: { fontSize: 20, fontWeight: '900', color: B.blue, letterSpacing: -0.5 },
  clockDate: { fontSize: 10, fontWeight: '700', color: B.slate400, textTransform: 'uppercase', letterSpacing: 1 },
  logoutBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: B.red50, borderWidth: 1, borderColor: B.red100, alignItems: 'center', justifyContent: 'center' },

  // Grid & Tiles
  scrollContent: { flexGrow: 1, alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: '100%' },
  tile: {
    borderRadius: 24, borderWidth: 1, overflow: 'hidden',
    shadowColor: 'rgba(31, 101, 167, 0.08)', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 1, shadowRadius: 25, elevation: 4,
  },
  tileContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, gap: 16 },
  iconContainer: { width: '75%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  iconBlob: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    // Reproduit le border-radius organique CSS : 35% 65% 50% 50% / 50% 40% 60% 50%
    borderRadius: [35, 50, 65, 40, 50, 60, 50, 50],
  },
  microIconShell: {
    position: 'absolute', bottom: -5, right: -5, width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4,
  },
  darkTileHalo: { position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.05)' },
  tileTitle: { fontSize: 12, fontWeight: '700', color: B.dark, textAlign: 'center', lineHeight: 16 },
  tileTitleDark: { color: B.white },
  tileTitleTablet: { fontSize: 14, lineHeight: 18 },
});