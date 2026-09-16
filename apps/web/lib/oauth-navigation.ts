export const openOauthTab = (url: string): void => {
  const popup = window.open(url, "_blank");
  if (popup) {
    popup.opener = null;
    return;
  }
  window.location.assign(url);
};
