-- DropForeignKey
ALTER TABLE "public"."order_items" DROP CONSTRAINT "order_items_itemId_fkey";

-- AlterTable
ALTER TABLE "public"."order_items" ADD COLUMN     "menuItemId" TEXT,
ALTER COLUMN "itemId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "order_items_menuItemId_idx" ON "public"."order_items"("menuItemId");

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "public"."menu_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
