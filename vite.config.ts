import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['icons/*.png', 'icons/icon.svg'],
          manifest: {
            name: 'UpZy - Gestão de Vendas',
            short_name: 'UpZy',
            description: 'Sistema de gestão de vendas e comissões para equipes comerciais',
            theme_color: '#10b981',
            background_color: '#09090b',
            display: 'standalone',
            orientation: 'portrait',
            scope: '/',
            start_url: '/',
            icons: [
              {
                src: '/icons/icon-72x72.png',
                sizes: '72x72',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: '/icons/icon-96x96.png',
                sizes: '96x96',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: '/icons/icon-128x128.png',
                sizes: '128x128',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: '/icons/icon-144x144.png',
                sizes: '144x144',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: '/icons/icon-152x152.png',
                sizes: '152x152',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: '/icons/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: '/icons/icon-384x384.png',
                sizes: '384x384',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: '/icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
              }
            ],
            categories: ['business', 'productivity'],
            shortcuts: [
              {
                name: 'Nova Venda',
                short_name: 'Venda',
                description: 'Registrar uma nova venda',
                url: '/?action=new-sale',
                icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }]
              }
            ]
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // 1 ano
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                urlPattern: /^https:\/\/cdn\.tailwindcss\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'tailwind-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 30 // 30 dias
                  }
                }
              },
              {
                urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'supabase-api-cache',
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 5 // 5 minutos
                  },
                  networkTimeoutSeconds: 10
                }
              },
              {
                urlPattern: /^https:\/\/api\.dicebear\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'avatar-cache',
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 7 // 7 dias
                  }
                }
              }
            ]
          },
          devOptions: {
            enabled: true,
            type: 'module'
          }
        })
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
