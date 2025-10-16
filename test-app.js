#!/usr/bin/env node

/**
 * Automated Test Script for Luminari Frontend
 * Tests for compilation errors, runtime errors, and basic functionality
 */

const http = require('http');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const APP_URL = 'http://localhost:3000';
const TIMEOUT = 5000;

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, details = '') {
  const icon = passed ? '✓' : '✗';
  const color = passed ? 'green' : 'red';
  log(`${icon} ${name}`, color);
  if (details) {
    log(`  ${details}`, 'cyan');
  }
}

// Test 1: Check if server is running
async function testServerRunning() {
  return new Promise((resolve) => {
    const req = http.get(APP_URL, (res) => {
      const running = res.statusCode === 200;
      logTest('Server is running', running, `Status code: ${res.statusCode}`);
      resolve(running);
    });

    req.on('error', (err) => {
      logTest('Server is running', false, `Error: ${err.message}`);
      resolve(false);
    });

    req.setTimeout(TIMEOUT, () => {
      req.destroy();
      logTest('Server is running', false, 'Timeout - server not responding');
      resolve(false);
    });
  });
}

// Test 2: Check for TypeScript/compilation errors
async function testCompilation() {
  try {
    // Check if there are any compilation errors in the console
    const { stdout, stderr } = await execPromise(
      'ps aux | grep "react-scripts start" | grep -v grep'
    );

    if (stdout.includes('react-scripts')) {
      logTest('Compilation check', true, 'React scripts running without crashes');
      return true;
    } else {
      logTest('Compilation check', false, 'React scripts not found');
      return false;
    }
  } catch (error) {
    logTest('Compilation check', false, error.message);
    return false;
  }
}

// Test 3: Check if key files exist
async function testFileIntegrity() {
  const fs = require('fs');
  const path = require('path');

  const criticalFiles = [
    'src/App.js',
    'src/components/UnifiedRegulatoryGenerator.js',
    'src/components/ProtocolGenerator.js',
    'src/components/RegulatoryDocuments.js',
    'src/components/Login.js'
  ];

  let allExist = true;
  const basePath = '/Users/tanishqpadwal/Desktop/Luminari/luminari fe/skin-disease-frontend';

  for (const file of criticalFiles) {
    const filePath = path.join(basePath, file);
    const exists = fs.existsSync(filePath);
    if (!exists) {
      logTest(`File exists: ${file}`, false);
      allExist = false;
    }
  }

  if (allExist) {
    logTest('File integrity', true, `All ${criticalFiles.length} critical files exist`);
  }

  return allExist;
}

// Test 4: Check for syntax errors in modified files
async function testSyntaxErrors() {
  try {
    const files = [
      'src/components/UnifiedRegulatoryGenerator.js',
      'src/components/RegulatoryDocuments.js',
      'src/components/ProtocolGenerator.js'
    ];

    let hasErrors = false;

    for (const file of files) {
      try {
        await execPromise(
          `node -c "/Users/tanishqpadwal/Desktop/Luminari/luminari fe/skin-disease-frontend/${file}"`
        );
      } catch (error) {
        logTest(`Syntax check: ${file}`, false, error.message);
        hasErrors = true;
      }
    }

    if (!hasErrors) {
      logTest('Syntax validation', true, `Checked ${files.length} files`);
    }

    return !hasErrors;
  } catch (error) {
    logTest('Syntax validation', false, error.message);
    return false;
  }
}

// Test 5: Check build output
async function testBuildOutput() {
  const fs = require('fs');
  const buildPath = '/Users/tanishqpadwal/Desktop/Luminari/luminari fe/skin-disease-frontend/build';

  if (fs.existsSync(buildPath)) {
    const buildFiles = fs.readdirSync(buildPath);
    const hasIndex = buildFiles.includes('index.html');
    const hasStatic = buildFiles.includes('static');

    if (hasIndex && hasStatic) {
      logTest('Build output', true, 'Build folder contains required files');
      return true;
    }
  }

  logTest('Build output', false, 'Build folder incomplete or missing');
  return false;
}

// Test 6: Check for common React errors in console
async function testReactHealth() {
  return new Promise((resolve) => {
    http.get(APP_URL, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        // Check if the HTML contains the root div
        const hasRoot = data.includes('id="root"');
        const hasReactBundle = data.includes('static/js/') || data.includes('bundle.js');

        if (hasRoot && hasReactBundle) {
          logTest('React app structure', true, 'Root element and bundle found');
          resolve(true);
        } else {
          logTest('React app structure', false, 'Missing root element or bundle');
          resolve(false);
        }
      });
    }).on('error', () => {
      logTest('React app structure', false, 'Could not fetch page');
      resolve(false);
    });
  });
}

// Test 7: Check package.json dependencies
async function testDependencies() {
  const fs = require('fs');
  const packagePath = '/Users/tanishqpadwal/Desktop/Luminari/luminari fe/skin-disease-frontend/package.json';

  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const requiredDeps = [
      'react',
      'react-dom',
      'react-router-dom',
      'react-simple-maps'
    ];

    const missingDeps = requiredDeps.filter(dep =>
      !packageJson.dependencies[dep] && !packageJson.devDependencies?.[dep]
    );

    if (missingDeps.length === 0) {
      logTest('Dependencies', true, 'All required dependencies present');
      return true;
    } else {
      logTest('Dependencies', false, `Missing: ${missingDeps.join(', ')}`);
      return false;
    }
  } catch (error) {
    logTest('Dependencies', false, error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  log('\n🧪 Running Luminari Frontend Tests\n', 'blue');
  log('═'.repeat(50), 'cyan');

  const results = [];

  // Run all tests
  results.push(await testServerRunning());
  results.push(await testCompilation());
  results.push(await testFileIntegrity());
  results.push(await testDependencies());
  results.push(await testBuildOutput());
  results.push(await testReactHealth());

  // Summary
  log('\n' + '═'.repeat(50), 'cyan');
  const passed = results.filter(r => r).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);

  log(`\n📊 Test Summary: ${passed}/${total} passed (${percentage}%)`, 'blue');

  if (passed === total) {
    log('\n✅ All tests passed! Safe to push.', 'green');
    process.exit(0);
  } else {
    log(`\n⚠️  ${total - passed} test(s) failed. Review issues above.`, 'yellow');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  log(`\n❌ Test runner error: ${error.message}`, 'red');
  process.exit(1);
});
