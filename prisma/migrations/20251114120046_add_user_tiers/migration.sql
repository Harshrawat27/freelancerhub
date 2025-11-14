-- CreateEnum
CREATE TYPE "UserTier" AS ENUM ('FREE', 'PRO');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "storageUsed" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "userTier" "UserTier" NOT NULL DEFAULT 'FREE';
