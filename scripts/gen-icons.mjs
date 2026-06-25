import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SRC  = path.join(ROOT, 'assets', 'logo-source.png.png');
const OUT  = path.join(ROOT, 'assets');

async function main() {
  const meta = await sharp(SRC).metadata();
  const W = meta.width;
  const H = meta.height;
  console.log(`Source: ${W}×${H}`);

  // Sample background color from a corner pixel of the source
  const cornerBuf = await sharp(SRC)
    .extract({ left: 4, top: 4, width: 1, height: 1 })
    .raw()
    .toBuffer();
  const BG = { r: cornerBuf[0], g: cornerBuf[1], b: cornerBuf[2], alpha: 1 };
  console.log(`BG color: rgb(${BG.r}, ${BG.g}, ${BG.b})`);

  // ── Crop regions (percentage of source) ──────────────────────────────────
  // Hat + text block (full logo, trim excess dark border)
  const logoL = Math.round(W * 0.17);
  const logoT = Math.round(H * 0.12);
  const logoR = Math.round(W * 0.83);
  const logoB = Math.round(H * 0.84);
  const logoW = logoR - logoL;
  const logoH = logoB - logoT;

  // Hat only (no text — stop just below the brim)
  const hatL = Math.round(W * 0.31);
  const hatT = Math.round(H * 0.12);
  const hatR = Math.round(W * 0.69);
  const hatB = Math.round(H * 0.63);
  const hatW = hatR - hatL;
  const hatH = hatB - hatT;

  // ── 1. icon.png — 1024×1024, logo+text, uniform padding ─────────────────
  const ICON = 1024;
  const iconPad = Math.round(ICON * 0.07);   // 7% padding each side
  const iconInner = ICON - iconPad * 2;

  // scale the logo crop to fit inside the padded area
  const logoScale = Math.min(iconInner / logoW, iconInner / logoH);
  const scaledLogoW = Math.round(logoW * logoScale);
  const scaledLogoH = Math.round(logoH * logoScale);
  const logoOffX = Math.round((ICON - scaledLogoW) / 2);
  const logoOffY = Math.round((ICON - scaledLogoH) / 2);

  const logoCrop = await sharp(SRC)
    .extract({ left: logoL, top: logoT, width: logoW, height: logoH })
    .resize(scaledLogoW, scaledLogoH)
    .toBuffer();

  await sharp({
    create: { width: ICON, height: ICON, channels: 4, background: BG },
  })
    .composite([{ input: logoCrop, left: logoOffX, top: logoOffY }])
    .png()
    .toFile(path.join(OUT, 'icon.png'));
  console.log('✓ icon.png');

  // ── 2. adaptive-icon.png — 1024×1024, hat only, centered ─────────────────
  const ADI = 1024;
  const adiPad = Math.round(ADI * 0.12);    // 12% breathing room
  const adiInner = ADI - adiPad * 2;

  const hatScale = Math.min(adiInner / hatW, adiInner / hatH);
  const scaledHatW = Math.round(hatW * hatScale);
  const scaledHatH = Math.round(hatH * hatScale);
  const hatOffX = Math.round((ADI - scaledHatW) / 2);
  const hatOffY = Math.round((ADI - scaledHatH) / 2);

  const hatCrop = await sharp(SRC)
    .extract({ left: hatL, top: hatT, width: hatW, height: hatH })
    .resize(scaledHatW, scaledHatH)
    .toBuffer();

  await sharp({
    create: { width: ADI, height: ADI, channels: 4, background: BG },
  })
    .composite([{ input: hatCrop, left: hatOffX, top: hatOffY }])
    .png()
    .toFile(path.join(OUT, 'adaptive-icon.png'));
  console.log('✓ adaptive-icon.png');

  // ── 3. splash.png — 2048×2048, full logo centered on dark bg ─────────────
  const SPL = 2048;
  const splPad = Math.round(SPL * 0.14);    // comfortable margins
  const splInner = SPL - splPad * 2;

  const splLogoScale = Math.min(splInner / logoW, splInner / logoH);
  const scaledSplW = Math.round(logoW * splLogoScale);
  const scaledSplH = Math.round(logoH * splLogoScale);
  const splOffX = Math.round((SPL - scaledSplW) / 2);
  const splOffY = Math.round((SPL - scaledSplH) / 2);

  const splLogoCrop = await sharp(SRC)
    .extract({ left: logoL, top: logoT, width: logoW, height: logoH })
    .resize(scaledSplW, scaledSplH)
    .toBuffer();

  await sharp({
    create: { width: SPL, height: SPL, channels: 4, background: BG },
  })
    .composite([{ input: splLogoCrop, left: splOffX, top: splOffY }])
    .png()
    .toFile(path.join(OUT, 'splash.png'));
  console.log('✓ splash.png');
}

main().catch(console.error);
