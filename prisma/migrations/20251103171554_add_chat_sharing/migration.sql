-- AlterTable
ALTER TABLE "chat" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sharedWith" JSONB;
