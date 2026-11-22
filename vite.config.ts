import { loadEnv, defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { robotsText, sitemapDocument } from './scripts/seo-files.mjs'

function seoFiles(): Plugin {
  let env: Record<string, string> = {}
  const handle = (req: { url?: string; headers: { host?: string } }, res: { statusCode: number; setHeader: (name: string, value: string) => void; end: (body: string) => void }, next: () => void) => {
    const path = req.url?.split('?')[0]
    if (path !== '/robots.txt' && path !== '/sitemap.xml') {
      next()
      return
    }
    const site = `http://${req.headers.host}`
    void (path === '/robots.txt' ? Promise.resolve(robotsText(site)) : sitemapDocument(site, env))
      .then((body) => {
        res.statusCode = 200
        res.setHeader('Content-Type', path === '/robots.txt' ? 'text/plain; charset=utf-8' : 'application/xml; charset=utf-8')
        res.setHeader('Cache-Control', 'public, max-age=3600')
        res.end(body)
      })
      .catch(() => {
        res.statusCode = 500
        res.end('')
      })
  }
  return {
    name: 'rbp-seo-files',
    configResolved(config) {
      env = loadEnv(config.mode, config.root, '')
    },
    configureServer(server) {
      server.middlewares.use(handle as never)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handle as never)
    },
  }
}

export default defineConfig({
  plugins: [react(), seoFiles()],
  server: {
    watch: {
      ignored: ['**/*.mp4'],
    },
  },
})
