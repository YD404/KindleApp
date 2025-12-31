import { ICON_MAP } from '../constants';

interface IconProps {
    /** アイコン名（Lucide形式またはMaterial Symbols形式） */
    name: string;
    /** アイコンサイズ（px） */
    size?: number;
    /** 追加のCSSクラス */
    className?: string;
}

/**
 * Material Symbolsアイコンコンポーネント
 *
 * @example
 * ```tsx
 * <Icon name="Download" size={24} className="text-blue-500" />
 * ```
 */
export const Icon: React.FC<IconProps> = ({
    name,
    size = 24,
    className = '',
}) => {
    const iconName = ICON_MAP[name] ?? name.toLowerCase();

    return (
        <span
            className={`material-symbols-rounded ${className}`}
            style={{ fontSize: size }}
        >
            {iconName}
        </span>
    );
};
