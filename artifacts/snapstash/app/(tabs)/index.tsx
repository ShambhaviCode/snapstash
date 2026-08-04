import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import SnippetCard from '@/components/SnippetCard';
import { FREE_SNIPPET_LIMIT } from '@/lib/types';

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  const colors = useColors();
  return (
    <View style={styles.emptyWrap}>
      {/* Glow orb */}
      <View style={[styles.emptyOrb, { backgroundColor: colors.primary + '18' }]}>
        <View style={[styles.emptyOrbInner, { backgroundColor: colors.primary + '2E' }]}>
          <Feather name="archive" size={32} color={colors.primary} />
        </View>
      </View>

      {/* Content-type chips */}
      <View style={styles.emptyChips}>
        {[
          { icon: 'type' as const,   label: 'Text' },
          { icon: 'link' as const,   label: 'Link' },
          { icon: 'code' as const,   label: 'Code' },
        ].map(({ icon, label }) => (
          <View
            key={label}
            style={[styles.emptyChip, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name={icon} size={11} color={colors.mutedForeground} />
            <Text style={[styles.emptyChipText, { color: colors.mutedForeground }]}>{label}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        Your stash is empty
      </Text>
      <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
        Save snippets, links, and code{'\n'}you actually want to find again
      </Text>

      <TouchableOpacity
        style={[styles.emptyCtaBtn, {
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
        }]}
        onPress={onAdd}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={15} color={colors.primaryForeground} />
        <Text style={[styles.emptyCtaBtnText, { color: colors.primaryForeground }]}>
          Start stashing
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function NoResults({ query }: { query: string }) {
  const colors = useColors();
  return (
    <View style={styles.emptyWrap}>
      <Feather name="search" size={40} color={colors.border} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No results</Text>
      <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
        Nothing matched "{query}"
      </Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function LibraryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { snippets, isLoading, canAddSnippet, isPremium } = useApp();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return snippets;
    const q = query.toLowerCase();
    return snippets.filter(
      (s: any) =>
        s.title.toLowerCase().includes(q) ||
        s.content.toLowerCase().includes(q) ||
        s.tags.some((t: string) => t.toLowerCase().includes(q))
    );
  }, [snippets, query]);

  const sorted = useMemo(
    () =>
      [...filtered].sort(
        (a: any, b: any) =>
          new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
      ),
    [filtered]
  );

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const tabBarH = Platform.OS === 'web' ? 84 : 49 + insets.bottom;
  const fabBottom = tabBarH + 16;

  const handleAdd = () => {
    if (!canAddSnippet) {
      router.push('/paywall');
      return;
    }
    router.push('/edit');
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
        <View style={styles.titleRow}>
          <Text style={[styles.appTitle, { color: colors.foreground }]}>
            SnapStash
          </Text>
          {snippets.length > 0 && (
            <View style={[styles.countBadge, { backgroundColor: colors.primary + '22' }]}>
              <Text style={[styles.countText, { color: colors.primary }]}>
                {snippets.length}
              </Text>
            </View>
          )}
        </View>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.secondary, borderColor: colors.border },
          ]}
        >
          <Feather name="search" size={15} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search snippets, tags…"
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
          {query.length > 0 && Platform.OS !== 'ios' && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Feather name="x" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Free limit banner */}
      {!isPremium && snippets.length >= FREE_SNIPPET_LIMIT && (
        <TouchableOpacity
          style={[styles.limitBanner, { backgroundColor: colors.primary + '15' }]}
          onPress={() => router.push('/paywall')}
          activeOpacity={0.8}
        >
          <Feather name="lock" size={13} color={colors.primary} />
          <Text style={[styles.limitText, { color: colors.primary }]}>
            Free limit reached — upgrade for unlimited snippets
          </Text>
          <Feather name="chevron-right" size={13} color={colors.primary} />
        </TouchableOpacity>
      )}

      {/* Content */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : sorted.length === 0 && !query ? (
        <View style={styles.centered}>
          <EmptyState onAdd={handleAdd} />
        </View>
      ) : sorted.length === 0 ? (
        <View style={styles.centered}>
          <NoResults query={query} />
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }: any) => (
            <SnippetCard
              snippet={item}
              onEdit={() =>
                router.push({ pathname: '/edit', params: { id: item.id } })
              }
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: fabBottom + 60,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom: fabBottom,
            shadowColor: colors.primary,
          },
        ]}
        onPress={handleAdd}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={26} color={colors.primaryForeground} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  appTitle: {
    fontSize: 30,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.8,
  },
  countBadge: {
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  countText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
  },
  limitText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  // ── Empty state ──
  emptyWrap: {
    alignItems: 'center',
    gap: 0,
    paddingHorizontal: 32,
  },
  emptyOrb: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyOrbInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  emptyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  emptyChipText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.4,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.30,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyCtaBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  // ── FAB ──
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.40,
    shadowRadius: 12,
    elevation: 8,
  },
});
