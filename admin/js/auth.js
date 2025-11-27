/**
 * AUTHENTICATION SYSTEM
 * Gerencia login, logout e verificação de token
 */

const API_URL = 'http://localhost:3000/api';

const Auth = {
    /**
     * Realizar login
     */
    async login(email, senha) {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, senha })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Salvar token e dados do usuário
                localStorage.setItem('eroswatch_token', data.token);
                localStorage.setItem('eroswatch_user', JSON.stringify(data.user));
                return { success: true };
            } else {
                return { success: false, error: data.error || 'Falha no login' };
            }
        } catch (error) {
            console.error('Erro de conexão:', error);
            return { success: false, error: 'Erro de conexão com o servidor' };
        }
    },

    /**
     * Verificar se está logado (para proteger páginas)
     */
    checkLogin() {
        const token = localStorage.getItem('eroswatch_token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }
        // Opcional: Validar token com backend aqui
    },

    /**
     * Logout
     */
    logout() {
        localStorage.removeItem('eroswatch_token');
        localStorage.removeItem('eroswatch_user');
        window.location.href = 'login.html';
    },

    /**
     * Obter cabeçalho de autorização para requisições
     */
    getAuthHeader() {
        const token = localStorage.getItem('eroswatch_token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }
};

// Lógica da página de login
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const senha = document.getElementById('senha').value;
            const btn = loginForm.querySelector('button');
            const errorMsg = document.getElementById('errorMessage');
            const btnText = btn.querySelector('.btn-text');
            const loader = btn.querySelector('.loader');

            // UI Loading
            btn.disabled = true;
            btnText.style.display = 'none';
            loader.style.display = 'inline-block';
            errorMsg.style.display = 'none';

            // Tentar login
            const result = await Auth.login(email, senha);

            if (result.success) {
                window.location.href = 'index.html'; // Redirecionar para dashboard
            } else {
                // Mostrar erro
                errorMsg.textContent = result.error;
                errorMsg.style.display = 'block';
                
                // Reset UI
                btn.disabled = false;
                btnText.style.display = 'inline';
                loader.style.display = 'none';
            }
        });
    }
});
