export type ContentType = 'text' | 'link' | 'code';

export interface Snippet {
  id: string;
  content: string;
  type: ContentType;
  title: string;
  folderId: string;
  tags: string[];
  createdAt: string;
  lastUsedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: string;
}

export const UNCATEGORIZED_ID = 'uncategorized';

export const UNCATEGORIZED_FOLDER: Folder = {
  id: UNCATEGORIZED_ID,
  name: 'Uncategorized',
  createdAt: new Date(0).toISOString(),
};

export const FREE_SNIPPET_LIMIT = 20;
