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
  phone: "TEL;TYPE=CELL,VOICE",
  email: "EMAIL;TYPE=INTERNET",
  company: "ORG",
  title: "TITLE",
  website: "URL",
  address: "ADR;TYPE=WORK",
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

function escapeVcardValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function generateVcf({ name, fields, photoBase64, photoMimeType }: VcfInput): string {
  const lines = ["BEGIN:VCARD", "VERSION:3.0", foldVcardLine(`FN:${escapeVcardValue(name)}`)];

  for (const field of fields) {
    const property = FIELD_TYPE_TO_VCARD_PROPERTY[field.fieldType];
    if (!property) continue;

    if (field.fieldType === "address") {
      // ADR is a 7-part structured value (PO Box;Extended;Street;City;State;Postal;Country).
      // We only have one free-text address string, so it goes entirely in the "Street" slot.
      lines.push(foldVcardLine(`${property}:;;${escapeVcardValue(field.value)};;;;`));
    } else {
      lines.push(foldVcardLine(`${property}:${escapeVcardValue(field.value)}`));
    }
  }

  if (photoBase64) {
    const type = (photoMimeType ?? "JPEG").toUpperCase();
    lines.push(foldVcardLine(`PHOTO;ENCODING=BASE64;TYPE=${type}:${photoBase64}`));
  }

  lines.push("END:VCARD");

  return lines.join("\r\n");
}
