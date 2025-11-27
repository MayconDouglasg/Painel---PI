/**
 * Gerenciador de Tema (Dark/Light Mode)
 * RNF11 - Acessibilidade
 */

const ThemeManager = {
  // Chave para localStorage
  STORAGE_KEY: "erowatch_theme",

  // Inicializar
  init() {
    this.applySavedTheme();
    this.setupToggleButton();
  },

  // Aplicar tema salvo ou padrão
  applySavedTheme() {
    const savedTheme = localStorage.getItem(this.STORAGE_KEY);
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
    
    this.updateButtonIcon();
  },

  // Alternar tema
  toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const newTheme = current === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem(this.STORAGE_KEY, newTheme);
    
    this.updateButtonIcon();
  },
  
  // Atualizar ícone/texto do botão
  updateButtonIcon() {
    const btn = document.getElementById("themeToggleBtn");
    if (!btn) return;
    
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    
    // Atualiza o conteúdo do botão na sidebar
    btn.innerHTML = isDark 
      ? '<span class="material-icons">light_mode</span> Modo Claro' 
      : '<span class="material-icons">dark_mode</span> Modo Escuro';
  },

  // Configurar botão existente no HTML
  setupToggleButton() {
    const btn = document.getElementById("themeToggleBtn");
    if (btn) {
      btn.onclick = () => this.toggleTheme();
      this.updateButtonIcon();
    }
  }
};

// Iniciar quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  ThemeManager.init();
});
