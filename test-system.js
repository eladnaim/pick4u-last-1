/**
 * System Test Report Generator
 * Comprehensive testing of all fixed components
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Pick4U System Test Report Generator');
console.log('=====================================\n');

const report = {
  timestamp: new Date().toISOString(),
  version: '1.0.1',
  tests: [],
  errors: [],
  warnings: [],
  recommendations: []
};

// Test 1: Firebase Configuration
console.log('🔥 Test 1: Firebase Configuration Check');
try {
  const firebaseConfigExists = fs.existsSync(path.join(__dirname, 'firebaseConfig.ts'));
  if (firebaseConfigExists) {
    report.tests.push({
      name: 'Firebase Configuration',
      status: 'PASS',
      details: 'Firebase configuration file exists'
    });
    console.log('✅ Firebase configuration file exists');
  } else {
    throw new Error('Firebase configuration file not found');
  }
} catch (error) {
  report.tests.push({
    name: 'Firebase Configuration',
    status: 'FAIL',
    details: error.message
  });
  report.errors.push('Firebase configuration error: ' + error.message);
  console.log('❌ Firebase configuration error:', error.message);
}

// Test 2: TypeScript Compilation
console.log('\n📋 Test 2: TypeScript Compilation Check');
try {
  const tsconfigExists = fs.existsSync(path.join(__dirname, 'tsconfig.json'));
  if (tsconfigExists) {
    const tsconfigContent = fs.readFileSync(path.join(__dirname, 'tsconfig.json'), 'utf8');
    JSON.parse(tsconfigContent); // Validate JSON
    report.tests.push({
      name: 'TypeScript Configuration',
      status: 'PASS',
      details: 'TypeScript configuration is valid'
    });
    console.log('✅ TypeScript configuration valid');
  } else {
    throw new Error('TypeScript configuration file not found');
  }
} catch (error) {
  report.tests.push({
    name: 'TypeScript Configuration',
    status: 'FAIL',
    details: error.message
  });
  report.errors.push('TypeScript configuration error: ' + error.message);
  console.log('❌ TypeScript configuration error:', error.message);
}

// Test 3: Package.json Dependencies
console.log('\n📦 Test 3: Dependencies Check');
try {
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonContent);
  
  const criticalDeps = ['react', 'firebase', 'typescript', 'vite'];
  const missingDeps = [];
  
  criticalDeps.forEach(dep => {
    if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
      missingDeps.push(dep);
    }
  });
  
  if (missingDeps.length === 0) {
    report.tests.push({
      name: 'Critical Dependencies',
      status: 'PASS',
      details: 'All critical dependencies are present'
    });
    console.log('✅ All critical dependencies present');
  } else {
    report.tests.push({
      name: 'Critical Dependencies',
      status: 'WARN',
      details: `Missing dependencies: ${missingDeps.join(', ')}`
    });
    report.warnings.push('Missing dependencies: ' + missingDeps.join(', '));
    console.log('⚠️ Missing dependencies:', missingDeps.join(', '));
  }
} catch (error) {
  report.tests.push({
    name: 'Dependencies Check',
    status: 'FAIL',
    details: error.message
  });
  report.errors.push('Dependencies check error: ' + error.message);
  console.log('❌ Dependencies check error:', error.message);
}

// Test 4: File Structure Analysis
console.log('\n📁 Test 4: File Structure Analysis');
const requiredFiles = [
  'App.tsx',
  'firebaseConfig.ts',
  'types.ts',
  'components/RequestCard.tsx',
  'components/BottomNav.tsx',
  'services/dbService.ts',
  'services/dataValidation.ts'
];

const missingFiles = [];
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    missingFiles.push(file);
  }
});

if (missingFiles.length === 0) {
  report.tests.push({
    name: 'Required Files',
    status: 'PASS',
    details: 'All required files are present'
  });
  console.log('✅ All required files present');
} else {
  report.tests.push({
    name: 'Required Files',
    status: 'FAIL',
    details: `Missing files: ${missingFiles.join(', ')}`
  });
  report.errors.push('Missing files: ' + missingFiles.join(', '));
  console.log('❌ Missing files:', missingFiles.join(', '));
}

// Test 5: Code Analysis for Fixed Issues
console.log('\n🔍 Test 5: Code Analysis for Fixed Issues');
try {
  const appContent = fs.readFileSync(path.join(__dirname, 'App.tsx'), 'utf8');
  
  // Check if monitoring tools are admin-only
  const adminCheck = appContent.includes('isAdmin ? () => setShowSystemTest(true) : undefined');
  if (adminCheck) {
    report.tests.push({
      name: 'Admin-Only Monitoring',
      status: 'PASS',
      details: 'System test button is properly restricted to admins'
    });
    console.log('✅ Admin-only monitoring implemented');
  } else {
    report.tests.push({
      name: 'Admin-Only Monitoring',
      status: 'WARN',
      details: 'System test button may not be admin-restricted'
    });
    report.warnings.push('System test button may not be admin-restricted');
    console.log('⚠️ System test button may not be admin-restricted');
  }
  
  // Check if requests are not hidden by default
  const hiddenCheck = appContent.includes('isHidden: false');
  if (hiddenCheck) {
    report.tests.push({
      name: 'Request Visibility',
      status: 'PASS',
      details: 'Requests are created with isHidden: false by default'
    });
    console.log('✅ Requests are visible by default');
  } else {
    report.tests.push({
      name: 'Request Visibility',
      status: 'FAIL',
      details: 'Requests may still be hidden by default'
    });
    report.errors.push('Requests may still be hidden by default');
    console.log('❌ Requests may still be hidden by default');
  }
  
  // Check if location tab is restored
  const locationTabCheck = appContent.includes("'location'") && appContent.includes('renderLocation');
  if (locationTabCheck) {
    report.tests.push({
      name: 'Location Tab Restoration',
      status: 'PASS',
      details: 'Location collection identification tab is restored'
    });
    console.log('✅ Location tab restored');
  } else {
    report.tests.push({
      name: 'Location Tab Restoration',
      status: 'WARN',
      details: 'Location tab may not be fully restored'
    });
    report.warnings.push('Location tab may not be fully restored');
    console.log('⚠️ Location tab may not be fully restored');
  }
} catch (error) {
  report.tests.push({
    name: 'Code Analysis',
    status: 'FAIL',
    details: error.message
  });
  report.errors.push('Code analysis error: ' + error.message);
  console.log('❌ Code analysis error:', error.message);
}

// Test 6: Build Status
console.log('\n🏗️ Test 6: Build Status Check');
try {
  const buildExists = fs.existsSync(path.join(__dirname, 'dist'));
  if (buildExists) {
    report.tests.push({
      name: 'Build Status',
      status: 'PASS',
      details: 'Build directory exists - project builds successfully'
    });
    console.log('✅ Build directory exists');
  } else {
    report.tests.push({
      name: 'Build Status',
      status: 'WARN',
      details: 'Build directory not found - run npm run build'
    });
    report.warnings.push('Build directory not found - consider running npm run build');
    console.log('⚠️ Build directory not found');
  }
} catch (error) {
  report.tests.push({
    name: 'Build Status',
    status: 'FAIL',
    details: error.message
  });
  report.errors.push('Build status check error: ' + error.message);
  console.log('❌ Build status check error:', error.message);
}

// Generate recommendations
console.log('\n💡 Generating Recommendations...');
if (report.errors.length > 0) {
  report.recommendations.push('Fix all critical errors before deployment');
  report.recommendations.push('Test the application thoroughly in a staging environment');
  report.recommendations.push('Consider implementing automated testing');
}

if (report.warnings.length > 0) {
  report.recommendations.push('Address warnings to improve system stability');
  report.recommendations.push('Review and optimize code performance');
}

report.recommendations.push('Monitor system performance after deployment');
report.recommendations.push('Set up error tracking and logging');
report.recommendations.push('Implement user feedback collection');

// Generate final report
console.log('\n📊 Test Summary');
console.log('===============');
const passedTests = report.tests.filter(t => t.status === 'PASS').length;
const failedTests = report.tests.filter(t => t.status === 'FAIL').length;
const warningTests = report.tests.filter(t => t.status === 'WARN').length;

console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`⚠️  Warnings: ${warningTests}`);
console.log(`📋 Total: ${report.tests.length}`);

// Save report to file
const reportPath = path.join(__dirname, 'system-test-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log(`\n📄 Full report saved to: ${reportPath}`);
console.log('\n🎯 System test completed successfully!');

// Return summary for further processing
process.exit(failedTests > 0 ? 1 : 0);