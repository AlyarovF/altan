-- CreateTable
CREATE TABLE "RegionTranslation" (
    "id" UUID NOT NULL,
    "regionId" UUID NOT NULL,
    "locale" "LocaleCode" NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "RegionTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessStepTranslation" (
    "id" UUID NOT NULL,
    "processStepId" UUID NOT NULL,
    "locale" "LocaleCode" NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,

    CONSTRAINT "ProcessStepTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteStatTranslation" (
    "id" UUID NOT NULL,
    "siteStatId" UUID NOT NULL,
    "locale" "LocaleCode" NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "SiteStatTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RegionTranslation_locale_idx" ON "RegionTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "RegionTranslation_regionId_locale_key" ON "RegionTranslation"("regionId", "locale");

-- CreateIndex
CREATE INDEX "ProcessStepTranslation_locale_idx" ON "ProcessStepTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessStepTranslation_processStepId_locale_key" ON "ProcessStepTranslation"("processStepId", "locale");

-- CreateIndex
CREATE INDEX "SiteStatTranslation_locale_idx" ON "SiteStatTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "SiteStatTranslation_siteStatId_locale_key" ON "SiteStatTranslation"("siteStatId", "locale");

-- AddForeignKey
ALTER TABLE "RegionTranslation" ADD CONSTRAINT "RegionTranslation_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessStepTranslation" ADD CONSTRAINT "ProcessStepTranslation_processStepId_fkey" FOREIGN KEY ("processStepId") REFERENCES "ProcessStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteStatTranslation" ADD CONSTRAINT "SiteStatTranslation_siteStatId_fkey" FOREIGN KEY ("siteStatId") REFERENCES "SiteStat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
