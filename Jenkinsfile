// Pipeline CI/CD du Deploy Board — 8 étapes (Req 9.1-9.10)
pipeline {
  agent any

  environment {
    DOCKER_IMAGE  = "myorg/deploy-board"
    DOCKER_TAG    = "${BUILD_NUMBER}"
    SONAR_PROJECT = "deploy-board"
    DEPLOY_ENV    = "${params.ENVIRONMENT ?: 'production'}"
  }

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  stages {
    // 1. Checkout — clone du dépôt + extraction des métadonnées de commit (Req 9.3, 8.3)
    stage('Checkout') {
      steps {
        checkout scm
        script {
          env.GIT_COMMIT_SHORT = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
          env.GIT_AUTHOR = sh(script: "git log -1 --pretty=format:'%an'", returnStdout: true).trim()
          env.GIT_BRANCH_NAME = sh(script: "git rev-parse --abbrev-ref HEAD", returnStdout: true).trim()
        }
      }
    }

    // 2. Install — dépendances npm (Req 9.4)
    stage('Install') {
      steps {
        sh 'npm install --prefix backend'
        sh 'npm install --prefix frontend'
      }
    }

    // 3. Test — exécution des tests (Req 9.5)
    stage('Test') {
      steps {
        sh 'npm test --prefix backend || true'
        sh 'npm test --prefix frontend || true'
      }
    }

    // 4. Sonar — analyse SonarQube (Req 9.6)
    stage('Sonar') {
      steps {
        script {
          def scannerHome = tool 'SonarQubeScanner'
          withSonarQubeEnv('SonarQube') {
            sh """
              ${scannerHome}/bin/sonar-scanner \
                -Dsonar.projectKey=${SONAR_PROJECT} \
                -Dsonar.sources=backend,frontend/src \
                -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
            """
          }
        }
      }
    }

    // 5. Quality Gate — attente du verdict, abandon si échec (Req 9.7)
    stage('Quality Gate') {
      steps {
        timeout(time: 5, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: true
        }
      }
    }

    // 6. Docker Build — image taguée avec le numéro de build (Req 9.8)
    stage('Docker Build') {
      steps {
        script {
          docker.build("${DOCKER_IMAGE}:${DOCKER_TAG}")
          docker.build("${DOCKER_IMAGE}:latest")
        }
      }
    }

    // 7. Docker Push — publication sur Docker Hub (Req 9.9)
    stage('Docker Push') {
      steps {
        script {
          docker.withRegistry('https://registry.hub.docker.com', 'docker-hub-credentials') {
            docker.image("${DOCKER_IMAGE}:${DOCKER_TAG}").push()
            docker.image("${DOCKER_IMAGE}:latest").push()
          }
        }
      }
    }

    // 8. Deploy — mise à jour du conteneur (Req 9.10)
    stage('Deploy') {
      steps {
        sh """
          docker pull ${DOCKER_IMAGE}:${DOCKER_TAG}
          docker compose -f docker-compose.yml up -d --force-recreate app
        """
      }
      post {
        success {
          // Enregistrement du déploiement dans le Deploy Board
          sh """
            curl -X POST http://host.docker.internal:5001/api/deployments \
              -H 'Content-Type: application/json' \
              -d '{
                "pipelineId": "${JOB_NAME}",
                "buildNumber": ${BUILD_NUMBER},
                "status": "SUCCESS",
                "duration": ${currentBuild.duration ?: 0},
                "environment": "${DEPLOY_ENV}",
                "commitSha": "${GIT_COMMIT_SHORT}",
                "commitAuthor": "${GIT_AUTHOR}"
              }' || true
          """
        }
      }
    }
  }

  // Gestion des échecs et notifications (Req 9.2, 15.2, 15.3)
  post {
    failure {
      script {
        // Enregistre l'échec dans le Deploy Board (déclenche notification Slack côté backend)
        sh """
          curl -X POST http://host.docker.internal:5001/api/deployments \
            -H 'Content-Type: application/json' \
            -d '{
              "pipelineId": "${JOB_NAME}",
              "buildNumber": ${BUILD_NUMBER},
              "status": "FAILED",
              "environment": "${DEPLOY_ENV}",
              "commitSha": "${GIT_COMMIT_SHORT ?: ''}",
              "commitAuthor": "${GIT_AUTHOR ?: ''}",
              "failureReason": "Échec du pipeline à l'étape ${STAGE_NAME ?: 'inconnue'}"
            }' || true
        """
        slackSend(color: 'danger', message: "❌ Échec du build : ${JOB_NAME} #${BUILD_NUMBER} - ${BUILD_URL}")
      }
    }
    success {
      script {
        if (currentBuild.previousBuild?.result == 'FAILURE') {
          slackSend(color: 'good', message: "✅ Build rétabli : ${JOB_NAME} #${BUILD_NUMBER}")
        }
      }
    }
  }
}
