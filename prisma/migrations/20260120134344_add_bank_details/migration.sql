-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountHolder" TEXT,
ADD COLUMN     "bankBranch" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "currency" TEXT DEFAULT 'TRY';
