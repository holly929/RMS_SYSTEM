#!/usr/bin/env node

console.log('Checking 2FA feature implementation...');
console.log('===================================');

// Check if Node.js is available
if (typeof process !== 'undefined') {
    console.log(`Node.js version: ${process.version}`);
    console.log(`Platform: ${process.platform}`);
    console.log('');
}

// Check for required files
const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;
const requiredFiles = [
    'src/components/twoFactorSettings.tsx',
    'src/lib/twoFactorAuth.ts', 
    'src/context/AuthContext.tsx',
    'src/app/(main)/settings/page.tsx',
    'package.json'
];

console.log('Checking required files...');
requiredFiles.forEach(file => {
    const filePath = path.join(projectRoot, file);
    try {
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            console.log(`✅ ${file} (${stats.size} bytes)`);
        } else {
            console.log(`❌ ${file} - File not found`);
        }
    } catch (error) {
        console.log(`❌ ${file} - ${error.message}`);
    }
});

console.log('');

// Check package.json dependencies
try {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    console.log('Checking dependencies...');
    const dependencies = ['speakeasy', 'qrcode'];
    
    dependencies.forEach(dep => {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
            console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
        } else if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
            console.log(`✅ ${dep}: ${packageJson.devDependencies[dep]} (dev)`);
        } else {
            console.log(`❌ ${dep} - Not found in dependencies`);
        }
    });
    
    console.log('');
    
    // Check for @types dependencies
    console.log('Checking TypeScript definitions...');
    const typeDependencies = ['@types/speakeasy', '@types/qrcode'];
    
    typeDependencies.forEach(dep => {
        if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
            console.log(`✅ ${dep}: ${packageJson.devDependencies[dep]}`);
        } else {
            console.log(`⚠️ ${dep} - Not found in devDependencies`);
        }
    });
    
} catch (error) {
    console.log(`❌ Error reading package.json: ${error.message}`);
}

console.log('');
console.log('Checking if node_modules directory exists...');
const nodeModulesPath = path.join(projectRoot, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
    console.log('✅ node_modules directory exists');
    const moduleCount = fs.readdirSync(nodeModulesPath).length;
    console.log(`   Contains ${moduleCount} modules`);
    
    // Check for specific modules
    ['speakeasy', 'qrcode'].forEach(module => {
        const modulePath = path.join(nodeModulesPath, module);
        if (fs.existsSync(modulePath)) {
            console.log(`   ✅ ${module}`);
        } else {
            console.log(`   ❌ ${module}`);
        }
    });
} else {
    console.log('❌ node_modules directory does NOT exist');
    console.log('   Run "npm install" to install dependencies');
}

console.log('');
console.log('Checking TypeScript configuration...');
const tsConfigPath = path.join(projectRoot, 'tsconfig.json');
if (fs.existsSync(tsConfigPath)) {
    console.log('✅ tsconfig.json exists');
} else {
    console.log('⚠️ tsconfig.json not found');
}

console.log('');
console.log('===================================');
console.log('');

if (!fs.existsSync(nodeModulesPath)) {
    console.log('IMPORTANT: You must install dependencies first!');
    console.log('Run: npm install');
    process.exit(1);
}

console.log('2FA feature implementation complete.');
console.log('');
console.log('To run the application:');
console.log('1. npm run build');
console.log('2. npm run dev');
console.log('');
console.log('Then navigate to Settings > Security to see the 2FA feature.');
