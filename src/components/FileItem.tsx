import { Icon } from './Icon';
import type { ManagedFile } from '../types';
import { formatSize, formatDate, isImageFile } from '../utils';

interface FileItemProps {
    /** ファイルデータ */
    file: ManagedFile;
    /** リスト内のインデックス */
    index: number;
    /** ドラッグ中かどうか */
    isDragging: boolean;
    /** 削除ハンドラ */
    onDelete: (id: string) => void;
    /** ドラッグ開始 */
    onDragStart: (e: React.DragEvent, index: number) => void;
    /** ドラッグオーバー */
    onDragOver: (e: React.DragEvent) => void;
    /** ドロップ */
    onDrop: (e: React.DragEvent, index: number) => void;
}

/**
 * ファイルタイプに応じたアイコンを表示
 */
const FileTypeIcon: React.FC<{ type: string }> = ({ type }) => {
    const size = 20;
    if (type.startsWith('image/')) {
        return <Icon name="Image" size={size} className="text-purple-500" />;
    }
    if (type === 'application/pdf') {
        return <Icon name="FileText" size={size} className="text-red-400" />;
    }
    return <Icon name="File" size={size} className="text-gray-400" />;
};

/**
 * ファイルリストの個別アイテム
 */
export const FileItem: React.FC<FileItemProps> = ({
    file,
    index,
    isDragging,
    onDelete,
    onDragStart,
    onDragOver,
    onDrop,
}) => {
    const isImage = isImageFile(file.file);

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={(e) => onDragOver(e)}
            onDrop={(e) => onDrop(e, index)}
            className={`flex items-center p-2 bg-white rounded-lg border shadow-sm draggable-item select-none ${isDragging
                ? 'opacity-50 ring-2 ring-blue-400'
                : 'hover:border-blue-300'
                }`}
        >
            {/* ドラッグハンドル */}
            <div className="w-6 flex items-center justify-center cursor-grab active:cursor-grabbing text-gray-300 mr-2">
                <Icon name="DragHeight" size={20} />
            </div>

            {/* サムネイル */}
            <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0 mr-3 border relative">
                {isImage ? (
                    <img
                        src={file.preview}
                        alt=""
                        className="w-full h-full object-cover pointer-events-none"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <FileTypeIcon type={file.file.type} />
                    </div>
                )}
            </div>

            {/* ファイル情報 */}
            <div className="flex-1 min-w-0 pointer-events-none">
                <p className="text-sm font-bold text-gray-800 truncate">
                    {file.file.name}
                </p>
                <div className="flex gap-2 text-xs text-gray-400 mt-0.5">
                    <span>{formatSize(file.file.size)}</span>
                    <span>{formatDate(file.file.lastModified)}</span>
                </div>
            </div>

            {/* 削除ボタン */}
            <button
                onClick={() => onDelete(file.id)}
                className="p-2 text-gray-300 hover:text-red-500 rounded-full hover:bg-red-50 transition"
            >
                <Icon name="Trash2" size={20} />
            </button>
        </div>
    );
};
