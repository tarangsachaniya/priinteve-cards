-- CreateTable
CREATE TABLE "CardView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CardView_userId_idx" ON "CardView"("userId");

-- AddForeignKey
ALTER TABLE "CardView" ADD CONSTRAINT "CardView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
