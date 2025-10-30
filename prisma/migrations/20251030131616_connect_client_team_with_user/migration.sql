/*
  Warnings:

  - Added the required column `userId` to the `client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `team_member` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "client" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "team_member" ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "client" ADD CONSTRAINT "client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
