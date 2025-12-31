import { jsPDF } from 'jspdf';
import { KINDLE_SIZES } from '../constants';
import type { ManagedFile, PdfOptions, ProgressCallback } from '../types';

/**
 * 画像をKindle用PDFに変換するプロセッサクラス
 *
 * @example
 * ```typescript
 * const processor = new PdfProcessor();
 * const pdf = await processor.process(files, options, (progress, status) => {
 *   console.log(`${progress}%: ${status}`);
 * });
 * pdf.save('output.pdf');
 * ```
 */
export class PdfProcessor {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor() {
        this.canvas = document.createElement('canvas');
        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Canvas 2D context is not supported');
        }
        this.ctx = ctx;
    }

    /**
     * 画像ファイル配列をPDFに変換
     * @param files - 変換対象のManagedFile配列
     * @param options - PDF変換オプション
     * @param onProgress - 進捗コールバック
     * @returns 生成されたjsPDFインスタンス
     */
    async process(
        files: ManagedFile[],
        options: PdfOptions,
        onProgress: ProgressCallback
    ): Promise<jsPDF> {
        const sizeConfig = options.resizeType !== 'none' ? KINDLE_SIZES[options.resizeType] : null;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: sizeConfig ? [sizeConfig.width, sizeConfig.height] : undefined,
        });

        // 最初の空白ページを削除
        doc.deletePage(1);

        for (let i = 0; i < files.length; i++) {
            const managedFile = files[i];
            onProgress(
                Math.round((i / files.length) * 100),
                `処理中: ${managedFile.file.name}`
            );

            const img = await this.loadImage(managedFile.file);
            const { width, height } = this.calculateDimensions(img, options);

            this.drawToCanvas(img, width, height);

            if (options.grayscale) {
                this.applyGrayscale(options.highContrast);
            }

            const imgData = this.canvas.toDataURL('image/jpeg', options.quality);
            doc.addPage([width, height], height > width ? 'p' : 'l');
            doc.addImage(imgData, 'JPEG', 0, 0, width, height);
        }

        onProgress(100, 'PDF生成完了');
        return doc;
    }

    /**
     * ファイルから画像を読み込む
     */
    private loadImage(file: File): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const image = new Image();
                image.onload = () => resolve(image);
                image.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
                image.src = e.target?.result as string;
            };
            reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
            reader.readAsDataURL(file);
        });
    }

    /**
     * リサイズ後の寸法を計算
     */
    private calculateDimensions(
        img: HTMLImageElement,
        options: PdfOptions
    ): { width: number; height: number } {
        if (options.resizeType !== 'none') {
            const sizeConfig = KINDLE_SIZES[options.resizeType];
            const scale = sizeConfig.width / img.width;
            return { width: sizeConfig.width, height: Math.round(img.height * scale) };
        }
        return { width: img.width, height: img.height };
    }

    /**
     * 画像をCanvasに描画
     */
    private drawToCanvas(
        img: HTMLImageElement,
        width: number,
        height: number
    ): void {
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx.drawImage(img, 0, 0, width, height);
    }

    /**
     * グレースケール変換を適用
     */
    private applyGrayscale(highContrast: boolean): void {
        const imageData = this.ctx.getImageData(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            // 人間の目の感度に基づいた加重平均
            let value = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

            if (highContrast) {
                // コントラスト強調: 中間値(128)を基準に1.2倍に拡大
                value = (value - 128) * 1.2 + 128;
                value = Math.max(0, Math.min(255, value));
            }

            data[i] = value;
            data[i + 1] = value;
            data[i + 2] = value;
        }

        this.ctx.putImageData(imageData, 0, 0);
    }
}
