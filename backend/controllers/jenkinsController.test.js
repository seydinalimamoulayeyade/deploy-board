/**
 * Tests unitaires pour jenkinsController
 * Vérifie la validation des requêtes, la gestion des erreurs et la
 * logique de pagination des logs de build.
 *
 * Le service jenkinsService est remplacé par un mock afin de tester
 * uniquement la logique du contrôleur, sans appel réseau réel.
 */

const jenkinsService = require('../services/jenkinsService');
const ApiError = require('../utils/ApiError');

// Remplace les méthodes du service par des mocks contrôlables
const mockResponses = {};
jenkinsService.getAllJobs = async (env) => mockResponses.getAllJobs(env);
jenkinsService.getBuildDetails = async (job, num) => mockResponses.getBuildDetails(job, num);
jenkinsService.getBuildLog = async (job, num, start) => mockResponses.getBuildLog(job, num, start);
jenkinsService.replayBuild = async (job, num) => mockResponses.replayBuild(job, num);
jenkinsService.getStableBuilds = async (job, count) => mockResponses.getStableBuilds(job, count);

const controller = require('./jenkinsController');

console.log('=== jenkinsController Unit Tests ===\n');

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.log(`  ✗ ${label}`);
  }
}

// Crée un objet réponse factice qui capture le statut et le corps JSON
function createRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

// Exécute un handler et capture l'éventuelle erreur passée à next()
async function run(handler, req) {
  const res = createRes();
  let nextError = null;
  await handler(req, res, (err) => {
    nextError = err;
  });
  return { res, nextError };
}

(async () => {
  // ----------------------------------------------------------------------
  // getAllPipelines
  // ----------------------------------------------------------------------
  console.log('Test: getAllPipelines - succès');
  mockResponses.getAllJobs = async () => [{ id: 'job-dev', name: 'job-dev' }];
  {
    const { res, nextError } = await run(controller.getAllPipelines, { query: {} });
    assert('Statut 200', res.statusCode === 200);
    assert('Format de réponse success', res.body.status === 'success');
    assert('Pipelines renvoyés', Array.isArray(res.body.data.pipelines) && res.body.data.pipelines.length === 1);
    assert('Aucune erreur', nextError === null);
  }
  console.log();

  console.log('Test: getAllPipelines - environnement invalide');
  {
    const { res, nextError } = await run(controller.getAllPipelines, { query: { environment: 'invalid' } });
    assert('Erreur transmise à next', nextError instanceof ApiError);
    assert('Statut 400', nextError && nextError.statusCode === 400);
    assert('Pas de réponse envoyée', res.statusCode === null);
  }
  console.log();

  console.log('Test: getAllPipelines - environnement valide transmis au service');
  {
    let capturedEnv = null;
    mockResponses.getAllJobs = async (env) => { capturedEnv = env; return []; };
    await run(controller.getAllPipelines, { query: { environment: 'production' } });
    assert('Environnement transmis au service', capturedEnv === 'production');
  }
  console.log();

  // ----------------------------------------------------------------------
  // getBuildDetails
  // ----------------------------------------------------------------------
  console.log('Test: getBuildDetails - succès');
  mockResponses.getBuildDetails = async () => ({ buildNumber: 42, status: 'SUCCESS' });
  {
    const { res, nextError } = await run(controller.getBuildDetails, {
      params: { jobName: 'frontend-deploy', buildNumber: '42' }
    });
    assert('Statut 200', res.statusCode === 200);
    assert('Données du build renvoyées', res.body.data.buildNumber === 42);
    assert('Aucune erreur', nextError === null);
  }
  console.log();

  console.log('Test: getBuildDetails - numéro de build invalide');
  {
    const { nextError } = await run(controller.getBuildDetails, {
      params: { jobName: 'frontend-deploy', buildNumber: 'abc' }
    });
    assert('Erreur 400 pour numéro invalide', nextError instanceof ApiError && nextError.statusCode === 400);
  }
  console.log();

  console.log('Test: getBuildDetails - nom de job manquant');
  {
    const { nextError } = await run(controller.getBuildDetails, {
      params: { jobName: '', buildNumber: '42' }
    });
    assert('Erreur 400 pour job manquant', nextError instanceof ApiError && nextError.statusCode === 400);
  }
  console.log();

  // ----------------------------------------------------------------------
  // getBuildLog - pagination (1000 lignes par page)
  // ----------------------------------------------------------------------
  console.log('Test: getBuildLog - pagination par défaut (1000 lignes)');
  // Génère un log de 2547 lignes
  const totalTestLines = 2547;
  const bigLog = Array.from({ length: totalTestLines }, (_, i) => `ligne ${i + 1}`).join('\n');
  mockResponses.getBuildLog = async () => ({ text: bigLog, hasMore: false });
  {
    const { res } = await run(controller.getBuildLog, {
      params: { jobName: 'frontend-deploy', buildNumber: '42' },
      query: {}
    });
    assert('Statut 200', res.statusCode === 200);
    assert('1000 lignes sur la page 1', res.body.data.log.length === 1000);
    assert('Première ligne correcte', res.body.data.log[0] === 'ligne 1');
    assert('Total de lignes correct', res.body.data.pagination.totalLines === totalTestLines);
    assert('Nombre de pages = 3', res.body.data.pagination.totalPages === 3);
    assert('Page courante = 1', res.body.data.pagination.currentPage === 1);
  }
  console.log();

  console.log('Test: getBuildLog - dernière page partielle');
  {
    const { res } = await run(controller.getBuildLog, {
      params: { jobName: 'frontend-deploy', buildNumber: '42' },
      query: { page: '3' }
    });
    // 2547 - 2000 = 547 lignes sur la page 3
    assert('547 lignes sur la dernière page', res.body.data.log.length === 547);
    assert('Première ligne de la page 3', res.body.data.log[0] === 'ligne 2001');
  }
  console.log();

  console.log('Test: getBuildLog - page hors limites');
  {
    const { nextError } = await run(controller.getBuildLog, {
      params: { jobName: 'frontend-deploy', buildNumber: '42' },
      query: { page: '99' }
    });
    assert('Erreur 404 pour page hors limites', nextError instanceof ApiError && nextError.statusCode === 404);
  }
  console.log();

  console.log('Test: getBuildLog - log vide');
  mockResponses.getBuildLog = async () => ({ text: '', hasMore: false });
  {
    const { res } = await run(controller.getBuildLog, {
      params: { jobName: 'frontend-deploy', buildNumber: '42' },
      query: {}
    });
    assert('Log vide renvoie 0 ligne', res.body.data.log.length === 0);
    assert('Total de lignes = 0', res.body.data.pagination.totalLines === 0);
    assert('Au moins 1 page', res.body.data.pagination.totalPages === 1);
  }
  console.log();

  console.log('Test: getBuildLog - pageSize personnalisé');
  mockResponses.getBuildLog = async () => ({ text: bigLog, hasMore: false });
  {
    const { res } = await run(controller.getBuildLog, {
      params: { jobName: 'frontend-deploy', buildNumber: '42' },
      query: { pageSize: '500' }
    });
    assert('500 lignes avec pageSize=500', res.body.data.log.length === 500);
    assert('6 pages avec pageSize=500', res.body.data.pagination.totalPages === 6);
  }
  console.log();

  console.log('Test: getBuildLog - paramètre page invalide');
  {
    const { nextError } = await run(controller.getBuildLog, {
      params: { jobName: 'frontend-deploy', buildNumber: '42' },
      query: { page: '-1' }
    });
    assert('Erreur 400 pour page négative', nextError instanceof ApiError && nextError.statusCode === 400);
  }
  console.log();

  // ----------------------------------------------------------------------
  // triggerBuild
  // ----------------------------------------------------------------------
  console.log('Test: triggerBuild - succès');
  mockResponses.replayBuild = async () => ({
    message: 'Build replay triggered',
    queueUrl: 'http://jenkins:8080/queue/item/123',
    queueId: '123',
    originalBuildNumber: 42
  });
  {
    const { res, nextError } = await run(controller.triggerBuild, {
      params: { jobName: 'frontend-deploy', buildNumber: '42' }
    });
    assert('Statut 202', res.statusCode === 202);
    assert('Message renvoyé', res.body.data.message === 'Build replay triggered');
    assert('queueId renvoyé', res.body.data.queueId === '123');
    assert('Aucune erreur', nextError === null);
  }
  console.log();

  console.log('Test: triggerBuild - numéro de build invalide');
  {
    const { nextError } = await run(controller.triggerBuild, {
      params: { jobName: 'frontend-deploy', buildNumber: '0' }
    });
    assert('Erreur 400 pour build 0', nextError instanceof ApiError && nextError.statusCode === 400);
  }
  console.log();

  // ----------------------------------------------------------------------
  // getStableBuilds
  // ----------------------------------------------------------------------
  console.log('Test: getStableBuilds - succès avec count par défaut');
  {
    let capturedCount = null;
    mockResponses.getStableBuilds = async (job, count) => {
      capturedCount = count;
      return [{ number: 42 }, { number: 40 }];
    };
    const { res, nextError } = await run(controller.getStableBuilds, {
      params: { jobName: 'frontend-deploy' },
      query: {}
    });
    assert('Statut 200', res.statusCode === 200);
    assert('count par défaut = 5', capturedCount === 5);
    assert('builds renvoyés', res.body.data.builds.length === 2);
    assert('Aucune erreur', nextError === null);
  }
  console.log();

  console.log('Test: getStableBuilds - count plafonné à 10');
  {
    let capturedCount = null;
    mockResponses.getStableBuilds = async (job, count) => {
      capturedCount = count;
      return [];
    };
    await run(controller.getStableBuilds, {
      params: { jobName: 'frontend-deploy' },
      query: { count: '50' }
    });
    assert('count plafonné à 10', capturedCount === 10);
  }
  console.log();

  console.log('Test: getStableBuilds - propagation des erreurs du service');
  {
    mockResponses.getStableBuilds = async () => {
      throw new ApiError(503, 'Jenkins est injoignable');
    };
    const { nextError } = await run(controller.getStableBuilds, {
      params: { jobName: 'frontend-deploy' },
      query: {}
    });
    assert('Erreur 503 propagée à next', nextError instanceof ApiError && nextError.statusCode === 503);
  }
  console.log();

  // ----------------------------------------------------------------------
  // Résumé
  // ----------------------------------------------------------------------
  console.log('=== Résumé ===');
  console.log(`Réussis : ${passed}`);
  console.log(`Échoués : ${failed}`);
  console.log(failed === 0 ? '\n✅ TOUS LES TESTS PASSENT' : '\n❌ CERTAINS TESTS ÉCHOUENT');

  process.exit(failed === 0 ? 0 : 1);
})();
