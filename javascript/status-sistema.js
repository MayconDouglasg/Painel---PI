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
        // AGORA: Usamos as últimas medições para saber o estado ATUAL
        this.processarStatus(dados.ultimasMedicoes || []);
      }
    } catch (error) {
      console.error("❌ Erro ao buscar status:", error);
      this.mostrarErro();
    }
  }

  /**
   * Processar e determinar o status geral baseado no estado ATUAL dos sensores
   */
  processarStatus(medicoes) {
    // 1. Filtrar para pegar apenas a última medição de cada sensor único
    const sensoresUnicos = {};
    
    medicoes.forEach(m => {
      // Se ainda não tem esse sensor ou se essa medição é mais recente
      if (!sensoresUnicos[m.sensor_id] || new Date(m.timestamp) > new Date(sensoresUnicos[m.sensor_id].timestamp)) {
        sensoresUnicos[m.sensor_id] = m;
      }
    });

    const estadosAtuais = Object.values(sensoresUnicos);
    
    // 2. Contar status atual
    let critico = 0;
    let alto = 0;
    let medio = 0;
    let baixo = 0;

    estadosAtuais.forEach(m => {
      const nivel = (m.nivel_risco || "BAIXO").toUpperCase();
      if (nivel === "CRITICO") critico++;
      else if (nivel === "ALTO") alto++;
      else if (nivel === "MEDIO") medio++;
      else baixo++;
    });

    const total = estadosAtuais.length;

    // 3. Determinar status geral do sistema (Pior caso prevalece)
    let nivelStatus = "NORMAL";
    let iconStatus = "✅";

    if (total > 0) {
      if (critico > 0) {
        nivelStatus = "CRITICO";
        iconStatus = "🔴";
      } else if (alto > 0) {
        nivelStatus = "ALTO";
        iconStatus = "🟠";
      } else if (medio > 0) {
        nivelStatus = "MEDIO";
        iconStatus = "🟡";
      } else {
        nivelStatus = "BAIXO"; // Tudo normal
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
      `📊 Status Real-Time: ${nivelStatus} | Sensores: ${total} (🔴${critico} 🟠${alto} 🟡${medio} 🟢${baixo})`
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

    // Atualizar tooltip (Agora mostra contagem de SENSORES)
    const setTooltip = (id, val) => {
        const el = document.getElementById(id);
        if(el) el.textContent = val;
    };

    setTooltip("tooltipCritico", critico);
    setTooltip("tooltipAlto", alto);
    setTooltip("tooltipMedio", medio);
    setTooltip("tooltipBaixo", baixo);
    setTooltip("tooltipTotal", total);
    setTooltip("tooltipUpdate", `Atualizado ${this.formatarTempo(new Date())}`);

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
    // FORÇAR FUSO HORÁRIO BRASIL
    return data.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
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
