declare module 'utif' {
  interface IFD { width?: number; height?: number; data?: Uint8Array; [tag: string]: any; }
  const UTIF: {
    decode(data: ArrayBuffer): IFD[];
    decodeImage(data: ArrayBuffer, page: IFD, pages?: IFD[]): void;
    toRGBA8(page: IFD): Uint8Array;
  };
  export default UTIF;
}
