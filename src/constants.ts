import type { PdfOptions, KindleSizeType } from './types';

// Kindleデバイスのサイズ設定
export const KINDLE_SIZES: Record<Exclude<KindleSizeType, 'none'>, { width: number; height: number; label: string }> = {
    large: { width: 1272, height: 1696, label: '大 (1272×1696)' },
    medium: { width: 1072, height: 1448, label: '中 (1072×1448)' },
    small: { width: 758, height: 1024, label: '小 (758×1024)' },
};

// デフォルトのPDF変換オプション
export const DEFAULT_PDF_OPTIONS: PdfOptions = {
    grayscale: true,
    highContrast: true,
    resizeType: 'medium',
    quality: 0.6,
};

// アイコンマッピング（Lucide名 -> Material Symbols名）
export const ICON_MAP: Record<string, string> = {
    BookOpen: 'menu_book',
    UploadCloud: 'cloud_upload',
    File: 'description',
    Image: 'image',
    FileText: 'picture_as_pdf',
    Trash2: 'delete',
    Settings: 'settings',
    Download: 'download',
    Send: 'send',
    ExternalLink: 'open_in_new',
    ChevronUp: 'expand_less',
    ChevronDown: 'expand_more',
    Info: 'info',
    DragHeight: 'drag_handle',
    Menu: 'menu',
    ArrowLeft: 'arrow_back',
    ArrowRight: 'arrow_forward',
};

// Send to Kindle URL
export const SEND_TO_KINDLE_URL = 'https://www.amazon.co.jp/sendtokindle/';
