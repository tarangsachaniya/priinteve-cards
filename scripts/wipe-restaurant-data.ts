/**
 * Deletes every restaurant and everything hanging off it — menus, tables,
 * customers, orders and staff logins.
 *
 *   pnpm db:wipe:restaurant            # dry run — prints what would be deleted
 *   pnpm db:wipe:restaurant -- --yes   # actually delete
 *
 * The card product is untouched. That is not a courtesy, it is structural:
 * the restaurant module holds no foreign key into the card product's User
 * table (see the createdByAdminId comment in prisma/schema.prisma), so there
 * is nothing here that could cascade into it.
 *
 * Companion to scripts/wipe-data.ts, which does the mirror job for the card
 * side and leaves resto_* alone.
 */
import { db } from "../lib/db";

async function main() {
  const confirmed = process.argv.includes("--yes");

  const [restaurants, staff, categories, items, tables, customers, orders] = await Promise.all([
    db.restaurant.count(),
    db.restaurantUser.count(),
    db.menuCategory.count(),
    db.menuItem.count(),
    db.restaurantTable.count(),
    db.restoCustomer.count(),
    db.restoOrder.count(),
  ]);

  console.table({
    restaurants,
    staffLogins: staff,
    menuCategories: categories,
    menuItems: items,
    tables,
    customers,
    orders,
  });
  console.log("Preserved: every card-product user, plan, purchase and setting.");

  if (restaurants === 0) {
    console.log("\nNothing to delete.");
    return;
  }

  if (!confirmed) {
    console.log("\nDry run. Re-run with --yes to delete.");
    return;
  }

  // One statement is enough: every resto_* model cascades from Restaurant, and
  // the two SetNull relations (order → table, order line → menu item) point at
  // rows being deleted in the same cascade.
  const { count } = await db.restaurant.deleteMany({});

  console.log(`\nDone. Deleted ${count} restaurant${count === 1 ? "" : "s"} and all their data.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
