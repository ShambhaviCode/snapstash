import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import type { Snippet, ContentType } from '@/lib/types';
import { UNCATEGORIZED_ID } from '@/lib/types';

interface SnippetCardProps {
  snippet: Snippet;
  onEdit: () => void;
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

function getTypeConfig(type: ContentType) {
  switch (type) {
    case 'link':
      return { icon: 'link' as const, label: 'LINK' };
    case 'code':
      return { icon: 'code' as const, label: 'CODE' };
    default:
      return { icon: 'type' as const, label: 'TEXT' };
  }
}

export default function SnippetCard({ snippet, onEdit }: SnippetCardProps) {
  const colors = useColors();
  const { deleteSnippet, touchSnippet, folders, updateSnippet } = useApp();
  const [copied, setCopied] = useState(false);

  const scale = useSharedValue(1);
  const copyOpacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const copiedStyle = useAnimatedStyle(() => ({
    opacity: copyOpacity.value,
  }));

  const handlePress = async () => {
    // Scale feedback
    scale.value = withSequence(
      withSpring(0.97, { duration: 80 }),
      withSpring(1, { duration: 120 })
    );

    await Clipboard.setStringAsync(snippet.content);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await touchSnippet(snippet.id);

    // Show copied indicator
    copyOpacity.value = withSequence(
      withTiming(1, { duration: 150 }),
      withTiming(1, { duration: 1000 }),
      withTiming(0, { duration: 300 })
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const folderOptions = folders
      .filter(f => f.id !== snippet.folderId)
      .map(f => ({
        text: `Move to "${f.name}"`,
        onPress: () => updateSnippet(snippet.id, { folderId: f.id }),
      }));

    Alert.alert(snippet.title || 'Snippet', undefined, [
      { text: 'Edit', onPress: onEdit },
      ...folderOptions,
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Delete Snippet', 'This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteSnippet(snippet.id) },
          ]),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const typeConfig = getTypeConfig(snippet.type);
  const folderName =
    snippet.folderId === UNCATEGORIZED_ID
      ? null
      : folders.find(f => f.id === snippet.folderId)?.name;

  const typeBgColor = snippet.type === 'link'
    ? colors.linkTypeBg
    : snippet.type === 'code'
    ? colors.codeTypeBg
    : colors.textTypeBg;

  const typeIconColor = snippet.type === 'link'
    ? colors.linkTypeColor
    : snippet.type === 'code'
    ? colors.codeTypeColor
    : colors.textTypeColor;

  const previewText = snippet.content.trim().replace(/\s+/g, ' ').substring(0, 80);
  const isCode = snippet.type === 'code';

  return (
    <Animated.View style={[animatedStyle, { marginBottom: 10 }]}>
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={350}
        activeOpacity={1}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          {/* Type badge + title row */}
          <View style={styles.topRow}>
            <View style={[styles.typeBadge, { backgroundColor: typeBgColor }]}>
              <Feather name={typeConfig.icon} size={12} color={typeIconColor} />
            </View>
            <Text
              style={[styles.title, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {snippet.title}
            </Text>
            <Text style={[styles.time, { color: colors.mutedForeground }]}>
              {timeAgo(snippet.lastUsedAt)}
            </Text>
          </View>

          {/* Content preview */}
          <Text
            style={[
              styles.preview,
              {
                color: colors.mutedForeground,
                fontFamily: isCode ? Platform.OS === 'ios' ? 'Courier New' : 'monospace' : undefined,
                backgroundColor: isCode ? colors.codeBg : 'transparent',
                borderRadius: isCode ? 6 : 0,
                paddingHorizontal: isCode ? 6 : 0,
                paddingVertical: isCode ? 4 : 0,
              },
            ]}
            numberOfLines={2}
          >
            {previewText}
          </Text>

          {/* Bottom row: tags + folder */}
          <View style={styles.bottomRow}>
            <View style={styles.tags}>
              {snippet.tags.slice(0, 3).map(tag => (
                <View
                  key={tag}
                  style={[styles.tag, { backgroundColor: colors.tagBg }]}
                >
                  <Text style={[styles.tagText, { color: colors.tagText }]}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
            {folderName && (
              <View style={styles.folderBadge}>
                <Feather name="folder" size={10} color={colors.mutedForeground} />
                <Text style={[styles.folderText, { color: colors.mutedForeground }]}>
                  {folderName}
                </Text>
              </View>
            )}
          </View>

          {/* Copied overlay */}
          <Animated.View
            style={[
              styles.copiedOverlay,
              { backgroundColor: colors.success, borderRadius: colors.radius },
              copiedStyle,
              { pointerEvents: copied ? 'none' : 'none' },
            ]}
          >
            <Feather name="check" size={16} color="#FFFFFF" />
            <Text style={styles.copiedText}>Copied!</Text>
          </Animated.View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  typeBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  time: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    flexShrink: 0,
  },
  preview: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
    marginBottom: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tags: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  folderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  folderText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  copiedOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  copiedText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
