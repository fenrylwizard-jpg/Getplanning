import fs from 'fs';
import path from 'path';
import { createCanvas, loadImage } from 'canvas';

const dir = 'C:/Users/Imam/.gemini/antigravity/scratch/worksite-tracker/public/cooking/fairies';

async function processImages() {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const img = await loadImage(filePath);
    
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      const isWhite = r >= 240 && g >= 240 && b >= 240;
      const isGrey1 = r >= 200 && r <= 215 && g >= 200 && g <= 215 && b >= 200 && b <= 215;
      const isGrey2 = r >= 220 && r <= 235 && g >= 220 && g <= 235 && b >= 220 && b <= 235;
      const isGrey3 = Math.abs(r - 204) < 10 && Math.abs(g - 204) < 10 && Math.abs(b - 204) < 10;
      
      if (isWhite || isGrey1 || isGrey2 || isGrey3) {
        data[i + 3] = 0;
      }
    }
    
    ctx.putImageData(imgData, 0, 0);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(filePath, buffer);
    console.log('Processed ' + file);
  }
}

processImages().catch(console.error);
