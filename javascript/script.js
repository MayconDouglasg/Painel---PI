/**
 * EROWATCH - GRÁFICOS
 * Script principal para renderizar gráficos
 * Agora os dados vêm da API em tempo real!
 */

// Variáveis globais para os gráficos (para atualização dinâmica)
window.precipitationChart = null;
window.tempHumidityChart = null;
window.inclinationChart = null;
window.humidityEvolutionChart = null;

// ============================================
// CONFIGURAÇÕES PADRÃO DOS GRÁFICOS
// ============================================

const chartColors = {
  primary: 'rgba(42, 157, 143, 0.8)',     // Verde/Ciano
  primaryLight: 'rgba(42, 157, 143, 0.3)',
  secondary: 'rgba(231, 111, 81, 1)',     // Vermelho/Laranja
  secondaryLight: 'rgba(231, 111, 81, 0.3)',
  warning: 'rgba(244, 162, 97, 1)',       // Laranja
  success: 'rgba(42, 157, 143, 1)',       // Verde
  danger: 'rgba(231, 111, 81, 1)'         // Vermelho
};

// ============================================
// FUNÇÃO: Criar todos os gráficos
// ============================================
function renderCharts() {
  console.log('🎨 Renderizando gráficos iniciais...');

  // 1. GRÁFICO DE PRECIPITAÇÃO (7 dias)
  const precipCtx = document.getElementById('precipitationChart');
  if (precipCtx) {
    window.precipitationChart = new Chart(precipCtx, {
      type: 'line',
      data: {
        labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
        datasets: [{
          label: 'Precipitação Estimada (mm)',
          data: [0, 0, 0, 0, 0, 0, 0], // Será preenchido pela API
          backgroundColor: chartColors.primaryLight,
          borderColor: chartColors.primary,
          borderWidth: 2,
          tension: 0.4,
          fill: true,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { 
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.y}mm`
            }
          }
        },
        scales: {
          y: { 
            beginAtZero: true, 
            title: { display: true, text: 'mm' },
            ticks: { stepSize: 20 }
          }
        }
      }
    });
  }

  // 2. GRÁFICO DE TEMPERATURA & UMIDADE DO AR
  const tempHumCtx = document.getElementById('tempHumidityChart');
  if (tempHumCtx) {
    window.tempHumidityChart = new Chart(tempHumCtx, {
      type: 'line',
      data: {
        labels: ['Carregando...'],
        datasets: [
          {
            label: 'Temperatura (°C)',
            data: [],
            borderColor: chartColors.secondary,
            backgroundColor: 'rgba(0, 0, 0, 0)',
            tension: 0.3,
            borderWidth: 2,
            yAxisID: 'yTemp',
          },
          {
            label: 'Umidade (%)',
            data: [],
            borderColor: chartColors.primary,
            backgroundColor: 'rgba(0, 0, 0, 0)',
            tension: 0.3,
            borderWidth: 2,
            yAxisID: 'yHum',
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: true, position: 'top' }
        },
        scales: {
          yTemp: {
            type: 'linear',
            display: true,
            position: 'left',
            title: { display: true, text: 'Temperatura (°C)' },
            min: 15,
            max: 40
          },
          yHum: {
            type: 'linear',
            display: true,
            position: 'right',
            title: { display: true, text: 'Umidade (%)' },
            min: 0,
            max: 100,
            grid: { drawOnChartArea: false }
          }
        }
      }
    });
  }

  // 3. GRÁFICO DE INCLINAÇÃO POR ÁREA
  const inclinationCtx = document.getElementById('inclinationChart');
  if (inclinationCtx) {
    window.inclinationChart = new Chart(inclinationCtx, {
      type: 'bar',
      data: {
        labels: ['Carregando...'],
        datasets: [{
          label: 'Inclinação Média (°)',
          data: [],
          backgroundColor: [chartColors.success],
          borderWidth: 0,
          borderRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { 
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.y}° de inclinação`
            }
          }
        },
        scales: {
          y: { 
            beginAtZero: true, 
            max: 45, 
            title: { display: true, text: 'Graus (°)' },
            ticks: { stepSize: 10 }
          }
        }
      }
    });
  }

  // 4. GRÁFICO DE EVOLUÇÃO DA UMIDADE DO SOLO (24h)
  const humidityEvolutionCtx = document.getElementById('humidityEvolutionChart');
  if (humidityEvolutionCtx) {
    window.humidityEvolutionChart = new Chart(humidityEvolutionCtx, {
      type: 'bar',
      data: {
        labels: ['Carregando...'],
        datasets: [{
          label: 'Umidade do Solo (%)',
          data: [],
          backgroundColor: chartColors.primary,
          borderWidth: 0,
          borderRadius: 5,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { 
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.y}% de umidade`
            }
          }
        },
        scales: {
          y: { 
            beginAtZero: true, 
            max: 100, 
            title: { display: true, text: '%' },
            ticks: { stepSize: 20 }
          }
        }
      }
    });
  }

  console.log('✅ Gráficos inicializados! Aguardando dados da API...');
}

// ============================================
// FUNÇÃO: Atualizar gráficos com dados reais
// ============================================
function atualizarGraficosHistorico(medicoes) {
  if (!medicoes || medicoes.length === 0) return;

  console.log("📈 Atualizando gráficos com", medicoes.length, "medições");

  // Inverter para ordem cronológica (antigo -> novo)
  const dadosCronologicos = [...medicoes].reverse();
  
  // Limitar a 20 pontos para não poluir o gráfico
  const dadosRecentes = dadosCronologicos.slice(-20);
  
  const labels = dadosRecentes.map(m => {
    const d = new Date(m.timestamp);
    // FORÇAR FUSO HORÁRIO BRASIL (AMERICA/SAO_PAULO)
    return d.toLocaleTimeString('pt-BR', { 
        timeZone: 'America/Sao_Paulo', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
  });

  // 1. ATUALIZAR GRÁFICO DE TEMP/UMIDADE
  if (window.tempHumidityChart) {
    window.tempHumidityChart.data.labels = labels;
    
    // Mapear dados com fallback para previsao
    const temps = dadosRecentes.map(m => m.temperatura_ar || m.previsao?.temperatura || null);
    const umids = dadosRecentes.map(m => m.umidade_ar || m.previsao?.umidade || null);
    
    console.log("🌡️ Dados Temp/Umid:", { temps, umids });

    window.tempHumidityChart.data.datasets[0].data = temps;
    window.tempHumidityChart.data.datasets[1].data = umids;
    window.tempHumidityChart.update();
  }

  // 2. ATUALIZAR GRÁFICO DE UMIDADE DO SOLO
  if (window.humidityEvolutionChart) {
    window.humidityEvolutionChart.data.labels = labels;
    window.humidityEvolutionChart.data.datasets[0].data = dadosRecentes.map(m => m.umidade_solo);
    window.humidityEvolutionChart.update();
  }

  // 3. ATUALIZAR GRÁFICO DE INCLINAÇÃO
  if (window.inclinationChart) {
    // Agrupar inclinação média
    const inclinacaoMedia = dadosRecentes.reduce((acc, m) => acc + m.inclinacao_graus, 0) / dadosRecentes.length;
    
    window.inclinationChart.data.labels = ['Média Atual'];
    window.inclinationChart.data.datasets[0].data = [inclinacaoMedia];
    window.inclinationChart.update();
  }
}

// ============================================
// FUNÇÃO: Atualizar gráfico de chuva (Previsão)
// ============================================
function atualizarGraficoChuva(previsao) {
  if (!previsao || !previsao.dias || !window.precipitationChart) return;

  console.log("🌧️ Atualizando gráfico de chuva com", previsao.dias.length, "dias");

  const labels = previsao.dias.map(d => d.data);
  const dadosChuva = previsao.dias.map(d => d.chuva);

  window.precipitationChart.data.labels = labels;
  window.precipitationChart.data.datasets[0].data = dadosChuva;
  window.precipitationChart.update();
}

// Exportar para uso global
window.atualizarGraficosHistorico = atualizarGraficosHistorico;
window.atualizarGraficoChuva = atualizarGraficoChuva;

// ============================================
// INICIALIZAÇÃO
// ============================================

// Renderizar gráficos quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  console.log('🌱 EroWatch Dashboard - Inicializando gráficos...');
  renderCharts();
});