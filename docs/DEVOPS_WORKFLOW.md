# 🚀 **Servaan DevOps Workflow Guide**

## 📋 **Overview**

This document explains how to use the new DevOps workflow for the Servaan platform. The system now uses a **two-branch strategy** with **automated CI/CD** for safe and efficient development.

## 🌿 **Branch Strategy**

### **Master Branch** 🏆
- **Purpose**: Production-ready code
- **Protection**: Requires pull request reviews
- **Deployment**: Automatically deploys to server when merged
- **Usage**: Only merge tested code from dev branch

### **Dev Branch** 🔧
- **Purpose**: Development and testing
- **Protection**: Requires pull request reviews
- **Deployment**: Never deploys directly
- **Usage**: All development work happens here

## 🔄 **Development Workflow**

### **Daily Development Process**

1. **Start Work** 🚀
   ```bash
   # Always start on dev branch
   git checkout dev
   git pull origin dev
   ```

2. **Create Feature Branch** (Optional) 🌿
   ```bash
   # For major features
   git checkout -b feature/new-feature-name
   # Work on your changes...
   git add .
   git commit -m "Add new feature"
   git push origin feature/new-feature-name
   ```

3. **Push to Dev** 📤
   ```bash
   # When ready to test
   git add .
   git commit -m "Description of changes"
   git push origin dev
   ```

4. **Test on Dev** 🧪
   - Test your changes thoroughly
   - Fix any issues
   - Push updates to dev

5. **Merge to Master** 🔀
   - Create pull request: dev → master
   - Get code review approval
   - Merge to master
   - **Auto-deployment happens!** 🚀

## 🛠️ **Using the Workflow Scripts**

### **Linux/Mac Users**
```bash
# Make script executable
chmod +x scripts/dev-workflow.sh

# Run the workflow
./scripts/dev-workflow.sh
```

### **Windows Users**
```bash
# Run the batch file
scripts/dev-workflow.bat
```

## 📱 **Workflow Script Options**

1. **🆕 Start New Feature**: Creates feature branch
2. **🔄 Update Dev**: Syncs dev with latest master
3. **🧪 Run Tests**: Executes local testing
4. **📤 Push Changes**: Commits and pushes to dev
5. **🔀 Prepare Merge**: Instructions for pull request
6. **🚀 Deploy**: Information about auto-deployment

## 🔒 **Branch Protection Rules**

### **Master Branch**
- ✅ Require pull request reviews
- ✅ Require status checks to pass
- ✅ Restrict direct pushes
- ✅ Require linear history

### **Dev Branch**
- ✅ Require pull request reviews
- ✅ Allow force pushes (for development)
- ✅ Require status checks

## 🚀 **CI/CD Pipeline**

### **What Happens Automatically**

1. **On Push to Dev**:
   - Runs tests
   - Builds application
   - Reports status

2. **On Merge to Master**:
   - Runs all tests
   - Builds application
   - Deploys to production server
   - Restarts Docker containers

### **Pipeline Steps**
1. **Test Job**: Runs npm test
2. **Build Job**: Creates production build
3. **Deploy Job**: SSH to server and update containers

## 🎯 **Best Practices**

### **Do's** ✅
- Always work on dev branch
- Test thoroughly before merging to master
- Write clear commit messages
- Use pull requests for code reviews
- Keep dev branch updated with master

### **Don'ts** ❌
- Never push directly to master
- Don't merge untested code
- Avoid large commits
- Don't skip code reviews

## 🚨 **Emergency Procedures**

### **If Something Goes Wrong**

1. **Rollback Deployment**:
   ```bash
   # On server
   cd /opt/servaan/app
   git checkout HEAD~1
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

2. **Hotfix Process**:
   ```bash
   # Create hotfix branch from master
   git checkout master
   git checkout -b hotfix/urgent-fix
   # Make fix
   git commit -m "Hotfix: urgent issue"
   git push origin hotfix/urgent-fix
   # Create PR: hotfix → master
   ```

## 📊 **Monitoring & Logs**

### **Check Deployment Status**
- GitHub Actions tab shows pipeline progress
- Server logs: `docker-compose logs -f`
- Application health: Check your domain

### **Common Issues**
- **Tests Fail**: Fix issues on dev branch
- **Build Fails**: Check for syntax errors
- **Deploy Fails**: Check server connectivity

## 🎉 **Getting Started**

1. **First Time Setup**:
   ```bash
   git checkout dev
   git pull origin dev
   ```

2. **Daily Workflow**:
   ```bash
   # Use the workflow script
   ./scripts/dev-workflow.sh
   ```

3. **When Ready to Deploy**:
   - Merge dev to master via pull request
   - CI/CD automatically deploys

## 📞 **Support**

If you encounter issues:
1. Check this documentation
2. Review GitHub Actions logs
3. Check server status
4. Contact the team

---

**🎯 Remember: Always work on dev, merge to master for deployment!**
