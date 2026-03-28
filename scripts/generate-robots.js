/**
 * 根据环境变量生成 robots.txt
 *
 * 使用方式:
 *   node scripts/generate-robots.js [cn|intl]
 *
 * CN 站点: shiyin.notalabs.cn
 * INTL 站点: pitch.shiyin.cyou (或未来新的国际域名)
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
    domain: 'shiyin.notalabs.cn',
    sitemapUrl: 'https://shiyin.notalabs.cn/sitemap.xml'
  },
  intl: {
    name: '国际站',
    domain: 'pitch.shiyin.cyou',
    sitemapUrl: 'https://pitch.shiyin.cyou/sitemap.xml'
  }
}

// 生成 robots.txt 内容
function generateRobotsTxt(sitemapUrl) {
  return `User-agent: *
Allow: /

# Sitemap
Sitemap: ${sitemapUrl}

# Disallow admin or private areas (if any)
# Disallow: /admin/
# Disallow: /private/

# Crawl-delay (optional, in seconds)
Crawl-delay: 1
`
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
  console.log(`🤖 为 ${site.name} (${site.domain}) 生成 robots.txt...`)

  const robotsContent = generateRobotsTxt(site.sitemapUrl)
  const robotsPath = path.join(distDir, 'robots.txt')

  // 检查 dist 目录是否存在
  if (!fs.existsSync(distDir)) {
    console.error(`❌ dist 目录不存在，请先运行构建命令`)
    process.exit(1)
  }

  // 写入 robots.txt
  fs.writeFileSync(robotsPath, robotsContent, 'utf-8')
  console.log(`✅ robots.txt 已生成: ${robotsPath}`)
  console.log(`   Sitemap: ${site.sitemapUrl}`)
}

main()
