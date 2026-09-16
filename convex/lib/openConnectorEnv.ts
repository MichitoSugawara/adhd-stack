export const isOpenConnectorConfigured = (): boolean => {
  const base = process.env.OPENCONNECTOR_BASE_URL?.trim();
  const token = process.env.OPENCONNECTOR_ADMIN_TOKEN?.trim();
  return Boolean(base && token);
};
