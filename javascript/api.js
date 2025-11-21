/**
 * API CLIENT - FRONTEND EROWATCH
 * Conecta o dashboard HTML com o backend Node.js
 */

// URL do backend (trocar quando fizer deploy)
const API_URL = "https://bk-eroswatch.onrender.com/api";

// ============================================
// FUNÇÕES DE REQUISIÇÃO
// ============================================

/**
 * Busca medições recentes (últimas 50)
 */
async function buscarMedicoesRecentes(limite = 50) {
  try {
    const response = await fetch(
      `${API_URL}/medicoes/recentes?limite=${limite}`
    );
    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error("Erro ao buscar medições");
    }
  } catch (error) {
    console.error("❌ Erro ao buscar medições:", error);
    return [];
  }
}

/**
 * Busca estatísticas gerais
 */
async function buscarEstatisticas() {
  try {
    const response = await fetch(`${API_URL}/medicoes/estatisticas`);
    const data = await response.json();

    if (data.success) {
      return data;
    } else {
      throw new Error("Erro ao buscar estatísticas");
    }
  } catch (error) {
    console.error("❌ Erro ao buscar estatísticas:", error);
    return null;
  }
}

/**
 * Busca alertas ativos
 */
async function buscarAlertasAtivos() {
  try {
    const response = await fetch(`${API_URL}/alertas/ativos`);
    const data = await response.json();

    if (data.success) {
      return data.alertas;
    } else {
      throw new Error("Erro ao buscar alertas");
    }
  } catch (error) {
    console.error("❌ Erro ao buscar alertas:", error);
    return [];
  }
}

/**
 * Busca lista de sensores
 */
async function buscarSensores() {
  try {
    const response = await fetch(`${API_URL}/sensores`);
    const data = await response.json();

    if (data.success) {
      return data.sensores;
    } else {
      throw new Error("Erro ao buscar sensores");
    }
  } catch (error) {
    console.error("❌ Erro ao buscar sensores:", error);
    return [];
  }
}

/**
 * Busca medições de um sensor específico por período
 */
async function buscarMedicoesPorPeriodo(sensorId, dataInicio, dataFim) {
  try {
    const url = `${API_URL}/medicoes/periodo?sensor_id=${sensorId}&data_inicio=${dataInicio}&data_fim=${dataFim}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error("Erro ao buscar medições por período");
    }
  } catch (error) {
    console.error("❌ Erro ao buscar medições por período:", error);
    return [];
  }
}

/**
 * Buscar previsão do tempo para um sensor
 */
async function buscarPrevisaoClima(sensorId) {
  try {
    const response = await fetch(`${API_URL}/clima/sensor/${sensorId}`);
    const data = await response.json();

    if (data.success) {
      return data.previsao;
    }
  } catch (error) {
    console.error("❌ Erro ao buscar previsão:", error);
    return null;
  }
}

// ============================================
// FUNÇÕES DE ATUALIZAÇÃO DO DASHBOARD
// ============================================

/**
 * Atualiza cards de estatísticas
 */
async function atualizarDashboard() {
  try {
    console.log("🔄 Atualizando dashboard...");

    // ✅ BUSCAR DADOS PRIMEIRO
    const stats = await buscarEstatisticas();
    if (!stats) {
      console.warn("⚠️ Nenhum dado retornado de estatísticas");
      return;
    }

    // ✅ EXTRAIR ÚLTIMA MEDIÇÃO
    const ultima = stats.ultimasMedicoes?.[0] || stats.data?.[0] || null;
    if (!ultima) {
      console.warn("⚠️ Nenhuma medição disponível");
      return;
    }

    console.log("📊 Dados para dashboard:", ultima);

    // ✅ PREPARAR OBJETO COM TODOS OS DADOS
    const dados = {
      nivel_risco: ultima.nivel_risco || ultima.risco || "DESCONHECIDO",
      indice_risco: ultima.indice_risco ?? 0, // Usar ?? para null/undefined
      recomendacao: obterRecomendacao(ultima.nivel_risco || ultima.risco),
      umidade_solo: ultima.umidade_solo ?? 0,
      temperatura_solo: ultima.temperatura_solo ?? 0,
      inclinacao: ultima.inclinacao_graus ?? 0,
      temperatura_ar: ultima.temperatura_ar ?? 0,
      umidade_ar: ultima.umidade_ar ?? 0,
      erosao: ultima.erosao?.taxa ?? 0,
    };

    console.log("✅ Objeto dados preparado:", dados);

    // ✅ CHAMAR ATUALIZAÇÃO COM DADOS VÁLIDOS
    atualizarDashboard(dados);

    // ✅ ATUALIZAR CARDS DE SOLO
    const elUmidadeSolo = document.getElementById("umidade-solo");
    if (elUmidadeSolo) {
      elUmidadeSolo.innerHTML = `${parseFloat(dados.umidade_solo || 0).toFixed(
        1
      )}<small>%</small>`;
    }

    const elInclinacao = document.getElementById("inclinacao");
    if (elInclinacao) {
      elInclinacao.innerHTML = `${parseFloat(dados.inclinacao || 0).toFixed(
        1
      )}<small>°</small>`;
    }

    const elTempSolo = document.getElementById("temperatura-solo");
    if (elTempSolo) {
      elTempSolo.innerHTML = `${parseFloat(dados.temperatura_solo || 0).toFixed(
        1
      )}<small>°C</small>`;
    }

    const elTaxa = document.getElementById("taxa-erosao");
    if (elTaxa) {
      elTaxa.innerHTML = `${parseFloat(dados.erosao || 0).toFixed(
        2
      )}<small>t/ha</small>`;
    }

    // ✅ ATUALIZAR CARDS DE CLIMA
    const elUmidadeAr = document.getElementById("umidade-ar");
    if (elUmidadeAr) {
      elUmidadeAr.innerHTML = `${parseFloat(dados.umidade_ar || 0).toFixed(
        0
      )}<small>%</small>`;
    }

    const elTempAr = document.getElementById("temperatura-ar");
    if (elTempAr) {
      elTempAr.innerHTML = `${parseFloat(dados.temperatura_ar || 0).toFixed(
        1
      )}<small>°C</small>`;
    }

    console.log("✅ Dashboard atualizado com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao atualizar dashboard:", error);
  }
}

// ✅ FUNÇÃO DE RECOMENDAÇÃO
function obterRecomendacao(nivelRisco) {
  const recomendacoes = {
    CRITICO: "🚨 ALERTA CRÍTICO! Erosão severa. Ações imediatas necessárias.",
    ALTO: "⚠️ Risco Alto. Implemente medidas de proteção urgentemente.",
    MEDIO: "⚡ Risco Médio. Monitore e implemente proteção preventiva.",
    BAIXO: "✅ Situação normal. Continue monitorando.",
    DESCONHECIDO: "❓ Dados insuficientes para análise.",
  };
  return recomendacoes[nivelRisco] || recomendacoes.DESCONHECIDO;
}

// ✅ ATUALIZAÇÃO DO DASHBOARD COM VERIFICAÇÃO DE SEGURANÇA
function atualizarDashboard(dados) {
  if (!dados) {
    console.warn("⚠️ atualizarDashboard chamado com dados undefined");
    return;
  }

  console.log("🎨 Atualizando exibição visual com:", dados);

  // Status geral
  const statusEl = document.getElementById("status-geral");
  if (statusEl) {
    statusEl.textContent = dados.nivel_risco || "-";
    statusEl.className = (dados.nivel_risco || "").toLowerCase();
  }

  // Índice numérico
  if (dados.indice_risco !== undefined && dados.indice_risco !== null) {
    const indiceEl = document.getElementById("indice-risco");
    if (indiceEl) {
      indiceEl.textContent = `${Number(dados.indice_risco).toFixed(1)}/100`;
    }

    // Barra de progresso
    const barra = document.getElementById("barra-risco");
    if (barra) {
      const pct = Math.max(0, Math.min(100, Number(dados.indice_risco)));
      barra.style.width = `${pct}%`;

      if (pct > 75) {
        barra.style.backgroundColor = "#dc3545";
      } else if (pct > 55) {
        barra.style.backgroundColor = "#fd7e14";
      } else if (pct > 30) {
        barra.style.backgroundColor = "#ffc107";
      } else {
        barra.style.backgroundColor = "#28a745";
      }
    }
  }

  // Recomendação
  if (dados.recomendacao) {
    const rec = document.getElementById("recomendacao");
    if (rec) rec.textContent = dados.recomendacao;
  }

  // Piscar se CRÍTICO
  if (dados.nivel_risco === "CRITICO") {
    statusEl?.classList.add("piscando");
  } else {
    statusEl?.classList.remove("piscando");
  }
}

// ✅ EXECUTAR AO CARREGAR PÁGINA
document.addEventListener("DOMContentLoaded", () => {
  atualizarDashboard(); // Chama sem argumentos; a função busca os dados
  setInterval(() => {
    atualizarDashboard(); // Atualiza a cada 10 segundos
  }, 10000);
});

// Exportar funções para uso global
window.EroWatchAPI = {
  buscarMedicoesRecentes,
  buscarEstatisticas,
  buscarAlertasAtivos,
  buscarSensores,
  buscarMedicoesPorPeriodo,
  atualizarDashboard,
  buscarPrevisaoClima,
};

// Atualizar exibição com índice de risco
function atualizarDashboard(dados) {
  // Status geral
  const statusEl = document.getElementById("status-geral");
  if (statusEl) {
    statusEl.textContent = dados.nivel_risco || "-";
    statusEl.className = (dados.nivel_risco || "").toLowerCase();
  }

  // NOVO: Índice numérico
  if (dados.indice_risco !== undefined && dados.indice_risco !== null) {
    const indiceEl = document.getElementById("indice-risco");
    if (indiceEl)
      indiceEl.textContent = `${Number(dados.indice_risco).toFixed(1)}/100`;

    // Atualizar barra de progresso
    const barra = document.getElementById("barra-risco");
    if (barra) {
      const pct = Math.max(0, Math.min(100, Number(dados.indice_risco)));
      barra.style.width = `${pct}%`;

      // Cor da barra baseada no risco
      if (pct > 75) {
        barra.style.backgroundColor = "#dc3545"; // Vermelho
      } else if (pct > 55) {
        barra.style.backgroundColor = "#fd7e14"; // Laranja
      } else if (pct > 30) {
        barra.style.backgroundColor = "#ffc107"; // Amarelo
      } else {
        barra.style.backgroundColor = "#28a745"; // Verde
      }
    }
  }

  // NOVO: Recomendação
  if (dados.recomendacao !== undefined) {
    const rec = document.getElementById("recomendacao");
    if (rec) rec.textContent = dados.recomendacao || "Aguardando dados...";
  }

  // Piscar se CRÍTICO
  if (dados.nivel_risco === "CRITICO") {
    statusEl?.classList.add("piscando");
  } else {
    statusEl?.classList.remove("piscando");
  }
}
