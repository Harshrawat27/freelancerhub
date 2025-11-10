-- CreateTable
CREATE TABLE "asset" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "asset" ADD CONSTRAINT "asset_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
