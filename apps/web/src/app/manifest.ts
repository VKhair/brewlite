import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'BrewLite — đặt đồ uống',
    short_name: 'BrewLite',
    description: 'Chọn món, đặt trước và nhận đồ uống tại quầy BrewLite.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fffaf3',
    theme_color: '#7b452f',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' }],
  };
}
