/**
 * Utilitário para tratar erros de carregamento de chunks
 * Resolve problemas comuns de ChunkLoadError em produção
 */

export class ChunkErrorHandler {
  private static retryCount = new Map<string, number>();
  private static maxRetries = 3;

  /**
   * Trata erros de carregamento de chunks
   */
  static handleChunkError(error: Error): boolean {
    if (this.isChunkLoadError(error)) {
      console.warn('🔄 Erro de carregamento de chunk detectado:', error.message);
      
      const chunkId = this.extractChunkId(error.message);
      const currentRetries = this.retryCount.get(chunkId) || 0;
      
      if (currentRetries < this.maxRetries) {
        this.retryCount.set(chunkId, currentRetries + 1);
        console.log(`🔄 Tentativa ${currentRetries + 1}/${this.maxRetries} para chunk: ${chunkId}`);
        
        // Recarregar a página após um pequeno delay
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
        return true;
      } else {
        console.error('❌ Máximo de tentativas excedido para chunk:', chunkId);
        this.showUserFriendlyError();
        return false;
      }
    }
    
    return false;
  }

  /**
   * Verifica se o erro é um ChunkLoadError
   */
  private static isChunkLoadError(error: Error): boolean {
    return (
      error.name === 'ChunkLoadError' ||
      error.message.includes('Loading chunk') ||
      error.message.includes('Loading CSS chunk') ||
      error.message.includes('Failed to import')
    );
  }

  /**
   * Extrai o ID do chunk da mensagem de erro
   */
  private static extractChunkId(message: string): string {
    const match = message.match(/chunk (\d+)/i) || message.match(/(\w+)\.js/);
    return match ? match[1] : 'unknown';
  }

  /**
   * Mostra uma mensagem amigável para o usuário
   */
  private static showUserFriendlyError(): void {
    const message = `
      Houve um problema ao carregar alguns recursos da aplicação.
      Por favor, recarregue a página ou limpe o cache do navegador.
    `;
    
    if (typeof window !== 'undefined' && window.confirm) {
      const reload = window.confirm(message + '\n\nDeseja recarregar a página agora?');
      if (reload) {
        window.location.reload();
      }
    }
  }

  /**
   * Limpa o contador de tentativas
   */
  static clearRetryCount(): void {
    this.retryCount.clear();
  }

  /**
   * Configura o handler global de erros
   */
  static setupGlobalHandler(): void {
    if (typeof window !== 'undefined') {
      // Handler para erros não capturados
      window.addEventListener('error', (event) => {
        if (event.error) {
          this.handleChunkError(event.error);
        }
      });

      // Handler para promises rejeitadas
      window.addEventListener('unhandledrejection', (event) => {
        if (event.reason instanceof Error) {
          this.handleChunkError(event.reason);
        }
      });
    }
  }
}

// Auto-configurar o handler em ambientes de navegador
if (typeof window !== 'undefined') {
  ChunkErrorHandler.setupGlobalHandler();
}