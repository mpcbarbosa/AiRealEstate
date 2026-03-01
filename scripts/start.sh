#!/bin/bash
set -e
echo "==> A sincronizar base de dados..."
npx prisma db push --accept-data-loss --skip-generate
echo "==> A fazer build..."
IMORADAR_BUILD=1 NODE_OPTIONS='--max-old-space-size=400' node_modules/.bin/next build
echo "==> A iniciar Next.js..."
exec node_modules/.bin/next start -p ${PORT:-10000}
