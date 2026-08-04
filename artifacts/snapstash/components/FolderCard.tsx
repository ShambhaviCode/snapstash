import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import type { Folder } from '@/lib/types';
import { UNCATEGORIZED_ID } from '@/lib/types';

interface FolderCardProps {
  folder: Folder;
  count: number;
  onPress: () => void;
}

const FOLDER_COLORS = [
  '#5B4EF5',
  '#059669',
  '#D97706',
  '#DC2626',
  '#7C3AED',
  '#0284C7',
  '#BE185D',
];

function getFolderColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return FOLDER_COLORS[Math.abs(hash) % FOLDER_COLORS.length];
}

export default function FolderCard({ folder, count, onPress }: FolderCardProps) {
  const colors = useColors();
  const { deleteFolder } = useApp();
  const folderColor = getFolderColor(folder.id);
  const isUncategorized = folder.id === UNCATEGORIZED_ID;

  const handleLongPress = () => {
    if (isUncategorized) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      `Delete "${folder.name}"?`,
      'Snippets in this folder will be moved to Uncategorized.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteFolder(folder.id),
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={handleLongPress}
      delayLongPress={400}
      activeOpacity={0.75}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: folderColor + '18' }]}>
        <Feather
          name={isUncategorized ? 'inbox' : 'folder'}
          size={22}
          color={folderColor}
        />
      </View>
      <Text
        style={[styles.name, { color: colors.foreground }]}
        numberOfLines={1}
      >
        {folder.name}
      </Text>
      <Text style={[styles.count, { color: colors.mutedForeground }]}>
        {count} {count === 1 ? 'item' : 'items'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  count: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});
