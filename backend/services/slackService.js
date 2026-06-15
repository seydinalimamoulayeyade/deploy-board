const axios = require('axios');

/**
 * Service Slack
 * Envoi de notifications via webhook Slack.
 * Les échecs d'envoi sont journalisés mais ne bloquent jamais le traitement (Req 15.6)
 * Requirements: 6.6, 15.1-15.6
 */
class SlackService {
  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL || '';
    this.appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:5001';
  }

  isConfigured() {
    return Boolean(this.webhookUrl);
  }

  /**
   * Envoie un message brut à Slack
   * @returns {Promise<boolean>} true si envoyé, false sinon
   */
  async send(payload) {
    if (!this.isConfigured()) {
      console.warn('[Slack] Webhook non configuré, notification ignorée');
      return false;
    }
    try {
      await axios.post(this.webhookUrl, payload, { timeout: 10000 });
      return true;
    } catch (err) {
      // Ne bloque jamais le traitement (Req 15.6)
      console.error('[Slack] Échec de l\'envoi de la notification:', err.message);
      return false;
    }
  }

  buildLink(pipelineId, buildNumber) {
    return `${this.appBaseUrl}/pipeline/${pipelineId}/build/${buildNumber}`;
  }

  /**
   * Notification d'échec de build (Req 15.2)
   */
  async notifyBuildFailure(pipelineId, buildNumber, reason = 'Raison inconnue') {
    const link = this.buildLink(pipelineId, buildNumber);
    return this.send({
      attachments: [{
        color: 'danger',
        title: `❌ Échec du build : ${pipelineId} #${buildNumber}`,
        text: `Raison : ${reason}`,
        actions: [{ type: 'button', text: 'Voir les détails', url: link }],
      }],
    });
  }

  /**
   * Notification de récupération après échec (Req 15.3)
   */
  async notifyBuildRecovery(pipelineId, buildNumber) {
    const link = this.buildLink(pipelineId, buildNumber);
    return this.send({
      attachments: [{
        color: 'good',
        title: `✅ Build rétabli : ${pipelineId} #${buildNumber}`,
        text: 'Le build a réussi après un échec précédent.',
        actions: [{ type: 'button', text: 'Voir les détails', url: link }],
      }],
    });
  }

  /**
   * Notification de rollback (Req 15.4)
   */
  async notifyRollback(pipelineId, targetBuildNumber) {
    const link = this.buildLink(pipelineId, targetBuildNumber);
    return this.send({
      attachments: [{
        color: 'warning',
        title: `↩️ Rollback initié : ${pipelineId}`,
        text: `Retour à la version stable #${targetBuildNumber}`,
        actions: [{ type: 'button', text: 'Voir les détails', url: link }],
      }],
    });
  }
}

module.exports = new SlackService();
