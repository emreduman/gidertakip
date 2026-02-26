-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "confidence" INTEGER,
ADD COLUMN     "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "taxAmount" DECIMAL(10,2),
ADD COLUMN     "taxRate" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "Period" ADD COLUMN     "budget" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "budget" DECIMAL(10,2);
