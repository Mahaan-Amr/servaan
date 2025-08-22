#!/bin/bash

# 🚀 Servaan Development Workflow Script
# This script automates your development process

echo "🚀 Servaan Development Workflow"
echo "================================"

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "dev" ]; then
    echo "⚠️  You should be on 'dev' branch for development"
    echo "🔄 Switching to dev branch..."
    git checkout dev
    git pull origin dev
fi

echo ""
echo "📋 Development Workflow Options:"
echo "1. 🆕 Start new feature (create feature branch)"
echo "2. 🔄 Update dev branch from master"
echo "3. 🧪 Run tests locally"
echo "4. 📤 Push changes to dev"
echo "5. 🔀 Prepare merge to master"
echo "6. 🚀 Deploy to production (from master)"

read -p "Choose an option (1-6): " choice

case $choice in
    1)
        read -p "Enter feature name: " feature_name
        feature_branch="feature/$feature_name"
        echo "🆕 Creating feature branch: $feature_branch"
        git checkout -b "$feature_branch"
        echo "✅ Feature branch created! Work on your changes..."
        ;;
    2)
        echo "🔄 Updating dev branch from master..."
        git checkout master
        git pull origin master
        git checkout dev
        git merge master
        echo "✅ Dev branch updated from master!"
        ;;
    3)
        echo "🧪 Running tests locally..."
        npm test
        ;;
    4)
        echo "📤 Pushing changes to dev..."
        git add .
        read -p "Enter commit message: " commit_msg
        git commit -m "$commit_msg"
        git push origin dev
        echo "✅ Changes pushed to dev!"
        ;;
    5)
        echo "🔀 Preparing merge to master..."
        echo "⚠️  This will create a pull request from dev to master"
        echo "🌐 Go to: https://github.com/Mahaan-Amr/servaan/compare/master...dev"
        echo "📝 Create pull request with description of changes"
        ;;
    6)
        echo "🚀 Deploying to production..."
        echo "⚠️  This should only be done after merging dev to master"
        echo "🔄 The CI/CD pipeline will automatically deploy when merged to master"
        ;;
    *)
        echo "❌ Invalid option selected"
        ;;
esac

echo ""
echo "🎯 Remember: Always work on dev branch, merge to master for deployment!"
