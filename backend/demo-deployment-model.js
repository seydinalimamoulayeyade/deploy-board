require('dotenv').config();
const mongoose = require('mongoose');
const { initializeDatabase } = require('./config/mongodb');
const Deployment = require('./models/Deployment');

/**
 * Démo pratique du modèle Deployment
 * Illustre l'utilisation des différentes fonctionnalités
 */
async function demoDeploymentModel() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  DÉMO: Utilisation du Modèle Deployment                  ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  try {
    // Connexion à MongoDB
    console.log('📡 Connexion à MongoDB...');
    await initializeDatabase();
    console.log();

    // ═══════════════════════════════════════════════════════════
    // SCÉNARIO 1: Créer des déploiements de test
    // ═══════════════════════════════════════════════════════════
    console.log('📝 SCÉNARIO 1: Création de déploiements de test\n');
    
    const deployments = [
      {
        pipelineId: 'frontend-app',
        buildNumber: 101,
        status: 'SUCCESS',
        duration: 180000, // 3 minutes
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // Il y a 6 jours
        environment: 'dev',
        commitSha: 'a1b2c3d',
        commitAuthor: 'Marie Dupont',
        stages: [
          { name: 'checkout', duration: 5000, status: 'SUCCESS' },
          { name: 'install', duration: 45000, status: 'SUCCESS' },
          { name: 'test', duration: 80000, status: 'SUCCESS' },
          { name: 'docker build', duration: 40000, status: 'SUCCESS' },
          { name: 'deploy', duration: 10000, status: 'SUCCESS' },
        ],
        qualityMetrics: {
          bugs: 2,
          codeSmells: 8,
          coverage: 85.5,
          rating: 'A',
          qualityGateStatus: 'PASSED',
        },
      },
      {
        pipelineId: 'frontend-app',
        buildNumber: 102,
        status: 'FAILED',
        duration: 95000,
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // Il y a 4 jours
        environment: 'dev',
        commitSha: 'e4f5g6h',
        commitAuthor: 'Pierre Martin',
        stages: [
          { name: 'checkout', duration: 5000, status: 'SUCCESS' },
          { name: 'install', duration: 45000, status: 'SUCCESS' },
          { name: 'test', duration: 45000, status: 'FAILED' },
        ],
        qualityMetrics: {
          bugs: 5,
          codeSmells: 12,
          coverage: 78.2,
          rating: 'B',
          qualityGateStatus: 'FAILED',
        },
      },
      {
        pipelineId: 'frontend-app',
        buildNumber: 103,
        status: 'SUCCESS',
        duration: 175000,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Il y a 2 jours
        environment: 'staging',
        commitSha: 'i7j8k9l',
        commitAuthor: 'Sophie Bernard',
        stages: [
          { name: 'checkout', duration: 5000, status: 'SUCCESS' },
          { name: 'install', duration: 45000, status: 'SUCCESS' },
          { name: 'test', duration: 75000, status: 'SUCCESS' },
          { name: 'sonar', duration: 20000, status: 'SUCCESS' },
          { name: 'docker build', duration: 25000, status: 'SUCCESS' },
          { name: 'deploy', duration: 5000, status: 'SUCCESS' },
        ],
        qualityMetrics: {
          bugs: 1,
          codeSmells: 6,
          coverage: 88.0,
          rating: 'A',
          qualityGateStatus: 'PASSED',
        },
      },
      {
        pipelineId: 'frontend-app',
        buildNumber: 104,
        status: 'SUCCESS',
        duration: 165000,
        timestamp: new Date(),
        environment: 'production',
        commitSha: 'm0n1o2p',
        commitAuthor: 'Thomas Dubois',
        stages: [
          { name: 'checkout', duration: 5000, status: 'SUCCESS' },
          { name: 'install', duration: 40000, status: 'SUCCESS' },
          { name: 'test', duration: 70000, status: 'SUCCESS' },
          { name: 'sonar', duration: 20000, status: 'SUCCESS' },
          { name: 'docker build', duration: 25000, status: 'SUCCESS' },
          { name: 'deploy', duration: 5000, status: 'SUCCESS' },
        ],
        qualityMetrics: {
          bugs: 0,
          codeSmells: 5,
          coverage: 90.5,
          rating: 'A',
          qualityGateStatus: 'PASSED',
        },
      },
    ];

    const created = await Deployment.insertMany(deployments);
    console.log(`✅ ${created.length} déploiements créés avec succès\n`);

    // ═══════════════════════════════════════════════════════════
    // SCÉNARIO 2: Récupérer l'historique récent
    // ═══════════════════════════════════════════════════════════
    console.log('📊 SCÉNARIO 2: Historique des 7 derniers jours\n');
    
    const recentDeployments = await Deployment.getRecentDeployments('frontend-app', 7);
    console.log(`Nombre de déploiements: ${recentDeployments.length}`);
    recentDeployments.forEach(deploy => {
      const date = new Date(deploy.timestamp).toLocaleDateString('fr-FR');
      const time = new Date(deploy.timestamp).toLocaleTimeString('fr-FR');
      console.log(`  • Build #${deploy.buildNumber} - ${deploy.status} - ${date} ${time}`);
      console.log(`    Environnement: ${deploy.environment}, Commit: ${deploy.commitSha}, Auteur: ${deploy.commitAuthor}`);
    });
    console.log();

    // ═══════════════════════════════════════════════════════════
    // SCÉNARIO 3: Calculer les statistiques
    // ═══════════════════════════════════════════════════════════
    console.log('📈 SCÉNARIO 3: Statistiques de déploiement\n');
    
    const stats = await Deployment.getDeploymentStats('frontend-app', 7);
    console.log(`Total de builds: ${stats.totalBuilds}`);
    console.log(`Taux de succès: ${stats.successRate}%`);
    console.log(`Durée moyenne: ${Math.round(stats.avgDuration / 1000)}s (${(stats.avgDuration / 60000).toFixed(1)} minutes)`);
    console.log();

    // ═══════════════════════════════════════════════════════════
    // SCÉNARIO 4: Récupérer les builds stables pour rollback
    // ═══════════════════════════════════════════════════════════
    console.log('🔄 SCÉNARIO 4: Builds stables pour rollback (environnement staging)\n');
    
    const stableBuilds = await Deployment.getStableBuilds('frontend-app', 'staging', 5);
    console.log(`Nombre de builds stables disponibles: ${stableBuilds.length}`);
    stableBuilds.forEach(build => {
      const date = new Date(build.timestamp).toLocaleDateString('fr-FR');
      const time = new Date(build.timestamp).toLocaleTimeString('fr-FR');
      console.log(`  • Build #${build.buildNumber} - ${date} ${time}`);
      console.log(`    Commit: ${build.commitSha}, Auteur: ${build.commitAuthor}`);
    });
    console.log();

    // ═══════════════════════════════════════════════════════════
    // SCÉNARIO 5: Statut des environnements
    // ═══════════════════════════════════════════════════════════
    console.log('🌍 SCÉNARIO 5: Statut actuel de tous les environnements\n');
    
    for (const env of ['dev', 'staging', 'production']) {
      const envStatus = await Deployment.getEnvironmentStatus(env);
      if (envStatus.length > 0) {
        const latest = envStatus[0];
        const date = new Date(latest.timestamp).toLocaleDateString('fr-FR');
        const time = new Date(latest.timestamp).toLocaleTimeString('fr-FR');
        console.log(`📍 Environnement: ${env.toUpperCase()}`);
        console.log(`   Pipeline: ${latest.pipelineId}`);
        console.log(`   Build: #${latest.buildNumber} - ${latest.status}`);
        console.log(`   Date: ${date} ${time}`);
        console.log(`   Commit: ${latest.commitSha} par ${latest.commitAuthor}`);
        console.log();
      }
    }

    // ═══════════════════════════════════════════════════════════
    // SCÉNARIO 6: Utilisation des méthodes d'instance
    // ═══════════════════════════════════════════════════════════
    console.log('🔍 SCÉNARIO 6: Méthodes d\'instance sur un déploiement\n');
    
    const latestDeploy = await Deployment.findOne({ buildNumber: 104 });
    console.log(`Build #${latestDeploy.buildNumber}:`);
    console.log(`  • En cours? ${latestDeploy.isInProgress() ? 'Oui' : 'Non'}`);
    console.log(`  • Réussi? ${latestDeploy.isSuccessful() ? 'Oui' : 'Non'}`);
    console.log(`  • Durée: ${latestDeploy.getFormattedDuration()}`);
    console.log(`  • Nombre d'étapes: ${latestDeploy.stages.length}`);
    console.log(`  • Qualité: ${latestDeploy.qualityMetrics.rating} - ${latestDeploy.qualityMetrics.bugs} bugs, Couverture: ${latestDeploy.qualityMetrics.coverage}%`);
    console.log();

    // ═══════════════════════════════════════════════════════════
    // SCÉNARIO 7: Filtrage par statut
    // ═══════════════════════════════════════════════════════════
    console.log('⚠️  SCÉNARIO 7: Déploiements échoués uniquement\n');
    
    const failedDeployments = await Deployment.getRecentDeployments('frontend-app', 7, 'FAILED');
    console.log(`Nombre de déploiements échoués: ${failedDeployments.length}`);
    failedDeployments.forEach(deploy => {
      const date = new Date(deploy.timestamp).toLocaleDateString('fr-FR');
      console.log(`  • Build #${deploy.buildNumber} - ${date}`);
      console.log(`    Auteur: ${deploy.commitAuthor}, Commit: ${deploy.commitSha}`);
      console.log(`    Qualité gate: ${deploy.qualityMetrics?.qualityGateStatus || 'N/A'}`);
    });
    console.log();

    // ═══════════════════════════════════════════════════════════
    // NETTOYAGE
    // ═══════════════════════════════════════════════════════════
    console.log('🧹 Nettoyage des données de test...');
    const result = await Deployment.deleteMany({ pipelineId: 'frontend-app' });
    console.log(`✅ ${result.deletedCount} déploiements supprimés\n`);

    // ═══════════════════════════════════════════════════════════
    // RÉSUMÉ
    // ═══════════════════════════════════════════════════════════
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║  DÉMO TERMINÉE AVEC SUCCÈS                                ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    console.log('✅ Toutes les fonctionnalités du modèle Deployment ont été démontrées:');
    console.log('   • Création de déploiements avec données complètes');
    console.log('   • Récupération de l\'historique récent');
    console.log('   • Calcul de statistiques (succès/échec, durée moyenne)');
    console.log('   • Récupération de builds stables pour rollback');
    console.log('   • Statut par environnement');
    console.log('   • Méthodes d\'instance (isSuccessful, getFormattedDuration)');
    console.log('   • Filtrage par statut');
    console.log();

    // Fermeture
    await mongoose.connection.close();
    console.log('🛑 Connexion fermée\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error.stack);
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

// Exécuter la démo
demoDeploymentModel();
