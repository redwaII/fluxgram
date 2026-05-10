import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import toIco from 'png-to-ico';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const svgPath = join(root, 'public', 'favicon.svg');

const svg = readFileSync(svgPath);

const png16 = await sharp(svg).resize(16, 16).png().toBuffer();
const png32 = await sharp(svg).resize(32, 32).png().toBuffer();
const png48 = await sharp(svg).resize(48, 48).png().toBuffer();

writeFileSync(join(root, 'public', 'favicon.png'), png32);
writeFileSync(join(root, 'public', 'favicon.ico'), await toIco([png16, png32, png48]));
