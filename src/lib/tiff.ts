import UTIF from 'utif';

// Decode one page at a time so a multipage scan does not retain all RGBA buffers.
export function* decodeTiff(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  const little = bytes[0] === 73 && bytes[1] === 73;
  const big = bytes[0] === 77 && bytes[1] === 77;
  if (bytes.length < 8 || !(little || big) || new DataView(buffer).getUint16(2, little) !== 42)
    throw new Error('TIFF_INVALID');
  const pages = UTIF.decode(buffer).filter(page => page.t256 && page.t257 && !(Number(page.t254?.[0] || 0) & 1));
  if (!pages.length) throw new Error('TIFF_INVALID');
  if (pages.length > 30) throw new Error('TIFF_PAGE_LIMIT');
  for (const page of pages) {
    const compression = Number(page.t259?.[0] || 1);
    if (![1,3,4,5,6,7,8,32773].includes(compression)) throw new Error('TIFF_INVALID');
    const width = Number(page.t256[0]), height = Number(page.t257[0]);
    if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0 || width * height > 25000000)
      throw new Error('TIFF_SIZE_LIMIT');
  }
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    try {
      UTIF.decodeImage(buffer, page, pages);
      if (!page.data || !page.width || !page.height) throw new Error('TIFF_INVALID');
      const rgba = UTIF.toRGBA8(page);
      if (rgba.length !== page.width * page.height * 4) throw new Error('TIFF_INVALID');
      yield { width: page.width, height: page.height, rgba, number: i + 1, total: pages.length, orientation: Number(page.t274?.[0] || 1) };
    } finally { delete page.data; }
  }
}
