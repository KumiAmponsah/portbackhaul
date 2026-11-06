import { Helmet } from "react-helmet-async";

import { SITE_NAME, canonical } from "@/lib/domain";

interface SeoProps {
  title: string;
  description: string;
  path: string;
  /** Private app pages must never be indexed. */
  noIndex?: boolean;
  image?: string;
  type?: "website" | "article";
  jsonLd?: Record<string, unknown>;
}

export function Seo({ title, description, path, noIndex = false, image, type = "website", jsonLd }: SeoProps) {
  const url = canonical(path);
  const ogImage = image ?? canonical("/og-image.png");

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noIndex ? <meta name="robots" content="noindex, nofollow" /> : <meta name="robots" content="index, follow" />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLd ? <script type="application/ld+json">{JSON.stringify(jsonLd)}</script> : null}
    </Helmet>
  );
}
