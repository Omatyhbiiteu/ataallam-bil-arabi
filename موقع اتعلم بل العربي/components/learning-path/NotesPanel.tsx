import React, { useState } from 'react';
import { X } from 'lucide-react';

interface Note {
    id: string;
    lessonId: string;
    content: string;
    timestamp: number;
}

interface NotesPanelProps {
    isVisible: boolean;
    notes: Note[];
    onClose: () => void;
    onAddNote: (content: string) => void;
    onDeleteNote: (id: string) => void;
    t: any;
}

export const NotesPanel: React.FC<NotesPanelProps> = ({
    isVisible,
    notes,
    onClose,
    onAddNote,
    onDeleteNote,
    t
}) => {
    const [currentNote, setCurrentNote] = useState('');

    if (!isVisible) return null;

    return (
        <div className="fixed md:absolute inset-x-4 bottom-4 md:bottom-auto md:top-4 md:right-4 md:left-auto w-auto md:w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-stone-200 dark:border-gray-700 z-40 max-h-[70vh] md:max-h-[500px] flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="font-bold text-lg">{t.learningPath.notes || 'الملاحظات'}</h3>
                <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {notes.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">{t.learningPath.noNotes || 'لا توجد ملاحظات'}</p>
                ) : (
                    notes.map(note => (
                        <div key={note.id} className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{note.content}</p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>{new Date(note.timestamp).toLocaleString('ar-EG')}</span>
                                <button onClick={() => onDeleteNote(note.id)} className="text-red-500 hover:text-red-700">
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <textarea
                    value={currentNote}
                    onChange={(e) => setCurrentNote(e.target.value)}
                    placeholder={t.learningPath.addNotePlaceholder || 'أضف ملاحظة...'}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm resize-none"
                    rows={2}
                />
                <button
                    onClick={() => {
                        onAddNote(currentNote);
                        setCurrentNote('');
                    }}
                    disabled={!currentNote.trim()}
                    className="w-full mt-2 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition text-sm"
                >
                    {t.learningPath.addNoteButton || 'إضافة ملاحظة'}
                </button>
            </div>
        </div>
    );
};
