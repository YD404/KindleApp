import { useState } from 'react';
import { Icon } from './Icon';
import { FileItem } from './FileItem';
import type { ManagedFile, SortMode } from '../types';

interface FileListProps {
    /** ファイル配列 */
    files: ManagedFile[];
    /** 現在のソートモード */
    sortMode: SortMode;
    /** ファイル選択ダイアログを開く */
    onOpenFilePicker: () => void;
    /** ファイル削除 */
    onDeleteFile: (id: string) => void;
    /** ソートモード変更 */
    onSortChange: (mode: SortMode) => void;
    /** ファイル並び替え */
    onReorderFiles: (fromIndex: number, toIndex: number) => void;
}

/**
 * ファイルリストコンポーネント
 * ソートバーとファイルアイテムのリストを表示
 */
export const FileList: React.FC<FileListProps> = ({
    files,
    sortMode,
    onOpenFilePicker,
    onDeleteFile,
    onSortChange,
    onReorderFiles,
}) => {
    const [draggingItemId, setDraggingItemId] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggingItemId(files[index].id);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        const dragIndexStr = e.dataTransfer.getData('text/plain');
        if (!dragIndexStr) return;

        const dragIndex = parseInt(dragIndexStr, 10);
        onReorderFiles(dragIndex, dropIndex);
        setDraggingItemId(null);
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onSortChange(e.target.value as SortMode);
    };

    return (
        <>
            {/* ソートバー */}
            <div className="px-4 py-2 border-b bg-gray-50 flex items-center gap-2">
                <Icon name="DragHeight" size={18} className="text-gray-400" />
                <select
                    value={sortMode}
                    onChange={handleSortChange}
                    className="form-select"
                    style={{ width: 'auto', background: 'transparent' }}
                >
                    <option value="manual">手動並び替え (ドラッグ)</option>
                    <option value="name_asc">名前順 (昇順)</option>
                    <option value="name_desc">名前順 (降順)</option>
                    <option value="date_asc">日付順 (古い順)</option>
                    <option value="date_desc">日付順 (新しい順)</option>
                </select>
                <span className="text-xs text-gray-400 ml-auto">
                    {files.length} ファイル
                </span>
            </div>

            {/* ファイルリスト */}
            <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 pb-24 md:pb-4">
                {files.length === 0 ? (
                    /* 空の状態: ドロップゾーン */
                    <div
                        onClick={onOpenFilePicker}
                        className="drop-zone m-2"
                    >
                        <Icon name="Image" size={48} className="text-gray-300 mb-2" />
                        <p className="font-medium">画像をここへドロップ</p>
                        <p className="text-xs mt-1">
                            <span className="md:hidden">またはタップして追加</span>
                            <span className="hidden md:inline">またはクリックして追加</span>
                        </p>
                    </div>
                ) : (
                    /* ファイルがある場合: リスト + 追加ボタン */
                    <>
                        {files.map((file, index) => (
                            <FileItem
                                key={file.id}
                                file={file}
                                index={index}
                                isDragging={draggingItemId === file.id}
                                onDelete={onDeleteFile}
                                onDragStart={handleDragStart}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                            />
                        ))}

                        {/* 追加ボタン */}
                        <button
                            onClick={onOpenFilePicker}
                            className="btn-add w-full"
                        >
                            <Icon name="Image" size={20} />
                            画像を追加
                        </button>
                    </>
                )}
            </div>
        </>
    );
};
