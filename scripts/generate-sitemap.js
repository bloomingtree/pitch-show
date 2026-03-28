/**
 * 根据环境变量生成 sitemap.xml
 *
 * 使用方式:
 *   node scripts/generate-sitemap.js [cn|intl]
 *
 * CN 站点: shiyin.notalabs.cn
 * INTL 站点: pitch.shiyin.cyou
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')

// 站点配置
const SITES = {
  cn: {
    name: '国内站',
    domain: 'https://shiyin.notalabs.cn',
    altDomain: 'https://pitch.shiyin.cyou',
    hreflang: 'zh-CN'
  },
  intl: {
    name: '国际站',
    domain: 'https://pitch.shiyin.cyou',
    altDomain: 'https://shiyin.notalabs.cn',
    hreflang: 'en'
  }
}

// 页面配置
const PAGES = [
  { path: '/', priority: 1.0, changefreq: 'weekly' },
  { path: '/main', priority: 0.9, changefreq: 'weekly' },
  { path: '/separate', priority: 0.9, changefreq: 'weekly' },
  { path: '/about', priority: 0.7, changefreq: 'monthly' },
  { path: '/help', priority: 0.8, changefreq: 'weekly' }
]

// 获取当前日期
function getCurrentDate() {
  return new Date().toISOString().split('T')[0]
}

// 生成 sitemap.xml 内容
function generateSitemapXml(site) {
  const today = getCurrentDate()
  const cnDomain = 'https://shiyin.notalabs.cn'
  const intlDomain = 'https://pitch.shiyin.cyou'
  const currentDomain = site.domain

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`

  PAGES.forEach(page => {
    const cnUrl = `${cnDomain}${page.path}`
    const intlUrl = `${intlDomain}${page.path}`
    const currentUrl = `${currentDomain}${page.path}`

    xml += `  <url>
    <loc>${currentUrl}</loc>
    <xhtml:link rel="alternate" hreflang="zh-CN" href="${cnUrl}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${intlUrl}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${intlUrl}"/>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`
  })

  xml += `</urlset>
`

  return xml
}

// 主函数
function main() {
  const siteType = process.argv[2] || 'cn'

  if (!SITES[siteType]) {
    console.error(`❌ 无效的站点类型: ${siteType}`)
    console.error(`   有效选项: cn, intl`)
    process.exit(1)
  }

  const site = SITES[siteType]
  console.log(`🗺️ 为 ${site.name} (${site.domain}) 生成 sitemap.xml...`)

  const sitemapContent = generateSitemapXml(site)
  const sitemapPath = path.join(distDir, 'sitemap.xml')

  // 检查 dist 目录是否存在
  if (!fs.existsSync(distDir)) {
    console.error(`❌ dist 目录不存在，请先运行构建命令`)
    process.exit(1)
  }

  // 写入 sitemap.xml
  fs.writeFileSync(sitemapPath, sitemapContent, 'utf-8')
  console.log(`✅ sitemap.xml 已生成: ${sitemapPath}`)
}

main()
