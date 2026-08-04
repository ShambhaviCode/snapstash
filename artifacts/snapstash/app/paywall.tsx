import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { PurchasesPackage } from 'react-native-purchases';
import { PACKAGE_TYPE } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { useColors } from '@/hooks/useColors';
import {
  useSubscription,
  sortPackages,
  packageLabel,
  packageSubtitle,
} from '@/lib/revenuecat';

const BENEFITS = [
  { icon: 'archive', text: 'Unlimited snippets' },
  { icon: 'folder', text: 'Unlimited folders' },
  { icon: 'cloud', text: 'Cloud sync across devices' },
];

// ─── RC Native Paywall ────────────────────────────────────────────────────────
// The native RC Paywall component renders the template you configure in the
// RevenueCat dashboard (https://app.revenuecat.com → Paywalls). When no template
// is configured yet, we fall back to our custom built-in paywall below.
function RCNativePaywall({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return (
    <RevenueCatUI.Paywall
      style={{ flex: 1 }}
      onDismiss={() => router.back()}
      onPurchaseCompleted={({ customerInfo }) => {
        queryClient.setQueryData(['rc', 'customerInfo'], customerInfo);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSuccess();
      }}
      onRestoreCompleted={({ customerInfo }) => {
        queryClient.setQueryData(['rc', 'customerInfo'], customerInfo);
        onSuccess();
      }}
      onPurchaseCancelled={() => { /* silent */ }}
      onPurchaseError={(err) =>
        Alert.alert('Purchase Failed', err.message)
      }
    />
  );
}

// ─── Custom Fallback Paywall ───────────────────────────────────────────────────
// Shown when RevenueCat offerings haven't been configured yet, or as an
// alternative to the native paywall.
function CustomPaywall({ onSuccess }: { onSuccess: () => void }) {
  const colors = useColors();
  const { offerings, purchase, restore, isPurchasing, isRestoring } = useSubscription();

  const packages: PurchasesPackage[] = sortPackages(
    offerings?.current?.availablePackages ?? []
  );

  // Default selection: annual if available, else first package
  const defaultPkg =
    packages.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL) ?? packages[0];
  const [selected, setSelected] = useState<PurchasesPackage | undefined>(defaultPkg);

  const handleSubscribe = async () => {
    if (!selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await purchase(selected);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
    } catch (err: any) {
      if (!err?.userCancelled) {
        Alert.alert('Purchase Failed', err?.message ?? 'Something went wrong.');
      }
    }
  };

  const handleRestore = async () => {
    try {
      await restore();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Purchases Restored', 'Your subscription has been restored.', [
        { text: 'OK', onPress: onSuccess },
      ]);
    } catch (err: any) {
      Alert.alert('Restore Failed', err?.message ?? 'No purchases found.');
    }
  };

  const isLoading = isPurchasing || isRestoring;

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <LinearGradient
        colors={[colors.primary + '20', 'transparent']}
        style={styles.heroBadge}
      >
        <Feather name="star" size={28} color={colors.primary} />
      </LinearGradient>

      <Text style={[styles.headline, { color: colors.foreground }]}>
        Never lose a{'\n'}snippet again
      </Text>
      <Text style={[styles.subheadline, { color: colors.mutedForeground }]}>
        Upgrade to SnapStash Pro and unlock your full workflow.
      </Text>

      {/* Benefits */}
      <View style={[styles.benefitsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {BENEFITS.map((b, i) => (
          <View
            key={b.text}
            style={[
              styles.benefitRow,
              i < BENEFITS.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
            ]}
          >
            <View style={[styles.benefitIcon, { backgroundColor: colors.primary + '18' }]}>
              <Feather name={b.icon as any} size={16} color={colors.primary} />
            </View>
            <Text style={[styles.benefitText, { color: colors.foreground }]}>{b.text}</Text>
            <Feather name="check" size={16} color={colors.success} />
          </View>
        ))}
      </View>

      {/* Packages */}
      {packages.length === 0 ? (
        <View style={styles.noOffering}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.noOfferingText, { color: colors.mutedForeground }]}>
            Loading plans…
          </Text>
        </View>
      ) : (
        <View style={styles.plans}>
          {packages.map((pkg) => {
            const isSelected = selected?.identifier === pkg.identifier;
            const isAnnual = pkg.packageType === PACKAGE_TYPE.ANNUAL;
            const subtitle = packageSubtitle(pkg);

            return (
              <TouchableOpacity
                key={pkg.identifier}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                onPress={() => setSelected(pkg)}
                activeOpacity={0.8}
              >
                {isSelected && (
                  <View style={[styles.planSelectedDot, { backgroundColor: colors.primary }]}>
                    <Feather name="check" size={12} color="#FFF" />
                  </View>
                )}
                <View style={styles.planTop}>
                  <Text style={[styles.planName, { color: colors.foreground }]}>
                    {packageLabel(pkg)}
                  </Text>
                  {isAnnual && (
                    <View style={[styles.saveBadge, { backgroundColor: colors.success + '20' }]}>
                      <Text style={[styles.saveBadgeText, { color: colors.success }]}>Best Value</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.planPrice, { color: colors.foreground }]}>
                  {pkg.product.priceString}
                </Text>
                {subtitle && (
                  <Text style={[styles.planPer, { color: colors.mutedForeground }]}>{subtitle}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* CTA */}
      <TouchableOpacity
        style={[
          styles.ctaBtn,
          { backgroundColor: colors.primary },
          (isLoading || !selected) && { opacity: 0.6 },
        ]}
        onPress={handleSubscribe}
        disabled={isLoading || !selected}
        activeOpacity={0.85}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.ctaBtnText}>
            {selected ? `Get ${packageLabel(selected)}` : 'Subscribe'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={handleRestore} disabled={isLoading} style={styles.restoreBtn}>
        <Text style={[styles.restoreText, { color: colors.mutedForeground }]}>
          Restore Purchases
        </Text>
      </TouchableOpacity>

      <Text style={[styles.legalText, { color: colors.mutedForeground }]}>
        Payment will be charged to your account. Subscriptions auto-renew unless cancelled.
      </Text>
    </ScrollView>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function PaywallScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [useNative, setUseNative] = useState(true);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleSuccess = () => {
    router.back();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Close button — always visible */}
      <TouchableOpacity
        style={[styles.closeBtn, { top: topPad + 14 }]}
        onPress={() => router.back()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <View style={[styles.closeBtnInner, { backgroundColor: colors.secondary }]}>
          <Feather name="x" size={18} color={colors.foreground} />
        </View>
      </TouchableOpacity>

      {useNative ? (
        // RevenueCat native paywall (uses template configured in RC dashboard).
        // On web (Expo Go preview), or if no template is set, falls back to custom UI.
        Platform.OS === 'web' ? (
          <View style={{ flex: 1, paddingTop: topPad + 64, paddingBottom: botPad + 20 }}>
            <CustomPaywall onSuccess={handleSuccess} />
          </View>
        ) : (
          <RCNativePaywall onSuccess={handleSuccess} />
        )
      ) : (
        <View style={{ flex: 1, paddingTop: topPad + 64, paddingBottom: botPad + 20 }}>
          <CustomPaywall onSuccess={handleSuccess} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  closeBtn: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
  },
  closeBtnInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  heroBadge: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  headline: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 38,
    marginBottom: 12,
  },
  subheadline: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  benefitsCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  noOffering: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 20,
    marginBottom: 20,
  },
  noOfferingText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  plans: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  planCard: {
    flex: 1,
    minWidth: 100,
    borderRadius: 14,
    padding: 14,
    position: 'relative',
  },
  planSelectedDot: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  planName: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  saveBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  saveBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  planPrice: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  planPer: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  ctaBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  ctaBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
  restoreBtn: { paddingVertical: 8 },
  restoreText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textDecorationLine: 'underline',
  },
  legalText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 16,
    paddingBottom: 8,
  },
});
