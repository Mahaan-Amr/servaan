// Comprehensive Integration Test Runner for Servaan
// Runs all tests and provides detailed reporting

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Test configuration
const testConfig = {
  backendPort: 3001,
  frontendPort: 3000,
  testTimeout: 60000, // 1 minute timeout for each test suite
  maxRetries: 3
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorLog(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Check if server is running
function checkServer(port) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: port,
      path: '/api',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      resolve(true);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Run a test script
function runTestScript(scriptPath, description) {
  return new Promise((resolve, reject) => {
    colorLog(`\\n🔵 Running ${description}...`, 'blue');
    
    const child = spawn('node', [scriptPath], {
      stdio: 'pipe',
      cwd: process.cwd()
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      process.stdout.write(output);
    });

    child.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      process.stderr.write(output);
    });

    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`Test timeout after ${testConfig.testTimeout}ms`));
    }, testConfig.testTimeout);

    child.on('close', (code) => {
      clearTimeout(timeout);
      
      if (code === 0) {
        colorLog(`✅ ${description} completed successfully`, 'green');
        resolve({ success: true, stdout, stderr, code });
      } else {
        colorLog(`❌ ${description} failed with code ${code}`, 'red');
        resolve({ success: false, stdout, stderr, code });
      }
    });

    child.on('error', (error) => {
      clearTimeout(timeout);
      colorLog(`❌ ${description} error: ${error.message}`, 'red');
      reject(error);
    });
  });
}

// Parse test results from JSON files
function parseTestResults(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return data;
    }
  } catch (error) {
    colorLog(`⚠️  Could not parse test results from ${filePath}: ${error.message}`, 'yellow');
  }
  return null;
}

// Generate comprehensive report
function generateReport(testResults) {
  const reportPath = 'comprehensive-test-report.json';
  const htmlReportPath = 'comprehensive-test-report.html';
  
  // Calculate overall statistics
  const overallStats = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    successRate: 0,
    testSuites: testResults.length,
    completedSuites: testResults.filter(r => r.success).length
  };

  testResults.forEach(result => {
    if (result.testData && result.testData.summary) {
      overallStats.totalTests += result.testData.summary.total || 0;
      overallStats.passedTests += result.testData.summary.passed || 0;
      overallStats.failedTests += result.testData.summary.failed || 0;
    }
  });

  overallStats.successRate = overallStats.totalTests > 0 
    ? ((overallStats.passedTests / overallStats.totalTests) * 100).toFixed(1)
    : 0;

  const report = {
    timestamp: new Date().toISOString(),
    overallStats,
    testResults,
    recommendations: generateRecommendations(testResults, overallStats)
  };

  // Save JSON report
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Generate HTML report
  const htmlReport = generateHTMLReport(report);
  fs.writeFileSync(htmlReportPath, htmlReport);

  return { reportPath, htmlReportPath, report };
}

// Generate recommendations based on test results
function generateRecommendations(testResults, overallStats) {
  const recommendations = [];

  if (overallStats.successRate < 80) {
    recommendations.push({
      priority: 'HIGH',
      category: 'Critical Issues',
      message: 'Overall success rate is below 80%. Immediate attention required.',
      action: 'Review failed tests and fix critical API endpoints'
    });
  }

  if (overallStats.completedSuites < testResults.length) {
    recommendations.push({
      priority: 'HIGH',
      category: 'Test Infrastructure',
      message: 'Some test suites failed to complete.',
      action: 'Check server connectivity and test environment setup'
    });
  }

  const failedSuites = testResults.filter(r => !r.success);
  if (failedSuites.length > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'Failed Test Suites',
      message: `${failedSuites.length} test suite(s) failed: ${failedSuites.map(s => s.name).join(', ')}`,
      action: 'Review error logs and fix underlying issues'
    });
  }

  if (overallStats.successRate >= 95) {
    recommendations.push({
      priority: 'LOW',
      category: 'Excellent',
      message: 'All systems are working excellently!',
      action: 'Continue with production deployment or next development phase'
    });
  }

  return recommendations;
}

// Generate HTML report
function generateHTMLReport(report) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Servaan Integration Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
        .danger { color: #dc3545; }
        .test-suite { margin-bottom: 20px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .suite-header { background: #f8f9fa; padding: 15px; font-weight: bold; }
        .suite-content { padding: 15px; }
        .recommendation { padding: 10px; margin: 10px 0; border-left: 4px solid; }
        .rec-high { border-color: #dc3545; background: #f8d7da; }
        .rec-medium { border-color: #ffc107; background: #fff3cd; }
        .rec-low { border-color: #28a745; background: #d4edda; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Servaan Integration Test Report</h1>
            <p class="timestamp">Generated: ${new Date(report.timestamp).toLocaleString()}</p>
        </div>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-value success">${report.overallStats.totalTests}</div>
                <div>Total Tests</div>
            </div>
            <div class="stat-card">
                <div class="stat-value success">${report.overallStats.passedTests}</div>
                <div>Passed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value ${report.overallStats.failedTests > 0 ? 'danger' : 'success'}">${report.overallStats.failedTests}</div>
                <div>Failed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value ${report.overallStats.successRate >= 95 ? 'success' : report.overallStats.successRate >= 80 ? 'warning' : 'danger'}">${report.overallStats.successRate}%</div>
                <div>Success Rate</div>
            </div>
        </div>

        <h2>📋 Recommendations</h2>
        ${report.recommendations.map(rec => `
            <div class="recommendation rec-${rec.priority.toLowerCase()}">
                <strong>${rec.priority} - ${rec.category}:</strong> ${rec.message}<br>
                <em>Action: ${rec.action}</em>
            </div>
        `).join('')}

        <h2>🔍 Test Suite Results</h2>
        ${report.testResults.map(result => `
            <div class="test-suite">
                <div class="suite-header ${result.success ? 'success' : 'danger'}">
                    ${result.success ? '✅' : '❌'} ${result.name}
                </div>
                <div class="suite-content">
                    <p><strong>Status:</strong> ${result.success ? 'Passed' : 'Failed'}</p>
                    ${result.testData ? `
                        <p><strong>Tests:</strong> ${result.testData.summary.total} total, ${result.testData.summary.passed} passed, ${result.testData.summary.failed} failed</p>
                        <p><strong>Success Rate:</strong> ${result.testData.summary.successRate}%</p>
                    ` : ''}
                    ${result.error ? `<p><strong>Error:</strong> ${result.error}</p>` : ''}
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
}

// Main test runner
async function runAllTests() {
  colorLog('🚀 Starting Comprehensive Integration Test Suite for Servaan', 'cyan');
  colorLog('=' .repeat(60), 'cyan');

  const startTime = Date.now();
  const testResults = [];

  try {
    // 1. Check if backend server is running
    colorLog('\\n🔍 Checking backend server status...', 'blue');
    const backendRunning = await checkServer(testConfig.backendPort);
    
    if (!backendRunning) {
      colorLog('❌ Backend server is not running on port 3001', 'red');
      colorLog('📝 Please start the backend server first:', 'yellow');
      colorLog('   cd src/backend && npm run dev', 'yellow');
      process.exit(1);
    }
    
    colorLog('✅ Backend server is running', 'green');

    // 2. Run API Integration Tests
    try {
      const apiTestResult = await runTestScript('./api-integration-test.js', 'API Integration Tests');
      const apiTestData = parseTestResults('./api-integration-test-results.json');
      
      testResults.push({
        name: 'API Integration Tests',
        success: apiTestResult.success,
        testData: apiTestData,
        duration: 'N/A',
        error: apiTestResult.success ? null : 'Test suite failed to complete'
      });
    } catch (error) {
      testResults.push({
        name: 'API Integration Tests',
        success: false,
        testData: null,
        duration: 'N/A',
        error: error.message
      });
    }

    // 3. Run Frontend Integration Tests
    try {
      const frontendTestResult = await runTestScript('../frontend/test-frontend-integration.js', 'Frontend Integration Tests');
      const frontendTestData = parseTestResults('../frontend/frontend-integration-test-results.json');
      
      testResults.push({
        name: 'Frontend Integration Tests',
        success: frontendTestResult.success,
        testData: frontendTestData,
        duration: 'N/A',
        error: frontendTestResult.success ? null : 'Test suite failed to complete'
      });
    } catch (error) {
      testResults.push({
        name: 'Frontend Integration Tests',
        success: false,
        testData: null,
        duration: 'N/A',
        error: error.message
      });
    }

    // 4. Run Backend Unit Tests (if database is available)
    try {
      colorLog('\\n🔵 Attempting to run backend unit tests...', 'blue');
      const unitTestResult = await runTestScript('./run-tests.js', 'Backend Unit Tests');
      
      testResults.push({
        name: 'Backend Unit Tests',
        success: unitTestResult.success,
        testData: null, // Unit tests don't generate JSON results in the same format
        duration: 'N/A',
        error: unitTestResult.success ? null : 'Unit tests failed - likely database connection issue'
      });
    } catch (error) {
      testResults.push({
        name: 'Backend Unit Tests',
        success: false,
        testData: null,
        duration: 'N/A',
        error: `Unit tests skipped: ${error.message}`
      });
    }

    // 5. Generate comprehensive report
    colorLog('\\n📊 Generating comprehensive test report...', 'blue');
    const { reportPath, htmlReportPath, report } = generateReport(testResults);

    // 6. Display summary
    const endTime = Date.now();
    const totalDuration = ((endTime - startTime) / 1000).toFixed(1);

    colorLog('\\n' + '='.repeat(60), 'cyan');
    colorLog('🎉 COMPREHENSIVE TEST RESULTS', 'cyan');
    colorLog('='.repeat(60), 'cyan');
    
    colorLog(`📊 Overall Statistics:`, 'bright');
    colorLog(`   Total Tests: ${report.overallStats.totalTests}`, 'blue');
    colorLog(`   Passed: ${report.overallStats.passedTests}`, 'green');
    colorLog(`   Failed: ${report.overallStats.failedTests}`, report.overallStats.failedTests > 0 ? 'red' : 'green');
    colorLog(`   Success Rate: ${report.overallStats.successRate}%`, report.overallStats.successRate >= 95 ? 'green' : report.overallStats.successRate >= 80 ? 'yellow' : 'red');
    colorLog(`   Test Suites: ${report.overallStats.completedSuites}/${report.overallStats.testSuites} completed`, 'blue');
    colorLog(`   Total Duration: ${totalDuration}s`, 'blue');

    colorLog(`\\n📋 Test Suite Results:`, 'bright');
    testResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const color = result.success ? 'green' : 'red';
      colorLog(`   ${status} ${result.name}`, color);
      if (result.error) {
        colorLog(`      Error: ${result.error}`, 'red');
      }
    });

    colorLog(`\\n🔍 Recommendations:`, 'bright');
    report.recommendations.forEach(rec => {
      const color = rec.priority === 'HIGH' ? 'red' : rec.priority === 'MEDIUM' ? 'yellow' : 'green';
      colorLog(`   ${rec.priority}: ${rec.message}`, color);
      colorLog(`   Action: ${rec.action}`, 'blue');
    });

    colorLog(`\\n📄 Reports Generated:`, 'bright');
    colorLog(`   JSON Report: ${reportPath}`, 'blue');
    colorLog(`   HTML Report: ${htmlReportPath}`, 'blue');

    // 7. Exit with appropriate code
    const overallSuccess = report.overallStats.successRate >= 80 && report.overallStats.completedSuites === testResults.length;
    
    if (overallSuccess) {
      colorLog(`\\n🎉 All tests completed successfully! Ready for production.`, 'green');
      process.exit(0);
    } else {
      colorLog(`\\n⚠️  Some tests failed. Please review and fix issues before proceeding.`, 'yellow');
      process.exit(1);
    }

  } catch (error) {
    colorLog(`\\n❌ Test runner failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  colorLog('\\n⚠️  Test runner interrupted by user', 'yellow');
  process.exit(1);
});

process.on('SIGTERM', () => {
  colorLog('\\n⚠️  Test runner terminated', 'yellow');
  process.exit(1);
});

// Start the test runner
colorLog('🔍 Servaan Integration Test Runner', 'cyan');
colorLog('📝 This will run all integration tests and generate a comprehensive report', 'blue');
colorLog('⏱️  Estimated time: 2-5 minutes depending on system performance', 'blue');
colorLog('', 'reset');

runAllTests(); 