import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RevenueCatUI from 'react-native-purchases-ui';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { useSubscription } from '@/lib/revenuecat';
import { FREE_SNIPPET_LIMIT } from '@/lib/types';

function SettingRow({
  icon,
  label,
  sublabel,
  onPress,
  right,
  iconColor,
  colors,
}: {
  icon: string;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  iconColor?: string;
  colors: any;
}) {
  const content = (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: (iconColor ?? colors.primary) + '18' }]}>
        <Feather name={icon as any} size={16} color={iconColor ?? colors.primary} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
        {sublabel && (
          <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{sublabel}</Text>
        )}
      </View>
      {right ?? <Feather name="chevron-right" size={16} color={colors.mutedForeground} />}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { snippets, folders } = useApp();
  const { isSubscribed, restore, isRestoring, customerInfo } = useSubscription();

  const isPremium = isSubscribed;
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 84 + 20 : insets.bottom + 80;

  // Subscription expiry (for active subscriptions, not lifetime)
  const activeEntitlement = customerInfo?.entitlements.active['SnapStash Pro'];
  const expiryDate = activeEntitlement?.expirationDate
    ? new Date(activeEntitlement.expirationDate).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const handleManageSubscription = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Customer Center', 'Subscription management is available in the iOS/Android app.');
      return;
    }
    try {
      await RevenueCatUI.presentCustomerCenter();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not open subscription management.');
    }
  };

  const handleRestore = async () => {
    try {
      await restore();
      Alert.alert('Purchases Restored', 'Your subscription has been successfully restored.');
    } catch (err: any) {
      Alert.alert('Restore Failed', err?.message ?? 'No active purchases found.');
    }
  };

  const handleExport = () => {
    const data = JSON.stringify({ snippets, folders, exportedAt: new Date().toISOString() }, null, 2);
    Alert.alert(
      'Export Data',
      `Your data includes ${snippets.length} snippets and ${folders.length} folders.\n\n(Full file export coming soon.)`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 14,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingTop: 20, paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        {/* Plan card */}
        <View style={styles.section}>
          <View
            style={[
              styles.planCard,
              {
                backgroundColor: isPremium ? colors.primary : colors.card,
                borderColor: isPremium ? colors.primary : colors.border,
              },
            ]}
          >
            <View style={styles.planLeft}>
              <View style={styles.planTitleRow}>
                <Feather
                  name={isPremium ? 'star' : 'user'}
                  size={18}
                  color={isPremium ? '#FFFFFF' : colors.primary}
                />
                <Text
                  style={[
                    styles.planTitle,
                    { color: isPremium ? '#FFFFFF' : colors.foreground },
                  ]}
                >
                  {isPremium ? 'SnapStash Pro' : 'Free Plan'}
                </Text>
              </View>
              <Text
                style={[
                  styles.planSub,
                  { color: isPremium ? 'rgba(255,255,255,0.75)' : colors.mutedForeground },
                ]}
              >
                {isPremium
                  ? expiryDate
                    ? `Renews ${expiryDate}`
                    : 'Unlimited snippets · Unlimited folders · Cloud sync'
                  : `${snippets.length} / ${FREE_SNIPPET_LIMIT} snippets · 1 folder`}
              </Text>
            </View>
            {!isPremium && (
              <TouchableOpacity
                style={[styles.upgradeBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/paywall')}
                activeOpacity={0.85}
              >
                <Text style={styles.upgradeBtnText}>Upgrade</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Subscription management (shown when subscribed) */}
        {isPremium && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SUBSCRIPTION</Text>
            <View style={styles.section}>
              <SettingRow
                icon="settings"
                label="Manage Subscription"
                sublabel="Cancel, pause, or change your plan"
                onPress={handleManageSubscription}
                colors={colors}
              />
              <SettingRow
                icon="refresh-ccw"
                label="Restore Purchases"
                sublabel={isRestoring ? 'Restoring…' : 'Reconnect on a new device'}
                onPress={isRestoring ? undefined : handleRestore}
                colors={colors}
              />
            </View>
          </>
        )}

        {/* Restore for free users */}
        {!isPremium && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SUBSCRIPTION</Text>
            <View style={styles.section}>
              <SettingRow
                icon="refresh-ccw"
                label="Restore Purchases"
                sublabel={isRestoring ? 'Restoring…' : 'Already subscribed? Restore here'}
                onPress={isRestoring ? undefined : handleRestore}
                colors={colors}
              />
            </View>
          </>
        )}

        {/* Storage section */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>STORAGE</Text>
        <View style={styles.section}>
          <SettingRow
            icon="cloud"
            label="iCloud / Google Drive Sync"
            sublabel={isPremium ? 'Enabled' : 'Premium only'}
            colors={colors}
            iconColor={isPremium ? colors.primary : colors.mutedForeground}
            right={
              <Switch
                value={false}
                disabled={!isPremium}
                trackColor={{ false: colors.border, true: colors.primary }}
                onValueChange={() =>
                  Alert.alert('Cloud Sync', 'Cloud sync coming soon!')
                }
              />
            }
          />
          <SettingRow
            icon="download"
            label="Export Data"
            sublabel="Download all snippets as JSON"
            onPress={handleExport}
            colors={colors}
          />
        </View>

        {/* About section */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ABOUT</Text>
        <View style={styles.section}>
          <SettingRow
            icon="info"
            label="Version"
            sublabel="1.0.0"
            right={<Text style={{ color: colors.mutedForeground, fontSize: 14 }}>1.0.0</Text>}
            colors={colors}
          />
          <SettingRow
            icon="mail"
            label="Support"
            sublabel="Get help or send feedback"
            onPress={() => Alert.alert('Support', 'support@snapstash.app')}
            colors={colors}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  planLeft: { flex: 1 },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  planTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  planSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  upgradeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  upgradeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
    gap: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    gap: 12,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowText: { flex: 1 },
  rowLabel: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  rowSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
});
