document.addEventListener("DOMContentLoaded", () => {
    const contentPlaceholders = document.querySelectorAll('[data-content-src]');
    contentPlaceholders.forEach(placeholder => {
        const src = placeholder.getAttribute('data-content-src');
        fetch(src)
            .then(response => response.text())
            .then(html => {
                placeholder.innerHTML = html;
            })
            .catch(err => console.error('Error loading ' + src, err));
    });

    document.querySelectorAll('.btn-modern[data-target]').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('data-target');
            const contentDiv = document.getElementById(targetId);

            if (contentDiv) {
                contentDiv.classList.toggle('active');

                if (this.id === 'manifestBtn') {
                    this.textContent = contentDiv.classList.contains('active') ? '-' : '+';
                } else {
                    this.textContent = contentDiv.classList.contains('active') ? '-' : '+';
                }
            }
        });
    });
});

// Multi-language Translation System using only translation files
class TranslationManager {
    constructor() {
        this.currentLang = localStorage.getItem('language') || 'de';
        this.translations = {};
        this.supportedLangs = {
            'de': 'Deutsch',
            'en': 'English',
            'tr': 'Türkçe',
            'ku': 'Kurdî',
            'ar': 'العربية',
            'bs': 'Bosanski',
            'es': 'Español'
        };
        this.init();
    }

    async init() {
        await this.loadTranslations();
        this.applyTranslations();
        this.setupLanguageSwitcher();
        this.setupContentLoader();
        this.updateHtmlLang();
    }

    async loadTranslations() {
        try {
            const response = await fetch(`translations/${this.currentLang}.json`);
            if (response.ok) {
                this.translations = await response.json();
            } else {
                console.error(`No translation file found for ${this.currentLang}`);
                this.translations = {};
            }
        } catch (error) {
            console.error('Error loading translations:', error);
            this.translations = {};
        }
    }

    async loadExternalContent(element, src) {
        if (!src) return;

        // Build language-specific file path
        const fileBase = src.replace('_de.html', '');
        const langFile = `${fileBase}_${this.currentLang}.html`;

        try {
            // Try to load language-specific version
            let response = await fetch(langFile);

            if (response.ok) {
                const html = await response.text();
                element.innerHTML = html;
                // Translate any text elements within loaded content
                await this.translateDynamicContent(element);
            } else {
                // Fallback to original German version
                response = await fetch(src);
                if (response.ok) {
                    const html = await response.text();
                    element.innerHTML = html;
                    console.warn(`No translation found for ${src} in ${this.currentLang}, showing German version`);
                } else {
                    element.innerHTML = '<p class="error">Content could not be loaded</p>';
                }
            }
        } catch (error) {
            console.error(`Error loading content from ${src}:`, error);
            element.innerHTML = '<p class="error">Content could not be loaded</p>';
        }
    }

    async translateDynamicContent(element) {
        // Translate elements with data-key attribute in dynamically loaded content
        const translatableElements = element.querySelectorAll('[data-key]');
        for (const el of translatableElements) {
            const key = el.getAttribute('data-key');
            if (this.translations[key]) {
                if (el.innerHTML === el.getAttribute('data-original') || !el.getAttribute('data-original')) {
                    el.setAttribute('data-original', el.innerHTML);
                    el.innerHTML = this.translations[key];
                }
            }
        }
    }

    applyTranslations() {
        // Translate all elements with data-key attribute
        document.querySelectorAll('[data-key]').forEach(element => {
            const key = element.getAttribute('data-key');
            if (this.translations[key]) {
                // Store original text if not already stored
                if (!element.hasAttribute('data-original')) {
                    element.setAttribute('data-original', element.innerHTML);
                }
                element.innerHTML = this.translations[key];
            }
        });
    }

    setupLanguageSwitcher() {
        const buttons = document.querySelectorAll('.lang-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', async () => {
                const lang = btn.getAttribute('data-lang');
                if (lang === this.currentLang) return;

                // Show loading indicator
                this.showLoadingIndicator();

                this.currentLang = lang;
                localStorage.setItem('language', lang);

                // Update active button state
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Load new translations
                await this.loadTranslations();

                // Reload all content with new language
                await this.reloadAllContent();

                // Apply translations to static content
                this.applyTranslations();

                // Update HTML language attribute
                this.updateHtmlLang();

                // Hide loading indicator
                this.hideLoadingIndicator();

                // Dispatch custom event
                window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
            });
        });
    }

    async reloadAllContent() {
        // Reload all expandable contents that are currently loaded
        const loadedContents = document.querySelectorAll('.expandable-content[data-loaded="true"]');
        for (const content of loadedContents) {
            const src = content.getAttribute('data-content-src');
            if (src) {
                // Clear and reload
                const wasVisible = content.style.display !== 'none';
                content.innerHTML = '';
                content.removeAttribute('data-loaded');
                await this.loadExternalContent(content, src);
                content.setAttribute('data-loaded', 'true');
                if (!wasVisible) {
                    content.style.display = 'none';
                }
            }
        }

        // Reload accordion contents that are open
        const openAccordions = document.querySelectorAll('details[open] .accordion-content[data-loaded="true"]');
        for (const content of openAccordions) {
            const src = content.getAttribute('data-content-src');
            if (src) {
                content.innerHTML = '';
                content.removeAttribute('data-loaded');
                await this.loadExternalContent(content, src);
                content.setAttribute('data-loaded', 'true');
            }
        }
    }

    setupContentLoader() {
        // Load content when buttons are clicked
        document.querySelectorAll('[data-target]').forEach(button => {
            button.addEventListener('click', async () => {
                const targetId = button.getAttribute('data-target');
                const targetElement = document.getElementById(targetId);

                if (targetElement && !targetElement.hasAttribute('data-loaded')) {
                    const src = targetElement.getAttribute('data-content-src');
                    if (src) {
                        await this.loadExternalContent(targetElement, src);
                        targetElement.setAttribute('data-loaded', 'true');
                        targetElement.style.display = 'block';
                    }
                } else if (targetElement) {
                    // Toggle visibility
                    targetElement.style.display = targetElement.style.display === 'none' ? 'block' : 'none';
                }
            });
        });

        // Handle accordion details
        document.querySelectorAll('details').forEach(details => {
            details.addEventListener('toggle', async () => {
                if (details.open) {
                    const content = details.querySelector('.accordion-content');
                    if (content && !content.hasAttribute('data-loaded')) {
                        const src = content.getAttribute('data-content-src');
                        if (src) {
                            await this.loadExternalContent(content, src);
                            content.setAttribute('data-loaded', 'true');
                        }
                    }
                }
            });
        });
    }

    updateHtmlLang() {
        document.documentElement.lang = this.currentLang;

        // Handle RTL for Arabic
        if (this.currentLang === 'ar') {
            document.documentElement.dir = 'rtl';
        } else {
            document.documentElement.dir = 'ltr';
        }
    }

    showLoadingIndicator() {
        let loader = document.querySelector('.global-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.className = 'global-loader';
            loader.innerHTML = '<div class="loader-spinner"></div><p>Loading translation...</p>';
            document.body.appendChild(loader);
        }
        loader.style.display = 'flex';
    }

    hideLoadingIndicator() {
        const loader = document.querySelector('.global-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.translationManager = new TranslationManager();
});