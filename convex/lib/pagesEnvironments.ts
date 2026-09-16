export interface PagesDeployment {
  environment?: string;
  id?: string;
  status?: string;
  url?: string;
}

export interface PagesEnvironments {
  previewUrl?: string;
  productionUrl?: string;
}

export const pagesEnvironmentsFrom = (
  rows: readonly PagesDeployment[]
): PagesEnvironments => {
  let previewUrl: string | undefined;
  let productionUrl: string | undefined;
  for (const row of rows) {
    if (!row.url) {
      continue;
    }
    if (row.environment === "preview" && !previewUrl) {
      previewUrl = row.url;
    }
    if (row.environment === "production" && !productionUrl) {
      productionUrl = row.url;
    }
  }
  return { previewUrl, productionUrl };
};
