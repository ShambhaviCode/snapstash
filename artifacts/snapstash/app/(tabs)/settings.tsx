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
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RevenueCatUI from 'react-native-purchases-ui';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { useSubscription } from '@/lib/revenuecat';
import { FREE_SNIPPET_LIMIT } from '@/lib/types';

function SectionLabel({ label, colors }: { label: string; colors: any }) {
  return (
    <View style={[styles.sectionLabelRow, { borderTopColor: colors.border }]}>
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

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
      <View style={[styles.rowIcon, { backgroundColor: (iconColor ?? colors.primary) + '1A' }]}>
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { snippets, folders } = useApp();
  const { isSubscribed, restore, isRestoring, customerInfo } = useSubscription();

  const isPremium = isSubscribed;
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 84 + 20 : insets.bottom + 80;

  // Subscription expiry
  const activeEntitlement = customerInfo?.entitlements.active['SnapStash Pro'];
  const expiryDate = activeEntitlement?.expirationDate
    ? new Date(activeEntitlement.expirationDate).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  // Amber gradient stops matched to dark/light palette
  const upgradeGradient: [string, string] = isDark
    ? ['#F5A623', '#C97810']
    : ['#C97810', '#E8A520'];

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
        <View style={styles.sectionPad}>
          <View
            style={[
              styles.planCard,
              {
                backgroundColor: isPremium ? colors.primary + '18' : colors.card,
                borderColor: isPremium ? colors.primary + '60' : colors.border,
              },
            ]}
          >
            <View style={styles.planLeft}>
              <View style={styles.planTitleRow}>
                <Feather
                  name={isPremium ? 'star' : 'user'}
                  size={17}
                  color={isPremium ? colors.primary : colors.mutedForeground}
                />
                <Text style={[styles.planTitle, { color: colors.foreground }]}>
                  {isPremium ? 'SnapStash Pro' : 'Free Plan'}
                </Text>
                {isPremium && (
                  <View style={[styles.proBadge, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.proBadgeText, { color: colors.primary }]}>ACTIVE</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.planSub, { color: colors.mutedForeground }]}>
                {isPremium
                  ? expiryDate
                    ? `Renews ${expiryDate}`
                    : 'Unlimited snippets · Unlimited folders'
                  : `${snippets.length} / ${FREE_SNIPPET_LIMIT} snippets · 1 folder`}
              </Text>
            </View>

            {!isPremium && (
              <TouchableOpacity onPress={() => router.push('/paywall')} activeOpacity={0.85}>
                <LinearGradient
                  colors={upgradeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.upgradeBtn,
                    {
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.45,
                      shadowRadius: 7,
                      elevation: 4,
                    },
                  ]}
                >
                  <Feather name="zap" size={13} color="#FFF" />
                  <Text style={styles.upgradeBtnText}>Upgrade</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Subscription management */}
        <SectionLabel label="SUBSCRIPTION" colors={colors} />
        <View style={styles.sectionPad}>
          {isPremium && (
            <SettingRow
              icon="settings"
              label="Manage Subscription"
              sublabel="Cancel, pause, or change your plan"
              onPress={handleManageSubscription}
              colors={colors}
            />
          )}
          <SettingRow
            icon="refresh-ccw"
            label="Restore Purchases"
            sublabel={isRestoring ? 'Restoring…' : isPremium ? 'Reconnect on a new device' : 'Already subscribed? Restore here'}
            onPress={isRestoring ? undefined : handleRestore}
            colors={colors}
          />
        </View>

        {/* Storage */}
        <SectionLabel label="STORAGE" colors={colors} />
        <View style={styles.sectionPad}>
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
                onValueChange={() => Alert.alert('Cloud Sync', 'Cloud sync coming soon!')}
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

        {/* About */}
        <SectionLabel label="ABOUT" colors={colors} />
        <View style={styles.sectionPad}>
          <SettingRow
            icon="info"
            label="Version"
            sublabel="1.0.0"
            right={<Text style={[styles.versionText, { color: colors.mutedForeground }]}>1.0.0</Text>}
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
    fontSize: 30,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.8,
  },
  sectionLabelRow: {
    marginTop: 32,
    marginBottom: 8,
    marginHorizontal: 20,
    paddingTop: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
  } as any,
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.0,
  },
  sectionPad: {
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
    gap: 1,
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
    marginBottom: 5,
  },
  planTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  proBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  proBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
  },
  planSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },
  upgradeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
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
  versionText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
});
