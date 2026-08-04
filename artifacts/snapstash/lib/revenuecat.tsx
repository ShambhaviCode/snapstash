import React, { createContext, useContext } from 'react';
import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type Offerings,
  type PurchasesPackage,
  PACKAGE_TYPE,
} from 'react-native-purchases';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';

// ─── Entitlement ─────────────────────────────────────────────────────────────
export const ENTITLEMENT_ID = 'SnapStash Pro';

// ─── API Key Resolution ───────────────────────────────────────────────────────
function getApiKey(): string {
  const testKey = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
  const iosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
  const androidKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

  // Dev, Expo Go, web, or storeClient → always use test key
  const isDevOrWeb =
    __DEV__ ||
    Platform.OS === 'web' ||
    Constants.executionEnvironment === 'storeClient';

  if (isDevOrWeb) {
    if (!testKey) throw new Error('EXPO_PUBLIC_REVENUECAT_TEST_API_KEY is not set');
    return testKey;
  }

  if (Platform.OS === 'ios') return iosKey ?? testKey ?? (() => { throw new Error('No RevenueCat iOS key'); })();
  if (Platform.OS === 'android') return androidKey ?? testKey ?? (() => { throw new Error('No RevenueCat Android key'); })();
  if (!testKey) throw new Error('EXPO_PUBLIC_REVENUECAT_TEST_API_KEY is not set');
  return testKey;
}

// ─── Initialization ───────────────────────────────────────────────────────────
export function initializeRevenueCat(): void {
  const apiKey = getApiKey();
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey });
}

// ─── Package helpers ──────────────────────────────────────────────────────────
/** Sort packages: lifetime → annual → monthly → weekly → unknown */
export function sortPackages(pkgs: PurchasesPackage[]): PurchasesPackage[] {
  const order: Record<string, number> = {
    [PACKAGE_TYPE.LIFETIME]: 0,
    [PACKAGE_TYPE.ANNUAL]: 1,
    [PACKAGE_TYPE.SIX_MONTH]: 2,
    [PACKAGE_TYPE.THREE_MONTH]: 3,
    [PACKAGE_TYPE.TWO_MONTH]: 4,
    [PACKAGE_TYPE.MONTHLY]: 5,
    [PACKAGE_TYPE.WEEKLY]: 6,
  };
  return [...pkgs].sort(
    (a, b) => (order[a.packageType] ?? 99) - (order[b.packageType] ?? 99)
  );
}

export function packageLabel(pkg: PurchasesPackage): string {
  switch (pkg.packageType) {
    case PACKAGE_TYPE.LIFETIME: return 'Lifetime';
    case PACKAGE_TYPE.ANNUAL: return 'Yearly';
    case PACKAGE_TYPE.SIX_MONTH: return '6 Months';
    case PACKAGE_TYPE.THREE_MONTH: return '3 Months';
    case PACKAGE_TYPE.MONTHLY: return 'Monthly';
    case PACKAGE_TYPE.WEEKLY: return 'Weekly';
    default: return pkg.product.title;
  }
}

export function packageSubtitle(pkg: PurchasesPackage): string | null {
  if (pkg.packageType === PACKAGE_TYPE.LIFETIME) return 'One-time purchase';
  if (pkg.packageType === PACKAGE_TYPE.ANNUAL) {
    // Compute monthly equivalent if we can
    const monthly = pkg.product.price / 12;
    const formatted = pkg.product.currencyCode
      ? `${pkg.product.currencyCode} ${monthly.toFixed(2)}`
      : `$${monthly.toFixed(2)}`;
    return `${formatted}/mo`;
  }
  return null;
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface SubscriptionContextValue {
  customerInfo: CustomerInfo | undefined;
  offerings: Offerings | undefined;
  isSubscribed: boolean;
  isLoading: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  purchaseError: Error | null;
  purchase: (pkg: PurchasesPackage) => Promise<CustomerInfo>;
  restore: () => Promise<CustomerInfo>;
  refetch: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

function useSubscriptionContext(): SubscriptionContextValue {
  const queryClient = useQueryClient();

  const customerInfoQuery = useQuery({
    queryKey: ['rc', 'customerInfo'],
    queryFn: () => Purchases.getCustomerInfo(),
    staleTime: 60_000,
    retry: 1,
  });

  const offeringsQuery = useQuery({
    queryKey: ['rc', 'offerings'],
    queryFn: () => Purchases.getOfferings(),
    staleTime: 300_000,
    retry: 1,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (pkg: PurchasesPackage) => {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return customerInfo;
    },
    onSuccess: (customerInfo) => {
      queryClient.setQueryData(['rc', 'customerInfo'], customerInfo);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () => Purchases.restorePurchases(),
    onSuccess: (customerInfo) => {
      queryClient.setQueryData(['rc', 'customerInfo'], customerInfo);
    },
  });

  const isSubscribed =
    !!customerInfoQuery.data?.entitlements.active[ENTITLEMENT_ID];

  return {
    customerInfo: customerInfoQuery.data,
    offerings: offeringsQuery.data,
    isSubscribed,
    isLoading: customerInfoQuery.isLoading,
    isPurchasing: purchaseMutation.isPending,
    isRestoring: restoreMutation.isPending,
    purchaseError: (purchaseMutation.error as Error | null),
    purchase: purchaseMutation.mutateAsync,
    restore: restoreMutation.mutateAsync,
    refetch: () => {
      customerInfoQuery.refetch();
      offeringsQuery.refetch();
    },
  };
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const value = useSubscriptionContext();
  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}
