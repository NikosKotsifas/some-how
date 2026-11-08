import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

const BRAIN_DIR =
  'C:\\Users\\NIKOS\\.gemini\\antigravity\\brain\\ab959eab-7502-457e-b1d9-e1312f4c930b';

const ASSET_MAP = {
  // 12 Hero 3D SOME.HOW Logo Illustrations
  'hero-01.jpg': 'somehow_black_mylar_foil_balloons_1793273302628.jpg',
  'hero-02.jpg': 'somehow_bubble_wrap_typography_horizontal_1793273342688.jpg',
  'hero-03.jpg': 'somehow_chrome_foil_1793273299129.jpg',
  'hero-04.jpg': 'somehow_bubblegum_slime_1793273316975.jpg',
  'hero-05.jpg': 'somehow_pinata_fringe_png_1793273305097.jpg',
  'hero-06.jpg': 'somehow_red_balloon_png_1793273323391.jpg',
  'hero-07.jpg': 'somehow_inflatable_pvc_1793273308172.jpg',
  'hero-08.jpg': 'somehow_gummy_cellophane_1793273328604.jpg',
  'hero-09.jpg': 'somehow_liquid_chrome_1793274973728.jpg',
  'hero-10.jpg': 'somehow_cobalt_fur_1793274992100.jpg',
  'hero-11.jpg': 'somehow_pink_plastic_1793275009134.jpg',
  'hero-12.jpg': 'somehow_rubiks_cube_1793275027258.jpg',

  // 6 Original 3D Sculptural Pop-Art Objects
  'obj-01.jpg': 'bubble_wrap_heart_1793274977184.jpg',
  'obj-02.jpg': 'crumpled_foil_ball_1793274993201.jpg',
  'obj-03.jpg': 'mylar_asterisk_star_1793275016255.jpg',
  'obj-04.jpg': 'pink_chewing_gum_x_1793275040131.jpg',
  'obj-05.jpg': 'ruby_balloon_dog_1793275084048.jpg',
  'obj-06.jpg': 'mexican_pinata_star_1793275116480.jpg',

  // 4 Authentic 3D-Presented Marketing Showcases + 4 Uncropped Full-Frame Cutouts (Holt & Tzakia Kotsifas)
  'holt-ai-01.jpg': '01_the_holt_flagship_showcase.png',
  'holt-ai-02.jpg': '02_the_holt_creative_studio_showcase.png',
  'kotsifas-ai-03.jpg': '03_kotsifas_flagship_fireplaces_showcase.png',
  'kotsifas-ai-04.jpg': '04_kotsifas_erga_outdoor_bbq_showcase.png',
  'cutout-01.png': 'cutout_01_holt_flagship.png',
  'cutout-02.png': 'cutout_02_holt_studio.png',
  'cutout-03.png': 'sf_kotsifas_tzakia.png',
  'cutout-04.png': 'sf_kotsifas_erga.png',
  'work-01.jpg': '01_the_holt_flagship_showcase.png',
  'work-02.jpg': '02_the_holt_creative_studio_showcase.png',
  'work-03.jpg': '03_kotsifas_flagship_fireplaces_showcase.png',
  'work-04.jpg': '04_kotsifas_erga_outdoor_bbq_showcase.png',

  // 6 Original Studio, Glitch & Museum Editorial Photos
  'studio-left.jpg': 'studio_concrete_vinyl_1793275000582.jpg',
  'studio-right.jpg': 'studio_chrome_sphere_hill_1793275019015.jpg',
  'glitch-bg.jpg': 'glitch_elevator_shaft_1793275044907.jpg',
  'glitch-left.jpg': 'glitch_chrome_hotdog_1793275082759.jpg',
  'glitch-right.jpg': 'glitch_cobalt_balloon_1793275116442.jpg',
  'museum-bg.jpg': 'museum_gallery_bg_1793275154805.jpg',
};

function somehowAssetsPlugin() {
  const memoryCache = new Map();

  const loadSlug = (slug) => {
    const filename = ASSET_MAP[slug];
    if (!filename) return null;
    try {
      const publicPath = path.resolve(process.cwd(), 'public', 'somehow-assets', slug);
      if (fs.existsSync(publicPath)) {
        const buf = fs.readFileSync(publicPath);
        memoryCache.set(slug, buf);
        return buf;
      }
      const fullPath = path.join(BRAIN_DIR, filename);
      if (fs.existsSync(fullPath)) {
        const buf = fs.readFileSync(fullPath);
        memoryCache.set(slug, buf);
        return buf;
      }
    } catch {}
    return null;
  };

  for (const slug of Object.keys(ASSET_MAP)) {
    loadSlug(slug);
  }

  return {
    name: 'somehow-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith('/somehow-assets/')) return next();
        const slug = req.url.replace('/somehow-assets/', '').split('?')[0];
        const buf = memoryCache.get(slug) || loadSlug(slug);
        if (buf) {
          const isPng =
            slug.endsWith('.png') ||
            (ASSET_MAP[slug] && ASSET_MAP[slug].endsWith('.png'));
          res.setHeader('Content-Type', isPng ? 'image/png' : 'image/jpeg');
          res.setHeader('Cache-Control', 'no-cache');
          res.end(buf);
          return;
        }
        next();
      });
    },
    generateBundle() {
      for (const slug of Object.keys(ASSET_MAP)) {
        const publicPath = path.resolve(process.cwd(), 'public', 'somehow-assets', slug);
        if (fs.existsSync(publicPath)) continue;
        const buf = memoryCache.get(slug) || loadSlug(slug);
        if (buf) {
          this.emitFile({
            type: 'asset',
            fileName: `somehow-assets/${slug}`,
            source: buf,
          });
        }
      }
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), somehowAssetsPlugin()],
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    host: '::',
  },
});
