CREATE TABLE "stored_images" (
  "id" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "index" INTEGER NOT NULL,
  "mimeType" TEXT NOT NULL DEFAULT 'image/jpeg',
  "data" BYTEA NOT NULL,
  "size" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stored_images_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "stored_images_sourceId_index_key" ON "stored_images"("sourceId", "index");
