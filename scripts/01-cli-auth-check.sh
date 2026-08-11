#!/usr/bin/env bash
set -e

echo "=== [1/3] CLI 인증 및 계정 점검 ==="

# 1. GitHub CLI 계정 전환 (somilabs-dev 또는 somilabs 계정)
echo "[GitHub CLI] 계정 상태 점검 중..."
CURRENT_GH_USER=$(gh api user -q '.login' 2>/dev/null || echo "none")

if [ "$CURRENT_GH_USER" != "somilabs-dev" ] && [ "$CURRENT_GH_USER" != "somilabs" ]; then
    echo "[GitHub CLI] somilabs-dev 계정으로 전환을 시도합니다..."
    if gh auth switch --user somilabs-dev 2>/dev/null; then
        echo "✓ GitHub CLI 계정이 somilabs-dev로 전환되었습니다."
    elif gh auth switch --user somilabs 2>/dev/null; then
        echo "✓ GitHub CLI 계정이 somilabs로 전환되었습니다."
    else
        echo "⚠️  GitHub CLI에 somilabs 계정이 등록되어 있지 않거나 인증이 필요합니다."
        exit 1
    fi
else
    echo "✓ 현재 GitHub CLI 계정: $CURRENT_GH_USER"
fi

# 2. Vercel CLI 인증 점검
echo "[Vercel CLI] 인증 상태 점검 중..."
if [ -n "$VERCEL_TOKEN" ]; then
    echo "✓ VERCEL_TOKEN 환경변수가 설정되어 있습니다."
elif pass show sites/vercel/token >/dev/null 2>&1; then
    export VERCEL_TOKEN=$(pass show sites/vercel/token | head -n 1)
    echo "✓ pass에서 VERCEL_TOKEN을 성공적으로 로드했습니다."
else
    VERCEL_USER=$(vercel whoami 2>/dev/null || echo "none")
    if [ "$VERCEL_USER" = "none" ]; then
        echo "⚠️  Vercel CLI 로그인이 필요합니다."
        echo "    'vercel login' 또는 VERCEL_TOKEN 환경변수를 설정해 주세요."
    else
        echo "✓ 현재 Vercel CLI 사용자: $VERCEL_USER"
    fi
fi

echo "✓ CLI 인증 점검 완료!"
