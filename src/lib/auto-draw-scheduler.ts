// Système de vérification automatique des giveaways expirés
export class AutoDrawScheduler {
  private static interval: NodeJS.Timeout | null = null;
  private static isRunning = false;

  static start() {
    if (this.isRunning) {
      console.log('Auto-draw scheduler is already running');
      return;
    }

    console.log('Starting auto-draw scheduler...');
    this.isRunning = true;

    // Vérifier toutes les 30 secondes
    this.interval = setInterval(async () => {
      try {
        await this.checkAndDrawExpiredGiveaways();
      } catch (error) {
        console.error('Error in auto-draw scheduler:', error);
      }
    }, 30000); // 30 secondes
  }

  static stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('Auto-draw scheduler stopped');
  }

  private static async checkAndDrawExpiredGiveaways() {
    try {
      const response = await fetch('/api/giveaways/auto-draw', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to check expired giveaways');
      }

      const result = await response.json();
      
      if (result.processedCount > 0) {
        console.log(`Processed ${result.processedCount} expired giveaways:`, result.results);
        
        // Notifier les résultats
        result.results.forEach((drawResult: any) => {
          if (drawResult.status === 'drawn') {
            console.log(`🎉 Giveaway ${drawResult.giveawayId} drawn! Winner: ${drawResult.winner?.steamUsername || drawResult.winnerId}`);
          } else if (drawResult.status === 'cancelled') {
            console.log(`❌ Giveaway ${drawResult.giveawayId} cancelled: ${drawResult.reason}`);
          }
        });
      }
    } catch (error) {
      console.error('Error checking expired giveaways:', error);
    }
  }

  static get status() {
    return {
      isRunning: this.isRunning,
      hasInterval: this.interval !== null
    };
  }
}

// Auto-start si on est côté client
if (typeof window !== 'undefined') {
  // Démarrer le scheduler après un délai pour éviter les conflits
  setTimeout(() => {
    AutoDrawScheduler.start();
  }, 5000);

  // Nettoyer lors de la fermeture de la page
  window.addEventListener('beforeunload', () => {
    AutoDrawScheduler.stop();
  });
}