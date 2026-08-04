import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import FolderCard from '@/components/FolderCard';
import type { Folder } from '@/lib/types';

export default function FoldersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { folders, snippets, addFolder, canAddFolder, isPremium } = useApp();
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const foldersWithCount = folders.map(f => ({
    ...f,
    count: snippets.filter((s: any) => s.folderId === f.id).length,
  }));

  const handleAddFolder = async () => {
    if (!canAddFolder) {
      router.push('/paywall');
      return;
    }
    setShowNewFolder(true);
  };

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    const folder = await addFolder(name);
    if (folder) {
      setNewFolderName('');
      setShowNewFolder(false);
    }
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
          <Text style={[styles.title, { color: colors.foreground }]}>Folders</Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={handleAddFolder}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={16} color="#FFFFFF" />
            {!isPremium && (
              <Feather name="lock" size={10} color="#FFFFFF" style={styles.lockIcon} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Premium locked state */}
      {!isPremium && folders.length <= 1 && (
        <TouchableOpacity
          style={[styles.upgradeCard, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}
          onPress={() => router.push('/paywall')}
          activeOpacity={0.8}
        >
          <Feather name="lock" size={20} color={colors.primary} />
          <View style={styles.upgradeText}>
            <Text style={[styles.upgradeTitle, { color: colors.foreground }]}>
              Unlock folders with Premium
            </Text>
            <Text style={[styles.upgradeSub, { color: colors.mutedForeground }]}>
              Create unlimited folders to organize your snippets
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color={colors.primary} />
        </TouchableOpacity>
      )}

      <FlatList
        data={foldersWithCount}
        keyExtractor={item => item.id}
        numColumns={2}
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <FolderCard
              folder={item}
              count={item.count}
              onPress={() =>
                router.push({ pathname: '/folder/[id]', params: { id: item.id } })
              }
            />
          </View>
        )}
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingTop: 16,
          paddingBottom: Platform.OS === 'web' ? 84 + 20 : insets.bottom + 80,
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Feather name="folder" size={48} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No folders yet
            </Text>
          </View>
        }
      />

      {/* New folder modal */}
      <Modal
        visible={showNewFolder}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewFolder(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setShowNewFolder(false)}
          />
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius + 4,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              New Folder
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                  color: colors.foreground,
                  borderRadius: colors.radius,
                },
              ]}
              placeholder="Folder name"
              placeholderTextColor={colors.mutedForeground}
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
              onSubmitEditing={handleCreateFolder}
              returnKeyType="done"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderColor: colors.border }]}
                onPress={() => {
                  setShowNewFolder(false);
                  setNewFolderName('');
                }}
              >
                <Text style={[styles.modalBtnText, { color: colors.mutedForeground }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  styles.modalBtnPrimary,
                  { backgroundColor: newFolderName.trim() ? colors.primary : colors.muted },
                ]}
                onPress={handleCreateFolder}
                disabled={!newFolderName.trim()}
              >
                <Text style={styles.modalBtnPrimaryText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  upgradeText: { flex: 1 },
  upgradeTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  upgradeSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  gridItem: {
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    padding: 24,
    borderWidth: 1,
    zIndex: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalBtnPrimary: {
    borderWidth: 0,
  },
  modalBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  modalBtnPrimaryText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
});
