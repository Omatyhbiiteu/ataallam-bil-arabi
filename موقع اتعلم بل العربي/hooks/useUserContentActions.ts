import { Dispatch, SetStateAction, useCallback } from 'react';
import { AddCardResult, AppNotification, Card, Folder, User } from '../types';
import { UserContentAPI } from '../services/apiClient';
import { canUserManageFolder } from '../utils/folderPermissions';
import { FREE_MAX_CARDS_PER_FOLDER, FREE_MAX_FOLDERS } from '../app/learningStats';

type ToastType = 'success' | 'error' | 'info';
type ToastVariant = 'default' | 'modal';

type UseUserContentActionsParams = {
  currentUser: User | null;
  learningLang: 'en' | 'de';
  hasActiveSubscription: boolean;
  folders: Folder[];
  cards: Card[];
  setFolders: Dispatch<SetStateAction<Folder[]>>;
  setCards: Dispatch<SetStateAction<Card[]>>;
  refreshFoldersAndCardsFromApi: () => Promise<{ folders: Folder[]; cards: Card[] } | null>;
  openUpgradeModal: (message: string, title?: string) => void;
  showToast: (message: string, type: ToastType, variant?: ToastVariant) => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'time' | 'read'>) => void;
  registerDailyMastered: () => void;
};

export const cardUpdatesToApi = (updates: Partial<Card>): Record<string, unknown> => {
  const body: Record<string, unknown> = {};
  if (updates.folderId !== undefined) body.folderId = updates.folderId;
  if (updates.frontText !== undefined) body.frontText = updates.frontText;
  if (updates.backText !== undefined) body.backText = updates.backText;
  if (updates.frontImage !== undefined) body.frontImage = updates.frontImage;
  if (updates.frontImageFit !== undefined) body.frontImageFit = updates.frontImageFit;
  if (updates.nextReview !== undefined) body.nextReview = updates.nextReview;
  if (updates.interval !== undefined) body.interval = updates.interval;
  if (updates.reviews !== undefined) body.reviews = updates.reviews;
  if (updates.easeFactor !== undefined) body.easeFactor = updates.easeFactor;
  if (updates.status !== undefined) body.status = updates.status;
  return body;
};

const mapCardFromUserApi = (raw: unknown): Card | null => {
  const o = raw as Record<string, unknown> | null;
  if (!o || typeof o !== 'object' || o.id == null) return null;
  const st = String(o.status ?? 'new');
  const status: Card['status'] =
    st === 'learning' || st === 'review' || st === 'mastered' || st === 'new' ? st : 'new';

  return {
    id: String(o.id),
    folderId: String(o.folderId ?? ''),
    frontText: String(o.frontText ?? ''),
    backText: String(o.backText ?? ''),
    frontImage: o.frontImage ? String(o.frontImage) : undefined,
    frontImageFit: o.frontImageFit === 'portrait' ? 'portrait' : o.frontImageFit === 'wide' ? 'wide' : undefined,
    createdAt: Number(o.createdAt) || Date.now(),
    nextReview: Number(o.nextReview) || Date.now(),
    interval: Number(o.interval) || 0,
    reviews: Number(o.reviews) || 0,
    easeFactor: Number(o.easeFactor) || 2.5,
    status,
    isSystem: Boolean(o.isSystem),
    userId: o.userId != null && o.userId !== '' ? String(o.userId) : null,
  };
};

export function useUserContentActions({
  currentUser,
  learningLang,
  hasActiveSubscription,
  folders,
  cards,
  setFolders,
  setCards,
  refreshFoldersAndCardsFromApi,
  openUpgradeModal,
  showToast,
  addNotification,
  registerDailyMastered,
}: UseUserContentActionsParams) {
  const handleAddFolder = useCallback(async (name: string, color: string, parentId?: string) => {
    if (!hasActiveSubscription && parentId) {
      openUpgradeModal(
        'المجلدات الفرعية (مجلد داخل مجلد) متاحة لمشتركي Pro فقط. في الخطة المجانية يمكنك إنشاء مجلدات رئيسية فقط.'
      );
      return;
    }

    if (currentUser?.id) {
      if (!hasActiveSubscription) {
        const myFoldersCount = folders.filter(
          (f) =>
            !f.isSystem &&
            String(f.userId || '') === String(currentUser.id) &&
            !f.parentId
        ).length;
        if (myFoldersCount >= FREE_MAX_FOLDERS) {
          openUpgradeModal(
            `الخطة المجانية تسمح بحد أقصى ${FREE_MAX_FOLDERS} مجلدات رئيسية لكل لغة (بدون مجلدات فرعية). اشترك في Pro لمجلدات فرعية وحدود أوسع.`
          );
          return;
        }
      }

      const tempId = `tmp_folder_${crypto.randomUUID()}`;
      const optimisticFolder: Folder = {
        id: tempId,
        name,
        color,
        createdAt: Date.now(),
        parentId,
        userId: currentUser.id,
        isSystem: false,
      };

      setFolders((prev) => [...prev, optimisticFolder]);
      try {
        await UserContentAPI.createFolder(learningLang, { name, color, parentId: parentId || undefined });
        await refreshFoldersAndCardsFromApi();
        showToast('تم إنشاء المجلد بنجاح', 'success');
      } catch (e: any) {
        setFolders((prev) => prev.filter((f) => f.id !== tempId));
        showToast(e?.message || 'تعذر إنشاء المجلد على الخادم', 'error');
      }
      return;
    }

    const newFolder: Folder = { id: crypto.randomUUID(), name, color, createdAt: Date.now(), parentId };
    setFolders(prev => [...prev, newFolder]);
    showToast('تم إنشاء المجلد محلياً', 'success');
  }, [currentUser, hasActiveSubscription, folders, learningLang, refreshFoldersAndCardsFromApi, setFolders, openUpgradeModal, showToast]);

  const handleDeleteFolder = useCallback(async (id: string) => {
    const folder = folders.find(f => f.id === id);
    if (folder?.isSystem) {
      showToast('لا يمكن حذف مجلدات النظام', 'error');
      return;
    }

    const getFolderFamily = (parentId: string): string[] => {
      const children = folders.filter(f => f.parentId === parentId);
      let ids = children.map(c => c.id);
      children.forEach(c => {
        ids = [...ids, ...getFolderFamily(c.id)];
      });
      return ids;
    };

    const folderIdsToDelete = [id, ...getFolderFamily(id)];
    if (currentUser?.id) {
      const isOptimisticMine = String(folder?.id || '').startsWith('tmp_folder_');
      const isOwnedByMe = folder && String(folder.userId || '') === String(currentUser.id);
      if (!isOptimisticMine && !isOwnedByMe) {
        showToast('لا يمكنك حذف هذا المجلد', 'error');
        return;
      }
      if (isOptimisticMine) {
        setFolders(prev => prev.filter(f => !folderIdsToDelete.includes(f.id)));
        setCards(prev => prev.filter(c => !folderIdsToDelete.includes(c.folderId)));
        showToast('تم حذف المجلد', 'success');
        return;
      }
      if (!canUserManageFolder(folder ?? null, currentUser)) {
        showToast('لا يمكنك حذف هذا المجلد', 'error');
        return;
      }

      const prevFolders = folders;
      const prevCards = cards;
      setFolders(prev => prev.filter(f => !folderIdsToDelete.includes(f.id)));
      setCards(prev => prev.filter(c => !folderIdsToDelete.includes(c.folderId)));
      try {
        await UserContentAPI.deleteFolder(learningLang, id);
        await refreshFoldersAndCardsFromApi();
        showToast('تم حذف المجلد بنجاح', 'success');
      } catch (e: any) {
        setFolders(prevFolders);
        setCards(prevCards);
        showToast(e?.message || 'تعذر حذف المجلد', 'error');
      }
      return;
    }

    setFolders(prev => prev.filter(f => !folderIdsToDelete.includes(f.id)));
    setCards(prev => prev.filter(c => !folderIdsToDelete.includes(c.folderId)));
    showToast('تم حذف المجلد بنجاح', 'success');
  }, [folders, cards, currentUser, learningLang, refreshFoldersAndCardsFromApi, setFolders, setCards, showToast]);

  const handleEditFolder = useCallback(async (id: string, updates: Partial<Folder>) => {
    if (!hasActiveSubscription && updates.parentId != null && String(updates.parentId).trim() !== '') {
      openUpgradeModal(
        'تعيين مجلد أب (مجلد فرعي) متاح لمشتركي Pro فقط. يمكنك الإبقاء على المجلد في الجذر أو ترقية خطتك.'
      );
      return;
    }

    if (currentUser?.id) {
      const folder = folders.find(f => f.id === id);
      if (folder && !canUserManageFolder(folder, currentUser)) {
        showToast('لا يمكنك تعديل هذا المجلد', 'error');
        return;
      }
      try {
        await UserContentAPI.updateFolder(learningLang, id, {
          name: updates.name,
          color: updates.color,
          parentId: updates.parentId,
        });
        await refreshFoldersAndCardsFromApi();
        showToast('تم تعديل المجلد بنجاح ✨', 'success');
      } catch (e: any) {
        showToast(e?.message || 'تعذر حفظ التعديل', 'error');
      }
      return;
    }

    setFolders(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    showToast('تم تعديل المجلد بنجاح ✨', 'success');
  }, [currentUser, folders, learningLang, refreshFoldersAndCardsFromApi, setFolders, hasActiveSubscription, openUpgradeModal, showToast]);

  const handleAddCard = useCallback(async (card: Partial<Card>): Promise<AddCardResult> => {
    const frontText = String(card.frontText ?? '').trim();
    const backText = String(card.backText ?? '').trim();
    if (!card.folderId || !frontText || !backText) {
      showToast('أكمل الوجه الأمامي والخلفي للبطاقة ثم اختر مجلداً صالحاً.', 'error', 'modal');
      return false;
    }

    if (currentUser?.id && !hasActiveSubscription) {
      const requestedFolderId = String(card.folderId);
      const myCardsInFolder = cards.filter((c) => {
        if (String(c.folderId) !== requestedFolderId) return false;
        if (String(c.userId || '') === String(currentUser.id)) return true;
        const folder = folders.find((f) => f.id === requestedFolderId);
        return !c.isSystem && !c.userId && !!folder && String(folder.userId || '') === String(currentUser.id);
      }).length;
      if (myCardsInFolder >= FREE_MAX_CARDS_PER_FOLDER) {
        openUpgradeModal(
          `الخطة المجانية تسمح بحد أقصى ${FREE_MAX_CARDS_PER_FOLDER} بطاقة داخل كل مجلد. اشترك في Pro لزيادة الحد.`
        );
        return 'pro_limit';
      }
    }

    if (currentUser?.id) {
      let folderId = String(card.folderId);
      if (folderId.startsWith('tmp_folder_')) {
        const meta = folders.find((f) => f.id === folderId);
        const fname = meta?.name;
        const synced = await refreshFoldersAndCardsFromApi();
        const list = synced?.folders;
        if (!list?.length) {
          showToast('تعذر مزامنة المجلدات. تحقق من الاتصال بالخادم ثم أعد المحاولة.', 'error', 'modal');
          return false;
        }
        const resolved =
          (fname &&
            list.find(
              (f) =>
                f.name === fname &&
                !f.isSystem &&
                String(f.userId || '') === String(currentUser.id)
            )) ||
          list.find((f) => !f.isSystem && String(f.userId || '') === String(currentUser.id));
        if (!resolved) {
          showToast(
            'المجلد لم يُحفظ بعد على الخادم أو تغيّر. افتح تبويب البطاقات ثم جرّب الإضافة مرة أخرى.',
            'error',
            'modal'
          );
          return false;
        }
        folderId = resolved.id;
      }

      try {
        const res = (await UserContentAPI.createCard(learningLang, {
          folderId,
          frontText,
          backText,
          frontImage: card.frontImage ?? null,
          frontImageFit: card.frontImageFit ?? null,
        })) as { card?: unknown };
        const created = mapCardFromUserApi(res?.card);
        if (created) {
          setCards((prev) => (prev.some((c) => c.id === created.id) ? prev : [...prev, created]));
        }
        void refreshFoldersAndCardsFromApi();
        addNotification({
          type: 'system',
          title: 'بطاقة جديدة 📚',
          message: `تم إضافة "${frontText}" بنجاح إلى مجلدك.`,
          icon: 'book'
        });
        showToast('تمت الإضافة بنجاح', 'success');
        return true;
      } catch (e: any) {
        showToast(e?.message || 'تعذر حفظ البطاقة على الخادم', 'error', 'modal');
        return false;
      }
    }

    const targetFolder = folders.find(f => f.id === card.folderId);
    if (targetFolder?.isSystem) {
      showToast('عذراً، لا يمكن إضافة كروت لمجلدات النظام إلا بعد تسجيل الدخول للمزامنة مع الخادم.', 'error');
      return false;
    }

    const newCard: Card = {
      ...card,
      folderId: String(card.folderId),
      frontText,
      backText,
      id: crypto.randomUUID(), createdAt: Date.now(), nextReview: Date.now(), interval: 0, reviews: 0, easeFactor: 2.5, status: 'new',
    } as Card;
    setCards(prev => [...prev, newCard]);
    addNotification({
      type: 'system',
      title: 'بطاقة جديدة 📚',
      message: `تم إضافة "${frontText}" بنجاح إلى مجلدك.`,
      icon: 'book'
    });
    showToast('تمت الإضافة بنجاح', 'success');
    return true;
  }, [folders, cards, currentUser, hasActiveSubscription, learningLang, refreshFoldersAndCardsFromApi, addNotification, setCards, showToast, openUpgradeModal]);

  const handleEditCard = useCallback(async (cardId: string, updates: Partial<Card>) => {
    const oldCard = cards.find((c) => c.id === cardId);
    const becomesMastered = updates.status === 'mastered' && oldCard?.status !== 'mastered';
    if (currentUser?.id) {
      const body = cardUpdatesToApi(updates);
      if (Object.keys(body).length === 0) {
        setCards(prevCards => prevCards.map(c => c.id === cardId ? { ...c, ...updates } : c));
        if (becomesMastered) registerDailyMastered();
        return;
      }
      try {
        await UserContentAPI.updateCard(learningLang, cardId, body);
        await refreshFoldersAndCardsFromApi();
        if (becomesMastered) registerDailyMastered();
        showToast('تم تعديل البطاقة بنجاح', 'success');
      } catch (e: any) {
        showToast(e?.message || 'تعذر حفظ التعديل', 'error');
      }
      return;
    }

    setCards(prevCards => prevCards.map(c => c.id === cardId ? { ...c, ...updates } : c));
    if (becomesMastered) registerDailyMastered();
    showToast('تم تعديل البطاقة بنجاح', 'success');
  }, [cards, currentUser, learningLang, refreshFoldersAndCardsFromApi, setCards, registerDailyMastered, showToast]);

  const handleEditCards = useCallback(async (cardIds: string[], updates: Partial<Card>) => {
    if (cardIds.length === 0) return;
    const masteryCount = updates.status === 'mastered'
      ? cardIds.filter((id) => {
          const c = cards.find((x) => x.id === id);
          return c && c.status !== 'mastered';
        }).length
      : 0;

    if (currentUser?.id) {
      const body = cardUpdatesToApi(updates);
      if (Object.keys(body).length === 0) {
        setCards(prevCards => prevCards.map(c => cardIds.includes(c.id) ? { ...c, ...updates } : c));
        for (let i = 0; i < masteryCount; i++) registerDailyMastered();
        showToast('تم تحديث البطاقات المحددة', 'success');
        return;
      }
      try {
        await Promise.all(cardIds.map(id => UserContentAPI.updateCard(learningLang, id, body)));
        await refreshFoldersAndCardsFromApi();
        for (let i = 0; i < masteryCount; i++) registerDailyMastered();
        showToast('تم تحديث البطاقات المحددة', 'success');
      } catch (e: any) {
        showToast(e?.message || 'تعذر تحديث البطاقات', 'error');
      }
      return;
    }

    setCards(prevCards => prevCards.map(c => cardIds.includes(c.id) ? { ...c, ...updates } : c));
    for (let i = 0; i < masteryCount; i++) registerDailyMastered();
    showToast('تم تحديث البطاقات المحددة', 'success');
  }, [cards, currentUser, learningLang, refreshFoldersAndCardsFromApi, setCards, registerDailyMastered, showToast]);

  const handleDeleteCard = useCallback(async (id: string) => {
    if (currentUser?.id) {
      try {
        await UserContentAPI.deleteCard(learningLang, id);
        await refreshFoldersAndCardsFromApi();
      } catch (e: any) {
        showToast(e?.message || 'تعذر حذف البطاقة', 'error');
      }
      return;
    }

    setCards(prevCards => prevCards.filter(c => c.id !== id));
  }, [currentUser, learningLang, refreshFoldersAndCardsFromApi, setCards, showToast]);

  const handleDeleteCards = useCallback(async (cardIds: string[]) => {
    if (cardIds.length === 0) return;
    if (currentUser?.id) {
      try {
        await Promise.all(cardIds.map(id => UserContentAPI.deleteCard(learningLang, id)));
        await refreshFoldersAndCardsFromApi();
        showToast('تم حذف البطاقات المحددة', 'success');
      } catch (e: any) {
        showToast(e?.message || 'تعذر حذف بعض البطاقات', 'error');
      }
      return;
    }

    setCards(prevCards => prevCards.filter(c => !cardIds.includes(c.id)));
    showToast('تم حذف البطاقات المحددة', 'success');
  }, [currentUser, learningLang, refreshFoldersAndCardsFromApi, setCards, showToast]);

  const handleDeleteAll = useCallback(async () => {
    if (!currentUser?.id) {
      showToast('سجّل الدخول لحذف مجلداتك وبطاقاتك الخاصة.', 'error');
      return;
    }

    const myFolderIds = folders
      .filter((f) => canUserManageFolder(f, currentUser))
      .map((f) => f.id);
    const serverFolderIds = myFolderIds.filter((id) => !String(id).startsWith('tmp_folder_'));
    const prevFolders = folders;
    const prevCards = cards;

    setFolders((prev) => prev.filter((f) => !myFolderIds.includes(f.id)));
    setCards((prev) => prev.filter((c) => !myFolderIds.includes(c.folderId)));

    try {
      await UserContentAPI.deleteAllMyFolders(learningLang);
      await refreshFoldersAndCardsFromApi();
      showToast('تم حذف جميع مجلداتك وبطاقاتك التي أنشأتها (بما فيها الفرعية).', 'success');
    } catch (e: any) {
      try {
        await Promise.all(serverFolderIds.map((id) => UserContentAPI.deleteFolder(learningLang, id)));
        await refreshFoldersAndCardsFromApi();
        showToast('تم حذف مجلداتك وبطاقاتك الخاصة.', 'success');
      } catch (fallbackError: any) {
        setFolders(prevFolders);
        setCards(prevCards);
        showToast(fallbackError?.message || e?.message || 'تعذر إكمال الحذف', 'error');
      }
    }
  }, [currentUser, folders, cards, learningLang, refreshFoldersAndCardsFromApi, setFolders, setCards, showToast]);

  return {
    handleAddFolder,
    handleDeleteFolder,
    handleEditFolder,
    handleAddCard,
    handleEditCard,
    handleEditCards,
    handleDeleteCard,
    handleDeleteCards,
    handleDeleteAll,
  };
}
