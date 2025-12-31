import { useState, useCallback } from 'react';

/**
 * ファイルドラッグ&ドロップ機能を提供するカスタムフック
 *
 * @param onFilesDropped - ファイルがドロップされた時のコールバック
 */
export const useDragDrop = (onFilesDropped: (files: FileList) => void) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        // ファイルのドラッグのみを対象とする
        if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
            setIsDragging(true);
        }
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        // 子要素へのドラッグではなく、実際に領域外に出た場合のみ
        if (e.relatedTarget === null || !e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);

            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                onFilesDropped(e.dataTransfer.files);
            }
        },
        [onFilesDropped]
    );

    return {
        isDragging,
        handleDragOver,
        handleDragLeave,
        handleDrop,
    };
};
