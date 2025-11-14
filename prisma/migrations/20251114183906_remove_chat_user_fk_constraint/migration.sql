/*
  Warnings:

  - Made the column `userId` on table `chat` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."chat" DROP CONSTRAINT "chat_userId_fkey";

-- AlterTable
ALTER TABLE "chat" ALTER COLUMN "userId" SET NOT NULL;
