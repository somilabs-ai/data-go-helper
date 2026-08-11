#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "=================================================="
echo "  🚀 data-go-helper 자동 배포 프로세스 시작"
echo "  대상 계정: somilabs.ai@gmail.com"
echo "=================================================="

# 실행 권한 부여
chmod +x "$SCRIPT_DIR"/*.sh

# 1. CLI 인증 점검
"$SCRIPT_DIR/01-cli-auth-check.sh"

# 2. GitHub 저장소 생성 및 Push
"$SCRIPT_DIR/02-setup-github.sh"

# 3. Vercel 배포 및 환경변수 주입
"$SCRIPT_DIR/04-deploy-vercel.sh"

echo "=================================================="
echo "  🎉 모든 배포 절차가 성공적으로 완료되었습니다!"
echo "=================================================="
