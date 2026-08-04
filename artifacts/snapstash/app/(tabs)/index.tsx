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

export default function LibraryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { snippets, isLoading, canAddSnippet, isPremium } = useApp();
  const limit = FREE_SNIPPET_LIMIT;
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
            <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.countText}>{snippets.length}</Text>
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
      {!isPremium && snippets.length >= limit && (
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
      ) : sorted.length === 0 ? (
        <View style={styles.centered}>
          <Feather name="archive" size={52} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {query ? 'No results' : 'Nothing stashed yet'}
          </Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            {query
              ? `No snippets match "${query}"`
              : 'Tap + to save your first snippet'}
          </Text>
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
        onPress={() => {
          if (!canAddSnippet) {
            router.push('/paywall');
            return;
          }
          router.push('/edit');
        }}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={26} color="#FFFFFF" />
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
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  countBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
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
    gap: 10,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
});
