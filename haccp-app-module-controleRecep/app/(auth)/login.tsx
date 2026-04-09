import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { useAuth } from '../../context/auth-context';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { getErrorDetails } from '../../utils/error';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  const { signIn } = useAuth();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const brandGreen = '#2DB34A';
  const brandBlue = '#1E6FB5';
  const accentTeal = '#00B8A0';
  const panelColor = brandBlue;
  const cardColor = '#FFFFFF';
  const inputBackground = '#FFFFFF';
  const inputBorder = '#E2E8F0';
  const strongText = '#0F172A';
  const secondaryText = '#64748B';
  const emailValue = email.trim().toLowerCase();
  const isEmailValid = useMemo(() => /\S+@\S+\.\S+/.test(emailValue), [emailValue]);
  const isFormValid = isEmailValid && password.length > 0;

  const handleLogin = async () => {
    if (!emailValue || !password) {
      setFormError('Veuillez remplir tous les champs.');
      return;
    }

    if (!isEmailValid) {
      setFormError("Adresse email invalide.");
      return;
    }

    setFormError('');
    setIsSubmitting(true);
    try {
      await signIn(emailValue, password);
      // useAuth hook will handle the redirection automatically
    } catch (error) {
      const { message } = getErrorDetails(
        error,
        'Echec de la connexion',
        'Une erreur est survenue lors de la connexion.'
      );
      console.error('Login failed:', message);
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ThemedView style={styles.container}>
        <View
          style={[
            styles.contentCard,
            isLandscape ? styles.contentCardLandscape : styles.contentCardPortrait,
            { backgroundColor: cardColor, borderTopWidth: 5, borderTopColor: brandGreen },
          ]}
        >
            <View
              style={[
                styles.header,
                isLandscape ? styles.headerLandscape : styles.headerPortrait,
                { backgroundColor: panelColor },
              ]}
            >
              <ThemedText style={[styles.badgeText, { backgroundColor: accentTeal }]}>HACCP DIGITAL</ThemedText>
              <Image
                source={require('../../assets/images/partial-react-logo.png')}
                style={[styles.logo, isLandscape && styles.logoLandscape]}
                resizeMode="contain"
              />
              <ThemedText type="title" style={styles.title}>BeroSafe</ThemedText>
              <ThemedText style={styles.subtitle}>Connectez-vous pour continuer</ThemedText>
              <ThemedText style={styles.panelInfoText}>Suivi reception, etiquetage, tracabilite et controles en un seul espace.</ThemedText>
            </View>

            <View style={[styles.form, isLandscape && styles.formLandscape]}>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Email</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: strongText,
                      borderColor: inputBorder,
                      backgroundColor: inputBackground,
                    },
                  ]}
                  placeholder="votre@email.com"
                  placeholderTextColor={secondaryText}
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    if (formError) setFormError('');
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  autoComplete="email"
                  returnKeyType="next"
                  editable={!isSubmitting}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Mot de passe</ThemedText>
                <View style={styles.passwordWrapper}>
                  <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    {
                      color: strongText,
                      borderColor: inputBorder,
                      backgroundColor: inputBackground,
                    },
                  ]}
                    placeholder="••••••••"
                    placeholderTextColor={secondaryText}
                    value={password}
                    onChangeText={(value) => {
                      setPassword(value);
                      if (formError) setFormError('');
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="password"
                    returnKeyType="go"
                    editable={!isSubmitting}
                    onSubmitEditing={handleLogin}
                  />
                  <Pressable
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword((previous) => !previous)}
                    disabled={isSubmitting}
                  >
                    <ThemedText style={[styles.passwordToggleText, { color: brandBlue }]}>
                      {showPassword ? 'Masquer' : 'Afficher'}
                    </ThemedText>
                  </Pressable>
                </View>
              </View>

              {formError ? (
                <ThemedText style={styles.errorText}>{formError}</ThemedText>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: brandGreen, opacity: isSubmitting || !isFormValid ? 0.65 : 1 },
                ]}
                onPress={handleLogin}
                disabled={isSubmitting || !isFormValid}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.buttonText}>Se connecter</ThemedText>
                )}
              </TouchableOpacity>
            </View>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentCard: {
    flex: 1,
  },
  contentCardPortrait: {
    flexDirection: 'column',
  },
  contentCardLandscape: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 30,
  },
  headerLandscape: {
    width: '42%',
    justifyContent: 'flex-start',
  },
  headerPortrait: {
    width: '100%',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 8,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  logoLandscape: {
    width: 92,
    height: 92,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#ffffff',
  },
  subtitle: {
    opacity: 0.9,
    textAlign: 'center',
    color: '#ffffff',
  },
  panelInfoText: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: '#dbeafe',
    maxWidth: 290,
  },
  form: {
    gap: 20,
    padding: 24,
    justifyContent: 'center',
    flex: 1,
  },
  formLandscape: {
    width: '58%',
    paddingHorizontal: 28,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    color: '#0F172A',
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  passwordWrapper: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 90,
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  passwordToggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 13,
    color: '#b42318',
    marginTop: -8,
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
