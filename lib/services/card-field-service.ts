import { db } from "@/lib/db";
import { revalidateUserCard } from "@/lib/revalidate-card";
import { sanitizeRichTextServer } from "@/lib/sanitize-html";
import { getFieldUsage } from "@/lib/plan-limits";
import { STRUCTURED_FIELD_TYPES, parseAndValidateStructuredValue } from "@/lib/validations/card-field";

export type ServiceResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

type CardFieldRow = {
  id: string;
  fieldType: string;
  label: string;
  value: string;
  order: number;
  isVisible: boolean;
};

function normalizeValue(fieldType: string, rawValue: string): string {
  if (fieldType === "bio") return sanitizeRichTextServer(rawValue);
  if (fieldType === "custom_html") return sanitizeRichTextServer(rawValue, { allowCustomHtmlTags: true });
  if (STRUCTURED_FIELD_TYPES.has(fieldType)) return parseAndValidateStructuredValue(fieldType, rawValue);
  return rawValue;
}

export async function createCardFieldForUser(
  userId: string,
  input: { fieldType: string; label: string; value: string },
  options?: { bypassLimit?: boolean }
): Promise<ServiceResult<CardFieldRow>> {
  if (!options?.bypassLimit) {
    const { count, max } = await getFieldUsage(userId);
    if (count >= max) {
      return { ok: false, status: 400, error: "Field limit reached for your plan" };
    }
  }

  let value: string;
  try {
    value = normalizeValue(input.fieldType, input.value);
  } catch {
    return { ok: false, status: 400, error: "Invalid value for field type" };
  }

  const last = await db.cardField.findFirst({
    where: { userId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const field = await db.cardField.create({
    data: { userId, fieldType: input.fieldType, label: input.label, value, order: (last?.order ?? -1) + 1 },
  });

  await revalidateUserCard(userId);
  return { ok: true, data: field };
}

export async function updateCardFieldForUser(
  userId: string,
  fieldId: string,
  input: { label: string; value: string }
): Promise<ServiceResult<CardFieldRow>> {
  const field = await db.cardField.findUnique({ where: { id: fieldId } });
  if (!field || field.userId !== userId) {
    return { ok: false, status: 404, error: "Not found" };
  }

  let value: string;
  try {
    value = normalizeValue(field.fieldType, input.value);
  } catch {
    return { ok: false, status: 400, error: "Invalid value for field type" };
  }

  const updated = await db.cardField.update({ where: { id: fieldId }, data: { label: input.label, value } });
  await revalidateUserCard(userId);
  return { ok: true, data: updated };
}

export async function deleteCardFieldForUser(userId: string, fieldId: string): Promise<ServiceResult<null>> {
  const field = await db.cardField.findUnique({ where: { id: fieldId } });
  if (!field || field.userId !== userId) {
    return { ok: false, status: 404, error: "Not found" };
  }

  await db.cardField.delete({ where: { id: fieldId } });
  await revalidateUserCard(userId);
  return { ok: true, data: null };
}

export async function setCardFieldVisibilityForUser(
  userId: string,
  fieldId: string,
  isVisible: boolean
): Promise<ServiceResult<CardFieldRow>> {
  const field = await db.cardField.findUnique({ where: { id: fieldId } });
  if (!field || field.userId !== userId) {
    return { ok: false, status: 404, error: "Not found" };
  }

  const updated = await db.cardField.update({ where: { id: fieldId }, data: { isVisible } });
  await revalidateUserCard(userId);
  return { ok: true, data: updated };
}
