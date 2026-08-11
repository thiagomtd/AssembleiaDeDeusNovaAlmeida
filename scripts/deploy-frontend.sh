#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

BUCKET=$(node -e "console.log(require('./infra/cdk-outputs.json').IcadnaStorageStack.FrontendBucketName)")
DIST_ID=$(node -e "console.log(require('./infra/cdk-outputs.json').IcadnaStorageStack.FrontendDistributionId)")
URL=$(node -e "console.log(require('./infra/cdk-outputs.json').IcadnaStorageStack.FrontendUrl)")

echo "Building frontend..."
npm run build -w frontend

echo "Syncing to s3://$BUCKET ..."
aws s3 sync frontend/dist "s3://$BUCKET" --delete

echo "Invalidating CloudFront distribution $DIST_ID ..."
aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths '/*' >/dev/null

echo "Done. Site: $URL"
