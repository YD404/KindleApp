/**
 * ファイル管理用の拡張ファイル型
 * 標準のFileにID（識別子）とプレビューURL（サムネイル表示用）を追加
 */
export interface ManagedFile {
    /** ファイルオブジェクト本体 */
    file: File;
    /** 一意な識別子 */
    id: string;
    /** プレビュー用のObject URL */
    preview: string;
}

/**
 * Kindleデバイスのサイズタイプ
 */
export type KindleSizeType = 'none' | 'large' | 'medium' | 'small';

/**
 * PDF変換オプション
 */
export interface PdfOptions {
    /** グレースケール変換を行うか */
    grayscale: boolean;
    /** コントラスト強調を行うか（grayscaleがtrueの場合のみ有効） */
    highContrast: boolean;
    /** Kindleサイズにリサイズ（none=リサイズなし） */
    resizeType: KindleSizeType;
    /** JPEG品質 (0.1 - 1.0) */
    quality: number;
}


/**
 * ソートモード
 */
export type SortMode =
    | 'manual'
    | 'name_asc'
    | 'name_desc'
    | 'date_asc'
    | 'date_desc'
    | 'size_asc'
    | 'size_desc';

/**
 * モバイル表示時のステップ
 */
export type MobileStep = 'upload' | 'settings';

/**
 * 進捗コールバック関数の型
 */
export type ProgressCallback = (progress: number, statusText: string) => void;
