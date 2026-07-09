export function telHref(value: string): string {
  return `tel:${value}`;
}

export function mailtoHref(value: string): string {
  return `mailto:${value}`;
}

export function waHref(value: string): string {
  return `https://wa.me/${value.replace(/[^0-9]/g, "")}`;
}
