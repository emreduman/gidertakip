-- AlterTable
ALTER TABLE "ExpenseForm" ADD COLUMN     "infoVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "receiptsDelivered" BOOLEAN NOT NULL DEFAULT false;
