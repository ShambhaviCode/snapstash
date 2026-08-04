import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { detectContentType, autoTitle } from '@/lib/contentDetector';
import type { ContentType } from '@/lib/types';
import { UNCATEGORIZED_ID } from '@/lib/types';

function TypeIndicator({ type, colors }: { type: ContentType; colors: any }) {
  const config: Record<ContentType, { icon: string; label: string; bg: string; color: string }> = {
    text: { icon: 'type', label: 'Text', bg: colors.textTypeBg, color: colors.textTypeColor },
    link: { icon: 'link', label: 'Link', bg: colors.linkTypeBg, color: colors.linkTypeColor },
    code: { icon: 'code', label: 'Code', bg: colors.codeTypeBg, color: colors.codeTypeColor },
  };
  const c = config[type];
  return (
    <View style={[styles.typeIndicator, { backgroundColor: c.bg }]}>
      <Feather name={c.icon as any} size={13} color={c.color} />
      <Text style={[styles.typeLabel, { color: c.color }]}>{c.label} detected</Text>
    </View>
  );
}

export default function EditScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { snippets, folders, addSnippet, updateSnippet, canAddSnippet } = useApp();

  const existingSnippet = id ? snippets.find(s => s.id === id) : null;
  const isEditing = !!existingSnippet;

  const [content, setContent] = useState(existingSnippet?.content ?? '');
  const [title, setTitle] = useState(existingSnippet?.title ?? '');
  const [folderId, setFolderId] = useState(existingSnippet?.folderId ?? UNCATEGORIZED_ID);
  const [tagInput, setTagInput] = useState((existingSnippet?.tags ?? []).join(', '));
  const [detectedType, setDetectedType] = useState<ContentType>(existingSnippet?.type ?? 'text');
  const [smartPaste, setSmartPaste] = useState<string | null>(null);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const contentRef = useRef<TextInput>(null);

  // Smart paste: offer clipboard content for new snippets
  useEffect(() => {
    if (!isEditing) {
      Clipboard.getStringAsync()
        .then(text => {
          if (text && text.trim() && text.trim() !== content) {
            setSmartPaste(text.trim());
          }
        })
        .catch(() => {});
    }
  }, []);

  // Auto-detect type as user types
  useEffect(() => {
    if (content.trim()) {
      setDetectedType(detectContentType(content));
    }
  }, [content]);

  const selectedFolder = folders.find(f => f.id === folderId);
  const tags = tagInput
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('Content required', 'Please enter some content.');
      return;
    }
    const finalTitle = title.trim() || autoTitle(content);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (isEditing && existingSnippet) {
      await updateSnippet(existingSnippet.id, {
        content: content.trim(),
        title: finalTitle,
        folderId,
        tags,
        type: detectedType,
      });
    } else {
      const result = await addSnippet({
        content: content.trim(),
        title: finalTitle,
        folderId,
        tags,
      });
      if (!result) {
        router.push('/paywall');
        return;
      }
    }
    router.back();
  };

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
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {isEditing ? 'Edit Snippet' : 'New Snippet'}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[
            styles.saveBtn,
            { backgroundColor: content.trim() ? colors.primary : colors.muted },
          ]}
          disabled={!content.trim()}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollViewCompat
        bottomOffset={20}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Smart paste banner */}
        {smartPaste && !content && (
          <View
            style={[
              styles.smartPasteBanner,
              { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' },
            ]}
          >
            <Feather name="clipboard" size={14} color={colors.primary} />
            <Text style={[styles.smartPasteText, { color: colors.primary }]} numberOfLines={1}>
              Paste from clipboard?
            </Text>
            <TouchableOpacity
              onPress={() => {
                setContent(smartPaste);
                setSmartPaste(null);
                contentRef.current?.focus();
              }}
              style={[styles.smartPasteBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.smartPasteBtnText}>Paste</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSmartPaste(null)}>
              <Feather name="x" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Content input */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>CONTENT</Text>
          <View
            style={[
              styles.contentInputWrapper,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <TextInput
              ref={contentRef}
              style={[
                styles.contentInput,
                {
                  color: colors.foreground,
                  fontFamily:
                    detectedType === 'code'
                      ? Platform.OS === 'ios'
                        ? 'Courier New'
                        : 'monospace'
                      : 'Inter_400Regular',
                },
              ]}
              placeholder="Paste or type your snippet…"
              placeholderTextColor={colors.mutedForeground}
              multiline
              textAlignVertical="top"
              value={content}
              onChangeText={setContent}
              autoFocus={!smartPaste}
            />
            {content.length > 0 && (
              <View style={styles.typeIndicatorRow}>
                <TypeIndicator type={detectedType} colors={colors} />
              </View>
            )}
          </View>
        </View>

        {/* Title input */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>TITLE</Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground,
                borderRadius: colors.radius,
              },
            ]}
            placeholder={content ? autoTitle(content) : 'Optional title…'}
            placeholderTextColor={colors.mutedForeground}
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
          />
        </View>

        {/* Folder picker */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>FOLDER</Text>
          <TouchableOpacity
            style={[
              styles.textInput,
              styles.folderPickerBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
            onPress={() => setShowFolderPicker(!showFolderPicker)}
            activeOpacity={0.7}
          >
            <Feather name="folder" size={15} color={colors.primary} />
            <Text style={[styles.folderPickerText, { color: colors.foreground }]}>
              {selectedFolder?.name ?? 'Uncategorized'}
            </Text>
            <Feather
              name={showFolderPicker ? 'chevron-up' : 'chevron-down'}
              size={15}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>

          {showFolderPicker && (
            <View
              style={[
                styles.folderList,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            >
              {folders.map(folder => (
                <TouchableOpacity
                  key={folder.id}
                  style={[
                    styles.folderOption,
                    { borderBottomColor: colors.border },
                    folder.id === folderId && { backgroundColor: colors.primary + '12' },
                  ]}
                  onPress={() => {
                    setFolderId(folder.id);
                    setShowFolderPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.folderOptionText,
                      {
                        color: folder.id === folderId ? colors.primary : colors.foreground,
                        fontFamily:
                          folder.id === folderId ? 'Inter_600SemiBold' : 'Inter_400Regular',
                      },
                    ]}
                  >
                    {folder.name}
                  </Text>
                  {folder.id === folderId && (
                    <Feather name="check" size={14} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Tags */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>TAGS</Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground,
                borderRadius: colors.radius,
              },
            ]}
            placeholder="react, typescript, snippets…"
            placeholderTextColor={colors.mutedForeground}
            value={tagInput}
            onChangeText={setTagInput}
            returnKeyType="done"
          />
          {tags.length > 0 && (
            <View style={styles.tagChips}>
              {tags.map(tag => (
                <View key={tag} style={[styles.tagChip, { backgroundColor: colors.tagBg }]}>
                  <Text style={[styles.tagChipText, { color: colors.tagText }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </KeyboardAwareScrollViewCompat>
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
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  smartPasteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  smartPasteText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  smartPasteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  smartPasteBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  fieldGroup: { gap: 8 },
  fieldLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
  },
  contentInputWrapper: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  contentInput: {
    fontSize: 15,
    lineHeight: 22,
    padding: 14,
    minHeight: 120,
  },
  typeIndicatorRow: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    paddingTop: 0,
  },
  typeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  typeLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  textInput: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  folderPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  folderPickerText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  folderList: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  folderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    justifyContent: 'space-between',
  },
  folderOptionText: {
    fontSize: 15,
  },
  tagChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tagChipText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
});
