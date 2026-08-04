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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import SnippetCard from '@/components/SnippetCard';

export default function FolderDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { snippets, folders, isLoading } = useApp();
  const [query, setQuery] = useState('');

  const folder = folders.find(f => f.id === id);
  const folderSnippets = useMemo(
    () => snippets.filter((s: any) => s.folderId === id),
    [snippets, id]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return folderSnippets;
    const q = query.toLowerCase();
    return folderSnippets.filter(
      (s: any) =>
        s.title.toLowerCase().includes(q) ||
        s.content.toLowerCase().includes(q) ||
        s.tags.some((t: string) => t.toLowerCase().includes(q))
    );
  }, [folderSnippets, query]);

  const sorted = useMemo(
    () =>
      [...filtered].sort(
        (a: any, b: any) =>
          new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
      ),
    [filtered]
  );

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerMid}>
          <Text style={[styles.folderName, { color: colors.foreground }]} numberOfLines={1}>
            {folder?.name ?? 'Folder'}
          </Text>
          <Text style={[styles.folderCount, { color: colors.mutedForeground }]}>
            {folderSnippets.length} snippets
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchWrapper, { borderBottomColor: colors.border }]}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.secondary, borderColor: colors.border },
          ]}
        >
          <Feather name="search" size={15} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search in folder…"
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : sorted.length === 0 ? (
        <View style={styles.centered}>
          <Feather name="archive" size={48} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {query ? 'No results' : 'Empty folder'}
          </Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            {query
              ? `Nothing matches "${query}"`
              : 'Add snippets to this folder when creating them'}
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
            paddingBottom: Platform.OS === 'web' ? 60 : insets.bottom + 60,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMid: { flex: 1 },
  folderName: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  folderCount: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
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
});
