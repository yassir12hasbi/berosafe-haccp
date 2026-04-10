import React, { useMemo, useState, useRef } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  useWindowDimensions,
  Animated,
  ScrollView,
  TouchableOpacity,
  Linking, // ✅ important ici
} from 'react-native';

import { useAuth } from '../../context/auth-context';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { getErrorDetails } from '../../utils/error';

// ─── Brand tokens ────────────────────────────────────────────────────────────
const BRAND = {
  navyDark:   '#0F2547',
  navy:       '#1A3B6E',
  navyLight:  '#234F91',
  green:      '#2DB34A',
  greenDark:  '#229E3D',
  teal:       '#00B8A0',
  ice:        '#EFF6FF',
  iceBorder:  '#DBEAFE',
  white:      '#FFFFFF',
  slate50:    '#F8FAFC',
  slate100:   '#F1F5F9',
  slate200:   '#E2E8F0',
  slate400:   '#94A3B8',
  slate600:   '#475569',
  slate800:   '#1E293B',
  slate900:   '#0F172A',
  red:        '#B91C1C',
  redBg:      '#FEF2F2',
  redBorder:  '#FECACA',
};

// ─── Module chip list ────────────────────────────────────────────────────────
const MODULE_CHIPS = [
  { label: 'Réception',    color: BRAND.green },
  { label: 'Étiquetage',   color: BRAND.teal },
  { label: 'Traçabilité',  color: '#60A5FA' },
  { label: 'Contrôles',    color: '#FBBF24' },
  { label: 'Alertes CCP',  color: '#F87171' },
];

// ─── Password strength helper ────────────────────────────────────────────────
function getPasswordStrength(pwd: string): number {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8)  score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score; // 0–4
}

const STRENGTH_COLORS = ['#E2E8F0', '#F87171', '#FBBF24', '#60A5FA', BRAND.green];
const STRENGTH_LABELS = ['', 'Faible', 'Moyen', 'Fort', 'Très fort'];

// ─── Reusable field component ─────────────────────────────────────────────────
interface FieldProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoComplete?: 'email' | 'password' | 'off';
  returnKeyType?: 'next' | 'go';
  onSubmitEditing?: () => void;
  editable?: boolean;
  rightElement?: React.ReactNode;
}

function Field({
  label, icon, value, onChangeText, placeholder,
  secureTextEntry = false, keyboardType = 'default',
  autoComplete = 'off', returnKeyType = 'next',
  onSubmitEditing, editable = true, rightElement,
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.fieldGroup}>
      <ThemedText style={styles.fieldLabel}>{label}</ThemedText>
      <View style={[
        styles.fieldWrap,
        focused && styles.fieldWrapFocused,
      ]}>
        <View style={styles.fieldIcon}>{icon}</View>
        <TextInput
          style={[styles.fieldInput, rightElement && { paddingRight: 90 }]}
          placeholder={placeholder}
          placeholderTextColor={BRAND.slate400}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={autoComplete}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {rightElement}
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  const { signIn }           = useAuth();
  const { width, height }    = useWindowDimensions();
  const isLandscape          = width > height;
  const emailValue           = email.trim().toLowerCase();
  const isEmailValid         = useMemo(() => /\S+@\S+\.\S+/.test(emailValue), [emailValue]);
  const isFormValid          = isEmailValid && password.length > 0;
  const strength             = getPasswordStrength(password);
  const passwordRef          = useRef<TextInput>(null);

  const handleLogin = async () => {
    if (!emailValue || !password) {
      setFormError('Veuillez remplir tous les champs.');
      return;
    }
    if (!isEmailValid) {
      setFormError('Adresse email invalide.');
      return;
    }
    setFormError('');
    setIsSubmitting(true);
    try {
      await signIn(emailValue, password);
    } catch (error) {
      const { message } = getErrorDetails(
        error,
        'Echec de la connexion',
        'Une erreur est survenue lors de la connexion.',
      );
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Left panel ──────────────────────────────────────────────────────────────
  const LeftPanel = (
    <View style={[
      styles.panel,
      isLandscape ? styles.panelLandscape : styles.panelPortrait,
    ]}>
      {/* Decorative circles */}
      <View style={[styles.deco, { width: 280, height: 280, top: -80, right: -80 }]} />
      <View style={[styles.deco, { width: 180, height: 180, bottom: -50, left: -50 }]} />

      {/* Badge */}
      <View style={styles.badge}>
        <ThemedText style={styles.badgeText}>HACCP DIGITAL</ThemedText>
      </View>

      {/* Logo */}
      <View style={styles.logoRing}>
        <View style={styles.logoInner}>
          {/* Hexagonal shield SVG-like shape via borders */}
          <View style={styles.logoIcon}>
            <ThemedText style={styles.logoCheckmark}>✓</ThemedText>
          </View>
        </View>
      </View>

      <ThemedText style={styles.appTitle}>BeroSafe</ThemedText>
      <ThemedText style={styles.appSubtitle}>Plateforme HACCP professionnelle</ThemedText>

      <ThemedText style={styles.panelDesc}>
        Suivi réception, étiquetage, traçabilité et contrôles pour les professionnels CHR.
      </ThemedText>

      {/* Module chips */}
      <View style={styles.chipsGrid}>
        {MODULE_CHIPS.map(({ label, color }) => (
          <View key={label} style={styles.chip}>
            <View style={[styles.chipDot, { backgroundColor: color }]} />
            <ThemedText style={styles.chipText}>{label}</ThemedText>
          </View>
        ))}
      </View>

      {/* ISO badge */}
      <View style={styles.isoBadge}>
        <ThemedText style={styles.isoText}>ISO 22000  ·  HACCP Certifié</ThemedText>
      </View>
    </View>
  );

  // ── Right form ──────────────────────────────────────────────────────────────
  const RightForm = (
    <ScrollView
      style={styles.formScroll}
      contentContainerStyle={[
        styles.formContainer,
        isLandscape && styles.formContainerLandscape,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.formHeader}>
        <ThemedText style={styles.formTitle}>Connexion</ThemedText>
        <ThemedText style={styles.formSubtitle}>Accédez à votre espace de contrôle HACCP</ThemedText>
      </View>

      {/* Email */}
      <Field
        label="Adresse email"
        placeholder="votre@etablissement.com"
        value={email}
        onChangeText={(v) => { setEmail(v); if (formError) setFormError(''); }}
        keyboardType="email-address"
        autoComplete="email"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        editable={!isSubmitting}
        icon={
          <ThemedText style={styles.iconText}>✉</ThemedText>
        }
      />

      {/* Password */}
      <Field
        label="Mot de passe"
        placeholder="••••••••"
        value={password}
        onChangeText={(v) => { setPassword(v); if (formError) setFormError(''); }}
        secureTextEntry={!showPassword}
        autoComplete="password"
        returnKeyType="go"
        onSubmitEditing={handleLogin}
        editable={!isSubmitting}
        icon={
          <ThemedText style={styles.iconText}>🔒</ThemedText>
        }
        rightElement={
          <Pressable
            style={styles.toggleBtn}
            onPress={() => setShowPassword((p) => !p)}
            disabled={isSubmitting}
          >
            <ThemedText style={styles.toggleText}>
              {showPassword ? 'Masquer' : 'Afficher'}
            </ThemedText>
          </Pressable>
        }
      />

      {/* Strength indicator */}
      {password.length > 0 && (
        <View style={styles.strengthRow}>
          {[1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                styles.strengthBar,
                { backgroundColor: i <= strength ? STRENGTH_COLORS[strength] : BRAND.slate200 },
              ]}
            />
          ))}
          <ThemedText style={[styles.strengthLabel, { color: STRENGTH_COLORS[strength] }]}>
            {STRENGTH_LABELS[strength]}
          </ThemedText>
        </View>
      )}

      {/* Forgot password */}
      <TouchableOpacity style={styles.forgotRow} activeOpacity={0.7}>
        <ThemedText style={styles.forgotText}>Mot de passe oublié ?</ThemedText>
      </TouchableOpacity>

      {/* Error */}
      {formError ? (
        <View style={styles.errorBox}>
          <ThemedText style={styles.errorIcon}>⚠</ThemedText>
          <ThemedText style={styles.errorText}>{formError}</ThemedText>
        </View>
      ) : null}

      {/* Submit */}
      <TouchableOpacity
        style={[
          styles.submitBtn,
          (!isFormValid || isSubmitting) && styles.submitBtnDisabled,
        ]}
        onPress={handleLogin}
        disabled={!isFormValid || isSubmitting}
        activeOpacity={0.85}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <ThemedText style={styles.submitText}>Se connecter</ThemedText>
            <ThemedText style={styles.submitArrow}>→</ThemedText>
          </>
        )}
      </TouchableOpacity>





      {/* Contact admin */}
      <View style={styles.contactRow}>
        <ThemedText style={styles.contactText}>
          Besoin d'accès ?{' '}
        </ThemedText>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            Linking.openURL(
              'mailto:berocert@gmail.com?subject=Demande%20d%27accès&body=Bonjour%20Admin,%0A%0AJe%20souhaite%20avoir%20accès%20à%20la%20plateforme.'
            );
          }}
        >
          <ThemedText style={styles.contactLink}>
            Contacter l'administrateur
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Version */}
      <ThemedText style={styles.versionTag}>v2.4.1 · HACCP ISO 22000</ThemedText>
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboard}
    >
      <ThemedView style={styles.root}>
        <View style={[
          styles.card,
          { borderTopColor: BRAND.green },
          isLandscape ? styles.cardLandscape : styles.cardPortrait,
        ]}>
          {LeftPanel}
          {RightForm}
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
    backgroundColor: BRAND.slate100,
  },
  root: {
    flex: 1,
    backgroundColor: BRAND.slate100,
  },
  card: {
    flex: 1,
    borderTopWidth: 5,
    overflow: 'hidden',
  },
  cardPortrait: {
    flexDirection: 'column',
  },
  cardLandscape: {
    flexDirection: 'row',
  },

  // ── Panel ──────────────────────────────────────────────────────────────────
  panel: {
    backgroundColor: BRAND.navy,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    overflow: 'hidden',
  },
  panelPortrait: {
    width: '100%',
  },
  panelLandscape: {
    width: '40%',
  },
  deco: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  badge: {
    backgroundColor: BRAND.teal,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 20,
    zIndex: 1,
  },
  badgeText: {
    color: BRAND.white,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  logoRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    zIndex: 1,
  },
  logoInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BRAND.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCheckmark: {
    color: BRAND.white,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 30,
  },
  appTitle: {
    color: BRAND.white,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
    zIndex: 1,
  },
  appSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginBottom: 16,
    zIndex: 1,
  },
  panelDesc: {
    color: '#BFDBFE',
    fontSize: 12.5,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 240,
    marginBottom: 24,
    zIndex: 1,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 20,
    zIndex: 1,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
  },
  isoBadge: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    paddingTop: 14,
    zIndex: 1,
  },
  isoText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    letterSpacing: 0.5,
  },

  // ── Form ──────────────────────────────────────────────────────────────────
  formScroll: {
    flex: 1,
    backgroundColor: BRAND.white,
  },
  formContainer: {
    padding: 28,
    paddingBottom: 36,
  },
  formContainerLandscape: {
    paddingHorizontal: 36,
    justifyContent: 'center',
    flexGrow: 1,
  },
  formHeader: {
    marginBottom: 28,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: BRAND.slate900,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    color: BRAND.slate600,
  },

  // ── Fields ────────────────────────────────────────────────────────────────
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: BRAND.slate600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  fieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1.5,
    borderColor: BRAND.slate200,
    borderRadius: 12,
    backgroundColor: BRAND.slate50,
    paddingHorizontal: 14,
  },
  fieldWrapFocused: {
    borderColor: BRAND.navy,
    backgroundColor: BRAND.white,
  },
  fieldIcon: {
    marginRight: 10,
    width: 18,
    alignItems: 'center',
  },
  iconText: {
    fontSize: 14,
    color: BRAND.slate400,
  },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    color: BRAND.slate900,
    height: '100%',
  },
  toggleBtn: {
    position: 'absolute',
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: BRAND.ice,
    borderRadius: 6,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: BRAND.navy,
  },

  // ── Strength ──────────────────────────────────────────────────────────────
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -8,
    marginBottom: 6,
  },
  strengthBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 10,
    fontWeight: '600',
    minWidth: 52,
    textAlign: 'right',
  },

  // ── Forgot ────────────────────────────────────────────────────────────────
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: 16,
    marginTop: 2,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '600',
    color: BRAND.navy,
  },

  // ── Error ─────────────────────────────────────────────────────────────────
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: BRAND.redBg,
    borderWidth: 1,
    borderColor: BRAND.redBorder,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  errorIcon: {
    fontSize: 13,
    color: BRAND.red,
    lineHeight: 18,
  },
  errorText: {
    flex: 1,
    fontSize: 12.5,
    color: BRAND.red,
    lineHeight: 18,
  },

  // ── Submit ────────────────────────────────────────────────────────────────
  submitBtn: {
    height: 52,
    backgroundColor: BRAND.green,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: BRAND.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.55,
  },
  submitText: {
    color: BRAND.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  submitArrow: {
    color: BRAND.white,
    fontSize: 18,
    fontWeight: '400',
  },

  // ── Divider ───────────────────────────────────────────────────────────────
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
  },
  divLine: {
    flex: 1,
    height: 1,
    backgroundColor: BRAND.slate200,
  },
  divLabel: {
    fontSize: 11,
    color: BRAND.slate400,
  },

  // ── SSO ───────────────────────────────────────────────────────────────────
  ssoBtn: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: BRAND.slate200,
    borderRadius: 12,
    backgroundColor: BRAND.white,
  },
  ssoIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: BRAND.ice,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ssoBtnIcon: {
    fontSize: 13,
  },
  ssoBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: BRAND.slate800,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  contactText: {
    fontSize: 12,
    color: BRAND.slate400,
  },
  contactLink: {
    fontSize: 12,
    fontWeight: '600',
    color: BRAND.navy,
  },
  versionTag: {
    textAlign: 'center',
    fontSize: 10,
    color: BRAND.slate200,
    marginTop: 14,
  },
});