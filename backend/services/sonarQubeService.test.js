/**
 * Tests unitaires pour SonarQubeService
 * Vérifie :
 * - La configuration du client axios (auth par token, timeout)
 * - La normalisation des notes (1-5 -> A-E)
 * - La normalisation du statut du quality gate (OK/ERROR -> PASSED/FAILED)
 * - La transformation des mesures au format interne
 * - Le calcul des tendances (courant vs précédent)
 * - La gestion des erreurs avec messages en français
 */

const sonarQubeService = require('./sonarQubeService');
const cacheService = require('./cacheService');
const ApiError = require('../utils/ApiError');

console.log('=== Tests unitaires SonarQubeService ===\n');

let allPassed = true;
const assert = (label, condition) => {
  if (!condition) allPassed = false;
  console.log(`  ${condition ? '✓' : '✗'} ${label}: ${condition ? 'PASS' : 'FAIL'}`);
};

// Test 1 : Configuration du client axios
console.log('Test 1 : Configuration du client axios');
assert('Timeout de 30 secondes (exigence 10.7)', sonarQubeService.client.defaults.timeout === 30000);
assert('En-tête d\'authentification configuré (exigence 10.4)', !!sonarQubeService.client.defaults.headers.Authorization);
console.log();

// Test 2 : Normalisation des notes (exigence 4.2)
console.log('Test 2 : Normalisation des notes (1.0-5.0 -> A-E)');
assert('1 -> A', sonarQubeService.normalizeRating('1.0') === 'A');
assert('2 -> B', sonarQubeService.normalizeRating(2) === 'B');
assert('3 -> C', sonarQubeService.normalizeRating('3.0') === 'C');
assert('4 -> D', sonarQubeService.normalizeRating(4) === 'D');
assert('5 -> E', sonarQubeService.normalizeRating('5.0') === 'E');
assert('undefined -> N/A', sonarQubeService.normalizeRating(undefined) === 'N/A');
console.log();

// Test 3 : Normalisation du statut du quality gate (exigence 4.7)
console.log('Test 3 : Normalisation du statut du quality gate');
assert('OK -> PASSED', sonarQubeService.normalizeQualityGateStatus('OK') === 'PASSED');
assert('ERROR -> FAILED', sonarQubeService.normalizeQualityGateStatus('ERROR') === 'FAILED');
assert('WARN -> FAILED', sonarQubeService.normalizeQualityGateStatus('WARN') === 'FAILED');
assert('NONE -> FAILED', sonarQubeService.normalizeQualityGateStatus('NONE') === 'FAILED');
assert('undefined -> FAILED', sonarQubeService.normalizeQualityGateStatus(undefined) === 'FAILED');
console.log();

// Test 4 : Transformation des mesures (exigences 4.2, 4.3, 4.4, 4.5)
console.log('Test 4 : Transformation des mesures au format interne');
const mockMeasures = [
  { metric: 'bugs', value: '2' },
  { metric: 'code_smells', value: '15' },
  { metric: 'coverage', value: '78.5' },
  { metric: 'reliability_rating', value: '1.0' }
];
const trends = { bugs: -1, codeSmells: 0, coverage: 2.3 };
const result = sonarQubeService.transformMetricsResponse('frontend-deploy', mockMeasures, 'PASSED', trends);

assert('projectKey conservé', result.projectKey === 'frontend-deploy');
assert('rating = A', result.rating === 'A');
assert('bugs = 2 (numérique)', result.bugs === 2);
assert('codeSmells = 15 (numérique)', result.codeSmells === 15);
assert('coverage = 78.5', result.coverage === 78.5);
assert('qualityGateStatus = PASSED', result.qualityGateStatus === 'PASSED');
assert('trends inclus', result.trends.bugs === -1 && result.trends.coverage === 2.3);
console.log();

// Test 5 : Couverture absente (exigence 4.5 - WHERE Test_Coverage is available)
console.log('Test 5 : Couverture absente gérée correctement');
const noCoverage = sonarQubeService.transformMetricsResponse('p', [{ metric: 'bugs', value: '0' }], 'PASSED', null);
assert('coverage = null quand absente', noCoverage.coverage === null);
assert('trends par défaut quand null', noCoverage.trends.bugs === 0);
console.log();

// Test 6 : Conversions numériques sûres
console.log('Test 6 : Conversions numériques sûres');
assert('parseInteger valeur invalide -> 0', sonarQubeService.parseInteger('abc') === 0);
assert('parseInteger undefined -> 0', sonarQubeService.parseInteger(undefined) === 0);
assert('parseNumeric "12.34" -> 12.34', sonarQubeService.parseNumeric('12.34') === 12.34);
assert('roundTrend(2.345) -> 2.3', sonarQubeService.roundTrend(2.345) === 2.3);
console.log();

// Test 7 : Gestion des erreurs avec messages en français (exigence 13.2)
console.log('Test 7 : Gestion des erreurs avec messages en français');
const errorCases = [
  { name: 'Injoignable', error: { request: {}, message: 'Network Error' }, status: 503, contains: 'injoignable' },
  { name: 'Authentification', error: { response: { status: 401 } }, status: 401, contains: 'Authentification' },
  { name: 'Introuvable', error: { response: { status: 404 } }, status: 404, contains: 'introuvable' },
  { name: 'Serveur', error: { response: { status: 500 } }, status: 500, contains: 'serveur' }
];
for (const c of errorCases) {
  const err = sonarQubeService.handleError(c.error);
  const ok = err instanceof ApiError &&
    err.statusCode === c.status &&
    err.message.toLowerCase().includes(c.contains.toLowerCase());
  assert(`${c.name} -> ${c.status}`, ok);
}
console.log();

// Test 8 : Intégration du cache (exigence 13.4 - TTL 60s)
console.log('Test 8 : Intégration du cache');
cacheService.clear();
cacheService.set('sonarqube:test', { v: 1 }, 60);
assert('Valeur mise en cache récupérable', cacheService.get('sonarqube:test') !== null);
assert('Âge du cache suivi', cacheService.getAge('sonarqube:test') !== null);
cacheService.clear();
console.log();

// Résumé
console.log('=== Résumé ===');
console.log(`Statut global : ${allPassed ? '✅ TOUS LES TESTS PASSENT' : '❌ DES TESTS ÉCHOUENT'}`);

process.exit(allPassed ? 0 : 1);
