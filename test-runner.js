#!/usr/bin/env node

/**
 * Test Runner Script for Luminari Medical Research Application
 * 
 * This script provides different test running options for the comprehensive
 * test suite written for the medical research platform.
 */

const { execSync } = require('child_process');
const path = require('path');

const testOptions = {
  unit: [
    'src/components/common/__tests__/Button.test.js',
    'src/components/common/__tests__/FloatingButton.test.js',
    'src/__tests__/integration.test.js'
  ],
  components: [
    'src/components/__tests__/DiseaseDiagnosis.test.js',
    'src/components/__tests__/SkinDiseaseDetector.test.js',
    'src/components/__tests__/ClinicalDossierCompiler.test.js',
    'src/components/common/__tests__/AskLuminaPopup.test.js'
  ],
  services: [
    'src/services/__tests__/openaiService.test.js'
  ],
  hooks: [
    'src/hooks/__tests__/useBackgroundJobs.test.js'
  ],
  app: [
    'src/App.test.js'
  ]
};

function runTests(category) {
  const tests = testOptions[category];
  if (!tests) {
    console.log('Available test categories:', Object.keys(testOptions).join(', '));
    return;
  }

  console.log(`\n🧪 Running ${category} tests...\n`);
  
  tests.forEach(testFile => {
    try {
      console.log(`Running: ${testFile}`);
      execSync(`npm test "${testFile}" -- --watchAll=false --verbose`, { 
        stdio: 'inherit',
        cwd: __dirname 
      });
      console.log(`✅ ${testFile} passed\n`);
    } catch (error) {
      console.log(`❌ ${testFile} failed\n`);
    }
  });
}

function runAllTests() {
  console.log('\n🧪 Running all tests...\n');
  
  try {
    execSync('npm test -- --watchAll=false --coverage --verbose', { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    console.log('\n✅ All tests completed\n');
  } catch (error) {
    console.log('\n❌ Some tests failed\n');
  }
}

// Command line argument handling
const category = process.argv[2];

if (category === 'all') {
  runAllTests();
} else if (category) {
  runTests(category);
} else {
  console.log(`
🏥 Luminari Medical Research Platform - Test Runner

Usage: node test-runner.js [category]

Available categories:
  unit        - Unit tests for individual components
  components  - Component integration tests  
  services    - Service layer tests
  hooks       - React hooks tests
  app         - Application level tests
  all         - Run all tests with coverage

Examples:
  node test-runner.js unit
  node test-runner.js components
  node test-runner.js all
  `);
}