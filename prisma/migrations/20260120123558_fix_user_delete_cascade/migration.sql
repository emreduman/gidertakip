-- DropForeignKey
ALTER TABLE "ExpenseForm" DROP CONSTRAINT "ExpenseForm_userId_fkey";

-- AddForeignKey
ALTER TABLE "ExpenseForm" ADD CONSTRAINT "ExpenseForm_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
