export function getCloudinaryThumbUrl(url: string, width = 120): string {
  return url.replace("/upload/", `/upload/c_thumb,w_${width}/`);
}
