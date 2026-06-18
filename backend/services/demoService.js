/**
 * Service de données de démonstration.
 * Activé via DEMO_MODE=true : l'application reste pleinement consultable
 * même si Jenkins / SonarQube / MongoDB ne sont pas joignables.
 */

const isDemo = () => process.env.DEMO_MODE === 'true';

const now = Date.now();
const iso = (offsetMs) => new Date(now - offsetMs).toISOString();

const PIPELINES = [
  {
    id: 'deploy-board', name: 'deploy-board', displayName: 'Deploy Board', environment: 'production',
    url: '#', lastBuild: { number: 128, status: 'SUCCESS', duration: 184000, timestamp: iso(2 * 3600e3), branch: 'main', commitSha: 'a1b2c3d', author: 'Seydina YADE' },
    qualityMetrics: { projectKey: 'deploy-board', rating: 'A', bugs: 0, codeSmells: 12, vulnerabilities: 0, coverage: 81.4, qualityGateStatus: 'PASSED', trends: { bugs: -2, codeSmells: -3, coverage: 1.5 } },
  },
  {
    id: 'api-gateway', name: 'api-gateway', displayName: 'API Gateway', environment: 'staging',
    url: '#', lastBuild: { number: 64, status: 'RUNNING', duration: 0, timestamp: iso(60e3), branch: 'release/2.1', commitSha: 'f9e8d7c', author: 'Awa Ndiaye' },
    qualityMetrics: { projectKey: 'api-gateway', rating: 'B', bugs: 1, codeSmells: 34, vulnerabilities: 0, coverage: 67.2, qualityGateStatus: 'PASSED', trends: { bugs: 0, codeSmells: 5, coverage: -0.8 } },
  },
  {
    id: 'web-client', name: 'web-client', displayName: 'Web Client', environment: 'dev',
    url: '#', lastBuild: { number: 207, status: 'FAILED', duration: 92000, timestamp: iso(5 * 3600e3), branch: 'feature/login', commitSha: '4d5e6f7', author: 'Moussa Ba' },
    qualityMetrics: { projectKey: 'web-client', rating: 'C', bugs: 4, codeSmells: 58, vulnerabilities: 2, coverage: 45.0, qualityGateStatus: 'FAILED', trends: { bugs: 2, codeSmells: 9, coverage: -3.1 } },
  },
];

const STAGES = [
  { name: 'checkout', duration: 4000, status: 'SUCCESS' },
  { name: 'install', duration: 38000, status: 'SUCCESS' },
  { name: 'test', duration: 61000, status: 'SUCCESS' },
  { name: 'sonar', duration: 22000, status: 'SUCCESS' },
  { name: 'quality gate', duration: 5000, status: 'SUCCESS' },
  { name: 'docker build', duration: 30000, status: 'SUCCESS' },
  { name: 'docker push', duration: 14000, status: 'SUCCESS' },
  { name: 'deploy', duration: 10000, status: 'SUCCESS' },
];

const buildLog = () => {
  const lines = [
    'Started by GitHub push by Seydina YADE',
    'Cloning repository https://github.com/org/deploy-board.git',
    '> git checkout main',
    '+ npm install',
    'added 312 packages in 12s',
    '+ npm test',
    'Test Suites: 6 passed, 6 total',
    'Tests:       18 passed, 18 total',
    '+ sonar-scanner',
    'INFO: Analysis successful',
    'Quality Gate: PASSED',
    '+ docker build -t deploy-board:128 .',
    'Successfully built image deploy-board:128',
    '+ docker push deploy-board:128',
    'Deploy terminé avec succès ✅',
  ];
  return { text: lines.join('\n'), hasMore: false, nextStart: 0, size: 0 };
};

const getPipelines = (environment) =>
  environment ? PIPELINES.filter((p) => p.environment === environment) : PIPELINES;

const getBuildDetails = (jobName, buildNumber) => ({
  buildNumber: Number(buildNumber),
  status: 'SUCCESS',
  duration: 184000,
  timestamp: iso(2 * 3600e3),
  stages: STAGES,
  artifacts: [{ name: `${jobName}-${buildNumber}.tar.gz`, size: 2048576, url: '#' }],
  commit: { sha: 'a1b2c3d', author: 'Seydina YADE', message: 'Mise à jour du tableau de bord', url: 'https://github.com/org/deploy-board/commit/a1b2c3d' },
});

const getStableBuilds = (jobName, count = 5) =>
  Array.from({ length: count }, (_, i) => ({
    number: 128 - i * 2,
    timestamp: iso((i + 1) * 24 * 3600e3),
    commitSha: ['a1b2c3d', 'b2c3d4e', 'c3d4e5f', 'd4e5f6a', 'e5f6a7b'][i] || 'abcdef0',
  }));

const getSonarMetrics = (projectKey) => {
  const p = PIPELINES.find((x) => x.name === projectKey);
  return p ? p.qualityMetrics : { projectKey, rating: 'A', bugs: 0, codeSmells: 5, vulnerabilities: 0, coverage: 75, qualityGateStatus: 'PASSED', trends: { bugs: 0, codeSmells: 0, coverage: 0 } };
};

const getHistory = (pipelineId) => {
  const statuses = ['SUCCESS', 'SUCCESS', 'FAILED', 'SUCCESS', 'SUCCESS', 'ABORTED', 'SUCCESS'];
  const builds = statuses.map((status, i) => ({
    _id: `demo-${i}`, pipelineId, buildNumber: 128 - i, status,
    duration: 150000 + i * 12000, timestamp: iso(i * 24 * 3600e3),
    environment: 'production', commitSha: 'a1b2c3d', commitAuthor: 'Seydina YADE',
  }));
  const success = builds.filter((b) => b.status === 'SUCCESS').length;
  return {
    builds,
    stats: { totalBuilds: builds.length, successRate: ((success / builds.length) * 100).toFixed(2), avgDuration: 178000 },
    pagination: { currentPage: 1, totalPages: 1, totalItems: builds.length },
  };
};

const getEnvironmentStatus = (environment) => {
  const p = PIPELINES.find((x) => x.environment === environment) || PIPELINES[0];
  return [{
    pipelineId: p.name, buildNumber: p.lastBuild.number, status: p.lastBuild.status,
    timestamp: p.lastBuild.timestamp, environment, commitSha: p.lastBuild.commitSha,
  }];
};

module.exports = {
  isDemo,
  getPipelines,
  getBuildDetails,
  buildLog,
  getStableBuilds,
  getSonarMetrics,
  getHistory,
  getEnvironmentStatus,
};
