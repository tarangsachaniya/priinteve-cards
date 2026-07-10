import { ShoppingBag } from "lucide-react";

import { cn } from "@/lib/utils";
import { SafeImage } from "@/components/card/safe-image";
import { MotionItem, MotionSection } from "@/components/card/motion-section";
import type { ProductItem } from "@/lib/card-sections";

function formatPrice(price: number | undefined, currency: string) {
  if (price === undefined) return null;
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(price);
  } catch {
    return `${currency} ${price}`;
  }
}

export function ProductsSection({ products, flat }: { products: ProductItem[]; flat?: boolean }) {
  if (products.length === 0) return null;

  return (
    <div className="flex w-full flex-col gap-2">
      <h3 className="px-1 text-sm font-semibold text-foreground/90">Products</h3>
      <MotionSection stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {products.map((product, i) => (
          <MotionItem
            key={i}
            className={cn(
              "flex flex-col gap-1.5 overflow-hidden rounded-xl p-2.5 text-sm",
              flat ? "bg-muted/50" : "bg-card/60 shadow-sm ring-1 ring-foreground/10 backdrop-blur-md"
            )}
          >
            <SafeImage
              src={product.image || null}
              alt={product.title}
              className="aspect-square w-full rounded-lg object-cover"
              fallback={
                <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-muted">
                  <ShoppingBag className="size-6 text-muted-foreground" />
                </div>
              }
            />
            <span className="font-medium leading-snug">{product.title}</span>
            {formatPrice(product.price, product.currency) && (
              <span className="text-xs font-semibold" style={{ color: "var(--brand)" }}>
                {formatPrice(product.price, product.currency)}
              </span>
            )}
            {product.buyUrl && (
              <a
                href={product.buyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium text-white transition-transform hover:scale-105"
                style={{ backgroundColor: "var(--brand)" }}
              >
                Buy Now
              </a>
            )}
          </MotionItem>
        ))}
      </MotionSection>
    </div>
  );
}
