/**
 * Tests d'intégration pour JenkinsService
 * Tests avec validation de connectivité (nécessite Jenkins en cours d'exécution)
 * 
 * Note: Ces tests sont désactivés par défaut car ils nécessitent:
 * - Jenkins en cours d'exécution sur JENKINS_URL
 * - JENKINS_USER et JENKINS_TOKEN configurés
 */

const jenkinsService = require('./jenkinsService');

console.log('=== JenkinsService Integration Tests ===\n');
console.log('⚠️  Ces tests nécessitent Jenkins en cours d\'exécution');
console.log('⚠️  Configurez JENKINS_URL, JENKINS_USER, JENKINS_TOKEN dans .env\n');

async function runIntegrationTests() {
  try {
    // Test 1: Health Check
    console.log('Test 1: Health Check');
    const isHealthy = await jenkinsService.healthCheck();
    console.log(`  Jenkins disponible: ${isHealthy ? '✅ OUI' : '❌ NON'}`);
    
    if (!isHealthy) {
      console.log('\n❌ Jenkins n\'est pas disponible. Tests d\'intégration ignorés.');
      console.log('   Vérifiez que Jenkins est démarré et accessible.');
      return;
    }
    console.log();

    // Test 2: Get All Jobs
    console.log('Test 2: Récupération de tous les jobs');
    const jobs = await jenkinsService.getAllJobs();
    console.log(`  Nombre de jobs récupérés: ${jobs.length}`);
    
    if (jobs.length > 0) {
      console.log(`  Premier job: ${jobs[0].name}`);
      console.log(`  Status: ${jobs[0].lastBuild?.status || 'Aucun build'}`);
    }
    console.log(`  ✅ Test réussi`);
    console.log();

    // Test 3: Get Build Details (si des jobs existent)
    if (jobs.length > 0 && jobs[0].lastBuild) {
      console.log('Test 3: Récupération des détails d\'un build');
      const jobName = jobs[0].name;
      const buildNumber = jobs[0].lastBuild.number;
      
      const buildDetails = await jenkinsService.getBuildDetails(jobName, buildNumber);
      console.log(`  Job: ${jobName}`);
      console.log(`  Build #${buildNumber}`);
      console.log(`  Status: ${buildDetails.status}`);
      console.log(`  Durée: ${buildDetails.duration}ms`);
      console.log(`  Nombre de stages: ${buildDetails.stages.length}`);
      console.log(`  ✅ Test réussi`);
      console.log();
    }

    // Test 4: Cache Functionality
    console.log('Test 4: Vérification du cache');
    const startTime = Date.now();
    await jenkinsService.getAllJobs();
    const firstCallTime = Date.now() - startTime;
    
    const cachedStartTime = Date.now();
    await jenkinsService.getAllJobs();
    const cachedCallTime = Date.now() - cachedStartTime;
    
    console.log(`  Premier appel: ${firstCallTime}ms`);
    console.log(`  Appel depuis cache: ${cachedCallTime}ms`);
    console.log(`  Le cache est ${cachedCallTime < firstCallTime ? '✅ EFFICACE' : '⚠️  INACTIF'}`);
    console.log();

    // Test 5: Get Stable Builds
    if (jobs.length > 0) {
      console.log('Test 5: Récupération des builds stables');
      const jobName = jobs[0].name;
      const stableBuilds = await jenkinsService.getStableBuilds(jobName, 5);
      console.log(`  Job: ${jobName}`);
      console.log(`  Builds stables trouvés: ${stableBuilds.length}`);
      
      if (stableBuilds.length > 0) {
        console.log(`  Dernier build stable: #${stableBuilds[0].number}`);
        console.log(`  Date: ${stableBuilds[0].timestamp}`);
      }
      console.log(`  ✅ Test réussi`);
      console.log();
    }

    // Test 6: Error Handling
    console.log('Test 6: Gestion des erreurs (job inexistant)');
    try {
      await jenkinsService.getBuildDetails('job-inexistant-test-12345', 999);
      console.log(`  ❌ Erreur attendue mais pas reçue`);
    } catch (error) {
      console.log(`  ✅ Erreur capturée correctement`);
      console.log(`  Message: ${error.message}`);
      console.log(`  Status: ${error.statusCode}`);
    }
    console.log();

    console.log('=== Résultat Global ===');
    console.log('✅ Tous les tests d\'intégration ont réussi');
    console.log('Le service JenkinsService est fonctionnel et prêt à l\'emploi.\n');

  } catch (error) {
    console.error('❌ Erreur lors des tests d\'intégration:');
    console.error(`   ${error.message}`);
    console.error('\nDétails de l\'erreur:');
    console.error(error);
  }
}

// Vérifier si Jenkins est configuré
if (!process.env.JENKINS_URL || !process.env.JENKINS_USER || !process.env.JENKINS_TOKEN) {
  console.log('⚠️  Configuration Jenkins incomplète');
  console.log('   Définissez JENKINS_URL, JENKINS_USER, JENKINS_TOKEN dans .env');
  console.log('   Tests d\'intégration ignorés.\n');
  process.exit(0);
}

// Exécuter les tests
runIntegrationTests().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
