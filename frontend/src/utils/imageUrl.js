const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');
const legacySeedImages = {
  'premium-basmati-rice-5kg': 'basmati-rice-5kg.jpg',
  'cold-pressed-sunflower-oil-1l': 'sunflower-oil-1l.jpg',
  'assorted-tea-bags-100ct': 'assorted-tea-bags-100ct.jpg',
  'organic-rolled-oats-1kg': 'organic-rolled-oats-1kg.jpg',
  'arabica-coffee-250g': 'arabica-coffee-250g.jpg',
  'wireless-mouse': 'wireless-mouse.jpg',
  'usb-c-fast-charger': 'usb-c-fast-charger.jpg',
  'bluetooth-headphones': 'bluetooth-headphones.jpg',
  'portable-bluetooth-speaker': 'portable-bluetooth-speaker.jpg',
  'usb-c-hub-6-in-1': 'usb-c-hub-6-in-1.jpg',
  'stainless-steel-water-bottle': 'water-bottle.jpg',
  'ceramic-dinner-set': 'ceramic-dinner-set.jpg',
  'cotton-kitchen-towels-4-pack': 'cotton-kitchen-towels-4-pack.jpg',
  'non-stick-frying-pan': 'non-stick-frying-pan.jpg',
  'led-desk-lamp': 'led-desk-lamp.jpg',
  'everyday-java-guide': 'everyday-java-guide.jpg',
  'the-pocket-cookbook': 'pocket-cookbook.jpg',
  'classic-cotton-t-shirt': 'classic-cotton-t-shirt.jpg',
  'canvas-travel-backpack': 'canvas-travel-backpack.jpg',
  'everyday-baseball-cap': 'everyday-baseball-cap.jpg',
};

export default function imageUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;

  const path = value.trim();
  if (/^(https?:|blob:|data:image\/)/i.test(path)) return path;
  if (path.startsWith('//')) return null;
  const legacyImage = path.match(/^\/seed-images\/([^/]+)\.svg$/i);
  if (legacyImage && legacySeedImages[legacyImage[1]]) {
    return `/product-images/${legacySeedImages[legacyImage[1]]}`;
  }
  if (path.startsWith('/product-images/')) return path;

  return `${apiBaseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}
