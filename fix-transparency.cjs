const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const DIR = path.join(__dirname, 'public', 'characters');

// Flood-fill from edges
async function fixTransparencyFloodFill(filePath) {
    const img = sharp(filePath);
    const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const pixels = Buffer.from(data);
    const w = info.width;
    const h = info.height;
    
    // Create a visited array
    const visited = new Uint8Array(w * h);
    const toRemove = new Uint8Array(w * h);
    
    function isBackgroundColor(idx) {
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];
        const a = pixels[idx + 3];
        if (a === 0) return true;
        
        // Checkered pattern: alternating light grey and white
        const isGrey = r >= 185 && r <= 220 && g >= 185 && g <= 220 && b >= 185 && b <= 220 && 
                       Math.abs(r - g) <= 10 && Math.abs(g - b) <= 10;
        const isWhite = r >= 235 && g >= 235 && b >= 235 && Math.abs(r - g) <= 8 && Math.abs(g - b) <= 8;
        const isLightGrey = r >= 220 && r <= 240 && g >= 220 && g <= 240 && b >= 220 && b <= 240 &&
                            Math.abs(r - g) <= 8 && Math.abs(g - b) <= 8;
        
        return isGrey || isWhite || isLightGrey;
    }
    
    // BFS flood fill from all edge pixels
    const queue = [];
    
    // Add all edge pixels to queue
    for (let x = 0; x < w; x++) {
        queue.push(x); // top row
        queue.push((h - 1) * w + x); // bottom row
    }
    for (let y = 0; y < h; y++) {
        queue.push(y * w); // left column
        queue.push(y * w + (w - 1)); // right column
    }
    
    // BFS flood fill
    while (queue.length > 0) {
        const pos = queue.shift();
        if (pos < 0 || pos >= w * h) continue;
        if (visited[pos]) continue;
        visited[pos] = 1;
        
        const idx = pos * 4;
        if (!isBackgroundColor(idx)) continue;
        
        toRemove[pos] = 1;
        
        const x = pos % w;
        const y = Math.floor(pos / w);
        
        // Add 4-connected neighbors
        if (x > 0) queue.push(pos - 1);
        if (x < w - 1) queue.push(pos + 1);
        if (y > 0) queue.push(pos - w);
        if (y < h - 1) queue.push(pos + w);
    }
    
    // Apply transparency
    let fixed = 0;
    for (let i = 0; i < w * h; i++) {
        if (toRemove[i]) {
            pixels[i * 4 + 3] = 0;
            fixed++;
        }
    }
    
    const tmpPath = filePath + '.tmp.png';
    await sharp(pixels, { raw: { width: w, height: h, channels: 4 } })
        .png()
        .toFile(tmpPath);
    
    fs.copyFileSync(tmpPath, filePath);
    fs.unlinkSync(tmpPath);
    
    console.log(`  Fixed ${path.basename(filePath)}: ${fixed} pixels made transparent`);
}

async function main() {
    const prefixes = ['electrician'];
    for (const prefix of prefixes) {
        for (let t = 0; t <= 5; t++) {
            const file = path.join(DIR, `${prefix}_t${t}.png`);
            try {
                console.log(`Processing ${path.basename(file)}...`);
                await fixTransparencyFloodFill(file);
            } catch (e) {
                console.error(`  Error: ${e.message}`);
            }
        }
    }
    console.log('Done!');
}

main();
