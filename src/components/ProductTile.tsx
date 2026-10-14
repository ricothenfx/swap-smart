import type { ReactElement } from "react"
import type { Category, Product } from "../engine"

const CATEGORY_SLUG: Record<Category, string> = {
  "Dairy & Eggs": "dairy",
  "Bread & Bakery": "bakery",
  "Fruits & Vegetables": "produce",
  Pantry: "pantry",
  Drinks: "drinks",
  "Snacks & Sweets": "snacks",
  "Meat & Fish": "meat",
  Frozen: "frozen",
  Household: "household",
  "Personal Care": "care",
  Baby: "baby",
  Pet: "pet",
}

const SUBCATEGORY_ACCENT: Record<string, string> = {
  "Milk & Drinks": "sky",
  Yogurt: "teal",
  "Butter & Spread": "amber",
  Cheese: "lime",
  Eggs: "violet",
  Cream: "fuchsia",
  Bread: "amber",
  Toast: "slate",
  Rolls: "lime",
  Pastry: "rose",
  Fruit: "lime",
  Vegetables: "teal",
  Baking: "amber",
  Oil: "lime",
  Pasta: "violet",
  "Rice & Grains": "fuchsia",
  Sauce: "rose",
  Spices: "sky",
  Water: "sky",
  Juice: "amber",
  "Soft Drinks": "fuchsia",
  "Coffee & Tea": "violet",
  "Ice Cream": "fuchsia",
  "Frozen Pizza": "violet",
  "Frozen Fruit": "lime",
  "Frozen Vegetables": "teal",
  Cleaning: "sky",
  Paper: "slate",
  Waste: "violet",
  Misc: "teal",
  "Oral Care": "sky",
  "Hair Care": "violet",
  "Body Care": "rose",
  Diapers: "sky",
  Formula: "amber",
  Wipes: "violet",
  Cat: "violet",
  Dog: "amber",
  Meat: "rose",
  Fish: "sky",
  "Plant-Based": "lime",
}

const GLYPHS: Record<Category, ReactElement> = {
  "Dairy & Eggs": (
    <>
      <path d="M7.5 9.5 9.5 4.5h5l2 5V19a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 7.5 19V9.5Z" />
      <path d="M7.5 9.5h9" />
      <path d="M12 9.5V20.5" />
    </>
  ),
  "Bread & Bakery": (
    <>
      <path d="M5 12.5C5 9 8 6.5 12 6.5s7 2.5 7 6v4A2.5 2.5 0 0 1 16.5 19h-9A2.5 2.5 0 0 1 5 16.5v-4Z" />
      <path d="M9.5 10.5 8.5 13" />
      <path d="M14.5 10.5 13.5 13" />
    </>
  ),
  "Fruits & Vegetables": (
    <>
      <path d="M12 8.5C8.5 6.5 5 8.5 5 12.5c0 3.5 3 7.5 7 7.5s7-4 7-7.5c0-4-3.5-6-7-4Z" />
      <path d="M12 8.5c-.2-2 .8-3.5 2.5-4" />
    </>
  ),
  Pantry: (
    <>
      <path d="M6.5 7.5h11V18A2.5 2.5 0 0 1 15 20.5H9A2.5 2.5 0 0 1 6.5 18V7.5Z" />
      <path d="M5.5 4.5h13v3h-13z" />
      <path d="M9.5 12.5h5" />
    </>
  ),
  Drinks: (
    <>
      <path d="M7 8h10l-1.3 11.4a1.5 1.5 0 0 1-1.5 1.3H9.8a1.5 1.5 0 0 1-1.5-1.3L7 8Z" />
      <path d="M13.5 8 15 3h3" />
      <path d="M7.6 12.5h8.8" />
    </>
  ),
  "Snacks & Sweets": (
    <>
      <rect x="6.5" y="3.5" width="11" height="17" rx="1.5" />
      <path d="M6.5 9.2h11" />
      <path d="M6.5 14.9h11" />
      <path d="M12 3.5v17" />
    </>
  ),
  "Meat & Fish": (
    <>
      <path d="M6 12c1.8-3 4.5-4.5 7.5-4.5 2.8 0 5 2 5 4.5s-2.2 4.5-5 4.5c-3 0-5.7-1.5-7.5-4.5Z" />
      <path d="m6 12-3-3.5v7L6 12" />
      <circle cx="14.5" cy="10.8" r="0.4" fill="currentColor" />
    </>
  ),
  Frozen: (
    <>
      <path d="M12 3v18" />
      <path d="m4.2 7.5 15.6 9" />
      <path d="M19.8 7.5l-15.6 9" />
    </>
  ),
  Household: (
    <>
      <path d="M5 7h14l-1.5 12.5a2 2 0 0 1-2 1.5h-7a2 2 0 0 1-2-1.5L5 7Z" />
      <path d="M8 7a4 4 0 0 1 8 0" />
    </>
  ),
  "Personal Care": (
    <>
      <path d="M9.5 21h5.5v-8.5a2 2 0 0 0-2-2h-1.5a2 2 0 0 0-2 2V21Z" />
      <path d="M11.8 10.5v-3" />
      <path d="M11.8 5h3.5l1.2-1.5" />
    </>
  ),
  Baby: (
    <>
      <path d="M10.7 5.5h3c0-2-3-2-3 0Z" />
      <path d="M10.2 5.5h4v2h-4z" />
      <path d="M9.5 7.5h5.5l1 2V19a2 2 0 0 1-2 2h-3.5a2 2 0 0 1-2-2V9.5l1-2Z" />
      <path d="M9 13.5h7" />
    </>
  ),
  Pet: (
    <>
      <circle cx="7" cy="10" r="1.9" />
      <circle cx="17" cy="10" r="1.9" />
      <circle cx="10.2" cy="6.3" r="1.9" />
      <circle cx="13.8" cy="6.3" r="1.9" />
      <path d="M12 12.5c-2.9 0-5.5 2-5.5 4.4 0 1.5 1.2 2.6 2.7 2.6.9 0 1.9-.5 2.8-.5s1.9.5 2.8.5c1.5 0 2.7-1.1 2.7-2.6 0-2.4-2.6-4.4-5.5-4.4Z" />
    </>
  ),
}

const TILE_PX = { xs: 22, sm: 30, md: 40, lg: 56 } as const
const DOT_PX = { xs: 0, sm: 9, md: 11, lg: 14 } as const

export function ProductTile({
  product,
  size = "md",
  accent = true,
  className = "",
}: {
  product: Product
  size?: keyof typeof TILE_PX
  accent?: boolean
  className?: string
}) {
  const slug = CATEGORY_SLUG[product.category]
  const hue = SUBCATEGORY_ACCENT[product.subcategory] ?? "slate"
  const px = TILE_PX[size]
  const glyph = Math.round(px * 0.58)
  return (
    <span
      aria-hidden="true"
      className={
        "relative inline-grid shrink-0 place-items-center " +
        (px >= 40 ? "rounded-xl " : "rounded-lg ") +
        className
      }
      style={{ width: px, height: px, background: `var(--cat-${slug}-soft)`, color: `var(--cat-${slug})` }}
    >
      <svg
        width={glyph}
        height={glyph}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {GLYPHS[product.category]}
      </svg>
      {accent && (
        <span
          className="absolute right-[2px] bottom-[2px] rounded-full"
          style={{
            width: DOT_PX[size],
            height: DOT_PX[size],
            background: `var(--acc-${hue})`,
            boxShadow: "0 0 0 2px var(--surface)",
          }}
        />
      )}
    </span>
  )
}
