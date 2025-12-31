import { Icon } from './Icon';
import { KINDLE_SIZES, QUALITY_OPTIONS } from '../constants';
import type { PdfOptions, KindleSizeType } from '../types';

interface SettingsPanelProps {
    /** PDF変換オプション */
    options: PdfOptions;
    /** オプション変更ハンドラ */
    onOptionsChange: (options: PdfOptions) => void;
    /** PDFファイル名 */
    pdfName: string;
    /** ファイル名変更ハンドラ */
    onPdfNameChange: (name: string) => void;
    /** 処理中フラグ */
    isProcessing: boolean;
    /** 進捗 (0-100) */
    progress: number;
    /** ステータステキスト */
    statusText: string;
    /** ファイル数 */
    fileCount: number;
    /** 変換実行 */
    onConvert: () => void;
    /** Send to Kindleを開く */
    onOpenSendToKindle: () => void;
    /** 戻るボタン（モバイル用） */
    onBack?: () => void;
}

/**
 * 設定パネルコンポーネント
 * PDF変換オプションと実行ボタンを表示
 */
export const SettingsPanel: React.FC<SettingsPanelProps> = ({
    options,
    onOptionsChange,
    pdfName,
    onPdfNameChange,
    isProcessing,
    progress,
    statusText,
    fileCount,
    onConvert,
    onOpenSendToKindle,
    onBack,
}) => {
    const updateOption = <K extends keyof PdfOptions>(
        key: K,
        value: PdfOptions[K]
    ) => {
        onOptionsChange({ ...options, [key]: value });
    };

    return (
        <div className="w-full md:w-80 bg-gray-100 border-l border-gray-200 flex flex-col flex-shrink-0 z-10 shadow-xl">
            {/* ヘッダー */}
            <div className="p-4 border-b bg-white flex items-center gap-2">
                <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Icon name="Settings" size={20} />
                    設定
                </h2>
                {onBack && (
                    <button
                        onClick={onBack}
                        className="md:hidden flex items-center gap-1 text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition ml-auto"
                    >
                        <span className="text-sm font-bold">戻る</span>
                        <Icon name="ArrowLeft" size={20} />
                    </button>
                )}
            </div>

            {/* 設定項目 */}
            <div className="p-4 space-y-4 overflow-y-auto mobile-panel relative flex-1">
                {/* ファイル名入力 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
                    <label className="block text-sm font-semibold text-gray-800 mb-1">
                        ファイル名
                    </label>
                    <div className="flex items-center">
                        <input
                            type="text"
                            value={pdfName}
                            onChange={(e) => onPdfNameChange(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500 transition"
                            placeholder="kindle_optimized"
                        />
                        <span className="text-gray-500 text-sm ml-1">.pdf</span>
                    </div>
                </div>

                {/* オプション */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* グレースケール */}
                    <label className="flex items-center justify-between p-3 border-b border-gray-100 cursor-pointer active:bg-gray-50">
                        <div>
                            <div className="text-sm font-semibold text-gray-800">
                                グレースケール
                            </div>
                            <div className="text-xs text-gray-500">Kindle用に最適化</div>
                        </div>
                        <ToggleSwitch
                            checked={options.grayscale}
                            onChange={(checked) => {
                                // グレースケールをオフにする場合、コントラスト強調も自動的にオフにする
                                if (!checked) {
                                    onOptionsChange({ ...options, grayscale: false, highContrast: false });
                                } else {
                                    updateOption('grayscale', true);
                                }
                            }}
                        />
                    </label>

                    {/* コントラスト強調 */}
                    <label
                        className={`flex items-center justify-between p-3 border-b border-gray-100 cursor-pointer active:bg-gray-50 ${!options.grayscale ? 'opacity-50 pointer-events-none' : ''
                            }`}
                    >
                        <div>
                            <div className="text-sm font-semibold text-gray-800">
                                コントラスト強調
                            </div>
                            <div className="text-xs text-gray-500">文字をくっきりさせる</div>
                        </div>
                        <ToggleSwitch
                            checked={options.highContrast}
                            onChange={(checked) => updateOption('highContrast', checked)}
                        />
                    </label>

                    {/* リサイズ */}
                    <div className="p-3">
                        <div className="text-sm font-semibold text-gray-800 mb-2">
                            リサイズ
                        </div>
                        <select
                            value={options.resizeType}
                            onChange={(e) => updateOption('resizeType', e.target.value as KindleSizeType)}
                            className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-2 text-sm focus:outline-none focus:border-blue-500 transition cursor-pointer"
                        >
                            <option value="none">リサイズなし（元のサイズ）</option>
                            <option value="large">{KINDLE_SIZES.large.label}</option>
                            <option value="medium">{KINDLE_SIZES.medium.label}</option>
                            <option value="small">{KINDLE_SIZES.small.label}</option>
                        </select>
                    </div>
                </div>

                {/* 画質選択 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
                    <div className="text-sm font-semibold text-gray-800 mb-2">
                        画質
                    </div>
                    <select
                        value={options.quality}
                        onChange={(e) => updateOption('quality', parseFloat(e.target.value))}
                        className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-2 text-sm focus:outline-none focus:border-blue-500 transition cursor-pointer"
                    >
                        {QUALITY_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* アクションボタン */}
            <div className="p-4 bg-white border-t space-y-3 mt-auto shadow-inner">
                {isProcessing ? (
                    <div className="space-y-2 py-2">
                        <div className="progress-bar">
                            <div
                                className="progress-bar__fill"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-xs text-center text-gray-500 font-mono animate-pulse">
                            {statusText}
                        </p>
                    </div>
                ) : (
                    <>
                        <button
                            onClick={onConvert}
                            disabled={fileCount === 0}
                            className="btn-primary"
                        >
                            <Icon name="Download" size={20} />
                            PDF作成
                        </button>

                        <button
                            onClick={onOpenSendToKindle}
                            className="btn-secondary"
                        >
                            <Icon name="Send" size={20} />
                            Send to Kindle
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

/**
 * トグルスイッチコンポーネント
 */
const ToggleSwitch: React.FC<{
    checked: boolean;
    onChange: (checked: boolean) => void;
}> = ({ checked, onChange }) => (
    <div
        className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-300 cursor-pointer ${checked ? 'bg-blue-600' : 'bg-gray-300'
            }`}
        onClick={() => onChange(!checked)}
    >
        <div
            className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${checked ? 'translate-x-5' : ''
                }`}
        />
    </div>
);
