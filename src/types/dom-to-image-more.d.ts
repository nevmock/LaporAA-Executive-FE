declare module 'dom-to-image-more' {
  export function toSvg(node: HTMLElement, options?: any): Promise<string>;
  export function toPng(node: HTMLElement, options?: any): Promise<string>;
  export function toJpeg(node: HTMLElement, options?: any): Promise<string>;
  export function toBlob(node: HTMLElement, options?: any): Promise<Blob>;
  export function toPixelData(node: HTMLElement, options?: any): Promise<number[]>;
  
  const domToImage = {
    toSvg,
    toPng,
    toJpeg,
    toBlob,
    toPixelData
  };
  
  export default domToImage;
}
