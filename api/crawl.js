import { robotsText, sitemapDocument } from '../scripts/seo-files.mjs'

function siteFrom(req) {
  const forwardedHost = req.headers['x-forwarded-host']
  const host = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) || req.headers.host
  const forwardedProto = req.headers['x-forwarded-proto']
  const proto = ((Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto) || 'https').split(',')[0].trim()
  return `${proto}://${host}`.replace(/\/$/, '')
}

export default async function handler(req, res) {
  const file = req.query?.file
  const site = siteFrom(req)
  const robots = file === 'robots'
  res.statusCode = 200
  res.setHeader('Content-Type', robots ? 'text/plain; charset=utf-8' : 'application/xml; charset=utf-8')
  res.end(robots ? robotsText(site) : await sitemapDocument(site, process.env))
}
