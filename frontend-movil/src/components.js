import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from './theme';

export function ScreenTitle({ eyebrow, title, subtitle, action, onAction }) {
  return (
    <View style={styles.titleRow}>
      <View style={styles.titleCopy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action ? (
        <Pressable accessibilityRole="button" onPress={onAction} style={styles.titleAction}>
          <Text style={styles.titleActionText}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  autoCapitalize,
  secureTextEntry
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType || 'default'}
        autoCapitalize={autoCapitalize || 'sentences'}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
}

export function Notice({ message, type = 'error' }) {
  if (!message) return null;
  const isSuccess = type === 'success';
  return (
    <View style={[styles.notice, isSuccess ? styles.successNotice : styles.errorNotice]}>
      <Text style={[styles.noticeText, isSuccess ? styles.successText : styles.errorText]}>{message}</Text>
    </View>
  );
}

export function PrimaryButton({ label, onPress, loading, disabled, secondary, style }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary ? styles.secondaryButton : styles.primaryButton,
        (disabled || loading) && styles.disabledButton,
        pressed && !disabled && !loading && styles.pressedButton,
        style
      ]}
    >
      <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>
        {loading ? 'Un momento...' : label}
      </Text>
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18
  },
  titleCopy: { flex: 1, paddingRight: 10 },
  eyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 6
  },
  title: { color: colors.ink, fontSize: 23, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  titleAction: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    minHeight: 40,
    paddingHorizontal: 13
  },
  titleActionText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  fieldGroup: { gap: 7 },
  fieldLabel: { color: '#536174', fontSize: 12, fontWeight: '700' },
  input: {
    backgroundColor: '#ffffff',
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 14,
    minHeight: 47,
    paddingHorizontal: 13
  },
  multilineInput: { minHeight: 82, paddingTop: 12, textAlignVertical: 'top' },
  notice: { borderRadius: 10, borderWidth: 1, marginBottom: 14, padding: 12 },
  errorNotice: { backgroundColor: colors.redSoft, borderColor: '#f1d7db' },
  successNotice: { backgroundColor: colors.greenSoft, borderColor: '#d3eddf' },
  noticeText: { fontSize: 12, lineHeight: 18 },
  errorText: { color: colors.red },
  successText: { color: colors.green },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 11
  },
  primaryButton: { backgroundColor: colors.primary },
  secondaryButton: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1 },
  buttonText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  secondaryButtonText: { color: '#586579' },
  disabledButton: { opacity: 0.58 },
  pressedButton: { opacity: 0.84 }
});
