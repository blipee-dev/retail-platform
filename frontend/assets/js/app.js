// Dark Mode Management
const DarkMode = {
    init() {
        // Check for saved preference or default to light mode
        const currentTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', currentTheme);
        
        // Update toggle button state
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            toggleBtn.innerHTML = currentTheme === 'dark' ? '☀️' : '🌙';
            toggleBtn.setAttribute('aria-label', currentTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        }
    },
    
    toggle() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            toggleBtn.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
            toggleBtn.setAttribute('aria-label', newTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        }
        
        // Dispatch event for theme change to update charts
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: newTheme } }));
    }
};

// Internationalization (i18n)
const i18n = {
    currentLocale: 'en',
    fallbackLocale: 'en',
    
    translations: {
        en: {
            // Common
            'app.name': 'blipee OS Retail Intelligence',
            'app.logout': 'Logout',
            'app.save': 'Save',
            'app.cancel': 'Cancel',
            'app.delete': 'Delete',
            'app.edit': 'Edit',
            'app.view': 'View',
            'app.search': 'Search',
            'app.filter': 'Filter',
            'app.export': 'Export',
            'app.import': 'Import',
            'app.settings': 'Settings',
            
            // Navigation
            'nav.dashboard': 'Dashboard',
            'nav.analytics': 'Analytics',
            'nav.sites': 'Sites',
            'nav.reports': 'Reports',
            'nav.settings': 'Settings',
            
            // Dashboard
            'dashboard.title': 'Dashboard',
            'dashboard.subtitle': 'Real-time overview of your retail operations',
            'dashboard.visitors_today': "Today's Visitors",
            'dashboard.revenue_today': "Today's Revenue",
            'dashboard.conversion_rate': 'Conversion Rate',
            'dashboard.capture_rate': 'Capture Rate',
            'dashboard.store_performance': 'Store Performance',
            'dashboard.recent_alerts': 'Recent Alerts',
            
            // Analytics
            'analytics.title': 'Analytics',
            'analytics.subtitle': 'Deep dive into your retail performance metrics and trends',
            'analytics.time_period': 'Time Period',
            'analytics.store': 'Store',
            'analytics.metric_type': 'Metric Type',
            'analytics.all_stores': 'All Stores',
            'analytics.visitor_trends': 'Visitor Trends',
            'analytics.revenue_by_store': 'Revenue by Store',
            
            // Sites
            'sites.title': 'Sites',
            'sites.subtitle': 'Manage your retail locations and monitoring devices',
            'sites.add_site': 'Add Site',
            'sites.import_sites': 'Import Sites',
            'sites.search_placeholder': 'Search sites...',
            'sites.all_status': 'All Status',
            'sites.online': 'Online',
            'sites.offline': 'Offline',
            
            // Reports
            'reports.title': 'Reports',
            'reports.subtitle': 'Generate, schedule, and manage your retail intelligence reports',
            'reports.create_report': 'Create Report',
            'reports.templates': 'Templates',
            'reports.scheduled': 'Scheduled',
            'reports.recent': 'Recent Reports',
            
            // Settings
            'settings.title': 'Settings',
            'settings.subtitle': 'Manage your account, team, and platform configuration',
            'settings.account': 'Account',
            'settings.notifications': 'Notifications',
            'settings.team': 'Team',
            'settings.api_keys': 'API Keys',
            
            // Login
            'login.title': 'Welcome to blipee',
            'login.subtitle': 'Enterprise Retail Intelligence Platform',
            'login.email': 'Email address',
            'login.password': 'Password',
            'login.remember_me': 'Remember me',
            'login.forgot_password': 'Forgot password?',
            'login.sign_in': 'Sign in',
            'login.or_continue_with': 'Or continue with',
            'login.sign_in_google': 'Sign in with Google',
            'login.sign_in_microsoft': 'Sign in with Microsoft',
            'login.security_notice': 'This is a secure system. All activities are monitored and recorded.',
            
            // Index/Mockups
            'index.title': 'blipee OS Mockups',
            'index.subtitle': 'Click on any mockup below to preview the page design.',
            'index.landing.title': 'Landing Page',
            'index.landing.desc': 'Professional marketing page with features and testimonials',
            'index.login.title': 'Login Page',
            'index.login.desc': 'Enterprise authentication with OAuth integration',
            'index.dashboard.title': 'Dashboard',
            'index.dashboard.desc': 'Main overview with KPIs and store performance metrics',
            'index.analytics.title': 'Analytics',
            'index.analytics.desc': 'Deep dive into retail performance metrics and trends',
            'index.sites.title': 'Sites',
            'index.sites.desc': 'Manage retail locations and monitoring devices',
            'index.reports.title': 'Reports',
            'index.reports.desc': 'Generate, schedule, and manage retail intelligence reports',
            'index.settings.title': 'Settings',
            'index.settings.desc': 'Account, team, and platform configuration',
            
            // Landing Page
            'landing.title': 'blipee OS - Enterprise Retail Intelligence Platform',
            'landing.nav.features': 'Features',
            'landing.nav.testimonials': 'Testimonials',
            'landing.nav.pricing': 'Pricing',
            'landing.nav.docs': 'Documentation',
            'landing.nav.signin': 'Sign In',
            'landing.nav.demo': 'Request Demo',
            'landing.hero.badge': 'Trusted by 500+ retail brands worldwide',
            'landing.hero.title': 'Transform Your Retail Operations with Real-Time Intelligence',
            'landing.hero.subtitle': 'Capture foot traffic, analyze customer behavior, and optimize store performance with our enterprise-grade retail analytics platform.',
            'landing.hero.cta.primary': 'Start Free Trial',
            'landing.hero.cta.secondary': 'Watch Demo',
            'landing.features.title': 'Everything You Need to Succeed',
            'landing.features.subtitle': 'Powerful features designed to help you understand and optimize your retail operations',
            'landing.features.traffic.title': 'Real-Time Foot Traffic',
            'landing.features.traffic.desc': 'Monitor customer flow in real-time with advanced people counting technology. Understand peak hours and optimize staffing.',
            'landing.features.analytics.title': 'Advanced Analytics',
            'landing.features.analytics.desc': 'Deep insights into customer behavior, conversion rates, and store performance with AI-powered analytics.',
            'landing.features.dashboard.title': 'Unified Dashboard',
            'landing.features.dashboard.desc': 'All your stores, all your data, in one powerful dashboard. Monitor performance across your entire retail network.',
            'landing.features.experience.title': 'Customer Experience',
            'landing.features.experience.desc': 'Improve customer satisfaction with data-driven insights into shopping patterns and preferences.',
            'landing.features.security.title': 'Enterprise Security',
            'landing.features.security.desc': 'SOC 2 Type II certified with end-to-end encryption, GDPR compliance, and role-based access control.',
            'landing.features.integration.title': 'Easy Integration',
            'landing.features.integration.desc': 'Seamlessly integrate with your existing POS, CRM, and business intelligence tools via our robust API.',
            'landing.metrics.accuracy': 'Accuracy Rate',
            'landing.metrics.customers': 'Happy Customers',
            'landing.metrics.visitors': 'Visitors Tracked Daily',
            'landing.metrics.uptime': 'Uptime SLA',
            'landing.testimonials.title': 'Loved by Retail Leaders',
            'landing.testimonials.subtitle': 'See what our customers have to say about transforming their retail operations',
            'landing.testimonials.1.content': '"blipee OS has revolutionized how we understand our customers. The real-time insights have helped us increase conversion rates by 23% in just 6 months."',
            'landing.testimonials.1.name': 'Sarah Mitchell',
            'landing.testimonials.1.title': 'VP of Retail Operations, Fashion Forward',
            'landing.testimonials.2.content': '"The platform\'s ease of use and powerful analytics have made it indispensable for our multi-store operations. ROI was achieved within 3 months."',
            'landing.testimonials.2.name': 'James Chen',
            'landing.testimonials.2.title': 'CEO, TechStyle Retail Group',
            'landing.testimonials.3.content': '"Outstanding support team and a product that delivers on its promises. Our staff scheduling efficiency improved by 40%."',
            'landing.testimonials.3.name': 'Emma Parker',
            'landing.testimonials.3.title': 'Director of Operations, Urban Outfitters',
            'landing.cta.title': 'Ready to Transform Your Retail Business?',
            'landing.cta.subtitle': 'Join hundreds of successful retailers already using blipee OS',
            'landing.cta.demo': 'Schedule a Demo',
            'landing.cta.trial': 'Start 30-Day Free Trial',
            'landing.footer.product.features': 'Features',
            'landing.footer.product.pricing': 'Pricing',
            'landing.footer.product.api': 'API Documentation',
            'landing.footer.product.integrations': 'Integrations',
            'landing.footer.company.about': 'About Us',
            'landing.footer.company.careers': 'Careers',
            'landing.footer.company.blog': 'Blog',
            'landing.footer.company.press': 'Press',
            'landing.footer.resources.docs': 'Documentation',
            'landing.footer.resources.guides': 'Guides',
            'landing.footer.resources.webinars': 'Webinars',
            'landing.footer.resources.support': 'Support Center',
            'landing.footer.legal.privacy': 'Privacy Policy',
            'landing.footer.legal.terms': 'Terms of Service',
            'landing.footer.legal.security': 'Security',
            'landing.footer.legal.gdpr': 'GDPR'
        },
        
        es: {
            // Common
            'app.name': 'blipee OS Inteligencia Retail',
            'app.logout': 'Cerrar sesión',
            'app.save': 'Guardar',
            'app.cancel': 'Cancelar',
            'app.delete': 'Eliminar',
            'app.edit': 'Editar',
            'app.view': 'Ver',
            'app.search': 'Buscar',
            'app.filter': 'Filtrar',
            'app.export': 'Exportar',
            'app.import': 'Importar',
            'app.settings': 'Configuración',
            
            // Navigation
            'nav.dashboard': 'Panel',
            'nav.analytics': 'Análisis',
            'nav.sites': 'Sitios',
            'nav.reports': 'Informes',
            'nav.settings': 'Configuración',
            
            // Dashboard
            'dashboard.title': 'Panel de Control',
            'dashboard.subtitle': 'Vista en tiempo real de sus operaciones de retail',
            'dashboard.visitors_today': 'Visitantes de hoy',
            'dashboard.revenue_today': 'Ingresos de hoy',
            'dashboard.conversion_rate': 'Tasa de conversión',
            'dashboard.capture_rate': 'Tasa de captura',
            'dashboard.store_performance': 'Rendimiento de tiendas',
            'dashboard.recent_alerts': 'Alertas recientes',
            
            // Analytics
            'analytics.title': 'Análisis',
            'analytics.subtitle': 'Análisis profundo de sus métricas y tendencias',
            'analytics.time_period': 'Período',
            'analytics.store': 'Tienda',
            'analytics.metric_type': 'Tipo de métrica',
            'analytics.all_stores': 'Todas las tiendas',
            'analytics.visitor_trends': 'Tendencias de visitantes',
            'analytics.revenue_by_store': 'Ingresos por tienda',
            
            // Sites
            'sites.title': 'Sitios',
            'sites.subtitle': 'Gestione sus ubicaciones y dispositivos de monitoreo',
            'sites.add_site': 'Agregar sitio',
            'sites.import_sites': 'Importar sitios',
            'sites.search_placeholder': 'Buscar sitios...',
            'sites.all_status': 'Todos los estados',
            'sites.online': 'En línea',
            'sites.offline': 'Fuera de línea',
            
            // Reports
            'reports.title': 'Informes',
            'reports.subtitle': 'Genere, programe y administre sus informes',
            'reports.create_report': 'Crear informe',
            'reports.templates': 'Plantillas',
            'reports.scheduled': 'Programados',
            'reports.recent': 'Informes recientes',
            
            // Settings
            'settings.title': 'Configuración',
            'settings.subtitle': 'Administre su cuenta, equipo y configuración',
            'settings.account': 'Cuenta',
            'settings.notifications': 'Notificaciones',
            'settings.team': 'Equipo',
            'settings.api_keys': 'Claves API',
            
            // Login
            'login.title': 'Bienvenido a blipee',
            'login.subtitle': 'Plataforma de Inteligencia Retail Empresarial',
            'login.email': 'Correo electrónico',
            'login.password': 'Contraseña',
            'login.remember_me': 'Recordarme',
            'login.forgot_password': '¿Olvidó su contraseña?',
            'login.sign_in': 'Iniciar sesión',
            'login.or_continue_with': 'O continuar con',
            'login.sign_in_google': 'Iniciar sesión con Google',
            'login.sign_in_microsoft': 'Iniciar sesión con Microsoft',
            'login.security_notice': 'Este es un sistema seguro. Todas las actividades son monitoreadas y registradas.',
            
            // Index/Mockups
            'index.title': 'Maquetas de blipee OS',
            'index.subtitle': 'Haga clic en cualquier maqueta para ver el diseño de la página.',
            'index.landing.title': 'Página de Destino',
            'index.landing.desc': 'Página de marketing profesional con características y testimonios',
            'index.login.title': 'Página de Inicio de Sesión',
            'index.login.desc': 'Autenticación empresarial con integración OAuth',
            'index.dashboard.title': 'Panel de Control',
            'index.dashboard.desc': 'Vista general con KPIs y métricas de rendimiento',
            'index.analytics.title': 'Análisis',
            'index.analytics.desc': 'Análisis profundo de métricas y tendencias',
            'index.sites.title': 'Sitios',
            'index.sites.desc': 'Gestione ubicaciones y dispositivos de monitoreo',
            'index.reports.title': 'Informes',
            'index.reports.desc': 'Genere, programe y administre informes',
            'index.settings.title': 'Configuración',
            'index.settings.desc': 'Configuración de cuenta, equipo y plataforma',
            
            // Landing Page
            'landing.title': 'blipee OS - Plataforma de Inteligencia Retail Empresarial',
            'landing.nav.features': 'Características',
            'landing.nav.testimonials': 'Testimonios',
            'landing.nav.pricing': 'Precios',
            'landing.nav.docs': 'Documentación',
            'landing.nav.signin': 'Iniciar Sesión',
            'landing.nav.demo': 'Solicitar Demo',
            'landing.hero.badge': 'Confiado por más de 500 marcas minoristas en todo el mundo',
            'landing.hero.title': 'Transforma Tus Operaciones Minoristas con Inteligencia en Tiempo Real',
            'landing.hero.subtitle': 'Captura el tráfico peatonal, analiza el comportamiento del cliente y optimiza el rendimiento de la tienda con nuestra plataforma de análisis minorista de nivel empresarial.',
            'landing.hero.cta.primary': 'Iniciar Prueba Gratuita',
            'landing.hero.cta.secondary': 'Ver Demo',
            'landing.features.title': 'Todo lo que Necesitas para Tener Éxito',
            'landing.features.subtitle': 'Características poderosas diseñadas para ayudarte a entender y optimizar tus operaciones minoristas',
            'landing.features.traffic.title': 'Tráfico Peatonal en Tiempo Real',
            'landing.features.traffic.desc': 'Monitorea el flujo de clientes en tiempo real con tecnología avanzada de conteo de personas. Comprende las horas pico y optimiza el personal.',
            'landing.features.analytics.title': 'Análisis Avanzado',
            'landing.features.analytics.desc': 'Información profunda sobre el comportamiento del cliente, tasas de conversión y rendimiento de la tienda con análisis impulsado por IA.',
            'landing.features.dashboard.title': 'Panel Unificado',
            'landing.features.dashboard.desc': 'Todas tus tiendas, todos tus datos, en un poderoso panel. Monitorea el rendimiento en toda tu red minorista.',
            'landing.features.experience.title': 'Experiencia del Cliente',
            'landing.features.experience.desc': 'Mejora la satisfacción del cliente con información basada en datos sobre patrones de compra y preferencias.',
            'landing.features.security.title': 'Seguridad Empresarial',
            'landing.features.security.desc': 'Certificado SOC 2 Tipo II con cifrado de extremo a extremo, cumplimiento GDPR y control de acceso basado en roles.',
            'landing.features.integration.title': 'Integración Fácil',
            'landing.features.integration.desc': 'Integra sin problemas con tu POS, CRM y herramientas de inteligencia empresarial existentes a través de nuestra robusta API.',
            'landing.metrics.accuracy': 'Tasa de Precisión',
            'landing.metrics.customers': 'Clientes Satisfechos',
            'landing.metrics.visitors': 'Visitantes Rastreados Diariamente',
            'landing.metrics.uptime': 'SLA de Tiempo de Actividad',
            'landing.testimonials.title': 'Amado por Líderes Minoristas',
            'landing.testimonials.subtitle': 'Mira lo que nuestros clientes dicen sobre la transformación de sus operaciones minoristas',
            'landing.testimonials.1.content': '"blipee OS ha revolucionado cómo entendemos a nuestros clientes. Los conocimientos en tiempo real nos han ayudado a aumentar las tasas de conversión en un 23% en solo 6 meses."',
            'landing.testimonials.1.name': 'Sarah Mitchell',
            'landing.testimonials.1.title': 'VP de Operaciones Minoristas, Fashion Forward',
            'landing.testimonials.2.content': '"La facilidad de uso de la plataforma y los potentes análisis la han hecho indispensable para nuestras operaciones multi-tienda. El ROI se logró en 3 meses."',
            'landing.testimonials.2.name': 'James Chen',
            'landing.testimonials.2.title': 'CEO, TechStyle Retail Group',
            'landing.testimonials.3.content': '"Excelente equipo de soporte y un producto que cumple sus promesas. Nuestra eficiencia de programación de personal mejoró en un 40%."',
            'landing.testimonials.3.name': 'Emma Parker',
            'landing.testimonials.3.title': 'Directora de Operaciones, Urban Outfitters',
            'landing.cta.title': '¿Listo para Transformar tu Negocio Minorista?',
            'landing.cta.subtitle': 'Únete a cientos de minoristas exitosos que ya usan blipee OS',
            'landing.cta.demo': 'Programar una Demo',
            'landing.cta.trial': 'Iniciar Prueba Gratuita de 30 Días',
            'landing.footer.product.features': 'Características',
            'landing.footer.product.pricing': 'Precios',
            'landing.footer.product.api': 'Documentación API',
            'landing.footer.product.integrations': 'Integraciones',
            'landing.footer.company.about': 'Acerca de Nosotros',
            'landing.footer.company.careers': 'Carreras',
            'landing.footer.company.blog': 'Blog',
            'landing.footer.company.press': 'Prensa',
            'landing.footer.resources.docs': 'Documentación',
            'landing.footer.resources.guides': 'Guías',
            'landing.footer.resources.webinars': 'Webinars',
            'landing.footer.resources.support': 'Centro de Soporte',
            'landing.footer.legal.privacy': 'Política de Privacidad',
            'landing.footer.legal.terms': 'Términos de Servicio',
            'landing.footer.legal.security': 'Seguridad',
            'landing.footer.legal.gdpr': 'GDPR'
        },
        
        fr: {
            // Common
            'app.name': 'blipee OS Intelligence Retail',
            'app.logout': 'Déconnexion',
            'app.save': 'Enregistrer',
            'app.cancel': 'Annuler',
            'app.delete': 'Supprimer',
            'app.edit': 'Modifier',
            'app.view': 'Voir',
            'app.search': 'Rechercher',
            'app.filter': 'Filtrer',
            'app.export': 'Exporter',
            'app.import': 'Importer',
            'app.settings': 'Paramètres',
            
            // Navigation
            'nav.dashboard': 'Tableau de bord',
            'nav.analytics': 'Analytique',
            'nav.sites': 'Sites',
            'nav.reports': 'Rapports',
            'nav.settings': 'Paramètres',
            
            // Dashboard
            'dashboard.title': 'Tableau de bord',
            'dashboard.subtitle': 'Vue en temps réel de vos opérations de vente au détail',
            'dashboard.visitors_today': "Visiteurs d'aujourd'hui",
            'dashboard.revenue_today': "Revenus d'aujourd'hui",
            'dashboard.conversion_rate': 'Taux de conversion',
            'dashboard.capture_rate': 'Taux de capture',
            'dashboard.store_performance': 'Performance des magasins',
            'dashboard.recent_alerts': 'Alertes récentes',
            
            // Index/Mockups
            'index.title': 'Maquettes blipee OS',
            'index.subtitle': 'Cliquez sur n\'importe quelle maquette pour prévisualiser la conception de la page.',
            'index.landing.title': 'Page d\'Accueil',
            'index.landing.desc': 'Page de marketing professionnelle avec fonctionnalités et témoignages',
            'index.login.title': 'Page de Connexion',
            'index.login.desc': 'Authentification d\'entreprise avec intégration OAuth',
            'index.dashboard.title': 'Tableau de bord',
            'index.dashboard.desc': 'Vue d\'ensemble avec KPI et métriques de performance',
            'index.analytics.title': 'Analytique',
            'index.analytics.desc': 'Analyse approfondie des métriques et tendances',
            'index.sites.title': 'Sites',
            'index.sites.desc': 'Gérez les emplacements et les dispositifs de surveillance',
            'index.reports.title': 'Rapports',
            'index.reports.desc': 'Générez, planifiez et gérez les rapports',
            'index.settings.title': 'Paramètres',
            'index.settings.desc': 'Configuration du compte, de l\'équipe et de la plateforme',
            
            // Landing Page
            'landing.title': 'blipee OS - Plateforme d\'Intelligence Retail d\'Entreprise',
            'landing.nav.features': 'Fonctionnalités',
            'landing.nav.testimonials': 'Témoignages',
            'landing.nav.pricing': 'Tarifs',
            'landing.nav.docs': 'Documentation',
            'landing.nav.signin': 'Se Connecter',
            'landing.nav.demo': 'Demander une Démo',
            'landing.hero.badge': 'Fait confiance par plus de 500 marques de vente au détail dans le monde',
            'landing.hero.title': 'Transformez Vos Opérations de Vente au Détail avec l\'Intelligence en Temps Réel',
            'landing.hero.subtitle': 'Capturez le trafic piétonnier, analysez le comportement des clients et optimisez les performances des magasins avec notre plateforme d\'analyse de vente au détail de niveau entreprise.',
            'landing.hero.cta.primary': 'Commencer l\'Essai Gratuit',
            'landing.hero.cta.secondary': 'Voir la Démo',
            'landing.features.title': 'Tout ce Dont Vous Avez Besoin pour Réussir',
            'landing.features.subtitle': 'Des fonctionnalités puissantes conçues pour vous aider à comprendre et optimiser vos opérations de vente au détail',
            'landing.features.traffic.title': 'Trafic Piétonnier en Temps Réel',
            'landing.features.traffic.desc': 'Surveillez le flux de clients en temps réel avec une technologie avancée de comptage de personnes. Comprenez les heures de pointe et optimisez le personnel.',
            'landing.features.analytics.title': 'Analyses Avancées',
            'landing.features.analytics.desc': 'Des informations approfondies sur le comportement des clients, les taux de conversion et les performances des magasins avec des analyses alimentées par l\'IA.',
            'landing.features.dashboard.title': 'Tableau de Bord Unifié',
            'landing.features.dashboard.desc': 'Tous vos magasins, toutes vos données, dans un seul tableau de bord puissant. Surveillez les performances sur l\'ensemble de votre réseau de vente au détail.',
            'landing.features.experience.title': 'Expérience Client',
            'landing.features.experience.desc': 'Améliorez la satisfaction client avec des informations basées sur les données sur les habitudes d\'achat et les préférences.',
            'landing.features.security.title': 'Sécurité d\'Entreprise',
            'landing.features.security.desc': 'Certifié SOC 2 Type II avec chiffrement de bout en bout, conformité RGPD et contrôle d\'accès basé sur les rôles.',
            'landing.features.integration.title': 'Intégration Facile',
            'landing.features.integration.desc': 'Intégrez facilement avec vos outils POS, CRM et business intelligence existants via notre API robuste.',
            'landing.metrics.accuracy': 'Taux de Précision',
            'landing.metrics.customers': 'Clients Satisfaits',
            'landing.metrics.visitors': 'Visiteurs Suivis Quotidiennement',
            'landing.metrics.uptime': 'SLA de Disponibilité',
            'landing.testimonials.title': 'Aimé par les Leaders du Retail',
            'landing.testimonials.subtitle': 'Découvrez ce que nos clients disent sur la transformation de leurs opérations de vente au détail',
            'landing.testimonials.1.content': '"blipee OS a révolutionné notre compréhension de nos clients. Les informations en temps réel nous ont aidés à augmenter les taux de conversion de 23% en seulement 6 mois."',
            'landing.testimonials.1.name': 'Sarah Mitchell',
            'landing.testimonials.1.title': 'VP Opérations Retail, Fashion Forward',
            'landing.testimonials.2.content': '"La facilité d\'utilisation de la plateforme et ses analyses puissantes l\'ont rendue indispensable pour nos opérations multi-magasins. Le ROI a été atteint en 3 mois."',
            'landing.testimonials.2.name': 'James Chen',
            'landing.testimonials.2.title': 'PDG, TechStyle Retail Group',
            'landing.testimonials.3.content': '"Équipe de support exceptionnelle et un produit qui tient ses promesses. Notre efficacité de planification du personnel s\'est améliorée de 40%."',
            'landing.testimonials.3.name': 'Emma Parker',
            'landing.testimonials.3.title': 'Directrice des Opérations, Urban Outfitters',
            'landing.cta.title': 'Prêt à Transformer Votre Entreprise de Vente au Détail?',
            'landing.cta.subtitle': 'Rejoignez des centaines de détaillants prospères qui utilisent déjà blipee OS',
            'landing.cta.demo': 'Planifier une Démo',
            'landing.cta.trial': 'Commencer l\'Essai Gratuit de 30 Jours',
            'landing.footer.product.features': 'Fonctionnalités',
            'landing.footer.product.pricing': 'Tarifs',
            'landing.footer.product.api': 'Documentation API',
            'landing.footer.product.integrations': 'Intégrations',
            'landing.footer.company.about': 'À Propos de Nous',
            'landing.footer.company.careers': 'Carrières',
            'landing.footer.company.blog': 'Blog',
            'landing.footer.company.press': 'Presse',
            'landing.footer.resources.docs': 'Documentation',
            'landing.footer.resources.guides': 'Guides',
            'landing.footer.resources.webinars': 'Webinaires',
            'landing.footer.resources.support': 'Centre de Support',
            'landing.footer.legal.privacy': 'Politique de Confidentialité',
            'landing.footer.legal.terms': 'Conditions d\'Utilisation',
            'landing.footer.legal.security': 'Sécurité',
            'landing.footer.legal.gdpr': 'RGPD'
        },
        
        pt: {
            // Common
            'app.name': 'blipee OS Inteligência de Retalho',
            'app.logout': 'Terminar sessão',
            'app.save': 'Guardar',
            'app.cancel': 'Cancelar',
            'app.delete': 'Eliminar',
            'app.edit': 'Editar',
            'app.view': 'Ver',
            'app.search': 'Pesquisar',
            'app.filter': 'Filtrar',
            'app.export': 'Exportar',
            'app.import': 'Importar',
            'app.settings': 'Definições',
            
            // Navigation
            'nav.dashboard': 'Painel',
            'nav.analytics': 'Análises',
            'nav.sites': 'Lojas',
            'nav.reports': 'Relatórios',
            'nav.settings': 'Definições',
            
            // Dashboard
            'dashboard.title': 'Painel de Controlo',
            'dashboard.subtitle': 'Visão em tempo real das suas operações de retalho',
            'dashboard.visitors_today': 'Visitantes de Hoje',
            'dashboard.revenue_today': 'Receita de Hoje',
            'dashboard.conversion_rate': 'Taxa de Conversão',
            'dashboard.capture_rate': 'Taxa de Captura',
            'dashboard.store_performance': 'Desempenho das Lojas',
            'dashboard.recent_alerts': 'Alertas Recentes',
            
            // Analytics
            'analytics.title': 'Análises',
            'analytics.subtitle': 'Análise aprofundada das suas métricas e tendências de retalho',
            'analytics.time_period': 'Período',
            'analytics.store': 'Loja',
            'analytics.metric_type': 'Tipo de Métrica',
            'analytics.all_stores': 'Todas as Lojas',
            'analytics.visitor_trends': 'Tendências de Visitantes',
            'analytics.revenue_by_store': 'Receita por Loja',
            
            // Sites
            'sites.title': 'Lojas',
            'sites.subtitle': 'Gerir as suas localizações e dispositivos de monitorização',
            'sites.add_site': 'Adicionar Loja',
            'sites.import_sites': 'Importar Lojas',
            'sites.search_placeholder': 'Pesquisar lojas...',
            'sites.all_status': 'Todos os Estados',
            'sites.online': 'Online',
            'sites.offline': 'Offline',
            
            // Reports
            'reports.title': 'Relatórios',
            'reports.subtitle': 'Gerar, agendar e gerir os seus relatórios de inteligência de retalho',
            'reports.create_report': 'Criar Relatório',
            'reports.templates': 'Modelos',
            'reports.scheduled': 'Agendados',
            'reports.recent': 'Relatórios Recentes',
            
            // Settings
            'settings.title': 'Definições',
            'settings.subtitle': 'Gerir a sua conta, equipa e configuração da plataforma',
            'settings.account': 'Conta',
            'settings.notifications': 'Notificações',
            'settings.team': 'Equipa',
            'settings.api_keys': 'Chaves API',
            
            // Login
            'login.title': 'Bem-vindo ao blipee',
            'login.subtitle': 'Plataforma de Inteligência de Retalho Empresarial',
            'login.email': 'Endereço de email',
            'login.password': 'Palavra-passe',
            'login.remember_me': 'Lembrar-me',
            'login.forgot_password': 'Esqueceu-se da palavra-passe?',
            'login.sign_in': 'Iniciar sessão',
            'login.or_continue_with': 'Ou continuar com',
            'login.sign_in_google': 'Entrar com Google',
            'login.sign_in_microsoft': 'Entrar com Microsoft',
            'login.security_notice': 'Este é um sistema seguro. Todas as atividades são monitorizadas e registadas.',
            
            // Index/Mockups
            'index.title': 'Maquetes blipee OS',
            'index.subtitle': 'Clique em qualquer maquete para pré-visualizar o design da página.',
            'index.landing.title': 'Página Inicial',
            'index.landing.desc': 'Página de marketing profissional com funcionalidades e testemunhos',
            'index.login.title': 'Página de Início de Sessão',
            'index.login.desc': 'Autenticação empresarial com integração OAuth',
            'index.dashboard.title': 'Painel de Controlo',
            'index.dashboard.desc': 'Visão geral com KPIs e métricas de desempenho',
            'index.analytics.title': 'Análises',
            'index.analytics.desc': 'Análise aprofundada de métricas e tendências',
            'index.sites.title': 'Lojas',
            'index.sites.desc': 'Gerir localizações e dispositivos de monitorização',
            'index.reports.title': 'Relatórios',
            'index.reports.desc': 'Gerar, agendar e gerir relatórios',
            'index.settings.title': 'Definições',
            'index.settings.desc': 'Configuração de conta, equipa e plataforma',
            
            // Landing Page
            'landing.title': 'blipee OS - Plataforma de Inteligência de Retalho Empresarial',
            'landing.nav.features': 'Funcionalidades',
            'landing.nav.testimonials': 'Testemunhos',
            'landing.nav.pricing': 'Preços',
            'landing.nav.docs': 'Documentação',
            'landing.nav.signin': 'Iniciar Sessão',
            'landing.nav.demo': 'Solicitar Demonstração',
            'landing.hero.badge': 'Confiado por mais de 500 marcas de retalho em todo o mundo',
            'landing.hero.title': 'Transforme as Suas Operações de Retalho com Inteligência em Tempo Real',
            'landing.hero.subtitle': 'Capture o tráfego pedonal, analise o comportamento do cliente e otimize o desempenho da loja com a nossa plataforma de análise de retalho de nível empresarial.',
            'landing.hero.cta.primary': 'Iniciar Teste Gratuito',
            'landing.hero.cta.secondary': 'Ver Demonstração',
            'landing.features.title': 'Tudo o que Precisa para Ter Sucesso',
            'landing.features.subtitle': 'Funcionalidades poderosas concebidas para ajudá-lo a compreender e otimizar as suas operações de retalho',
            'landing.features.traffic.title': 'Tráfego Pedonal em Tempo Real',
            'landing.features.traffic.desc': 'Monitorize o fluxo de clientes em tempo real com tecnologia avançada de contagem de pessoas. Compreenda as horas de pico e otimize o pessoal.',
            'landing.features.analytics.title': 'Análises Avançadas',
            'landing.features.analytics.desc': 'Insights profundos sobre o comportamento do cliente, taxas de conversão e desempenho da loja com análises alimentadas por IA.',
            'landing.features.dashboard.title': 'Painel Unificado',
            'landing.features.dashboard.desc': 'Todas as suas lojas, todos os seus dados, num painel poderoso. Monitorize o desempenho em toda a sua rede de retalho.',
            'landing.features.experience.title': 'Experiência do Cliente',
            'landing.features.experience.desc': 'Melhore a satisfação do cliente com insights baseados em dados sobre padrões de compra e preferências.',
            'landing.features.security.title': 'Segurança Empresarial',
            'landing.features.security.desc': 'Certificado SOC 2 Tipo II com encriptação ponta a ponta, conformidade RGPD e controlo de acesso baseado em funções.',
            'landing.features.integration.title': 'Integração Fácil',
            'landing.features.integration.desc': 'Integre facilmente com os seus sistemas POS, CRM e ferramentas de business intelligence existentes através da nossa API robusta.',
            'landing.metrics.accuracy': 'Taxa de Precisão',
            'landing.metrics.customers': 'Clientes Satisfeitos',
            'landing.metrics.visitors': 'Visitantes Rastreados Diariamente',
            'landing.metrics.uptime': 'SLA de Disponibilidade',
            'landing.testimonials.title': 'Adorado por Líderes de Retalho',
            'landing.testimonials.subtitle': 'Veja o que os nossos clientes dizem sobre a transformação das suas operações de retalho',
            'landing.testimonials.1.content': '"O blipee OS revolucionou a forma como compreendemos os nossos clientes. Os insights em tempo real ajudaram-nos a aumentar as taxas de conversão em 23% em apenas 6 meses."',
            'landing.testimonials.1.name': 'Sarah Mitchell',
            'landing.testimonials.1.title': 'VP de Operações de Retalho, Fashion Forward',
            'landing.testimonials.2.content': '"A facilidade de utilização da plataforma e as análises poderosas tornaram-na indispensável para as nossas operações multi-loja. O ROI foi alcançado em 3 meses."',
            'landing.testimonials.2.name': 'James Chen',
            'landing.testimonials.2.title': 'CEO, TechStyle Retail Group',
            'landing.testimonials.3.content': '"Equipa de suporte excecional e um produto que cumpre as suas promessas. A nossa eficiência de agendamento de pessoal melhorou 40%."',
            'landing.testimonials.3.name': 'Emma Parker',
            'landing.testimonials.3.title': 'Diretora de Operações, Urban Outfitters',
            'landing.cta.title': 'Pronto para Transformar o Seu Negócio de Retalho?',
            'landing.cta.subtitle': 'Junte-se a centenas de retalhistas bem-sucedidos que já utilizam o blipee OS',
            'landing.cta.demo': 'Agendar Demonstração',
            'landing.cta.trial': 'Iniciar Teste Gratuito de 30 Dias',
            'landing.footer.product.features': 'Funcionalidades',
            'landing.footer.product.pricing': 'Preços',
            'landing.footer.product.api': 'Documentação API',
            'landing.footer.product.integrations': 'Integrações',
            'landing.footer.company.about': 'Sobre Nós',
            'landing.footer.company.careers': 'Carreiras',
            'landing.footer.company.blog': 'Blog',
            'landing.footer.company.press': 'Imprensa',
            'landing.footer.resources.docs': 'Documentação',
            'landing.footer.resources.guides': 'Guias',
            'landing.footer.resources.webinars': 'Webinars',
            'landing.footer.resources.support': 'Centro de Suporte',
            'landing.footer.legal.privacy': 'Política de Privacidade',
            'landing.footer.legal.terms': 'Termos de Serviço',
            'landing.footer.legal.security': 'Segurança',
            'landing.footer.legal.gdpr': 'RGPD'
        }
    },
    
    init() {
        // Get saved locale or use browser locale
        const savedLocale = localStorage.getItem('locale');
        const browserLocale = navigator.language.split('-')[0];
        
        this.currentLocale = savedLocale || (this.translations[browserLocale] ? browserLocale : this.fallbackLocale);
        this.updatePage();
    },
    
    setLocale(locale) {
        if (this.translations[locale]) {
            this.currentLocale = locale;
            localStorage.setItem('locale', locale);
            this.updatePage();
        }
    },
    
    t(key) {
        return this.translations[this.currentLocale]?.[key] || 
               this.translations[this.fallbackLocale]?.[key] || 
               key;
    },
    
    updatePage() {
        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = this.t(key);
        });
        
        // Update all elements with data-i18n-placeholder attribute
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.setAttribute('placeholder', this.t(key));
        });
        
        // Update all elements with data-i18n-title attribute
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.setAttribute('title', this.t(key));
        });
        
        // Update document title if it has data-i18n-page-title
        const pageTitle = document.querySelector('[data-i18n-page-title]');
        if (pageTitle) {
            const key = pageTitle.getAttribute('data-i18n-page-title');
            document.title = this.t(key) + ' - ' + this.t('app.name');
        }
        
        // Update locale selector if exists
        const localeSelector = document.getElementById('locale-selector');
        if (localeSelector) {
            localeSelector.value = this.currentLocale;
        }
    }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    DarkMode.init();
    i18n.init();
});