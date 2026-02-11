#!/usr/bin/env node

/**
 * Generate build metadata for the application.
 * This runs during the build process (both CI and Coolify).
 *
 * Environment variables (optional, will use defaults if not set):
 * - GITHUB_RUN_NUMBER: Build ID
 * - GITHUB_SHA: Commit SHA
 * - GITHUB_REF: Branch reference
 * - AUDIT_STATUS: Security audit status
 * - SIGNATURE_STATUS: Signature/provenance status
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Helper to safely execute git commands
function gitCommand(command, fallback = '') {
  try {
    return execSync(command, { encoding: 'utf-8' }).trim();
  } catch {
    return fallback;
  }
}

// Determine if we're in CI environment
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

// Get metadata from environment or git
const buildId =
  process.env.GITHUB_RUN_NUMBER || process.env.BUILD_ID || (isCI ? 'CI_BUILD' : 'LOCAL_BUILD');

const commitSha = (process.env.GITHUB_SHA || gitCommand('git rev-parse HEAD', 'unknown')).slice(
  0,
  7
);

const branch = process.env.GITHUB_REF
  ? process.env.GITHUB_REF.replace('refs/heads/', '')
  : gitCommand('git rev-parse --abbrev-ref HEAD', 'main');

const timestamp = new Date().toISOString();

const auditStatus = process.env.AUDIT_STATUS || (isCI ? 'NOT_RUN' : 'SKIPPED (dev)');

const signatureStatus = process.env.SIGNATURE_STATUS || (isCI ? 'NOT_VERIFIED' : 'UNSIGNED (dev)');

// Get GitHub repository information
const githubRepo =
  process.env.GITHUB_REPOSITORY ||
  (() => {
    const remoteUrl = gitCommand('git remote get-url origin', '').trim();
    // Parse GitHub remote URL to extract owner/repo
    // Handles both SSH (git@github.com:owner/repo.git) and HTTPS (https://github.com/owner/repo.git)
    const match = remoteUrl.match(/github\.com[:/]([^/]+\/[^/]+?)(\.git)?$/);
    return match ? match[1] : remoteUrl.replace(/^.*[:/]/, '').replace(/\.git$/, '');
  })();

const githubRunId = process.env.GITHUB_RUN_ID || null;

// Create metadata object
const meta = {
  build_id: buildId,
  commit_sha: commitSha,
  branch: branch,
  timestamp: timestamp,
  audit_status: auditStatus,
  signature_status: signatureStatus,
  github_repo: githubRepo || null,
  github_run_id: githubRunId,
};

// Write to public directory
const publicDir = path.join(__dirname, '..', 'public');
const metaPath = path.join(publicDir, 'meta.json');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write metadata file
fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

console.log('✅ Generated meta.json:', meta);
