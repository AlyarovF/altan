-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'EUR', 'CNY', 'RUB', 'UZS');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "priceAmount" DECIMAL(18,2),
ADD COLUMN     "priceBasis" "Incoterm",
ADD COLUMN     "priceCurrency" "Currency",
ADD COLUMN     "priceNote" TEXT,
ADD COLUMN     "priceUnit" TEXT,
ADD COLUMN     "priceUpdatedAt" TIMESTAMP(3);
