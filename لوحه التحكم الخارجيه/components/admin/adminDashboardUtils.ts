import { Folder } from '../../types';

export const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};

/** يحدد أي جذر رسمي (من قائمة المجلدات الرئيسية) يتبع له folderId — مباشر أو فرعي */
export const resolveOfficialDictRootId = (folderId: string, officialRoots: Folder[], merged: Folder[]): string => {
  if (officialRoots.some(r => r.id === folderId)) return folderId;
  let cur = merged.find(f => f.id === folderId);
  const seen = new Set<string>();
  while (cur?.parentId && !seen.has(cur.id)) {
    seen.add(cur.id);
    if (officialRoots.some(r => r.id === cur.parentId)) return cur.parentId;
    cur = merged.find(f => f.id === cur.parentId);
  }
  return officialRoots[0]?.id ?? folderId;
};
