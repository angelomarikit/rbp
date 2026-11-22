import { robotsText, sitemapDocument } from '../../scripts/seo-files.mjs'

export async function handler(event) {
  const host = event.headers['x-forwarded-host'] || event.headers.host
  const proto = (event.headers['x-forwarded-proto'] || 'https').split(',')[0].trim()
  const site = `${proto}://${host}`.replace(/\/$/, '')
  const robots = event.queryStringParameters?.file === 'robots'
  return {
    statusCode: 200,
    headers: { 'Content-Type': robots ? 'text/plain; charset=utf-8' : 'application/xml; charset=utf-8' },
    body: robots ? robotsText(site) : await sitemapDocument(site, process.env),
  }
}
