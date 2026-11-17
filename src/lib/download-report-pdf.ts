/**
 * 企业站测评报告 PDF：按结果页同一套可视化模型（report-visual-model）用 Canvas 逐页绘制，
 * 再由 pdf-writer 拼成 A4 PDF 下载。不依赖第三方库，内容超出自动分页。
 */
import { buildImagePdf, type PdfImagePage } from "@/lib/pdf-writer";
import {
  buildReportVisualModel,
  formatVisualScore,
  type VisualAssessmentInput,
  type VisualResultInput,
  type VisualScore,
  type VisualTone,
} from "@/lib/report-visual-model";

export interface ReportPdfSection {
  /** 量表名称 */
  title: string;
  subtitle?: string;
  /** 报告编号（publicId） */
  publicId?: string;
  /** 量表计分结构（scale.report），用于还原分段、维度、界值等 */
  structure?: VisualAssessmentInput | null;
  /** 服务端计分结果（report.result） */
  result?: VisualResultInput | null;
  resultSummary?: string;
  disclaimer?: string;
}

export interface ReportPdfOptions {
  siteName: string;
  companyName?: string;
  sections: ReportPdfSection[];
}

const SANS = '"PingFang SC","Microsoft YaHei","Noto Sans SC","Hiragino Sans GB",sans-serif';
const SERIF = '"Songti SC","Noto Serif SC","STSong","SimSun",serif';
const COLORS = {
  primary: "#1E4C9A",
  primaryDark: "#0F2E5F",
  primaryDeep: "#0A1E42",
  accent: "#C8161D",
  warm: "#F5EFE6",
  warmLight: "#FBF7F0",
  text: "#1A2846",
  strong: "#0F2E5F",
  muted: "#4A5A78",
  faint: "#8B96A8",
  border: "#E8ECF3",
  track: "#EDF0F5",
};
const TONE_COLORS: Record<VisualTone, string> = {
  good: "#22A879",
  mild: "#E0A528",
  moderate: "#E07B39",
  severe: "#C8161D",
  neutral: "#1E4C9A",
};
const DEFAULT_DISCLAIMER = "本结果仅供参考，不作为临床诊断依据。分数与解读根据本次真实作答计算。";

const SCALE = 2;
const PAGE_W = 794;
const PAGE_H = 1123;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_RESERVE = 56;

type Page = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  y: number;
};

export function sanitizeFilename(name: string) {
  return String(name || "").replace(/[\\/:*?"<>|\s]+/g, "_").replace(/_+/g, "_").slice(0, 60) || "report";
}

function hexAlpha(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of String(text ?? "").split(/\n/)) {
    if (!para) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const ch of para) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = ch;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
  }
  return lines.length ? lines : [""];
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function formatDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** 报告编号与结果页一致：取 publicId 末 8 位大写。 */
export function formatPdfReportNo(publicId?: string) {
  const raw = String(publicId || "").replace(/-/g, "");
  return raw ? raw.slice(-8).toUpperCase() : "—";
}

class ReportCanvas {
  pages: Page[] = [];
  page!: Page;
  private continuation = "";

  constructor(private readonly siteName: string) {
    this.newPage();
  }

  get ctx() {
    return this.page.ctx;
  }

  get y() {
    return this.page.y;
  }

  set y(value: number) {
    this.page.y = value;
  }

  newPage(continuation = "") {
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(PAGE_W * SCALE);
    canvas.height = Math.round(PAGE_H * SCALE);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("无法创建画布，请换用其它浏览器重试");
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);
    this.page = { canvas, ctx, y: MARGIN };
    this.pages.push(this.page);
    this.continuation = continuation;
    if (continuation) {
      this.text(`${this.siteName} · ${continuation}（续）`, { size: 11, color: COLORS.primary, weight: "600", lineHeight: 16 });
      this.rule(8);
    }
  }

  /** 剩余空间不足 need 时换页 */
  ensure(need: number) {
    if (this.y + need <= PAGE_H - MARGIN - FOOTER_RESERVE) return;
    this.newPage(this.continuation);
  }

  setContinuation(title: string) {
    this.continuation = title;
  }

  text(
    value: string,
    opts: { size: number; color: string; weight?: string; lineHeight?: number; gapAfter?: number; indent?: number; serif?: boolean; width?: number },
  ) {
    const { size, color, weight = "400", gapAfter = 0, indent = 0, serif = false } = opts;
    const lineHeight = opts.lineHeight ?? Math.round(size * 1.6);
    const width = (opts.width ?? CONTENT_W) - indent;
    const font = `${weight} ${size}px ${serif ? SERIF : SANS}`;
    this.ctx.font = font;
    for (const line of wrapText(this.ctx, value, width)) {
      this.ensure(lineHeight);
      const ctx = this.ctx;
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(line, MARGIN + indent, this.y);
      this.y += lineHeight;
    }
    this.y += gapAfter;
  }

  rule(gap = 12, color = COLORS.border) {
    this.ensure(gap * 2);
    const ctx = this.ctx;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(MARGIN, this.y + 0.5);
    ctx.lineTo(MARGIN + CONTENT_W, this.y + 0.5);
    ctx.stroke();
    this.y += gap;
  }

  sectionHeading(title: string) {
    this.ensure(44);
    const ctx = this.ctx;
    roundRect(ctx, MARGIN, this.y + 2, 4, 16, 2, COLORS.primary);
    ctx.font = `700 15px ${SERIF}`;
    ctx.fillStyle = COLORS.strong;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(title, MARGIN + 14, this.y);
    this.y += 28;
  }

  /** 分数条：名称 + 等级徽标 + 得分 + 分段色带 + 当前位置 + 参考界值 */
  scoreBlock(item: VisualScore, label: string, indent = 0) {
    this.ensure(92);
    const ctx = this.ctx;
    const x = MARGIN + indent;
    const w = CONTENT_W - indent;
    const color = TONE_COLORS[item.tone] || COLORS.primary;
    const level = item.level || "—";

    ctx.font = `600 11px ${SANS}`;
    const badgeW = Math.ceil(ctx.measureText(level).width) + 20;
    const badgeH = 20;
    roundRect(ctx, x + w - badgeW, this.y, badgeW, badgeH, 10, hexAlpha(color, 0.12));
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(level, x + w - badgeW / 2, this.y + badgeH / 2 + 0.5);

    ctx.font = `700 13px ${SANS}`;
    ctx.fillStyle = COLORS.strong;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const titleLines = wrapText(ctx, label, w - badgeW - 16);
    titleLines.forEach((line, index) => ctx.fillText(line, x, this.y + 2 + index * 18));
    this.y += Math.max(badgeH, titleLines.length * 18) + 6;

    ctx.font = `400 11px ${SANS}`;
    ctx.fillStyle = COLORS.muted;
    ctx.fillText(`得分 ${formatVisualScore(item.score)}  ·  分值范围 ${formatVisualScore(item.min)}–${formatVisualScore(item.max)}`, x, this.y);
    this.y += 18;

    const barH = 10;
    const span = item.max - item.min || 1;
    const toX = (value: number) => x + w * Math.min(1, Math.max(0, (value - item.min) / span));
    if (item.bands.length > 1) {
      // 分段色带：每段用对应等级的淡色
      item.bands.forEach((band) => {
        const left = toX(band.min);
        const right = toX(band.max);
        roundRect(ctx, left, this.y, Math.max(2, right - left), barH, 3, hexAlpha(TONE_COLORS[band.tone] || COLORS.primary, 0.18));
      });
    } else {
      roundRect(ctx, x, this.y, w, barH, 5, COLORS.track);
    }
    const fillW = Math.max(item.ratio > 0 ? 4 : 0, Math.round(w * item.ratio));
    if (fillW > 0) roundRect(ctx, x, this.y + 2, fillW, barH - 4, 3, color);
    for (const marker of item.markers) {
      ctx.fillStyle = "rgba(15,46,95,0.55)";
      ctx.fillRect(toX(marker.value) - 1, this.y - 3, 2, barH + 6);
    }
    // 当前位置圆点
    ctx.beginPath();
    ctx.arc(x + w * item.ratio, this.y + barH / 2, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = color;
    ctx.stroke();
    this.y += barH + 12;
  }

  radar(items: VisualScore[]) {
    if (items.length < 3) return;
    const size = 230;
    this.ensure(size + 40);
    const ctx = this.ctx;
    const cx = MARGIN + CONTENT_W / 2;
    const cy = this.y + size / 2 + 10;
    const radius = 78;
    const n = items.length;
    const pointAt = (index: number, ratio: number) => {
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / n;
      return { x: cx + Math.cos(angle) * radius * ratio, y: cy + Math.sin(angle) * radius * ratio };
    };
    ctx.lineWidth = 1;
    for (const level of [0.25, 0.5, 0.75, 1]) {
      ctx.beginPath();
      for (let i = 0; i < n; i += 1) {
        const p = pointAt(i, level);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.strokeStyle = COLORS.border;
      ctx.stroke();
    }
    for (let i = 0; i < n; i += 1) {
      const tip = pointAt(i, 1);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(tip.x, tip.y);
      ctx.strokeStyle = COLORS.border;
      ctx.stroke();
    }
    const points = items.map((item, i) => pointAt(i, Math.max(0.04, item.ratio)));
    ctx.beginPath();
    points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
    ctx.fillStyle = hexAlpha(COLORS.primary, 0.18);
    ctx.fill();
    ctx.strokeStyle = COLORS.primary;
    ctx.lineWidth = 2;
    ctx.stroke();
    items.forEach((item, i) => {
      ctx.beginPath();
      ctx.arc(points[i].x, points[i].y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = TONE_COLORS[item.tone] || COLORS.primary;
      ctx.fill();
    });
    ctx.font = `600 10px ${SANS}`;
    ctx.fillStyle = COLORS.muted;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    items.forEach((item, i) => {
      const label = pointAt(i, 1.42);
      const name = (item.label || item.title).replace(/^维度[一二三四五六七八九十\d]+[：:]\s*/, "").trim() || item.title;
      const lines: string[] = [];
      for (let j = 0; j < name.length; j += 6) lines.push(name.slice(j, j + 6));
      const startY = label.y - ((lines.length - 1) * 12) / 2;
      lines.forEach((line, li) => ctx.fillText(line, label.x, startY + li * 12));
    });
    this.y += size + 24;
  }

  footer(pageNo: number, total: number) {
    const ctx = this.pages[pageNo - 1].ctx;
    const lineY = PAGE_H - MARGIN - 18;
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(MARGIN, lineY + 0.5);
    ctx.lineTo(MARGIN + CONTENT_W, lineY + 0.5);
    ctx.stroke();
    ctx.font = `400 10px ${SANS}`;
    ctx.fillStyle = COLORS.faint;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(`${this.siteName} · 心理测评报告 · 结果仅供参考，请妥善保管`, MARGIN, lineY + 14);
    ctx.textAlign = "right";
    ctx.fillText(`${pageNo} / ${total}`, MARGIN + CONTENT_W, lineY + 14);
  }
}

function drawCover(doc: ReportCanvas, options: ReportPdfOptions, generatedAt: Date) {
  const ctx = doc.ctx;
  const bandH = 150;
  const gradient = ctx.createLinearGradient(0, 0, PAGE_W, bandH);
  gradient.addColorStop(0, COLORS.primary);
  gradient.addColorStop(1, COLORS.primaryDark);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, PAGE_W, bandH);
  ctx.beginPath();
  ctx.arc(PAGE_W - 40, -10, 120, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fill();

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = `500 11px ${SANS}`;
  ctx.fillText("YOUR PSYCHOLOGICAL BASELINE · 测评报告", MARGIN, 36);
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 26px ${SERIF}`;
  ctx.fillText(`${options.siteName} · 心理测评报告`, MARGIN, 58);
  ctx.font = `400 12px ${SANS}`;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  const meta = [
    options.companyName ? options.companyName : "",
    `生成于 ${formatDateTime(generatedAt)}`,
    `共 ${options.sections.length} 个量表`,
  ].filter(Boolean).join("  ·  ");
  ctx.fillText(meta, MARGIN, 104);
  doc.y = bandH + 28;
}

function drawScoreSection(doc: ReportCanvas, item: VisualScore, label: string, depth = 0) {
  const indent = depth * 14;
  doc.scoreBlock(item, label, indent);
  if (item.bands.length > 1 && depth === 0) {
    doc.text(
      `得分区间：${item.bands.map((band) => `${band.level}（${formatVisualScore(band.min)}–${formatVisualScore(band.max)}）`).join("；")}`,
      { size: 10.5, color: COLORS.faint, indent, gapAfter: 4 },
    );
  }
  if (item.markers.length) {
    doc.text(item.markers.map((marker) => marker.label).join("；"), { size: 10.5, color: COLORS.faint, indent, gapAfter: 4 });
  }
  if (item.intro) doc.text(`说明：${item.intro}`, { size: 11, color: COLORS.muted, indent, gapAfter: 4 });
  if (item.description) doc.text(`解读：${item.description}`, { size: 11.5, color: COLORS.text, indent, gapAfter: 4 });
  item.suggestions.forEach((tip, index) => {
    doc.text(`${index + 1}. ${tip}`, { size: 11, color: COLORS.muted, indent: indent + 10, gapAfter: 2 });
  });
  doc.y += 6;
  item.children.forEach((child) => drawScoreSection(doc, child, `子维度 · ${child.title}`, depth + 1));
}

function drawSection(doc: ReportCanvas, section: ReportPdfSection, index: number, total: number) {
  doc.setContinuation(section.title);
  // 量表抬头
  doc.ensure(90);
  const ctx = doc.ctx;
  roundRect(ctx, MARGIN, doc.y, CONTENT_W, 4, 2, COLORS.primary);
  doc.y += 16;
  doc.text(total > 1 ? `量表 ${index + 1} / ${total}` : "测评量表", { size: 11, color: COLORS.primary, weight: "600", lineHeight: 16, gapAfter: 2 });
  doc.text(section.title, { size: 20, color: COLORS.strong, weight: "700", serif: true, lineHeight: 28, gapAfter: 4 });
  if (section.subtitle) doc.text(section.subtitle, { size: 12, color: COLORS.muted, lineHeight: 18, gapAfter: 2 });
  doc.text(`报告编号 ${formatPdfReportNo(section.publicId)}`, { size: 11, color: COLORS.faint, lineHeight: 16, gapAfter: 12 });

  const model = section.result ? buildReportVisualModel(section.structure || {}, section.result) : null;
  const summary = model ? model.summary : (section.resultSummary || "").trim();
  if (summary) {
    doc.ensure(40);
    const lineCount = (() => {
      doc.ctx.font = `400 12px ${SANS}`;
      return wrapText(doc.ctx, summary, CONTENT_W - 28).length;
    })();
    const boxH = lineCount * 20 + 24;
    if (boxH < 260) {
      doc.ensure(boxH + 8);
      roundRect(doc.ctx, MARGIN, doc.y, CONTENT_W, boxH, 8, COLORS.warmLight);
      roundRect(doc.ctx, MARGIN, doc.y, 3, boxH, 1.5, COLORS.primary);
      doc.y += 12;
      doc.text(summary, { size: 12, color: COLORS.text, lineHeight: 20, indent: 16, width: CONTENT_W - 12 });
      doc.y += 20;
    } else {
      doc.text(summary, { size: 12, color: COLORS.text, lineHeight: 20, gapAfter: 12 });
    }
  }

  if (model?.kind === "score" && model.hero) {
    doc.sectionHeading("结果解读");
    drawScoreSection(doc, model.hero, "量表总分");
  } else if (model?.kind === "profile") {
    if (model.hero) {
      doc.sectionHeading(`${model.hero.title || "总分"}解读`);
      drawScoreSection(doc, model.hero, model.hero.title || "总分");
    }
    if (model.quadrants.length) {
      doc.sectionHeading("类型定位");
      model.quadrants.forEach((quadrant) => {
        doc.text(
          `${quadrant.title}：${quadrant.result}（${quadrant.x.label} ${formatVisualScore(quadrant.x.score)}，${quadrant.y.label} ${formatVisualScore(quadrant.y.score)}）`,
          { size: 12, color: COLORS.text, gapAfter: 6 },
        );
      });
    }
    if (model.radar.length >= 3) {
      doc.sectionHeading("心理画像");
      doc.radar(model.radar);
    }
    const items = model.groups.flatMap((group) => group.items);
    if (items.length) {
      doc.sectionHeading(items.length > 1 ? "各维度详解" : "结果详解");
      model.groups.forEach((group) => {
        if (group.title) doc.text(group.title, { size: 13, color: COLORS.strong, weight: "700", serif: true, gapAfter: 6 });
        group.items.forEach((item, itemIndex) => {
          drawScoreSection(doc, item, item.title);
          if (itemIndex < group.items.length - 1) doc.rule(12, "#F0EBE0");
        });
      });
    }
  } else if (model?.kind === "match" && model.match) {
    doc.sectionHeading("结果解读");
    doc.text(`你的结果：${model.match.title}`, { size: 14, color: COLORS.strong, weight: "700", serif: true, gapAfter: 6 });
    if (model.match.description) doc.text(model.match.description, { size: 12, color: COLORS.text, lineHeight: 20, gapAfter: 8 });
    model.match.suggestions.forEach((tip, i) => doc.text(`${i + 1}. ${tip}`, { size: 11, color: COLORS.muted, indent: 10, gapAfter: 2 }));
    if (model.match.shareText) doc.text(`「${model.match.shareText}」`, { size: 11, color: COLORS.primary, gapAfter: 6 });
  } else if (!summary) {
    doc.text("已成功提交本量表，详细解读请以页面结果为准。", { size: 12, color: COLORS.muted, gapAfter: 8 });
  }

  doc.y += 8;
  doc.ensure(60);
  doc.rule(10);
  doc.text(`关于本报告：${(section.disclaimer || "").trim() || DEFAULT_DISCLAIMER}`, { size: 10.5, color: COLORS.faint, lineHeight: 17 });
}

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<PdfImagePage> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("报告页面导出失败"));
          return;
        }
        blob.arrayBuffer().then(
          (buffer) => resolve({ jpeg: new Uint8Array(buffer), widthPx: canvas.width, heightPx: canvas.height }),
          reject,
        );
      },
      "image/jpeg",
      0.92,
    );
  });
}

/** 生成整份报告 PDF（每个量表从新的一页开始）。 */
export async function buildOnboardingReportPdf(options: ReportPdfOptions): Promise<Blob> {
  const sections = options.sections.filter(Boolean);
  if (!sections.length) throw new Error("暂无可下载的测评结果");
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready.catch(() => undefined);
  }
  const doc = new ReportCanvas(options.siteName || "心安 EAP");
  drawCover(doc, { ...options, sections }, new Date());
  sections.forEach((section, index) => {
    if (index > 0) doc.newPage();
    drawSection(doc, section, index, sections.length);
  });
  const total = doc.pages.length;
  doc.pages.forEach((_, i) => doc.footer(i + 1, total));
  const images: PdfImagePage[] = [];
  for (const page of doc.pages) {
    images.push(await canvasToJpeg(page.canvas));
  }
  const bytes = buildImagePdf(images);
  // buildImagePdf 用 new Uint8Array(length) 构造，底层就是普通 ArrayBuffer（非 SharedArrayBuffer）
  return new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
}

export function isWeChatBrowser() {
  return typeof navigator !== "undefined" && /MicroMessenger/i.test(navigator.userAgent || "");
}

export function saveBlobAsFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function reportPdfFilename(siteName: string, sections: ReportPdfSection[], now = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const head = sections.length === 1 ? sections[0].title : `${siteName || "心理测评"}`;
  return `${sanitizeFilename(head)}_测评报告_${stamp}.pdf`;
}

export async function downloadOnboardingReportPdf(options: ReportPdfOptions) {
  const blob = await buildOnboardingReportPdf(options);
  saveBlobAsFile(blob, reportPdfFilename(options.siteName, options.sections));
  return blob;
}
