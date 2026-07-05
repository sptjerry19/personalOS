import { query, table } from "@/lib/server/db";
import type { QuickAddPreview } from "@/types";

const CATEGORY_RULES: Record<string, string[]> = {
  Food: ["an", "cafe", "coffee", "trua", "toi", "sang", "nuoc", "com", "pho", "banh"],
  Transport: ["xe", "grab", "bus", "taxi", "xang"],
  Shopping: ["mua", "shop", "market", "thi"],
  Bills: ["dien", "nuoc", "wifi", "internet", "tien nha"],
  Health: ["thuoc", "benh", "kham"],
  Entertainment: ["phim", "game", "netflix"],
};

export async function parseQuickAddInput(input: string): Promise<QuickAddPreview> {
  const text = input.trim().toLowerCase();

  if (text === "") {
    return { intent: "unknown", confidence: 0, preview: null };
  }

  const taskMatch = text.match(/^(task|todo|việc)\s*[:\-]?\s*(.+)$/u);
  if (taskMatch) {
    return {
      intent: "task",
      confidence: 0.95,
      preview: {
        title: taskMatch[2].trim(),
        status: "pending",
      },
    };
  }

  const amountMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(k|nghìn|ngan)?/u);
  if (amountMatch) {
    let amount = parseFloat(amountMatch[1].replace(",", "."));
    if (["k", "nghìn", "ngan"].includes(amountMatch[2] ?? "")) {
      amount *= 1000;
    } else if (amount < 1000) {
      amount *= 1000;
    }

    const merchant =
      text.replace(/(\d+(?:[.,]\d+)?)\s*(k|nghìn|ngan)?/u, "").trim() ||
      "Chi tieu";

    return {
      intent: "expense",
      confidence: 0.9,
      preview: {
        amount: Math.round(amount * 100) / 100,
        merchant: merchant.charAt(0).toUpperCase() + merchant.slice(1),
        category_id: (await guessCategoryId(text)) ?? undefined,
        payment_method: "cash",
      },
    };
  }

  return {
    intent: "task",
    confidence: 0.6,
    preview: {
      title: input.charAt(0).toUpperCase() + input.slice(1),
      status: "pending",
    },
  };
}

async function guessCategoryId(text: string): Promise<number | null> {
  const categoriesTable = table("expense_categories");

  for (const [categoryName, keywords] of Object.entries(CATEGORY_RULES)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      const result = await query<{ id: number }>(
        `SELECT id FROM ${categoriesTable} WHERE name = $1 LIMIT 1`,
        [categoryName]
      );
      if (result.rows[0]) return result.rows[0].id;
    }
  }

  const other = await query<{ id: number }>(
    `SELECT id FROM ${categoriesTable} WHERE name = 'Other' LIMIT 1`
  );
  return other.rows[0]?.id ?? null;
}

export async function enrichPreview(
  parsed: QuickAddPreview
): Promise<QuickAddPreview> {
  if (
    parsed.intent !== "expense" ||
    !parsed.preview?.category_id
  ) {
    return parsed;
  }

  const categoriesTable = table("expense_categories");
  const result = await query<{ id: number; name: string; icon: string; color: string }>(
    `SELECT id, name, icon, color FROM ${categoriesTable} WHERE id = $1`,
    [parsed.preview.category_id]
  );

  if (!result.rows[0]) return parsed;

  return {
    ...parsed,
    preview: {
      ...parsed.preview,
      category: result.rows[0],
    },
  };
}
