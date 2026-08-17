import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../constants/theme';
import LogoIcon from '../components/LogoIcon';
import { auth, db } from '../api/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const AuthScreen = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAuth = async () => {
    Keyboard.dismiss();
    setErrorMessage(null);

    // Initial validation
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    if (mode === 'signup' && !fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        // Sign In logic
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        // Sign Up logic
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;

        await updateProfile(user, {
          displayName: fullName.trim(),
        });

        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          fullName: fullName.trim(),
          email: email.trim(),
          createdAt: serverTimestamp(),
        });
      }
    } catch (error: any) {
      let message = 'An unexpected error occurred. Please try again later.';
      
      if (error.code === 'auth/email-already-in-use') {
        message = 'This email is already in use.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address format.';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password is too weak (must be at least 6 characters).';
      } else if (
        error.code === 'auth/invalid-credential' || 
        error.code === 'auth/user-not-found' || 
        error.code === 'auth/wrong-password'
      ) {
        message = 'Invalid email or password.';
      }

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };
    
  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. Header / Logo Area */}
        <View style={styles.logoContainer}>
          <View style={styles.iconWrapper}>
            <LogoIcon />
          </View>

          <Text style={styles.logoTitle}>Kora</Text>
          <Text style={styles.subtitle}>Simplified Team Productivity</Text>

          <View style={styles.dotsContainer}>
            <View style={[styles.dot, styles.activeDot]} />
            <View style={[styles.dot, styles.inactiveDot]} />
            <View style={[styles.dot, styles.inactiveDot]} />
          </View>
        </View>

        {/* 2. Auth Card Container */}
        <View style={styles.card}>
          {/* Custom Error Banner */}
          {errorMessage ? (
            <TouchableOpacity 
              style={styles.errorBanner} 
              onPress={() => setErrorMessage(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </TouchableOpacity>
          ) : null}

          {/* Mode Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'signin' && styles.activeToggleBtn]}
              onPress={() => {
                setMode('signin');
                setErrorMessage(null);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, mode === 'signin' && styles.activeToggleText]}>
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'signup' && styles.activeToggleBtn]}
              onPress={() => {
                setMode('signup');
                setErrorMessage(null);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, mode === 'signup' && styles.activeToggleText]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Full Name Field (Sign Up Only) */}
            {mode === 'signup' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Sarah Chen"
                  placeholderTextColor="#94A3B8"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            )}

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="sarah@studio.co"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={(text) => setEmail(text.trim().toLowerCase())}
              />
            </View>

            {/* Password Field with Eye Icon */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIconBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  {showPassword ? (
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <Path d="M12 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6z" />
                    </Svg>
                  ) : (
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <Path d="M1 1l22 22" />
                    </Svg>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password Link (Sign In Only) */}
            {mode === 'signin' && (
              <TouchableOpacity style={styles.forgotPassBtn}>
                <Text style={styles.forgotPassText}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            {/* Primary CTA Button */}
            <TouchableOpacity 
              style={[styles.primaryBtn, loading && styles.disabledBtn]} 
              activeOpacity={0.8} 
              onPress={handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google SSO Button */}
            <TouchableOpacity style={styles.googleBtn} activeOpacity={0.8}>
              <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <Path
                  d="M15.5 8.18c0-.57-.05-1.11-.14-1.63H8v3.09h4.19c-.18.97-.73 1.8-1.55 2.35v1.95h2.51C14.64 12.58 15.5 10.55 15.5 8.18z"
                  fill="#4285F4"
                />
                <Path
                  d="M8 16c2.16 0 3.97-.72 5.3-1.94l-2.51-1.95c-.71.48-1.63.76-2.79.76-2.14 0-3.95-1.45-4.6-3.39H.82v2.02C2.15 14.26 4.87 16 8 16z"
                  fill="#34A853"
                />
                <Path
                  d="M3.4 9.48A4.83 4.83 0 013.16 8c0-.52.09-1.02.24-1.48V4.5H.82A7.99 7.99 0 000 8c0 1.29.31 2.51.82 3.5l2.58-2.02z"
                  fill="#FBBC05"
                />
                <Path
                  d="M8 3.18c1.21 0 2.29.42 3.14 1.24l2.35-2.35C11.96.79 10.15 0 8 0 4.87 0 2.15 1.74.82 4.5l2.58 2.02C4.05 4.62 5.86 3.18 8 3.18z"
                  fill="#EA4335"
                />
              </Svg>
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Switch Mode Footer Text */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              </Text>
              <TouchableOpacity onPress={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setErrorMessage(null);
              }}>
                <Text style={styles.footerLink}>
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AuthScreen;

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
    backgroundColor: COLORS.bg || '#F8F9FA',
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: COLORS.primary || '#566551',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.primary || '#566551',
    letterSpacing: -1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.muted || '#64748B',
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 16,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  activeDot: {
    backgroundColor: COLORS.primary || '#566551',
  },
  inactiveDot: {
    backgroundColor: COLORS.primaryLight || '#C5D5E4',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    elevation: 4,
    shadowColor: '#566551',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeToggleBtn: {
    backgroundColor: COLORS.primary || '#566551',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.muted || '#64748B',
  },
  activeToggleText: {
    color: '#FFFFFF',
  },
  formContainer: {
    gap: 12,
  },
  inputGroup: {
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted || '#64748B',
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text || '#1E293B',
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text || '#1E293B',
  },
  eyeIconBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  forgotPassBtn: {
    alignSelf: 'flex-end',
  },
  forgotPassText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.primary || '#566551',
  },
  primaryBtn: {
    backgroundColor: COLORS.primary || '#566551',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: 12,
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  footerLink: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary || '#566551',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});