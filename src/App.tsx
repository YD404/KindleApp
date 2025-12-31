import { useState, useCallback } from 'react';
import { Icon } from './components/Icon';
import { FileList } from './components/FileList';
import { SettingsPanel } from './components/SettingsPanel';
import { DragOverlay } from './components/DragOverlay';
import { useFileManager } from './hooks/useFileManager';
import { useDragDrop } from './hooks/useDragDrop';
import { PdfProcessor } from './services/PdfProcessor';
import { DEFAULT_PDF_OPTIONS, SEND_TO_KINDLE_URL } from './constants';
import type { PdfOptions, MobileStep } from './types';
import './App.css';

/**
 * メインアプリケーションコンポーネント
 */
function App() {
  // ファイル管理
  const {
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
  } = useFileManager();

  // ドラッグ&ドロップ
  const { isDragging, handleDragOver, handleDragLeave, handleDrop } =
    useDragDrop(addFiles);

  // PDF生成状態
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [pdfName, setPdfName] = useState('kindle_optimized');
  const [options, setOptions] = useState<PdfOptions>(DEFAULT_PDF_OPTIONS);

  // モバイル画面切り替え
  const [mobileStep, setMobileStep] = useState<MobileStep>('upload');

  /**
   * PDF変換を実行
   */
  const handleConvert = useCallback(async () => {
    const imageFiles = getImageFiles();
    if (imageFiles.length === 0) {
      alert('画像ファイルが含まれていません。');
      return;
    }

    setIsProcessing(true);
    try {
      const processor = new PdfProcessor();
      const doc = await processor.process(imageFiles, options, (prog, text) => {
        setProgress(prog);
        setStatusText(text);
      });
      doc.save(`${pdfName || 'kindle_optimized'}.pdf`);
    } catch (error) {
      console.error(error);
      alert('変換中にエラーが発生しました');
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setStatusText('');
    }
  }, [getImageFiles, options, pdfName]);

  /**
   * Send to Kindleを開く
   */
  const openSendToKindle = useCallback(() => {
    window.open(SEND_TO_KINDLE_URL, '_blank', 'noopener,noreferrer');
  }, []);

  return (
    <div
      className="w-full h-screen flex flex-col md:flex-row overflow-hidden bg-gray-50"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* ドラッグオーバーレイ */}
      <DragOverlay isVisible={isDragging} />

      {/* メインコンテンツ（左側 / モバイル: アップロード画面） */}
      <div
        className={`flex-1 flex-col bg-white overflow-hidden relative z-0 ${mobileStep === 'upload' ? 'flex' : 'hidden md:flex'
          }`}
      >
        {/* ヘッダー */}
        <div className="p-4 border-b bg-white flex justify-between items-center shadow-sm z-10">
          <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Icon name="BookOpen" className="text-blue-600" />
            Kindle PDF Maker
          </h1>

          {/* モバイル用「次へ」ボタン */}
          {files.length > 0 && (
            <button
              onClick={() => setMobileStep('settings')}
              className="md:hidden flex items-center gap-1 text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition ml-auto"
            >
              <span className="text-sm font-bold">次へ</span>
              <Icon name="ArrowRight" size={20} />
            </button>
          )}

          {/* 隠しファイル入力 */}
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileInputChange}
          />
        </div>

        {/* ファイルリスト */}
        <FileList
          files={files}
          sortMode={sortMode}
          onOpenFilePicker={openFilePicker}
          onDeleteFile={removeFile}
          onSortChange={sortFiles}
          onReorderFiles={reorderFiles}
        />
      </div>

      {/* サイドバー / 設定パネル（右側 / モバイル: 設定画面） */}
      <div
        className={`${mobileStep === 'settings' ? 'flex' : 'hidden md:flex'
          }`}
      >
        <SettingsPanel
          options={options}
          onOptionsChange={setOptions}
          pdfName={pdfName}
          onPdfNameChange={setPdfName}
          isProcessing={isProcessing}
          progress={progress}
          statusText={statusText}
          fileCount={files.length}
          onConvert={handleConvert}
          onOpenSendToKindle={openSendToKindle}
          onBack={() => setMobileStep('upload')}
        />
      </div>
    </div>
  );
}

export default App;
