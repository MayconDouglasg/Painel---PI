/**
 * API CLIENT - FRONTEND EROWATCH
 * Conecta o dashboard HTML com o backend Node.js
 */

// URL do backend (trocar quando fizer deploy)
const API_URL = "https://bk-eroswatch.onrender.com/api";
// const API_URL = "http://localhost:3000/api";

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
 * Busca dados e inicia atualização da interface
 */
/**
 * Busca dados e inicia atualização da interface
 */
async function iniciarAtualizacaoDashboard(sensorId = null) {
  try {
    console.log(`🔄 Atualizando dashboard... (Sensor: ${sensorId || 'Geral'})`);

    // 1. BUSCAR ESTATÍSTICAS GERAIS (Cards e Status)
    // Passamos o sensorId se houver
    const urlStats = sensorId 
        ? `${API_URL}/medicoes/estatisticas?sensor_id=${sensorId}` 
        : `${API_URL}/medicoes/estatisticas`;
        
    const response = await fetch(urlStats);
    const stats = await response.json();
    
    if (stats && stats.success) {
      const ultima = stats.ultimasMedicoes?.[0] || stats.data?.[0] || null;
      
      if (ultima) {
        console.log("📊 Dados da última medição:", ultima);
        
        // Fallback para dados de clima se não vierem direto da medição
        const tempAr = ultima.temperatura_ar || ultima.previsao?.temperatura || 0;
        const umidAr = ultima.umidade_ar || ultima.previsao?.umidade || 0;

        // Preparar dados para os cards
        const dadosCards = {
          nivel_risco: ultima.nivel_risco || ultima.risco || "DESCONHECIDO",
          indice_risco: ultima.indice_risco ?? 0,
          recomendacao: obterRecomendacao(ultima.nivel_risco || ultima.risco),
          umidade_solo: ultima.umidade_solo ?? 0,
          temperatura_solo: ultima.temperatura_solo ?? 0,
          inclinacao: ultima.inclinacao_graus ?? 0,
          temperatura_ar: tempAr,
          umidade_ar: umidAr,
          erosao: ultima.erosao?.taxa ?? 0,
          // Novos campos
          tipo_solo: ultima.sensores?.tipo_solo || "N/A",
          qualidade_leitura: ultima.qualidade_leitura || "Normal",
          // Identificação
          identificador: ultima.sensores?.identificador,
          regiao: ultima.sensores?.regiao
        };
        
        // Atualizar Cards e Status
        renderizarDadosDashboard(dadosCards);
        
        // Atualizar Gráficos de Histórico (Umidade, Temp, Inclinação)
        // Passamos as últimas medições para os gráficos
        if (stats.ultimasMedicoes && window.atualizarGraficosHistorico) {
           window.atualizarGraficosHistorico(stats.ultimasMedicoes);
        }
        
        // 2. BUSCAR PREVISÃO DO CLIMA (Para o gráfico de chuva)
        // Usamos o ID do sensor da última medição
        if (ultima.sensor_id) {
            const previsao = await buscarPrevisaoClima(ultima.sensor_id);
            console.log("🌦️ Previsão do tempo recebida:", previsao);
            
            if (previsao) {
                // Atualizar card de clima
                atualizarCardClima(previsao);
                
                // Se tivermos a função de atualizar gráfico de chuva (futuro)
                if (window.atualizarGraficoChuva) {
                    window.atualizarGraficoChuva(previsao);
                }
            }
        }
      } else {
          console.warn("⚠️ Nenhuma medição encontrada para este filtro.");
          // Opcional: Limpar dashboard ou mostrar aviso
      }
    }

    // 3. BUSCAR ALERTAS DE RISCO (Para a lista de alertas)
    // Se tiver filtro de sensor, filtramos os alertas também? 
    // Por enquanto mantemos geral ou filtramos no front se necessário.
    // O ideal seria o endpoint suportar ?sensor_id=...
    const alertas = await buscarAlertasAtivos();
    // Filtro local de alertas se um sensor estiver selecionado
    const alertasFiltrados = sensorId 
        ? alertas.filter(a => a.sensor_id == sensorId) 
        : alertas;
        
    renderizarAlertas(alertasFiltrados);

    console.log("✅ Dashboard atualizado com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao atualizar dashboard:", error);
  }
}

/**
 * Carregar e popular o seletor de sensores
 */
async function carregarSeletorSensores() {
    const select = document.getElementById('dashboardSensorSelect');
    if (!select) return;

    try {
        const sensores = await buscarSensores();
        
        // Agrupar por região
        const porRegiao = {};
        sensores.forEach(s => {
            if (!porRegiao[s.regiao]) porRegiao[s.regiao] = [];
            porRegiao[s.regiao].push(s);
        });

        // Limpar (mantendo a opção Geral)
        select.innerHTML = '<option value="">🌎 Visão Geral</option>';

        // Criar OptGroups
        Object.keys(porRegiao).sort().forEach(regiao => {
            const group = document.createElement('optgroup');
            group.label = regiao;
            
            porRegiao[regiao].forEach(sensor => {
                const option = document.createElement('option');
                option.value = sensor.id;
                option.textContent = sensor.identificador;
                group.appendChild(option);
            });
            
            select.appendChild(group);
        });

        // Event Listener para mudança
        select.addEventListener('change', (e) => {
            const sensorId = e.target.value;
            // Parar intervalo anterior se existir (para não sobrepor)
            if (window.dashboardInterval) clearInterval(window.dashboardInterval);
            
            // Atualizar imediatamente
            iniciarAtualizacaoDashboard(sensorId);
            
            // Reiniciar intervalo com o novo ID
            window.dashboardInterval = setInterval(() => iniciarAtualizacaoDashboard(sensorId), 10000);
        });

    } catch (error) {
        console.error("Erro ao carregar seletor:", error);
    }
}

// ✅ FUNÇÃO DE RECOMENDAÇÃO
function obterRecomendacao(nivelRisco) {
  const recomendacoes = {
    CRITICO: '<span class="material-icons" style="vertical-align: middle; color: var(--risk-high);">error</span> ALERTA CRÍTICO! Erosão severa. Ações imediatas necessárias.',
    ALTO: '<span class="material-icons" style="vertical-align: middle; color: var(--risk-medium);">warning</span> Risco Alto. Implemente medidas de proteção urgentemente.',
    MEDIO: '<span class="material-icons" style="vertical-align: middle; color: #ffc107;">bolt</span> Risco Médio. Monitore e implemente proteção preventiva.',
    BAIXO: '<span class="material-icons" style="vertical-align: middle; color: var(--risk-low);">check_circle</span> Situação normal. Continue monitorando.',
    DESCONHECIDO: '<span class="material-icons" style="vertical-align: middle;">help</span> Dados insuficientes para análise.',
  };
  return recomendacoes[nivelRisco] || recomendacoes.DESCONHECIDO;
}

// ✅ ATUALIZAÇÃO VISUAL DO DASHBOARD (CARDS)
function renderizarDadosDashboard(dados) {
  if (!dados) return;

  // 1. CARDS DE SOLO
  atualizarElemento("umidade-solo", dados.umidade_solo, 1, "%");
  atualizarElemento("inclinacao", dados.inclinacao, 1, "°");
  atualizarElemento("temperatura-solo", dados.temperatura_solo, 1, "°C");
  atualizarElemento("taxa-erosao", dados.erosao, 2, "t/ha");
  
  // Novos elementos
  const elTipoSolo = document.getElementById("tipo-solo-badge");
  if (elTipoSolo) elTipoSolo.textContent = dados.tipo_solo;
  
  const elQualidade = document.getElementById("qualidade-leitura");
  if (elQualidade) elQualidade.textContent = dados.qualidade_leitura;

  // Atualizar título da seção se tiver identificador
  if (dados.identificador) {
      const titulo = document.querySelector(".lado h1");
      const subtitulo = document.querySelector(".lado p");
      if (titulo && subtitulo) {
          subtitulo.innerHTML = `Monitorando: <strong>${dados.identificador}</strong> (${dados.regiao || 'N/A'})`;
      }
  }

  // 2. CARDS DE CLIMA (Dados atuais do sensor)
  atualizarElemento("umidade-ar", dados.umidade_ar, 0, "%");
  atualizarElemento("temperatura-ar", dados.temperatura_ar, 1, "°C");

  // 3. STATUS GERAL E RISCO
  const statusEl = document.getElementById("status-geral");
  if (statusEl) {
    statusEl.textContent = dados.nivel_risco || "-";
    statusEl.className = (dados.nivel_risco || "").toLowerCase();
    
    // Piscar se CRÍTICO
    if (dados.nivel_risco === "CRITICO") {
        statusEl.classList.add("piscando");
    } else {
        statusEl.classList.remove("piscando");
    }
  }

  // Índice numérico e Barra
  if (dados.indice_risco !== undefined) {
    const indiceEl = document.getElementById("indice-risco");
    if (indiceEl) indiceEl.textContent = `${Number(dados.indice_risco).toFixed(1)}/100`;

    const barra = document.getElementById("barra-risco");
    if (barra) {
      const pct = Math.max(0, Math.min(100, Number(dados.indice_risco)));
      barra.style.width = `${pct}%`;
      
      // Cores da barra
      if (pct > 75) barra.style.backgroundColor = "#dc3545";
      else if (pct > 55) barra.style.backgroundColor = "#fd7e14";
      else if (pct > 30) barra.style.backgroundColor = "#ffc107";
      else barra.style.backgroundColor = "#28a745";
    }
  }

  // 4. RECOMENDAÇÃO
  const rec = document.getElementById("recomendacao");
  if (rec) rec.innerHTML = dados.recomendacao || "Aguardando dados...";
}

// Helper para atualizar elementos HTML
function atualizarElemento(id, valor, casasDecimais, unidade) {
    const el = document.getElementById(id);
    if (el) {
        el.innerHTML = `${parseFloat(valor || 0).toFixed(casasDecimais)}<small>${unidade}</small>`;
    }
}

// ✅ ATUALIZAR CARD DE CLIMA (PREVISÃO)
function atualizarCardClima(previsao) {
    if (!previsao) return;
    
    // Chuva prevista 24h
    const elChuva = document.querySelector("#climaCard .stat-value");
    if (elChuva) {
        elChuva.innerHTML = `${previsao.chuva_proximas_24h?.toFixed(1) || 0}<small>mm</small>`;
    }
    
    const elRisco = document.getElementById("riscoClimaIndicator");
    if (elRisco) {
        if (previsao.risco_chuva_intensa) {
            elRisco.innerHTML = '<span class="material-icons" style="vertical-align: middle;">warning</span> Chuva Intensa Prevista';
            elRisco.style.color = "#dc3545";
        } else {
            elRisco.innerHTML = "Sem risco imediato";
            elRisco.style.color = "#28a745";
        }
    }
    
    // Chuva Agora (se disponível)
    if (previsao.chuva_atual_3h !== undefined) {
        atualizarElemento("chuva-agora", previsao.chuva_atual_3h, 1, "mm");
    }
}

// ✅ RENDERIZAR LISTA DE ALERTAS (COM LIMITAÇÃO E BOTÃO VER MAIS)
function renderizarAlertas(alertas) {
    const container = document.querySelector(".risk-alerts");
    // Manter o cabeçalho
    const header = container.querySelector(".header-title-row");
    
    // Limpar conteúdo mantendo header
    if (header) {
        container.innerHTML = "";
        container.appendChild(header);
    } else {
        const oldAlerts = container.querySelectorAll(".alert-card, .btn-ver-mais");
        oldAlerts.forEach(el => el.remove());
    }
    
    if (!alertas || alertas.length === 0) {
        const empty = document.createElement("div");
        empty.className = "alert-card empty";
        empty.innerHTML = '<p><span class="material-icons" style="vertical-align: middle; color: var(--risk-low);">check_circle</span> Nenhum alerta de risco ativo no momento.</p>';
        container.appendChild(empty);
        return;
    }
    
    // Limitar a 3 alertas inicialmente
    const limiteInicial = 3;
    const alertasVisiveis = alertas.slice(0, limiteInicial);
    const alertasOcultos = alertas.slice(limiteInicial);
    
    // Função para criar card
    const criarCard = (alerta) => {
        const card = document.createElement("div");
        card.className = `alert-card ${alerta.nivel_criticidade.toLowerCase()}`;
        card.innerHTML = `
            <div class="alert-icon"><span class="material-icons">warning</span></div>
            <div class="alert-content">
                <h4>${alerta.tipo_alerta.replace(/_/g, " ")}</h4>
                <p>${alerta.mensagem || "Risco detectado pelo sistema."}</p>
                <small>${new Date(alerta.timestamp).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</small>
            </div>
        `;
        return card;
    };
    
    // Renderizar os primeiros
    alertasVisiveis.forEach(alerta => {
        container.appendChild(criarCard(alerta));
    });
    
    // Se houver mais, adicionar botão "Ver mais"
    if (alertasOcultos.length > 0) {
        const btnContainer = document.createElement("div");
        btnContainer.style.textAlign = "center";
        btnContainer.style.marginTop = "10px";
        
        const btnVerMais = document.createElement("button");
        btnVerMais.className = "btn-ver-mais"; // Adicione estilo CSS se necessário
        btnVerMais.textContent = `Ver mais (${alertasOcultos.length})`;
        btnVerMais.style.padding = "8px 16px";
        btnVerMais.style.cursor = "pointer";
        btnVerMais.style.backgroundColor = "#e9ecef";
        btnVerMais.style.border = "none";
        btnVerMais.style.borderRadius = "4px";
        btnVerMais.style.color = "#495057";
        
        btnVerMais.onclick = () => {
            // Renderizar o restante
            alertasOcultos.forEach(alerta => {
                // Inserir antes do botão
                container.insertBefore(criarCard(alerta), btnContainer);
            });
            // Remover botão após expandir
            btnContainer.remove();
        };
        
        btnContainer.appendChild(btnVerMais);
        container.appendChild(btnContainer);
    }
}

// ✅ EXECUTAR AO CARREGAR PÁGINA
document.addEventListener("DOMContentLoaded", () => {
  carregarSeletorSensores();
  iniciarAtualizacaoDashboard(); 
  window.dashboardInterval = setInterval(() => iniciarAtualizacaoDashboard(), 10000);
});

// Exportar funções para uso global
window.EroWatchAPI = {
  buscarMedicoesRecentes,
  buscarEstatisticas,
  buscarAlertasAtivos,
  buscarSensores,
  buscarMedicoesPorPeriodo,
  iniciarAtualizacaoDashboard,
  buscarPrevisaoClima,
};
