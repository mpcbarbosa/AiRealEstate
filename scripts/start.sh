#!/bin/bash
set -e
echo "==> A gerar Prisma Client..."
npx prisma generate
echo "==> A sincronizar base de dados..."
npx prisma db push --accept-data-loss --skip-generate
echo "==> A fazer build..."
rm -rf .next
node_modules/.bin/next build
echo "==> A iniciar Next.js..."
exec node_modules/.bin/next start -p ${PORT:-10000}
