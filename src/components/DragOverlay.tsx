import { Icon } from './Icon';

interface DragOverlayProps {
    /** オーバーレイを表示するか */
    isVisible: boolean;
}

/**
 * ファイルドラッグ時に表示されるオーバーレイ
 */
export const DragOverlay: React.FC<DragOverlayProps> = ({ isVisible }) => {
    if (!isVisible) return null;

    return (
        <div className="absolute inset-0 z-50 bg-blue-500 bg-opacity-20 backdrop-blur-sm flex items-center justify-center border-4 border-blue-500 border-dashed m-4 rounded-xl pointer-events-none">
            <div className="text-blue-600 font-bold text-2xl flex flex-col items-center shadow-sm p-4 bg-white rounded-xl">
                <Icon name="UploadCloud" size={48} />
                <span>ファイルをドロップして追加</span>
            </div>
        </div>
    );
};
