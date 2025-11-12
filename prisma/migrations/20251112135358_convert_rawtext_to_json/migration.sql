/*
  Warnings:

  - Changed the type of `rawText` on the `chat` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "chat" DROP COLUMN "rawText",
ADD COLUMN     "rawText" JSONB NOT NULL;
