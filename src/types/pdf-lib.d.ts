/**
 * Type definitions for pdf-lib
 */
declare module 'pdf-lib' {
  export class PDFDocument {
    static load(bytes: Uint8Array | ArrayBuffer | Buffer): Promise<PDFDocument>;
    getPageCount(): number;
    getPages(): PDFPage[];
    save(): Promise<Uint8Array>;
  }

  export class PDFPage {
    getWidth(): number;
    getHeight(): number;
    getMediaBox(): { x: number; y: number; width: number; height: number };
    getSize(): { width: number; height: number };
    drawImage(image: PDFImage, options?: any): void;
  }

  export class PDFImage {
    width: number;
    height: number;
  }

  export function rgb(r: number, g: number, b: number): Color;
  export function degrees(angle: number): number;

  export interface Color {
    r: number;
    g: number;
    b: number;
  }
}
