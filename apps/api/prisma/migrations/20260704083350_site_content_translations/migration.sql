-- CreateTable
CREATE TABLE "SiteContentTranslation" (
    "id" UUID NOT NULL,
    "siteContentId" UUID NOT NULL,
    "locale" "LocaleCode" NOT NULL,
    "valueJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteContentTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteContentTranslation_locale_idx" ON "SiteContentTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "SiteContentTranslation_siteContentId_locale_key" ON "SiteContentTranslation"("siteContentId", "locale");

-- AddForeignKey
ALTER TABLE "SiteContentTranslation" ADD CONSTRAINT "SiteContentTranslation_siteContentId_fkey" FOREIGN KEY ("siteContentId") REFERENCES "SiteContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
