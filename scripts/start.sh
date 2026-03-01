#!/bin/bash
set -e
echo "==> A sincronizar base de dados..."
npx prisma db push --accept-data-loss --skip-generate
echo "==> A iniciar Next.js..."
node_modules/.bin/next start -p ${PORT:-10000}
