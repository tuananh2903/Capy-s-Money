#!/usr/bin/env node
/**
 * Generate Dashboard screens on Google Stitch (project 15272842135916552597).
 * Requires: STITCH_API_KEY from https://stitch.withgoogle.com/settings
 *
 * Usage:
 *   set STITCH_API_KEY=your-key
 *   node scripts/stitch-generate-dashboard.mjs
 */
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const PROJECT_ID = "15272842135916552597";
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "docs", "design", "dashboard", "stitch-output");

const PROMPT_HOME = `Mobile dashboard home screen 390x844 for "Capy's Money" finance app. Vietnamese UI.
Soft-modern, capybara companion, NOT corporate banking. Plus Jakarta Sans. Background #FFF8F7, primary #864E5A, pink containers #FFB7C5, pill shapes 32px cards, pink shadows.
Layout:
1. Header: capybara avatar, title Capy's Money, subtitle Tài chính thảnh thơi, bell icon.
2. Total Balance Card: a beautiful pink-to-coral gradient card showing "Tổng số dư" 24.900.000 đ with an eye toggle icon.
3. Wallet switcher pills: horizontal list (Ví Cá Nhân with checkmark, Ví Nhà Chung).
4. Wallet Balance Card: Shows "Số dư ví này" (large text 12.450.000 đ), status chip "Tài chính ổn định", a divider line, and below it two columns: "Thu nhập: +25.000.000 đ" and "Đã chi tiêu: -12.550.000 đ".
5. Quote card with mascot and Vietnamese chill message.
6. Section Phân phối 6 Hũ Tài Chính: 2-column grid of 6 jar cards with progress bars and pastel colors. One jar shows Tiêu dùng nhanh coral bar, one shows Vượt hạn mức red.
7. Small FAB plus button on the bottom right (size 48x48, right: 20px, bottom: 90px) which does not cover content.
8. Bottom tab bar with 4 tabs: Trang chủ, Sổ GD, Ngân sách, Ví (no center add button).`;

const PROMPT_QUICK_ADD = `Mobile bottom sheet 390px wide for Capy's Money quick add transaction. Vietnamese. Same design system pastel pink #FFF8F7 #FFB7C5 pill shapes. Title Thêm giao dịch. Tabs Khoản chi and Khoản thu. Large amount input. Horizontal jar chips. Category grid. Date Hôm nay. Optional note. Full width pill button Lưu giao dịch gradient pink. Drag handle on top.`;

async function main() {
  const apiKey = process.env.STITCH_API_KEY;
  if (!apiKey) {
    console.error("Thiếu STITCH_API_KEY. Lấy key tại: https://stitch.withgoogle.com/settings");
    console.error("PowerShell: $env:STITCH_API_KEY=\"your-key\"; node scripts/stitch-generate-dashboard.mjs");
    process.exit(1);
  }

  let stitch;
  try {
    const mod = await import("@google/stitch-sdk");
    stitch = mod.stitch;
  } catch {
    console.error("Cài SDK: npm install @google/stitch-sdk");
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const project = stitch.project(PROJECT_ID);

  console.log("Generating Home — Dashboard...");
  const home = await project.generate(PROMPT_HOME, "MOBILE");
  const homeHtml = await home.getHtml();
  const homeImg = await home.getImage();
  writeFileSync(join(OUT_DIR, "manifest-home.json"), JSON.stringify({ screenId: home.id, html: homeHtml, image: homeImg }, null, 2));
  console.log("Home screen ID:", home.id);
  console.log("Screenshot URL:", homeImg);

  console.log("Generating Quick Add sheet...");
  const quick = await project.generate(PROMPT_QUICK_ADD, "MOBILE");
  const quickHtml = await quick.getHtml();
  const quickImg = await quick.getImage();
  writeFileSync(join(OUT_DIR, "manifest-quick-add.json"), JSON.stringify({ screenId: quick.id, html: quickHtml, image: quickImg }, null, 2));
  console.log("Quick Add screen ID:", quick.id);
  console.log("Screenshot URL:", quickImg);

  console.log("\nXong. Mở Stitch project:", `https://stitch.withgoogle.com/`);
  console.log("Project ID:", PROJECT_ID);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
