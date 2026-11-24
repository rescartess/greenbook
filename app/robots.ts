import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: ["/", "/login"], disallow: ["/admin", "/test", "/practice", "/dev", "/english", "/math", "/auth"] },
    sitemap: "https://greenbook-alpha.vercel.app/sitemap.xml",
  };
}
