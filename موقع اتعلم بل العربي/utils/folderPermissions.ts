import type { Card, Folder, User } from '../types';

/** مجلد يملكه المستخدم الحالي (يمكن تعديله/حذفه) — مجلدات النظام والمجلدات المشتركة بدون userId لا تُحذف من الواجهة */
export function canUserManageFolder(folder: Folder | null | undefined, user: User | null): boolean {
    if (!folder || folder.isSystem) return false;
    if (!user?.id) return true;
    // Optimistic folders created locally before server response.
    if (String(folder.id || '').startsWith('tmp_folder_')) return true;
    if (folder.userId == null || String(folder.userId).trim() === '' || String(folder.userId).trim() === '0') return false;
    return String(folder.userId) === String(user.id);
}

/** تعديل/حذف بطاقة: بطاقات isSystem ممنوعة؛ بطاقة المستخدم تُدار حتى داخل مجلد نظام (مثل حفظ القاموس) */
export function canUserManageCard(card: Card, folder: Folder | undefined, user: User | null): boolean {
    if (!folder || card.isSystem) return false;
    if (!user?.id) return true;
    if (card.userId != null && card.userId !== '') {
        return String(card.userId) === String(user.id);
    }
    return canUserManageFolder(folder, user);
}
