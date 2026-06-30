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
  console.log(`Source: ${W}x${H}`);

  const cornerBuf = await sharp(SRC)
    .extract({ left: 4, top: 4, width: 1, height: 1 })
    .raw()
    .toBuffer();
  const BG = { r: cornerBuf[0], g: cornerBuf[1], b: cornerBuf[2], alpha: 1 };
  console.log(`BG color: rgb(${BG.r}, ${BG.g}, ${BG.b})`);

  const logoL = Math.round(W * 0.17);
  const logoT = Math.round(H * 0.12);
  const logoR = Math.round(W * 0.83);
  const logoB = Math.round(H * 0.84);
  const logoW = logoR - logoL;
  const logoH = logoB - logoT;

  const hatL = Math.round(W * 0.31);
  const hatT = Math.round(H * 0.12);
  const hatR = Math.round(W * 0.69);
  const hatB = Math.round(H * 0.63);
  const hatW = hatR - hatL;
  const hatH = hatB - hatT;

  const ICON = 1024;
  const iconPad = Math.round(ICON * 0.07);
  const iconInner = ICON - iconPad * 2;

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
  console.log('icon.png done');

  const ADI = 1024;
  const adiPad = Math.round(ADI * 0.12);
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
  console.log('adaptive-icon.png done');

  console.log('splash.png skipped (maintained manually, not auto-generated)');
}

main().catch(console.error);
