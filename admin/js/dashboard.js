/**
 * DASHBOARD ADMIN
 */

document.addEventListener('DOMContentLoaded', () => {
    carregarStats();
    carregarAlertasPendentes();
});

/**
 * Carregar Estatísticas Gerais
 */
async function carregarStats() {
    try {
        // 1. Sensores
        const resSensores = await fetch(`${API_URL}/sensores`, { headers: Auth.getAuthHeader() });
        const dataSensores = await resSensores.json();
        
        if (dataSensores.success) {
            const total = dataSensores.sensores.length;
            const ativos = dataSensores.sensores.filter(s => s.status === 'ativo').length;
            
            document.querySelector('.stat-card:nth-child(1) .value').textContent = ativos;
            document.querySelector('.stat-card:nth-child(1) .trend').textContent = `${total} total cadastrados`;
        }

        // 2. Alertas
        const resAlertas = await fetch(`${API_URL}/alertas/ativos`, { headers: Auth.getAuthHeader() });
        const dataAlertas = await resAlertas.json();

        if (dataAlertas.success) {
            const criticos = dataAlertas.por_criticidade.critico;
            const altos = dataAlertas.por_criticidade.alto;
            
            document.querySelector('.stat-card:nth-child(2) .value').textContent = criticos + altos;
            
            const trendEl = document.querySelector('.stat-card:nth-child(2) .trend');
            if (criticos > 0) {
                trendEl.textContent = `${criticos} Críticos! Ação necessária`;
                trendEl.style.color = 'var(--danger)';
            } else {
                trendEl.textContent = 'Monitoramento ativo';
                trendEl.style.color = 'var(--text-secondary)';
            }
        }

        // 3. Medições (Hoje)
        // Precisamos de um endpoint para estatísticas gerais ou contar do histórico
        // Vamos usar o endpoint de estatísticas de um sensor genérico ou criar um novo?
        // Por enquanto, vamos deixar placeholder ou pegar de um sensor principal se houver.
        // Melhor: Vamos pegar do endpoint de estatísticas de alertas que já temos e adaptar ou criar um novo endpoint de stats gerais.
        // Como não temos endpoint de "todas as medições do sistema hoje", vamos simular com "N/A" ou implementar depois.
        document.querySelector('.stat-card:nth-child(3) .value').textContent = "Online";
        document.querySelector('.stat-card:nth-child(3) .trend').textContent = "Sistema operando";

    } catch (error) {
        console.error("Erro ao carregar stats:", error);
    }
}

/**
 * Carregar Alertas Pendentes (Lista)
 */
async function carregarAlertasPendentes() {
    const container = document.querySelector('.alert-list-admin');
    container.innerHTML = '<p class="placeholder-text">Carregando...</p>';

    try {
        const response = await fetch(`${API_URL}/alertas/ativos`, { headers: Auth.getAuthHeader() });
        const data = await response.json();

        if (data.success && data.alertas.length > 0) {
            container.innerHTML = '';
            
            // Pegar os 5 mais importantes
            const prioritarios = data.alertas.slice(0, 5);

            prioritarios.forEach(alerta => {
                const item = document.createElement('div');
                item.className = `alert-item ${alerta.nivel_criticidade.toLowerCase()}`;
                
                const icone = getIconeAlerta(alerta.tipo_alerta);
                
                item.innerHTML = `
                    <div class="alert-icon">
                        <span class="material-icons">${icone}</span>
                    </div>
                    <div class="alert-content">
                        <h4>${alerta.tipo_alerta.replace(/_/g, ' ')}</h4>
                        <p>${alerta.mensagem}</p>
                        <small>
                            <span class="material-icons" style="font-size: 12px; vertical-align: middle;">place</span> 
                            ${alerta.sensores?.identificador} • ${formatarTempo(alerta.timestamp)}
                        </small>
                    </div>
                    <div class="alert-action">
                        <a href="alertas.html" class="btn-sm btn-secondary">Ver</a>
                    </div>
                `;
                container.appendChild(item);
            });
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons">check_circle</span>
                    <p>Tudo tranquilo! Nenhum alerta pendente.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error(error);
        container.innerHTML = '<p class="text-danger">Erro ao carregar alertas.</p>';
    }
}

function getIconeAlerta(tipo) {
    if (tipo.includes('CHUVA')) return 'thunderstorm';
    if (tipo.includes('SATURACAO')) return 'water_drop';
    if (tipo.includes('INCLINACAO') || tipo.includes('ANGULO')) return 'landslide';
    if (tipo.includes('COESAO')) return 'terrain';
    return 'warning';
}

function formatarTempo(iso) {
    const data = new Date(iso);
    const agora = new Date();
    const diff = Math.floor((agora - data) / 1000 / 60); // minutos

    if (diff < 60) return `${diff} min atrás`;
    const horas = Math.floor(diff / 60);
    if (horas < 24) return `${horas}h atrás`;
    return data.toLocaleDateString('pt-BR');
}
