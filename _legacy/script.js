const { useState, useMemo, useRef, useEffect, useCallback } = React;
const { jsPDF } = window.jspdf;

// --- 定数・設定 ---
const KINDLE_WIDTH = 1072;
const KINDLE_HEIGHT = 1448;

// --- ユーティリティ関数 ---
const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ja-JP', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
    });
};

// --- Components ---

const Icon = ({ name, size = 24, className = "" }) => {
    const style = { fontSize: size };
    // Lucide -> Material Symbols Mapping
    const map = {
        'BookOpen': 'menu_book',
        'UploadCloud': 'cloud_upload',
        'File': 'description',
        'Image': 'image',
        'FileText': 'picture_as_pdf',
        'Trash2': 'delete',
        'Settings': 'settings',
        'Download': 'download',
        'Send': 'send',
        'ExternalLink': 'open_in_new',
        'ChevronUp': 'expand_less',
        'ChevronDown': 'expand_more',
        'Info': 'info',
        'DragHeight': 'drag_handle',
        'Menu': 'menu',
        'ArrowLeft': 'arrow_back',
        'ArrowRight': 'arrow_forward'
    };

    const iconName = map[name] || name.toLowerCase();

    return (
        <span className={`material-symbols-rounded ${className}`} style={style}>
            {iconName}
        </span>
    );
};

// 画像処理とPDF生成
const processImagesToPdf = async (files, options, onProgress) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: options.resize ? [KINDLE_WIDTH, KINDLE_HEIGHT] : undefined
    });

    doc.deletePage(1);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        onProgress(Math.round(((i) / files.length) * 100), `処理中: ${file.name}`);

        const img = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const image = new Image();
                image.onload = () => resolve(image);
                image.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });

        let width = img.width;
        let height = img.height;

        if (options.resize) {
            const scale = KINDLE_WIDTH / width;
            width = KINDLE_WIDTH;
            height = img.height * scale;
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        if (options.grayscale) {
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            for (let j = 0; j < data.length; j += 4) {
                const avg = 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2];
                let value = avg;
                if (options.highContrast) {
                    value = (value - 128) * 1.2 + 128;
                }
                data[j] = value;
                data[j + 1] = value;
                data[j + 2] = value;
            }
            ctx.putImageData(imageData, 0, 0);
        }

        const imgData = canvas.toDataURL('image/jpeg', options.quality);
        doc.addPage([width, height], height > width ? 'p' : 'l');
        doc.addImage(imgData, 'JPEG', 0, 0, width, height);
    }

    onProgress(100, 'PDF生成完了');
    return doc;
};

const FileIcon = ({ type }) => {
    const size = 20;
    if (type.startsWith('image/')) return <Icon name="Image" size={size} className="text-purple-500" />;
    if (type === 'application/pdf') return <Icon name="FileText" size={size} className="text-red-400" />;
    return <Icon name="File" size={size} className="text-gray-400" />;
};

const App = () => {
    const [files, setFiles] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('');
    const [pdfName, setPdfName] = useState('kindle_optimized');

    // Sort & Mobile State
    const [sortMode, setSortMode] = useState('manual');
    const [mobileStep, setMobileStep] = useState('upload'); // 'upload' | 'settings'

    const [options, setOptions] = useState({
        grayscale: true,
        highContrast: true,
        resize: true,
        quality: 0.6
    });

    const [isDraggingFile, setIsDraggingFile] = useState(false);
    const fileInputRef = useRef(null);

    // --- File Handling ---
    const addFiles = (newFilesList) => {
        const newFiles = Array.from(newFilesList).map(f => Object.assign(f, {
            id: Math.random().toString(36).substr(2, 9),
            preview: URL.createObjectURL(f)
        }));
        setFiles(prev => [...prev, ...newFiles]);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            addFiles(e.target.files);
        }
    };

    const handleDelete = (id) => {
        setFiles(files => files.filter(f => f.id !== id));
    };

    // --- Drag & Drop (File Upload) ---
    const handleDragOver = (e) => {
        e.preventDefault();
        if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
            setIsDraggingFile(true);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        if (e.relatedTarget === null || !e.currentTarget.contains(e.relatedTarget)) {
            setIsDraggingFile(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDraggingFile(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            addFiles(e.dataTransfer.files);
        }
    };

    // --- Sorting ---
    const handleSortChange = (e) => {
        const mode = e.target.value;
        setSortMode(mode);

        if (mode === 'manual') return;

        const sorted = [...files].sort((a, b) => {
            switch (mode) {
                case 'name_asc': return a.name.localeCompare(b.name, 'ja');
                case 'name_desc': return b.name.localeCompare(a.name, 'ja');
                case 'date_asc': return a.lastModified - b.lastModified;
                case 'date_desc': return b.lastModified - a.lastModified;
                case 'size_asc': return a.size - b.size;
                case 'size_desc': return b.size - a.size;
                default: return 0;
            }
        });
        setFiles(sorted);
    };

    // --- List Reordering ---
    const [draggingItemId, setDraggingItemId] = useState(null);

    const onDragStartItem = (e, index) => {
        setDraggingItemId(files[index].id);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", index);
    };

    const onDragOverItem = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const onDropItem = (e, dropIndex) => {
        e.preventDefault();
        const dragIndexStr = e.dataTransfer.getData("text/plain");
        if (!dragIndexStr) return;
        const dragIndex = parseInt(dragIndexStr, 10);

        if (dragIndex === dropIndex) return;

        const newFiles = [...files];
        const [removed] = newFiles.splice(dragIndex, 1);
        newFiles.splice(dropIndex, 0, removed);

        setFiles(newFiles);
        setDraggingItemId(null);
        setSortMode('manual');
    };

    // --- Action ---
    const handleConvert = async () => {
        if (files.length === 0) return;
        const imageFiles = files.filter(f => f.type.startsWith('image/'));
        if (imageFiles.length === 0) {
            alert('画像ファイルが含まれていません。');
            return;
        }

        setIsProcessing(true);
        try {
            const doc = await processImagesToPdf(imageFiles, options, (prog, text) => {
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
    };

    const openSendToKindle = () => {
        window.open('https://www.amazon.co.jp/sendtokindle/', '_blank');
    };

    return (
        <div
            className="w-full h-screen flex flex-col md:flex-row overflow-hidden bg-gray-50"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Drag Overlay */}
            {isDraggingFile && (
                <div className="absolute inset-0 z-50 bg-blue-500 bg-opacity-20 backdrop-blur-sm flex items-center justify-center border-4 border-blue-500 border-dashed m-4 rounded-xl pointer-events-none">
                    <div className="text-blue-600 font-bold text-2xl flex flex-col items-center shadow-sm p-4 bg-white rounded-xl">
                        <Icon name="UploadCloud" size={48} />
                        <span>ファイルをドロップして追加</span>
                    </div>
                </div>
            )}

            {/* Main Content (Left / Top) - Upload Step */}
            <div className={`flex-1 flex-col bg-white overflow-hidden relative z-0 ${mobileStep === 'upload' ? 'flex' : 'hidden md:flex'}`}>
                {/* Header */}
                <div className="p-4 border-b bg-white flex justify-between items-center shadow-sm z-10">
                    <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Icon name="BookOpen" className="text-blue-600" />
                        Kindle PDF Maker
                    </h1>

                    {/* Mobile Next Button (Header) */}
                    {files.length > 0 && (
                        <button
                            onClick={() => setMobileStep('settings')}
                            className="md:hidden flex items-center gap-1 text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition ml-auto"
                        >
                            <span className="text-sm font-bold">次へ</span>
                            <Icon name="ArrowRight" size={20} />
                        </button>
                    )}

                    {/* PC View Upload Button - Removed as per request (use drop area or drag & drop) */}
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />
                </div>

                {/* Sort Bar */}
                <div className="px-4 py-2 border-b bg-gray-50 flex items-center gap-2">
                    <Icon name="DragHeight" size={18} className="text-gray-400" />
                    <select
                        value={sortMode}
                        onChange={handleSortChange}
                        className="bg-transparent text-sm font-medium text-gray-600 focus:outline-none cursor-pointer w-full md:w-auto"
                    >
                        <option value="manual">手動並び替え (ドラッグ)</option>
                        <option value="name_asc">名前順 (昇順)</option>
                        <option value="name_desc">名前順 (降順)</option>
                        <option value="date_asc">日付順 (古い順)</option>
                        <option value="date_desc">日付順 (新しい順)</option>
                    </select>
                    <span className="text-xs text-gray-400 ml-auto">{files.length} ファイル</span>
                </div>

                {/* File List */}
                <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 pb-24 md:pb-4">
                    {files.length === 0 && (
                        <div
                            onClick={() => fileInputRef.current.click()}
                            className="h-64 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl m-2 bg-gray-50 cursor-pointer hover:bg-gray-100 hover:border-blue-400 transition"
                        >
                            <Icon name="Image" size={48} className="text-gray-300 mb-2" />
                            <p className="font-medium">画像をここへドロップ</p>
                            <p className="text-xs mt-1">
                                <span className="md:hidden">またはタップして追加</span>
                                <span className="hidden md:inline">またはクリックして追加</span>
                            </p>
                        </div>
                    )}

                    {files.map((file, index) => (
                        <div
                            key={file.id}
                            draggable
                            onDragStart={(e) => onDragStartItem(e, index)}
                            onDragOver={(e) => onDragOverItem(e, index)}
                            onDrop={(e) => onDropItem(e, index)}
                            className={`flex items-center p-2 bg-white rounded-lg border shadow-sm draggable-item select-none ${draggingItemId === file.id ? 'opacity-50 ring-2 ring-blue-400' : 'hover:border-blue-300'}`}
                        >
                            <div className="w-6 flex items-center justify-center cursor-grab active:cursor-grabbing text-gray-300 mr-2">
                                <Icon name="DragHeight" size={20} />
                            </div>

                            <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0 mr-3 border relative">
                                {file.type.startsWith('image/') ? (
                                    <img src={file.preview} alt="" className="w-full h-full object-cover pointer-events-none" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <FileIcon type={file.type} />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0 pointer-events-none">
                                <p className="text-sm font-bold text-gray-800 truncate">{file.name}</p>
                                <div className="flex gap-2 text-xs text-gray-400 mt-0.5">
                                    <span>{formatSize(file.size)}</span>
                                    <span>{formatDate(file.lastModified)}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleDelete(file.id)}
                                className="p-2 text-gray-300 hover:text-red-500 rounded-full hover:bg-red-50 transition"
                            >
                                <Icon name="Trash2" size={20} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Mobile Floating Action Buttons - Removed as per request */}
                <div className="md:hidden absolute bottom-4 right-4 flex flex-col gap-3 z-20">
                </div>
            </div>

            {/* Sidebar / Bottom Sheet (Right / Bottom) - Settings Step */}
            <div className={`w-full md:w-80 bg-gray-100 border-l border-gray-200 flex-col flex-shrink-0 z-10 shadow-xl ${mobileStep === 'settings' ? 'flex' : 'hidden md:flex'}`}>
                {/* Header (Back button only on mobile) */}
                <div className="p-4 border-b bg-white flex items-center gap-2">
                    <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <Icon name="Settings" size={20} />
                        設定
                    </h2>
                    <button
                        onClick={() => setMobileStep('upload')}
                        className="md:hidden flex items-center gap-1 text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition ml-auto"
                    >
                        <span className="text-sm font-bold">戻る</span>
                        <Icon name="ArrowLeft" size={20} />
                    </button>
                </div>

                <div className="p-4 space-y-4 overflow-y-auto mobile-panel relative flex-1">
                    {/* Filename Input */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
                        <label className="block text-sm font-semibold text-gray-800 mb-1">ファイル名</label>
                        <div className="flex items-center">
                            <input
                                type="text"
                                value={pdfName}
                                onChange={(e) => setPdfName(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500 transition"
                                placeholder="kindle_optimized"
                            />
                            <span className="text-gray-500 text-sm ml-1">.pdf</span>
                        </div>
                    </div>

                    {/* Options */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Grayscale */}
                        <label className="flex items-center justify-between p-3 border-b border-gray-100 cursor-pointer active:bg-gray-50">
                            <div>
                                <div className="text-sm font-semibold text-gray-800">グレースケール</div>
                                <div className="text-xs text-gray-500">Kindle用に最適化</div>
                            </div>
                            <div className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-300 ${options.grayscale ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${options.grayscale ? 'translate-x-5' : ''}`}></div>
                                <input type="checkbox" className="hidden" checked={options.grayscale} onChange={e => setOptions({ ...options, grayscale: e.target.checked })} />
                            </div>
                        </label>

                        {/* High Contrast */}
                        <label className={`flex items-center justify-between p-3 border-b border-gray-100 cursor-pointer active:bg-gray-50 ${!options.grayscale ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div>
                                <div className="text-sm font-semibold text-gray-800">コントラスト強調</div>
                                <div className="text-xs text-gray-500">文字をくっきりさせる</div>
                            </div>
                            <div className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-300 ${options.highContrast ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${options.highContrast ? 'translate-x-5' : ''}`}></div>
                                <input type="checkbox" className="hidden" checked={options.highContrast} onChange={e => setOptions({ ...options, highContrast: e.target.checked })} />
                            </div>
                        </label>

                        {/* Resize */}
                        <label className="flex items-center justify-between p-3 cursor-pointer active:bg-gray-50">
                            <div>
                                <div className="text-sm font-semibold text-gray-800">リサイズ (Kindle幅)</div>
                                <div className="text-xs text-gray-500">{options.resize ? '幅1072pxに統一' : '元のサイズを維持'}</div>
                            </div>
                            <div className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-300 ${options.resize ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${options.resize ? 'translate-x-5' : ''}`}></div>
                                <input type="checkbox" className="hidden" checked={options.resize} onChange={e => setOptions({ ...options, resize: e.target.checked })} />
                            </div>
                        </label>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
                        <div className="flex justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-800">画質 (圧縮率)</span>
                            <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">{Math.round(options.quality * 100)}%</span>
                        </div>
                        <input
                            type="range" min="0.1" max="1.0" step="0.1"
                            value={options.quality}
                            onChange={e => setOptions({ ...options, quality: parseFloat(e.target.value) })}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="flex justify-between mt-1 text-xs text-gray-400 px-1">
                            <span>軽量</span>
                            <span>高画質</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-white border-t space-y-3 mt-auto shadow-inner">
                    {isProcessing ? (
                        <div className="space-y-2 py-2">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                            </div>
                            <p className="text-xs text-center text-gray-500 font-mono animate-pulse">{statusText}</p>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={handleConvert}
                                disabled={files.length === 0}
                                className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 active:bg-black text-white rounded-xl font-bold shadow-lg shadow-gray-200 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                            >
                                <Icon name="Download" size={20} />
                                PDF作成
                            </button>

                            <button
                                onClick={openSendToKindle}
                                className="w-full py-3 px-4 bg-white border border-gray-300 hover:bg-gray-50 active:bg-gray-100 text-gray-700 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm md:text-base"
                            >
                                <Icon name="Send" size={20} />
                                Send to Kindle
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
