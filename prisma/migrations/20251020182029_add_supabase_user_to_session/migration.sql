-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "supabaseUserId" TEXT;

-- CreateIndex
CREATE INDEX "Session_supabaseUserId_idx" ON "Session"("supabaseUserId");

-- CreateIndex
CREATE INDEX "Session_shop_idx" ON "Session"("shop");
