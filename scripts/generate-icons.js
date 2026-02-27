/**
 * Icon Generation Script
 * Converts SVG icons to PNG format using various sizes
 * 
 * Requirements: sharp package (npm install sharp)
 * Usage: node scripts/generate-icons.js
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const APPLE_SIZES = [57, 60, 72, 76, 114, 120, 144, 152, 180];

const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');

async function generateIcons() {
  console.log('🎨 Generating PWA icons...\n');

  try {
    // Read SVG files
    const iconSvg = await fs.readFile(path.join(ICONS_DIR, 'icon.svg'));
    const maskableSvg = await fs.readFile(path.join(ICONS_DIR, 'maskable-icon.svg'));
    const appleSvg = await fs.readFile(path.join(ICONS_DIR, 'apple-touch-icon.svg'));

    // Generate standard icons
    console.log('📱 Generating standard icons...');
    for (const size of ICON_SIZES) {
      await sharp(iconSvg, { density: 300 })
        .resize(size, size)
        .png()
        .toFile(path.join(ICONS_DIR, `icon-${size}x${size}.png`));
      console.log(`  ✓ icon-${size}x${size}.png`);
    }

    // Generate maskable icons
    console.log('\n🔘 Generating maskable icons...');
    for (const size of [192, 512]) {
      await sharp(maskableSvg, { density: 300 })
        .resize(size, size)
        .png()
        .toFile(path.join(ICONS_DIR, `maskable-icon-${size}x${size}.png`));
      console.log(`  ✓ maskable-icon-${size}x${size}.png`);
    }

    // Generate Apple touch icons
    console.log('\n🍎 Generating Apple touch icons...');
    for (const size of APPLE_SIZES) {
      await sharp(appleSvg, { density: 300 })
        .resize(size, size)
        .png()
        .toFile(path.join(ICONS_DIR, `apple-touch-icon-${size}x${size}.png`));
      console.log(`  ✓ apple-touch-icon-${size}x${size}.png`);
    }

    // Generate main Apple touch icon
    await sharp(appleSvg, { density: 300 })
      .resize(180, 180)
      .png()
      .toFile(path.join(ICONS_DIR, 'apple-touch-icon.png'));
    console.log('  ✓ apple-touch-icon.png');

    // Generate favicon PNGs
    console.log('\n🔖 Generating favicons...');
    const faviconSvg = await fs.readFile(path.join(ICONS_DIR, 'favicon.svg'));
    
    await sharp(faviconSvg, { density: 300 })
      .resize(32, 32)
      .png()
      .toFile(path.join(ICONS_DIR, 'icon-32x32.png'));
    console.log('  ✓ icon-32x32.png');

    await sharp(faviconSvg, { density: 300 })
      .resize(16, 16)
      .png()
      .toFile(path.join(ICONS_DIR, 'icon-16x16.png'));
    console.log('  ✓ icon-16x16.png');

    // Generate 512x512.png (used by some browsers)
    await sharp(iconSvg, { density: 300 })
      .resize(512, 512)
      .png()
      .toFile(path.join(ICONS_DIR, '512x512.png'));
    console.log('  ✓ 512x512.png');

    console.log('\n✅ All icons generated successfully!');
    console.log(`\n📁 Icons saved to: ${ICONS_DIR}`);

  } catch (error) {
    console.error('\n❌ Error generating icons:', error.message);
    console.log('\n💡 Make sure you have sharp installed:');
    console.log('   npm install --save-dev sharp');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateIcons();
}

export { generateIcons };
