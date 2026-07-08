type VcfField = {
  fieldType: string;
  value: string;
};

type VcfInput = {
  name: string;
  fields: VcfField[];
  photoBase64?: string | null;
  photoMimeType?: string | null;
};

const FIELD_TYPE_TO_VCARD_PROPERTY: Record<string, string> = {
  phone: "TEL",
  email: "EMAIL",
  company: "ORG",
  title: "TITLE",
  website: "URL",
  address: "ADR",
};

const FOLD_WIDTH = 75;

function foldVcardLine(line: string): string {
  if (line.length <= FOLD_WIDTH) return line;
  const chunks: string[] = [line.slice(0, FOLD_WIDTH)];
  for (let i = FOLD_WIDTH; i < line.length; i += FOLD_WIDTH - 1) {
    chunks.push(" " + line.slice(i, i + FOLD_WIDTH - 1));
  }
  return chunks.join("\r\n");
}

export function generateVcf({ name, fields, photoBase64, photoMimeType }: VcfInput): string {
  const lines = ["BEGIN:VCARD", "VERSION:3.0", foldVcardLine(`FN:${name}`)];

  for (const field of fields) {
    const property = FIELD_TYPE_TO_VCARD_PROPERTY[field.fieldType];
    if (property) {
      lines.push(foldVcardLine(`${property}:${field.value}`));
    }
  }

  if (photoBase64) {
    const type = (photoMimeType ?? "JPEG").toUpperCase();
    lines.push(foldVcardLine(`PHOTO;ENCODING=BASE64;TYPE=${type}:${photoBase64}`));
  }

  lines.push("END:VCARD");

  return lines.join("\r\n");
}
