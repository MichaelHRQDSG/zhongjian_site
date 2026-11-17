/**
 * 极简 PDF 生成：每页一张整页 JPEG（DCTDecode 直接内嵌，无需第三方库）。
 * 报告先用 Canvas 逐页绘制，再导出 JPEG 交给这里拼成 A4 PDF。
 */

export interface PdfImagePage {
  /** JPEG 原始字节（canvas.toBlob('image/jpeg') 的结果） */
  jpeg: Uint8Array;
  widthPx: number;
  heightPx: number;
}

/** A4 纵向，单位 pt */
export const A4_PAGE = { width: 595.28, height: 841.89 } as const;

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function buildImagePdf(
  pages: PdfImagePage[],
  pageSize: { width: number; height: number } = A4_PAGE,
): Uint8Array {
  if (!pages.length) throw new Error("没有可导出的页面");
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  const push = (data: Uint8Array | string) => {
    const bytes = typeof data === "string" ? encoder.encode(data) : data;
    chunks.push(bytes);
    length += bytes.length;
  };

  // 对象编号：1 目录，2 页面树，之后每页 3 个对象（页、内容流、图片）
  const pageObjectIds = pages.map((_, index) => 3 + index * 3);
  const objectCount = 2 + pages.length * 3;
  const width = formatNumber(pageSize.width);
  const height = formatNumber(pageSize.height);

  // 第二行的高位字节告诉阅读器这是二进制文件
  push("%PDF-1.4\n%âãÏÓ\n");

  const beginObject = (id: number) => {
    offsets[id] = length;
    push(`${id} 0 obj\n`);
  };

  beginObject(1);
  push("<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  beginObject(2);
  push(`<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>\nendobj\n`);

  pages.forEach((page, index) => {
    const pageId = pageObjectIds[index];
    const contentId = pageId + 1;
    const imageId = pageId + 2;
    const content = `q\n${width} 0 0 ${height} 0 0 cm\n/Im0 Do\nQ\n`;
    const contentBytes = encoder.encode(content);

    beginObject(pageId);
    push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] `
        + `/Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`,
    );

    beginObject(contentId);
    push(`<< /Length ${contentBytes.length} >>\nstream\n`);
    push(contentBytes);
    push("\nendstream\nendobj\n");

    beginObject(imageId);
    push(
      `<< /Type /XObject /Subtype /Image /Width ${Math.round(page.widthPx)} /Height ${Math.round(page.heightPx)} `
        + `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpeg.length} >>\nstream\n`,
    );
    push(page.jpeg);
    push("\nendstream\nendobj\n");
  });

  const xrefOffset = length;
  let xref = `xref\n0 ${objectCount + 1}\n0000000000 65535 f \n`;
  for (let id = 1; id <= objectCount; id += 1) {
    xref += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  push(xref);
  push(`trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  const out = new Uint8Array(length);
  let cursor = 0;
  for (const chunk of chunks) {
    out.set(chunk, cursor);
    cursor += chunk.length;
  }
  return out;
}
