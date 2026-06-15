/**
 * Suite de tests d'intégration du Deploy Board
 * Utilise le runner de test natif de Node.js (node:test) — aucune dépendance externe.
 *
 * Lancement : node --test tests/
 *
 * Ces tests vérifient le comportement de l'API sans nécessiter d'instances
 * Jenkins/SonarQube réelles : ils valident le routage, la validation des
 * entrées et la dégradation gracieuse (Req 13.1, 13.2).
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');

process.env.NODE_ENV = 'test';
process.env.JENKINS_URL = 'http://127.0.0.1:0'; // injoignable volontairement
process.env.SONARQUBE_URL = 'http://127.0.0.1:0';

const app = require('../app');

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

/** Petit helper de requête HTTP */
function request(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request(`${baseUrl}${path}`, { method }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch { /* corps non-JSON */ }
        resolve({ status: res.statusCode, body: json });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

test('GET /health retourne 200 avec l\'état des services', async () => {
  const res = await request('/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.status, 'OK');
  assert.ok(res.body.services, 'doit inclure l\'état des services');
  assert.ok('mongodb' in res.body.services);
  assert.ok('jenkins' in res.body.services);
});

test('GET /api/jenkins/pipelines gère Jenkins indisponible (Req 13.1)', async () => {
  const res = await request('/api/jenkins/pipelines');
  // Jenkins injoignable -> erreur 503 propagée par le contrôleur
  assert.ok([502, 503, 500].includes(res.status), `statut inattendu: ${res.status}`);
  assert.ok(res.body && res.body.message, 'doit retourner un message d\'erreur');
});

test('GET /api/jenkins/build/:job/:num valide le numéro de build', async () => {
  const res = await request('/api/jenkins/build/mon-job/abc');
  assert.strictEqual(res.status, 400);
  assert.match(res.body.message, /invalide/i);
});

test('GET /api/sonarqube/metrics/:key dégrade gracieusement (Req 13.2)', async () => {
  const res = await request('/api/sonarqube/metrics/mon-projet');
  // SonarQube injoignable -> réponse 200 avec available:false
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.available, false);
});

test('POST /api/deployments valide les champs requis', async () => {
  const res = await request('/api/deployments', 'POST');
  assert.strictEqual(res.status, 400);
  assert.match(res.body.message, /requis/i);
});

test('Route inconnue retourne 404', async () => {
  const res = await request('/api/inconnu');
  assert.strictEqual(res.status, 404);
});
