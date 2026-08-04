import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  loadSnippets, saveSnippets,
  loadFolders, saveFolders,
} from '@/lib/storage';
import type { Snippet, Folder } from '@/lib/types';
import { UNCATEGORIZED_ID, UNCATEGORIZED_FOLDER, FREE_SNIPPET_LIMIT } from '@/lib/types';
import { detectContentType, autoTitle } from '@/lib/contentDetector';
import { useSubscription } from '@/lib/revenuecat';

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

interface AddSnippetInput {
  content: string;
  title?: string;
  folderId?: string;
  tags?: string[];
}

interface AppContextValue {
  snippets: Snippet[];
  folders: Folder[];
  isPremium: boolean;
  isLoading: boolean;
  canAddSnippet: boolean;
  canAddFolder: boolean;
  addSnippet: (data: AddSnippetInput) => Promise<Snippet | null>;
  updateSnippet: (
    id: string,
    data: Partial<Pick<Snippet, 'content' | 'title' | 'folderId' | 'tags' | 'type'>>
  ) => Promise<void>;
  deleteSnippet: (id: string) => Promise<void>;
  touchSnippet: (id: string) => Promise<void>;
  addFolder: (name: string) => Promise<Folder | null>;
  deleteFolder: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [folders, setFolders] = useState<Folder[]>([UNCATEGORIZED_FOLDER]);
  const [isLoading, setIsLoading] = useState(true);

  // Derive premium status from RevenueCat (SubscriptionProvider must wrap AppProvider)
  const { isSubscribed: isPremium } = useSubscription();

  useEffect(() => {
    async function load() {
      const [s, f] = await Promise.all([loadSnippets(), loadFolders()]);
      setSnippets(s);
      setFolders(f);
      setIsLoading(false);
    }
    load();
  }, []);

  const canAddSnippet = isPremium || snippets.length < FREE_SNIPPET_LIMIT;
  // Free tier: only 1 folder (Uncategorized). Folders array always has Uncategorized.
  const canAddFolder = isPremium;

  const addSnippet = useCallback(
    async ({ content, title, folderId, tags }: AddSnippetInput): Promise<Snippet | null> => {
      if (!canAddSnippet) return null;
      const type = detectContentType(content);
      const snippet: Snippet = {
        id: generateId(),
        content,
        type,
        title: title?.trim() || autoTitle(content),
        folderId: folderId ?? UNCATEGORIZED_ID,
        tags: tags ?? [],
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
      };
      const updated = [snippet, ...snippets];
      setSnippets(updated);
      await saveSnippets(updated);
      return snippet;
    },
    [snippets, canAddSnippet]
  );

  const updateSnippet = useCallback(
    async (
      id: string,
      data: Partial<Pick<Snippet, 'content' | 'title' | 'folderId' | 'tags' | 'type'>>
    ) => {
      const updated = snippets.map(s => (s.id === id ? { ...s, ...data } : s));
      setSnippets(updated);
      await saveSnippets(updated);
    },
    [snippets]
  );

  const deleteSnippet = useCallback(
    async (id: string) => {
      const updated = snippets.filter(s => s.id !== id);
      setSnippets(updated);
      await saveSnippets(updated);
    },
    [snippets]
  );

  const touchSnippet = useCallback(
    async (id: string) => {
      const now = new Date().toISOString();
      const updated = snippets
        .map(s => (s.id === id ? { ...s, lastUsedAt: now } : s))
        .sort(
          (a, b) =>
            new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
        );
      setSnippets(updated);
      await saveSnippets(updated);
    },
    [snippets]
  );

  const addFolder = useCallback(
    async (name: string): Promise<Folder | null> => {
      if (!canAddFolder) return null;
      const folder: Folder = {
        id: generateId(),
        name: name.trim(),
        createdAt: new Date().toISOString(),
      };
      const updated = [...folders, folder];
      setFolders(updated);
      await saveFolders(updated);
      return folder;
    },
    [folders, canAddFolder]
  );

  const deleteFolder = useCallback(
    async (id: string) => {
      if (id === UNCATEGORIZED_ID) return;
      // Move snippets from deleted folder → Uncategorized
      const movedSnippets = snippets.map(s =>
        s.folderId === id ? { ...s, folderId: UNCATEGORIZED_ID } : s
      );
      setSnippets(movedSnippets);
      await saveSnippets(movedSnippets);

      const updatedFolders = folders.filter(f => f.id !== id);
      setFolders(updatedFolders);
      await saveFolders(updatedFolders);
    },
    [folders, snippets]
  );

  return (
    <AppContext.Provider
      value={{
        snippets,
        folders,
        isPremium,
        isLoading,
        canAddSnippet,
        canAddFolder,
        addSnippet,
        updateSnippet,
        deleteSnippet,
        touchSnippet,
        addFolder,
        deleteFolder,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
