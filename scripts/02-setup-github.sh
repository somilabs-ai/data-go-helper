#!/usr/bin/env bash
set -e

echo "=== [2/3] GitHub 저장소 설정 및 코드 Push ==="

REPO_NAME=${1:-"data-go-helper"}
TARGET_USER=$(gh api user -q '.login' 2>/dev/null || echo "somilabs-dev")

echo "[GitHub] 대상 계정: $TARGET_USER / 저장소 이름: $REPO_NAME"

# 로컬 git 저장소 확인
if [ ! -d ".git" ]; then
    git init
    git branch -M main
fi

# Git user.name 및 user.email 설정 (이 프로젝트에 한해 somilabs.ai 계정 적용)
git config user.name "$TARGET_USER"
git config user.email "somilabs.ai@gmail.com"

# GitHub 원격 저장소 존재 여부 확인
if gh repo view "$TARGET_USER/$REPO_NAME" >/dev/null 2>&1; then
    echo "✓ GitHub 저장소 $TARGET_USER/$REPO_NAME 가 이미 존재합니다."
else
    echo "[GitHub] 새 저장소 ($TARGET_USER/$REPO_NAME) 생성 중..."
    gh repo create "$TARGET_USER/$REPO_NAME" --public --source=. --remote=origin || true
fi

# Remote origin 주소 점검 및 push
if ! git remote | grep -q "origin"; then
    git remote add origin "https://github.com/$TARGET_USER/$REPO_NAME.git"
fi

echo "[GitHub] 코드 Commit 및 Push..."
git add .
git commit -m "Auto deploy update: $(date '+%Y-%m-%d %H:%M:%S')" || echo "변경 사항이 없습니다."
git push -u origin main || echo "Git push 처리 완료"

echo "✓ GitHub 저장소 설정 및 Push 완료!"
