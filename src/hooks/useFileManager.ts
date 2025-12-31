import { useState, useCallback, useRef } from 'react';
import type { ManagedFile, SortMode } from '../types';
import { generateId, isImageFile } from '../utils';

/**
 * ファイル管理ロジックを提供するカスタムフック
 *
 * @example
 * ```tsx
 * const {
 *   files,
 *   addFiles,
 *   removeFile,
 *   sortFiles,
 *   getImageFiles,
 * } = useFileManager();
 * ```
 */
export const useFileManager = () => {
    const [files, setFiles] = useState<ManagedFile[]>([]);
    const [sortMode, setSortMode] = useState<SortMode>('manual');
    const fileInputRef = useRef<HTMLInputElement>(null);

    /**
     * ファイルを追加
     */
    const addFiles = useCallback((newFilesList: FileList) => {
        const newFiles: ManagedFile[] = Array.from(newFilesList).map((file) => ({
            file,
            id: generateId(),
            preview: URL.createObjectURL(file),
        }));
        setFiles((prev) => [...prev, ...newFiles]);
    }, []);

    /**
     * ファイルを削除（プレビューURLも解放）
     */
    const removeFile = useCallback((id: string) => {
        setFiles((prev) => {
            const file = prev.find((f) => f.id === id);
            if (file) {
                URL.revokeObjectURL(file.preview);
            }
            return prev.filter((f) => f.id !== id);
        });
    }, []);

    /**
     * ファイルの順序を変更（ドラッグ&ドロップ用）
     */
    const reorderFiles = useCallback((fromIndex: number, toIndex: number) => {
        if (fromIndex === toIndex) return;

        setFiles((prev) => {
            const newFiles = [...prev];
            const [removed] = newFiles.splice(fromIndex, 1);
            newFiles.splice(toIndex, 0, removed);
            return newFiles;
        });
        setSortMode('manual');
    }, []);

    /**
     * ファイルをソート
     */
    const sortFiles = useCallback((mode: SortMode) => {
        setSortMode(mode);
        if (mode === 'manual') return;

        setFiles((prev) => {
            const sorted = [...prev].sort((a, b) => {
                switch (mode) {
                    case 'name_asc':
                        return a.file.name.localeCompare(b.file.name, 'ja');
                    case 'name_desc':
                        return b.file.name.localeCompare(a.file.name, 'ja');
                    case 'date_asc':
                        return a.file.lastModified - b.file.lastModified;
                    case 'date_desc':
                        return b.file.lastModified - a.file.lastModified;
                    case 'size_asc':
                        return a.file.size - b.file.size;
                    case 'size_desc':
                        return b.file.size - a.file.size;
                    default:
                        return 0;
                }
            });
            return sorted;
        });
    }, []);

    /**
     * 画像ファイルのみを取得
     */
    const getImageFiles = useCallback(() => {
        return files.filter((f) => isImageFile(f.file));
    }, [files]);

    /**
     * ファイル選択ダイアログを開く
     */
    const openFilePicker = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    /**
     * ファイル入力のonChangeハンドラ
     */
    const handleFileInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files.length > 0) {
                addFiles(e.target.files);
            }
            // 同じファイルを再選択できるようにリセット
            e.target.value = '';
        },
        [addFiles]
    );

    return {
        files,
        sortMode,
        fileInputRef,
        addFiles,
        removeFile,
        reorderFiles,
        sortFiles,
        getImageFiles,
        openFilePicker,
        handleFileInputChange,
    };
};
