/**
 * SISTEMA DE STATUS - Monitoramento do Estado Geral
 * Integra-se com a API para mostrar saúde do sistema em tempo real
 */

class StatusSistema {
  constructor() {
    this.badge = document.getElementById("statusBadge");
    this.atualizacaoIntervalo = null;
    this.ultimaAtualizacao = null;
  }

  /**
   * Inicializar e começar a monitorar
   */
  init() {
    console.log("🔵 Inicializando Sistema de Status...");
    this.buscarStatus();

    // Atualizar a cada 30 segundos
    this.atualizacaoIntervalo = setInterval(() => {
      this.buscarStatus();
    }, 30000);
  }

  /**
   * Buscar status do backend
   */
  async buscarStatus() {
    try {
      const response = await fetch(`${API_URL}/medicoes/estatisticas`);
      const dados = await response.json();

      if (dados.success) {
        this.processarStatus(dados.estatisticasUltimas24h);
      }
    } catch (error) {
      console.error("❌ Erro ao buscar status:", error);
      this.mostrarErro();
    }
  }

  /**
   * Processar e determinar o status geral
   */
  processarStatus(stats) {
    const critico = stats.critico || 0;
    const alto = stats.alto || 0;
    const medio = stats.medio || 0;
    const baixo = stats.baixo || 0;
    const total = critico + alto + medio + baixo;

    let nivelStatus = "NORMAL";
    let iconStatus = "✅";
    let percentualCritico = 0;

    if (total > 0) {
      percentualCritico = (critico / total) * 100;

      if (critico > 0) {
        nivelStatus = "CRITICO";
        iconStatus = "🔴";
      } else if (alto > 0) {
        nivelStatus = "ALTO";
        iconStatus = "🟠";
      } else if (medio > 0) {
        nivelStatus = "MEDIO";
        iconStatus = "🟡";
      } else if (baixo > 0) {
        nivelStatus = "BAIXO";
        iconStatus = "🟢";
      }
    }

    // Atualizar badge
    this.atualizarBadge(
      nivelStatus,
      iconStatus,
      critico,
      alto,
      medio,
      baixo,
      total
    );

    // Log para debug
    console.log(
      `📊 Status: ${nivelStatus} | Crítico: ${critico}, Alto: ${alto}, Médio: ${medio}, Baixo: ${baixo}`
    );
  }

  /**
   * Atualizar visual do badge e tooltip
   */
  atualizarBadge(nivel, icone, critico, alto, medio, baixo, total) {
    // Remover classes antigas
    this.badge.className = "status-badge";

    // Adicionar classe do novo status
    this.badge.classList.add(`status-${nivel.toLowerCase()}`);

    // Atualizar ícone e texto
    this.badge.innerHTML = `
      <span class="status-icon">${icone}</span>
      <span class="status-texto">${nivel}</span>
    `;

    // Atualizar tooltip
    document.getElementById("tooltipCritico").textContent = critico;
    document.getElementById("tooltipAlto").textContent = alto;
    document.getElementById("tooltipMedio").textContent = medio;
    document.getElementById("tooltipBaixo").textContent = baixo;
    document.getElementById("tooltipTotal").textContent = total;
    document.getElementById(
      "tooltipUpdate"
    ).textContent = `Atualizado ${this.formatarTempo(new Date())}`;

    this.ultimaAtualizacao = new Date();
  }

  /**
   * Mostrar erro na conexão
   */
  mostrarErro() {
    this.badge.className = "status-badge status-normal";
    this.badge.innerHTML = `
      <span class="status-icon">⚠️</span>
      <span class="status-texto">Offline</span>
    `;
  }

  /**
   * Formatar tempo para exibição legível
   */
  formatarTempo(data) {
    const agora = new Date();
    const diff = Math.floor((agora - data) / 1000); // diferença em segundos

    if (diff < 60) return "agora";
    if (diff < 3600) return `há ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
    return data.toLocaleString("pt-BR");
  }

  /**
   * Destruir o monitor (parar de atualizar)
   */
  destroy() {
    if (this.atualizacaoIntervalo) {
      clearInterval(this.atualizacaoIntervalo);
    }
  }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  const statusSistema = new StatusSistema();
  statusSistema.init();

  // Salvar referência global para parar se necessário
  window.statusSistema = statusSistema;
});
