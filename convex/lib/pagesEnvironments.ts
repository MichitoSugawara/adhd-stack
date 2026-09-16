export interface PagesDeployment {
  environment?: string;
  id?: string;
  status?: string;
  url?: string;
}

export interface PagesEnvironments {
  previewUrl?: string;
  previewUrls: string[];
  productionUrl?: string;
}

const PREVIEW_URL_LIMIT = 8;

export const pagesEnvironmentsFrom = (
  rows: readonly PagesDeployment[]
): PagesEnvironments => {
  const previewUrls: string[] = [];
  const seen = new Set<string>();
  let productionUrl: string | undefined;
  for (const row of rows) {
    if (!row.url) {
      continue;
    }
    if (
      row.environment === "preview" &&
      !seen.has(row.url) &&
      previewUrls.length < PREVIEW_URL_LIMIT
    ) {
      seen.add(row.url);
      previewUrls.push(row.url);
    }
    if (row.environment === "production" && !productionUrl) {
      productionUrl = row.url;
    }
  }
  return {
    previewUrl: previewUrls[0],
    previewUrls,
    productionUrl,
  };
};
