#!/usr/bin/env bash
set -e

echo "=== [3/3] Vercel CLI 배포 및 환경변수 설정 ==="

# 1. Vercel 프로젝트 생성 / 연결
echo "[Vercel] 프로젝트 연결 및 설정..."
vercel link --yes || true

# 2. .env.local 의 환경변수들을 Vercel Production에 자동 전달
if [ -f ".env.local" ]; then
    echo "[Vercel] .env.local 환경변수 동기화 중..."
    while IFS= read -r line || [ -n "$line" ]; do
        if [[ "$line" =~ ^[[:space:]]*# ]] || [[ -z "${line// }" ]]; then
            continue
        fi
        
        KEY=$(echo "$line" | cut -d '=' -f 1 | xargs)
        VAL=$(echo "$line" | cut -d '=' -f 2- | xargs)
        
        if [ -n "$KEY" ] && [ -n "$VAL" ]; then
            echo " - 환경변수 등록: $KEY"
            vercel env rm "$KEY" production --yes >/dev/null 2>&1 || true
            echo -n "$VAL" | vercel env add "$KEY" production >/dev/null 2>&1 || true
        fi
    done < .env.local
fi

# 3. Vercel 프로덕션 배포 실행
echo "[Vercel] 프로덕션 배포 진행 중..."
vercel --prod --yes

echo "✓ Vercel 배포 완료!"
