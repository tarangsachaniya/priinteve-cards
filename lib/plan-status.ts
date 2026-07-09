export function enforceDraftInvariant<T extends { isDraft?: boolean; isActive?: boolean }>(
  data: T
): T {
  return data.isDraft === true ? { ...data, isActive: false } : data;
}
