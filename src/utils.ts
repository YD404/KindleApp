/**
 * バイト数を人間が読みやすい形式にフォーマット
 * @param bytes - バイト数
 * @returns フォーマットされた文字列 (例: "1.5 MB")
 */
export const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * タイムスタンプを日本語フォーマットの日付文字列に変換
 * @param timestamp - Unixタイムスタンプ（ミリ秒）
 * @returns 日本語フォーマットの日付文字列
 */
export const formatDate = (timestamp: number): string => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/**
 * ユニークIDを生成
 * @returns 9文字のランダムな英数字ID
 */
export const generateId = (): string => {
    return Math.random().toString(36).substring(2, 11);
};

/**
 * ファイルが画像かどうかを判定
 * @param file - 判定対象のファイル
 * @returns 画像ファイルの場合true
 */
export const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/');
};
