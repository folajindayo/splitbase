import { NextResponse } from "next/server";

/**
 * Dynamic robots.txt route
 * Configures search engine crawling rules
 */
export async function GET() {
  const robotsTxt = `# SplitBase Robots.txt
# https://www.robotstxt.org/

User-agent: *
Allow: /

# Allow public pages
Allow: /$
Allow: /about
Allow: /docs
Allow: /status

# Disallow admin and API routes
Disallow: /admin/
Disallow: /api/
Disallow: /escrow/*/

# Disallow private user pages
Disallow: /dashboard
Disallow: /settings

# Sitemaps
Sitemap: ${process.env.NEXT_PUBLIC_APP_URL || "https://splitbase.app"}/sitemap.xml

# Crawl delay (optional)
# Crawl-delay: 10

# Specific bot rules
User-agent: Googlebot
Allow: /
Disallow: /api/
Disallow: /admin/

User-agent: Bingbot
Allow: /
Disallow: /api/
Disallow: /admin/

# Block problematic bots (optional)
# User-agent: BadBot
# Disallow: /
`;

  return new NextResponse(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}

