import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Snippet, Folder } from './types';
import { UNCATEGORIZED_FOLDER } from './types';

const SNIPPETS_KEY = '@snapstash/snippets_v1';
const FOLDERS_KEY = '@snapstash/folders_v1';
const PREMIUM_KEY = '@snapstash/premium_v1';

export async function loadSnippets(): Promise<Snippet[]> {
  try {
    const raw = await AsyncStorage.getItem(SNIPPETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveSnippets(snippets: Snippet[]): Promise<void> {
  await AsyncStorage.setItem(SNIPPETS_KEY, JSON.stringify(snippets));
}

export async function loadFolders(): Promise<Folder[]> {
  try {
    const raw = await AsyncStorage.getItem(FOLDERS_KEY);
    const parsed: Folder[] = raw ? JSON.parse(raw) : [];
    // Always ensure Uncategorized exists
    const hasUncategorized = parsed.some(f => f.id === UNCATEGORIZED_FOLDER.id);
    if (!hasUncategorized) {
      return [UNCATEGORIZED_FOLDER, ...parsed];
    }
    return parsed;
  } catch {
    return [UNCATEGORIZED_FOLDER];
  }
}

export async function saveFolders(folders: Folder[]): Promise<void> {
  await AsyncStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
}

export async function loadPremium(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(PREMIUM_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

export async function savePremium(isPremium: boolean): Promise<void> {
  await AsyncStorage.setItem(PREMIUM_KEY, isPremium ? 'true' : 'false');
}
