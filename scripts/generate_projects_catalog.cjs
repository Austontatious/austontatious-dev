#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');

const OWNER = 'Austontatious';
const EXCLUDED_REPOS = new Set(['Gauntlet-010', 'Gauntlet-005', 'Gauntlet001']);
const STATUS_ORDER = ['Core', 'Experimental', 'Commission', 'Stub'];
const VALID_TAGS = new Set([
  'Systems Builder',
  'Applied AI Engineer',
  'Automation + Quality',
  'Developer Experience',
]);
const VALID_CONNECTION_TYPES = new Set([
  'inspired-by',
  'prototype-for',
  'commissioned',
  'evolved-into',
  'shared-infra',
]);

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'src', 'data');
const RAW_PATH = path.join(DATA_DIR, 'repos.raw.json');
const LOCALMAP_PATH = path.join(DATA_DIR, 'repos.localmap.json');
const GENERATED_PATH = path.join(DATA_DIR, 'projects.generated.json');
const FAMILY_TREE_PATH = path.join(DATA_DIR, 'family_tree.json');
const CACHE_ROOT = `/mnt/data/_repo_cache/${OWNER}`;
const EXCLUDED_SLUGS = new Set(Array.from(EXCLUDED_REPOS, (name) => slugify(name)));

const args = new Set(process.argv.slice(2));
const checkOnly = args.has('--check');

const metadataHints = {
  lex: {
    tag: 'Applied AI Engineer',
    status: 'Core',
    threads: ['AI Platform', 'Automation & Reliability'],
    shortDesc: 'Major divergence from capability into user experience and identity-focused assistant behavior.',
    connections: [
      {
        to: 'muninn',
        type: 'shared-infra',
        note: 'Memory integration patterns align with Muninn provider APIs.',
      },
    ],
  },
  friday: {
    tag: 'Systems Builder',
    status: 'Core',
    threads: ['AI Platform', 'Automation & Reliability'],
    shortDesc: 'Origin project where local coding-agent work exposed orchestration and tooling reliability problems.',
    connections: [
      {
        to: 'muninn',
        type: 'shared-infra',
        note: 'Supports Muninn-backed rehydrate and candidate staging flows.',
      },
    ],
  },
  muninn: {
    tag: 'Applied AI Engineer',
    status: 'Core',
    threads: ['AI Platform', 'Automation & Reliability'],
    shortDesc: 'Turning point project: embedded memory work extracted into reusable infrastructure for durable AI state.',
    connections: [
      {
        to: 'friday',
        type: 'shared-infra',
        note: 'Memory APIs are consumed by FRIDAY assistant flows.',
      },
    ],
  },
  onhand: {
    tag: 'Applied AI Engineer',
    status: 'Core',
    threads: ['Computer Vision', 'Automation & Reliability'],
    shortDesc: 'Inventory and intent platform spanning Android client workflows, enterprise APIs, and optional vision evaluation services.',
    connections: [],
  },
  null_signal: {
    tag: 'Applied AI Engineer',
    status: 'Experimental',
    threads: ['Computer Vision', 'Automation & Reliability'],
    shortDesc: 'Local-first autonomous media pipeline that converts news signals into scripted, rendered, and packaged short-form broadcasts.',
    connections: [],
  },
  readyplayer1: {
    tag: 'Applied AI Engineer',
    status: 'Experimental',
    threads: ['Games & Simulation', 'Automation & Reliability'],
    shortDesc: 'Automated playtesting system built specifically to exercise SubSim through deterministic simulation runs.',
    connections: [
      {
        to: 'subsim',
        type: 'shared-infra',
        note: 'Uses SubSim as a benchmark environment for deterministic runs.',
      },
    ],
  },
  subsim: {
    tag: 'Developer Experience',
    status: 'Experimental',
    threads: ['Games & Simulation'],
    shortDesc: 'Audio-first deterministic submarine simulation designed for fast iteration, replay traces, and headless testing.',
    connections: [
      {
        to: 'readyplayer1',
        type: 'evolved-into',
        note: 'Simulation harness extends into ReadyPlayer1 playtesting workflows.',
      },
    ],
  },
  gauntlet: {
    tag: 'Automation + Quality',
    status: 'Experimental',
    threads: ['Automation & Reliability'],
    shortDesc: 'Coding arena platform for challenge publishing, controlled execution, and repeatable submission scoring.',
    connections: [],
  },
  accountant: {
    tag: 'Systems Builder',
    status: 'Commission',
    threads: ['Automation & Reliability'],
    shortDesc: 'Commissioned applied competency project for secure accounting ingestion, OCR review, and export workflows.',
    connections: [],
  },
  pulsetrade: {
    tag: 'Applied AI Engineer',
    status: 'Core',
    threads: ['Trading Systems', 'Automation & Reliability'],
    shortDesc: 'Commissioned applied competency project for modular trading research and policy-driven execution planning.',
    connections: [
      {
        to: 'memetrader',
        type: 'prototype-for',
        note: 'Expands deterministic run artifacts into a broader market pipeline.',
      },
    ],
  },
  memetrader: {
    tag: 'Applied AI Engineer',
    status: 'Experimental',
    threads: ['Trading Systems'],
    shortDesc: 'Commissioned applied competency project for deterministic strategy evaluation and replayable market decisions.',
    connections: [
      {
        to: 'pulsetrade',
        type: 'evolved-into',
        note: 'Signal and run artifact patterns informed PulseTrade workflows.',
      },
    ],
  },
  laila: {
    tag: 'Applied AI Engineer',
    status: 'Core',
    threads: ['AI Platform', 'Automation & Reliability'],
    shortDesc: 'Next-generation assistant runtime unifying agency, Muninn memory, and identity continuity.',
    connections: [
      {
        to: 'muninn',
        type: 'shared-infra',
        note: 'Builds directly on Muninn-backed durable memory integration.',
      },
    ],
    oneLiner:
      'Standalone first-party assistant runtime combining orchestration patterns, Muninn-backed memory, and identity continuity for long-running interactions.',
    impact: 'Extends platform work into a unified runtime where agency, memory, and identity are deployed as one system.',
    bullets: [
      'Implemented laila CLI workflows for start, chat, once, smoke, and gate command paths.',
      'Integrated optional Muninn backend with strict mode and filesystem fallback controls.',
      'Added acceptance gate, identity smoke checks, and pytest suites for behavioral enforcement.',
    ],
    proof: 'Run `./acceptance_gate.sh`, `laila start`, and `pytest -q -m "not integration"` from the README.',
    tech: ['Python', 'Pytest', 'CLI', 'Muninn', 'HTML', 'JavaScript'],
  },
};

function run(cmd, args, options = {}) {
  const result = cp.spawnSync(cmd, args, {
    encoding: 'utf8',
    ...options,
  });
  if (result.status !== 0) {
    const stderr = (result.stderr || '').trim();
    const stdout = (result.stdout || '').trim();
    const output = stderr || stdout || `${cmd} failed`;
    throw new Error(output);
  }
  return result.stdout.trim();
}

function optionalRun(cmd, args, options = {}) {
  const result = cp.spawnSync(cmd, args, { encoding: 'utf8', ...options });
  return {
    ok: result.status === 0,
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim(),
  };
}

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function sentenceCount(text) {
  const matches = text.match(/[.!?](\s|$)/g);
  return matches ? matches.length : 0;
}

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function truncateSentence(text, maxWords = 20) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text.trim().replace(/\.+$/, '');
  return `${words.slice(0, maxWords).join(' ').replace(/\.+$/, '')}.`;
}

function firstSentence(text) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  const match = clean.match(/^[^.!?]+[.!?]?/);
  return match ? match[0].trim() : clean;
}

function detectTechFromFiles(files) {
  const tech = new Set();
  const joined = files.join('\n').toLowerCase();

  if (joined.includes('pyproject.toml') || joined.includes('requirements')) tech.add('Python');
  if (joined.includes('package.json')) tech.add('Node.js');
  if (joined.includes('docker-compose') || joined.includes('dockerfile')) tech.add('Docker');
  if (joined.includes('nginx.conf')) tech.add('Nginx');
  if (joined.includes('tests')) tech.add('Pytest');
  if (joined.includes('.github/workflows')) tech.add('GitHub Actions');

  return Array.from(tech);
}

function listEvidenceFiles(repoPath) {
  const targets = [];
  const readmeCandidates = fs
    .readdirSync(repoPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^readme/i.test(entry.name))
    .map((entry) => entry.name);

  targets.push(...readmeCandidates);

  const globList = [
    'docker-compose.yml',
    'docker-compose.yaml',
    'Dockerfile',
    'Makefile',
    'package.json',
    'pyproject.toml',
    'requirements.txt',
    'requirements-dev.txt',
  ];

  for (const name of globList) {
    if (fs.existsSync(path.join(repoPath, name))) targets.push(name);
  }

  const dirs = ['scripts', 'tests', 'test', '.github/workflows'];
  for (const dir of dirs) {
    const dirPath = path.join(repoPath, dir);
    if (!fs.existsSync(dirPath)) continue;
    const findResult = optionalRun('find', [dirPath, '-maxdepth', '2', '-type', 'f']);
    if (findResult.ok && findResult.stdout) {
      for (const line of findResult.stdout.split('\n')) {
        targets.push(path.relative(repoPath, line));
      }
    }
  }

  return Array.from(new Set(targets)).sort();
}

function collectSearchRoots() {
  const roots = ['/mnt/data', '/srv', '/opt'];
  const homeRoot = '/home';

  if (fs.existsSync(homeRoot)) {
    const users = fs
      .readdirSync(homeRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(homeRoot, entry.name));

    for (const userPath of users) {
      for (const suffix of ['src', 'code', 'repos']) {
        roots.push(path.join(userPath, suffix));
      }
    }
  }

  return Array.from(new Set(roots)).filter((root) => fs.existsSync(root));
}

function scanLocalGitRepos() {
  const repoEntries = [];
  const roots = collectSearchRoots();

  for (const root of roots) {
    const findResult = optionalRun('bash', [
      '-lc',
      `find ${shellQuote(root)} -type d -name .git -prune -print 2>/dev/null || true`,
    ]);
    if (!findResult.stdout) continue;

    for (const gitPath of findResult.stdout.split('\n').filter(Boolean)) {
      const repoPath = gitPath.replace(/\/.git$/, '');
      const remoteResult = optionalRun('git', ['-C', repoPath, 'remote', 'get-url', 'origin']);
      repoEntries.push({
        path: repoPath,
        remote: remoteResult.ok ? remoteResult.stdout : '',
      });
    }
  }

  repoEntries.sort((a, b) => a.path.localeCompare(b.path));
  return repoEntries;
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\"'\"'`)}'`;
}

function remoteMatches(remote, repoName) {
  if (!remote) return false;
  const lowerRemote = remote.toLowerCase();
  const target = `${OWNER.toLowerCase()}/${repoName.toLowerCase()}`;
  return lowerRemote.includes(`${target}.git`) || lowerRemote.includes(target);
}

function getLocalRepoUpdatedAt(repoPath) {
  const updated = optionalRun('git', ['-C', repoPath, 'log', '-1', '--date=format:%Y-%m-%d', '--format=%cd']);
  if (updated.ok && /^\d{4}-\d{2}-\d{2}$/.test(updated.stdout)) return updated.stdout;
  return new Date().toISOString().slice(0, 10);
}

function manualRepoEntries() {
  const entries = [];
  const lailaPath = '/mnt/data/LAILA';

  if (fs.existsSync(path.join(lailaPath, '.git'))) {
    entries.push({
      name: 'LAILA',
      nameWithOwner: `${OWNER}/LAILA`,
      visibility: 'PRIVATE',
      description:
        'Standalone first-party assistant runtime combining orchestration patterns, Muninn-backed memory, and identity continuity.',
      homepageUrl: '',
      url: '',
      updatedAt: getLocalRepoUpdatedAt(lailaPath),
      isArchived: false,
      isFork: false,
    });
  }

  return entries;
}

function fetchReposRaw() {
  const output = run('gh', [
    'repo',
    'list',
    OWNER,
    '--limit',
    '1000',
    '--json',
    'name,nameWithOwner,isPrivate,description,homepageUrl,url,updatedAt,isArchived,isFork',
  ]);

  const repos = JSON.parse(output)
    .filter((repo) => !EXCLUDED_REPOS.has(repo.name))
    .map((repo) => ({
      name: repo.name,
      nameWithOwner: repo.nameWithOwner,
      visibility: repo.isPrivate ? 'PRIVATE' : 'PUBLIC',
      description: repo.description || '',
      homepageUrl: repo.homepageUrl || '',
      url: repo.url,
      updatedAt: repo.updatedAt,
      isArchived: Boolean(repo.isArchived),
      isFork: Boolean(repo.isFork),
    }));

  for (const manual of manualRepoEntries()) {
    if (!repos.some((repo) => repo.name.toLowerCase() === manual.name.toLowerCase())) {
      repos.push(manual);
    }
  }

  repos.sort((a, b) => a.name.localeCompare(b.name));

  return repos;
}

function buildLocalMap(rawRepos) {
  fs.mkdirSync(CACHE_ROOT, { recursive: true });
  const localRepos = scanLocalGitRepos();

  const map = rawRepos.map((repo) => {
    const byRemote = localRepos.filter((entry) => remoteMatches(entry.remote, repo.name));
    byRemote.sort((a, b) => a.path.length - b.path.length);

    let selected = byRemote[0] || null;

    if (!selected) {
      const byBasename = localRepos.filter(
        (entry) => path.basename(entry.path).toLowerCase() === repo.name.toLowerCase(),
      );
      byBasename.sort((a, b) => a.path.length - b.path.length);
      selected = byBasename[0] || null;
    }

    let localPath = selected ? selected.path : null;
    let noLocalClone = false;

    if (!localPath && repo.visibility === 'PUBLIC') {
      const clonePath = path.join(CACHE_ROOT, repo.name);
      if (!fs.existsSync(path.join(clonePath, '.git'))) {
        const clone = optionalRun('gh', [
          'repo',
          'clone',
          `${OWNER}/${repo.name}`,
          clonePath,
          '--',
          '--depth=1',
        ]);
      }
      if (fs.existsSync(path.join(clonePath, '.git'))) {
        localPath = clonePath;
      }
    }

    if (!localPath && repo.visibility === 'PRIVATE') {
      noLocalClone = true;
    }

    return {
      name: repo.name,
      ownerRepo: repo.nameWithOwner,
      visibility: repo.visibility,
      local_path: localPath,
      no_local_clone: noLocalClone,
    };
  });

  return map;
}

function buildProjectCard(repo, localMapItem, previousByRepo) {
  const key = repo.name.toLowerCase();
  const ownerKey = repo.nameWithOwner.toLowerCase();
  const prev = previousByRepo.get(ownerKey) || null;
  const hint = metadataHints[key] || {};

  let evidenceFiles = [];
  let hasReadme = false;

  if (localMapItem.local_path && fs.existsSync(localMapItem.local_path)) {
    try {
      evidenceFiles = listEvidenceFiles(localMapItem.local_path);
      hasReadme = evidenceFiles.some((file) => /^readme/i.test(path.basename(file)));
    } catch {
      evidenceFiles = [];
    }
  }

  const fallbackOneLiner = repo.description
    ? truncateSentence(firstSentence(repo.description), 22)
    : 'Repository includes implementation scaffolding and operational scripts; detailed internals are available on request.';

  const fallbackImpact = hasReadme
    ? 'Documents a repeatable implementation path with runnable commands and operational context.'
    : 'Includes implementation scaffolding with details available in repository documentation.';

  const fallbackBullets = hasReadme
    ? [
        'Includes documented setup and runtime workflow.',
        'Contains implementation code and supporting scripts.',
        'Supports iterative improvement through repository-based execution patterns.',
      ]
    : [
        'Designed to support iterative implementation in this domain.',
        'Includes scaffolding for local setup and execution.',
        'Repo details are available on request.',
      ];

  const fallbackProof = hasReadme
    ? 'See README run commands and repository scripts for reproducible execution details.'
    : 'Repo details available on request.';

  const techFromEvidence = detectTechFromFiles(evidenceFiles);

  const oneLiner = prev?.oneLiner || hint.oneLiner || fallbackOneLiner;
  const impact = prev?.impact || hint.impact || fallbackImpact;
  const bullets =
    Array.isArray(prev?.bullets) && prev.bullets.length > 0
      ? prev.bullets
      : Array.isArray(hint.bullets) && hint.bullets.length > 0
        ? hint.bullets
        : fallbackBullets;
  const proof = prev?.proof || hint.proof || fallbackProof;
  const tech =
    Array.isArray(prev?.tech) && prev.tech.length > 0
      ? prev.tech.slice(0, 10)
      : Array.isArray(hint.tech) && hint.tech.length > 0
        ? hint.tech.slice(0, 10)
        : techFromEvidence.slice(0, 10);

  const tag = hint.tag || prev?.tag || 'Systems Builder';
  const status = hint.status || prev?.status || (repo.visibility === 'PRIVATE' ? 'Core' : 'Experimental');
  const threads = Array.from(new Set([...(hint.threads || prev?.threads || ['Automation & Reliability'])])).slice(0, 2);
  const connections = hint.connections || prev?.connections || [];
  const slug = hint.slug || prev?.slug || slugify(repo.name);
  const shortDesc = hint.shortDesc || prev?.shortDesc || truncateSentence(firstSentence(oneLiner), 20);

  const updatedAt = /^\d{4}-\d{2}-\d{2}$/.test((prev?.updatedAt || '').slice(0, 10))
    ? prev.updatedAt.slice(0, 10)
    : (repo.updatedAt || '').slice(0, 10);

  const links =
    repo.visibility === 'PRIVATE'
      ? {
          publicRepoUrl: null,
          requestAccess: true,
        }
      : {
          publicRepoUrl: repo.url,
          requestAccess: false,
        };

  return {
    name: repo.name,
    ownerRepo: repo.nameWithOwner,
    visibility: repo.visibility,
    slug,
    shortDesc,
    status,
    threads,
    connections,
    updatedAt,
    tag,
    oneLiner,
    impact,
    bullets,
    proof,
    tech,
    links,
  };
}

function validateProjects(projects) {
  const errors = [];
  const slugSet = new Set();

  projects.forEach((project, index) => {
    const prefix = `${index}:${project.ownerRepo}`;

    if (!project.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug)) {
      errors.push(`${prefix} invalid slug`);
    }
    if (EXCLUDED_SLUGS.has(project.slug)) {
      errors.push(`${prefix} excluded project leaked into generated output`);
    }
    if (slugSet.has(project.slug)) {
      errors.push(`${prefix} duplicate slug: ${project.slug}`);
    }
    slugSet.add(project.slug);

    if (!project.shortDesc || typeof project.shortDesc !== 'string') {
      errors.push(`${prefix} missing shortDesc`);
    } else {
      const sentenceTotal = sentenceCount(project.shortDesc);
      if (sentenceTotal > 1) errors.push(`${prefix} shortDesc must be one sentence`);
      if (project.shortDesc.includes('\n')) errors.push(`${prefix} shortDesc must be single-line`);
    }

    if (!STATUS_ORDER.includes(project.status)) {
      errors.push(`${prefix} invalid status`);
    }

    if (!VALID_TAGS.has(project.tag)) {
      errors.push(`${prefix} invalid tag`);
    }

    if (!Array.isArray(project.bullets) || project.bullets.length < 2 || project.bullets.length > 4) {
      errors.push(`${prefix} bullets must be length 2-4`);
    }

    if (!Array.isArray(project.tech) || project.tech.length > 10) {
      errors.push(`${prefix} tech must be <= 10`);
    }

    if (wordCount(project.oneLiner || '') > 22) {
      errors.push(`${prefix} oneLiner must be <= 22 words`);
    }

    if (!Array.isArray(project.threads) || project.threads.length === 0 || project.threads.length > 2) {
      errors.push(`${prefix} threads must contain 1-2 entries`);
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(project.updatedAt || '')) {
      errors.push(`${prefix} updatedAt must be YYYY-MM-DD`);
    }

    if (project.visibility === 'PRIVATE') {
      if (project.links.publicRepoUrl !== null || project.links.requestAccess !== true) {
        errors.push(`${prefix} private link policy violated`);
      }
    }

    if (project.visibility === 'PUBLIC') {
      if (!project.links.publicRepoUrl || project.links.requestAccess !== false) {
        errors.push(`${prefix} public link policy violated`);
      }
    }

    if (!Array.isArray(project.connections)) {
      errors.push(`${prefix} connections must be an array`);
    } else {
      for (const connection of project.connections) {
        if (!connection.to || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(connection.to)) {
          errors.push(`${prefix} invalid connection target`);
        }
        if (!VALID_CONNECTION_TYPES.has(connection.type)) {
          errors.push(`${prefix} invalid connection type: ${connection.type}`);
        }
        if (!connection.note || typeof connection.note !== 'string') {
          errors.push(`${prefix} invalid connection note`);
        }
      }
    }
  });

  if (errors.length > 0) {
    throw new Error(`Schema validation failed:\n${errors.map((item) => `- ${item}`).join('\n')}`);
  }
}

function validateFamilyTree(projects, familyTree) {
  if (!familyTree || typeof familyTree !== 'object') {
    throw new Error(`Family tree file is missing or invalid: ${path.relative(ROOT, FAMILY_TREE_PATH)}`);
  }

  if (!Array.isArray(familyTree.spine) || !Array.isArray(familyTree.branches) || !Array.isArray(familyTree.specialNodes)) {
    throw new Error(`Family tree must include spine, branches, and specialNodes arrays`);
  }

  const errors = [];
  const projectSlugs = new Set(projects.map((project) => project.slug));
  const renderedSlugs = [];
  const renderedSet = new Set();
  const branchIds = new Set();

  const addRenderedSlug = (slug, context) => {
    if (renderedSet.has(slug)) {
      errors.push(`familyTree duplicate rendered slug "${slug}" (${context})`);
      return;
    }
    renderedSet.add(slug);
    renderedSlugs.push(slug);
  };

  familyTree.spine.forEach((slug, index) => {
    if (typeof slug !== 'string' || !slug) {
      errors.push(`familyTree.spine[${index}] must be a slug string`);
      return;
    }
    if (EXCLUDED_SLUGS.has(slug)) {
      errors.push(`familyTree.spine[${index}] contains excluded slug "${slug}"`);
    }
    if (!projectSlugs.has(slug)) {
      errors.push(`familyTree.spine[${index}] references missing project "${slug}"`);
    }
    addRenderedSlug(slug, `spine[${index}]`);
  });

  familyTree.branches.forEach((branch, index) => {
    if (!branch || typeof branch !== 'object') {
      errors.push(`familyTree.branches[${index}] must be an object`);
      return;
    }

    const from = String(branch.from || '');
    const label = String(branch.label || '');
    const nodes = Array.isArray(branch.nodes) ? branch.nodes : [];
    const branchId = `${from}|${label}`;

    if (!from) errors.push(`familyTree.branches[${index}] missing from`);
    if (!label) errors.push(`familyTree.branches[${index}] missing label`);
    if (!Array.isArray(branch.nodes)) errors.push(`familyTree.branches[${index}] nodes must be an array`);

    if (branchIds.has(branchId)) {
      errors.push(`familyTree.branches[${index}] duplicates branch "${branchId}"`);
    }
    branchIds.add(branchId);

    if (EXCLUDED_SLUGS.has(from)) {
      errors.push(`familyTree.branches[${index}] from references excluded slug "${from}"`);
    }
    if (!projectSlugs.has(from)) {
      errors.push(`familyTree.branches[${index}] from references missing project "${from}"`);
    }

    nodes.forEach((slug, nodeIndex) => {
      if (typeof slug !== 'string' || !slug) {
        errors.push(`familyTree.branches[${index}].nodes[${nodeIndex}] must be a slug string`);
        return;
      }
      if (EXCLUDED_SLUGS.has(slug)) {
        errors.push(`familyTree.branches[${index}].nodes[${nodeIndex}] contains excluded slug "${slug}"`);
      }
      if (!projectSlugs.has(slug)) {
        errors.push(`familyTree.branches[${index}].nodes[${nodeIndex}] references missing project "${slug}"`);
      }
      addRenderedSlug(slug, `branches[${index}].nodes[${nodeIndex}]`);
    });
  });

  familyTree.specialNodes.forEach((node, index) => {
    const slug = String(node?.slug || '');
    if (!slug) {
      errors.push(`familyTree.specialNodes[${index}] missing slug`);
      return;
    }
    if (EXCLUDED_SLUGS.has(slug)) {
      errors.push(`familyTree.specialNodes[${index}] contains excluded slug "${slug}"`);
    }
    if (!projectSlugs.has(slug)) {
      errors.push(`familyTree.specialNodes[${index}] references missing project "${slug}"`);
    }
  });

  for (const excludedSlug of EXCLUDED_SLUGS) {
    if (projectSlugs.has(excludedSlug)) {
      errors.push(`excluded slug leaked into projects.generated.json: "${excludedSlug}"`);
    }
    if (renderedSet.has(excludedSlug)) {
      errors.push(`excluded slug leaked into family tree render set: "${excludedSlug}"`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Family tree validation failed:\n${errors.map((item) => `- ${item}`).join('\n')}`);
  }
}

function equalJsonFile(filePath, value) {
  if (!fs.existsSync(filePath)) return false;
  try {
    const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return JSON.stringify(existing) === JSON.stringify(value);
  } catch {
    return false;
  }
}

function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const reposRaw = fetchReposRaw();
  const localMap = buildLocalMap(reposRaw);

  const previousGenerated = readJson(GENERATED_PATH, []);
  const previousByRepo = new Map(
    (Array.isArray(previousGenerated) ? previousGenerated : []).map((project) => [
      String(project.ownerRepo || '').toLowerCase(),
      project,
    ]),
  );

  const localByOwner = new Map(localMap.map((entry) => [entry.ownerRepo.toLowerCase(), entry]));

  const generated = reposRaw
    .map((repo) => buildProjectCard(repo, localByOwner.get(repo.nameWithOwner.toLowerCase()), previousByRepo))
    .sort((a, b) => a.name.localeCompare(b.name));

  validateProjects(generated);
  const familyTree = readJson(FAMILY_TREE_PATH, null);
  validateFamilyTree(generated, familyTree);

  if (checkOnly) {
    const mismatches = [];

    if (!equalJsonFile(RAW_PATH, reposRaw)) mismatches.push(path.relative(ROOT, RAW_PATH));
    if (!equalJsonFile(LOCALMAP_PATH, localMap)) mismatches.push(path.relative(ROOT, LOCALMAP_PATH));
    if (!equalJsonFile(GENERATED_PATH, generated)) mismatches.push(path.relative(ROOT, GENERATED_PATH));

    if (mismatches.length > 0) {
      throw new Error(`Generated files are out of date: ${mismatches.join(', ')}`);
    }

    console.log('projects catalog check passed');
    return;
  }

  writeJson(RAW_PATH, reposRaw);
  writeJson(LOCALMAP_PATH, localMap);
  writeJson(GENERATED_PATH, generated);

  console.log(
    JSON.stringify(
      {
        totalReposFound: reposRaw.length + EXCLUDED_REPOS.size,
        excluded: EXCLUDED_REPOS.size,
        generatedProjects: generated.length,
        privateProjects: generated.filter((project) => project.visibility === 'PRIVATE').length,
      },
      null,
      2,
    ),
  );
}

try {
  main();
} catch (error) {
  console.error(error.message || String(error));
  process.exit(1);
}
