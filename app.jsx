
    const { useState, useEffect, useMemo, useRef } = window.React;

    // Registro PWA silencioso
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(reg => {
          reg.update().catch(() => {});
        }).catch(() => {});
      });
    }

    // =========================================================================
    // CONEXIÓN DIRECTA A SUPABASE (Resiliente con Inicialización Segura y Proxy)
    // =========================================================================
    const SUPABASE_URL = 'https://uxptcckcwcyaivurhxzh.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4cHRjY2tjd2N5YWl2dXJoeHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1NjY1NDgsImV4cCI6MjEwOTE0MjU0OH0.8Br_I5FuqHBdNM5GzlITJ-d8AS_6kbvuruMqYjLMo4A';

    let _realSupabase = null;
    function getSupabaseInstance() {
      if (!_realSupabase && typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
        try {
          _realSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } catch (e) {
          console.warn('Supabase diferido:', e);
        }
      }
      return _realSupabase;
    }
    getSupabaseInstance();

    // Proxy inmune a fallos: garantiza que la boutique pinte instantáneamente aun offline o con red 4G inestable
    const supabase = new Proxy({}, {
      get(target, prop) {
        const client = getSupabaseInstance();
        if (client && prop in client) {
          const val = client[prop];
          return typeof val === 'function' ? val.bind(client) : val;
        }
        return (...args) => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: null }),
              order: () => Promise.resolve({ data: [], error: null })
            }),
            order: () => Promise.resolve({ data: [], error: null }),
            single: () => Promise.resolve({ data: null, error: null })
          }),
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
            order: () => Promise.resolve({ data: [], error: null })
          }),
          order: () => Promise.resolve({ data: [], error: null }),
          single: () => Promise.resolve({ data: null, error: null }),
          insert: () => Promise.resolve({ data: null, error: null }),
          update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
          delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
          upload: () => Promise.resolve({ data: null, error: new Error('Supabase no listo') }),
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
          getSession: () => Promise.resolve({ data: { session: null } }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          signInWithOAuth: () => Promise.resolve({ error: null }),
          signOut: () => Promise.resolve({ error: null }),
          rpc: () => Promise.resolve({ data: null, error: null })
        });
      }
    });

    // =========================================================================
    // UTILIDADES: FORMATEO WHATSAPP ECUADOR (+593), VISUAL (09...) Y CÓDIGO ÚNICO
    // =========================================================================
    function formatWhatsAppPhone(phone) {
      if (!phone) return '593963073456';
      const clean = phone.toString().replace(/\D/g, '');
      if (clean.startsWith('593')) return clean;
      if (clean.startsWith('0') && clean.length === 10) return '593' + clean.substring(1);
      if (clean.length === 9) return '593' + clean;
      return clean;
    }

    // Formateo visual nacional para Ecuador sin el signo '+' (ej. 0963073456)
    function formatDisplayPhone(phone) {
      if (!phone) return '0963073456';
      const clean = phone.toString().replace(/\D/g, '');
      if (clean.startsWith('593') && clean.length === 12) {
        return '0' + clean.substring(3);
      }
      if (clean.startsWith('0')) return clean;
      if (clean.length === 9) return '0' + clean;
      return clean;
    }

    function generateCustomerCode(name, phone) {
      if (!name || !phone) return '';
      const cleanName = name.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const match = cleanName.match(/[a-zA-Z]/);
      const firstLetter = match ? match[0].toUpperCase() : 'K';
      const digits = phone.toString().replace(/\D/g, '');
      if (digits.length < 4) return '';
      const last4 = digits.slice(-4);
      return `${firstLetter}${last4}`;
    }

    // =========================================================================
    // VECTORES MINIMALISTAS (Iconografía completa SVG)
    // =========================================================================
    const Icon = {
      Bag: ({ className = "w-4 h-4" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M16 10V7a4 4 0 00-8 0v3M4.5 9.5h15l-1.2 11.5a2 2 0 01-2 1.8H7.7a2 2 0 01-2-1.8L4.5 9.5z" />
        </svg>
      ),
      Share: ({ className = "w-4 h-4" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8m-4-6l-4-4m0 0l-4 4m4-4v13" />
        </svg>
      ),
      Search: ({ className = "w-4 h-4" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      ),
      User: ({ className = "w-4 h-4" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
      Tag: ({ className = "w-4 h-4" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 6h.008v.008H6V6z" />
        </svg>
      ),
      Lock: ({ className = "w-4 h-4" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      ),
      Plus: ({ className = "w-4 h-4" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 5v14m7-7H5" />
        </svg>
      ),
      Minus: ({ className = "w-4 h-4" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 12H5" />
        </svg>
      ),
      Edit: ({ className = "w-4 h-4" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
        </svg>
      ),
      Trash: ({ className = "w-4 h-4" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
      ),
      Check: ({ className = "w-4 h-4" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ),
      Close: ({ className = "w-4 h-4" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      TrendingUp: ({ className = "w-4 h-4" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
        </svg>
      ),
      Box: ({ className = "w-4 h-4" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
      ),
      Sparkles: ({ className = "w-4 h-4" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
        </svg>
      ),
      Diamond: ({ className = "w-4 h-4" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M6 3.75h12l3.75 5.25-9.75 11.25L2.25 9 6 3.75z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" d="M2.25 9h19.5M8.25 9l3.75 11.25L15.75 9M6 3.75l2.25 5.25m9.75-5.25l-2.25 5.25M12 3.75v5.25" />
        </svg>
      ),
      Star: ({ className = "w-4 h-4", filled = true }) => (
        <svg className={className} viewBox="0 0 24 24" fill={filled ? "#F59E0B" : "none"} stroke={filled ? "#D97706" : "currentColor"} strokeWidth={filled ? "1" : "1.6"}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ),
      Heart: ({ className = "w-4 h-4", filled = false }) => (
        <svg className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      ),
      Settings: ({ className = "w-4 h-4" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
      ),
      Copy: ({ className = "w-4 h-4" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
        </svg>
      ),
      Printer: ({ className = "w-4 h-4" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.656" />
        </svg>
      ),
      ChevronLeft: ({ className = "w-4 h-4" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/>
        </svg>
      ),
      ChevronRight: ({ className = "w-4 h-4" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/>
        </svg>
      ),
      ArrowLeft: ({ className = "w-4 h-4" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
      ),
      Photo: ({ className = "w-4 h-4" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
      ),
      WhatsApp: ({ className = "w-4 h-4" }) => (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.072.043.419-.101.824zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.662 1.435 5.178L2 22l4.966-1.394A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
        </svg>
      ),
      Google: ({ className = "w-4 h-4" }) => (
        <svg className={className} viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
      ),
      Truck: ({ className = "w-4 h-4" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a2 2 0 114 0m0 0h2a1 1 0 001-1v-4.586a1 1 0 00-.293-.707l-2.414-2.414a1 1 0 00-.707-.293H16v8m0 0a2 2 0 11-4 0m0 0H7m-2 0a2 2 0 11-4 0"/>
        </svg>
      )
    };

    const DEFAULT_SHIPPING_RATES = [
      { id: 'retiro_portoviejo', label: 'Retiro personal en Portoviejo', price: 0, agency: 'Personal', category: 'retiro', note: 'Coordinar punto y horario de entrega por WhatsApp' },
      { id: 'retiro_uleam', label: 'Retiro personal en ULEAM Manta', price: 0, agency: 'Personal', category: 'retiro', note: 'Entrega en punto universitario acordado' },
      { id: 'retiro_san_jacinto', label: 'Retiro personal en San Jacinto', price: 0, agency: 'Personal', category: 'retiro', note: 'Coordinar retiro directo con la boutique' },
      { id: 'domicilio_portoviejo', label: 'Entrega a Domicilio en Portoviejo', price: 2.50, agency: 'Local', category: 'domicilio', city: 'Portoviejo', note: 'Motorizado directo a tu casa, barrio o trabajo en Portoviejo' },
      { id: 'domicilio_manta', label: 'Entrega a Domicilio en Manta', price: 2.50, agency: 'Local', category: 'domicilio', city: 'Manta', note: 'Motorizado directo a tu casa, barrio o trabajo en Manta' },
      { id: 'cooperativa_manabi', label: 'Cooperativa - Cantones de Manabí', price: 3.00, agency: 'Cooperativa', category: 'cooperativa', note: 'Chone, Bahía, Jipijapa, El Carmen, Calceta (Reina del Camino, Coactur, etc.)' },
      { id: 'cooperativa_nacional', label: 'Cooperativa - Interprovincial (Todo el Ecuador)', price: 3.50, agency: 'Cooperativa', category: 'cooperativa', note: 'Guayaquil, Quito, Cuenca, Santo Domingo, Sierra y Costa (Terminal Terrestre)' },
      { id: 'servientrega_domicilio', label: 'Servientrega a Domicilio (Todo el Ecuador)', price: 5.50, agency: 'Servientrega', category: 'servientrega', note: 'Entrega directa en tu casa u oficina (24 a 48h con número de guía)' },
      { id: 'servientrega_agencia', label: 'Servientrega Retiro en Agencia Oficial', price: 5.50, agency: 'Servientrega', category: 'servientrega', note: 'Retira en la oficina de Servientrega más cercana de tu ciudad (24 a 48h)' }
    ];

    const SHIPPING_CATEGORIES = [
      {
        id: 'retiro',
        title: 'Retiro Personal',
        subtitle: 'Portoviejo, ULEAM Manta o San Jacinto',
        badge: 'GRATIS',
        icon: '🛍️',
        description: 'Retira tu pedido personalmente sin costo de envío coordinando por WhatsApp.'
      },
      {
        id: 'domicilio',
        title: 'Domicilio (Manta o Portoviejo)',
        subtitle: 'Entrega local con motorizado',
        badge: 'Desde $2.50',
        icon: '🛵',
        description: 'Recibe tu pedido directamente en tu domicilio o lugar de trabajo en Manta o Portoviejo.'
      },
      {
        id: 'cooperativa',
        title: 'Cooperativa',
        subtitle: 'Encomienda Manabí y Nacional',
        badge: 'Desde $3.00',
        icon: '🚌',
        description: 'Despacho rápido por cooperativa de transporte hacia cantones de Manabí y provincias del país.'
      },
      {
        id: 'servientrega',
        title: 'Servientrega',
        subtitle: 'Domicilio o Agencia a nivel nacional',
        badge: '$5.50',
        icon: '📦',
        description: 'Envío certificado con código de guía rastreable (24 a 48 horas) a cualquier ciudad del Ecuador.'
      }
    ];

    function getShippingCategory(rate) {
      if (!rate) return 'retiro';
      if (rate.category) return rate.category;
      const ag = (rate.agency || '').toLowerCase();
      const id = (rate.id || '').toLowerCase();
      const lbl = (rate.label || '').toLowerCase();
      if (ag === 'personal' || id.includes('retiro') || lbl.includes('retiro personal')) return 'retiro';
      if (ag === 'local' || id.includes('domicilio') || lbl.includes('domicilio local') || lbl.includes('manta') || lbl.includes('portoviejo')) return 'domicilio';
      if (ag === 'cooperativa' || id.includes('cooperativa') || lbl.includes('cooperativa')) return 'cooperativa';
      if (ag === 'servientrega' || id.includes('servientrega') || lbl.includes('servientrega')) return 'servientrega';
      return 'cooperativa';
    }

    function normalizeShippingRates(rawRates) {
      if (!Array.isArray(rawRates) || rawRates.length === 0) return DEFAULT_SHIPPING_RATES;
      const expanded = [];
      const hasDomPortoviejo = rawRates.some(r => r.id === 'domicilio_portoviejo');
      const hasDomManta = rawRates.some(r => r.id === 'domicilio_manta');
      const hasServDom = rawRates.some(r => r.id === 'servientrega_domicilio');
      const hasServAg = rawRates.some(r => r.id === 'servientrega_agencia');

      rawRates.forEach(r => {
        if (r.id === 'domicilio_local' && !hasDomPortoviejo && !hasDomManta) {
          const p = Number(r.price ?? 2.50);
          expanded.push({
            id: 'domicilio_portoviejo',
            label: 'Entrega a Domicilio en Portoviejo',
            price: p,
            agency: 'Local',
            category: 'domicilio',
            city: 'Portoviejo',
            note: 'Motorizado directo a tu casa, barrio o trabajo en Portoviejo'
          });
          expanded.push({
            id: 'domicilio_manta',
            label: 'Entrega a Domicilio en Manta',
            price: p,
            agency: 'Local',
            category: 'domicilio',
            city: 'Manta',
            note: 'Motorizado directo a tu casa, barrio o trabajo en Manta'
          });
        } else if (r.id === 'servientrega_nacional' && !hasServDom && !hasServAg) {
          const p = Number(r.price ?? 5.50);
          expanded.push({
            id: 'servientrega_domicilio',
            label: 'Servientrega a Domicilio (Todo el Ecuador)',
            price: p,
            agency: 'Servientrega',
            category: 'servientrega',
            note: 'Entrega directa en tu casa u oficina (24 a 48h con número de guía)'
          });
          expanded.push({
            id: 'servientrega_agencia',
            label: 'Servientrega Retiro en Agencia Oficial',
            price: p,
            agency: 'Servientrega',
            category: 'servientrega',
            note: 'Retira en la oficina de Servientrega más cercana de tu ciudad (24 a 48h)'
          });
        } else {
          expanded.push({
            ...r,
            label: r.label ? r.label.replace(/\s*\(Gratis\)/i, '') : r.label,
            category: getShippingCategory(r)
          });
        }
      });

      return expanded.length > 0 ? expanded : DEFAULT_SHIPPING_RATES;
    }

    const DEFAULT_ABOUT_US = {
      title: 'Sobre KAOJ STORE Boutique',
      subtitle: 'Moda Chic, Cosmética Premium & Accesorios en Tendencia',
      story: 'Somos una boutique ecuatoriana apasionada por realzar la belleza, el glamour y el estilo de cada mujer con productos 100% auténticos de alta cosmética, tonos virales, accesorios en tendencia y moda chic. Nacimos con el sueño de acercar las mejores tendencias de belleza a cada rincón del país con confianza, transparencia y amor por cada detalle.',
      mission: 'Brindar una experiencia de compra personalizada, confiable y VIP a nuestras clientas con atención directa, garantía de calidad y envíos inmediatos a todo el Ecuador.',
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800',
      badge: 'Boutique Ecuatoriana Oficial'
    };

    const DELIVERY_OPTIONS = DEFAULT_SHIPPING_RATES;

    const DEMO_REVIEWS = [
      {
        id: 1,
        customer_name: 'Camila Moreira',
        customer_code: 'C3829',
        rating: 5,
        comment: '¡El labial Velvet tono Rosa Nude es un sueño! No reseca nada los labios y dura todo el día intacto. Llegó el mismo día a Manta súper bien empacado. 💅💖',
        photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
        product_name: 'Labial Líquido Velvet Matte Longwear',
        is_verified_buyer: true,
        is_approved: true
      },
      {
        id: 2,
        customer_name: 'Valeria Zambrano',
        customer_code: 'V9102',
        rating: 5,
        comment: 'Me encanta el Gloss Plumper, me dejó los labios con un volumen y brillo natural increíble. Además acumulé puntos VIP con mi código único!',
        photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
        product_name: 'Lip Gloss Plumper Volume & Crystal Shine',
        is_verified_buyer: true,
        is_approved: true
      },
      {
        id: 3,
        customer_name: 'Alisson Cedeño',
        customer_code: 'A4918',
        rating: 5,
        comment: 'La blusa satinada en color champagne tiene una tela exquisita y el calce es perfecto. Pagué facilísimo con Deuna y me la entregaron en Portoviejo rapidísimo. 10/10 ✨',
        photo_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=80',
        product_name: 'Blusa Satinada Elegance Cuello Halter',
        is_verified_buyer: true,
        is_approved: true
      }
    ];

    // =========================================================================
    // PRODUCTOS POR DEFECTO PARA CARGA INSTANTÁNEA (0ms)
    // =========================================================================
    const DEFAULT_STORE_PRODUCTS = [
    {
        "id": 21,
        "name": "BLUSA ELA",
        "section": "ROPA",
        "category": "Blusas",
        "price": 5.0,
        "discount_price": null,
        "image": "https://uxptcckcwcyaivurhxzh.supabase.co/storage/v1/object/public/kaoj-assets/products/1793579576052_IMG_8003_jpeg.jpeg",
        "images": [],
        "description": "Blusa Suplex \nTalla standard",
        "variant_label": "Color y Talla",
        "variants": [
            {
                "name": "Negro - \u00danica",
                "size": "\u00danica",
                "color": "Negro",
                "image": "https://uxptcckcwcyaivurhxzh.supabase.co/storage/v1/object/public/kaoj-assets/products/1793579576052_IMG_8003_jpeg.jpeg",
                "stock": 1
            },
            {
                "name": "Blanco - \u00danica",
                "size": "\u00danica",
                "color": "Blanco",
                "image": "https://uxptcckcwcyaivurhxzh.supabase.co/storage/v1/object/public/kaoj-assets/products/1793579576052_IMG_8003_jpeg.jpeg",
                "stock": 1
            }
        ],
        "is_active": true
    },
    {
        "id": 22,
        "name": "Blusa Halter",
        "section": "ROPA",
        "category": "Blusas",
        "price": 5.0,
        "discount_price": 3.75,
        "image": "https://uxptcckcwcyaivurhxzh.supabase.co/storage/v1/object/public/kaoj-assets/products/1793582844649_1000011458_jpg.jpg",
        "images": [],
        "description": "Blusa duplex talla Standard",
        "variant_label": "Color y Talla",
        "variants": [
            {
                "name": "Rosa beb\u00e9 - \u00danica",
                "size": "\u00danica",
                "color": "Rosa beb\u00e9",
                "image": "https://uxptcckcwcyaivurhxzh.supabase.co/storage/v1/object/public/kaoj-assets/products/1793582844649_1000011458_jpg.jpg",
                "stock": 1
            },
            {
                "name": "Habano - \u00danica",
                "size": "\u00danica",
                "color": "Habano",
                "image": "https://uxptcckcwcyaivurhxzh.supabase.co/storage/v1/object/public/kaoj-assets/products/1793582844649_1000011458_jpg.jpg",
                "stock": 1
            }
        ],
        "is_active": true
    },
    {
        "id": 23,
        "name": "Vestido Lia",
        "section": "ROPA",
        "category": "Vestidos",
        "price": 10.0,
        "discount_price": 7.0,
        "image": "https://uxptcckcwcyaivurhxzh.supabase.co/storage/v1/object/public/kaoj-assets/products/1793582939253_1000011424_jpg.jpg",
        "images": [],
        "description": "Vestido Suplex",
        "variant_label": "Color y Talla",
        "variants": [
            {
                "name": "Celeste - \u00danica",
                "size": "\u00danica",
                "color": "Celeste",
                "image": "https://uxptcckcwcyaivurhxzh.supabase.co/storage/v1/object/public/kaoj-assets/products/1793583019536_1000011427_jpg.jpg",
                "stock": 1
            }
        ],
        "is_active": true
    },
    {
        "id": 24,
        "name": "Blusa Ari",
        "section": "ROPA",
        "category": "Blusas",
        "price": 5.0,
        "discount_price": null,
        "image": "https://uxptcckcwcyaivurhxzh.supabase.co/storage/v1/object/public/kaoj-assets/products/1793583071615_1000011264_jpg.jpg",
        "images": [],
        "description": "Blusa suplex, amarre en cuello.",
        "variant_label": "Color y Talla",
        "variants": [
            {
                "name": "Blanco - \u00danica",
                "size": "\u00danica",
                "color": "Blanco",
                "image": "https://uxptcckcwcyaivurhxzh.supabase.co/storage/v1/object/public/kaoj-assets/products/1793583610106_1000011264_jpg.jpg",
                "stock": 1
            },
            {
                "name": "Negro - \u00danica",
                "size": "\u00danica",
                "color": "Negro",
                "image": "https://uxptcckcwcyaivurhxzh.supabase.co/storage/v1/object/public/kaoj-assets/products/1793583315935_1000011262_jpg.jpg",
                "stock": 1
            },
            {
                "name": "Lila - \u00danica",
                "size": "\u00danica",
                "color": "Lila",
                "image": "https://uxptcckcwcyaivurhxzh.supabase.co/storage/v1/object/public/kaoj-assets/products/1793583324427_1000011262_jpg.jpg",
                "stock": 1
            },
            {
                "name": "Verde esmeralda - \u00danica",
                "size": "\u00danica",
                "color": "Verde esmeralda",
                "image": "https://uxptcckcwcyaivurhxzh.supabase.co/storage/v1/object/public/kaoj-assets/products/1793583328838_1000011262_jpg.jpg",
                "stock": 1
            },
            {
                "name": "Amarillo mantequilla - \u00danica",
                "size": "\u00danica",
                "color": "Amarillo mantequilla",
                "image": "https://uxptcckcwcyaivurhxzh.supabase.co/storage/v1/object/public/kaoj-assets/products/1793583332699_1000011262_jpg.jpg",
                "stock": 1
            }
        ],
        "is_active": true
    },
    {
        "id": 25,
        "name": "Blusa b\u00e1sica circular",
        "section": "ROPA",
        "category": "Blusas",
        "price": 5.0,
        "discount_price": null,
        "image": "https://uxptcckcwcyaivurhxzh.supabase.co/storage/v1/object/public/kaoj-assets/products/1793583377530_193822_jpg.jpg",
        "images": [],
        "description": "Blusa suplex, cuello circular, talla \u00fanica",
        "variant_label": "Color y Talla",
        "variants": [
            {
                "name": "Rojo - \u00danica",
                "size": "\u00danica",
                "color": "Rojo",
                "image": "https://uxptcckcwcyaivurhxzh.supabase.co/storage/v1/object/public/kaoj-assets/products/1793583377530_193822_jpg.jpg",
                "stock": 1
            },
            {
                "name": "Perla - \u00danica",
                "size": "\u00danica",
                "color": "Perla",
                "image": "https://uxptcckcwcyaivurhxzh.supabase.co/storage/v1/object/public/kaoj-assets/products/1793583377530_193822_jpg.jpg",
                "stock": 1
            },
            {
                "name": "Rosa - \u00danica",
                "size": "\u00danica",
                "color": "Rosa",
                "image": "https://uxptcckcwcyaivurhxzh.supabase.co/storage/v1/object/public/kaoj-assets/products/1793583377530_193822_jpg.jpg",
                "stock": 1
            },
            {
                "name": "Celeste - \u00danica",
                "size": "\u00danica",
                "color": "Celeste",
                "image": "https://uxptcckcwcyaivurhxzh.supabase.co/storage/v1/object/public/kaoj-assets/products/1793583377530_193822_jpg.jpg",
                "stock": 1
            },
            {
                "name": "Amarillo patito - \u00danica",
                "size": "\u00danica",
                "color": "Amarillo patito",
                "image": "https://uxptcckcwcyaivurhxzh.supabase.co/storage/v1/object/public/kaoj-assets/products/1793583377530_193822_jpg.jpg",
                "stock": 1
            }
        ],
        "is_active": true
    },
    {
        "id": 26,
        "name": "Blusa Nay",
        "section": "ROPA",
        "category": "Blusas",
        "price": 5.25,
        "discount_price": null,
        "image": "https://uxptcckcwcyaivurhxzh.supabase.co/storage/v1/object/public/kaoj-assets/products/1793584222061_1000011695_jpg.jpg",
        "images": [],
        "description": "Blusa suplex, amarre en cuello.",
        "variant_label": "Color y Talla",
        "variants": [
            {
                "name": "Negro - \u00danica",
                "size": "\u00danica",
                "color": "Negro",
                "image": "https://uxptcckcwcyaivurhxzh.supabase.co/storage/v1/object/public/kaoj-assets/products/1793584222061_1000011695_jpg.jpg",
                "stock": 1
            },
            {
                "name": "Vino - \u00danica",
                "size": "\u00danica",
                "color": "Vino",
                "image": "https://uxptcckcwcyaivurhxzh.supabase.co/storage/v1/object/public/kaoj-assets/products/1793584222061_1000011695_jpg.jpg",
                "stock": 1
            },
            {
                "name": "Amarillo Mantequilla - \u00danica",
                "size": "\u00danica",
                "color": "Amarillo Mantequilla",
                "image": "https://uxptcckcwcyaivurhxzh.supabase.co/storage/v1/object/public/kaoj-assets/products/1793584222061_1000011695_jpg.jpg",
                "stock": 1
            },
            {
                "name": "Celeste - \u00danica",
                "size": "\u00danica",
                "color": "Celeste",
                "image": "https://uxptcckcwcyaivurhxzh.supabase.co/storage/v1/object/public/kaoj-assets/products/1793584222061_1000011695_jpg.jpg",
                "stock": 1
            },
            {
                "name": "Blanco - \u00danica",
                "size": "\u00danica",
                "color": "Blanco",
                "image": "https://uxptcckcwcyaivurhxzh.supabase.co/storage/v1/object/public/kaoj-assets/products/1793584222061_1000011695_jpg.jpg",
                "stock": 1
            },
            {
                "name": "Mocca - \u00danica",
                "size": "\u00danica",
                "color": "Mocca",
                "image": "https://uxptcckcwcyaivurhxzh.supabase.co/storage/v1/object/public/kaoj-assets/products/1793584222061_1000011695_jpg.jpg",
                "stock": 1
            },
            {
                "name": "Rosa - \u00danica",
                "size": "\u00danica",
                "color": "Rosa",
                "image": "https://uxptcckcwcyaivurhxzh.supabase.co/storage/v1/object/public/kaoj-assets/products/1793584222061_1000011695_jpg.jpg",
                "stock": 1
            },
            {
                "name": "Verde lim\u00f3n - \u00danica",
                "size": "\u00danica",
                "color": "Verde lim\u00f3n",
                "image": "https://uxptcckcwcyaivurhxzh.supabase.co/storage/v1/object/public/kaoj-assets/products/1793584222061_1000011695_jpg.jpg",
                "stock": 5
            }
        ],
        "is_active": true
    },
    {
        "id": 27,
        "name": "Blusa Lucy",
        "section": "ROPA",
        "category": "Blusas",
        "price": 5.0,
        "discount_price": null,
        "image": "https://uxptcckcwcyaivurhxzh.supabase.co/storage/v1/object/public/kaoj-assets/products/1793584378164_192686_jpg.jpg",
        "images": [],
        "description": "Blusa suplex, escote en la espalda a la mitad",
        "variant_label": "Color y Talla",
        "variants": [
            {
                "name": "Amarillo mantequilla - \u00danica",
                "size": "\u00danica",
                "color": "Amarillo mantequilla",
                "image": "https://uxptcckcwcyaivurhxzh.supabase.co/storage/v1/object/public/kaoj-assets/products/1793584378164_192686_jpg.jpg",
                "stock": 1
            },
            {
                "name": "Rosa - \u00danica",
                "size": "\u00danica",
                "color": "Rosa",
                "image": "https://uxptcckcwcyaivurhxzh.supabase.co/storage/v1/object/public/kaoj-assets/products/1793584378164_192686_jpg.jpg",
                "stock": 1
            }
        ],
        "is_active": true
    }
];

    // COMPONENTE PRINCIPAL APP
    // =========================================================================
    function App() {
      const [products, setProducts] = useState(() => {
        try {
          const cached = localStorage.getItem('kaoj_cached_products');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          }
        } catch (e) {}
        return DEFAULT_STORE_PRODUCTS;
      });
      const [orders, setOrders] = useState([]);
      const [customersList, setCustomersList] = useState([]);
      const [reviews, setReviews] = useState(DEMO_REVIEWS);

      const [sectionsConfig, setSectionsConfig] = useState({
        "MAQUILLAJES": ["Labiales", "Gloss", "Delineadores", "Rubores", "Bálsamos", "Primers", "Rimels", "Bases", "Pestañas"],
        "ACCESORIOS": ["Vinchas", "Cintillos"],
        "ROPA": ["Blusas", "Pantalones", "Vestidos", "Shorts", "Pijamas", "Conjuntos", "Ropa deportiva"]
      });

      const [settings, setSettings] = useState({
        whatsapp_number: '0963073456',
        deuna_link: 'https://deuna.app/',
        deuna_qr_url: '',
        payphone_link: 'https://payphone.app/',
        payphone_token: '',
        payphone_surcharge_percent: 6.0,
        admin_pin: '2026',
        bank_guayaquil_acc: '0013899619',
        bank_guayaquil_name: 'Toledo Mendoza Alisson Kandy',
        bank_guayaquil_id: '1350290308',
        bank_pichincha_acc: '2215807440',
        bank_pichincha_name: 'Demera García Jhojann Alberto',
        bank_pichincha_id: '1314710946',
        free_shipping_threshold: 50.00,
        points_per_dollar: 1,
        points_redeem_ratio: 10, // 10 pts = $1.00 de descuento (50 pts = $5.00)
        points_min_redeem: 50,  // Mínimo 50 pts = $5.00
        banner_message: '✨ Alta Cosmética, Accesorios & Moda Chic | Envíos a todo el Ecuador por Servientrega o Cooperativa 💅✨',
        about_us: DEFAULT_ABOUT_US,
        shipping_rates: DEFAULT_SHIPPING_RATES
      });

      // Filtros de catálogo y búsqueda
      const [selectedSection, setSelectedSection] = useState('TODOS');
      const [selectedSubcategory, setSelectedSubcategory] = useState('TODOS');
      const [searchQuery, setSearchQuery] = useState('');
      const [sortBy, setSortBy] = useState('destacados');
      const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

      // Variantes activas por producto { [prodId]: { variantName, image } }
      const [activeVariants, setActiveVariants] = useState({});

      // Modales y Vistas Rápidas
      const [quickViewProduct, setQuickViewProduct] = useState(null);
      const [quickViewSelectedVar, setQuickViewSelectedVar] = useState(null);
      const [quickViewActiveImageIndex, setQuickViewActiveImageIndex] = useState(0);
      const [isCartOpen, setIsCartOpen] = useState(false);
      const [isTrackingOpen, setIsTrackingOpen] = useState(false);
      const [trackingCode, setTrackingCode] = useState('');
      const [trackedOrders, setTrackedOrders] = useState(null);
      const [trackingLoading, setTrackingLoading] = useState(false);
      const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
      const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);

      // Paso activo en el Checkout (1: Datos, 2: Envío, 3: Pago)
      const [checkoutStep, setCheckoutStep] = useState(1);
      const [showCartItemsInStep, setShowCartItemsInStep] = useState(true);
      const [showCouponInputBox, setShowCouponInputBox] = useState(false);

      // Nueva reseña en modal vinculada a pedido verificado
      const [newReview, setNewReview] = useState({
        customer_name: '',
        customer_code: '',
        product_id: '',
        product_name: '',
        product_image: '',
        product_variant: '',
        order_code: '',
        rating: 5,
        comment: '',
        photo_url: ''
      });

      // Autenticación con Google y Perfil Permanente
      const [user, setUser] = useState(null);
      const [customerProfile, setCustomerProfile] = useState(null);
      const [showPhonePromptModal, setShowPhonePromptModal] = useState(false);
      const [phoneInputForGoogle, setPhoneInputForGoogle] = useState('');
      const [isProfileOpen, setIsProfileOpen] = useState(false);
      const isCloudCartLoadedRef = useRef(false);

      // Carrito sincronizado
      const [cart, setCart] = useState(() => {
        try {
          const saved = localStorage.getItem('kaoj_cart');
          return saved ? JSON.parse(saved) : [];
        } catch {
          return [];
        }
      });

      // Canje de puntos en Checkout (50 puntos = $5.00 de descuento)
      const [applyPointsDiscount, setApplyPointsDiscount] = useState(false);
      const [redeemBlocksCount, setRedeemBlocksCount] = useState(1);

      // Datos del Checkout (con persistencia inteligente en localStorage para no perder datos al seguir comprando)
      const [customer, setCustomer] = useState(() => {
        const defaults = {
          name: '',
          phone: '',
          idCard: '',
          email: '',
          shippingCategory: 'retiro',
          delivery: 'retiro_portoviejo',
          address: '',
          city: '',
          cooperativaName: '',
          deliveryNotes: '',
          paymentMethod: 'deuna',
          receiptUrl: '',
          payphoneRef: ''
        };
        try {
          const savedDraft = localStorage.getItem('kaoj_customer_draft');
          if (savedDraft) {
            const parsed = JSON.parse(savedDraft);
            return { ...defaults, ...parsed, receiptUrl: '', payphoneRef: '' };
          }
        } catch (e) {}
        return defaults;
      });

      useEffect(() => {
        try {
          const { receiptUrl, payphoneRef, ...draftToSave } = customer;
          localStorage.setItem('kaoj_customer_draft', JSON.stringify(draftToSave));
        } catch (e) {}
      }, [customer]);

      // PWA: Detección y Banner de Instalación en 1 Clic (Android e iOS)
      const [deferredPrompt, setDeferredPrompt] = useState(null);
      const [showInstallBanner, setShowInstallBanner] = useState(false);
      const [isIosDevice, setIsIosDevice] = useState(false);
      const [showIosGuide, setShowIosGuide] = useState(false);

      useEffect(() => {
        try {
          const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
          if (isStandalone) return;

          const dismissedTime = localStorage.getItem('kaoj_pwa_dismissed');
          if (dismissedTime && Date.now() - Number(dismissedTime) < 5 * 24 * 60 * 60 * 1000) {
            return;
          }

          const userAgent = window.navigator.userAgent.toLowerCase();
          const isIos = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
          if (isIos) {
            setIsIosDevice(true);
            const timer = setTimeout(() => setShowInstallBanner(true), 3500);
            return () => clearTimeout(timer);
          }

          const promptHandler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallBanner(true);
          };
          window.addEventListener('beforeinstallprompt', promptHandler);

          const installedHandler = () => {
            setShowInstallBanner(false);
            setDeferredPrompt(null);
            showToast('¡Kaoj Store se ha instalado correctamente! 🎉');
          };
          window.addEventListener('appinstalled', installedHandler);

          return () => {
            window.removeEventListener('beforeinstallprompt', promptHandler);
            window.removeEventListener('appinstalled', installedHandler);
          };
        } catch (e) {}
      }, []);

      const handleInstallApp = async () => {
        if (isIosDevice) {
          setShowIosGuide(true);
          return;
        }
        if (!deferredPrompt) return;
        try {
          deferredPrompt.prompt();
          const choice = await deferredPrompt.userChoice;
          if (choice && choice.outcome === 'accepted') {
            setShowInstallBanner(false);
            setDeferredPrompt(null);
          }
        } catch (e) {}
      };

      const handleDismissInstall = () => {
        setShowInstallBanner(false);
        setShowIosGuide(false);
        try {
          localStorage.setItem('kaoj_pwa_dismissed', Date.now().toString());
        } catch (e) {}
      };

      // Estado de procesamiento seguro y confirmación de pedido
      const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
      const [orderSuccessModal, setOrderSuccessModal] = useState(null);

      // Cupones de descuento promocionales
      const [couponCodeInput, setCouponCodeInput] = useState('');
      const [appliedCoupon, setAppliedCoupon] = useState(null);

      // Lista de Favoritos (Wishlist) persistente en localStorage
      const [favorites, setFavorites] = useState(() => {
        try {
          const saved = localStorage.getItem('kaoj_favorites');
          return saved ? JSON.parse(saved) : [];
        } catch {
          return [];
        }
      });

      useEffect(() => {
        try {
          localStorage.setItem('kaoj_favorites', JSON.stringify(favorites));
        } catch (e) {}
      }, [favorites]);

      function toggleFavorite(productId, productName) {
        if (favorites.includes(productId)) {
          setFavorites(favorites.filter(id => id !== productId));
          showToast(`"${productName}" retirado de favoritos`, 'info');
        } else {
          setFavorites([...favorites, productId]);
          showToast(`¡"${productName}" guardado en tus favoritos! ❤️`);
        }
      }

      function handleShareProduct(product) {
        if (!product) return;
        const currentUrl = `${window.location.origin}${window.location.pathname}#/producto/${product.id}`;
        const title = `Kaoj Store - ${product.name}`;
        const text = `¡Mira este producto en Kaoj Store: ${product.name}! ✨🛍️`;

        if (navigator.share) {
          navigator.share({
            title,
            text,
            url: currentUrl
          }).catch(() => {});
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(currentUrl).then(() => {
            showToast('¡Enlace del producto copiado al portapapeles! 📋');
          }).catch(() => {
            window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + currentUrl)}`, '_blank');
          });
        } else {
          window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + currentUrl)}`, '_blank');
        }
      }

      // Obtener todas las imágenes de un producto (galería múltiple, variantes y fotos de tonos)
      function getProductImages(product) {
        if (!product) return ['https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600'];
        const list = [];

        // 1. Array `images` directo del producto
        if (Array.isArray(product.images)) {
          product.images.forEach(img => {
            if (img && typeof img === 'string' && img.trim() && !list.includes(img.trim())) {
              list.push(img.trim());
            }
          });
        }

        // 2. Galería almacenada en variantes[0].gallery (compatibilidad sin requerir cambios de esquema)
        if (Array.isArray(product.variants?.[0]?.gallery)) {
          product.variants[0].gallery.forEach(img => {
            if (img && typeof img === 'string' && img.trim() && !list.includes(img.trim())) {
              list.push(img.trim());
            }
          });
        }

        // 3. Foto principal
        if (product.image && typeof product.image === 'string' && product.image.trim() && !list.includes(product.image.trim())) {
          list.unshift(product.image.trim());
        }

        // 4. Fotos de variantes o tonos
        (product.variants || []).forEach(v => {
          if (v.image && typeof v.image === 'string' && v.image.trim() && !list.includes(v.image.trim())) {
            list.push(v.image.trim());
          }
        });

        return list.length > 0 ? list : [product.image || 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600'];
      }

      // Auto-detección de cliente VIP y saldo de puntos al escribir celular en el checkout
      async function handlePhoneLookup(phoneVal) {
        const clean = (phoneVal || '').replace(/\D/g, '');
        if (clean.length < 9) return;
        if (customerProfile && customerProfile.phone === clean && customerProfile.points !== undefined) return;
        if (user && customerProfile) return; // Si ya inició sesión con Google y tiene perfil cargado

        try {
          const { data: ordersData } = await supabase.rpc('kaoj_track_orders', {
            lookup_query: clean
          });

          if (ordersData && ordersData.length > 0) {
            const lastOrder = ordersData[0];
            const validOrders = ordersData.filter(o => o.status !== 'cancelado');
            const netPoints = Math.max(0, validOrders.reduce((acc, o) => acc + Number(o.points_earned || 0) - Number(o.points_redeemed || 0), 0));
            const firstName = lastOrder.customer_name ? lastOrder.customer_name.split(' ')[0] : 'Clienta';
            const vipCode = lastOrder.customer_code || generateCustomerCode(lastOrder.customer_name || customer.name, clean);

            setCustomerProfile(prev => ({
              ...(prev || {}),
              customer_code: vipCode,
              name: lastOrder.customer_name || prev?.name || customer.name,
              phone: clean,
              points: netPoints
            }));

            setCustomer(prev => ({
              ...prev,
              name: prev.name.trim() ? prev.name : (lastOrder.customer_name || ''),
              idCard: prev.idCard.trim() ? prev.idCard : (lastOrder.customer_id_card || ''),
              address: prev.address.trim() ? prev.address : (lastOrder.delivery_address || '')
            }));

            if (netPoints >= 50) {
              showToast(`¡Bienvenida de nuevo, ${firstName}! Tienes ${netPoints} Puntos Kaoj disponibles ($${(Math.floor(netPoints / 50) * 5).toFixed(2)} de descuento). 💎`);
            } else {
              showToast(`¡Bienvenida de nuevo, ${firstName}! Tienes ${netPoints} Puntos Kaoj acumulados con tu código ${vipCode}. ✨`);
            }
          }
        } catch (err) {}
      }

      // Consulta automática de pedidos para clientas logeadas o por código/celular (RLS Seguro)
      const fetchMyOrders = async (identifier) => {
        const targetId = identifier || trackingCode.trim() || customerProfile?.customer_code || user?.id || localStorage.getItem('kaoj_last_customer_code') || (customer.phone && customer.phone.length >= 8 ? customer.phone : null);
        if (!targetId) {
          setTrackedOrders([]);
          return;
        }
        setTrackingLoading(true);
        try {
          if (user?.id) {
            const { data, error } = await supabase
              .from('kaoj_orders')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false });
            setTrackedOrders(!error && data ? data : []);
          } else {
            const { data, error } = await supabase.rpc('kaoj_track_orders', {
              lookup_query: String(targetId).trim()
            });
            setTrackedOrders(!error && data ? data : []);
          }
        } catch (err) {
          console.error('Error cargando pedidos:', err);
          setTrackedOrders([]);
        } finally {
          setTrackingLoading(false);
        }
      };

      // Disparador automático al abrir el modal Mis Pedidos
      useEffect(() => {
        if (isTrackingOpen) {
          const autoId = customerProfile?.customer_code || user?.id || localStorage.getItem('kaoj_last_customer_code') || (customer.phone && customer.phone.length >= 8 ? customer.phone : null);
          if (autoId) {
            if (!trackingCode && customerProfile?.customer_code) {
              setTrackingCode(customerProfile.customer_code);
            }
            fetchMyOrders(autoId);
          }
        }
      }, [isTrackingOpen, user, customerProfile]);

      // Cupones disponibles
      const availableCoupons = useMemo(() => {
        const defaults = [
          { code: 'BIENVENIDA', discount: 10, type: 'percent', label: '10% OFF Bienvenida' },
          { code: 'KAOJ5', discount: 5, type: 'fixed', label: '$5.00 OFF Especial' },
          { code: 'ENVIOFREE', discount: 5.50, type: 'shipping', label: 'Envío Gratis Servientrega' }
        ];
        if (Array.isArray(settings.coupons_config) && settings.coupons_config.length > 0) {
          return settings.coupons_config;
        }
        return defaults;
      }, [settings.coupons_config]);

      function handleApplyCoupon(e) {
        if (e) e.preventDefault();
        const code = couponCodeInput.trim().toUpperCase();
        if (!code) return showToast('Ingresa un código de cupón', 'error');

        const found = availableCoupons.find(c => c.code.toUpperCase() === code);
        if (!found) {
          return showToast(`El cupón "${code}" no es válido o ha expirado.`, 'error');
        }

        setAppliedCoupon(found);
        showToast(`¡Cupón "${found.code}" aplicado con éxito! 🎉`);
      }

      function handleRemoveCoupon() {
        setAppliedCoupon(null);
        setCouponCodeInput('');
        showToast('Cupón de descuento removido');
      }

      // Toast Notifications
      const [toast, setToast] = useState(null);
      const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3800);
      };

      // Copiar texto al portapapeles
      const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        showToast(`${label} copiado al portapapeles`);
      };

      // ADMINISTRADOR
      const [isAdmin, setIsAdmin] = useState(false);
      const [showPinModal, setShowPinModal] = useState(false);
      const [pinInput, setPinInput] = useState('');
      const [adminTab, setAdminTab] = useState('metrics'); // 'metrics', 'inventory', 'sections', 'orders', 'reviews', 'customers', 'settings'
      const [adminSearch, setAdminSearch] = useState('');
      const [adminFilterStatus, setAdminFilterStatus] = useState('todos');
      const [adminOrderSearch, setAdminOrderSearch] = useState('');

      const filteredOrders = useMemo(() => {
        return orders.filter(o => {
          const matchesStatus = adminFilterStatus === 'todos' || o.status === adminFilterStatus;
          if (!matchesStatus) return false;
          if (!adminOrderSearch.trim()) return true;
          const q = adminOrderSearch.toLowerCase().trim();
          return (
            (o.order_code && o.order_code.toLowerCase().includes(q)) ||
            (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
            (o.customer_phone && o.customer_phone.includes(q)) ||
            (o.customer_code && o.customer_code.toLowerCase().includes(q)) ||
            (o.customer_id_card && o.customer_id_card.includes(q)) ||
            (o.delivery_address && o.delivery_address.toLowerCase().includes(q))
          );
        });
      }, [orders, adminFilterStatus, adminOrderSearch]);
      const [adminStockFilter, setAdminStockFilter] = useState('todos'); // 'todos', 'critico', 'agotados'
      const [adminInventorySection, setAdminInventorySection] = useState('TODOS');
      const [adminInventoryCategory, setAdminInventoryCategory] = useState('TODOS');
      const [adminInventorySort, setAdminInventorySort] = useState('recientes'); // 'recientes', 'nombre_asc', 'stock_asc', 'stock_desc', 'precio_asc', 'precio_desc'
      const [showNewProductPanel, setShowNewProductPanel] = useState(false);
      const [expandedInventoryIds, setExpandedInventoryIds] = useState({});
      const [selectedTransferBank, setSelectedTransferBank] = useState('guayaquil'); // 'guayaquil' | 'pichincha'
      const [editingProduct, setEditingProduct] = useState(null);
      const [servientregaOrder, setServientregaOrder] = useState(null);
      const [uploading, setUploading] = useState(false);

      // Estado editable de ajustes en Admin
      const [adminSettingsForm, setAdminSettingsForm] = useState(null);

      // Nuevo producto en Admin
      const [newProd, setNewProd] = useState({
        name: '',
        section: 'MAQUILLAJES',
        category: 'Labiales',
        price: '',
        discount_price: '',
        image: '',
        images: [],
        description: '',
        variant_label: 'Tono / Talla',
        variants: [
          { name: '01 Rosa Nude', stock: 6, image: '' },
          { name: '02 Rojo Carmesí', stock: 4, image: '' }
        ]
      });

      // Nuevos nombres de sección y subcategoría
      const [newSectionName, setNewSectionName] = useState('');
      const [newSubcatInputs, setNewSubcatInputs] = useState({});

      // Estados para Tallas y Colores Separados en Nuevo Producto
      const [newProdVariantMode, setNewProdVariantMode] = useState('simple'); // 'simple' o 'color_size'
      const [newProdColors, setNewProdColors] = useState([
        { name: 'Negro', image: '' },
        { name: 'Blanco', image: '' }
      ]);
      const [newProdSizes, setNewProdSizes] = useState(['S', 'M', 'L']);
      const [newProdMatrixStock, setNewProdMatrixStock] = useState({});
      const [newProdCustomSize, setNewProdCustomSize] = useState('');
      const [newProdBulkStock, setNewProdBulkStock] = useState('5');

      // Función auxiliar para cambiar la sección del nuevo producto y seleccionar automáticamente Tallas y Colores si es ROPA
      function handleNewProductSectionChange(nextSection) {
        const defaultCategory = (sectionsConfig[nextSection] || [])[0] || '';
        const isClothing = (nextSection || '').toUpperCase() === 'ROPA';
        setNewProd(prev => ({
          ...prev,
          section: nextSection,
          category: defaultCategory,
          variant_label: isClothing ? 'Color y Talla' : 'Tono / Talla'
        }));
        setNewProdVariantMode(isClothing ? 'color_size' : 'simple');
      }

      // Estados para Tallas y Colores Separados en Edición de Producto
      const [editVariantMode, setEditVariantMode] = useState('simple'); // 'simple' o 'color_size'
      const [editColors, setEditColors] = useState([]);
      const [editSizes, setEditSizes] = useState([]);
      const [editMatrixStock, setEditMatrixStock] = useState({});
      const [editCustomSize, setEditCustomSize] = useState('');
      const [editBulkStock, setEditBulkStock] = useState('5');

      // =======================================================================
      // 1. CARGA INICIAL SEGURA (Solo productos, ajustes públicos y reseñas aprobadas)
      // =======================================================================
      useEffect(() => {
        fetchInitialData();

        // Router Hash con Slash (#/admin, #/producto/:id, #/seccion/:name, #/favoritos, #/pedidos)
        const handleRouteFromHash = () => {
          const hash = window.location.hash || '#/';

          if (hash.startsWith('#/admin')) {
            const parts = hash.split('/');
            const targetTab = parts[2] || 'metrics';
            const savedPin = sessionStorage.getItem('kaoj_admin_pin');
            if (savedPin && sessionStorage.getItem('kaoj_admin_authenticated') === 'true') {
              setIsAdmin(true);
              setAdminTab(targetTab);
            } else {
              setShowPinModal(true);
            }
          } else {
            setIsAdmin(false);

            if (!hash.startsWith('#/producto/')) {
              setQuickViewProduct(null);
            }
            if (hash !== '#/pedidos') {
              setIsTrackingOpen(false);
            }
            if (hash !== '#/carrito') {
              setIsCartOpen(false);
            }

            if (hash.startsWith('#/producto/')) {
              const pid = Number(hash.replace('#/producto/', '').split('/')[0]);
              if (pid) {
                setProducts(currentProds => {
                  const p = currentProds.find(item => item.id === pid);
                  if (p) {
                    setQuickViewProduct(p);
                    setQuickViewActiveImageIndex(0);
                  }
                  return currentProds;
                });
              }
            } else if (hash.startsWith('#/seccion/')) {
              const sec = decodeURIComponent(hash.replace('#/seccion/', '').split('/')[0]);
              setSelectedSection(sec);
              setSelectedSubcategory('TODOS');
            } else if (hash === '#/favoritos') {
              setSelectedSection('FAVORITOS');
              setSelectedSubcategory('TODOS');
            } else if (hash === '#/pedidos') {
              setIsTrackingOpen(true);
            } else if (hash === '#/carrito') {
              setIsCartOpen(true);
            } else if (hash === '#/quienes-somos') {
              setTimeout(() => {
                const el = document.getElementById('quienes-somos');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 120);
            }
          }
        };

        window.addEventListener('hashchange', handleRouteFromHash);
        handleRouteFromHash();

        // 1. Verificar sesión existente de Google
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) handleUserAuth(session.user);
        });

        // 2. Escuchar cambios de autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            handleUserAuth(session.user);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setCustomerProfile(null);
            isCloudCartLoadedRef.current = false;
          }
        });

        return () => {
          window.removeEventListener('hashchange', handleRouteFromHash);
          subscription?.unsubscribe();
        };
      }, []);

      // Al entrar como admin, cargar datos protegidos (pedidos, clientes, reseñas completas)
      useEffect(() => {
        if (isAdmin) {
          fetchAdminData();
        }
      }, [isAdmin]);

      async function fetchInitialData() {
        try {
          // 1. Productos activos
          const { data: prods } = await supabase
            .from('kaoj_products')
            .select('*')
            .eq('is_active', true)
            .order('id', { ascending: false });

          if (prods && prods.length > 0) {
            setProducts(prods);
            const initVars = {};
            prods.forEach(p => {
              const firstAvail = (p.variants || []).find(v => v.stock > 0) || (p.variants || [])[0];
              if (firstAvail) {
                initVars[p.id] = {
                  variantName: firstAvail.name,
                  color: firstAvail.color,
                  size: firstAvail.size,
                  image: firstAvail.image || p.image
                };
              }
            });
            setActiveVariants(initVars);

            // Rehidratar producto abierto si la URL es #/producto/:id al recargar la página
            const currentHash = window.location.hash || '';
            if (currentHash.startsWith('#/producto/')) {
              const pid = Number(currentHash.replace('#/producto/', '').split('/')[0]);
              const p = prods.find(item => item.id === pid);
              if (p) {
                setQuickViewProduct(p);
                setQuickViewActiveImageIndex(0);
              }
            }
          }

          // 2. Ajustes públicos
          const { data: cfg } = await supabase.from('kaoj_settings').select('*').eq('id', 1).single();
          if (cfg) {
            let loadedAboutUs = cfg.about_us || cfg.sections_config?.__about_us || null;
            if (!loadedAboutUs) {
              try {
                const localAbout = localStorage.getItem('kaoj_about_us');
                if (localAbout) loadedAboutUs = JSON.parse(localAbout);
              } catch(e) {}
            }
            if (!loadedAboutUs) loadedAboutUs = DEFAULT_ABOUT_US;

            let loadedShipping = cfg.shipping_rates || cfg.sections_config?.__shipping_rates || null;
            if (!loadedShipping) {
              try {
                const localShip = localStorage.getItem('kaoj_shipping_rates');
                if (localShip) loadedShipping = JSON.parse(localShip);
              } catch(e) {}
            }
            if (!loadedShipping) loadedShipping = DEFAULT_SHIPPING_RATES;

            let loadedSurcharge = cfg.payphone_surcharge_percent ?? cfg.sections_config?.__payphone_surcharge_percent ?? null;
            if (loadedSurcharge === null || loadedSurcharge === undefined) {
              try {
                const localSur = localStorage.getItem('kaoj_payphone_surcharge');
                if (localSur !== null) loadedSurcharge = parseFloat(localSur);
              } catch(e) {}
            }
            if (loadedSurcharge === null || loadedSurcharge === undefined || isNaN(loadedSurcharge)) loadedSurcharge = 6.0;

            setSettings(prev => ({
              ...prev,
              ...cfg,
              whatsapp_number: cfg.whatsapp_number ? formatDisplayPhone(cfg.whatsapp_number) : '0963073456',
              about_us: loadedAboutUs,
              shipping_rates: loadedShipping,
              payphone_surcharge_percent: loadedSurcharge
            }));

            setAdminSettingsForm({
              ...cfg,
              whatsapp_number: cfg.whatsapp_number ? formatDisplayPhone(cfg.whatsapp_number) : '0963073456',
              admin_pin: '',
              about_us: loadedAboutUs,
              shipping_rates: loadedShipping,
              payphone_surcharge_percent: loadedSurcharge
            });

            if (cfg.sections_config && Object.keys(cfg.sections_config).length > 0) {
              const cleanSections = { ...cfg.sections_config };
              delete cleanSections.__about_us;
              delete cleanSections.__shipping_rates;
              delete cleanSections.__payphone_surcharge_percent;
              setSectionsConfig(cleanSections);
            }
          }

          // 3. Reseñas públicas aprobadas para Social Proof
          const { data: revs } = await supabase
            .from('kaoj_reviews')
            .select('*')
            .eq('is_approved', true)
            .order('created_at', { ascending: false });

          if (revs && revs.length > 0) {
            setReviews(revs);
          }
        } catch (err) {
          console.error('Error cargando catálogo:', err);
        }
      }

      // Carga de datos administrativos protegidos (Verificado en servidor vía RPC con PIN hasheado)
      async function fetchAdminData(passedPin = null) {
        try {
          const currentPin = passedPin || sessionStorage.getItem('kaoj_admin_pin') || '';
          if (!currentPin) return;

          const { data: ords, error: oErr } = await supabase.rpc('kaoj_admin_get_orders', { admin_pin: currentPin });
          if (!oErr && ords) {
            setOrders(ords);
          } else if (oErr) {
            console.warn('kaoj_admin_get_orders RPC error:', oErr.message);
            const { data: fallbackOrds } = await supabase.from('kaoj_orders').select('*').order('created_at', { ascending: false });
            if (fallbackOrds && fallbackOrds.length > 0) setOrders(fallbackOrds);
          }

          const { data: custs, error: cErr } = await supabase.rpc('kaoj_admin_get_customers', { admin_pin: currentPin });
          if (!cErr && custs) {
            setCustomersList(custs);
          } else if (cErr) {
            console.warn('kaoj_admin_get_customers RPC error:', cErr.message);
            const { data: fallbackCusts } = await supabase.from('kaoj_customers').select('*').order('created_at', { ascending: false });
            if (fallbackCusts && fallbackCusts.length > 0) setCustomersList(fallbackCusts);
          }

          const { data: allRevs, error: rErr } = await supabase.rpc('kaoj_admin_get_all_reviews', { admin_pin: currentPin });
          if (!rErr && allRevs) {
            setReviews(allRevs);
          } else if (rErr) {
            console.warn('kaoj_admin_get_all_reviews RPC error:', rErr.message);
            const { data: fallbackRevs } = await supabase.from('kaoj_reviews').select('*').order('created_at', { ascending: false });
            if (fallbackRevs && fallbackRevs.length > 0) setReviews(fallbackRevs);
          }
        } catch (err) {
          console.error('Error cargando datos de administración:', err);
        }
      }

      // Proceso de autenticación con Google y vinculación permanente del teléfono
      async function handleUserAuth(googleUser) {
        setUser(googleUser);
        const googleName = googleUser.user_metadata?.full_name || googleUser.user_metadata?.name || '';
        const googleEmail = googleUser.email || '';

        try {
          const { data: existingCust } = await supabase
            .from('kaoj_customers')
            .select('*')
            .or(`user_id.eq.${googleUser.id},email.eq.${googleEmail}`)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (existingCust && existingCust.customer_code) {
            setCustomerProfile(existingCust);
            setCustomer(prev => ({
              ...prev,
              name: existingCust.name || googleName,
              phone: existingCust.phone || '',
              email: googleEmail,
              address: existingCust.address || prev.address
            }));
            showToast(`Bienvenida de nuevo, ${googleName.split(' ')[0]}. Código VIP: ${existingCust.customer_code} (${existingCust.points || 0} pts)`);
          } else {
            setCustomer(prev => ({ ...prev, name: googleName, email: googleEmail }));
            setShowPhonePromptModal(true);
          }

          // Cargar y fusionar carrito persistente de la nube
          await loadCloudCart(googleUser.id);
        } catch (e) {
          console.error('Error al autenticar usuario:', e);
        }
      }

      async function handleSavePhoneForGoogle(e) {
        e.preventDefault();
        const cleanDigits = phoneInputForGoogle.replace(/\D/g, '');
        if (cleanDigits.length < 9) {
          return showToast('Ingresa un número de celular válido de 10 dígitos', 'error');
        }

        const googleName = user?.user_metadata?.full_name || customer.name || 'Cliente';
        const googleEmail = user?.email || '';
        const code = generateCustomerCode(googleName, cleanDigits);

        const newProfile = {
          user_id: user?.id,
          name: googleName,
          phone: cleanDigits,
          email: googleEmail,
          customer_code: code,
          points: 0,
          lifetime_points: 0,
          orders_count: 0,
          total_spent: 0
        };

        const { data, error } = await supabase
          .from('kaoj_customers')
          .upsert(newProfile, { onConflict: 'user_id' })
          .select()
          .single();

        if (error) {
          return showToast('Error vinculando cuenta: ' + error.message, 'error');
        }

        setCustomerProfile(data || newProfile);
        setCustomer(prev => ({ ...prev, phone: cleanDigits, name: googleName }));
        setShowPhonePromptModal(false);
        showToast(`Tu Código VIP permanente es [${code}]. Ha quedado vinculado a tu cuenta.`);
      }

      async function handleGoogleSignIn() {
        const redirectUrl = window.location.origin + window.location.pathname;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: redirectUrl }
        });
        if (error) showToast('Error al conectar con Google: ' + error.message, 'error');
      }

      async function handleLogout() {
        await supabase.auth.signOut();
        setUser(null);
        setCustomerProfile(null);
        setIsProfileOpen(false);
        isCloudCartLoadedRef.current = false;
        showToast('Sesión cerrada correctamente');
      }

      // =======================================================================
      // 2. SINCRONIZACIÓN SEGURA DE CARRITO EN SUPABASE (Sin sobrescritura destructiva)
      // =======================================================================
      useEffect(() => {
        try {
          localStorage.setItem('kaoj_cart', JSON.stringify(cart));
        } catch (e) {}

        // Solo sincronizar con la nube si el usuario está logueado Y ya se cargó el carrito inicial
        if (user && isCloudCartLoadedRef.current) {
          supabase.from('kaoj_carts').upsert({
            user_id: user.id,
            customer_code: customerProfile?.customer_code || '',
            items: cart,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
        }
      }, [cart, user, customerProfile]);

      // Saneamiento y sincronización de stock del carrito al abrirlo
      useEffect(() => {
        if (!isCartOpen || products.length === 0 || cart.length === 0) return;

        let hasAdjusted = false;
        const sanitized = cart.map(item => {
          const prod = products.find(p => p.id === item.productId);
          if (!prod || !prod.is_active) {
            hasAdjusted = true;
            return null;
          }
          const varObj = (prod.variants || []).find(v => v.name === item.variant);
          const currentStock = varObj ? Number(varObj.stock || 0) : 0;
          if (currentStock <= 0) {
            hasAdjusted = true;
            return null;
          }
          let newQty = item.qty;
          if (item.qty > currentStock) {
            newQty = currentStock;
            hasAdjusted = true;
          }
          const freshPrice = prod.discount_price ? Number(prod.discount_price) : Number(prod.price);
          if (item.price !== freshPrice) {
            hasAdjusted = true;
          }
          return {
            ...item,
            qty: newQty,
            price: freshPrice,
            image: varObj?.image || prod.image
          };
        }).filter(Boolean);

        if (hasAdjusted) {
          setCart(sanitized);
          showToast('Tu carrito fue actualizado con el stock y precios vigentes.', 'info');
        }
      }, [isCartOpen]);

      async function loadCloudCart(userId) {
        try {
          const { data } = await supabase.from('kaoj_carts').select('items').eq('user_id', userId).single();
          if (data && Array.isArray(data.items) && data.items.length > 0) {
            setCart(prevCart => {
              if (prevCart.length === 0) return data.items;
              const merged = [...data.items];
              prevCart.forEach(localItem => {
                const existing = merged.find(i => i.key === localItem.key);
                if (existing) {
                  existing.qty = Math.max(existing.qty, localItem.qty);
                } else {
                  merged.push(localItem);
                }
              });
              return merged;
            });
            showToast('Carrito sincronizado desde la nube');
          }
        } catch (err) {
        } finally {
          isCloudCartLoadedRef.current = true;
        }
      }

      // =======================================================================
      // 3. GESTIÓN DEL CARRITO Y CÁLCULOS (Envío Gratis & Puntos VIP)
      // =======================================================================
      function addToCart(product, specificVariant = null, openCart = false) {
        const activeInfo = activeVariants[product.id];
        const varName = specificVariant || activeInfo?.variantName || (product.variants?.[0]?.name);
        const variantObj = (product.variants || []).find(v => v.name === varName);

        if (!variantObj || variantObj.stock <= 0) {
          return showToast(`"${varName}" no disponible actualmente.`, 'error');
        }

        const key = `${product.id}_${varName}`;
        const existing = cart.find(i => i.key === key);

        if (existing && existing.qty >= variantObj.stock) {
          return showToast(`Stock máximo disponible: ${variantObj.stock} unidades.`, 'info');
        }

        const unitPrice = product.discount_price ? Number(product.discount_price) : Number(product.price);
        const itemImage = variantObj.image || product.image;

        if (existing) {
          setCart(cart.map(i => i.key === key ? { ...i, qty: i.qty + 1 } : i));
        } else {
          setCart([...cart, {
            key,
            productId: product.id,
            name: product.name,
            variant: varName,
            price: unitPrice,
            qty: 1,
            image: itemImage
          }]);
        }

        showToast(`"${product.name}" (${varName}) agregado al carrito ✨`);
        if (openCart) {
          setIsCartOpen(true);
          if (quickViewProduct) setQuickViewProduct(null);
        }
      }

      function updateCartQty(key, delta) {
        setCart(cart.map(item => {
          if (item.key === key) {
            const newQty = item.qty + delta;
            const prod = products.find(p => p.id === item.productId);
            const varObj = prod?.variants?.find(v => v.name === item.variant);
            const maxStock = varObj ? varObj.stock : 99;

            if (newQty > maxStock) {
              showToast(`Stock máximo: ${maxStock}`, 'info');
              return item;
            }
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        }).filter(Boolean));
      }

      function removeFromCart(key) {
        setCart(cart.filter(i => i.key !== key));
      }

      // Cálculos Financieros
      const subtotal = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);

      // Métodos de Entrega Activos Normalizados en 4 Categorías (Retiro, Domicilio Manta/Portoviejo, Cooperativa, Servientrega)
      const activeDeliveryOptions = useMemo(() => {
        return normalizeShippingRates(settings.shipping_rates);
      }, [settings.shipping_rates]);

      const deliveryObj = useMemo(() => {
        const found = activeDeliveryOptions.find(d => d.id === customer.delivery);
        if (found) return found;
        const firstInCat = activeDeliveryOptions.find(d => getShippingCategory(d) === (customer.shippingCategory || 'retiro'));
        return firstInCat || activeDeliveryOptions[0] || DEFAULT_SHIPPING_RATES[0];
      }, [activeDeliveryOptions, customer.delivery, customer.shippingCategory]);

      const activeShippingCategory = getShippingCategory(deliveryObj);

      const categorySubMethods = useMemo(() => {
        return activeDeliveryOptions.filter(d => getShippingCategory(d) === activeShippingCategory);
      }, [activeDeliveryOptions, activeShippingCategory]);

      function handleSelectShippingCategory(catId) {
        const subOptions = activeDeliveryOptions.filter(d => getShippingCategory(d) === catId);
        const firstMethod = subOptions[0] || activeDeliveryOptions[0];
        setCustomer(prev => ({
          ...prev,
          shippingCategory: catId,
          delivery: firstMethod ? firstMethod.id : prev.delivery,
          city: catId === 'domicilio' ? (firstMethod?.city || (firstMethod?.id?.includes('manta') ? 'Manta' : 'Portoviejo')) : prev.city
        }));
      }

      // Regla de Envío Gratis
      const freeShippingThreshold = Number(settings.free_shipping_threshold || 50.00);
      const qualifiesFreeShipping = subtotal >= freeShippingThreshold && (Number(deliveryObj?.price || 0) > 0);
      const finalShippingCost = qualifiesFreeShipping ? 0 : Number(deliveryObj?.price || 0);

      // Regla de Puntos VIP: Cada 50 puntos = $5.00 de descuento directo
      const customerCurrentPoints = Number(customerProfile?.points || 0);
      const pointsPerBlock = Number(settings.points_min_redeem || 50);
      const discountPerBlock = 5.00;
      const maxAvailablePointBlocks = Math.floor(customerCurrentPoints / pointsPerBlock);
      const maxSubtotalBlocks = Math.max(1, Math.floor(subtotal / discountPerBlock));
      const maxRedeemableBlocks = Math.min(maxAvailablePointBlocks, maxSubtotalBlocks);
      const canRedeemPoints = maxAvailablePointBlocks >= 1 && subtotal >= discountPerBlock;
      const activeRedeemBlocks = (applyPointsDiscount && canRedeemPoints) ? Math.min(Math.max(1, redeemBlocksCount), maxRedeemableBlocks) : 0;
      const pointsToRedeemNow = activeRedeemBlocks * pointsPerBlock;
      const pointsDiscountAmount = activeRedeemBlocks * discountPerBlock;

      // Progreso hacia el siguiente canje de 50 puntos ($5.00 OFF)
      const pointsTowardsNextBlock = customerCurrentPoints % pointsPerBlock;
      const pointsNeededForNextDiscount = pointsPerBlock - pointsTowardsNextBlock;
      const pointsProgressPercent = canRedeemPoints ? 100 : Math.min(100, Math.round((pointsTowardsNextBlock / pointsPerBlock) * 100));

      // Descuento por Cupón Promocional
      let couponDiscountAmount = 0;
      if (appliedCoupon) {
        if (appliedCoupon.type === 'percent' || appliedCoupon.type === 'percentage') {
          const pct = Number(appliedCoupon.discount || appliedCoupon.value || 0);
          couponDiscountAmount = Number(((subtotal * pct) / 100).toFixed(2));
        } else if (appliedCoupon.type === 'fixed') {
          const fixVal = Number(appliedCoupon.discount || appliedCoupon.value || 0);
          couponDiscountAmount = Math.min(subtotal, fixVal);
        } else if (appliedCoupon.type === 'shipping') {
          couponDiscountAmount = finalShippingCost;
        }
      }

      // Descuentos aplicables al producto (no envío)
      const productDiscounts = Math.min(subtotal, pointsDiscountAmount + (appliedCoupon?.type !== 'shipping' ? couponDiscountAmount : 0));
      const totalDiscounts = pointsDiscountAmount + couponDiscountAmount;
      const finalShippingAfterCoupon = (qualifiesFreeShipping || appliedCoupon?.type === 'shipping') ? 0 : Number(deliveryObj?.price || 0);
      const baseTotalBeforeCardFee = Math.max(0, subtotal - productDiscounts) + finalShippingAfterCoupon;

      // Recargo por pago con Tarjeta en Payphone (Comisión de pasarela con tarjeta)
      const payphoneSurchargePercent = Number(settings.payphone_surcharge_percent ?? 6.0);
      const payphoneSurchargeAmount = customer.paymentMethod === 'payphone'
        ? Number(((baseTotalBeforeCardFee * payphoneSurchargePercent) / 100).toFixed(2))
        : 0;

      const total = Number((baseTotalBeforeCardFee + payphoneSurchargeAmount).toFixed(2));
      const pointsEarnedWithOrder = Math.floor(Math.max(0, subtotal - productDiscounts));

      // Métricas de Envío Gratis
      const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
      const shippingProgressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

      // Código de cliente activo
      const activeCustomerCode = customerProfile?.customer_code || generateCustomerCode(customer.name, customer.phone);

      // Validación de navegación por pasos en el Checkout (1: Datos, 2: Envío, 3: Pago)
      function validateCheckoutStep1() {
        if (!customer.name || !customer.name.trim()) {
          showToast('Por favor ingresa tu nombre y apellido para continuar.', 'error');
          return false;
        }
        const cleanDigits = (customer.phone || '').replace(/\D/g, '');
        if (cleanDigits.length < 9) {
          showToast('Ingresa tu número de celular de WhatsApp (10 dígitos).', 'error');
          return false;
        }
        return true;
      }

      function validateCheckoutStep2() {
        if (!deliveryObj) {
          showToast('Selecciona un método de envío para continuar.', 'error');
          return false;
        }
        if (activeShippingCategory === 'domicilio') {
          if (!customer.address || !customer.address.trim()) {
            showToast('Ingresa tu dirección exacta y referencia en Manta o Portoviejo.', 'error');
            return false;
          }
        } else if (activeShippingCategory === 'cooperativa') {
          if (!customer.city || !customer.city.trim()) {
            showToast('Indica la ciudad de destino para tu envío por Cooperativa.', 'error');
            return false;
          }
          if (!customer.address || !customer.address.trim()) {
            showToast('Indica la cooperativa preferida o terminal de retiro.', 'error');
            return false;
          }
        } else if (activeShippingCategory === 'servientrega') {
          if (!customer.city || !customer.city.trim()) {
            showToast('Indica la ciudad y provincia de destino para Servientrega.', 'error');
            return false;
          }
          if (!customer.address || !customer.address.trim()) {
            showToast('Ingresa la dirección exacta o la agencia oficial de Servientrega.', 'error');
            return false;
          }
          if (!customer.idCard || customer.idCard.replace(/\D/g, '').length < 8) {
            showToast('Ingresa tu número de Cédula o RUC para generar tu guía oficial de Servientrega.', 'error');
            return false;
          }
        }
        return true;
      }

      function handleGoToStep(targetStep) {
        if (targetStep === 1) {
          setCheckoutStep(1);
          return;
        }
        if (targetStep === 2) {
          if (!validateCheckoutStep1()) return;
          handlePhoneLookup(customer.phone);
          setShowCartItemsInStep(false);
          setCheckoutStep(2);
          return;
        }
        if (targetStep === 3) {
          if (!validateCheckoutStep1()) {
            setCheckoutStep(1);
            return;
          }
          if (!validateCheckoutStep2()) {
            setCheckoutStep(2);
            return;
          }
          setShowCartItemsInStep(false);
          setCheckoutStep(3);
        }
      }

      // =======================================================================
      // 4. CHECKOUT SEGURO & DESCUENTO ATÓMICO DE STOCK (FASE 1)
      // =======================================================================
      async function handleCheckoutSubmit(e) {
        e.preventDefault();
        if (cart.length === 0) return showToast('El carrito está vacío', 'error');
        if (!validateCheckoutStep1()) {
          setCheckoutStep(1);
          return;
        }
        if (!validateCheckoutStep2()) {
          setCheckoutStep(2);
          return;
        }

        // Validación de pago en Paso 3
        if (customer.paymentMethod === 'payphone') {
          if (!customer.payphoneRef.trim() && !customer.receiptUrl) {
            return showToast('Ingresa el número de referencia/autorización o sube la captura de tu pago en Payphone.', 'error');
          }
        } else if (!customer.receiptUrl) {
          return showToast('Sube la captura del comprobante de transferencia o Deuna para validar tu pedido.', 'error');
        }

        setIsSubmittingOrder(true);

        // 1. VERIFICACIÓN DE STOCK EN TIEMPO REAL DESDE SUPABASE
        const prodIds = [...new Set(cart.map(i => i.productId))];
        const { data: freshProducts, error: fetchErr } = await supabase
          .from('kaoj_products')
          .select('id, name, variants, is_active')
          .in('id', prodIds);

        if (fetchErr || !freshProducts) {
          setIsSubmittingOrder(false);
          return showToast('No se pudo verificar el inventario en tiempo real. Intenta de nuevo.', 'error');
        }

        // Validar cantidades de cada ítem del carrito contra el stock fresco
        for (const item of cart) {
          const freshProd = freshProducts.find(p => p.id === item.productId);
          if (!freshProd || !freshProd.is_active) {
            setIsSubmittingOrder(false);
            return showToast(`El producto "${item.name}" ya no se encuentra disponible.`, 'error');
          }

          const varObj = (freshProd.variants || []).find(v => v.name === item.variant);
          const stockAvail = varObj ? Number(varObj.stock || 0) : 0;
          if (stockAvail < item.qty) {
            setIsSubmittingOrder(false);
            if (stockAvail <= 0) {
              return showToast(`Lo sentimos, "${item.name} (${item.variant})" se ha agotado. Por favor retíralo de tu pedido.`, 'error');
            } else {
              return showToast(`Solo quedan ${stockAvail} unidad(es) de "${item.name} (${item.variant})". Ajusta tu carrito.`, 'error');
            }
          }
        }

        const orderCode = `KAOJ-${Math.floor(100000 + Math.random() * 900000)}`;

        const formattedFullAddress = [
          customer.city ? `Ciudad: ${customer.city.trim()}` : '',
          customer.address ? customer.address.trim() : '',
          customer.deliveryNotes ? `Nota: ${customer.deliveryNotes.trim()}` : ''
        ].filter(Boolean).join(' | ');

        const adminNotesParts = [];
        if (appliedCoupon) adminNotesParts.push(`Cupón: ${appliedCoupon.code} (-$${couponDiscountAmount.toFixed(2)})`);
        if (pointsToRedeemNow > 0) adminNotesParts.push(`Canje VIP: ${pointsToRedeemNow} pts (-$${pointsDiscountAmount.toFixed(2)})`);
        if (payphoneSurchargeAmount > 0) adminNotesParts.push(`Recargo Tarjeta Payphone (${payphoneSurchargePercent}%): +$${payphoneSurchargeAmount.toFixed(2)}`);

        const orderData = {
          order_code: orderCode,
          customer_code: activeCustomerCode,
          customer_name: customer.name.trim(),
          customer_phone: customer.phone.trim(),
          customer_id_card: customer.idCard.trim(),
          customer_email: customer.email || user?.email || '',
          user_id: user?.id || null,
          delivery_method: deliveryObj.label + (qualifiesFreeShipping ? ' (Envío Gratis)' : ''),
          delivery_address: formattedFullAddress || 'Retiro Personal',
          shipping_cost: finalShippingAfterCoupon,
          subtotal: subtotal,
          discount_amount: productDiscounts,
          total: total,
          points_earned: pointsEarnedWithOrder,
          points_redeemed: pointsToRedeemNow,
          payment_method:
            customer.paymentMethod === 'deuna' ? 'Deuna!' :
            customer.paymentMethod === 'payphone' ? `Tarjeta Payphone (Ref: ${customer.payphoneRef || 'Comprobante'} | +$${payphoneSurchargeAmount.toFixed(2)} recargo)` :
            `Transferencia Bancaria (${selectedTransferBank === 'pichincha' ? 'Banco Pichincha' : 'Banco Guayaquil'})`,
          receipt_url: customer.receiptUrl || `Payphone Ref: ${customer.payphoneRef}`,
          items: cart,
          status: 'pendiente',
          admin_notes: adminNotesParts.join(' • ')
        };

        try {
          // 2. Insertar orden con control estricto de error
          const { error: orderError } = await supabase
            .from('kaoj_orders')
            .insert([orderData]);

          if (orderError) {
            console.error('Error registrando orden en Supabase:', orderError);
            setIsSubmittingOrder(false);
            return showToast('Error al registrar tu orden: ' + (orderError.message || 'Verifica tu conexión'), 'error');
          }

          // 3. Descuento seguro de stock atómico en el servidor (Sin permisos UPDATE a clientes)
          await supabase.rpc('kaoj_decrement_order_stock', {
            order_items: cart
          });

          // 4. Actualizar puntos del cliente en kaoj_customers de forma atómica y sin colisiones
          const { data: custRes } = await supabase.rpc('kaoj_save_customer_order', {
            cust_code: activeCustomerCode,
            cust_name: customer.name.trim(),
            cust_phone: customer.phone.trim(),
            cust_email: customer.email || user?.email || '',
            cust_id_card: customer.idCard.trim(),
            cust_address: formattedFullAddress,
            cust_user_id: user?.id || null,
            points_to_add: pointsEarnedWithOrder,
            points_to_deduct: pointsToRedeemNow,
            order_total: total
          });

          if (customerProfile && custRes?.points !== undefined) {
            setCustomerProfile(prev => ({ ...prev, points: custRes.points }));
          } else {
            const updatedPts = Math.max(0, customerCurrentPoints - pointsToRedeemNow) + pointsEarnedWithOrder;
            setCustomerProfile(prev => ({
              ...(prev || {}),
              customer_code: activeCustomerCode,
              name: customer.name.trim(),
              phone: customer.phone.trim(),
              points: updatedPts
            }));
          }

          if (user) {
            await supabase.from('kaoj_carts').delete().eq('user_id', user.id);
          }
        } catch (err) {
          console.error('Error inesperado durante la compra:', err);
          setIsSubmittingOrder(false);
          return showToast('Ocurrió un error al procesar la compra: ' + err.message, 'error');
        }

        // 5. Generar enlace y mensaje pre-formateado a WhatsApp Oficial
        const officialWhatsApp = formatWhatsAppPhone(settings.whatsapp_number);
        const itemsListText = cart.map(i => `• ${i.qty}x *${i.name}* (${i.variant}) - $${(i.price * i.qty).toFixed(2)}`).join('\n');
        const paymentLabel =
          customer.paymentMethod === 'deuna' ? 'Deuna! (Sin recargo)' :
          customer.paymentMethod === 'payphone' ? `Tarjeta / Payphone (Ref: ${customer.payphoneRef || 'Adjunto'})` :
          `Transferencia Bancaria (${selectedTransferBank === 'pichincha' ? 'Banco Pichincha' : 'Banco Guayaquil'})`;

        const whatsappMsg =
          `*NUEVO PEDIDO KAOJ STORE*\n\n` +
          `*Orden:* ${orderCode}\n` +
          `*Código VIP Cliente:* *${activeCustomerCode}*\n` +
          `*Cliente:* ${customer.name}\n` +
          `*Celular:* ${customer.phone}\n` +
          (customer.idCard ? `*Cédula/RUC:* ${customer.idCard}\n` : '') +
          `*Modalidad de Envío:* ${deliveryObj.label}\n` +
          (formattedFullAddress ? `*Destino / Dirección:* ${formattedFullAddress}\n` : '') +
          `*Forma de Pago:* ${paymentLabel}\n\n` +
          `*PRODUCTOS COMPRADOS:*\n${itemsListText}\n\n` +
          `*Subtotal:* $${subtotal.toFixed(2)}\n` +
          (pointsDiscountAmount > 0 ? `*Descuento Puntos VIP (${pointsToRedeemNow} Pts):* -$${pointsDiscountAmount.toFixed(2)}\n` : '') +
          (couponDiscountAmount > 0 ? `*Cupón (${appliedCoupon.code}):* -$${couponDiscountAmount.toFixed(2)}\n` : '') +
          `*Envío:* ${finalShippingAfterCoupon === 0 ? 'GRATIS ($0.00)' : '$' + finalShippingAfterCoupon.toFixed(2)}\n` +
          (payphoneSurchargeAmount > 0 ? `*Recargo Tarjeta Payphone (${payphoneSurchargePercent}%):* +$${payphoneSurchargeAmount.toFixed(2)}\n` : '') +
          `*TOTAL PAGADO:* *$${total.toFixed(2)}*\n` +
          `*Puntos Kaoj Ganados:* +${pointsEarnedWithOrder} pts (Cada 50 pts = $5.00 OFF)\n\n` +
          (customer.receiptUrl ? `*Comprobante:* \n${customer.receiptUrl}\n\n` : '') +
          `Hola Kaoj Store, acabo de realizar mi pedido en la tienda online.`;

        const whatsappUrl = `https://wa.me/${officialWhatsApp}?text=${encodeURIComponent(whatsappMsg)}`;

        // 6. Activar el Modal de Confirmación de Pedido (Resistente a bloqueadores móviles)
        setOrderSuccessModal({
          orderCode,
          customerCode: activeCustomerCode,
          customerName: customer.name.trim(),
          customerPhone: customer.phone.trim(),
          total: total.toFixed(2),
          subtotal: subtotal.toFixed(2),
          shippingCost: finalShippingAfterCoupon,
          payphoneSurcharge: payphoneSurchargeAmount,
          pointsEarned: pointsEarnedWithOrder,
          pointsRedeemed: pointsToRedeemNow,
          deliveryMethod: deliveryObj.label,
          whatsappUrl,
          items: [...cart]
        });

        // Intentar apertura automática de WhatsApp en pestaña nueva
        try {
          window.open(whatsappUrl, '_blank');
        } catch (e) {}

        // Persistir último código y teléfono para auto-rastreo sin login manual
        try {
          localStorage.setItem('kaoj_last_customer_code', activeCustomerCode);
          if (customer.phone) localStorage.setItem('kaoj_last_customer_phone', customer.phone);
        } catch (e) {}

        // Limpiar carrito y reiniciar al Paso 1
        setCart([]);
        localStorage.removeItem('kaoj_cart');
        setIsCartOpen(false);
        setCheckoutStep(1);
        setShowCartItemsInStep(true);
        setApplyPointsDiscount(false);
        setRedeemBlocksCount(1);
        setAppliedCoupon(null);
        setCouponCodeInput('');
        setShowCouponInputBox(false);
        setCustomer(prev => ({ ...prev, receiptUrl: '', payphoneRef: '' }));
        setIsSubmittingOrder(false);
        showToast(`¡Pedido ${orderCode} generado con éxito! Ganaste +${pointsEarnedWithOrder} Puntos Kaoj VIP.`);
        fetchInitialData();
      }

      // =======================================================================
      // 5. GESTIÓN DE RESEÑAS (Social Proof)
      // =======================================================================
      async function handleCreateReview(e) {
        e.preventDefault();
        if (!newReview.customer_name.trim() || !newReview.comment.trim()) {
          return showToast('Por favor ingresa tu nombre y opinión.', 'error');
        }

        const reviewPayload = {
          customer_name: newReview.customer_name.trim(),
          customer_code: newReview.customer_code.trim() || activeCustomerCode || '',
          product_id: newReview.product_id ? Number(newReview.product_id) : null,
          product_name: newReview.product_name || 'Boutique Kaoj',
          rating: Number(newReview.rating) || 5,
          comment: newReview.comment.trim(),
          photo_url: newReview.photo_url || '',
          is_verified_buyer: false,
          is_approved: false
        };

        const { error } = await supabase.from('kaoj_reviews').insert([reviewPayload]);
        if (error) return showToast('Error al enviar reseña: ' + error.message, 'error');

        setIsReviewModalOpen(false);
        setNewReview({ customer_name: '', customer_code: '', product_id: '', product_name: '', product_image: '', product_variant: '', order_code: '', rating: 5, comment: '', photo_url: '' });
        showToast('¡Gracias por tu reseña! Ha sido enviada y será publicada en el muro tras su aprobación. ✨');
      }

      async function handleDeleteReview(reviewId) {
        if (!confirm('¿Eliminar esta reseña definitivamente?')) return;
        const adminPin = sessionStorage.getItem('kaoj_admin_pin') || '';
        const { error } = await supabase.rpc('kaoj_admin_delete_review', { admin_pin: adminPin, rev_id: reviewId });
        if (!error) {
          setReviews(reviews.filter(r => r.id !== reviewId));
          showToast('Reseña eliminada');
        } else {
          showToast('Error al eliminar: ' + error.message, 'error');
        }
      }

      async function handleToggleReviewApproval(reviewId, currentStatus) {
        const nextStatus = !currentStatus;
        const adminPin = sessionStorage.getItem('kaoj_admin_pin') || '';
        const { error } = await supabase.rpc('kaoj_admin_moderate_review', { admin_pin: adminPin, rev_id: reviewId, approve: nextStatus });
        if (!error) {
          setReviews(reviews.map(r => r.id === reviewId ? { ...r, is_approved: nextStatus } : r));
          showToast(`Reseña ${nextStatus ? 'aprobada' : 'ocultada'}`);
        } else {
          showToast('Error al moderar: ' + error.message, 'error');
        }
      }

      // =======================================================================
      // CANCELAR O REVERTIR VENTA (Solo Administrador: Restaura existencias y ajusta saldo)
      // =======================================================================
      async function handleCancelOrder(order) {
        if (!order || order.status === 'cancelado') {
          return showToast('Esta orden ya se encuentra cancelada.', 'error');
        }

        const itemsCount = (order.items || []).reduce((acc, i) => acc + (Number(i.qty) || 0), 0);
        const confirmMsg = `¿Deseas cancelar y revertir la venta de la orden ${order.order_code}?\n\n` +
          `• Se devolverán ${itemsCount} producto(s) a las existencias del inventario.\n` +
          `• El estado de la orden pasará a CANCELADO.\n` +
          `• Si la clienta acumuló puntos por esta compra, se descontarán de su saldo.`;

        if (!window.confirm(confirmMsg)) return;

        setUploading(true);
        try {
          const adminPin = sessionStorage.getItem('kaoj_admin_pin') || '';
          const { data: cancelRes, error: rpcErr } = await supabase.rpc('kaoj_admin_cancel_order', {
            admin_pin: adminPin,
            target_order_id: order.id
          });

          if (rpcErr) throw rpcErr;

          const cancelNote = `[VENTA REVERTIDA / CANCELADA: Stock devuelto (${new Date().toLocaleDateString('es-EC')})]`;
          const updatedNotes = order.admin_notes ? `${order.admin_notes} | ${cancelNote}` : cancelNote;

          setOrders(orders.map(o => o.id === order.id ? { ...o, status: 'cancelado', admin_notes: updatedNotes } : o));
          setUploading(false);
          showToast(`¡Venta revertida exitosamente! Se devolvieron ${cancelRes?.restored_items || itemsCount} producto(s) al inventario.`);
          fetchInitialData();
        } catch (err) {
          setUploading(false);
          console.error('Error al revertir orden:', err);
          showToast('Error al revertir la venta: ' + err.message, 'error');
        }
      }

      // =======================================================================
      // 6. SUBIDA DE ARCHIVOS A SUPABASE STORAGE
      // =======================================================================
      async function uploadFileToSupabase(file, folder = 'products') {
        if (!file) return null;
        if (file.size > 5 * 1024 * 1024) {
          showToast('El archivo supera el tamaño máximo permitido (5 MB).', 'error');
          return null;
        }
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
          showToast('Formato no permitido. Solo se aceptan imágenes (JPG, PNG, WebP) o PDF.', 'error');
          return null;
        }

        setUploading(true);
        try {
          const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
          const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15);
          const fileName = `${folder}/${Date.now()}_${cleanName}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from('kaoj-assets')
            .upload(fileName, file, { cacheControl: '3600', upsert: true });

          if (uploadError) throw uploadError;

          const { data } = supabase.storage.from('kaoj-assets').getPublicUrl(fileName);
          setUploading(false);
          showToast('Archivo subido a la nube');
          return data.publicUrl;
        } catch (err) {
          setUploading(false);
          showToast('Error cargando archivo: ' + err.message, 'error');
          return null;
        }
      }

      // =======================================================================
      // 7. ADMINISTRADOR: AJUSTES, PRODUCTOS, SECCIONES Y PEDIDOS
      // =======================================================================
      async function handleSaveSettings(e) {
        if (e) e.preventDefault();
        if (!adminSettingsForm) return;

        setUploading(true);
        try {
          const adminPin = sessionStorage.getItem('kaoj_admin_pin') || '';
          if (!adminPin) {
            setUploading(false);
            return showToast('Sesión administrativa no válida. Vuelve a ingresar el PIN.', 'error');
          }

          const cleanPhone = formatWhatsAppPhone(adminSettingsForm.whatsapp_number);
          const surchargeVal = parseFloat(adminSettingsForm.payphone_surcharge_percent ?? 6.0);
          const payload = {
            whatsapp_number: cleanPhone,
            deuna_link: adminSettingsForm.deuna_link,
            deuna_qr_url: adminSettingsForm.deuna_qr_url,
            payphone_link: adminSettingsForm.payphone_link,
            payphone_token: adminSettingsForm.payphone_token,
            bank_guayaquil_acc: adminSettingsForm.bank_guayaquil_acc,
            bank_guayaquil_name: adminSettingsForm.bank_guayaquil_name,
            bank_guayaquil_id: adminSettingsForm.bank_guayaquil_id,
            bank_pichincha_acc: adminSettingsForm.bank_pichincha_acc,
            bank_pichincha_name: adminSettingsForm.bank_pichincha_name,
            bank_pichincha_id: adminSettingsForm.bank_pichincha_id,
            free_shipping_threshold: parseFloat(adminSettingsForm.free_shipping_threshold || 50),
            banner_message: adminSettingsForm.banner_message,
            about_us: adminSettingsForm.about_us,
            shipping_rates: adminSettingsForm.shipping_rates,
            sections_config: {
              ...sectionsConfig,
              __payphone_surcharge_percent: isNaN(surchargeVal) ? 6.0 : surchargeVal
            }
          };

          const { error: saveErr } = await supabase.rpc('kaoj_admin_save_settings', {
            admin_pin: adminPin,
            settings_data: payload
          });

          if (saveErr) {
            console.warn('kaoj_admin_save_settings RPC error, intentando guardado directo:', saveErr.message);
            const { error: directErr } = await supabase.from('kaoj_settings').upsert({ id: 1, ...payload });
            if (directErr && !directErr.message?.includes('row-level security')) {
              throw saveErr;
            }
          }

          // Si el admin escribió un nuevo PIN para cambiarlo
          if (adminSettingsForm.admin_pin && adminSettingsForm.admin_pin.trim().length >= 4) {
            const { error: pinErr } = await supabase.rpc('kaoj_change_admin_pin', {
              current_pin: adminPin,
              new_pin: adminSettingsForm.admin_pin.trim()
            });
            if (pinErr) {
              showToast('Ajustes guardados, pero el cambio de PIN falló: ' + pinErr.message, 'error');
            } else {
              sessionStorage.setItem('kaoj_admin_pin', adminSettingsForm.admin_pin.trim());
              showToast('¡PIN de administrador actualizado exitosamente!');
            }
          }

          // Respaldo en localStorage
          try {
            localStorage.setItem('kaoj_about_us', JSON.stringify(adminSettingsForm.about_us));
            localStorage.setItem('kaoj_shipping_rates', JSON.stringify(adminSettingsForm.shipping_rates));
            localStorage.setItem('kaoj_payphone_surcharge', String(isNaN(surchargeVal) ? 6.0 : surchargeVal));
          } catch(e) {}

          setSettings({ ...settings, ...adminSettingsForm, whatsapp_number: formatDisplayPhone(cleanPhone) });
          setUploading(false);
          showToast('Ajustes, Tarifas de Envío y Quiénes Somos guardados con éxito');
        } catch (err) {
          setUploading(false);
          showToast('Error al guardar ajustes: ' + err.message, 'error');
        }
      }

      function openEditProductModal(prod) {
        const cloned = JSON.parse(JSON.stringify(prod));
        cloned.images = getProductImages(cloned);
        const hasColorSize = (cloned.variants || []).some(v => v.color && v.size);
        if (hasColorSize) {
          setEditVariantMode('color_size');
          const colorMap = new Map();
          (cloned.variants || []).forEach(v => {
            if (v.color && !colorMap.has(v.color)) {
              colorMap.set(v.color, v.image || '');
            }
          });
          const colorsList = Array.from(colorMap.entries()).map(([name, image]) => ({ name, image }));
          setEditColors(colorsList.length > 0 ? colorsList : [{ name: 'Color 1', image: '' }]);

          const sizeSet = new Set();
          (cloned.variants || []).forEach(v => {
            if (v.size) sizeSet.add(v.size);
          });
          const sizesList = Array.from(sizeSet);
          setEditSizes(sizesList.length > 0 ? sizesList : ['S', 'M', 'L']);

          const stockMap = {};
          (cloned.variants || []).forEach(v => {
            if (v.color && v.size) {
              stockMap[`${v.color}_${v.size}`] = v.stock ?? 0;
            }
          });
          setEditMatrixStock(stockMap);
        } else {
          setEditVariantMode('simple');
          setEditColors([{ name: 'Negro', image: '' }, { name: 'Blanco', image: '' }]);
          setEditSizes(['S', 'M', 'L']);
          setEditMatrixStock({});
        }
        setEditingProduct(cloned);
      }

      async function handleSaveEditedProduct(e) {
        e.preventDefault();
        if (!editingProduct) return;

        let finalVariants = [];
        let finalVariantLabel = editingProduct.variant_label || 'Tono / Talla';

        if (editVariantMode === 'color_size') {
          finalVariantLabel = 'Color y Talla';
          editColors.forEach(c => {
            const colName = (c.name || '').trim();
            if (!colName) return;
            editSizes.forEach(s => {
              const sizeName = (s || '').trim();
              if (!sizeName) return;
              const key = `${colName}_${sizeName}`;
              const st = editMatrixStock[key];
              finalVariants.push({
                name: `${colName} - ${sizeName}`,
                color: colName,
                size: sizeName,
                stock: parseInt(st !== undefined && st !== '' ? st : (editBulkStock || 5), 10),
                image: c.image || editingProduct.image || ''
              });
            });
          });

          if (finalVariants.length === 0) {
            return showToast('Debes configurar al menos 1 color y 1 talla', 'error');
          }
        } else {
          finalVariants = (editingProduct.variants && editingProduct.variants.length > 0)
            ? editingProduct.variants
            : [{ name: 'Único', stock: 5, image: '' }];
        }

        const prodImages = (editingProduct.images && editingProduct.images.length > 0)
          ? editingProduct.images.filter(Boolean)
          : (editingProduct.image ? [editingProduct.image] : []);
        const primaryImage = prodImages[0] || editingProduct.image || 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600';

        if (finalVariants.length > 0 && prodImages.length > 0) {
          finalVariants[0].gallery = prodImages;
        }

        setUploading(true);
        try {
          const updatedPayload = {
            name: editingProduct.name.trim(),
            section: editingProduct.section,
            category: editingProduct.category,
            price: parseFloat(editingProduct.price),
            discount_price: editingProduct.discount_price ? parseFloat(editingProduct.discount_price) : null,
            image: primaryImage,
            images: prodImages,
            description: editingProduct.description,
            variant_label: finalVariantLabel,
            variants: finalVariants
          };

          const adminPin = sessionStorage.getItem('kaoj_admin_pin') || '';
          const { error } = await supabase.rpc('kaoj_admin_save_product', {
            admin_pin: adminPin,
            prod_data: { id: editingProduct.id, ...updatedPayload }
          });

          if (error) {
            console.warn('kaoj_admin_save_product RPC error, intentando directo:', error.message);
            const { error: directErr } = await supabase.from('kaoj_products').update(updatedPayload).eq('id', editingProduct.id);
            if (directErr && !directErr.message?.includes('row-level security')) throw error;
          }

          const updatedProd = { ...editingProduct, ...updatedPayload };
          setProducts(products.map(p => p.id === editingProduct.id ? updatedProd : p));
          setEditingProduct(null);
          setUploading(false);
          showToast('Producto actualizado exitosamente');
        } catch (err) {
          setUploading(false);
          showToast('Error al actualizar producto: ' + err.message, 'error');
        }
      }

      async function handleCreateProduct(e) {
        e.preventDefault();
        if (!newProd.name.trim() || !newProd.price) {
          return showToast('Ingresa nombre y precio', 'error');
        }

        let finalVariants = [];
        let finalVariantLabel = newProd.variant_label.trim() || 'Tono / Talla';

        if (newProdVariantMode === 'color_size') {
          finalVariantLabel = 'Color y Talla';
          newProdColors.forEach(c => {
            const colName = (c.name || '').trim();
            if (!colName) return;
            newProdSizes.forEach(s => {
              const sizeName = (s || '').trim();
              if (!sizeName) return;
              const key = `${colName}_${sizeName}`;
              const st = newProdMatrixStock[key];
              finalVariants.push({
                name: `${colName} - ${sizeName}`,
                color: colName,
                size: sizeName,
                stock: parseInt(st !== undefined && st !== '' ? st : (newProdBulkStock || 5), 10),
                image: c.image || newProd.image || ''
              });
            });
          });

          if (finalVariants.length === 0) {
            return showToast('Debes configurar al menos 1 color y 1 talla', 'error');
          }
        } else {
          finalVariants = newProd.variants.length > 0 ? newProd.variants : [{ name: 'Único', stock: 5, image: '' }];
        }

        const prodImages = (newProd.images && newProd.images.length > 0)
          ? newProd.images.filter(Boolean)
          : (newProd.image ? [newProd.image] : []);
        const primaryImage = prodImages[0] || newProd.image || 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600';

        if (finalVariants.length > 0 && prodImages.length > 0) {
          finalVariants[0].gallery = prodImages;
        }

        const prodPayload = {
          name: newProd.name.trim(),
          section: newProd.section,
          category: newProd.category,
          price: parseFloat(newProd.price),
          discount_price: newProd.discount_price ? parseFloat(newProd.discount_price) : null,
          image: primaryImage,
          images: prodImages,
          description: newProd.description.trim(),
          variant_label: finalVariantLabel,
          variants: finalVariants,
          is_active: true
        };

        const adminPin = sessionStorage.getItem('kaoj_admin_pin') || '';
        let createdId = null;
        const { data: createRes, error } = await supabase.rpc('kaoj_admin_save_product', {
          admin_pin: adminPin,
          prod_data: prodPayload
        });
        if (error) {
          console.warn('kaoj_admin_save_product create error, intentando directo:', error.message);
          const { data: directData, error: directErr } = await supabase.from('kaoj_products').insert([prodPayload]).select();
          if (directErr && !directErr.message?.includes('row-level security')) return showToast('Error al crear producto: ' + error.message, 'error');
          if (directData && directData[0]) createdId = directData[0].id;
        } else {
          createdId = createRes?.id;
        }

        const newId = createdId || Date.now();
        const createdProd = { ...prodPayload, id: newId, is_active: true };
        setProducts([createdProd, ...products]);
        showToast('Producto agregado al catálogo con sus fotos ✨');
        const keepSec = newProd.section || 'MAQUILLAJES';
        const isClothing = keepSec.toUpperCase() === 'ROPA';
        setNewProd({
          name: '',
          section: keepSec,
          category: (sectionsConfig[keepSec] || [])[0] || '',
          price: '',
          discount_price: '',
          image: '',
          images: [],
          description: '',
          variant_label: isClothing ? 'Color y Talla' : 'Tono / Talla',
          variants: [{ name: '01 Rosa', stock: 5, image: '' }]
        });
        setNewProdColors([
          { name: 'Negro', image: '' },
          { name: 'Blanco', image: '' }
        ]);
        setNewProdSizes(['S', 'M', 'L']);
        setNewProdMatrixStock({});
        setNewProdCustomSize('');
        setNewProdVariantMode(isClothing ? 'color_size' : 'simple');
        setShowNewProductPanel(false);
      }

      async function handleDeleteProduct(productId) {
        if (!confirm('¿Deseas retirar este producto del catálogo?')) return;
        const adminPin = sessionStorage.getItem('kaoj_admin_pin') || '';
        const { error } = await supabase.rpc('kaoj_admin_delete_product', {
          admin_pin: adminPin,
          prod_id: productId
        });
        if (error) return showToast('Error al retirar producto: ' + error.message, 'error');
        setProducts(products.filter(p => p.id !== productId));
        showToast('Producto retirado del catálogo');
      }

      async function handleQuickStockChange(productId, variantName, delta) {
        const adminPin = sessionStorage.getItem('kaoj_admin_pin') || '';
        const { data, error } = await supabase.rpc('kaoj_admin_update_stock', {
          admin_pin: adminPin,
          prod_id: productId,
          var_name: variantName,
          stock_val: delta,
          is_delta: true
        });
        if (!error && data?.variants) {
          setProducts(products.map(p => p.id === productId ? { ...p, variants: data.variants } : p));
          showToast(`Stock de "${variantName}" actualizado`);
        } else if (error) {
          showToast('Error: ' + error.message, 'error');
        }
      }

      async function handleDirectStockChange(productId, variantName, newStock) {
        const safeVal = Math.max(0, isNaN(newStock) ? 0 : newStock);
        const adminPin = sessionStorage.getItem('kaoj_admin_pin') || '';
        const { data, error } = await supabase.rpc('kaoj_admin_update_stock', {
          admin_pin: adminPin,
          prod_id: productId,
          var_name: variantName,
          stock_val: safeVal,
          is_delta: false
        });
        if (!error && data?.variants) {
          setProducts(products.map(p => p.id === productId ? { ...p, variants: data.variants } : p));
        }
      }

      // =======================================================================
      // 8. FILTRADO INTELIGENTE DE PRODUCTOS
      // =======================================================================
      const filteredProducts = useMemo(() => {
        let result = [...products];

        if (selectedSection === 'FAVORITOS') {
          result = result.filter(p => favorites.includes(p.id));
        } else if (selectedSection !== 'TODOS') {
          if (selectedSection === 'OFERTAS') {
            result = result.filter(p => Boolean(p.discount_price && p.discount_price < p.price));
          } else {
            result = result.filter(p => (p.section || '').toUpperCase() === selectedSection);
          }
        }

        if (selectedSubcategory !== 'TODOS' && selectedSection !== 'OFERTAS' && selectedSection !== 'FAVORITOS') {
          result = result.filter(p => (p.category || '').toLowerCase() === selectedSubcategory.toLowerCase());
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          result = result.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q) ||
            p.category?.toLowerCase().includes(q) ||
            p.section?.toLowerCase().includes(q)
          );
        }

        if (sortBy === 'precio_menor') {
          result.sort((a, b) => (a.discount_price || a.price) - (b.discount_price || b.price));
        } else if (sortBy === 'precio_mayor') {
          result.sort((a, b) => (b.discount_price || b.price) - (a.discount_price || a.price));
        } else if (sortBy === 'ofertas') {
          result.sort((a, b) => (b.discount_price ? 1 : 0) - (a.discount_price ? 1 : 0));
        }

        return result;
      }, [products, selectedSection, selectedSubcategory, searchQuery, sortBy, favorites]);

      // Métricas administrativas (excluyendo ventas canceladas)
      const metrics = useMemo(() => {
        const validOrders = orders.filter(o => o.status !== 'cancelado');
        const cancelledOrders = orders.filter(o => o.status === 'cancelado');
        const totalSales = validOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
        const pendingCount = validOrders.filter(o => o.status === 'pendiente').length;
        const activeOrdersCount = validOrders.length;
        const cancelledCount = cancelledOrders.length;
        const criticalStockCount = products.filter(p =>
          (p.variants || []).some(v => v.stock <= 2)
        ).length;

        const secCounts = { MAQUILLAJES: 0, ACCESORIOS: 0, ROPA: 0 };
        products.forEach(p => {
          const sec = (p.section || 'MAQUILLAJES').toUpperCase();
          if (secCounts[sec] !== undefined) secCounts[sec]++;
          else secCounts[sec] = 1;
        });

        return { totalSales, pendingCount, activeOrdersCount, cancelledCount, criticalStockCount, secCounts };
      }, [orders, products]);

      // =======================================================================
      // 9. RENDERIZADO VISUAL
      // =======================================================================
      return (
        <div className="min-h-screen flex flex-col bg-[#FAFAFC] text-zinc-900 overflow-x-hidden w-full max-w-full">

          {/* BARRA SUPERIOR CON ANUNCIO EN PASARELA Y SALDO VIP */}
          <div className="w-full overflow-hidden bg-zinc-900 text-zinc-200 text-xs py-2 px-3 sm:px-4 font-medium tracking-wider flex items-center justify-between gap-3 border-b border-zinc-800">
            <div className="min-w-0 flex-1 overflow-hidden relative flex items-center h-5">
              <div className="animate-marquee-pasarela flex items-center gap-8 text-[11px] sm:text-xs font-semibold text-zinc-100">
                <span className="flex items-center gap-2">
                  <span>{settings.banner_message}</span>
                  <span className="text-[#FF2E93] font-bold">•</span>
                  <span>✨ No es un gasto, es una inversión en ti | KAOJ STORE ✨</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-[#FF2E93] font-bold">•</span>
                  <span>{settings.banner_message}</span>
                  <span className="text-[#FF2E93] font-bold">•</span>
                  <span>✨ No es un gasto, es una inversión en ti | KAOJ STORE ✨</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 z-10 bg-zinc-900 pl-2">
              {customerProfile ? (
                <button
                  type="button"
                  onClick={() => setIsPointsModalOpen(true)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-[#FF2E93] text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-zinc-700 flex items-center gap-1 shrink-0 transition"
                  title="Ver cómo canjear mis Puntos Kaoj ($5 OFF cada 50 pts)"
                >
                  <Icon.Diamond className="w-3 h-3 text-[#FF2E93]" />
                  <span>VIP: {customerProfile.customer_code} • {customerProfile.points || 0} pts ($5 OFF c/50 pts)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsPointsModalOpen(true)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-zinc-700 flex items-center gap-1 shrink-0 transition"
                  title="Conoce el programa de Puntos Kaoj VIP"
                >
                  <Icon.Diamond className="w-3 h-3 text-[#FF2E93]" />
                  <span>💎 50 Puntos = $5.00 de Descuento</span>
                </button>
              )}
            </div>
          </div>

          {/* HEADER / NAVBAR PRINCIPAL */}
          <header className="bg-white/95 backdrop-blur-md border-b border-zinc-200/80 sticky top-0 z-30 w-full overflow-hidden">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">

              {/* LOGOTIPO OFICIAL KAOJ STORE */}
              {/* LOGOTIPO KAOJ STORE */}
              <div
                onClick={() => { setIsAdmin(false); setSelectedSection('TODOS'); setSelectedSubcategory('TODOS'); setSearchQuery(''); window.location.hash = '#/'; }}
                className="cursor-pointer select-none text-left group shrink-0"
                title="KAOJ STORE - Inicio"
              >
                <div className="flex flex-col items-start leading-none group-hover:scale-105 transition-transform">
                  <h1 className="font-serif-kaoj text-2xl sm:text-3xl font-black text-[#FF007F] tracking-widest leading-none">
                    KAOJ
                  </h1>
                  <span className="block text-[9px] sm:text-[10px] tracking-[0.45em] text-zinc-900 font-extrabold mt-0.5">
                    STORE
                  </span>
                </div>
              </div>

              {/* BUSCADOR DESKTOP */}
              {!isAdmin && (
                <div className="hidden md:flex flex-1 max-w-md mx-2 relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <Icon.Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar labial, gloss, blusa, vestido..."
                    className="w-full pl-10 pr-8 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-full focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF2E93] transition"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-zinc-400">
                      <Icon.Close className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* ACCIONES: BÚSQUEDA MÓVIL, RASTREO, GOOGLE AUTH & CARRITO */}
              <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">

                {/* BOTÓN BÚSQUEDA MÓVIL */}
                {!isAdmin && (
                  <button
                    onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                    className="md:hidden p-2 rounded-full border border-zinc-200 text-zinc-700 hover:text-[#FF2E93] transition"
                    title="Buscar"
                  >
                    <Icon.Search className="w-4 h-4" />
                  </button>
                )}

                {/* BOTÓN RASTREO DE PEDIDOS */}
                {!isAdmin && (
                  <button
                    onClick={() => { setIsTrackingOpen(true); window.location.hash = '#/pedidos'; }}
                    className="text-xs p-2 sm:px-3 sm:py-2 rounded-full border border-zinc-200 hover:border-[#FF2E93] hover:bg-pink-50/50 text-zinc-700 font-medium transition flex items-center gap-1.5"
                    title="Mis Pedidos y Calificaciones"
                  >
                    <Icon.Tag className="w-3.5 h-3.5 text-[#FF2E93]" />
                    <span className="hidden sm:inline">Mis Pedidos</span>
                  </button>
                )}

                {/* BOTÓN QUIÉNES SOMOS */}
                {!isAdmin && (
                  <button
                    onClick={() => {
                      window.location.hash = '#/quienes-somos';
                      document.getElementById('quienes-somos')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-xs p-2 sm:px-3 sm:py-2 rounded-full border border-zinc-200 hover:border-[#FF2E93] hover:bg-pink-50/50 text-zinc-700 font-medium transition hidden md:inline"
                    title="Conoce nuestra boutique"
                  >
                    Quiénes Somos
                  </button>
                )}

                {/* BOTÓN FAVORITOS EN NAVBAR */}
                {!isAdmin && (
                  <button
                    onClick={() => { setSelectedSection('FAVORITOS'); setSelectedSubcategory('TODOS'); window.location.hash = '#/favoritos'; }}
                    className={`text-xs p-2 sm:px-3 sm:py-2 rounded-full border transition flex items-center gap-1.5 ${
                      selectedSection === 'FAVORITOS'
                        ? 'border-[#FF2E93] bg-pink-50 text-[#FF2E93] font-bold'
                        : 'border-zinc-200 hover:border-[#FF2E93] hover:bg-pink-50/50 text-zinc-700 font-medium'
                    }`}
                    title="Mis Favoritos"
                  >
                    <Icon.Heart className="w-3.5 h-3.5 text-[#FF2E93]" filled={selectedSection === 'FAVORITOS' || favorites.length > 0} />
                    <span className="hidden sm:inline">Favoritos</span>
                    {favorites.length > 0 && (
                      <span className="text-[10px] bg-[#FF2E93] text-white px-1.5 py-0.2 rounded-full font-bold">
                        {favorites.length}
                      </span>
                    )}
                  </button>
                )}

                {/* GOOGLE SIGN IN O PERFIL PERMANENTE */}
                {!user ? (
                  <button
                    onClick={handleGoogleSignIn}
                    className="bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-300 text-xs p-2 sm:px-3 sm:py-2 rounded-full font-semibold flex items-center gap-1.5 shadow-2xs transition hover:border-[#FF2E93]"
                    title="Iniciar sesión"
                  >
                    <Icon.Google className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Ingresar</span>
                  </button>
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center gap-1.5 bg-pink-50/80 hover:bg-pink-100 border border-pink-200 p-1.5 sm:px-3 sm:py-1.5 rounded-full text-xs font-semibold text-zinc-800 transition"
                      title="Mi Perfil"
                    >
                      {user.user_metadata?.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="User" className="w-5 h-5 rounded-full border border-[#FF2E93]" />
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-[#FF2E93] text-white flex items-center justify-center text-[10px] font-bold">
                          {user.email?.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span className="max-w-[75px] truncate hidden sm:inline">
                        {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
                      </span>
                      {customerProfile?.customer_code && (
                        <span className="bg-[#FF2E93] text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold hidden sm:inline">
                          {customerProfile.customer_code}
                        </span>
                      )}
                    </button>

                    {/* MENÚ DESPLEGABLE DE PERFIL */}
                    {isProfileOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-zinc-200 p-4 z-50 text-xs space-y-3">
                        <div className="border-b pb-2">
                          <p className="font-bold text-zinc-900 truncate">{user.user_metadata?.full_name || 'Clienta Kaoj'}</p>
                          <p className="text-zinc-500 truncate text-[11px]">{user.email}</p>
                          {customerProfile && (
                            <div className="mt-2 bg-pink-50 border border-pink-200 text-[#FF2E93] rounded-lg p-2 text-center font-bold">
                              Código: {customerProfile.customer_code} • {customerProfile.points || 0} Puntos
                            </div>
                          )}
                        </div>
                        <div className="space-y-1.5 text-zinc-600">
                          <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
                            <Icon.Check className="w-3.5 h-3.5" /> Carrito sincronizado en la nube
                          </p>
                          <button
                            onClick={() => { setIsProfileOpen(false); setIsTrackingOpen(true); window.location.hash = '#/pedidos'; }}
                            className="w-full text-left py-1 hover:text-[#FF2E93] font-medium"
                          >
                            Mis Pedidos y Calificaciones
                          </button>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full bg-zinc-100 hover:bg-red-50 hover:text-red-600 text-zinc-700 py-2 rounded-xl font-bold transition text-center"
                        >
                          Cerrar Sesión
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* BOTÓN CARRITO */}
                <button
                  onClick={() => { setIsCartOpen(true); window.location.hash = '#/carrito'; }}
                  className="bg-[#FF2E93] hover:bg-[#e0157a] text-white px-2.5 sm:px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 sm:gap-2 shadow-sm transition active:scale-95 shrink-0"
                >
                  <Icon.Bag className="w-4 h-4" />
                  <span className="hidden sm:inline">Carrito</span>
                  <span className="bg-white text-[#FF2E93] text-xs font-black rounded-full px-1.5 sm:px-2 py-0.5">
                    {cart.reduce((a, b) => a + b.qty, 0)}
                  </span>
                </button>
              </div>
            </div>

            {/* BARRA DE BÚSQUEDA MÓVIL DESPLEGABLE */}
            {mobileSearchOpen && !isAdmin && (
              <div className="md:hidden border-t border-zinc-100 px-4 py-2 bg-zinc-50">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                    <Icon.Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar labiales, vestidos, accesorios..."
                    className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-zinc-200 rounded-full outline-none focus:ring-1 focus:ring-[#FF2E93]"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-zinc-400">
                      <Icon.Close className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* SECCIONES GRANDES ESTILO LIVELARQ (PILLS MINIMALISTAS) */}
            {!isAdmin && (
              <div className="border-t border-zinc-100 bg-white w-full max-w-full overflow-hidden">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar scroll-smooth">
                  <div className="flex gap-1.5 sm:gap-2 shrink-0">
                    <button
                      onClick={() => { setSelectedSection('TODOS'); setSelectedSubcategory('TODOS'); window.location.hash = '#/'; }}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide whitespace-nowrap transition-all ${
                        selectedSection === 'TODOS'
                          ? 'bg-[#151E28] text-white shadow-2xs'
                          : 'bg-[#F5F6F8] text-zinc-600 hover:bg-zinc-200/70 hover:text-zinc-900'
                      }`}
                    >
                      Todo
                    </button>

                    {Object.keys(sectionsConfig).map(sectionKey => {
                      const isSelected = selectedSection === sectionKey;
                      return (
                        <button
                          key={sectionKey}
                          onClick={() => {
                            setSelectedSection(sectionKey);
                            setSelectedSubcategory('TODOS');
                            window.location.hash = `#/seccion/${encodeURIComponent(sectionKey)}`;
                          }}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide whitespace-nowrap transition-all ${
                            isSelected
                              ? 'bg-[#151E28] text-white shadow-2xs'
                              : 'bg-[#F5F6F8] text-zinc-600 hover:bg-zinc-200/70 hover:text-zinc-900'
                          }`}
                        >
                          {sectionKey.charAt(0) + sectionKey.slice(1).toLowerCase()}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => { setSelectedSection('OFERTAS'); setSelectedSubcategory('TODOS'); window.location.hash = '#/seccion/OFERTAS'; }}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide whitespace-nowrap transition-all ${
                        selectedSection === 'OFERTAS'
                          ? 'bg-[#FF2E93] text-white shadow-2xs'
                          : 'bg-[#F5F6F8] text-[#FF2E93] hover:bg-pink-50'
                      }`}
                    >
                      Ofertas
                    </button>

                    <button
                      onClick={() => { setSelectedSection('FAVORITOS'); setSelectedSubcategory('TODOS'); window.location.hash = '#/favoritos'; }}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        selectedSection === 'FAVORITOS'
                          ? 'bg-[#151E28] text-white shadow-2xs'
                          : 'bg-[#F5F6F8] text-zinc-700 hover:bg-zinc-200/70'
                      }`}
                    >
                      <Icon.Heart className="w-3.5 h-3.5 text-[#FF2E93]" filled={selectedSection === 'FAVORITOS' || favorites.length > 0} />
                      <span>Favoritos</span>
                      {favorites.length > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                          selectedSection === 'FAVORITOS' ? 'bg-white text-[#151E28]' : 'bg-white text-[#FF2E93]'
                        }`}>
                          {favorites.length}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* SELECTOR DE ORDENACIÓN MINIMALISTA */}
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 whitespace-nowrap shrink-0">
                    <span className="hidden sm:inline font-medium">Ordenar:</span>
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value)}
                      className="bg-[#F5F6F8] border-0 rounded-full py-1.5 px-3 text-xs font-semibold text-zinc-800 outline-none cursor-pointer hover:bg-zinc-200/60 transition"
                    >
                      <option value="destacados">Destacados</option>
                      <option value="precio_menor">Menor precio</option>
                      <option value="precio_mayor">Mayor precio</option>
                      <option value="ofertas">En oferta</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* SUBCATEGORÍAS DINÁMICAS LIMPIAS */}
            {!isAdmin && selectedSection !== 'TODOS' && selectedSection !== 'OFERTAS' && selectedSection !== 'FAVORITOS' && (
              <div className="border-t border-zinc-100 bg-[#FAFAFC] py-2 w-full max-w-full overflow-hidden">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mr-1">
                    {selectedSection}:
                  </span>

                  <button
                    onClick={() => setSelectedSubcategory('TODOS')}
                    className={`px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                      selectedSubcategory === 'TODOS'
                        ? 'bg-[#151E28] text-white'
                        : 'bg-white text-zinc-600 border border-zinc-200/80 hover:border-zinc-400'
                    }`}
                  >
                    Todos
                  </button>

                  {(sectionsConfig[selectedSection] || []).map(subcat => (
                    <button
                      key={subcat}
                      onClick={() => setSelectedSubcategory(subcat)}
                      className={`px-3.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${
                        selectedSubcategory === subcat
                          ? 'bg-[#151E28] text-white font-bold'
                          : 'bg-white text-zinc-600 border border-zinc-200/80 hover:border-zinc-900'
                      }`}
                    >
                      {subcat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </header>

          {/* VISTA 1: TIENDA PÚBLICA (ESTÉTICA EDITORIAL INSPIRADA EN LIVELARQ) */}
          {!isAdmin ? (
            <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10 flex-1 w-full space-y-10 sm:space-y-14">

              {/* HERO EDITORIAL INSPIRADO EN LIVELARQ */}
              {selectedSection === 'TODOS' && !searchQuery && (
                <div className="relative overflow-hidden rounded-[28px] bg-[#F5F6F8] border border-zinc-200/60 p-6 sm:p-12 lg:p-14">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                    <div className="lg:col-span-7 space-y-5">
                      <div className="inline-flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full text-[11px] font-bold text-[#151E28] tracking-wide shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-[#FF2E93]"></span>
                        <span>EDICIÓN BOUTIQUE • ALTA COSMÉTICA & MODA</span>
                      </div>

                      <h2 className="font-serif-kaoj text-3xl sm:text-5xl lg:text-[54px] font-bold text-[#151E28] tracking-tight leading-[1.08]">
                        Esenciales de belleza y estilo para tu ritual diario.
                      </h2>

                      <p className="text-zinc-600 text-xs sm:text-base leading-relaxed max-w-xl font-normal">
                        Fórmulas auténticas, tonos en tendencia y prendas versátiles seleccionadas con cuidado. Recibe en Manta, Portoviejo o en cualquier ciudad del Ecuador.
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <button
                          onClick={() => { setSelectedSection('ROPA'); setSelectedSubcategory('TODOS'); window.location.hash = '#/seccion/ROPA'; }}
                          className="bg-[#151E28] hover:bg-black text-white px-6 py-3 rounded-full text-xs sm:text-sm font-bold transition flex items-center gap-2 active:scale-95"
                        >
                          <span>Explorar Ropa</span>
                          <Icon.ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setSelectedSection('MAQUILLAJES'); setSelectedSubcategory('TODOS'); window.location.hash = '#/seccion/MAQUILLAJES'; }}
                          className="bg-white hover:bg-zinc-100 text-[#151E28] border border-zinc-300/80 px-6 py-3 rounded-full text-xs sm:text-sm font-bold transition active:scale-95"
                        >
                          Ver Maquillaje
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsPointsModalOpen(true)}
                          className="text-xs font-bold text-zinc-600 hover:text-[#FF2E93] px-3 py-2 flex items-center gap-1.5 transition"
                        >
                          <Icon.Diamond className="w-4 h-4 text-[#FF2E93]" />
                          <span>50 Puntos = $5.00 OFF</span>
                        </button>
                      </div>
                    </div>

                    {/* TARJETA VISUAL EDITORIAL DERECHA */}
                    <div className="lg:col-span-5 grid grid-cols-2 gap-3">
                      <div
                        onClick={() => { setSelectedSection('ROPA'); setSelectedSubcategory('TODOS'); window.location.hash = '#/seccion/ROPA'; }}
                        className="group cursor-pointer bg-white rounded-3xl p-4 border border-zinc-200/60 flex flex-col justify-between aspect-[4/5] overflow-hidden relative shadow-2xs hover:shadow-md transition"
                      >
                        <div className="z-10">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block">Colección</span>
                          <p className="font-serif-kaoj text-lg font-bold text-[#151E28]">Moda Chic</p>
                        </div>
                        <img
                          src={products.find(p => p.section === 'ROPA')?.image || 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=80'}
                          alt="Moda"
                          className="w-full h-36 sm:h-44 object-contain my-auto group-hover:scale-105 transition duration-500"
                        />
                        <span className="text-[11px] font-bold text-[#151E28] group-hover:text-[#FF2E93] flex items-center gap-1">
                          <span>Ver prendas</span>
                          <Icon.ChevronRight className="w-3 h-3" />
                        </span>
                      </div>

                      <div
                        onClick={() => { setSelectedSection('MAQUILLAJES'); setSelectedSubcategory('TODOS'); window.location.hash = '#/seccion/MAQUILLAJES'; }}
                        className="group cursor-pointer bg-white rounded-3xl p-4 border border-zinc-200/60 flex flex-col justify-between aspect-[4/5] overflow-hidden relative shadow-2xs hover:shadow-md transition"
                      >
                        <div className="z-10">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block">Tendencia</span>
                          <p className="font-serif-kaoj text-lg font-bold text-[#151E28]">Cosmética</p>
                        </div>
                        <img
                          src={products.find(p => p.section === 'MAQUILLAJES')?.image || 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600'}
                          alt="Cosmética"
                          className="w-full h-36 sm:h-44 object-contain my-auto group-hover:scale-105 transition duration-500"
                        />
                        <span className="text-[11px] font-bold text-[#151E28] group-hover:text-[#FF2E93] flex items-center gap-1">
                          <span>Ver tonos</span>
                          <Icon.ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* VALUE PROPS MINIMALISTAS ESTILO LIVELARQ */}
                  <div className="mt-8 pt-6 border-t border-zinc-200/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white text-[#151E28] border border-zinc-200/80 flex items-center justify-center shrink-0">
                        <Icon.Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-[#151E28] leading-tight text-xs">Envíos a Todo Ecuador</p>
                        <p className="text-[11px] text-zinc-500">Retiro, Domicilio, Coop. y Servientrega</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPointsModalOpen(true)}
                      className="flex items-center gap-3 text-left hover:opacity-80 transition"
                    >
                      <div className="w-9 h-9 rounded-full bg-white text-[#FF2E93] border border-zinc-200/80 flex items-center justify-center shrink-0">
                        <Icon.Diamond className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-[#151E28] leading-tight text-xs">Kaoj Points VIP</p>
                        <p className="text-[11px] text-[#FF2E93] font-semibold">Cada 50 pts = $5.00 OFF</p>
                      </div>
                    </button>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white text-[#151E28] border border-zinc-200/80 flex items-center justify-center shrink-0">
                        <Icon.Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-[#151E28] leading-tight text-xs">Pago Seguro Sin Ruido</p>
                        <p className="text-[11px] text-zinc-500">Deuna, Bancos y Payphone</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white text-emerald-700 border border-zinc-200/80 flex items-center justify-center shrink-0">
                        <Icon.WhatsApp className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-[#151E28] leading-tight text-xs">Atención Personal</p>
                        <p className="text-[11px] text-zinc-500">Asesoría directa en línea</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ENCABEZADO DE CATÁLOGO ESTILO LIVELARQ */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 block">
                    KAOJ PRODUCTS
                  </span>
                  <h2 className="font-serif-kaoj text-2xl sm:text-4xl font-bold text-[#151E28] flex items-center gap-2 mt-0.5">
                    <span>{selectedSection === 'TODOS' ? 'Catálogo Completo' : selectedSection}</span>
                    {selectedSubcategory !== 'TODOS' && (
                      <span className="text-zinc-400 font-normal text-xl sm:text-2xl">
                        / <span className="text-[#151E28] font-semibold">{selectedSubcategory}</span>
                      </span>
                    )}
                  </h2>
                </div>
                <p className="text-xs text-zinc-500 font-medium">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'producto disponible' : 'productos disponibles'}
                </p>
              </div>

              {/* GRID DE PRODUCTOS INSPIRADO EN LIVELARQ (Pedestal gris estudio #F5F6F8 + Tipografía limpia) */}
              {filteredProducts.length === 0 ? (
                <div className="bg-[#F5F6F8] rounded-[28px] p-12 text-center space-y-3">
                  {selectedSection === 'FAVORITOS' ? (
                    <>
                      <div className="w-14 h-14 rounded-full bg-white text-[#FF2E93] flex items-center justify-center mx-auto shadow-2xs">
                        <Icon.Heart className="w-7 h-7" filled={true} />
                      </div>
                      <p className="font-bold text-[#151E28] text-sm">Aún no tienes productos guardados en Favoritos.</p>
                      <p className="text-xs text-zinc-500 max-w-sm mx-auto">Toca el corazón en los productos que más te gusten para guardarlos aquí.</p>
                      <button
                        onClick={() => { setSelectedSection('TODOS'); setSelectedSubcategory('TODOS'); window.location.hash = '#/'; }}
                        className="text-xs bg-[#151E28] text-white font-bold px-6 py-2.5 rounded-full transition"
                      >
                        Explorar Catálogo
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-[#151E28] text-sm">No encontramos productos en esta sección o búsqueda.</p>
                      <button
                        onClick={() => { setSelectedSection('TODOS'); setSelectedSubcategory('TODOS'); setSearchQuery(''); window.location.hash = '#/'; }}
                        className="text-xs bg-[#151E28] text-white font-bold px-5 py-2.5 rounded-full"
                      >
                        Ver Todo el Catálogo
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-7">
                  {filteredProducts.map(prod => {
                    const activeVar = activeVariants[prod.id] || {};
                    const hasColorAndSize = (prod.variants || []).some(v => v.color && v.size);
                    const distinctColors = hasColorAndSize ? Array.from(new Set(prod.variants.map(v => v.color).filter(Boolean))) : [];
                    const distinctSizes = hasColorAndSize ? Array.from(new Set(prod.variants.map(v => v.size).filter(Boolean))) : [];

                    const currentColor = hasColorAndSize
                      ? (activeVar.color || (distinctColors.find(c => (prod.variants || []).some(v => v.color === c && v.stock > 0))) || distinctColors[0])
                      : null;

                    const currentSize = hasColorAndSize
                      ? (activeVar.size || (distinctSizes.find(s => (prod.variants || []).some(v => v.color === currentColor && v.size === s && v.stock > 0))) || distinctSizes[0])
                      : null;

                    const varObj = hasColorAndSize
                      ? ((prod.variants || []).find(v => v.color === currentColor && v.size === currentSize) ||
                         (prod.variants || []).find(v => v.color === currentColor) ||
                         prod.variants?.[0])
                      : ((prod.variants || []).find(v => v.name === (activeVar.variantName || prod.variants?.[0]?.name)) || prod.variants?.[0]);

                    const currentVarName = varObj ? varObj.name : (prod.variants?.[0]?.name || 'Único');
                    const stock = varObj ? (varObj.stock || 0) : 0;
                    const isAllOutOfStock = (prod.variants || []).every(v => (v.stock || 0) <= 0);
                    const hasLowStockVariant = (prod.variants || []).some(v => v.stock > 0 && v.stock <= 2);
                    const hasDiscount = Boolean(prod.discount_price && Number(prod.discount_price) < Number(prod.price));
                    const discountPercent = hasDiscount ? Math.round(((prod.price - prod.discount_price) / prod.price) * 100) : 0;
                    const displayImage = activeVar.image || varObj?.image || (hasColorAndSize ? prod.variants?.find(v => v.color === currentColor && v.image)?.image : null) || prod.image;
                    const cardImages = getProductImages(prod);

                    return (
                      <div key={prod.id} className="flex flex-col group">
                        {/* PEDESTAL DE PRODUCTO ESTILO LIVELARQ (#F5F6F8) */}
                        <div
                          className="relative aspect-[4/5] bg-[#F5F6F8] rounded-[24px] overflow-hidden cursor-pointer flex items-center justify-center p-3 sm:p-5 transition-all duration-300 group-hover:bg-[#ECEEF2]"
                          onClick={() => {
                            setQuickViewProduct(prod);
                            setQuickViewSelectedVar(currentVarName);
                            setQuickViewActiveImageIndex(0);
                            window.location.hash = `#/producto/${prod.id}`;
                          }}
                        >
                          <img
                            src={displayImage || 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600'}
                            alt={prod.name}
                            className={`w-full h-full object-contain group-hover:scale-105 transition duration-500 ease-out ${isAllOutOfStock ? 'grayscale opacity-70' : ''}`}
                            loading="lazy"
                          />

                          {/* BADGES MINIMALISTAS SUPERIORES IZQUIERDOS */}
                          <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                            {hasDiscount ? (
                              <span className="bg-[#FF2E93] text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide">
                                -{discountPercent}%
                              </span>
                            ) : (
                              <span className="bg-white/95 text-[#151E28] px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase shadow-2xs">
                                {prod.category || prod.section}
                              </span>
                            )}
                          </div>

                          {/* BOTONES FLOTANTES SUTILES: FAVORITO Y COMPARTIR */}
                          <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                toggleFavorite(prod.id, prod.name);
                              }}
                              className="w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-2xs transition active:scale-90"
                              title={favorites.includes(prod.id) ? "Quitar de favoritos" : "Guardar en favoritos"}
                            >
                              <Icon.Heart className="w-3.5 h-3.5 text-[#151E28]" filled={favorites.includes(prod.id)} />
                            </button>
                          </div>

                          {/* INDICADOR DE MÚLTIPLES FOTOS */}
                          {cardImages.length > 1 && (
                            <span className="absolute bottom-3 right-3 bg-white/90 text-[#151E28] text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow-2xs">
                              {cardImages.length} fotos
                            </span>
                          )}

                          {/* OVERLAY DE AGOTADO O POCAS UNIDADES */}
                          {isAllOutOfStock ? (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                              <span className="bg-[#151E28] text-white px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase">
                                Agotado
                              </span>
                            </div>
                          ) : hasLowStockVariant ? (
                            <span className="absolute bottom-3 left-3 bg-white/95 text-amber-800 font-bold text-[10px] px-2.5 py-0.5 rounded-full shadow-2xs z-10">
                              Últimas unidades
                            </span>
                          ) : null}
                        </div>

                        {/* INFORMACIÓN EDITORIAL DEBAJO DEL PEDESTAL (ESTILO LIVELARQ) */}
                        <div className="pt-3.5 px-1 flex-1 flex flex-col justify-between space-y-2.5">
                          <div className="space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <h4
                                onClick={() => {
                                  setQuickViewProduct(prod);
                                  setQuickViewSelectedVar(currentVarName);
                                  setQuickViewActiveImageIndex(0);
                                  window.location.hash = `#/producto/${prod.id}`;
                                }}
                                className="font-bold text-[#151E28] hover:text-[#FF2E93] transition line-clamp-1 text-xs sm:text-sm cursor-pointer"
                              >
                                {prod.name}
                              </h4>
                            </div>

                            <p className="text-[11px] text-zinc-500 truncate">
                              {prod.section} • {prod.category}
                            </p>

                            {/* SELECTOR DE VARIANTES MINIMALISTA */}
                            {hasColorAndSize ? (
                              <div className="pt-1 space-y-1.5">
                                {/* Colores */}
                                <div className="flex flex-wrap gap-1 max-h-14 overflow-y-auto no-scrollbar">
                                  {distinctColors.map(c => {
                                    const colorVar = (prod.variants || []).find(v => v.color === c);
                                    const isColActive = currentColor === c;
                                    const colorStock = (prod.variants || []).filter(v => v.color === c).reduce((sum, v) => sum + (v.stock || 0), 0);
                                    return (
                                      <button
                                        key={c}
                                        type="button"
                                        disabled={colorStock <= 0}
                                        onClick={() => {
                                          const matchedVar = (prod.variants || []).find(v => v.color === c && v.size === currentSize && v.stock > 0) ||
                                                            (prod.variants || []).find(v => v.color === c && v.stock > 0) ||
                                                            (prod.variants || []).find(v => v.color === c);
                                          const nextSize = matchedVar ? matchedVar.size : currentSize;
                                          const nextName = matchedVar ? matchedVar.name : `${c} - ${nextSize}`;
                                          setActiveVariants({
                                            ...activeVariants,
                                            [prod.id]: {
                                              color: c,
                                              size: nextSize,
                                              variantName: nextName,
                                              image: matchedVar?.image || colorVar?.image || prod.image
                                            }
                                          });
                                        }}
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition border ${
                                          isColActive
                                            ? 'border-[#151E28] bg-[#151E28] text-white'
                                            : colorStock <= 0
                                            ? 'border-zinc-200 bg-zinc-50 text-zinc-300 line-through cursor-not-allowed'
                                            : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400'
                                        }`}
                                      >
                                        {c}
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Tallas si hay más de 1 o diferente de Única */}
                                {(distinctSizes.length > 1 || (distinctSizes[0] && distinctSizes[0] !== 'Única')) && (
                                  <div className="flex flex-wrap gap-1">
                                    {distinctSizes.map(s => {
                                      const combVar = (prod.variants || []).find(v => v.color === currentColor && v.size === s);
                                      const combStock = combVar ? (combVar.stock || 0) : 0;
                                      const isSizeActive = currentSize === s;
                                      return (
                                        <button
                                          key={s}
                                          type="button"
                                          disabled={combStock <= 0}
                                          onClick={() => {
                                            const varName = combVar ? combVar.name : `${currentColor} - ${s}`;
                                            setActiveVariants({
                                              ...activeVariants,
                                              [prod.id]: {
                                                color: currentColor,
                                                size: s,
                                                variantName: varName,
                                                image: combVar?.image || prod.image
                                              }
                                            });
                                          }}
                                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition ${
                                            isSizeActive
                                              ? 'border-[#FF2E93] bg-pink-50 text-[#FF2E93]'
                                              : combStock <= 0
                                              ? 'border-zinc-100 text-zinc-300 line-through cursor-not-allowed'
                                              : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'
                                          }`}
                                        >
                                          {s}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="pt-1 flex flex-wrap gap-1 max-h-14 overflow-y-auto no-scrollbar">
                                {(prod.variants || []).map(v => (
                                  <button
                                    key={v.name}
                                    disabled={v.stock <= 0}
                                    onClick={() => {
                                      setActiveVariants({
                                        ...activeVariants,
                                        [prod.id]: { variantName: v.name, image: v.image || prod.image }
                                      });
                                    }}
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition border ${
                                      currentVarName === v.name
                                        ? 'border-[#151E28] bg-[#151E28] text-white'
                                        : v.stock <= 0
                                        ? 'border-zinc-200 bg-zinc-50 text-zinc-300 line-through cursor-not-allowed'
                                        : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400'
                                    }`}
                                  >
                                    {v.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* PRECIO Y BOTÓN ESTILO LIVELARQ */}
                          <div className="pt-2 flex items-center justify-between gap-2 border-t border-zinc-100">
                            <div className="flex items-baseline gap-1.5">
                              {hasDiscount ? (
                                <>
                                  <span className="text-sm sm:text-base font-extrabold text-[#151E28]">${Number(prod.discount_price).toFixed(2)}</span>
                                  <span className="text-[11px] line-through text-zinc-400">${Number(prod.price).toFixed(2)}</span>
                                </>
                              ) : (
                                <span className="text-sm sm:text-base font-extrabold text-[#151E28]">${Number(prod.price).toFixed(2)}</span>
                              )}
                            </div>

                            <button
                              disabled={stock <= 0}
                              onClick={() => addToCart(prod, currentVarName, false)}
                              className={`px-3.5 py-2 rounded-full font-bold text-[11px] transition flex items-center gap-1.5 ${
                                stock <= 0
                                  ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                                  : 'bg-[#151E28] hover:bg-[#FF2E93] text-white active:scale-95'
                              }`}
                            >
                              <Icon.Plus className="w-3 h-3" />
                              <span>{stock <= 0 ? 'Agotado' : 'Añadir'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* SECCIÓN EDITABLE: QUIÉNES SOMOS (BOUTIQUE KAOJ) */}
              <section id="quienes-somos" className="bg-gradient-to-br from-pink-50/70 via-white to-purple-50/50 rounded-3xl border border-pink-100 p-6 sm:p-10 shadow-xs space-y-8 scroll-mt-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  {/* COLUMNA 1: HISTORIA, MISIÓN Y VALORES */}
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 bg-pink-100/90 text-[#FF2E93] px-3.5 py-1 rounded-full text-xs font-bold tracking-wide">
                      <span>✨</span>
                      <span>{settings.about_us?.badge || 'Boutique Ecuatoriana Oficial'}</span>
                    </div>

                    <h3 className="font-serif-kaoj text-2xl sm:text-4xl font-black text-zinc-900 leading-tight">
                      {settings.about_us?.title || 'Sobre KAOJ STORE Boutique'}
                    </h3>

                    <p className="text-zinc-600 text-xs sm:text-sm leading-relaxed">
                      {settings.about_us?.story || 'Somos una boutique ecuatoriana apasionada por realzar la belleza, el glamour y el estilo de cada mujer con productos 100% auténticos de alta cosmética, tonos virales, accesorios en tendencia y moda chic.'}
                    </p>

                    {settings.about_us?.mission && (
                      <div className="border-l-3 border-[#FF2E93] pl-4 py-1.5 italic text-zinc-700 text-xs sm:text-sm bg-white/70 rounded-r-xl border border-pink-100 shadow-2xs">
                        "{settings.about_us.mission}"
                      </div>
                    )}

                    {/* VALORES DE LA TIENDA */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="bg-white/80 border border-pink-100/80 rounded-2xl p-3 space-y-1 shadow-2xs">
                        <p className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                          <span className="text-[#FF2E93]">💖</span> 100% Auténtico
                        </p>
                        <p className="text-[11px] text-zinc-500">Garantía de calidad en cosmética y accesorios.</p>
                      </div>
                      <div className="bg-white/80 border border-pink-100/80 rounded-2xl p-3 space-y-1 shadow-2xs">
                        <p className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                          <span className="text-[#FF2E93]">🚚</span> Todo el Ecuador
                        </p>
                        <p className="text-[11px] text-zinc-500">Por Cooperativa o Servientrega seguro.</p>
                      </div>
                      <div className="bg-white/80 border border-pink-100/80 rounded-2xl p-3 space-y-1 shadow-2xs">
                        <p className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                          <span className="text-[#FF2E93]">💬</span> Atención VIP
                        </p>
                        <p className="text-[11px] text-zinc-500">Asesoría directa y personal por WhatsApp.</p>
                      </div>
                      <div className="bg-white/80 border border-pink-100/80 rounded-2xl p-3 space-y-1 shadow-2xs">
                        <p className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                          <span className="text-[#FF2E93]">💎</span> Puntos & Premios
                        </p>
                        <p className="text-[11px] text-zinc-500">Acumula puntos y canjea $5 en compras.</p>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-3">
                      <a
                        href={`https://wa.me/${formatWhatsAppPhone(settings.whatsapp_number)}?text=${encodeURIComponent('Hola Kaoj Store, leí su sección Quiénes Somos y quisiera consultarles sobre su boutique!')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 bg-[#FF2E93] hover:bg-[#e0157a] text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-md transition active:scale-95"
                      >
                        <Icon.WhatsApp className="w-4 h-4 text-white" />
                        <span>Conversar por WhatsApp ({formatDisplayPhone(settings.whatsapp_number)})</span>
                      </a>
                    </div>
                  </div>

                  {/* COLUMNA 2: FOTO DE LA BOUTIQUE */}
                  <div className="relative">
                    <div className="relative rounded-3xl overflow-hidden shadow-xl border-4 border-white aspect-4/3 sm:aspect-16/10">
                      <img
                        src={settings.about_us?.image || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800'}
                        alt="Boutique Kaoj Store"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4 sm:p-6">
                        <div className="text-white">
                          <p className="font-serif-kaoj text-lg sm:text-xl font-bold">KAOJ STORE BOUTIQUE</p>
                          <p className="text-[11px] text-pink-200">Manabí • Envíos a todo el Ecuador</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* SECCIÓN: MURO DE RESEÑAS Y SOCIAL PROOF */}
              <section className="bg-white rounded-3xl border border-zinc-200/90 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-100 pb-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-amber-500">
                      {[1, 2, 3, 4, 5].map(s => <Icon.Star key={s} className="w-4 h-4" filled={true} />)}
                      <span className="text-xs font-extrabold text-zinc-800 ml-1">5.0 / 5.0 Social Proof</span>
                    </div>
                    <h3 className="font-serif-kaoj text-2xl font-black text-zinc-900 mt-1">
                      Opiniones de Nuestras Clientas VIP
                    </h3>
                    <p className="text-xs text-zinc-500">Opiniones 100% reales de compras verificadas en Manabí y todo el Ecuador.</p>
                  </div>

                  <button
                    onClick={() => { setIsTrackingOpen(true); window.location.hash = '#/pedidos'; }}
                    className="bg-pink-50 hover:bg-[#FF2E93] text-[#FF2E93] hover:text-white border border-pink-200 hover:border-[#FF2E93] px-4 py-2.5 rounded-full text-xs font-bold transition flex items-center gap-2 shadow-2xs"
                  >
                    <Icon.Star className="w-4 h-4 text-amber-500" filled={true} />
                    <span>Calificar en Mis Pedidos</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {reviews.slice(0, 6).map(rev => (
                    <div key={rev.id} className="bg-zinc-50/70 rounded-2xl border border-zinc-200 p-4 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex gap-0.5 text-amber-500">
                            {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                              <Icon.Star key={i} className="w-3.5 h-3.5" filled={true} />
                            ))}
                          </div>
                          {rev.is_verified_buyer && (
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                              <Icon.Check className="w-3 h-3" /> Verificada
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-zinc-700 italic leading-relaxed">
                          "{rev.comment}"
                        </p>
                      </div>

                      <div className="flex items-center gap-3 pt-2 border-t border-zinc-200/60">
                        {rev.photo_url ? (
                          <img src={rev.photo_url} alt={rev.customer_name} className="w-10 h-10 rounded-full object-cover border-2 border-[#FF2E93]" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-pink-100 text-[#FF2E93] font-bold text-xs flex items-center justify-center">
                            {rev.customer_name?.charAt(0) || 'K'}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-zinc-900 text-xs">{rev.customer_name}</p>
                          <p className="text-[11px] text-zinc-500 truncate">{rev.product_name || 'Kaoj Boutique'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

            </main>
          ) : (
            /* =========================================================================
                VISTA 2: PANEL DE ADMINISTRADOR PRO (Métricas, Inventario, Secciones, Pedidos, Reseñas, Clientes y Ajustes)
                ========================================================================= */
            <main className="max-w-7xl mx-auto px-2.5 sm:px-6 py-4 sm:py-6 flex-1 w-full max-w-full min-w-0 overflow-x-hidden space-y-6">
              {/* HEADER ADMIN */}
              <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-zinc-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full min-w-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-zinc-900 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-wider uppercase">Panel Administrativo</span>
                    <h2 className="font-serif-kaoj text-2xl sm:text-3xl font-extrabold text-zinc-900">
                      KAOJ STORE
                    </h2>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">Control integral de inventario, analítica, despacho de órdenes y configuración global.</p>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-1 shrink-0">
                  <button onClick={() => { setAdminTab('metrics'); window.location.hash = '#/admin/metrics'; }} className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${adminTab === 'metrics' ? 'bg-[#FF2E93] text-white' : 'bg-zinc-100 text-zinc-700'}`}>
                    <Icon.TrendingUp className="w-4 h-4" /> Métricas
                  </button>
                  <button onClick={() => { setAdminTab('inventory'); window.location.hash = '#/admin/inventory'; }} className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${adminTab === 'inventory' ? 'bg-[#FF2E93] text-white' : 'bg-zinc-100 text-zinc-700'}`}>
                    <Icon.Box className="w-4 h-4" /> Inventario ({products.length})
                  </button>
                  <button onClick={() => { setAdminTab('sections'); window.location.hash = '#/admin/sections'; }} className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${adminTab === 'sections' ? 'bg-[#FF2E93] text-white' : 'bg-zinc-100 text-zinc-700'}`}>
                    <Icon.Tag className="w-4 h-4" /> Secciones
                  </button>
                  <button onClick={() => { setAdminTab('orders'); window.location.hash = '#/admin/orders'; }} className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${adminTab === 'orders' ? 'bg-[#FF2E93] text-white' : 'bg-zinc-100 text-zinc-700'}`}>
                    <Icon.Truck className="w-4 h-4" /> Pedidos ({orders.length})
                  </button>
                  <button onClick={() => { setAdminTab('reviews'); window.location.hash = '#/admin/reviews'; }} className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${adminTab === 'reviews' ? 'bg-[#FF2E93] text-white' : 'bg-zinc-100 text-zinc-700'}`}>
                    <Icon.Star className="w-4 h-4" filled={true} /> Reseñas ({reviews.length})
                  </button>
                  <button onClick={() => { setAdminTab('customers'); window.location.hash = '#/admin/customers'; }} className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${adminTab === 'customers' ? 'bg-[#FF2E93] text-white' : 'bg-zinc-100 text-zinc-700'}`}>
                    <Icon.User className="w-4 h-4" /> Clientes VIP ({customersList.length})
                  </button>
                  <button onClick={() => { setAdminTab('settings'); window.location.hash = '#/admin/settings'; }} className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${adminTab === 'settings' ? 'bg-[#FF2E93] text-white' : 'bg-zinc-100 text-zinc-700'}`}>
                    <Icon.Settings className="w-4 h-4" /> Ajustes
                  </button>
                  <button onClick={() => { sessionStorage.removeItem('kaoj_admin_authenticated'); setIsAdmin(false); window.location.hash = '#/'; }} className="px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-900 text-white hover:bg-black transition">
                    Ver Tienda
                  </button>
                </div>
              </div>

              {/* ADMIN TAB 1: MÉTRICAS Y GRÁFICAS */}
              {adminTab === 'metrics' && (
                <div className="space-y-6 w-full min-w-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-zinc-200 space-y-1">
                      <span className="text-xs text-zinc-500 font-medium">Ventas Realizadas</span>
                      <p className="text-2xl font-black text-zinc-900">${metrics.totalSales.toFixed(2)}</p>
                      <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                        <Icon.Check className="w-3 h-3" /> {metrics.activeOrdersCount} transacciones válidas
                      </span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-zinc-200 space-y-1">
                      <span className="text-xs text-zinc-500 font-medium">Pedidos Totales</span>
                      <p className="text-2xl font-black text-zinc-900">{metrics.activeOrdersCount}</p>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] text-[#FF2E93] font-bold">
                          {metrics.pendingCount} pendientes por verificar
                        </span>
                        {metrics.cancelledCount > 0 && (
                          <span className="text-[10px] text-zinc-400 font-medium">
                            ({metrics.cancelledCount} cancelados excluidos)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-zinc-200 space-y-1">
                      <span className="text-xs text-zinc-500 font-medium">Clientes VIP (Google)</span>
                      <p className="text-2xl font-black text-zinc-900">{customersList.length}</p>
                      <span className="text-[11px] text-zinc-500">Con código único permanente</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-zinc-200 space-y-1">
                      <span className="text-xs text-zinc-500 font-medium">Alertas de Stock Bajo</span>
                      <p className="text-2xl font-black text-amber-600">{metrics.criticalStockCount}</p>
                      <span className="text-[11px] text-amber-600 font-medium">Variantes con 2 o menos unidades</span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-zinc-200 space-y-4">
                      <h4 className="font-bold text-sm text-zinc-900">Distribución de Catálogo por Secciones</h4>
                      <div className="space-y-3 pt-2">
                        {Object.entries(metrics.secCounts).map(([sec, count]) => {
                          const percent = products.length > 0 ? Math.round((count / products.length) * 100) : 0;
                          return (
                            <div key={sec} className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold">
                                <span>{sec}</span>
                                <span>{count} productos ({percent}%)</span>
                              </div>
                              <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${sec === 'MAQUILLAJES' ? 'bg-[#FF2E93]' : sec === 'ACCESORIOS' ? 'bg-zinc-800' : 'bg-pink-400'}`}
                                  style={{ width: `${percent}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-zinc-200 space-y-4">
                      <h4 className="font-bold text-sm text-zinc-900">Estado de Órdenes y Entregas</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                        {['pendiente', 'verificado', 'en_camino', 'entregado', 'cancelado'].map(st => {
                          const count = orders.filter(o => o.status === st).length;
                          const isCancelled = st === 'cancelado';
                          return (
                            <div key={st} className={`border p-3 rounded-2xl ${isCancelled ? 'border-red-200 bg-red-50/70' : 'border-zinc-200 bg-zinc-50'}`}>
                              <span className={`text-[11px] uppercase font-bold tracking-wider block ${isCancelled ? 'text-red-600' : 'text-zinc-500'}`}>{st}</span>
                              <span className={`text-xl font-black ${isCancelled ? 'text-red-700' : 'text-zinc-900'}`}>{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ADMIN TAB 2: INVENTARIO ORGANIZADO Y ESCALABLE */}
              {adminTab === 'inventory' && (() => {
                const inventoryFiltered = products
                  .filter(p => {
                    if (adminInventorySection !== 'TODOS' && (p.section || '').toUpperCase() !== adminInventorySection) {
                      return false;
                    }
                    if (adminInventoryCategory !== 'TODOS' && (p.category || '').toLowerCase() !== adminInventoryCategory.toLowerCase()) {
                      return false;
                    }
                    const matchesSearch = !adminSearch ||
                      p.name.toLowerCase().includes(adminSearch.toLowerCase()) ||
                      (p.section || '').toLowerCase().includes(adminSearch.toLowerCase()) ||
                      (p.category || '').toLowerCase().includes(adminSearch.toLowerCase());
                    if (!matchesSearch) return false;

                    if (adminStockFilter === 'critico') {
                      return (p.variants || []).some(v => v.stock > 0 && v.stock <= 2);
                    }
                    if (adminStockFilter === 'agotados') {
                      return (p.variants || []).some(v => (v.stock || 0) <= 0);
                    }
                    return true;
                  })
                  .sort((a, b) => {
                    const stockA = (a.variants || []).reduce((acc, v) => acc + Number(v.stock || 0), 0);
                    const stockB = (b.variants || []).reduce((acc, v) => acc + Number(v.stock || 0), 0);
                    const priceA = Number(a.discount_price || a.price || 0);
                    const priceB = Number(b.discount_price || b.price || 0);

                    if (adminInventorySort === 'nombre_asc') return (a.name || '').localeCompare(b.name || '');
                    if (adminInventorySort === 'stock_asc') return stockA - stockB;
                    if (adminInventorySort === 'stock_desc') return stockB - stockA;
                    if (adminInventorySort === 'precio_asc') return priceA - priceB;
                    if (adminInventorySort === 'precio_desc') return priceB - priceA;
                    return Number(b.id || 0) - Number(a.id || 0);
                  });

                const allExpanded = inventoryFiltered.length > 0 && inventoryFiltered.every(p => expandedInventoryIds[p.id]);

                return (
                  <div className="space-y-5 w-full max-w-full min-w-0">

                    {/* BARRA SUPERIOR DE CONTROL DE INVENTARIO */}
                    <div className="bg-white p-4 sm:p-5 rounded-3xl border border-zinc-200 shadow-2xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
                        <div>
                          <h3 className="font-bold text-[#151E28] text-base sm:text-lg flex items-center gap-2">
                            <Icon.Box className="w-5 h-5 text-[#FF2E93]" />
                            <span>Centro de Control de Inventario</span>
                            <span className="text-xs bg-[#F5F6F8] text-zinc-700 px-2.5 py-0.5 rounded-full font-extrabold">
                              {inventoryFiltered.length} de {products.length} productos
                            </span>
                          </h3>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            Filtra por sección, subcategoría o nivel de stock. Despliega solo el producto que necesites ajustar.
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (allExpanded) {
                                setExpandedInventoryIds({});
                              } else {
                                const nextMap = {};
                                inventoryFiltered.forEach(p => { nextMap[p.id] = true; });
                                setExpandedInventoryIds(nextMap);
                              }
                            }}
                            className="px-3.5 py-2.5 rounded-full bg-[#F5F6F8] hover:bg-zinc-200/70 text-zinc-700 font-bold text-xs transition"
                          >
                            {allExpanded ? 'Contraer Variantes ▲' : 'Expandir Todos ▼'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const nextState = !showNewProductPanel;
                              if (nextState && adminInventorySection !== 'TODOS') {
                                handleNewProductSectionChange(adminInventorySection);
                              }
                              setShowNewProductPanel(nextState);
                            }}
                            className={`px-4 py-2.5 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-xs transition ${
                              showNewProductPanel
                                ? 'bg-zinc-900 text-white'
                                : 'bg-[#FF2E93] hover:bg-[#e0157a] text-white'
                            }`}
                          >
                            {showNewProductPanel ? (
                              <>
                                <Icon.Close className="w-3.5 h-3.5" />
                                <span>Cerrar Formulario</span>
                              </>
                            ) : (
                              <>
                                <Icon.Plus className="w-4 h-4" />
                                <span>Nuevo Producto</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* FILA 1: PESTAÑAS DE SECCIÓN (DEPARTAMENTOS) CON CONTADORES */}
                      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                        <button
                          type="button"
                          onClick={() => { setAdminInventorySection('TODOS'); setAdminInventoryCategory('TODOS'); }}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                            adminInventorySection === 'TODOS'
                              ? 'bg-[#151E28] text-white'
                              : 'bg-[#F5F6F8] text-zinc-600 hover:bg-zinc-200/70'
                          }`}
                        >
                          <span>Todas las Secciones</span>
                          <span className={`text-[10px] px-1.5 rounded-full font-black ${
                            adminInventorySection === 'TODOS' ? 'bg-white/20 text-white' : 'bg-white text-zinc-700'
                          }`}>
                            {products.length}
                          </span>
                        </button>

                        {Object.keys(sectionsConfig).map(sec => {
                          const count = products.filter(p => (p.section || '').toUpperCase() === sec).length;
                          const isSelected = adminInventorySection === sec;
                          return (
                            <button
                              key={sec}
                              type="button"
                              onClick={() => { setAdminInventorySection(sec); setAdminInventoryCategory('TODOS'); }}
                              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-[#151E28] text-white'
                                  : 'bg-[#F5F6F8] text-zinc-600 hover:bg-zinc-200/70'
                              }`}
                            >
                              <span>{sec}</span>
                              <span className={`text-[10px] px-1.5 rounded-full font-black ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-white text-zinc-700'
                              }`}>
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* FILA 2: BUSCADOR + SUBCATEGORÍA + ORDENAMIENTO */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 pt-1">
                        <div className="md:col-span-5 relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400">
                            <Icon.Search className="w-4 h-4" />
                          </span>
                          <input
                            type="text"
                            value={adminSearch}
                            onChange={e => setAdminSearch(e.target.value)}
                            placeholder="Buscar producto por nombre o categoría..."
                            className="w-full pl-9 pr-8 py-2 bg-[#F5F6F8] focus:bg-white border border-transparent focus:border-zinc-300 rounded-xl text-xs outline-none transition"
                          />
                          {adminSearch && (
                            <button
                              type="button"
                              onClick={() => setAdminSearch('')}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-700"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        <div className="md:col-span-3">
                          <select
                            value={adminInventoryCategory}
                            onChange={e => setAdminInventoryCategory(e.target.value)}
                            className="w-full bg-[#F5F6F8] border border-transparent focus:border-zinc-300 rounded-xl py-2 px-3 text-xs font-semibold text-zinc-700 outline-none"
                          >
                            <option value="TODOS">Todas las subcategorías</option>
                            {(adminInventorySection === 'TODOS'
                              ? Array.from(new Set(Object.values(sectionsConfig).flat()))
                              : (sectionsConfig[adminInventorySection] || [])
                            ).map(sub => (
                              <option key={sub} value={sub}>{sub}</option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-4">
                          <select
                            value={adminInventorySort}
                            onChange={e => setAdminInventorySort(e.target.value)}
                            className="w-full bg-[#F5F6F8] border border-transparent focus:border-zinc-300 rounded-xl py-2 px-3 text-xs font-semibold text-zinc-700 outline-none"
                          >
                            <option value="recientes">Ordenar: Más recientes primero</option>
                            <option value="nombre_asc">Ordenar: Nombre (A - Z)</option>
                            <option value="stock_asc">Ordenar: Menor Stock primero</option>
                            <option value="stock_desc">Ordenar: Mayor Stock primero</option>
                            <option value="precio_asc">Ordenar: Precio (Menor a Mayor)</option>
                            <option value="precio_desc">Ordenar: Precio (Mayor a Menor)</option>
                          </select>
                        </div>
                      </div>

                      {/* FILTROS RÁPIDOS DE SALUD DE STOCK */}
                      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-zinc-100">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 mr-1 shrink-0">Estado de Stock:</span>
                        <button
                          type="button"
                          onClick={() => setAdminStockFilter('todos')}
                          className={`px-3 py-1 rounded-full font-bold text-xs whitespace-nowrap transition ${
                            adminStockFilter === 'todos' ? 'bg-[#151E28] text-white' : 'bg-[#F5F6F8] text-zinc-600 hover:bg-zinc-200'
                          }`}
                        >
                          Todos ({products.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdminStockFilter('critico')}
                          className={`px-3 py-1 rounded-full font-bold text-xs whitespace-nowrap transition flex items-center gap-1.5 ${
                            adminStockFilter === 'critico' ? 'bg-amber-500 text-zinc-950 font-black' : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          <span>🔥 Stock Crítico (≤ 2)</span>
                          <span className="bg-amber-200 text-amber-900 px-1.5 rounded-full text-[10px] font-black">
                            {products.filter(p => (p.variants || []).some(v => v.stock > 0 && v.stock <= 2)).length}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdminStockFilter('agotados')}
                          className={`px-3 py-1 rounded-full font-bold text-xs whitespace-nowrap transition flex items-center gap-1.5 ${
                            adminStockFilter === 'agotados' ? 'bg-red-600 text-white font-black' : 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100'
                          }`}
                        >
                          <span>⚠️ Con Variantes Agotadas</span>
                          <span className="bg-red-200 text-red-900 px-1.5 rounded-full text-[10px] font-black">
                            {products.filter(p => (p.variants || []).some(v => (v.stock || 0) <= 0)).length}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* FORMULARIO AGREGAR PRODUCTO (DESPLEGABLE BAJO DEMANDA) */}
                    {showNewProductPanel && (
                      <div className="bg-white p-4 sm:p-6 rounded-3xl border-2 border-[#151E28] shadow-md space-y-4 w-full max-w-3xl mx-auto animate-in fade-in">
                        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                          <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                            <Icon.Plus className="w-4 h-4 text-[#FF2E93]" /> Agregar Nuevo Producto
                          </h3>
                          <button
                            type="button"
                            onClick={() => setShowNewProductPanel(false)}
                            className="text-xs text-zinc-400 hover:text-zinc-700 font-bold"
                          >
                            ✕ Cerrar
                          </button>
                        </div>

                        <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
                          <div>
                            <label className="font-semibold text-zinc-700 block mb-1">Nombre *</label>
                            <input required value={newProd.name} onChange={e => setNewProd({ ...newProd, name: e.target.value })} placeholder="Ej. Blusa Satinada / Lip Gloss Plumper" className="w-full border rounded-xl p-2.5 outline-none" />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="font-semibold text-zinc-700 block mb-1">Sección</label>
                              <select
                                value={newProd.section}
                                onChange={e => handleNewProductSectionChange(e.target.value)}
                                className="w-full border rounded-xl p-2.5 bg-white outline-none font-bold"
                              >
                                {Object.keys(sectionsConfig).map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="font-semibold text-zinc-700 block mb-1">Subcategoría</label>
                              <select
                                value={newProd.category}
                                onChange={e => setNewProd({ ...newProd, category: e.target.value })}
                                className="w-full border rounded-xl p-2.5 bg-white outline-none"
                              >
                                {(sectionsConfig[newProd.section] || []).map(sc => <option key={sc} value={sc}>{sc}</option>)}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="font-semibold text-zinc-700 block mb-1">Precio Normal ($) *</label>
                              <input required type="number" step="0.01" value={newProd.price} onChange={e => setNewProd({ ...newProd, price: e.target.value })} placeholder="0.00" className="w-full border rounded-xl p-2.5 outline-none" />
                            </div>
                            <div>
                              <label className="font-semibold text-zinc-700 block mb-1">Precio Oferta ($)</label>
                              <input type="number" step="0.01" value={newProd.discount_price} onChange={e => setNewProd({ ...newProd, discount_price: e.target.value })} placeholder="Opcional" className="w-full border rounded-xl p-2.5 outline-none" />
                            </div>
                          </div>

                          {/* GESTOR DE FOTOS MÚLTIPLES DEL PRODUCTO */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="font-semibold text-zinc-700 block text-xs">
                                Fotos del Producto ({(newProd.images?.length > 0 ? newProd.images : (newProd.image ? [newProd.image] : [])).length})
                              </label>
                              <span className="text-[10px] text-zinc-400">Puedes seleccionar varias fotos</span>
                            </div>

                            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3 space-y-2.5">
                              <div className="flex flex-wrap items-center gap-2.5">
                                {(newProd.images?.length > 0 ? newProd.images : (newProd.image ? [newProd.image] : [])).map((imgUrl, imgIdx) => (
                                  <div
                                    key={imgIdx}
                                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 bg-white flex items-center justify-center shadow-xs group transition ${
                                      imgIdx === 0 ? 'border-[#FF2E93] ring-2 ring-pink-100' : 'border-zinc-200 hover:border-zinc-300'
                                    }`}
                                  >
                                    <img src={imgUrl} alt={`Foto ${imgIdx + 1}`} className="w-full h-full object-contain p-0.5" />

                                    {imgIdx === 0 ? (
                                      <span className="absolute bottom-0 inset-x-0 bg-[#FF2E93] text-white text-[8px] font-black text-center py-0.5 tracking-wider uppercase">
                                        Principal
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const currentImages = [...(newProd.images?.length > 0 ? newProd.images : (newProd.image ? [newProd.image] : []))];
                                          const selected = currentImages.splice(imgIdx, 1)[0];
                                          const reordered = [selected, ...currentImages];
                                          setNewProd({ ...newProd, image: reordered[0], images: reordered });
                                          showToast('Foto establecida como Principal ✨');
                                        }}
                                        className="absolute bottom-0 inset-x-0 bg-black/60 hover:bg-[#FF2E93] text-white text-[8px] font-bold text-center py-0.5 opacity-0 group-hover:opacity-100 transition"
                                      >
                                        Hacer Principal
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => {
                                        const currentImages = (newProd.images?.length > 0 ? newProd.images : (newProd.image ? [newProd.image] : [])).filter((_, i) => i !== imgIdx);
                                        setNewProd({
                                          ...newProd,
                                          image: currentImages[0] || '',
                                          images: currentImages
                                        });
                                      }}
                                      className="absolute top-1 right-1 w-4 h-4 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold shadow-xs transition"
                                      title="Eliminar foto"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}

                                {/* Botón para Añadir Fotos */}
                                <label className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-dashed border-pink-300 hover:border-[#FF2E93] bg-pink-50/50 hover:bg-pink-50 flex flex-col items-center justify-center cursor-pointer text-[#FF2E93] transition group shrink-0">
                                  <Icon.Plus className="w-5 h-5 group-hover:scale-110 transition" />
                                  <span className="text-[9px] font-bold mt-1">+ Fotos</span>
                                  <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async e => {
                                      if (e.target.files && e.target.files.length > 0) {
                                        const files = Array.from(e.target.files);
                                        const current = [...(newProd.images?.length > 0 ? newProd.images : (newProd.image ? [newProd.image] : []))];
                                        for (let f of files) {
                                          const url = await uploadFileToSupabase(f, 'products');
                                          if (url && !current.includes(url)) current.push(url);
                                        }
                                        setNewProd({
                                          ...newProd,
                                          image: current[0] || '',
                                          images: current
                                        });
                                      }
                                    }}
                                  />
                                </label>
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-200/60">
                                <span>Puedes subir varias fotos (frente, detalle, modelo).</span>
                                <span>JPG, PNG, WEBP</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="font-semibold text-zinc-700 block mb-1">Descripción</label>
                            <textarea rows="2" value={newProd.description} onChange={e => setNewProd({ ...newProd, description: e.target.value })} placeholder="Detalles del producto..." className="w-full border rounded-xl p-2.5 outline-none resize-none"></textarea>
                          </div>

                          {/* SELECTOR DE MODALIDAD: TONOS SIMPLES vs TALLAS Y COLORES SEPARADOS */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="font-semibold text-zinc-700 block">Tipo de Variantes</label>
                              {(newProd.section || '').toUpperCase() === 'ROPA' && newProdVariantMode === 'color_size' && (
                                <span className="text-[10px] font-bold text-[#FF2E93] bg-pink-50 px-2 py-0.5 rounded-full">
                                  ✓ Tallas y Colores seleccionado automáticamente para Ropa
                                </span>
                              )}
                            </div>
                            <div className="flex rounded-xl bg-zinc-100 p-1 border border-zinc-200">
                              <button
                                type="button"
                                onClick={() => setNewProdVariantMode('simple')}
                            className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                              newProdVariantMode === 'simple'
                                ? 'bg-white text-zinc-900 shadow-2xs'
                                : 'text-zinc-500 hover:text-zinc-800'
                            }`}
                          >
                            <span>💅 Tonos / Simples</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewProdVariantMode('color_size')}
                            className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                              newProdVariantMode === 'color_size'
                                ? 'bg-[#FF2E93] text-white shadow-2xs'
                                : 'text-zinc-500 hover:text-zinc-800'
                            }`}
                          >
                            <span>👗 Tallas y Colores</span>
                          </button>
                        </div>
                      </div>

                      {newProdVariantMode === 'simple' ? (
                        /* GESTOR DE VARIANTES SIMPLES CON SUBIDA DE FOTO DESDE DISPOSITIVO */
                        <div className="border border-zinc-200 rounded-2xl p-3 bg-zinc-50/70 space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="font-bold text-zinc-800">Variantes con Foto Propia ({newProd.variants.length})</label>
                            <button
                              type="button"
                              onClick={() => setNewProd({
                                ...newProd,
                                variants: [...newProd.variants, { name: `Tono ${newProd.variants.length + 1}`, stock: 5, image: '' }]
                              })}
                              className="text-[#FF2E93] font-bold text-xs"
                            >
                              + Añadir Variante
                            </button>
                          </div>

                          <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar">
                            {newProd.variants.map((v, idx) => (
                              <div key={idx} className="bg-white border border-zinc-200 rounded-xl p-2.5 space-y-2 shadow-2xs">
                                <div className="flex gap-2 items-center">
                                  <input
                                    placeholder="Nombre (ej. 01 Rosa Nude / Talla M)"
                                    value={v.name}
                                    onChange={e => {
                                      const val = e.target.value;
                                      setNewProd({ ...newProd, variants: newProd.variants.map((item, i) => i === idx ? { ...item, name: val } : item) });
                                    }}
                                    className="flex-1 border rounded-lg p-1.5 text-xs font-semibold outline-none focus:border-[#FF2E93]"
                                  />
                                  <div className="flex items-center gap-1 shrink-0">
                                    <span className="text-[10px] text-zinc-400 font-bold">Stock:</span>
                                    <input
                                      type="number"
                                      value={v.stock}
                                      onChange={e => {
                                        const val = parseInt(e.target.value || '0', 10);
                                        setNewProd({ ...newProd, variants: newProd.variants.map((item, i) => i === idx ? { ...item, stock: val } : item) });
                                      }}
                                      className="w-14 border rounded-lg p-1.5 text-xs font-bold text-center outline-none focus:border-[#FF2E93]"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setNewProd({ ...newProd, variants: newProd.variants.filter((_, i) => i !== idx) });
                                    }}
                                    className="text-zinc-400 hover:text-red-500 font-bold p-1 rounded transition"
                                    title="Eliminar variante"
                                  >
                                    ✕
                                  </button>
                                </div>

                                {/* SUBIR FOTO DE VARIANTE DESDE DISPOSITIVO */}
                                <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-100">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {v.image ? (
                                      <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-zinc-200 shrink-0 bg-zinc-50 flex items-center justify-center">
                                        <img src={v.image} alt="" className="w-full h-full object-contain" />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setNewProd({ ...newProd, variants: newProd.variants.map((item, i) => i === idx ? { ...item, image: '' } : item) });
                                          }}
                                          className="absolute top-0 right-0 w-3.5 h-3.5 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[8px] font-bold"
                                          title="Quitar foto"
                                        >✕</button>
                                      </div>
                                    ) : (
                                      <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-dashed border-zinc-300 flex items-center justify-center text-zinc-400 shrink-0">
                                        <Icon.Photo className="w-4 h-4" />
                                      </div>
                                    )}

                                    <label className="cursor-pointer bg-zinc-50 hover:bg-pink-50 border border-zinc-200 hover:border-[#FF2E93] text-zinc-700 hover:text-[#FF2E93] px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 transition">
                                      <Icon.Photo className="w-3 h-3 text-[#FF2E93]" />
                                      <span>{v.image ? 'Cambiar foto' : 'Subir foto desde dispositivo'}</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={async e => {
                                          if (e.target.files[0]) {
                                            const url = await uploadFileToSupabase(e.target.files[0], 'products');
                                            if (url) {
                                              setNewProd({ ...newProd, variants: newProd.variants.map((item, i) => i === idx ? { ...item, image: url } : item) });
                                            }
                                          }
                                        }}
                                      />
                                    </label>
                                  </div>

                                  {v.image && (
                                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 shrink-0">
                                      <Icon.Check className="w-3 h-3" /> Foto lista
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        /* GESTOR DE TALLAS Y COLORES SEPARADOS */
                        <div className="border border-pink-200 bg-pink-50/20 rounded-2xl p-3.5 space-y-4">
                          {/* PASO 1: COLORES */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-[#FF2E93] text-white text-[10px] font-black flex items-center justify-center">1</span>
                                <label className="font-bold text-zinc-800 text-xs">Colores Disponibles ({newProdColors.length})</label>
                              </div>
                              <button
                                type="button"
                                onClick={() => setNewProdColors([...newProdColors, { name: `Color ${newProdColors.length + 1}`, image: '' }])}
                                className="text-[#FF2E93] hover:text-[#e0157a] font-bold text-xs flex items-center gap-0.5"
                              >
                                <Icon.Plus className="w-3.5 h-3.5" /> Añadir Color
                              </button>
                            </div>

                            {/* Sugerencias rápidas de colores */}
                            <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-[11px]">
                              <span className="text-zinc-400 text-[10px] shrink-0 font-medium">Sugeridos:</span>
                              {['Negro', 'Blanco', 'Beige', 'Palo de Rosa', 'Rojo', 'Azul', 'Verde', 'Café', 'Lila'].map(suggested => (
                                <button
                                  key={suggested}
                                  type="button"
                                  onClick={() => {
                                    if (!newProdColors.some(c => c.name.toLowerCase() === suggested.toLowerCase())) {
                                      setNewProdColors([...newProdColors, { name: suggested, image: '' }]);
                                    }
                                  }}
                                  className="px-2 py-0.5 rounded-full bg-white border border-zinc-200 text-zinc-700 hover:border-[#FF2E93] hover:text-[#FF2E93] shrink-0 font-medium"
                                >
                                  +{suggested}
                                </button>
                              ))}
                            </div>

                            {/* Lista de colores con foto de cada uno */}
                            <div className="space-y-2 max-h-52 overflow-y-auto no-scrollbar">
                              {newProdColors.map((col, cIdx) => (
                                <div key={cIdx} className="bg-white border border-zinc-200 rounded-xl p-2.5 shadow-2xs space-y-2">
                                  <div className="flex items-center gap-2">
                                    <input
                                      value={col.name}
                                      placeholder="Nombre del color (ej. Negro)"
                                      onChange={e => {
                                        const val = e.target.value;
                                        setNewProdColors(newProdColors.map((col, i) => i === cIdx ? { ...col, name: val } : col));
                                      }}
                                      className="flex-1 border rounded-lg p-1.5 text-xs font-semibold outline-none focus:border-[#FF2E93]"
                                    />
                                    {newProdColors.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => setNewProdColors(newProdColors.filter((_, i) => i !== cIdx))}
                                        className="text-zinc-400 hover:text-red-500 font-bold p-1 rounded transition"
                                        title="Eliminar este color"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-100">
                                    <div className="flex items-center gap-2 min-w-0">
                                      {col.image ? (
                                        <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-zinc-200 shrink-0 bg-zinc-50 flex items-center justify-center">
                                          <img src={col.image} alt="" className="w-full h-full object-contain" />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setNewProdColors(newProdColors.map((col, i) => i === cIdx ? { ...col, image: '' } : col));
                                            }}
                                            className="absolute top-0 right-0 w-3.5 h-3.5 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[8px] font-bold"
                                            title="Quitar foto"
                                          >✕</button>
                                        </div>
                                      ) : (
                                        <div className="w-8 h-8 rounded-lg bg-pink-50 border border-dashed border-pink-200 flex items-center justify-center text-[#FF2E93] shrink-0">
                                          <Icon.Photo className="w-3.5 h-3.5" />
                                        </div>
                                      )}

                                      <label className="cursor-pointer bg-zinc-50 hover:bg-pink-50 border border-zinc-200 hover:border-[#FF2E93] text-zinc-700 hover:text-[#FF2E93] px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 transition">
                                        <Icon.Photo className="w-3 h-3 text-[#FF2E93]" />
                                        <span>{col.image ? 'Cambiar foto de este color' : 'Subir foto de este color'}</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={async e => {
                                            if (e.target.files[0]) {
                                              const url = await uploadFileToSupabase(e.target.files[0], 'products');
                                              if (url) {
                                                setNewProdColors(newProdColors.map((col, i) => i === cIdx ? { ...col, image: url } : col));
                                              }
                                            }
                                          }}
                                        />
                                      </label>
                                    </div>

                                    {col.image && (
                                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 shrink-0">
                                        <Icon.Check className="w-3 h-3" /> Foto lista
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* PASO 2: TALLAS */}
                          <div className="space-y-2 pt-2 border-t border-pink-100">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-[#FF2E93] text-white text-[10px] font-black flex items-center justify-center">2</span>
                                <label className="font-bold text-zinc-800 text-xs">Tallas Disponibles ({newProdSizes.length})</label>
                              </div>
                            </div>

                            {/* Presets */}
                            <div className="flex flex-wrap items-center gap-1 text-[11px]">
                              <span className="text-zinc-400 text-[10px] font-medium mr-1">Presets:</span>
                              <button
                                type="button"
                                onClick={() => setNewProdSizes(['XS', 'S', 'M', 'L', 'XL'])}
                                className="px-2 py-0.5 rounded-full bg-white border border-zinc-200 text-zinc-700 hover:border-[#FF2E93] hover:text-[#FF2E93] font-medium"
                              >
                                Ropa (XS - XL)
                              </button>
                              <button
                                type="button"
                                onClick={() => setNewProdSizes(['S', 'M', 'L'])}
                                className="px-2 py-0.5 rounded-full bg-white border border-zinc-200 text-zinc-700 hover:border-[#FF2E93] hover:text-[#FF2E93] font-medium"
                              >
                                Estándar (S, M, L)
                              </button>
                              <button
                                type="button"
                                onClick={() => setNewProdSizes(['35', '36', '37', '38', '39', '40'])}
                                className="px-2 py-0.5 rounded-full bg-white border border-zinc-200 text-zinc-700 hover:border-[#FF2E93] hover:text-[#FF2E93] font-medium"
                              >
                                Calzado (35 - 40)
                              </button>
                              <button
                                type="button"
                                onClick={() => setNewProdSizes(['Única'])}
                                className="px-2 py-0.5 rounded-full bg-white border border-zinc-200 text-zinc-700 hover:border-[#FF2E93] hover:text-[#FF2E93] font-medium"
                              >
                                Talla Única
                              </button>
                            </div>

                            {/* Chips de tallas */}
                            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white rounded-xl border border-zinc-200">
                              {newProdSizes.map((sz, szIdx) => (
                                <span
                                  key={szIdx}
                                  className="px-2.5 py-1 bg-pink-50 border border-pink-200 text-[#FF2E93] rounded-lg text-xs font-bold flex items-center gap-1.5"
                                >
                                  {sz}
                                  {newProdSizes.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => setNewProdSizes(newProdSizes.filter((_, i) => i !== szIdx))}
                                      className="text-pink-400 hover:text-red-500 font-bold"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </span>
                              ))}

                              <div className="flex items-center gap-1 min-w-[110px]">
                                <input
                                  value={newProdCustomSize}
                                  placeholder="+ Talla..."
                                  onChange={e => setNewProdCustomSize(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      if (newProdCustomSize.trim() && !newProdSizes.includes(newProdCustomSize.trim())) {
                                        setNewProdSizes([...newProdSizes, newProdCustomSize.trim()]);
                                        setNewProdCustomSize('');
                                      }
                                    }
                                  }}
                                  className="border border-dashed border-zinc-300 rounded-lg px-2 py-1 text-xs outline-none focus:border-[#FF2E93] w-20"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (newProdCustomSize.trim() && !newProdSizes.includes(newProdCustomSize.trim())) {
                                      setNewProdSizes([...newProdSizes, newProdCustomSize.trim()]);
                                      setNewProdCustomSize('');
                                    }
                                  }}
                                  className="p-1 bg-[#FF2E93] text-white rounded-lg hover:bg-[#e0157a]"
                                >
                                  <Icon.Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* PASO 3: STOCK POR COMBINACIÓN */}
                          <div className="space-y-2.5 pt-2 border-t border-pink-100">
                            <div className="flex flex-wrap justify-between items-center gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-[#FF2E93] text-white text-[10px] font-black flex items-center justify-center">3</span>
                                <label className="font-bold text-zinc-800 text-xs">
                                  Stock ({newProdColors.length * newProdSizes.length} combinaciones)
                                </label>
                              </div>

                              <div className="flex items-center gap-1 text-[11px]">
                                <span className="text-zinc-500 font-medium">Asignar a todo:</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={newProdBulkStock}
                                  onChange={e => setNewProdBulkStock(e.target.value)}
                                  className="w-12 border rounded-lg px-1.5 py-0.5 text-center font-bold text-xs outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const val = parseInt(newProdBulkStock || '0', 10);
                                    const newMap = { ...newProdMatrixStock };
                                    newProdColors.forEach(c => {
                                      newProdSizes.forEach(s => {
                                        newMap[`${c.name}_${s}`] = val;
                                      });
                                    });
                                    setNewProdMatrixStock(newMap);
                                    showToast(`Stock de ${val} aplicado a todo`);
                                  }}
                                  className="bg-zinc-800 hover:bg-black text-white px-2 py-0.5 rounded-lg font-bold text-[10px] transition"
                                >
                                  Aplicar
                                </button>
                              </div>
                            </div>

                            <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar">
                              {newProdColors.map((col, cIdx) => (
                                <div key={cIdx} className="bg-white border border-zinc-200 rounded-xl p-2.5 shadow-2xs space-y-2">
                                  <div className="flex items-center gap-2">
                                    {col.image ? (
                                      <img src={col.image} alt="" className="w-5 h-5 rounded-md object-contain border border-zinc-200" />
                                    ) : (
                                      <span className="w-3.5 h-3.5 rounded-full bg-[#FF2E93]/20 border border-[#FF2E93]"></span>
                                    )}
                                    <span className="font-bold text-zinc-800 text-xs">{col.name || `Color ${cIdx + 1}`}</span>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 w-full min-w-0">
                                    {newProdSizes.map((sz, szIdx) => {
                                      const key = `${col.name}_${sz}`;
                                      const val = newProdMatrixStock[key] !== undefined ? newProdMatrixStock[key] : (newProdBulkStock || 5);
                                      return (
                                        <div key={szIdx} className="flex items-center justify-between gap-1 bg-zinc-50 border border-zinc-200 rounded-lg px-1.5 sm:px-2 py-1 min-w-0">
                                          <span className="font-bold text-zinc-700 text-[11px] truncate min-w-0 flex-1">{sz}:</span>
                                          <input
                                            type="number"
                                            min="0"
                                            value={val}
                                            onChange={e => {
                                              const num = parseInt(e.target.value || '0', 10);
                                              setNewProdMatrixStock({
                                                ...newProdMatrixStock,
                                                [key]: isNaN(num) ? 0 : num
                                              });
                                            }}
                                            className="w-10 sm:w-12 bg-white border border-zinc-300 rounded-md py-0.5 px-1 text-center font-bold text-xs outline-none focus:border-[#FF2E93] shrink-0"
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                          <button type="submit" disabled={uploading} className="w-full bg-[#151E28] hover:bg-black text-white py-3.5 rounded-full font-bold text-xs shadow-sm transition">
                            {uploading ? 'Guardando...' : 'Guardar Producto en Catálogo'}
                          </button>
                        </form>
                      </div>
                    )}

                    {/* LISTA DE PRODUCTOS COMPACTA Y ORDENADA CON DESPLIEGUE DE VARIANTES BAJO DEMANDA */}
                    {inventoryFiltered.length === 0 ? (
                      <div className="bg-white rounded-3xl border border-zinc-200 p-10 text-center space-y-2">
                        <p className="font-bold text-zinc-800 text-sm">No se encontraron productos con estos filtros.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setAdminInventorySection('TODOS');
                            setAdminInventoryCategory('TODOS');
                            setAdminStockFilter('todos');
                            setAdminSearch('');
                          }}
                          className="text-xs bg-[#151E28] text-white px-4 py-2 rounded-full font-bold"
                        >
                          Limpiar filtros de inventario
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {inventoryFiltered.map(prod => {
                          const totalStock = (prod.variants || []).reduce((a, b) => a + Number(b.stock || 0), 0);
                          const outOfStockCount = (prod.variants || []).filter(v => Number(v.stock || 0) <= 0).length;
                          const criticalCount = (prod.variants || []).filter(v => Number(v.stock || 0) > 0 && Number(v.stock || 0) <= 2).length;
                          const isExpanded = Boolean(expandedInventoryIds[prod.id]);

                          return (
                            <div
                              key={prod.id}
                              className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                                isExpanded ? 'border-[#151E28] shadow-sm' : 'border-zinc-200/90 hover:border-zinc-300'
                              }`}
                            >
                              {/* FILA COMPACTA DEL PRODUCTO */}
                              <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div
                                    onClick={() => setExpandedInventoryIds(prev => ({ ...prev, [prod.id]: !prev[prod.id] }))}
                                    className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#F5F6F8] border border-zinc-200/80 shrink-0 cursor-pointer flex items-center justify-center p-1"
                                  >
                                    <img
                                      src={prod.image || 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600'}
                                      alt={prod.name}
                                      className="w-full h-full object-contain"
                                    />
                                  </div>

                                  <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <h4
                                        onClick={() => setExpandedInventoryIds(prev => ({ ...prev, [prod.id]: !prev[prod.id] }))}
                                        className="font-bold text-[#151E28] text-xs sm:text-sm truncate cursor-pointer hover:text-[#FF2E93]"
                                      >
                                        {prod.name}
                                      </h4>
                                      <span className="text-[10px] bg-[#F5F6F8] text-zinc-700 font-bold px-2 py-0.5 rounded-full">
                                        {prod.section}
                                      </span>
                                      <span className="text-[10px] bg-zinc-100 text-zinc-500 font-medium px-2 py-0.5 rounded-full">
                                        {prod.category}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-3 text-xs flex-wrap">
                                      <span className="font-extrabold text-[#151E28]">
                                        ${Number(prod.discount_price || prod.price).toFixed(2)}
                                        {prod.discount_price && (
                                          <span className="line-through text-zinc-400 text-[10px] font-normal ml-1">
                                            ${Number(prod.price).toFixed(2)}
                                          </span>
                                        )}
                                      </span>

                                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                        totalStock <= 0
                                          ? 'bg-red-50 text-red-700'
                                          : criticalCount > 0 || outOfStockCount > 0
                                          ? 'bg-amber-50 text-amber-900'
                                          : 'bg-emerald-50 text-emerald-800'
                                      }`}>
                                        Stock total: {totalStock} u. ({(prod.variants || []).length} var.)
                                      </span>

                                      {outOfStockCount > 0 && (
                                        <span className="text-[10px] text-red-600 font-bold">
                                          • {outOfStockCount} agotada(s)
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* ACCIONES RÁPIDAS DE LA FILA */}
                                <div className="flex items-center justify-end gap-1.5 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-100">
                                  <button
                                    type="button"
                                    onClick={() => setExpandedInventoryIds(prev => ({ ...prev, [prod.id]: !prev[prod.id] }))}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 ${
                                      isExpanded
                                        ? 'bg-[#151E28] text-white'
                                        : 'bg-[#F5F6F8] hover:bg-zinc-200/80 text-zinc-800'
                                    }`}
                                  >
                                    <span>Stock ({(prod.variants || []).length})</span>
                                    <span className="text-[10px]">{isExpanded ? '▲' : '▼'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => openEditProductModal(prod)}
                                    className="px-3 py-1.5 bg-pink-50 hover:bg-pink-100 text-[#FF2E93] rounded-full font-bold text-xs flex items-center gap-1 transition"
                                    title="Editar producto"
                                  >
                                    <Icon.Edit className="w-3.5 h-3.5" />
                                    <span>Editar</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProduct(prod.id)}
                                    className="p-1.5 bg-zinc-50 hover:bg-red-50 text-zinc-500 hover:text-red-600 rounded-full border border-zinc-200 transition"
                                    title="Eliminar producto"
                                  >
                                    <Icon.Trash className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* CAJÓN DESPLEGABLE DE VARIANTES Y STOCK EN VIVO */}
                              {isExpanded && (
                                <div className="px-4 pb-4 pt-3 bg-[#F5F6F8] border-t border-zinc-200/70 space-y-2 animate-in fade-in">
                                  <div className="flex items-center justify-between text-[11px] text-zinc-500 font-semibold">
                                    <span>Ajuste rápido de existencias por variante:</span>
                                    <span>Cambios guardados en tiempo real</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {(prod.variants || []).map(v => (
                                      <div
                                        key={v.name}
                                        className={`flex items-center justify-between gap-2 p-2 rounded-xl border text-xs bg-white ${
                                          v.stock <= 0
                                            ? 'border-red-200 text-red-900'
                                            : v.stock <= 2
                                            ? 'border-amber-200 text-amber-900'
                                            : 'border-zinc-200/80 text-zinc-800'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                          {v.image ? (
                                            <img src={v.image} className="w-6 h-6 rounded-lg object-cover border border-zinc-200 shrink-0" alt="" />
                                          ) : (
                                            <div className="w-6 h-6 rounded-lg bg-zinc-100 text-zinc-400 flex items-center justify-center shrink-0 text-[10px]">🎨</div>
                                          )}
                                          <span className="font-bold truncate text-[11px]" title={v.name}>{v.name}</span>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                          {v.stock <= 0 ? (
                                            <span className="text-[9px] font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded">Agotado</span>
                                          ) : v.stock <= 2 ? (
                                            <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">Poco</span>
                                          ) : null}

                                          <div className="flex items-center bg-[#F5F6F8] border border-zinc-300 rounded-lg">
                                            <button
                                              type="button"
                                              onClick={() => handleQuickStockChange(prod.id, v.name, -1)}
                                              disabled={v.stock <= 0}
                                              className="w-6 h-6 rounded-l hover:bg-zinc-200 flex items-center justify-center font-bold text-zinc-700 disabled:opacity-30"
                                            >
                                              -
                                            </button>
                                            <input
                                              type="number"
                                              min="0"
                                              value={v.stock}
                                              onChange={e => {
                                                const val = parseInt(e.target.value || '0', 10);
                                                handleDirectStockChange(prod.id, v.name, val);
                                              }}
                                              className="w-9 text-center font-black text-xs outline-none bg-transparent"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => handleQuickStockChange(prod.id, v.name, 1)}
                                              className="w-6 h-6 rounded-r hover:bg-zinc-200 flex items-center justify-center font-bold text-zinc-700"
                                            >
                                              +
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ADMIN TAB 3: SECCIONES */}
              {adminTab === 'sections' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs max-w-2xl space-y-3">
                    <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                      <Icon.Plus className="w-4 h-4 text-[#FF2E93]" /> Crear Nueva Sección Principal
                    </h3>
                    <form onSubmit={async e => {
                      e.preventDefault();
                      const t = newSectionName.trim().toUpperCase();
                      if (!t || sectionsConfig[t]) return;
                      const updated = { ...sectionsConfig, [t]: [] };
                      setSectionsConfig(updated);
                      const adminPin = sessionStorage.getItem('kaoj_admin_pin') || '';
                      await supabase.rpc('kaoj_admin_save_settings', { admin_pin: adminPin, settings_data: { sections_config: updated } });
                      setNewSectionName('');
                      showToast('Sección creada');
                    }} className="flex gap-2 text-xs">
                      <input
                        required
                        value={newSectionName}
                        onChange={e => setNewSectionName(e.target.value)}
                        placeholder="Nombre de sección (ej. DERMOCOSMÉTICA)"
                        className="flex-1 border rounded-xl p-2.5 outline-none font-bold uppercase"
                      />
                      <button type="submit" className="bg-[#FF2E93] text-white px-5 py-2.5 rounded-xl font-bold">
                        Crear Sección
                      </button>
                    </form>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(sectionsConfig).map(([secKey, subcats]) => (
                      <div key={secKey} className="bg-white rounded-3xl border border-zinc-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex justify-between items-center border-b pb-2">
                            <h4 className="font-extrabold text-zinc-900 text-sm tracking-wide">{secKey}</h4>
                            <button
                              onClick={async () => {
                                if (!confirm(`¿Eliminar la sección "${secKey}"?`)) return;
                                const updated = { ...sectionsConfig };
                                delete updated[secKey];
                                setSectionsConfig(updated);
                                const adminPin = sessionStorage.getItem('kaoj_admin_pin') || '';
                      await supabase.rpc('kaoj_admin_save_settings', { admin_pin: adminPin, settings_data: { sections_config: updated } });
                                showToast('Sección eliminada');
                              }}
                              className="text-zinc-400 hover:text-red-500 text-xs"
                            >
                              Eliminar Sección
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {subcats.map(sub => (
                              <span key={sub} className="bg-zinc-50 border text-zinc-800 text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5">
                                <span>{sub}</span>
                                <button
                                  onClick={async () => {
                                    const updated = {
                                      ...sectionsConfig,
                                      [secKey]: sectionsConfig[secKey].filter(s => s !== sub)
                                    };
                                    setSectionsConfig(updated);
                                    const adminPin = sessionStorage.getItem('kaoj_admin_pin') || '';
                      await supabase.rpc('kaoj_admin_save_settings', { admin_pin: adminPin, settings_data: { sections_config: updated } });
                                  }}
                                  className="text-zinc-400 hover:text-red-600 font-bold"
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="border-t pt-3 flex gap-1.5 text-xs">
                          <input
                            value={newSubcatInputs[secKey] || ''}
                            onChange={e => setNewSubcatInputs({ ...newSubcatInputs, [secKey]: e.target.value })}
                            placeholder="Nueva subcategoría..."
                            className="flex-1 border rounded-xl p-2 outline-none text-xs"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              const v = (newSubcatInputs[secKey] || '').trim();
                              if (!v) return;
                              const updated = { ...sectionsConfig, [secKey]: [...(sectionsConfig[secKey] || []), v] };
                              setSectionsConfig(updated);
                              const adminPin = sessionStorage.getItem('kaoj_admin_pin') || '';
                      await supabase.rpc('kaoj_admin_save_settings', { admin_pin: adminPin, settings_data: { sections_config: updated } });
                              setNewSubcatInputs({ ...newSubcatInputs, [secKey]: '' });
                            }}
                            className="bg-zinc-900 text-white px-3 py-2 rounded-xl font-bold"
                          >
                            + Añadir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ADMIN TAB 4: PEDIDOS */}
              {adminTab === 'orders' && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-3xl border border-zinc-200 shadow-xs space-y-3 text-xs">
                    {/* Barra de Búsqueda de Pedidos */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar pedido por código (KAOJ-...), clienta, celular, cédula o dirección..."
                        value={adminOrderSearch}
                        onChange={e => setAdminOrderSearch(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-zinc-900 outline-none focus:border-[#FF2E93] focus:bg-white transition"
                      />
                      <Icon.Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                      {adminOrderSearch && (
                        <button
                          type="button"
                          onClick={() => setAdminOrderSearch('')}
                          className="absolute right-3.5 top-2.5 text-zinc-400 hover:text-zinc-600 font-bold"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Filtros de Estado */}
                    <div className="flex items-center justify-between gap-2 flex-wrap border-t pt-3">
                      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                        {['todos', 'pendiente', 'verificado', 'en_camino', 'entregado', 'cancelado'].map(st => (
                          <button
                            key={st}
                            onClick={() => setAdminFilterStatus(st)}
                            className={`px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider text-[10px] whitespace-nowrap transition ${
                              adminFilterStatus === st
                                ? (st === 'cancelado' ? 'bg-red-600 text-white' : 'bg-[#FF2E93] text-white')
                                : (st === 'cancelado' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-zinc-100 text-zinc-600')
                            }`}
                          >
                            {st} ({st === 'todos' ? orders.length : orders.filter(o => o.status === st).length})
                          </button>
                        ))}
                      </div>
                      <span className="text-[11px] text-zinc-400 font-medium">
                        Mostrando {filteredOrders.length} {filteredOrders.length === 1 ? 'pedido' : 'pedidos'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {filteredOrders.length === 0 ? (
                      <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center text-zinc-400 text-xs">
                        <p className="font-semibold">No se encontraron pedidos con los filtros actuales.</p>
                      </div>
                    ) : (
                      filteredOrders.map(order => (
                        <div key={order.id || order.order_code} className={`bg-white rounded-2xl border shadow-xs p-5 space-y-4 ${order.status === 'cancelado' ? 'border-red-200 bg-red-50/20' : 'border-zinc-200'}`}>
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b pb-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`font-extrabold text-base ${order.status === 'cancelado' ? 'text-red-600 line-through' : 'text-[#FF2E93]'}`}>{order.order_code}</span>
                                <span className="bg-pink-50 text-[#FF2E93] px-2.5 py-0.5 rounded-full text-xs font-black">
                                  VIP: {order.customer_code}
                                </span>
                                {order.status === 'cancelado' && (
                                  <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                                    Cancelado
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-zinc-700">
                                <b>{order.customer_name}</b> ({order.customer_phone}) {order.customer_id_card && `• Cédula: ${order.customer_id_card}`}
                              </p>
                              <p className="text-xs text-zinc-500">
                                {order.delivery_method} {order.delivery_address && `| ${order.delivery_address}`}
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className={`text-xl font-black ${order.status === 'cancelado' ? 'text-zinc-400 line-through' : 'text-zinc-900'}`}>${Number(order.total).toFixed(2)}</span>
                              {order.status !== 'cancelado' ? (
                                <select
                                  value={order.status || 'pendiente'}
                                  onChange={async e => {
                                    const n = e.target.value;
                                    const adminPin = sessionStorage.getItem('kaoj_admin_pin') || '';
                                    const { error } = await supabase.rpc('kaoj_admin_update_order_status', {
                                      admin_pin: adminPin,
                                      target_order_id: order.id,
                                      new_status: n
                                    });
                                    if (error) {
                                      console.warn('kaoj_admin_update_order_status error, intentando directo:', error.message);
                                      const { error: directErr } = await supabase.from('kaoj_orders').update({ status: n, updated_at: new Date().toISOString() }).eq('id', order.id);
                                      if (directErr && !directErr.message?.includes('row-level security')) {
                                        return showToast('Error al actualizar: ' + error.message, 'error');
                                      }
                                    }
                                    setOrders(orders.map(o => o.id === order.id ? { ...o, status: n } : o));
                                    showToast();
                                  }}
                                  className="text-xs font-bold px-3 py-2 rounded-xl border bg-pink-50 text-[#FF2E93]"
                                >
                                  <option value="pendiente">Pendiente</option>
                                  <option value="verificado">Verificado</option>
                                  <option value="en_camino">En Camino</option>
                                  <option value="entregado">Entregado</option>
                                </select>
                              ) : (
                                <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-red-100 text-red-800">
                                  Venta Cancelada
                                </span>
                              )}
                            </div>
                          </div>

                          {/* LISTA DE PRODUCTOS DE LA ORDEN */}
                          <div className="bg-zinc-50/80 rounded-xl p-3 text-xs space-y-1.5">
                            <p className="font-bold text-zinc-700 text-[11px] uppercase tracking-wider">Detalle de productos comprados:</p>
                            <div className="space-y-1 divide-y divide-zinc-200/50">
                              {(order.items || []).map((it, idx) => (
                                <div key={idx} className="flex justify-between items-center text-zinc-700 pt-1">
                                  <span>• {it.qty}x <b>{it.name}</b> ({it.variant})</span>
                                  <span className="font-bold">${((it.price || 0) * (it.qty || 1)).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {order.status === 'cancelado' && (
                            <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-2.5 text-xs font-bold flex items-center justify-between gap-2">
                              <span>⚠️ VENTA CANCELADA: El stock de los productos fue devuelto automáticamente al inventario.</span>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                            <span className="text-xs text-zinc-500">
                              Pago: <b>{order.payment_method}</b>
                              {order.receipt_url && order.receipt_url.startsWith('http') && (
                                <a href={order.receipt_url} target="_blank" rel="noreferrer" className="text-[#FF2E93] underline ml-2 font-bold">Ver Comprobante</a>
                              )}
                            </span>

                            <div className="flex items-center gap-2">
                              {order.status !== 'cancelado' && (
                                <button
                                  type="button"
                                  onClick={() => handleCancelOrder(order)}
                                  className="text-xs bg-red-50 hover:bg-red-100 text-red-700 font-bold px-3 py-1.5 rounded-xl border border-red-200 shadow-2xs flex items-center gap-1.5 transition"
                                  title="Devolver existencias al inventario y cancelar venta"
                                >
                                  <Icon.Close className="w-3.5 h-3.5 text-red-600" /> Cancelar / Revertir Venta
                                </button>
                              )}
                              <button onClick={() => setServientregaOrder(order)} className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5">
                                <Icon.Box className="w-3.5 h-3.5" /> Guía Servientrega
                              </button>
                              <button onClick={() => {
                                const cleanWhatsAppNumber = formatWhatsAppPhone(order.customer_phone);
                                window.open(`https://wa.me/${cleanWhatsAppNumber}?text=${encodeURIComponent(`Hola ${order.customer_name}! Te saludamos de Kaoj Store 💅. Tu pedido ${order.order_code} se encuentra en estado: ${order.status.toUpperCase()}.`)}`, '_blank');
                              }} className="text-xs bg-zinc-900 hover:bg-black text-white font-bold px-3.5 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5">
                                <Icon.WhatsApp className="w-3.5 h-3.5 text-emerald-400" /> Notificar WhatsApp
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ADMIN TAB 5: RESEÑAS (Moderación) */}
              {adminTab === 'reviews' && (
                <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs space-y-4">
                  <div className="flex justify-between items-center border-b pb-3">
                    <div>
                      <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
                        <Icon.Star className="w-4 h-4 text-amber-500" filled={true} /> Muro de Reseñas y Social Proof ({reviews.length})
                      </h3>
                      <p className="text-xs text-zinc-500">Modera opiniones enviadas por compradoras de la boutique.</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {reviews.map(r => (
                      <div key={r.id} className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50/60 flex gap-3 justify-between items-start">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-zinc-900">{r.customer_name}</span>
                            <span className="text-[10px] bg-pink-50 text-[#FF2E93] font-bold px-2 py-0.5 rounded-full">
                              {r.customer_code || 'Cliente'}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.is_approved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                              {r.is_approved ? 'Pública' : 'Pendiente'}
                            </span>
                          </div>

                          <div className="flex gap-0.5 text-amber-500">
                            {Array.from({ length: r.rating || 5 }).map((_, i) => (
                              <Icon.Star key={i} className="w-3.5 h-3.5" filled={true} />
                            ))}
                          </div>

                          <p className="text-xs text-zinc-700 italic">"{r.comment}"</p>
                          <p className="text-[11px] text-zinc-500 font-medium">Producto: {r.product_name}</p>
                        </div>

                        {r.photo_url && (
                          <img src={r.photo_url} alt="" className="w-16 h-16 rounded-xl object-cover border" />
                        )}

                        <div className="flex flex-col gap-1.5 shrink-0">
                          <button
                            onClick={() => handleToggleReviewApproval(r.id, r.is_approved)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${r.is_approved ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}
                          >
                            {r.is_approved ? 'Ocultar' : 'Aprobar'}
                          </button>
                          <button
                            onClick={() => handleDeleteReview(r.id)}
                            className="px-2.5 py-1 bg-zinc-100 hover:bg-red-50 text-zinc-600 hover:text-red-600 rounded-lg text-xs font-bold"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ADMIN TAB 6: CLIENTES VIP */}
              {adminTab === 'customers' && (
                <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs space-y-4">
                  <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
                    <Icon.User className="w-4 h-4 text-[#FF2E93]" /> Directorio de Clientes VIP
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-zinc-50 text-zinc-500 uppercase border-b">
                        <tr>
                          <th className="p-3">Código Único</th>
                          <th className="p-3">Nombre</th>
                          <th className="p-3">Celular</th>
                          <th className="p-3">Email Google</th>
                          <th className="p-3">Puntos Actuales</th>
                          <th className="p-3">Total Comprado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {customersList.map(c => (
                          <tr key={c.id || c.customer_code} className="hover:bg-zinc-50">
                            <td className="p-3 font-bold text-[#FF2E93]">{c.customer_code}</td>
                            <td className="p-3 font-semibold">{c.name}</td>
                            <td className="p-3">{c.phone}</td>
                            <td className="p-3 text-zinc-500">{c.email}</td>
                            <td className="p-3 font-bold">{c.points || 0} pts</td>
                            <td className="p-3 font-bold text-zinc-800">${Number(c.total_spent || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ADMIN TAB 7: AJUSTES GLOBALES */}
              {adminTab === 'settings' && adminSettingsForm && (
                <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs max-w-4xl space-y-6">
                  <div>
                    <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
                      <Icon.Settings className="w-4 h-4 text-[#FF2E93]" /> Configuración de la Boutique
                    </h3>
                    <p className="text-xs text-zinc-500">Configura cuentas bancarias, pasarelas de pago, WhatsApp y PIN de seguridad.</p>
                  </div>

                  <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="font-semibold block mb-1">WhatsApp Oficial de Atención (Ecuador)</label>
                        <input
                          value={adminSettingsForm.whatsapp_number || ''}
                          onChange={e => setAdminSettingsForm({ ...adminSettingsForm, whatsapp_number: e.target.value })}
                          className="w-full border rounded-xl p-2.5 font-bold outline-none"
                        />
                      </div>
                      <div>
                        <label className="font-semibold block mb-1">PIN de Seguridad del Administrador</label>
                        <input
                          type="password"
                          value={adminSettingsForm.admin_pin || ''}
                          onChange={e => setAdminSettingsForm({ ...adminSettingsForm, admin_pin: e.target.value })}
                          className="w-full border rounded-xl p-2.5 font-bold font-mono outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="font-semibold block mb-1">Enlace de Pago Deuna!</label>
                        <input
                          value={adminSettingsForm.deuna_link || ''}
                          onChange={e => setAdminSettingsForm({ ...adminSettingsForm, deuna_link: e.target.value })}
                          className="w-full border rounded-xl p-2.5 outline-none"
                        />
                      </div>
                      <div>
                        <label className="font-semibold block mb-1">Enlace de Pago Payphone Ecuador</label>
                        <input
                          value={adminSettingsForm.payphone_link || ''}
                          onChange={e => setAdminSettingsForm({ ...adminSettingsForm, payphone_link: e.target.value })}
                          className="w-full border rounded-xl p-2.5 outline-none"
                        />
                      </div>
                      <div>
                        <label className="font-semibold block mb-1">Recargo Tarjeta Payphone (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={adminSettingsForm.payphone_surcharge_percent ?? 6.0}
                          onChange={e => setAdminSettingsForm({ ...adminSettingsForm, payphone_surcharge_percent: parseFloat(e.target.value || '0') })}
                          className="w-full border rounded-xl p-2.5 outline-none font-bold text-[#FF2E93]"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="font-semibold block mb-1">Monto Mínimo para Envío Gratis ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={adminSettingsForm.free_shipping_threshold || 50}
                          onChange={e => setAdminSettingsForm({ ...adminSettingsForm, free_shipping_threshold: e.target.value })}
                          className="w-full border rounded-xl p-2.5 outline-none font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-semibold block mb-1">Mensaje en Barra Superior</label>
                        <input
                          value={adminSettingsForm.banner_message || ''}
                          onChange={e => setAdminSettingsForm({ ...adminSettingsForm, banner_message: e.target.value })}
                          className="w-full border rounded-xl p-2.5 outline-none"
                        />
                      </div>
                    </div>

                    {/* CUENTAS BANCARIAS */}
                    <div className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50/70 space-y-4">
                      <h4 className="font-bold text-zinc-900 text-sm">Cuentas Bancarias Oficiales (Transferencias)</h4>

                      <div className="space-y-2 border-b pb-3">
                        <p className="font-bold text-[#FF2E93]">Banco Guayaquil (Ahorros)</p>
                        <div className="grid md:grid-cols-3 gap-2">
                          <input placeholder="Número de cuenta" value={adminSettingsForm.bank_guayaquil_acc || ''} onChange={e => setAdminSettingsForm({ ...adminSettingsForm, bank_guayaquil_acc: e.target.value })} className="border rounded-xl p-2 bg-white" />
                          <input placeholder="Nombre titular" value={adminSettingsForm.bank_guayaquil_name || ''} onChange={e => setAdminSettingsForm({ ...adminSettingsForm, bank_guayaquil_name: e.target.value })} className="border rounded-xl p-2 bg-white" />
                          <input placeholder="Cédula/RUC" value={adminSettingsForm.bank_guayaquil_id || ''} onChange={e => setAdminSettingsForm({ ...adminSettingsForm, bank_guayaquil_id: e.target.value })} className="border rounded-xl p-2 bg-white" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="font-bold text-[#FF2E93]">Banco Pichincha (Ahorros)</p>
                        <div className="grid md:grid-cols-3 gap-2">
                          <input placeholder="Número de cuenta" value={adminSettingsForm.bank_pichincha_acc || ''} onChange={e => setAdminSettingsForm({ ...adminSettingsForm, bank_pichincha_acc: e.target.value })} className="border rounded-xl p-2 bg-white" />
                          <input placeholder="Nombre titular" value={adminSettingsForm.bank_pichincha_name || ''} onChange={e => setAdminSettingsForm({ ...adminSettingsForm, bank_pichincha_name: e.target.value })} className="border rounded-xl p-2 bg-white" />
                          <input placeholder="Cédula/RUC" value={adminSettingsForm.bank_pichincha_id || ''} onChange={e => setAdminSettingsForm({ ...adminSettingsForm, bank_pichincha_id: e.target.value })} className="border rounded-xl p-2 bg-white" />
                        </div>
                      </div>
                    </div>

                    {/* CUPONES DE DESCUENTO ACTIVOS */}
                    <div className="border border-pink-200 rounded-2xl p-4 bg-pink-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-zinc-900 text-sm flex items-center gap-1.5">
                          <Icon.Tag className="w-4 h-4 text-[#FF2E93]" /> Cupones Promocionales Disponibles
                        </h4>
                        <span className="text-[10px] bg-pink-100 text-[#FF2E93] font-black px-2 py-0.5 rounded-full">
                          {availableCoupons.length} Activos
                        </span>
                      </div>
                      <p className="text-zinc-500 text-[11px]">
                        Los clientes pueden ingresar estos códigos al momento del checkout para obtener beneficios inmediatos en sus compras:
                      </p>
                      <div className="grid sm:grid-cols-3 gap-2 pt-1">
                        {availableCoupons.map(c => (
                          <div key={c.code} className="bg-white border border-pink-200 rounded-xl p-3 flex flex-col justify-between shadow-xs">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-black text-[#FF2E93] tracking-wider text-xs">{c.code}</span>
                                <span className="text-[9px] font-bold bg-pink-100 text-[#FF2E93] px-1.5 py-0.5 rounded">
                                  {(c.type === 'percent' || c.type === 'percentage')
                                    ? `${c.discount || c.value}% OFF`
                                    : c.type === 'fixed'
                                    ? `$${Number(c.discount || c.value || 0).toFixed(2)} OFF`
                                    : 'ENVÍO GRATIS'}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-600 mt-1">{c.label || c.description || 'Promoción Kaoj Store'}</p>
                            </div>
                            {c.minSpend ? (
                              <span className="text-[10px] text-zinc-400 mt-2 block">Mínimo: ${c.minSpend}.00</span>
                            ) : (
                              <span className="text-[10px] text-emerald-600 font-medium mt-2 block">✓ Sin mínimo de compra</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* TARIFARIO DE ENVÍOS (COOPERATIVAS & SERVIENTREGA) */}
                    <div className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50/70 space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-3">
                        <div>
                          <h4 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                            <Icon.Truck className="w-4 h-4 text-[#FF2E93]" /> Tarifario de Envíos (Cooperativas & Servientrega)
                          </h4>
                          <p className="text-zinc-500 text-[11px]">Define los costos de envío que verán tus clientas al pagar. El envío se coordina luego por WhatsApp.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const rates = adminSettingsForm.shipping_rates || DEFAULT_SHIPPING_RATES;
                            setAdminSettingsForm({
                              ...adminSettingsForm,
                              shipping_rates: [
                                ...rates,
                                { id: 'envio_' + Date.now(), label: 'Nueva Ruta / Cooperativa', price: 3.50, agency: 'Cooperativa', note: 'Coordinar con vendedor' }
                              ]
                            });
                          }}
                          className="bg-zinc-900 hover:bg-black text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow-2xs"
                        >
                          + Añadir Ruta
                        </button>
                      </div>

                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-900 flex items-start gap-1.5">
                        <span>💡</span>
                        <span><b>Nota automática para clientas:</b> "Los envíos se realizan por Cooperativa o Servientrega. La cooperativa o agencia específica de retiro se coordina directamente por WhatsApp con el vendedor tras confirmar el pedido."</span>
                      </div>

                      <div className="space-y-2">
                        {(adminSettingsForm.shipping_rates || DEFAULT_SHIPPING_RATES).map((rate, rIdx) => (
                          <div key={rate.id || rIdx} className="bg-white border border-zinc-200 rounded-xl p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs">
                            <div className="flex-1 space-y-1 w-full min-w-0">
                              <div className="flex items-center gap-2">
                                <input
                                  value={rate.label || ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setAdminSettingsForm({
                                      ...adminSettingsForm,
                                      shipping_rates: (adminSettingsForm.shipping_rates || DEFAULT_SHIPPING_RATES).map((r, i) => i === rIdx ? { ...r, label: val } : r)
                                    });
                                  }}
                                  placeholder="Nombre de la opción de envío"
                                  className="font-bold text-xs border rounded-lg p-1.5 flex-1 min-w-0 outline-none"
                                />
                                <select
                                  value={rate.agency || 'Cooperativa'}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setAdminSettingsForm({
                                      ...adminSettingsForm,
                                      shipping_rates: (adminSettingsForm.shipping_rates || DEFAULT_SHIPPING_RATES).map((r, i) => i === rIdx ? { ...r, agency: val } : r)
                                    });
                                  }}
                                  className="text-xs border rounded-lg p-1.5 bg-zinc-50 font-bold shrink-0"
                                >
                                  <option value="Cooperativa">Cooperativa</option>
                                  <option value="Servientrega">Servientrega</option>
                                  <option value="Local">Entrega Local</option>
                                  <option value="Personal">Retiro Personal</option>
                                </select>
                              </div>
                              <input
                                value={rate.note || ''}
                                onChange={e => {
                                  const val = e.target.value;
                                  setAdminSettingsForm({
                                    ...adminSettingsForm,
                                    shipping_rates: (adminSettingsForm.shipping_rates || DEFAULT_SHIPPING_RATES).map((r, i) => i === rIdx ? { ...r, note: val } : r)
                                  });
                                }}
                                placeholder="Nota (ej. Reina del Camino, Terminal, 24-48h...)"
                                className="text-[11px] text-zinc-500 border rounded-lg p-1 w-full outline-none"
                              />
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                              <div className="flex items-center gap-1">
                                <span className="text-zinc-500 font-bold">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={rate.price}
                                  onChange={e => {
                                    const val = parseFloat(e.target.value || '0');
                                    setAdminSettingsForm({
                                      ...adminSettingsForm,
                                      shipping_rates: (adminSettingsForm.shipping_rates || DEFAULT_SHIPPING_RATES).map((r, i) => i === rIdx ? { ...r, price: val } : r)
                                    });
                                  }}
                                  className="w-16 border rounded-lg p-1.5 text-right font-black text-xs outline-none"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = (adminSettingsForm.shipping_rates || DEFAULT_SHIPPING_RATES).filter((_, i) => i !== rIdx);
                                  setAdminSettingsForm({ ...adminSettingsForm, shipping_rates: updated });
                                }}
                                className="text-zinc-400 hover:text-red-500 font-bold p-1 rounded"
                                title="Eliminar ruta"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* GESTIÓN DE QUIÉNES SOMOS */}
                    <div className="border border-pink-200 rounded-2xl p-4 bg-pink-50/40 space-y-4">
                      <div className="border-b border-pink-200/80 pb-2">
                        <h4 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                          <span className="text-[#FF2E93]">✨</span> Sección Quiénes Somos (Historia & Boutique)
                        </h4>
                        <p className="text-zinc-500 text-[11px]">Personaliza el texto, la misión y la imagen que ven tus clientas en la página principal.</p>
                      </div>

                      <div className="space-y-3">
                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <label className="font-semibold block mb-1">Título de la Sección</label>
                            <input
                              value={adminSettingsForm.about_us?.title || ''}
                              onChange={e => setAdminSettingsForm({ ...adminSettingsForm, about_us: { ...(adminSettingsForm.about_us || DEFAULT_ABOUT_US), title: e.target.value } })}
                              placeholder="Sobre KAOJ STORE Boutique"
                              className="w-full border rounded-xl p-2.5 bg-white outline-none font-bold text-xs"
                            />
                          </div>
                          <div>
                            <label className="font-semibold block mb-1">Distintivo / Badge</label>
                            <input
                              value={adminSettingsForm.about_us?.badge || ''}
                              onChange={e => setAdminSettingsForm({ ...adminSettingsForm, about_us: { ...(adminSettingsForm.about_us || DEFAULT_ABOUT_US), badge: e.target.value } })}
                              placeholder="Boutique Ecuatoriana Oficial"
                              className="w-full border rounded-xl p-2.5 bg-white outline-none text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="font-semibold block mb-1">Historia / Descripción</label>
                          <textarea
                            rows="3"
                            value={adminSettingsForm.about_us?.story || ''}
                            onChange={e => setAdminSettingsForm({ ...adminSettingsForm, about_us: { ...(adminSettingsForm.about_us || DEFAULT_ABOUT_US), story: e.target.value } })}
                            placeholder="Cuenta la historia de tu tienda, tu pasión por la belleza y de dónde son..."
                            className="w-full border rounded-xl p-2.5 bg-white outline-none text-xs leading-relaxed"
                          ></textarea>
                        </div>

                        <div>
                          <label className="font-semibold block mb-1">Misión / Frase Destacada</label>
                          <input
                            value={adminSettingsForm.about_us?.mission || ''}
                            onChange={e => setAdminSettingsForm({ ...adminSettingsForm, about_us: { ...(adminSettingsForm.about_us || DEFAULT_ABOUT_US), mission: e.target.value } })}
                            placeholder="Frase de compromiso o atención a tus clientas..."
                            className="w-full border rounded-xl p-2.5 bg-white outline-none text-xs"
                          />
                        </div>

                        {/* FOTO DE LA BOUTIQUE DESDE DISPOSITIVO */}
                        <div>
                          <label className="font-semibold block mb-1">Foto de la Boutique o Portada</label>
                          <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-zinc-200">
                            {adminSettingsForm.about_us?.image ? (
                              <img src={adminSettingsForm.about_us.image} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-zinc-200 shrink-0" />
                            ) : (
                              <div className="w-16 h-16 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 border border-dashed border-zinc-300 shrink-0 text-xl">
                                📷
                              </div>
                            )}
                            <div className="flex-1 space-y-1 min-w-0">
                              <label className="cursor-pointer bg-[#FF2E93] hover:bg-[#e0157a] text-white px-3.5 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition">
                                <Icon.Photo className="w-3.5 h-3.5" />
                                <span>Subir foto desde dispositivo</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async e => {
                                    if (e.target.files[0]) {
                                      const url = await uploadFileToSupabase(e.target.files[0], 'branding');
                                      if (url) {
                                        setAdminSettingsForm({
                                          ...adminSettingsForm,
                                          about_us: { ...(adminSettingsForm.about_us || DEFAULT_ABOUT_US), image: url }
                                        });
                                      }
                                    }
                                  }}
                                />
                              </label>
                              <p className="text-[10px] text-zinc-400 truncate">O pega un enlace de foto:</p>
                              <input
                                value={adminSettingsForm.about_us?.image || ''}
                                onChange={e => setAdminSettingsForm({ ...adminSettingsForm, about_us: { ...(adminSettingsForm.about_us || DEFAULT_ABOUT_US), image: e.target.value } })}
                                placeholder="https://..."
                                className="w-full border rounded-lg p-1.5 text-xs outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={uploading}
                      className="bg-[#FF2E93] hover:bg-[#e0157a] text-white px-6 py-3 rounded-xl font-bold shadow-md transition"
                    >
                      {uploading ? 'Guardando...' : 'Guardar Ajustes en Supabase'}
                    </button>
                  </form>
                </div>
              )}
            </main>
          )}

          {/* =========================================================================
              MODAL: EDITOR DE PRODUCTOS
              ========================================================================= */}
          {editingProduct && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setEditingProduct(null)}>
              <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full p-4 sm:p-6 space-y-4 shadow-2xl relative max-h-[92vh] overflow-y-auto text-xs min-w-0" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                    <Icon.Edit className="w-4 h-4 text-[#FF2E93]" /> Editar Producto en Supabase
                  </h3>
                  <button onClick={() => setEditingProduct(null)} className="font-bold text-zinc-400 hover:text-zinc-700 text-base">✕</button>
                </div>

                <form onSubmit={handleSaveEditedProduct} className="space-y-3">
                  <div>
                    <label className="font-semibold text-zinc-700 block mb-1">Nombre</label>
                    <input
                      required
                      value={editingProduct.name}
                      onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      className="w-full border rounded-xl p-2.5 outline-none font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-zinc-700 block mb-1">Sección</label>
                      <select
                        value={editingProduct.section}
                        onChange={e => {
                          const nextSec = e.target.value;
                          const isClothing = (nextSec || '').toUpperCase() === 'ROPA';
                          setEditingProduct({
                            ...editingProduct,
                            section: nextSec,
                            category: (sectionsConfig[nextSec] || [])[0] || '',
                            variant_label: isClothing ? 'Color y Talla' : editingProduct.variant_label
                          });
                          if (isClothing) setEditVariantMode('color_size');
                        }}
                        className="w-full border rounded-xl p-2.5 bg-white outline-none font-bold"
                      >
                        {Object.keys(sectionsConfig).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-zinc-700 block mb-1">Subcategoría</label>
                      <select
                        value={editingProduct.category}
                        onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                        className="w-full border rounded-xl p-2.5 bg-white outline-none"
                      >
                        {(sectionsConfig[editingProduct.section] || []).map(sc => <option key={sc} value={sc}>{sc}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-zinc-700 block mb-1">Precio Normal ($)</label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        value={editingProduct.price}
                        onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })}
                        className="w-full border rounded-xl p-2.5 outline-none font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-zinc-700 block mb-1">Precio Oferta ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingProduct.discount_price || ''}
                        onChange={e => setEditingProduct({ ...editingProduct, discount_price: e.target.value || null })}
                        placeholder="Opcional"
                        className="w-full border rounded-xl p-2.5 outline-none"
                      />
                    </div>
                  </div>

                  {/* GESTOR DE FOTOS MÚLTIPLES EN EDICIÓN */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="font-semibold text-zinc-700 block text-xs">
                        Fotos del Producto ({(editingProduct.images?.length > 0 ? editingProduct.images : (editingProduct.image ? [editingProduct.image] : [])).length})
                      </label>
                      <span className="text-[10px] text-zinc-400">Puedes añadir o cambiar fotos</span>
                    </div>

                    <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3 space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        {(editingProduct.images?.length > 0 ? editingProduct.images : (editingProduct.image ? [editingProduct.image] : [])).map((imgUrl, imgIdx) => (
                          <div
                            key={imgIdx}
                            className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 bg-white flex items-center justify-center shadow-xs group transition ${
                              imgIdx === 0 ? 'border-[#FF2E93] ring-2 ring-pink-100' : 'border-zinc-200 hover:border-zinc-300'
                            }`}
                          >
                            <img src={imgUrl} alt={`Foto ${imgIdx + 1}`} className="w-full h-full object-contain p-0.5" />

                            {imgIdx === 0 ? (
                              <span className="absolute bottom-0 inset-x-0 bg-[#FF2E93] text-white text-[8px] font-black text-center py-0.5 tracking-wider uppercase">
                                Principal
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const currentImages = [...(editingProduct.images?.length > 0 ? editingProduct.images : (editingProduct.image ? [editingProduct.image] : []))];
                                  const selected = currentImages.splice(imgIdx, 1)[0];
                                  const reordered = [selected, ...currentImages];
                                  setEditingProduct({ ...editingProduct, image: reordered[0], images: reordered });
                                  showToast('Foto establecida como Principal ✨');
                                }}
                                className="absolute bottom-0 inset-x-0 bg-black/60 hover:bg-[#FF2E93] text-white text-[8px] font-bold text-center py-0.5 opacity-0 group-hover:opacity-100 transition"
                              >
                                Hacer Principal
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                const currentImages = (editingProduct.images?.length > 0 ? editingProduct.images : (editingProduct.image ? [editingProduct.image] : [])).filter((_, i) => i !== imgIdx);
                                setEditingProduct({
                                  ...editingProduct,
                                  image: currentImages[0] || '',
                                  images: currentImages
                                });
                              }}
                              className="absolute top-1 right-1 w-4 h-4 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold shadow-xs transition"
                              title="Eliminar foto"
                            >
                              ✕
                            </button>
                          </div>
                        ))}

                        {/* Botón para Añadir Fotos */}
                        <label className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-dashed border-pink-300 hover:border-[#FF2E93] bg-pink-50/50 hover:bg-pink-50 flex flex-col items-center justify-center cursor-pointer text-[#FF2E93] transition group shrink-0">
                          <Icon.Plus className="w-5 h-5 group-hover:scale-110 transition" />
                          <span className="text-[9px] font-bold mt-1">+ Fotos</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={async e => {
                              if (e.target.files && e.target.files.length > 0) {
                                const files = Array.from(e.target.files);
                                const current = [...(editingProduct.images?.length > 0 ? editingProduct.images : (editingProduct.image ? [editingProduct.image] : []))];
                                for (let f of files) {
                                  const url = await uploadFileToSupabase(f, 'products');
                                  if (url && !current.includes(url)) current.push(url);
                                }
                                setEditingProduct({
                                  ...editingProduct,
                                  image: current[0] || '',
                                  images: current
                                });
                              }
                            }}
                          />
                        </label>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-200/60">
                        <span>Puedes subir varias fotos (frente, detalle, modelo).</span>
                        <span>JPG, PNG, WEBP</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-700 block mb-1">Descripción</label>
                    <textarea
                      rows="2"
                      value={editingProduct.description}
                      onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      className="w-full border rounded-xl p-2.5 outline-none resize-none"
                    ></textarea>
                  </div>

                  {/* SELECTOR DE MODALIDAD EN EDICIÓN: TONOS SIMPLES vs TALLAS Y COLORES SEPARADOS */}
                  <div className="space-y-2">
                    <label className="font-semibold text-zinc-700 block">Tipo de Variantes</label>
                    <div className="flex rounded-xl bg-zinc-100 p-1 border border-zinc-200">
                      <button
                        type="button"
                        onClick={() => setEditVariantMode('simple')}
                        className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                          editVariantMode === 'simple'
                            ? 'bg-white text-zinc-900 shadow-2xs'
                            : 'text-zinc-500 hover:text-zinc-800'
                        }`}
                      >
                        <span>💅 Tonos / Simples</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditVariantMode('color_size')}
                        className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                          editVariantMode === 'color_size'
                            ? 'bg-[#FF2E93] text-white shadow-2xs'
                            : 'text-zinc-500 hover:text-zinc-800'
                        }`}
                      >
                        <span>👗 Tallas y Colores</span>
                      </button>
                    </div>
                  </div>

                  {editVariantMode === 'simple' ? (
                    /* VARIANTES SIMPLES CON FOTO PROPIA DESDE DISPOSITIVO */
                    <div className="border border-zinc-200 rounded-2xl p-3 bg-zinc-50 space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="font-bold text-zinc-800">Variantes con Foto y Stock ({editingProduct.variants?.length || 0})</label>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...(editingProduct.variants || []), { name: `Variante ${(editingProduct.variants || []).length + 1}`, stock: 5, image: '' }];
                            setEditingProduct({ ...editingProduct, variants: updated });
                          }}
                          className="text-[#FF2E93] font-bold text-xs"
                        >
                          + Añadir Variante
                        </button>
                      </div>

                      <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar">
                        {(editingProduct.variants || []).map((v, idx) => (
                          <div key={idx} className="bg-white border border-zinc-200 rounded-xl p-2.5 space-y-2 shadow-2xs">
                            <div className="flex gap-2 items-center">
                              <input
                                value={v.name}
                                placeholder="Nombre variante (ej. Tono 01 Rose)"
                                onChange={e => {
                                  const val = e.target.value;
                                  setEditingProduct({ ...editingProduct, variants: (editingProduct.variants || []).map((item, i) => i === idx ? { ...item, name: val } : item) });
                                }}
                                className="flex-1 border rounded-lg p-1.5 text-xs font-semibold outline-none focus:border-[#FF2E93]"
                              />
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-[10px] text-zinc-400 font-bold">Stock:</span>
                                <input
                                  type="number"
                                  value={v.stock}
                                  onChange={e => {
                                    const val = parseInt(e.target.value || '0', 10);
                                    setEditingProduct({ ...editingProduct, variants: (editingProduct.variants || []).map((item, i) => i === idx ? { ...item, stock: val } : item) });
                                  }}
                                  className="w-14 border rounded-lg p-1.5 text-xs font-bold text-center outline-none focus:border-[#FF2E93]"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const up = editingProduct.variants.filter((_, i) => i !== idx);
                                  setEditingProduct({ ...editingProduct, variants: up });
                                }}
                                className="text-zinc-400 hover:text-red-500 font-bold p-1 rounded transition"
                                title="Eliminar variante"
                              >
                                ✕
                              </button>
                            </div>

                            {/* SUBIR FOTO DE VARIANTE DESDE DISPOSITIVO */}
                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-100">
                              <div className="flex items-center gap-2 min-w-0">
                                {v.image ? (
                                  <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-zinc-200 shrink-0 bg-zinc-50 flex items-center justify-center">
                                    <img src={v.image} alt="" className="w-full h-full object-contain" />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingProduct({ ...editingProduct, variants: (editingProduct.variants || []).map((item, i) => i === idx ? { ...item, image: '' } : item) });
                                      }}
                                      className="absolute top-0 right-0 w-3.5 h-3.5 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[8px] font-bold"
                                      title="Quitar foto"
                                    >✕</button>
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-dashed border-zinc-300 flex items-center justify-center text-zinc-400 shrink-0">
                                    <Icon.Photo className="w-4 h-4" />
                                  </div>
                                )}

                                <label className="cursor-pointer bg-zinc-50 hover:bg-pink-50 border border-zinc-200 hover:border-[#FF2E93] text-zinc-700 hover:text-[#FF2E93] px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 transition">
                                  <Icon.Photo className="w-3.5 h-3.5 text-[#FF2E93]" />
                                  <span>{v.image ? 'Cambiar foto' : 'Subir foto desde dispositivo'}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async e => {
                                      if (e.target.files[0]) {
                                        const url = await uploadFileToSupabase(e.target.files[0], 'products');
                                        if (url) {
                                          setEditingProduct({ ...editingProduct, variants: (editingProduct.variants || []).map((item, i) => i === idx ? { ...item, image: url } : item) });
                                        }
                                      }
                                    }}
                                  />
                                </label>
                              </div>

                              {v.image && (
                                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 shrink-0">
                                  <Icon.Check className="w-3 h-3" /> Foto lista
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* GESTOR DE TALLAS Y COLORES SEPARADOS EN EDICIÓN */
                    <div className="border border-pink-200 bg-pink-50/20 rounded-2xl p-3.5 space-y-4">
                      {/* PASO 1: COLORES */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-[#FF2E93] text-white text-[10px] font-black flex items-center justify-center">1</span>
                            <label className="font-bold text-zinc-800 text-xs">Colores Disponibles ({editColors.length})</label>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditColors([...editColors, { name: `Color ${editColors.length + 1}`, image: '' }])}
                            className="text-[#FF2E93] hover:text-[#e0157a] font-bold text-xs flex items-center gap-0.5"
                          >
                            <Icon.Plus className="w-3.5 h-3.5" /> Añadir Color
                          </button>
                        </div>

                        {/* Sugerencias rápidas */}
                        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-[11px]">
                          <span className="text-zinc-400 text-[10px] shrink-0 font-medium">Sugeridos:</span>
                          {['Negro', 'Blanco', 'Beige', 'Palo de Rosa', 'Rojo', 'Azul', 'Verde', 'Café', 'Lila'].map(suggested => (
                            <button
                              key={suggested}
                              type="button"
                              onClick={() => {
                                if (!editColors.some(c => c.name.toLowerCase() === suggested.toLowerCase())) {
                                  setEditColors([...editColors, { name: suggested, image: '' }]);
                                }
                              }}
                              className="px-2 py-0.5 rounded-full bg-white border border-zinc-200 text-zinc-700 hover:border-[#FF2E93] hover:text-[#FF2E93] shrink-0 font-medium"
                            >
                              +{suggested}
                            </button>
                          ))}
                        </div>

                        {/* Lista de colores con foto */}
                        <div className="space-y-2 max-h-52 overflow-y-auto no-scrollbar">
                          {editColors.map((col, cIdx) => (
                            <div key={cIdx} className="bg-white border border-zinc-200 rounded-xl p-2.5 shadow-2xs space-y-2">
                              <div className="flex items-center gap-2">
                                <input
                                  value={col.name}
                                  placeholder="Nombre del color (ej. Negro)"
                                  onChange={e => {
                                    const val = e.target.value;
                                    setEditColors(editColors.map((col, i) => i === cIdx ? { ...col, name: val } : col));
                                  }}
                                  className="flex-1 border rounded-lg p-1.5 text-xs font-semibold outline-none focus:border-[#FF2E93]"
                                />
                                {editColors.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => setEditColors(editColors.filter((_, i) => i !== cIdx))}
                                    className="text-zinc-400 hover:text-red-500 font-bold p-1 rounded transition"
                                    title="Eliminar este color"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-100">
                                <div className="flex items-center gap-2 min-w-0">
                                  {col.image ? (
                                    <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-zinc-200 shrink-0 bg-zinc-50 flex items-center justify-center">
                                      <img src={col.image} alt="" className="w-full h-full object-contain" />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditColors(editColors.map((col, i) => i === cIdx ? { ...col, image: '' } : col));
                                        }}
                                        className="absolute top-0 right-0 w-3.5 h-3.5 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[8px] font-bold"
                                        title="Quitar foto"
                                      >✕</button>
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 rounded-lg bg-pink-50 border border-dashed border-pink-200 flex items-center justify-center text-[#FF2E93] shrink-0">
                                      <Icon.Photo className="w-3.5 h-3.5" />
                                    </div>
                                  )}

                                  <label className="cursor-pointer bg-zinc-50 hover:bg-pink-50 border border-zinc-200 hover:border-[#FF2E93] text-zinc-700 hover:text-[#FF2E93] px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 transition">
                                    <Icon.Photo className="w-3.5 h-3.5 text-[#FF2E93]" />
                                    <span>{col.image ? 'Cambiar foto de este color' : 'Subir foto de este color'}</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={async e => {
                                        if (e.target.files[0]) {
                                          const url = await uploadFileToSupabase(e.target.files[0], 'products');
                                          if (url) {
                                            setEditColors(editColors.map((col, i) => i === cIdx ? { ...col, image: url } : col));
                                          }
                                        }
                                      }}
                                    />
                                  </label>
                                </div>

                                {col.image && (
                                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 shrink-0">
                                    <Icon.Check className="w-3 h-3" /> Foto lista
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* PASO 2: TALLAS */}
                      <div className="space-y-2 pt-2 border-t border-pink-100">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-[#FF2E93] text-white text-[10px] font-black flex items-center justify-center">2</span>
                            <label className="font-bold text-zinc-800 text-xs">Tallas Disponibles ({editSizes.length})</label>
                          </div>
                        </div>

                        {/* Presets */}
                        <div className="flex flex-wrap items-center gap-1 text-[11px]">
                          <span className="text-zinc-400 text-[10px] font-medium mr-1">Presets:</span>
                          <button
                            type="button"
                            onClick={() => setEditSizes(['XS', 'S', 'M', 'L', 'XL'])}
                            className="px-2 py-0.5 rounded-full bg-white border border-zinc-200 text-zinc-700 hover:border-[#FF2E93] hover:text-[#FF2E93] font-medium"
                          >
                            Ropa (XS - XL)
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditSizes(['S', 'M', 'L'])}
                            className="px-2 py-0.5 rounded-full bg-white border border-zinc-200 text-zinc-700 hover:border-[#FF2E93] hover:text-[#FF2E93] font-medium"
                          >
                            Estándar (S, M, L)
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditSizes(['35', '36', '37', '38', '39', '40'])}
                            className="px-2 py-0.5 rounded-full bg-white border border-zinc-200 text-zinc-700 hover:border-[#FF2E93] hover:text-[#FF2E93] font-medium"
                          >
                            Calzado (35 - 40)
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditSizes(['Única'])}
                            className="px-2 py-0.5 rounded-full bg-white border border-zinc-200 text-zinc-700 hover:border-[#FF2E93] hover:text-[#FF2E93] font-medium"
                          >
                            Talla Única
                          </button>
                        </div>

                        {/* Chips de tallas */}
                        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white rounded-xl border border-zinc-200">
                          {editSizes.map((sz, szIdx) => (
                            <span
                              key={szIdx}
                              className="px-2.5 py-1 bg-pink-50 border border-pink-200 text-[#FF2E93] rounded-lg text-xs font-bold flex items-center gap-1.5"
                            >
                              {sz}
                              {editSizes.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setEditSizes(editSizes.filter((_, i) => i !== szIdx))}
                                  className="text-pink-400 hover:text-red-500 font-bold"
                                >
                                  ✕
                                </button>
                              )}
                            </span>
                          ))}

                          <div className="flex items-center gap-1 min-w-[110px]">
                            <input
                              value={editCustomSize}
                              placeholder="+ Talla..."
                              onChange={e => setEditCustomSize(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (editCustomSize.trim() && !editSizes.includes(editCustomSize.trim())) {
                                    setEditSizes([...editSizes, editCustomSize.trim()]);
                                    setEditCustomSize('');
                                  }
                                }
                              }}
                              className="border border-dashed border-zinc-300 rounded-lg px-2 py-1 text-xs outline-none focus:border-[#FF2E93] w-20"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (editCustomSize.trim() && !editSizes.includes(editCustomSize.trim())) {
                                  setEditSizes([...editSizes, editCustomSize.trim()]);
                                  setEditCustomSize('');
                                }
                              }}
                              className="p-1 bg-[#FF2E93] text-white rounded-lg hover:bg-[#e0157a]"
                            >
                              <Icon.Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* PASO 3: STOCK POR COMBINACIÓN */}
                      <div className="space-y-2.5 pt-2 border-t border-pink-100">
                        <div className="flex flex-wrap justify-between items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-[#FF2E93] text-white text-[10px] font-black flex items-center justify-center">3</span>
                            <label className="font-bold text-zinc-800 text-xs">
                              Stock ({editColors.length * editSizes.length} combinaciones)
                            </label>
                          </div>

                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="text-zinc-500 font-medium">Asignar a todo:</span>
                            <input
                              type="number"
                              min="0"
                              value={editBulkStock}
                              onChange={e => setEditBulkStock(e.target.value)}
                              className="w-12 border rounded-lg px-1.5 py-0.5 text-center font-bold text-xs outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const val = parseInt(editBulkStock || '0', 10);
                                const newMap = { ...editMatrixStock };
                                editColors.forEach(c => {
                                  editSizes.forEach(s => {
                                    newMap[`${c.name}_${s}`] = val;
                                  });
                                });
                                setEditMatrixStock(newMap);
                                showToast(`Stock de ${val} aplicado a todo`);
                              }}
                              className="bg-zinc-800 hover:bg-black text-white px-2 py-0.5 rounded-lg font-bold text-[10px] transition"
                            >
                              Aplicar
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar">
                          {editColors.map((col, cIdx) => (
                            <div key={cIdx} className="bg-white border border-zinc-200 rounded-xl p-2.5 shadow-2xs space-y-2">
                              <div className="flex items-center gap-2">
                                {col.image ? (
                                  <img src={col.image} alt="" className="w-5 h-5 rounded-md object-contain border border-zinc-200" />
                                ) : (
                                  <span className="w-3.5 h-3.5 rounded-full bg-[#FF2E93]/20 border border-[#FF2E93]"></span>
                                )}
                                <span className="font-bold text-zinc-800 text-xs">{col.name || `Color ${cIdx + 1}`}</span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 w-full min-w-0">
                                {editSizes.map((sz, szIdx) => {
                                  const key = `${col.name}_${sz}`;
                                  const val = editMatrixStock[key] !== undefined ? editMatrixStock[key] : (editBulkStock || 5);
                                  return (
                                    <div key={szIdx} className="flex items-center justify-between gap-1 bg-zinc-50 border border-zinc-200 rounded-lg px-1.5 sm:px-2 py-1 min-w-0">
                                      <span className="font-bold text-zinc-700 text-[11px] truncate min-w-0 flex-1">{sz}:</span>
                                      <input
                                        type="number"
                                        min="0"
                                        value={val}
                                        onChange={e => {
                                          const num = parseInt(e.target.value || '0', 10);
                                          setEditMatrixStock({
                                            ...editMatrixStock,
                                            [key]: isNaN(num) ? 0 : num
                                          });
                                        }}
                                        className="w-10 sm:w-12 bg-white border border-zinc-300 rounded-md py-0.5 px-1 text-center font-bold text-xs outline-none focus:border-[#FF2E93] shrink-0"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex gap-2">
                    <button
                      type="submit"
                      disabled={uploading}
                      className="flex-1 bg-[#FF2E93] hover:bg-[#e0157a] text-white py-3 rounded-xl font-bold shadow-xs transition"
                    >
                      {uploading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProduct(null)}
                      className="px-4 py-3 bg-zinc-100 rounded-xl font-bold text-zinc-700"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODAL: VINCULAR TELÉFONO PERMANENTE A GOOGLE (AL PRIMER INGRESO)
              ========================================================================= */}
          {showPhonePromptModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-xs">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-pink-50 border border-pink-200 mx-auto flex items-center justify-center text-[#FF2E93]">
                    <Icon.Tag className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-base text-zinc-900">Activa tu Código VIP Kaoj</h3>
                  <p className="text-zinc-500">
                    Hola <b>{user?.user_metadata?.full_name}</b>, para generar tu Código Único permanente y sincronizar tus compras con tu cuenta de Google, ingresa tu número de WhatsApp / Celular:
                  </p>
                </div>

                <form onSubmit={handleSavePhoneForGoogle} className="space-y-3">
                  <div>
                    <label className="font-semibold block mb-1">Número de Celular (10 dígitos):</label>
                    <input
                      required
                      type="tel"
                      value={phoneInputForGoogle}
                      onChange={e => setPhoneInputForGoogle(e.target.value)}
                      placeholder="0991234567"
                      className="w-full border rounded-xl p-3 text-sm font-bold tracking-wider outline-none focus:ring-1 focus:ring-[#FF2E93]"
                    />
                  </div>

                  {phoneInputForGoogle.length >= 4 && (
                    <div className="bg-pink-50 border border-pink-200 rounded-xl p-3 text-center">
                      <span className="text-[11px] text-zinc-500 block">Tu Código Único asignado será:</span>
                      <span className="text-lg font-black text-[#FF2E93] tracking-widest">
                        {generateCustomerCode(user?.user_metadata?.full_name || 'K', phoneInputForGoogle)}
                      </span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-[#FF2E93] hover:bg-[#e0157a] text-white py-3 rounded-xl font-bold shadow-md transition"
                  >
                    Activar Código y Vincular a Google
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODAL: AUTORIZACIÓN DE ADMINISTRADOR (PIN DINÁMICO)
              ========================================================================= */}
          {showPinModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => { setShowPinModal(false); if (window.location.hash.startsWith('#/admin')) window.location.hash = '#/'; }}>
              <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative text-xs" onClick={e => e.stopPropagation()}>
                <div className="text-center space-y-1">
                  <h3 className="font-bold text-base text-zinc-900">Acceso Administrativo</h3>
                  <p className="text-zinc-500">Ingrese PIN de seguridad de la boutique:</p>
                </div>

                <form onSubmit={async e => {
                  e.preventDefault();
                  const enteredPin = pinInput.trim();
                  if (!enteredPin) return showToast('Ingresa el PIN de seguridad', 'error');

                  let valid = false;

                  // 1. Intentar verificación en Supabase RPC
                  try {
                    const { data: isValidRpc, error: rpcErr } = await supabase.rpc('kaoj_verify_admin_pin', { input_pin: enteredPin });
                    if (!rpcErr && isValidRpc === true) {
                      valid = true;
                    } else if (rpcErr) {
                      console.warn('RPC kaoj_verify_admin_pin:', rpcErr.message);
                    }
                  } catch (err) {
                    console.warn('Fallo de conexión al verificar PIN:', err);
                  }

                  // 2. Fallback de emergencia instantáneo (PINs maestros autorizados de la boutique)
                  // Esto permite entrar de inmediato incluso si la base de datos no ha corrido la última migración de pgcrypto
                  if (!valid) {
                    const localPin = settings?.admin_pin || '2026';
                    if (enteredPin === '091002' || enteredPin === '2026' || enteredPin === localPin) {
                      valid = true;
                    }
                  }

                  if (valid) {
                    sessionStorage.setItem('kaoj_admin_authenticated', 'true');
                    sessionStorage.setItem('kaoj_admin_pin', enteredPin);
                    setIsAdmin(true);
                    setShowPinModal(false);
                    setPinInput('');
                    window.location.hash = '#/admin' + (adminTab && adminTab !== 'metrics' ? `/${adminTab}` : '');
                    showToast('Acceso administrativo concedido 👑');
                    fetchAdminData(enteredPin);
                  } else {
                    showToast('PIN incorrecto. Acceso denegado.', 'error');
                    setPinInput('');
                  }
                }} className="space-y-3">
                  <input
                    type="password"
                    autoFocus
                    value={pinInput}
                    onChange={e => setPinInput(e.target.value)}
                    placeholder="PIN..."
                    className="w-full border rounded-xl p-3 text-center text-lg font-mono font-bold tracking-widest outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 bg-zinc-900 text-white py-2.5 rounded-xl font-bold">
                      Ingresar
                    </button>
                    <button type="button" onClick={() => { setShowPinModal(false); if (window.location.hash.startsWith('#/admin')) window.location.hash = '#/'; }} className="px-4 py-2.5 bg-zinc-100 rounded-xl font-bold text-zinc-600">
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODAL INFORMATIVO: PROGRAMA DE PUNTOS KAOJ VIP ($5 OFF POR CADA 50 PUNTOS)
              ========================================================================= */}
          {isPointsModalOpen && (
            <div className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setIsPointsModalOpen(false)}>
              <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-pink-200 relative text-xs" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#FF2E93] to-amber-500 text-white flex items-center justify-center shadow-sm">
                      <Icon.Diamond className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif-kaoj text-lg font-extrabold text-zinc-900 leading-tight">Club Puntos Kaoj VIP</h3>
                      <p className="text-[11px] text-[#FF2E93] font-bold">¡Por cada 50 puntos tienes $5.00 de descuento!</p>
                    </div>
                  </div>
                  <button onClick={() => setIsPointsModalOpen(false)} className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center font-bold text-zinc-600">✕</button>
                </div>

                {/* REGLA PRINCIPAL DESTACADA */}
                <div className="bg-gradient-to-r from-amber-50 via-pink-50 to-rose-50 border border-amber-200 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200/80 text-amber-950 px-2.5 py-0.5 rounded-full">Beneficio Exclusivo</span>
                    <span className="font-black text-[#FF2E93] text-sm">50 Pts = $5.00 OFF</span>
                  </div>
                  <p className="text-zinc-700 leading-relaxed text-xs">
                    En <b>Kaoj Store</b> premiamos todas tus compras. Acumulas <b>1 Punto Kaoj por cada $1.00</b> gastado, y <b>por cada 50 puntos acumulados recibes $5.00 de descuento directo</b> en tu pedido.
                  </p>
                  <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                    <div className="bg-white/90 border border-amber-200/80 rounded-xl p-2">
                      <p className="font-black text-zinc-900 text-sm">50 pts</p>
                      <p className="text-[10px] text-[#FF2E93] font-extrabold">-$5.00 USD</p>
                    </div>
                    <div className="bg-white/90 border border-amber-200/80 rounded-xl p-2">
                      <p className="font-black text-zinc-900 text-sm">100 pts</p>
                      <p className="text-[10px] text-[#FF2E93] font-extrabold">-$10.00 USD</p>
                    </div>
                    <div className="bg-white/90 border border-amber-200/80 rounded-xl p-2">
                      <p className="font-black text-zinc-900 text-sm">150 pts</p>
                      <p className="text-[10px] text-[#FF2E93] font-extrabold">-$15.00 USD</p>
                    </div>
                  </div>
                </div>

                {/* SALDO ACTUAL O CONSULTA RÁPIDA POR CELULAR */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase">Tu Saldo Actual</p>
                      <p className="text-lg font-black text-zinc-900 flex items-center gap-1.5">
                        <span>{customerCurrentPoints} Puntos Kaoj</span>
                        {activeCustomerCode && (
                          <span className="text-[10px] bg-pink-100 text-[#FF2E93] px-2 py-0.5 rounded-full font-extrabold">
                            Código {activeCustomerCode}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 block">Descuento disponible</span>
                      <span className="text-sm font-black text-emerald-700">
                        ${(Math.floor(customerCurrentPoints / 50) * 5).toFixed(2)} USD
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#FF2E93] to-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pointsProgressPercent}%` }}
                    ></div>
                  </div>

                  <p className="text-[11px] text-zinc-600">
                    {customerCurrentPoints >= 50
                      ? `🎉 ¡Ya tienes ${Math.floor(customerCurrentPoints / 50) * 50} puntos listos para canjear por $${(Math.floor(customerCurrentPoints / 50) * 5).toFixed(2)} de descuento en el Paso 3 del carrito!`
                      : `Te faltan ${pointsNeededForNextDiscount} puntos para desbloquear tu próximo descuento de $5.00 USD.`}
                  </p>

                  {!user && (
                    <div className="pt-2 border-t border-zinc-200/80 space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-700 block">Consulta tus puntos con tu número de WhatsApp:</label>
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          placeholder="Ej. 0991234567"
                          value={customer.phone}
                          onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                          className="flex-1 border border-zinc-300 rounded-xl px-3 py-2 text-xs bg-white font-bold outline-none focus:border-[#FF2E93]"
                        />
                        <button
                          type="button"
                          onClick={() => handlePhoneLookup(customer.phone)}
                          className="bg-zinc-900 hover:bg-black text-white px-3.5 py-2 rounded-xl font-bold text-xs transition"
                        >
                          Consultar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsPointsModalOpen(false)}
                  className="w-full bg-[#FF2E93] hover:bg-[#e0157a] text-white py-3 rounded-xl font-bold shadow-sm transition"
                >
                  ¡Entendido, seguir comprando!
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              DRAWER: CARRITO DE COMPRAS & CHECKOUT VIP POR PASOS (1. DATOS, 2. ENVÍO, 3. PAGO)
              ========================================================================= */}
          {isCartOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-end" onClick={() => { setIsCartOpen(false); if (window.location.hash === '#/carrito') window.location.hash = '#/'; }}>
              <div className="bg-white w-full max-w-lg h-full flex flex-col justify-between shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

                {/* HEADER FIJO DEL CARRITO Y STEPPER DE PASOS */}
                <div className="px-5 pt-4 pb-3 border-b border-zinc-100 bg-white z-10 space-y-3 shrink-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif-kaoj text-xl sm:text-2xl font-bold text-zinc-900">Tu Compra</h3>
                        {cart.length > 0 && (
                          <span className="bg-pink-50 text-[#FF2E93] border border-pink-200 text-[11px] font-black px-2.5 py-0.5 rounded-full">
                            {cart.reduce((a, b) => a + b.qty, 0)} {cart.reduce((a, b) => a + b.qty, 0) === 1 ? 'artículo' : 'artículos'}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-500 font-medium">KAOJ STORE BOUTIQUE • Compra rápida en 3 pasos</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setIsCartOpen(false); if (window.location.hash === '#/carrito') window.location.hash = '#/'; }}
                      className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center font-bold text-zinc-700 transition"
                    >
                      ✕
                    </button>
                  </div>

                  {/* STEPPER INTERACTIVO: 1. DATOS -> 2. ENVÍO -> 3. PAGO */}
                  {cart.length > 0 && (
                    <div className="grid grid-cols-3 gap-1.5 bg-zinc-100/90 p-1 rounded-2xl border border-zinc-200/70">
                      {[
                        { step: 1, title: '1. Datos', subtitle: 'Tus datos y VIP' },
                        { step: 2, title: '2. Envío', subtitle: 'Modalidad y tarifa' },
                        { step: 3, title: '3. Pago', subtitle: 'Método y resumen' }
                      ].map(s => {
                        const isActive = checkoutStep === s.step;
                        const isCompleted = checkoutStep > s.step;
                        return (
                          <button
                            key={s.step}
                            type="button"
                            onClick={() => handleGoToStep(s.step)}
                            className={`py-2 px-2 rounded-xl text-left transition-all flex items-center gap-2 ${
                              isActive
                                ? 'bg-white text-zinc-900 shadow-xs border border-pink-200'
                                : isCompleted
                                ? 'bg-emerald-50/70 text-emerald-900 hover:bg-white/70'
                                : 'text-zinc-500 hover:text-zinc-800'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${
                              isActive
                                ? 'bg-[#FF2E93] text-white'
                                : isCompleted
                                ? 'bg-emerald-600 text-white'
                                : 'bg-zinc-200 text-zinc-600'
                            }`}>
                              {isCompleted ? '✓' : s.step}
                            </span>
                            <div className="min-w-0">
                              <p className={`text-[11px] font-extrabold leading-none truncate ${isActive ? 'text-[#FF2E93]' : ''}`}>{s.title}</p>
                              <p className="text-[9px] text-zinc-400 truncate mt-0.5 hidden sm:block">{s.subtitle}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* CONTENIDO CENTRAL SCROLLEABLE */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-xs">
                  {cart.length === 0 ? (
                    <div className="text-center py-16 space-y-3">
                      <div className="w-16 h-16 rounded-full bg-pink-50 text-[#FF2E93] flex items-center justify-center mx-auto">
                        <Icon.Bag className="w-8 h-8" />
                      </div>
                      <p className="font-bold text-zinc-800 text-sm">Tu carrito está vacío</p>
                      <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                        Agrega tus labiales, accesorios o prendas favoritas y acumula Puntos Kaoj VIP ($5.00 de descuento por cada 50 puntos).
                      </p>
                      <button
                        type="button"
                        onClick={() => { setIsCartOpen(false); if (window.location.hash === '#/carrito') window.location.hash = '#/'; }}
                        className="bg-[#FF2E93] hover:bg-[#e0157a] text-white px-6 py-2.5 rounded-full font-bold text-xs shadow-sm transition"
                      >
                        Explorar Catálogo
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* BARRA DE PROGRESO INTERACTIVA PARA ENVÍO GRATIS */}
                      {qualifiesFreeShipping || subtotal >= freeShippingThreshold ? (
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-3 space-y-1 shadow-2xs">
                          <div className="flex items-center justify-between text-xs font-extrabold text-emerald-800">
                            <span className="flex items-center gap-1.5">
                              <Icon.Truck className="w-4 h-4 text-emerald-600" /> ¡Felicidades! Tienes Envío Gratis desbloqueado
                            </span>
                            <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">GRATIS</span>
                          </div>
                          <div className="w-full bg-emerald-200/60 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full w-full"></div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-2xl p-3 space-y-1 shadow-2xs">
                          <div className="flex items-center justify-between text-xs font-bold text-zinc-800">
                            <span className="flex items-center gap-1.5">
                              <Icon.Truck className="w-4 h-4 text-[#FF2E93]" />
                              <span>Te faltan <b className="text-[#FF2E93] font-black">${remainingForFreeShipping.toFixed(2)}</b> para Envío Gratis</span>
                            </span>
                            <span className="text-[10px] font-extrabold text-[#FF2E93]">{shippingProgressPercent}%</span>
                          </div>
                          <div className="w-full bg-pink-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-[#FF2E93] h-full rounded-full transition-all duration-500" style={{ width: `${shippingProgressPercent}%` }}></div>
                          </div>
                        </div>
                      )}

                      {/* ACORDEÓN DE PRODUCTOS DEL CARRITO (Expandido en Paso 1, compacto en Pasos 2 y 3) */}
                      <div className="border border-zinc-200 rounded-2xl bg-zinc-50/50 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setShowCartItemsInStep(!showCartItemsInStep)}
                          className="w-full px-3.5 py-2.5 bg-white flex items-center justify-between text-xs font-bold text-zinc-800 hover:bg-zinc-50 transition"
                        >
                          <span className="flex items-center gap-2">
                            <Icon.Bag className="w-4 h-4 text-[#FF2E93]" />
                            <span>Productos en tu bolsa ({cart.reduce((a, b) => a + b.qty, 0)})</span>
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="font-black text-[#FF2E93]">${subtotal.toFixed(2)}</span>
                            <span className="text-[10px] text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                              {showCartItemsInStep ? 'Ocultar ▲' : 'Ver / Editar ▼'}
                            </span>
                          </span>
                        </button>

                        {showCartItemsInStep && (
                          <div className="p-3 divide-y divide-zinc-200/70 space-y-2.5 bg-white border-t border-zinc-100">
                            {cart.map(item => (
                              <div key={item.key} className="pt-2.5 first:pt-0 flex items-center justify-between gap-2.5 text-xs">
                                <img
                                  src={item.image || 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600'}
                                  alt={item.name}
                                  className="w-12 h-12 rounded-xl object-cover border border-zinc-200 shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-zinc-900 leading-tight truncate">{item.name}</p>
                                  <p className="text-zinc-500 text-[11px] truncate">{item.variant}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="font-extrabold text-[#FF2E93]">${(item.price * item.qty).toFixed(2)}</span>
                                    <span className="text-[10px] text-zinc-400">(${item.price.toFixed(2)} c/u)</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 bg-zinc-100 border border-zinc-200 rounded-xl p-1">
                                  <button type="button" onClick={() => updateCartQty(item.key, -1)} className="w-6 h-6 rounded-lg bg-white hover:bg-zinc-50 flex items-center justify-center font-bold shadow-2xs">-</button>
                                  <span className="font-bold px-1.5 text-xs">{item.qty}</span>
                                  <button type="button" onClick={() => updateCartQty(item.key, 1)} className="w-6 h-6 rounded-lg bg-white hover:bg-zinc-50 flex items-center justify-center font-bold shadow-2xs">+</button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeFromCart(item.key)}
                                  className="text-zinc-400 hover:text-red-500 p-1 rounded-lg transition"
                                  title="Quitar producto"
                                >
                                  <Icon.Trash className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <form id="kaoj-checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-4">

                        {/* =====================================================================
                            PASO 1: DATOS DEL CLIENTE & PUNTOS KAOJ VIP
                            ===================================================================== */}
                        {checkoutStep === 1 && (
                          <div className="space-y-4 animate-in fade-in">

                            {/* BANNER EXPLICATIVO CLARO DE PUNTOS KAOJ VIP */}
                            <div className="bg-gradient-to-br from-amber-50 via-pink-50 to-white border border-amber-200/90 rounded-2xl p-3.5 space-y-2 shadow-2xs">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-extrabold text-zinc-900 text-xs flex items-center gap-1.5">
                                  <Icon.Diamond className="w-4 h-4 text-[#FF2E93]" />
                                  <span>Programa de Puntos Kaoj VIP</span>
                                </span>
                                <span className="bg-amber-200/90 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                                  50 Pts = $5.00 OFF
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-700 leading-relaxed">
                                Por cada <b>$1.00 de compra ganas 1 punto</b>. Al acumular <b>50 puntos tienes $5.00 de descuento directo</b> (100 pts = $10.00 OFF). Con este pedido sumarás <b className="text-emerald-700">+{pointsEarnedWithOrder} puntos</b>.
                              </p>

                              {/* ESTADO DE PUNTOS DE LA CLIENTA */}
                              <div className="bg-white/90 border border-amber-200/70 rounded-xl p-2.5 space-y-1.5">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-bold text-zinc-700">
                                    Tu saldo actual: <b className="text-[#FF2E93]">{customerCurrentPoints} pts</b>
                                  </span>
                                  {canRedeemPoints ? (
                                    <span className="text-emerald-700 font-black text-[10px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                      ✓ ¡Tienes ${(maxAvailablePointBlocks * 5).toFixed(2)} OFF disponibles!
                                    </span>
                                  ) : (
                                    <span className="text-zinc-500 text-[10px] font-semibold">
                                      Faltan {pointsNeededForNextDiscount} pts para $5.00 OFF
                                    </span>
                                  )}
                                </div>
                                <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-[#FF2E93] to-amber-500 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${pointsProgressPercent}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>

                            {/* DATOS DE CONTACTO Y FACTURACIÓN / GUÍA */}
                            <div className="bg-white border border-zinc-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                              <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                                <h4 className="font-bold text-zinc-900 text-xs flex items-center gap-1.5">
                                  <Icon.User className="w-4 h-4 text-[#FF2E93]" />
                                  <span>Paso 1: Tus Datos Personales</span>
                                </h4>
                                <span className="text-[10px] text-zinc-400">* Campos obligatorios</span>
                              </div>

                              <div className="space-y-2.5">
                                <div>
                                  <label className="font-bold text-zinc-700 text-[11px] block mb-1">Nombre y Apellido *</label>
                                  <input
                                    required
                                    placeholder="Ej. Camila Moreira"
                                    value={customer.name}
                                    onChange={e => setCustomer({ ...customer, name: e.target.value })}
                                    className="w-full border border-zinc-300 focus:border-[#FF2E93] rounded-xl p-2.5 outline-none text-xs font-medium bg-zinc-50/50 focus:bg-white transition"
                                  />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  <div>
                                    <label className="font-bold text-zinc-700 text-[11px] block mb-1">Celular (WhatsApp) *</label>
                                    <input
                                      required
                                      type="tel"
                                      placeholder="Ej. 0991234567"
                                      value={customer.phone}
                                      onChange={e => {
                                        setCustomer({ ...customer, phone: e.target.value });
                                        handlePhoneLookup(e.target.value);
                                      }}
                                      onBlur={e => handlePhoneLookup(e.target.value)}
                                      className="w-full border border-zinc-300 focus:border-[#FF2E93] rounded-xl p-2.5 outline-none text-xs font-bold bg-zinc-50/50 focus:bg-white transition"
                                    />
                                    <span className="text-[10px] text-zinc-400 block mt-0.5">Activa tus puntos VIP automáticamente</span>
                                  </div>

                                  <div>
                                    <label className="font-bold text-zinc-700 text-[11px] block mb-1">Cédula o RUC</label>
                                    <input
                                      placeholder="Requerido para Servientrega"
                                      value={customer.idCard}
                                      onChange={e => setCustomer({ ...customer, idCard: e.target.value })}
                                      className="w-full border border-zinc-300 focus:border-[#FF2E93] rounded-xl p-2.5 outline-none text-xs bg-zinc-50/50 focus:bg-white transition"
                                    />
                                    <span className="text-[10px] text-zinc-400 block mt-0.5">Para tu guía de envío nacional</span>
                                  </div>
                                </div>
                              </div>

                              {activeCustomerCode && (
                                <div className="bg-pink-50/90 border border-pink-200 rounded-xl p-2.5 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-[#FF2E93] text-white font-black text-xs flex items-center justify-center">
                                      <Icon.Diamond className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-zinc-500 font-semibold">Tu Código Único VIP asignado:</p>
                                      <p className="text-sm font-black text-[#FF2E93] tracking-wider">{activeCustomerCode}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[10px] bg-white text-[#FF2E93] border border-pink-200 px-2.5 py-0.5 rounded-full font-extrabold block">
                                      {customerCurrentPoints} pts actuales
                                    </span>
                                    <span className="text-[9px] text-emerald-700 font-bold">
                                      +{pointsEarnedWithOrder} pts hoy
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* =====================================================================
                            PASO 2: ENVÍO (4 OPCIONES CON DESGLOSE DINÁMICO DE MÉTODOS Y PRECIOS)
                            ===================================================================== */}
                        {checkoutStep === 2 && (
                          <div className="space-y-4 animate-in fade-in">
                            <div className="bg-white border border-zinc-200 rounded-2xl p-4 space-y-3.5 shadow-2xs">
                              <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                                <div>
                                  <h4 className="font-bold text-zinc-900 text-xs flex items-center gap-1.5">
                                    <Icon.Truck className="w-4 h-4 text-[#FF2E93]" />
                                    <span>Paso 2: Elige cómo recibir tu pedido</span>
                                  </h4>
                                  <p className="text-[11px] text-zinc-500 mt-0.5">Selecciona una modalidad para ver sus opciones y tarifas:</p>
                                </div>
                                {qualifiesFreeShipping && (
                                  <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                    🎉 Envío Gratis
                                  </span>
                                )}
                              </div>

                              {/* 4 TARJETAS PRINCIPALES DE MODALIDAD DE ENVÍO */}
                              <div className="grid grid-cols-2 gap-2">
                                {SHIPPING_CATEGORIES.map(cat => {
                                  const isSelected = activeShippingCategory === cat.id;
                                  return (
                                    <button
                                      key={cat.id}
                                      type="button"
                                      onClick={() => handleSelectShippingCategory(cat.id)}
                                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                                        isSelected
                                          ? 'border-[#FF2E93] bg-pink-50/70 ring-1 ring-[#FF2E93] shadow-xs'
                                          : 'border-zinc-200 bg-zinc-50/60 hover:bg-white hover:border-zinc-300'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <span className="text-base">{cat.icon}</span>
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                                          cat.id === 'retiro' || qualifiesFreeShipping
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : isSelected
                                            ? 'bg-[#FF2E93] text-white'
                                            : 'bg-zinc-200 text-zinc-700'
                                        }`}>
                                          {cat.id !== 'retiro' && qualifiesFreeShipping ? 'GRATIS' : cat.badge}
                                        </span>
                                      </div>
                                      <div>
                                        <p className={`font-extrabold text-xs leading-tight ${isSelected ? 'text-[#FF2E93]' : 'text-zinc-900'}`}>
                                          {cat.title}
                                        </p>
                                        <p className="text-[10px] text-zinc-500 leading-tight mt-0.5">
                                          {cat.subtitle}
                                        </p>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* DESGLOSE DINÁMICO DE SUB-MÉTODOS Y PRECIOS SEGÚN LA MODALIDAD SELECCIONADA */}
                              <div className="bg-zinc-50 border border-zinc-200/90 rounded-2xl p-3 space-y-2">
                                <p className="text-[11px] font-extrabold text-zinc-700 uppercase tracking-wider flex items-center justify-between">
                                  <span>
                                    {activeShippingCategory === 'retiro' && '📍 Selecciona el punto de retiro personal:'}
                                    {activeShippingCategory === 'domicilio' && '🛵 Selecciona tu ciudad (Manta o Portoviejo):'}
                                    {activeShippingCategory === 'cooperativa' && '🚌 Selecciona el destino de la Cooperativa:'}
                                    {activeShippingCategory === 'servientrega' && '📦 Selecciona la modalidad de Servientrega:'}
                                  </span>
                                </p>

                                <div className="space-y-2">
                                  {categorySubMethods.map(method => {
                                    const isMethodSelected = deliveryObj?.id === method.id;
                                    const methodPrice = Number(method.price || 0);
                                    const effectivePrice = (qualifiesFreeShipping && methodPrice > 0) ? 0 : methodPrice;

                                    return (
                                      <label
                                        key={method.id}
                                        onClick={() => setCustomer(prev => ({
                                          ...prev,
                                          delivery: method.id,
                                          city: method.city || (method.id.includes('manta') ? 'Manta' : method.id.includes('portoviejo') ? 'Portoviejo' : prev.city)
                                        }))}
                                        className={`flex items-start justify-between gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                                          isMethodSelected
                                            ? 'bg-white border-[#FF2E93] shadow-xs ring-1 ring-[#FF2E93]/40'
                                            : 'bg-white/70 border-zinc-200 hover:border-pink-200'
                                        }`}
                                      >
                                        <div className="flex items-start gap-2.5 min-w-0">
                                          <input
                                            type="radio"
                                            name="delivery_submethod"
                                            checked={isMethodSelected}
                                            onChange={() => {}}
                                            className="mt-0.5 accent-[#FF2E93]"
                                          />
                                          <div className="min-w-0">
                                            <p className="font-bold text-zinc-900 text-xs leading-snug">{method.label}</p>
                                            {method.note && (
                                              <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">{method.note}</p>
                                            )}
                                          </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                          {effectivePrice === 0 ? (
                                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                                              GRATIS
                                            </span>
                                          ) : (
                                            <span className="font-black text-xs text-[#FF2E93]">
                                              +${effectivePrice.toFixed(2)}
                                            </span>
                                          )}
                                          {qualifiesFreeShipping && methodPrice > 0 && (
                                            <span className="block text-[9px] text-zinc-400 line-through">${methodPrice.toFixed(2)}</span>
                                          )}
                                        </div>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* CAMPOS DINÁMICOS DE DIRECCIÓN / DESTINO SEGÚN LA SELECCIÓN */}
                              {activeShippingCategory === 'retiro' && (
                                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 space-y-2">
                                  <p className="text-[11px] text-emerald-900 font-semibold">
                                    ✓ Coordinaremos contigo por WhatsApp el día y hora exacta para tu entrega en <b>{deliveryObj?.label}</b> sin costo adicional.
                                  </p>
                                  <input
                                    placeholder="Nota u horario preferido de retiro (Opcional)..."
                                    value={customer.deliveryNotes || ''}
                                    onChange={e => setCustomer({ ...customer, deliveryNotes: e.target.value })}
                                    className="w-full border border-emerald-200 rounded-xl p-2 text-xs bg-white outline-none focus:border-emerald-500"
                                  />
                                </div>
                              )}

                              {activeShippingCategory === 'domicilio' && (
                                <div className="space-y-2.5 pt-1">
                                  <div>
                                    <label className="font-bold text-zinc-700 text-[11px] block mb-1">
                                      Dirección exacta y referencia en {deliveryObj?.id?.includes('manta') ? 'Manta' : 'Portoviejo'} *
                                    </label>
                                    <input
                                      required
                                      placeholder={`Ej. ${deliveryObj?.id?.includes('manta') ? 'Manta, Cdla. Universitaria, calle 15 y av. 24, casa blanca' : 'Portoviejo, Av. Manabí y América, frente al parque...'}`}
                                      value={customer.address}
                                      onChange={e => setCustomer({ ...customer, address: e.target.value })}
                                      className="w-full border border-zinc-300 focus:border-[#FF2E93] rounded-xl p-2.5 outline-none text-xs bg-white"
                                    />
                                  </div>
                                  <input
                                    placeholder="Referencia adicional o indicación para el motorizado (Opcional)"
                                    value={customer.deliveryNotes || ''}
                                    onChange={e => setCustomer({ ...customer, deliveryNotes: e.target.value })}
                                    className="w-full border border-zinc-200 rounded-xl p-2 text-xs bg-zinc-50 outline-none focus:bg-white"
                                  />
                                </div>
                              )}

                              {activeShippingCategory === 'cooperativa' && (
                                <div className="space-y-2.5 pt-1">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div>
                                      <label className="font-bold text-zinc-700 text-[11px] block mb-1">Ciudad / Cantón de destino *</label>
                                      <input
                                        required
                                        placeholder="Ej. Chone / Guayaquil / Quito..."
                                        value={customer.city || ''}
                                        onChange={e => setCustomer({ ...customer, city: e.target.value })}
                                        className="w-full border border-zinc-300 focus:border-[#FF2E93] rounded-xl p-2.5 outline-none text-xs bg-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="font-bold text-zinc-700 text-[11px] block mb-1">Cédula de quien retira</label>
                                      <input
                                        placeholder="Cédula / RUC"
                                        value={customer.idCard}
                                        onChange={e => setCustomer({ ...customer, idCard: e.target.value })}
                                        className="w-full border border-zinc-300 focus:border-[#FF2E93] rounded-xl p-2.5 outline-none text-xs bg-white"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="font-bold text-zinc-700 text-[11px] block mb-1">Cooperativa preferida / Oficina de retiro *</label>
                                    <input
                                      required
                                      placeholder="Ej. Cooperativa Reina del Camino - Terminal Terrestre"
                                      value={customer.address}
                                      onChange={e => setCustomer({ ...customer, address: e.target.value })}
                                      className="w-full border border-zinc-300 focus:border-[#FF2E93] rounded-xl p-2.5 outline-none text-xs bg-white"
                                    />
                                  </div>
                                </div>
                              )}

                              {activeShippingCategory === 'servientrega' && (
                                <div className="space-y-2.5 pt-1">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div>
                                      <label className="font-bold text-zinc-700 text-[11px] block mb-1">Ciudad y Provincia *</label>
                                      <input
                                        required
                                        placeholder="Ej. Guayaquil, Guayas"
                                        value={customer.city || ''}
                                        onChange={e => setCustomer({ ...customer, city: e.target.value })}
                                        className="w-full border border-zinc-300 focus:border-[#FF2E93] rounded-xl p-2.5 outline-none text-xs bg-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="font-bold text-zinc-700 text-[11px] block mb-1">Cédula / RUC (Obligatorio Guía) *</label>
                                      <input
                                        required
                                        placeholder="10 o 13 dígitos"
                                        value={customer.idCard}
                                        onChange={e => setCustomer({ ...customer, idCard: e.target.value })}
                                        className="w-full border border-zinc-300 focus:border-[#FF2E93] rounded-xl p-2.5 outline-none text-xs bg-white font-bold"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="font-bold text-zinc-700 text-[11px] block mb-1">
                                      {deliveryObj?.id === 'servientrega_agencia'
                                        ? 'Agencia Oficial de Servientrega donde retirarás *'
                                        : 'Dirección exacta de domicilio u oficina *'}
                                    </label>
                                    <input
                                      required
                                      placeholder={
                                        deliveryObj?.id === 'servientrega_agencia'
                                          ? 'Ej. Agencia Servientrega Centro / Mall del Sol...'
                                          : 'Ej. Calle principal, secundaria, número de casa y referencia...'
                                      }
                                      value={customer.address}
                                      onChange={e => setCustomer({ ...customer, address: e.target.value })}
                                      className="w-full border border-zinc-300 focus:border-[#FF2E93] rounded-xl p-2.5 outline-none text-xs bg-white"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* =====================================================================
                            PASO 3: PAGO (PUNTOS VIP, CUPÓN SIN SUGERENCIA, DEUNA / TRANSFERENCIA / PAYPHONE CON RECARGO)
                            ===================================================================== */}
                        {checkoutStep === 3 && (
                          <div className="space-y-4 animate-in fade-in">

                            {/* RESUMEN COMPACTO DE DATOS Y ENVÍO CON OPCIÓN DE CAMBIAR */}
                            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3 space-y-2 text-[11px]">
                              <div className="flex items-center justify-between border-b border-zinc-200/70 pb-1.5">
                                <div className="min-w-0">
                                  <span className="text-zinc-400 font-bold uppercase text-[9px] block">1. Cliente</span>
                                  <p className="font-bold text-zinc-800 truncate">
                                    {customer.name} • {customer.phone} {activeCustomerCode ? `(${activeCustomerCode})` : ''}
                                  </p>
                                </div>
                                <button type="button" onClick={() => setCheckoutStep(1)} className="text-[#FF2E93] font-bold hover:underline shrink-0 ml-2">
                                  Cambiar
                                </button>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="min-w-0">
                                  <span className="text-zinc-400 font-bold uppercase text-[9px] block">2. Método de Envío</span>
                                  <p className="font-bold text-zinc-800 truncate">
                                    {deliveryObj?.label} ({finalShippingAfterCoupon === 0 ? 'GRATIS' : `$${finalShippingAfterCoupon.toFixed(2)}`})
                                  </p>
                                  {(customer.city || customer.address) && (
                                    <p className="text-zinc-500 truncate text-[10px]">
                                      {[customer.city, customer.address].filter(Boolean).join(' - ')}
                                    </p>
                                  )}
                                </div>
                                <button type="button" onClick={() => setCheckoutStep(2)} className="text-[#FF2E93] font-bold hover:underline shrink-0 ml-2">
                                  Cambiar
                                </button>
                              </div>
                            </div>

                            {/* SECCIÓN DE PUNTOS VIP: CLARA Y TRANSPARENTE ($5 DE DESCUENTO POR CADA 50 PUNTOS) */}
                            <div className="bg-gradient-to-r from-amber-50 to-pink-50 border border-amber-300 rounded-2xl p-3.5 space-y-2 shadow-2xs">
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-amber-950 text-xs flex items-center gap-1.5">
                                  <Icon.Diamond className="w-4 h-4 text-[#FF2E93]" />
                                  <span>Tus Puntos Kaoj VIP: <b>{customerCurrentPoints} pts</b></span>
                                </span>
                                <span className="text-[10px] bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full font-black">
                                  50 pts = $5.00 OFF
                                </span>
                              </div>

                              <p className="text-[11px] text-zinc-700">
                                Recuerda: <b>Por cada 50 puntos acumulados tienes $5.00 de descuento directo</b>.
                              </p>

                              {canRedeemPoints ? (
                                <div className="bg-white border border-amber-300 rounded-xl p-2.5 space-y-2">
                                  <label className="flex items-center justify-between gap-2 cursor-pointer">
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={applyPointsDiscount}
                                        onChange={e => setApplyPointsDiscount(e.target.checked)}
                                        className="w-4 h-4 accent-[#FF2E93] rounded"
                                      />
                                      <span className="text-xs font-extrabold text-zinc-900">
                                        Canjear {activeRedeemBlocks * 50 || 50} puntos por -${(activeRedeemBlocks * 5 || 5).toFixed(2)} de descuento
                                      </span>
                                    </div>
                                    <span className="text-xs font-black text-emerald-700">
                                      -${(applyPointsDiscount ? pointsDiscountAmount : 5).toFixed(2)}
                                    </span>
                                  </label>

                                  {applyPointsDiscount && maxRedeemableBlocks > 1 && (
                                    <div className="flex items-center justify-between pt-1.5 border-t border-zinc-100 text-[11px]">
                                      <span className="text-zinc-600 font-semibold">¿Cuántos bloques de 50 pts usar?</span>
                                      <select
                                        value={redeemBlocksCount}
                                        onChange={e => setRedeemBlocksCount(Number(e.target.value))}
                                        className="border border-amber-300 rounded-lg px-2 py-1 font-bold text-zinc-900 bg-amber-50/50 outline-none"
                                      >
                                        {Array.from({ length: maxRedeemableBlocks }).map((_, idx) => {
                                          const b = idx + 1;
                                          return (
                                            <option key={b} value={b}>
                                              {b * 50} puntos (-${(b * 5).toFixed(2)} USD)
                                            </option>
                                          );
                                        })}
                                      </select>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="bg-white/80 border border-amber-200/70 rounded-xl p-2.5 flex items-center justify-between text-[11px]">
                                  <span className="text-zinc-600">
                                    {customerCurrentPoints > 0
                                      ? `Te faltan ${pointsNeededForNextDiscount} puntos para tus próximos $5.00 de descuento.`
                                      : 'Con esta compra empezarás a acumular puntos para tus $5.00 de descuento.'}
                                  </span>
                                  <span className="font-extrabold text-emerald-700 shrink-0 ml-2">
                                    +{pointsEarnedWithOrder} pts hoy
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* CUPÓN DE DESCUENTO (SIN SUGERIR CUPONES EN EL CHECKOUT) */}
                            <div className="bg-white border border-zinc-200 rounded-2xl p-3 space-y-2">
                              {appliedCoupon ? (
                                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs">
                                  <div className="flex items-center gap-2">
                                    <Icon.Tag className="w-3.5 h-3.5 text-emerald-700" />
                                    <span className="font-black text-emerald-800 tracking-wider uppercase">{appliedCoupon.code}</span>
                                    <span className="text-[11px] text-emerald-700">(-${couponDiscountAmount.toFixed(2)})</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={handleRemoveCoupon}
                                    className="text-[11px] text-red-500 hover:text-red-700 font-bold px-2 py-0.5 rounded hover:bg-red-50"
                                  >
                                    Quitar
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setShowCouponInputBox(!showCouponInputBox)}
                                    className="w-full flex items-center justify-between text-xs font-bold text-zinc-700 hover:text-[#FF2E93] transition"
                                  >
                                    <span className="flex items-center gap-1.5">
                                      <Icon.Tag className="w-3.5 h-3.5 text-[#FF2E93]" />
                                      <span>¿Tienes un código de cupón?</span>
                                    </span>
                                    <span className="text-[10px] text-zinc-400 font-semibold">
                                      {showCouponInputBox ? 'Ocultar ▲' : 'Ingresar código ▼'}
                                    </span>
                                  </button>
                                  {showCouponInputBox && (
                                    <div className="flex gap-2 pt-1.5">
                                      <input
                                        type="text"
                                        placeholder="Ingresa tu código aquí"
                                        value={couponCodeInput}
                                        onChange={e => setCouponCodeInput(e.target.value)}
                                        className="flex-1 border border-zinc-300 rounded-xl px-3 py-2 text-xs bg-zinc-50 focus:bg-white uppercase tracking-wider outline-none focus:border-[#FF2E93]"
                                      />
                                      <button
                                        type="button"
                                        onClick={handleApplyCoupon}
                                        className="bg-zinc-900 hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-2xs"
                                      >
                                        Aplicar
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>

                            {/* SELECCIÓN DE MÉTODO DE PAGO: DEUNA, TRANSFERENCIA BANCARIA, TARJETA (PAYPHONE) */}
                            <div className="bg-white border border-zinc-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                              <label className="font-bold text-zinc-900 text-xs block">
                                Selecciona tu Método de Pago:
                              </label>

                              <div className="grid grid-cols-3 gap-2">
                                <button
                                  type="button"
                                  onClick={() => setCustomer({ ...customer, paymentMethod: 'deuna' })}
                                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                                    customer.paymentMethod === 'deuna'
                                      ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                                      : 'bg-zinc-50 text-zinc-800 border-zinc-200 hover:bg-white'
                                  }`}
                                >
                                  <span className="font-extrabold text-xs">Deuna!</span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                                    customer.paymentMethod === 'deuna' ? 'bg-purple-900/60 text-purple-100' : 'bg-emerald-50 text-emerald-700'
                                  }`}>
                                    Sin recargo
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setCustomer({ ...customer, paymentMethod: 'transferencia' })}
                                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                                    customer.paymentMethod === 'transferencia'
                                      ? 'bg-[#FF2E93] text-white border-[#FF2E93] shadow-sm'
                                      : 'bg-zinc-50 text-zinc-800 border-zinc-200 hover:bg-white'
                                  }`}
                                >
                                  <span className="font-extrabold text-xs leading-tight">Transferencia</span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                                    customer.paymentMethod === 'transferencia' ? 'bg-pink-800/60 text-pink-100' : 'bg-emerald-50 text-emerald-700'
                                  }`}>
                                    Sin recargo
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setCustomer({ ...customer, paymentMethod: 'payphone' })}
                                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                                    customer.paymentMethod === 'payphone'
                                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                                      : 'bg-zinc-50 text-zinc-800 border-zinc-200 hover:bg-white'
                                  }`}
                                >
                                  <span className="font-extrabold text-xs leading-tight">Tarjeta (Payphone)</span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                                    customer.paymentMethod === 'payphone' ? 'bg-[#FF6600] text-white' : 'bg-amber-100 text-amber-900'
                                  }`}>
                                    +{payphoneSurchargePercent}% tarjeta
                                  </span>
                                </button>
                              </div>

                              {/* INSTRUCCIONES Y ACCIONES SEGÚN EL MÉTODO DE PAGO */}
                              {customer.paymentMethod === 'deuna' && (
                                <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-3.5 space-y-2.5 text-center">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-purple-950">Pago directo con Deuna! (Banco Pichincha)</span>
                                    <span className="font-black text-purple-900">${total.toFixed(2)} USD</span>
                                  </div>
                                  {settings.deuna_qr_url && (
                                    <img src={settings.deuna_qr_url} alt="QR Deuna" className="w-36 h-36 mx-auto rounded-xl border border-purple-200 object-contain bg-white p-1.5" />
                                  )}
                                  <a
                                    href={settings.deuna_link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block w-full bg-purple-700 hover:bg-purple-800 text-white py-2.5 rounded-xl font-bold text-xs shadow-xs transition"
                                  >
                                    Abrir App Deuna! y pagar ${total.toFixed(2)}
                                  </a>
                                  <p className="text-[10px] text-purple-800">
                                    Titular: <b>{settings.bank_pichincha_name}</b> • Luego sube la captura de tu comprobante abajo.
                                  </p>
                                </div>
                              )}

                              {customer.paymentMethod === 'transferencia' && (
                                <div className="bg-[#F5F6F8] border border-zinc-200/80 rounded-2xl p-3.5 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <p className="font-bold text-zinc-900 text-xs">Elige tu banco para transferir:</p>
                                    <span className="font-black text-zinc-900 text-xs">${total.toFixed(2)} USD</span>
                                  </div>

                                  {/* SELECTOR VISUAL DE BANCOS CON LOGOS OFICIALES */}
                                  <div className="grid grid-cols-2 gap-2">
                                    {/* BOTÓN BANCO GUAYAQUIL */}
                                    <button
                                      type="button"
                                      onClick={() => setSelectedTransferBank('guayaquil')}
                                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                                        selectedTransferBank === 'guayaquil'
                                          ? 'bg-white border-[#D8006C] ring-2 ring-[#D8006C]/20 shadow-xs'
                                          : 'bg-white/60 border-zinc-200 hover:bg-white opacity-75 hover:opacity-100'
                                      }`}
                                    >
                                      {/* Logo Vectorial Banco Guayaquil */}
                                      <div className="w-9 h-9 rounded-xl bg-[#D8006C] flex items-center justify-center shrink-0 shadow-2xs">
                                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                          <path d="M4 5a2 2 0 012-2h6a5 5 0 013.9 8.12A5.5 5.5 0 0112.5 21H6a2 2 0 01-2-2V5zm4 3v3h4a1.5 1.5 0 000-3H8zm0 6v3.5h4.5a1.75 1.75 0 000-3.5H8z" />
                                        </svg>
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-extrabold text-zinc-900 text-[11px] leading-tight truncate">Banco Guayaquil</p>
                                        <span className="text-[10px] text-[#D8006C] font-bold block">Cuenta Ahorros</span>
                                      </div>
                                    </button>

                                    {/* BOTÓN BANCO PICHINCHA */}
                                    <button
                                      type="button"
                                      onClick={() => setSelectedTransferBank('pichincha')}
                                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                                        selectedTransferBank === 'pichincha'
                                          ? 'bg-white border-[#0F265C] ring-2 ring-[#FFDD00] shadow-xs'
                                          : 'bg-white/60 border-zinc-200 hover:bg-white opacity-75 hover:opacity-100'
                                      }`}
                                    >
                                      {/* Logo Vectorial Banco Pichincha */}
                                      <div className="w-9 h-9 rounded-xl bg-[#FFDD00] border border-amber-300 flex items-center justify-center shrink-0 shadow-2xs">
                                        <svg className="w-5 h-5 text-[#0F265C]" viewBox="0 0 24 24" fill="currentColor">
                                          <path d="M4 4h16v16H4V4zm3.5 3.5v9h3v-3h2.5a3 3 0 000-6H7.5zm3 2.5h2a.75.75 0 010 1.5h-2V10z" />
                                        </svg>
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-extrabold text-[#0F265C] text-[11px] leading-tight truncate">Banco Pichincha</p>
                                        <span className="text-[10px] text-zinc-600 font-bold block">Cuenta Ahorros</span>
                                      </div>
                                    </button>
                                  </div>

                                  {/* TARJETA LIMPIA CON SOLO LOS DATOS DEL BANCO SELECCIONADO */}
                                  {selectedTransferBank === 'guayaquil' ? (
                                    <div className="bg-white rounded-xl border border-pink-200/80 p-3.5 space-y-2.5 shadow-2xs animate-in fade-in">
                                      <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                                        <div className="flex items-center gap-2">
                                          <span className="w-2.5 h-2.5 rounded-full bg-[#D8006C]"></span>
                                          <span className="font-extrabold text-xs text-zinc-900">Banco Guayaquil • Cuenta de Ahorros</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-[#D8006C] bg-pink-50 px-2 py-0.5 rounded-full">Seleccionado</span>
                                      </div>

                                      <div className="flex items-center justify-between bg-[#F5F6F8] rounded-xl p-2.5">
                                        <div>
                                          <span className="text-[10px] text-zinc-500 font-semibold block">Número de Cuenta</span>
                                          <span className="font-mono font-black text-sm text-zinc-900 tracking-wider">{settings.bank_guayaquil_acc}</span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => copyToClipboard(settings.bank_guayaquil_acc, 'Cuenta Banco Guayaquil')}
                                          className="px-3 py-1.5 bg-[#D8006C] hover:bg-[#b5005a] text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 shadow-2xs transition"
                                        >
                                          <Icon.Copy className="w-3.5 h-3.5" /> Copiar Cuenta
                                        </button>
                                      </div>

                                      <div className="flex items-center justify-between text-[11px] pt-0.5">
                                        <div>
                                          <p className="text-zinc-500">Titular: <b className="text-zinc-900">{settings.bank_guayaquil_name}</b></p>
                                          <p className="text-zinc-500">Cédula / RUC: <b className="text-zinc-900 font-mono">{settings.bank_guayaquil_id}</b></p>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => copyToClipboard(settings.bank_guayaquil_id, 'Cédula titular')}
                                          className="text-[10px] font-bold text-zinc-600 hover:text-[#D8006C] bg-zinc-100 hover:bg-pink-50 px-2.5 py-1 rounded-lg flex items-center gap-1 transition"
                                        >
                                          <Icon.Copy className="w-3 h-3" /> Copiar CI
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="bg-white rounded-xl border border-amber-300/80 p-3.5 space-y-2.5 shadow-2xs animate-in fade-in">
                                      <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                                        <div className="flex items-center gap-2">
                                          <span className="w-2.5 h-2.5 rounded-full bg-[#FFDD00] border border-[#0F265C]"></span>
                                          <span className="font-extrabold text-xs text-[#0F265C]">Banco Pichincha • Cuenta de Ahorros</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-[#0F265C] bg-amber-100 px-2 py-0.5 rounded-full">Seleccionado</span>
                                      </div>

                                      <div className="flex items-center justify-between bg-[#F5F6F8] rounded-xl p-2.5">
                                        <div>
                                          <span className="text-[10px] text-zinc-500 font-semibold block">Número de Cuenta</span>
                                          <span className="font-mono font-black text-sm text-[#0F265C] tracking-wider">{settings.bank_pichincha_acc}</span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => copyToClipboard(settings.bank_pichincha_acc, 'Cuenta Banco Pichincha')}
                                          className="px-3 py-1.5 bg-[#0F265C] hover:bg-black text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 shadow-2xs transition"
                                        >
                                          <Icon.Copy className="w-3.5 h-3.5" /> Copiar Cuenta
                                        </button>
                                      </div>

                                      <div className="flex items-center justify-between text-[11px] pt-0.5">
                                        <div>
                                          <p className="text-zinc-500">Titular: <b className="text-zinc-900">{settings.bank_pichincha_name}</b></p>
                                          <p className="text-zinc-500">Cédula / RUC: <b className="text-zinc-900 font-mono">{settings.bank_pichincha_id}</b></p>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => copyToClipboard(settings.bank_pichincha_id, 'Cédula titular')}
                                          className="text-[10px] font-bold text-zinc-600 hover:text-[#0F265C] bg-zinc-100 hover:bg-amber-50 px-2.5 py-1 rounded-lg flex items-center gap-1 transition"
                                        >
                                          <Icon.Copy className="w-3 h-3" /> Copiar CI
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {customer.paymentMethod === 'payphone' && (() => {
                                const amountCents = Math.round(total * 100);
                                const orderRef = 'KAOJ-' + (activeCustomerCode || (customer.phone ? customer.phone.slice(-4) : Date.now().toString().slice(-4)));
                                let payphoneUrl = settings.payphone_link || 'https://payphone.app/';
                                try {
                                  const base = payphoneUrl.trim();
                                  const u = new URL(base.startsWith('http') ? base : `https://${base}`);
                                  u.searchParams.set('amount', amountCents.toString());
                                  u.searchParams.set('amountDollars', total.toFixed(2));
                                  u.searchParams.set('reference', orderRef);
                                  u.searchParams.set('clientTransactionId', orderRef);
                                  if (customer.phone) u.searchParams.set('phone', customer.phone.replace(/\D/g, ''));
                                  if (customer.name) u.searchParams.set('clientName', customer.name);
                                  payphoneUrl = u.toString();
                                } catch (err) {
                                  const sep = payphoneUrl.includes('?') ? '&' : '?';
                                  payphoneUrl = `${payphoneUrl}${sep}amount=${amountCents}&reference=${encodeURIComponent(orderRef)}`;
                                }

                                return (
                                  <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-black text-white border border-zinc-700 rounded-2xl p-4 space-y-3 shadow-lg">
                                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                                      <div className="flex items-center gap-2">
                                        <span className="bg-[#FF6600] text-white text-[10px] font-black px-2 py-0.5 rounded-full tracking-wide">PAYPHONE</span>
                                        <span className="text-xs font-bold text-zinc-200">Tarjeta Débito / Crédito</span>
                                      </div>
                                      <span className="text-[10px] text-zinc-400 font-medium">Visa • MasterCard • Diners</span>
                                    </div>

                                    {/* DESGLOSE CLARO DEL RECARGO POR COMISIÓN DE TARJETA PAYPHONE */}
                                    <div className="bg-zinc-800/90 rounded-xl p-3 space-y-1.5 text-xs border border-zinc-700/70">
                                      <div className="flex justify-between text-zinc-300 text-[11px]">
                                        <span>Subtotal pedido + envío:</span>
                                        <span>${baseTotalBeforeCardFee.toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between text-amber-400 font-semibold text-[11px]">
                                        <span>Recargo comisión tarjeta ({payphoneSurchargePercent}%):</span>
                                        <span>+${payphoneSurchargeAmount.toFixed(2)}</span>
                                      </div>
                                      <div className="flex items-center justify-between pt-1.5 border-t border-zinc-700">
                                        <div>
                                          <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Total con recargo</p>
                                          <p className="text-lg font-black text-white">${total.toFixed(2)} <span className="text-[11px] text-zinc-400 font-normal">USD</span></p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Referencia</p>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              navigator.clipboard.writeText(orderRef);
                                              showToast(`¡Código de referencia ${orderRef} copiado!`);
                                            }}
                                            className="text-xs font-mono font-bold text-[#FF2E93] hover:text-[#ff5aa7] flex items-center gap-1 ml-auto"
                                          >
                                            {orderRef}
                                            <Icon.Copy className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    <a
                                      href={payphoneUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="block w-full text-center bg-gradient-to-r from-[#FF6600] to-[#E05500] hover:brightness-110 text-white py-2.5 rounded-xl font-black text-xs sm:text-sm tracking-wide shadow-lg transition-transform active:scale-98"
                                    >
                                      💳 Pagar ${total.toFixed(2)} con Tarjeta en Payphone
                                    </a>

                                    <div className="pt-1 space-y-2">
                                      <div>
                                        <label className="font-bold text-zinc-300 text-[11px] block mb-1">
                                          Número de Autorización / Referencia de tu pago Payphone *:
                                        </label>
                                        <input
                                          placeholder="Ej. Aut #839201 o celular registrado en Payphone..."
                                          value={customer.payphoneRef}
                                          onChange={e => setCustomer({ ...customer, payphoneRef: e.target.value })}
                                          className="w-full border border-zinc-700 rounded-xl p-2.5 text-xs bg-zinc-800 text-white placeholder-zinc-500 outline-none focus:border-[#FF2E93]"
                                        />
                                      </div>
                                      <p className="text-[10px] text-zinc-400">
                                        💡 Tras completar el pago en Payphone, escribe el código de autorización arriba o adjunta la captura abajo.
                                      </p>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* SUBIDA DE COMPROBANTE DE PAGO CON VISTA PREVIA */}
                              <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3 space-y-2">
                                <p className="font-bold text-amber-950 text-xs flex items-center justify-between">
                                  <span>
                                    {customer.paymentMethod === 'payphone'
                                      ? 'Adjuntar captura de pago Payphone (Opcional si pusiste referencia):'
                                      : 'Sube la captura de tu comprobante de pago *:'}
                                  </span>
                                  {uploading && <span className="text-[10px] text-[#FF2E93] animate-pulse">Subiendo...</span>}
                                </p>
                                <input
                                  type="file"
                                  accept="image/*,application/pdf"
                                  onChange={async e => {
                                    if (e.target.files[0]) {
                                      const url = await uploadFileToSupabase(e.target.files[0], 'receipts');
                                      if (url) setCustomer({ ...customer, receiptUrl: url });
                                    }
                                  }}
                                  className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-zinc-900 file:text-white hover:file:bg-black"
                                />
                                {customer.receiptUrl && (
                                  <div className="flex items-center justify-between bg-white border border-emerald-300 rounded-xl p-2">
                                    <div className="flex items-center gap-2">
                                      <img src={customer.receiptUrl} alt="Comprobante" className="w-9 h-9 rounded-lg object-cover border" onError={e => { e.target.style.display = 'none'; }} />
                                      <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                                        <Icon.Check className="w-3.5 h-3.5" /> Comprobante cargado correctamente
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setCustomer({ ...customer, receiptUrl: '' })}
                                      className="text-[10px] text-red-500 font-bold hover:underline"
                                    >
                                      Cambiar
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* DESGLOSE FINANCIERO COMPLETO Y TRANSPARENTE */}
                            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-1.5 text-xs">
                              <div className="flex justify-between text-zinc-600">
                                <span>Subtotal productos ({cart.reduce((a, b) => a + b.qty, 0)}):</span>
                                <span className="font-bold text-zinc-900">${subtotal.toFixed(2)}</span>
                              </div>

                              {pointsDiscountAmount > 0 && (
                                <div className="flex justify-between text-[#FF2E93] font-bold">
                                  <span>Descuento Puntos VIP ({pointsToRedeemNow} pts):</span>
                                  <span>-${pointsDiscountAmount.toFixed(2)}</span>
                                </div>
                              )}

                              {couponDiscountAmount > 0 && (
                                <div className="flex justify-between text-emerald-700 font-bold">
                                  <span>Cupón promocional ({appliedCoupon?.code}):</span>
                                  <span>-${couponDiscountAmount.toFixed(2)}</span>
                                </div>
                              )}

                              <div className="flex justify-between text-zinc-600">
                                <span className="truncate pr-2">Envío ({deliveryObj?.label}):</span>
                                <span className="font-bold text-zinc-900 shrink-0">
                                  {finalShippingAfterCoupon === 0 ? 'GRATIS ($0.00)' : `$${finalShippingAfterCoupon.toFixed(2)}`}
                                </span>
                              </div>

                              {payphoneSurchargeAmount > 0 && (
                                <div className="flex justify-between text-amber-800 font-bold">
                                  <span>Recargo Tarjeta Payphone (+{payphoneSurchargePercent}%):</span>
                                  <span>+${payphoneSurchargeAmount.toFixed(2)}</span>
                                </div>
                              )}

                              <div className="flex justify-between text-base font-black text-zinc-900 pt-2 border-t border-zinc-200">
                                <span>Total a Pagar:</span>
                                <span className="text-[#FF2E93]">${total.toFixed(2)} USD</span>
                              </div>

                              <div className="pt-1 text-[11px] text-emerald-700 font-bold flex items-center justify-between">
                                <span>Puntos Kaoj que acumulas hoy:</span>
                                <span className="flex items-center gap-1">
                                  <Icon.Diamond className="w-3.5 h-3.5 text-[#FF2E93]" />
                                  <span>+{pointsEarnedWithOrder} pts (50 pts = $5 OFF)</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </form>
                    </>
                  )}
                </div>

                {/* FOOTER FIJO DE NAVEGACIÓN POR PASOS */}
                {cart.length > 0 && (
                  <div className="px-5 py-3.5 border-t border-zinc-200 bg-white z-10 shrink-0">
                    {checkoutStep === 1 && (
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] text-zinc-400 font-bold uppercase block">Subtotal actual</span>
                          <span className="text-base font-black text-zinc-900">${subtotal.toFixed(2)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleGoToStep(2)}
                          className="flex-1 bg-[#FF2E93] hover:bg-[#e0157a] text-white py-3 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 active:scale-98"
                        >
                          <span>Continuar a Envío</span>
                          <Icon.ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {checkoutStep === 2 && (
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleGoToStep(1)}
                          className="px-3.5 py-3 rounded-xl border border-zinc-300 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-bold text-xs flex items-center gap-1 transition"
                        >
                          <Icon.ChevronLeft className="w-4 h-4" />
                          <span>Datos</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGoToStep(3)}
                          className="flex-1 bg-[#FF2E93] hover:bg-[#e0157a] text-white py-3 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 active:scale-98"
                        >
                          <span>Continuar al Pago (${(Math.max(0, subtotal - productDiscounts) + finalShippingAfterCoupon).toFixed(2)})</span>
                          <Icon.ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {checkoutStep === 3 && (
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleGoToStep(2)}
                          className="px-3.5 py-3.5 rounded-xl border border-zinc-300 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-bold text-xs flex items-center gap-1 transition"
                        >
                          <Icon.ChevronLeft className="w-4 h-4" />
                          <span>Envío</span>
                        </button>
                        <button
                          type="submit"
                          form="kaoj-checkout-form"
                          disabled={uploading || isSubmittingOrder}
                          className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 ${
                            uploading || isSubmittingOrder
                              ? 'bg-zinc-400 text-white cursor-not-allowed'
                              : 'bg-[#FF2E93] hover:bg-[#e0157a] text-white active:scale-[0.99]'
                          }`}
                        >
                          {isSubmittingOrder ? (
                            <>
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                              <span>Procesando tu pedido...</span>
                            </>
                          ) : (
                            <>
                              <Icon.WhatsApp className="w-4 h-4 text-white" />
                              <span>Confirmar Pedido (${total.toFixed(2)})</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              MODAL: VISTA RÁPIDA DE PRODUCTO CON SELECTOR DE TONOS/TALLAS
              ========================================================================= */}
          {quickViewProduct && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto" onClick={() => {
              setQuickViewProduct(null);
              if (window.location.hash.startsWith('#/producto/')) {
                window.location.hash = selectedSection === 'TODOS' ? '#/' : selectedSection === 'FAVORITOS' ? '#/favoritos' : `#/seccion/${encodeURIComponent(selectedSection)}`;
              }
            }}>
              <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-zinc-200 flex flex-col md:flex-row relative" onClick={e => e.stopPropagation()}>
                {/* HEADER MÓVIL STICKY (NUNCA SE CORTA EL BOTÓN VOLVER / CERRAR) */}
                <div className="sticky top-0 z-30 flex items-center justify-between p-3 bg-white/95 backdrop-blur-md border-b border-zinc-100 md:hidden w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setQuickViewProduct(null);
                      if (window.location.hash.startsWith('#/producto/')) {
                        window.location.hash = selectedSection === 'TODOS' ? '#/' : selectedSection === 'FAVORITOS' ? '#/favoritos' : `#/seccion/${encodeURIComponent(selectedSection)}`;
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold active:scale-95 transition shadow-2xs"
                  >
                    <Icon.ArrowLeft className="w-3.5 h-3.5" /> <span>Volver</span>
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleShareProduct(quickViewProduct)}
                      className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-700 active:scale-90 transition shadow-xs"
                      title="Compartir producto"
                    >
                      <Icon.Share className="w-4 h-4 text-zinc-700" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(quickViewProduct.id, quickViewProduct.name)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center shadow-xs transition-all active:scale-90 ${
                        favorites.includes(quickViewProduct.id)
                          ? 'bg-rose-50 text-rose-500 border border-rose-200'
                          : 'bg-zinc-100 text-zinc-600 hover:text-rose-500'
                      }`}
                      title={favorites.includes(quickViewProduct.id) ? 'Quitar de Favoritos' : 'Guardar en Favoritos'}
                    >
                      <Icon.Heart
                        className={`w-4 h-4 ${favorites.includes(quickViewProduct.id) ? 'fill-rose-500 text-rose-500' : 'text-zinc-600'}`}
                        filled={favorites.includes(quickViewProduct.id)}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickViewProduct(null);
                        if (window.location.hash.startsWith('#/producto/')) {
                          window.location.hash = selectedSection === 'TODOS' ? '#/' : selectedSection === 'FAVORITOS' ? '#/favoritos' : `#/seccion/${encodeURIComponent(selectedSection)}`;
                        }
                      }}
                      className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-700 active:scale-90 transition shadow-xs"
                      title="Cerrar"
                    >
                      <Icon.Close className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* BOTONES FLOTANTES EN DESKTOP */}
                <div className="hidden md:flex absolute top-3 right-3 items-center gap-2 z-20">
                  <button
                    type="button"
                    onClick={() => handleShareProduct(quickViewProduct)}
                    className="w-8 h-8 rounded-full bg-white/95 hover:bg-white flex items-center justify-center text-zinc-700 hover:text-black shadow-md transition-all active:scale-90 border border-zinc-200/70"
                    title="Compartir producto"
                  >
                    <Icon.Share className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(quickViewProduct.id, quickViewProduct.name)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90 border border-zinc-200/70 ${
                      favorites.includes(quickViewProduct.id)
                        ? 'bg-rose-50 text-rose-600 border-rose-200'
                        : 'bg-white/95 hover:bg-white text-zinc-600 hover:text-rose-600'
                    }`}
                    title={favorites.includes(quickViewProduct.id) ? 'Quitar de Favoritos' : 'Guardar en Favoritos'}
                  >
                    <Icon.Heart
                      className={`w-4 h-4 ${favorites.includes(quickViewProduct.id) ? 'fill-rose-600 text-rose-600' : 'text-zinc-600'}`}
                      filled={favorites.includes(quickViewProduct.id)}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickViewProduct(null);
                      if (window.location.hash.startsWith('#/producto/')) {
                        window.location.hash = selectedSection === 'TODOS' ? '#/' : selectedSection === 'FAVORITOS' ? '#/favoritos' : `#/seccion/${encodeURIComponent(selectedSection)}`;
                      }
                    }}
                    className="w-8 h-8 rounded-full bg-white/95 hover:bg-white flex items-center justify-center text-zinc-700 hover:text-black shadow-md border border-zinc-200/70 active:scale-90 transition"
                    title="Cerrar"
                  >
                    <Icon.Close className="w-4 h-4" />
                  </button>
                </div>

                {(() => {
                  const hasColorAndSize = (quickViewProduct.variants || []).some(v => v.color && v.size);
                  const distinctColors = hasColorAndSize ? Array.from(new Set(quickViewProduct.variants.map(v => v.color).filter(Boolean))) : [];
                  const distinctSizes = hasColorAndSize ? Array.from(new Set(quickViewProduct.variants.map(v => v.size).filter(Boolean))) : [];

                  const modalActive = activeVariants[quickViewProduct.id] || {};
                  const currentColor = hasColorAndSize
                    ? (modalActive.color || (distinctColors.find(c => (quickViewProduct.variants || []).some(v => v.color === c && v.stock > 0))) || distinctColors[0])
                    : null;

                  const currentSize = hasColorAndSize
                    ? (modalActive.size || (distinctSizes.find(s => (quickViewProduct.variants || []).some(v => v.color === currentColor && v.size === s && v.stock > 0))) || distinctSizes[0])
                    : null;

                  const varObj = hasColorAndSize
                    ? ((quickViewProduct.variants || []).find(v => v.color === currentColor && v.size === currentSize) ||
                       (quickViewProduct.variants || []).find(v => v.color === currentColor) ||
                       quickViewProduct.variants?.[0])
                    : ((quickViewProduct.variants || []).find(v => v.name === (quickViewSelectedVar || modalActive.variantName || quickViewProduct.variants?.[0]?.name)) || quickViewProduct.variants?.[0]);

                  const currentVarName = varObj ? varObj.name : (quickViewProduct.variants?.[0]?.name || 'Único');
                  const displayImg = varObj?.image || (hasColorAndSize ? quickViewProduct.variants?.find(v => v.color === currentColor && v.image)?.image : null) || modalActive.image || quickViewProduct.image;
                  const stock = varObj ? varObj.stock : 0;
                  const hasDiscount = Boolean(quickViewProduct.discount_price && Number(quickViewProduct.discount_price) < Number(quickViewProduct.price));
                  const allImages = getProductImages(quickViewProduct);
                  const activePhotoUrl = allImages[quickViewActiveImageIndex] || displayImg || allImages[0];

                  return (
                    <>
                      {/* GALERÍA DE FOTOS: FOTO PRINCIPAL + MINIATURAS + CONTROLES */}
                      <div className="md:w-1/2 flex flex-col bg-gradient-to-b from-zinc-50 to-pink-50/20 border-b md:border-b-0 md:border-r border-zinc-100">
                        {/* FOTO GRANDE PRINCIPAL */}
                        <div className="relative min-h-[280px] sm:min-h-[360px] max-h-[50vh] md:max-h-[65vh] flex-1 flex items-center justify-center p-3 sm:p-5 overflow-hidden">
                          <img
                            src={activePhotoUrl}
                            alt={quickViewProduct.name}
                            className="w-full h-full max-h-[46vh] md:max-h-[60vh] object-contain drop-shadow-sm transition-all duration-300"
                          />

                          {/* FLECHAS DE NAVEGACIÓN ANTERIOR / SIGUIENTE (SI HAY MÁS DE 1 FOTO) */}
                          {allImages.length > 1 && (
                            <>
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  setQuickViewActiveImageIndex((quickViewActiveImageIndex - 1 + allImages.length) % allImages.length);
                                }}
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-zinc-700 shadow-md flex items-center justify-center text-sm font-black active:scale-90 transition border border-zinc-200/80"
                                title="Foto anterior"
                              >
                                <Icon.ChevronLeft className="w-4 h-4 text-zinc-800" />
                              </button>
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  setQuickViewActiveImageIndex((quickViewActiveImageIndex + 1) % allImages.length);
                                }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-zinc-700 shadow-md flex items-center justify-center text-sm font-black active:scale-90 transition border border-zinc-200/80"
                                title="Foto siguiente"
                              >
                                <Icon.ChevronRight className="w-4 h-4 text-zinc-800" />
                              </button>

                              {/* INDICADOR DE FOTO ACTUAL (ej. 1 / 3) */}
                              <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                                {quickViewActiveImageIndex + 1} / {allImages.length}
                              </span>
                            </>
                          )}
                        </div>

                        {/* MINIATURAS (THUMBNAILS) SI HAY MÁS DE 1 FOTO */}
                        {allImages.length > 1 && (
                          <div className="p-2 sm:p-2.5 bg-white/70 backdrop-blur-xs border-t border-zinc-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
                            {allImages.map((imgUrl, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setQuickViewActiveImageIndex(idx)}
                                className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 transition shrink-0 bg-white shadow-2xs ${
                                  quickViewActiveImageIndex === idx
                                    ? 'border-zinc-950 ring-2 ring-zinc-300 scale-105'
                                    : 'border-zinc-200 hover:border-pink-300 opacity-70 hover:opacity-100'
                                }`}
                              >
                                <img src={imgUrl} alt="" className="w-full h-full object-contain p-0.5" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="p-6 md:w-1/2 flex flex-col justify-between space-y-4">
                        <div>
                          <span className="text-[10px] font-extrabold bg-zinc-100 text-zinc-800 px-2.5 py-0.5 rounded-full tracking-wider uppercase">
                            {quickViewProduct.section} • {quickViewProduct.category}
                          </span>
                          <h3 className="font-bold text-xl text-zinc-900 mt-2">{quickViewProduct.name}</h3>
                          <p className="text-xs text-zinc-500 mt-2">{quickViewProduct.description}</p>

                          <div className="mt-3 flex items-baseline gap-2">
                            {hasDiscount ? (
                              <>
                                <span className="text-2xl font-black text-[#FF2E93]">${Number(quickViewProduct.discount_price).toFixed(2)}</span>
                                <span className="line-through text-zinc-400 text-sm">${Number(quickViewProduct.price).toFixed(2)}</span>
                              </>
                            ) : (
                              <span className="text-2xl font-black text-zinc-900">${Number(quickViewProduct.price).toFixed(2)}</span>
                            )}
                          </div>

                          <div className="mt-2 bg-amber-50/90 border border-amber-200 rounded-xl px-3 py-1.5 flex items-center justify-between text-[11px]">
                            <span className="font-bold text-amber-950 flex items-center gap-1">
                              <Icon.Diamond className="w-3.5 h-3.5 text-[#FF2E93]" />
                              <span>Suma +{Math.max(1, Math.floor(Number(quickViewProduct.discount_price || quickViewProduct.price || 0)))} Puntos Kaoj VIP</span>
                            </span>
                            <span className="text-[10px] font-black text-[#FF2E93]">50 pts = $5.00 OFF</span>
                          </div>

                          {/* SELECTOR DE VARIANTES EN MODAL: COLOR Y TALLA SEPARADOS O SIMPLE */}
                          {hasColorAndSize ? (
                            <div className="mt-4 border-t pt-3 space-y-3">
                              {/* PASO 1: SELECCIONAR COLOR */}
                              <div>
                                <div className="flex justify-between items-center text-xs mb-1.5">
                                  <span className="font-semibold text-zinc-700">1. Selecciona Color: <strong className="text-zinc-950">{currentColor}</strong></span>
                                </div>
                                <div className="flex flex-wrap gap-2 p-1">
                                  {distinctColors.map(c => {
                                    const colorVar = (quickViewProduct.variants || []).find(v => v.color === c);
                                    const isColActive = currentColor === c;
                                    const colorStock = (quickViewProduct.variants || []).filter(v => v.color === c).reduce((sum, v) => sum + (v.stock || 0), 0);
                                    return (
                                      <button
                                        key={c}
                                        type="button"
                                        disabled={colorStock <= 0}
                                        onClick={() => {
                                          const matchedVar = (quickViewProduct.variants || []).find(v => v.color === c && v.size === currentSize && v.stock > 0) ||
                                                            (quickViewProduct.variants || []).find(v => v.color === c && v.stock > 0) ||
                                                            (quickViewProduct.variants || []).find(v => v.color === c);
                                          const nextSize = matchedVar ? matchedVar.size : currentSize;
                                          const nextVarName = matchedVar ? matchedVar.name : `${c} - ${nextSize}`;
                                          setQuickViewSelectedVar(nextVarName);
                                          const nextImg = matchedVar?.image || colorVar?.image;
                                          if (nextImg) {
                                            const targetIdx = allImages.indexOf(nextImg);
                                            if (targetIdx !== -1) setQuickViewActiveImageIndex(targetIdx);
                                          }
                                          setActiveVariants({
                                            ...activeVariants,
                                            [quickViewProduct.id]: {
                                              color: c,
                                              size: nextSize,
                                              variantName: nextVarName,
                                              image: matchedVar?.image || colorVar?.image || quickViewProduct.image
                                            }
                                          });
                                        }}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 border-2 ${
                                          isColActive
                                            ? 'border-[#FF007F] bg-pink-50 text-[#FF007F] font-bold shadow-xs'
                                            : colorStock <= 0
                                            ? 'border-zinc-200 bg-zinc-100 text-zinc-400 line-through cursor-not-allowed opacity-60'
                                            : 'border-zinc-200 bg-white hover:border-zinc-950 text-zinc-700'
                                        }`}
                                      >
                                        {colorVar?.image ? (
                                          <img src={colorVar.image} alt="" className="w-5 h-5 rounded-lg object-contain border border-zinc-200 bg-white" />
                                        ) : (
                                          <span className="w-3.5 h-3.5 rounded-full bg-zinc-300"></span>
                                        )}
                                        <span>{c}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* PASO 2: SELECCIONAR TALLA */}
                              <div>
                                <div className="flex justify-between items-center text-xs mb-1.5">
                                  <span className="font-semibold text-zinc-700">2. Selecciona Talla: <strong className="text-zinc-900">{currentSize}</strong></span>
                                  <span className={`text-[11px] font-bold ${
                                    stock <= 0
                                      ? 'text-red-500'
                                      : stock <= 2
                                      ? 'text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-black animate-pulse'
                                      : 'text-emerald-700'
                                  }`}>
                                    {stock <= 0 ? 'Agotada en este color' : stock <= 2 ? `🔥 ¡Solo ${stock} disponibles!` : `Stock disponible: ${stock}`}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {distinctSizes.map(s => {
                                    const combVar = (quickViewProduct.variants || []).find(v => v.color === currentColor && v.size === s);
                                    const combStock = combVar ? (combVar.stock || 0) : 0;
                                    const isSizeActive = currentSize === s;
                                    return (
                                      <button
                                        key={s}
                                        type="button"
                                        disabled={combStock <= 0}
                                        onClick={() => {
                                          const varName = combVar ? combVar.name : `${currentColor} - ${s}`;
                                          setQuickViewSelectedVar(varName);
                                          setActiveVariants({
                                            ...activeVariants,
                                            [quickViewProduct.id]: {
                                              color: currentColor,
                                              size: s,
                                              variantName: varName,
                                              image: combVar?.image || quickViewProduct.image
                                            }
                                          });
                                        }}
                                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition ${
                                          isSizeActive
                                            ? 'border-[#FF007F] bg-[#FF007F] text-white shadow-xs font-black'
                                            : combStock <= 0
                                            ? 'border-zinc-200 bg-zinc-100 text-zinc-300 line-through cursor-not-allowed'
                                            : 'border-zinc-200 text-zinc-700 hover:border-zinc-950 bg-white'
                                        }`}
                                      >
                                        <span>{s}</span>
                                        {combStock > 0 && combStock <= 2 && (
                                          <span className="text-[10px] ml-1 opacity-90">({combStock})</span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* SELECTOR SIMPLE DE TONOS/VARIANTES */
                            <div className="mt-4 border-t pt-3 space-y-2">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-zinc-700">{quickViewProduct.variant_label || 'Tono / Talla'}:</span>
                                <span className={`text-[11px] font-bold ${
                                  stock <= 0
                                    ? 'text-red-500'
                                    : stock <= 2
                                    ? 'text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-black animate-pulse'
                                    : 'text-emerald-700'
                                }`}>
                                  {stock <= 0 ? 'Agotado' : stock <= 2 ? `🔥 ¡Solo ${stock} disponibles!` : `Stock disponible: ${stock}`}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-1.5 p-1">
                                {(quickViewProduct.variants || []).map(v => (
                                  <button
                                    key={v.name}
                                    disabled={v.stock <= 0}
                                    onClick={() => {
                                      setQuickViewSelectedVar(v.name);
                                      if (v.image) {
                                        const targetIdx = allImages.indexOf(v.image);
                                        if (targetIdx !== -1) setQuickViewActiveImageIndex(targetIdx);
                                      }
                                      setActiveVariants({
                                        ...activeVariants,
                                        [quickViewProduct.id]: { variantName: v.name, image: v.image || quickViewProduct.image }
                                      });
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition flex items-center gap-1.5 ${
                                      currentVarName === v.name
                                        ? 'border-[#FF2E93] bg-pink-50 text-[#FF2E93] font-black shadow-xs'
                                        : v.stock <= 0
                                        ? 'border-zinc-200 bg-zinc-100 text-zinc-400 line-through cursor-not-allowed'
                                        : 'border-zinc-200 bg-white hover:border-[#FF2E93] text-zinc-700'
                                    }`}
                                  >
                                    {v.image && <img src={v.image} alt="" className="w-3.5 h-3.5 rounded-full object-cover shrink-0 border border-zinc-200" />}
                                    <span>{v.name}</span>
                                    {v.stock > 0 && v.stock <= 2 && (
                                      <span className="text-[10px] text-amber-700 font-bold ml-0.5">({v.stock})</span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {stock <= 0 ? (
                          <button
                            disabled
                            className="w-full py-3.5 rounded-xl font-bold text-sm bg-zinc-100 text-zinc-400 cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <Icon.Bag className="w-4 h-4" />
                            <span>Producto Agotado</span>
                          </button>
                        ) : (
                          <div className="space-y-2 pt-1">
                            {/* BOTÓN 1: COMPRAR AHORA (Fucsia Oficial Kaoj Store) */}
                            <button
                              onClick={() => addToCart(quickViewProduct, currentVarName, true)}
                              className="w-full py-3.5 rounded-2xl font-bold text-sm bg-[#FF007F] hover:bg-[#E0006E] text-white shadow-lg shadow-pink-500/20 active:scale-98 transition flex items-center justify-center gap-2 tracking-wide"
                            >
                              <Icon.Bag className="w-4 h-4 text-white" />
                              <span>Comprar Ahora ({currentVarName})</span>
                            </button>

                            {/* BOTÓN 2: AGREGAR AL CARRITO (Blanco Chic con borde Fucsia) */}
                            <button
                              type="button"
                              onClick={() => addToCart(quickViewProduct, currentVarName, false)}
                              className="w-full py-2.5 rounded-2xl font-bold text-xs bg-pink-50/60 hover:bg-pink-100/70 text-[#FF007F] border border-pink-300 active:scale-98 transition flex items-center justify-center gap-1.5 shadow-2xs"
                            >
                              <Icon.Plus className="w-3.5 h-3.5 text-[#FF007F]" />
                              <span>Agregar al carrito</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* =========================================================================
              MODAL: RASTREO DE PEDIDOS AUTOMÁTICO & PORTAL DE COMPRAS
              ========================================================================= */}
          {isTrackingOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => { setIsTrackingOpen(false); if (window.location.hash === '#/pedidos') window.location.hash = '#/'; }}>
              <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-zinc-200 relative max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start border-b border-zinc-100 pb-3">
                  <div>
                    <h3 className="font-serif-kaoj text-2xl font-black text-zinc-900">Mis Pedidos & Rastreos</h3>
                    <p className="text-xs text-zinc-500">Historial de compras, estado del envío y calificaciones de productos.</p>
                  </div>
                  <button onClick={() => { setIsTrackingOpen(false); if (window.location.hash === '#/pedidos') window.location.hash = '#/'; }} className="text-zinc-400 hover:text-zinc-700 font-bold text-xl p-1">✕</button>
                </div>

                {/* IDENTIFICACIÓN VIP DE LA CLIENTA O INICIO DE SESIÓN */}
                {user || customerProfile ? (
                  <div className="bg-pink-50/70 border border-pink-200 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-[#FF2E93] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                        {(customerProfile?.name || user?.user_metadata?.full_name || 'K').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 text-xs">{customerProfile?.name || user?.user_metadata?.full_name || 'Clienta Kaoj'}</p>
                        <p className="text-[11px] text-zinc-500">Sesión iniciada • Tus compras se muestran automáticamente</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      {customerProfile?.customer_code && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(customerProfile.customer_code, 'Código VIP')}
                          className="bg-white border border-pink-200 text-[#FF2E93] px-2.5 py-1 rounded-xl text-xs font-black tracking-wider flex items-center gap-1 shadow-2xs hover:bg-pink-100 transition"
                          title="Copiar código"
                        >
                          <Icon.Diamond className="w-3.5 h-3.5" />
                          <span>{customerProfile.customer_code}</span>
                          <Icon.Copy className="w-3 h-3 text-zinc-400" />
                        </button>
                      )}
                      <span className="bg-amber-100 text-amber-900 border border-amber-200 px-2 py-1 rounded-xl text-xs font-black">
                        {customerProfile?.points || 0} pts
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-zinc-800 text-xs">¿Tienes cuenta registrada?</p>
                        <p className="text-[11px] text-zinc-500">Inicia sesión con Google para ver tus compras automáticamente:</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        className="bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-2xs shrink-0 transition"
                      >
                        <Icon.Google className="w-3.5 h-3.5" />
                        <span>Google</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* BUSCADOR DE PEDIDOS POR CELULAR O CÓDIGO */}
                <form onSubmit={e => {
                  e.preventDefault();
                  fetchMyOrders(trackingCode);
                }} className="flex gap-2">
                  <input
                    type="text"
                    value={trackingCode}
                    onChange={e => setTrackingCode(e.target.value)}
                    placeholder="Buscar por celular de WhatsApp, código VIP o pedido..."
                    className="flex-1 border rounded-xl px-3 py-2 text-xs outline-none bg-zinc-50 focus:bg-white focus:border-[#FF2E93] font-bold"
                  />
                  <button
                    type="submit"
                    disabled={trackingLoading}
                    className="bg-zinc-900 hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 shrink-0"
                  >
                    {trackingLoading ? 'Buscando...' : 'Buscar'}
                  </button>
                </form>

                {/* ESTADO DE CARGA */}
                {trackingLoading && (
                  <div className="text-center py-8 space-y-2">
                    <div className="w-7 h-7 border-2 border-[#FF2E93] border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs text-zinc-500 font-medium">Buscando tus pedidos en tiempo real...</p>
                  </div>
                )}

                {/* RESULTADO DE PEDIDOS */}
                {!trackingLoading && trackedOrders && (
                  <div className="space-y-3 pt-1">
                    {trackedOrders.length === 0 ? (
                      <div className="text-center py-6 bg-zinc-50 rounded-2xl border border-zinc-200 p-4 space-y-2">
                        <p className="text-xs font-bold text-zinc-700">No encontramos pedidos registrados con estos datos.</p>
                        <p className="text-[11px] text-zinc-500">Si hiciste tu compra como invitada, ingresa el mismo número de WhatsApp que indicaste al momento de pagar.</p>
                      </div>
                    ) : (
                      trackedOrders.map(o => (
                        <div key={o.id} className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50/50 space-y-3 shadow-2xs hover:border-pink-200 transition">
                          {/* ENCABEZADO DE ORDEN */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/70 pb-2.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-xs text-[#FF2E93]">{o.order_code}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(o.order_code, 'Código de Pedido')}
                                className="text-zinc-400 hover:text-zinc-700 p-1 rounded transition"
                                title="Copiar código"
                              >
                                <Icon.Copy className="w-3 h-3" />
                              </button>
                            </div>
                            <span className={`font-bold text-[10px] sm:text-[11px] uppercase px-2.5 py-0.5 rounded-full border shadow-2xs ${
                              o.status === 'entregado' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                              o.status === 'en_camino' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                              o.status === 'verificado' ? 'bg-purple-50 text-purple-800 border-purple-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                              {o.status === 'entregado' ? '✓ Entregado' :
                               o.status === 'en_camino' ? '🚚 En Camino' :
                               o.status === 'verificado' ? '✓ Pago Verificado' : '⏳ En Verificación'}
                            </span>
                          </div>

                          {/* DATOS RESUMIDOS */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-zinc-600">
                            <div>
                              <span className="text-[10px] text-zinc-400 block font-semibold">Fecha:</span>
                              <span className="font-bold text-zinc-800">{new Date(o.created_at).toLocaleDateString()}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-zinc-400 block font-semibold">Método de Entrega:</span>
                              <span className="font-bold text-zinc-800 truncate block">{o.delivery_method}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-zinc-400 block font-semibold">Total Pagado:</span>
                              <span className="font-black text-[#FF2E93] text-xs">${Number(o.total).toFixed(2)}</span>
                            </div>
                          </div>

                          {/* PRODUCTOS COMPRADOS Y BOTÓN DIRECTO PARA CALIFICAR CADA UNO */}
                          {Array.isArray(o.items) && o.items.length > 0 && (
                            <div className="pt-2 border-t border-zinc-200/70 space-y-2">
                              <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">
                                Productos en este pedido (Toca para calificar):
                              </p>
                              <div className="space-y-1.5">
                                {o.items.map((item, itemIdx) => (
                                  <div key={itemIdx} className="bg-white border border-zinc-200/80 rounded-xl p-2.5 flex items-center justify-between gap-3 shadow-2xs">
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                      <img
                                        src={item.image || 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600'}
                                        alt={item.name}
                                        className="w-10 h-10 rounded-lg object-cover border border-zinc-100 shrink-0"
                                      />
                                      <div className="min-w-0 flex-1">
                                        <p className="font-bold text-zinc-900 text-xs truncate">{item.name}</p>
                                        <p className="text-[11px] text-zinc-500 truncate">{item.variant || 'Estándar'} • {item.qty} un. x ${Number(item.price).toFixed(2)}</p>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setNewReview({
                                          customer_name: customerProfile?.name || o.customer_name || user?.user_metadata?.full_name || '',
                                          customer_code: customerProfile?.customer_code || o.customer_code || '',
                                          product_id: item.productId,
                                          product_name: item.name,
                                          product_image: item.image,
                                          product_variant: item.variant || '',
                                          order_code: o.order_code,
                                          rating: 5,
                                          comment: '',
                                          photo_url: ''
                                        });
                                        setIsReviewModalOpen(true);
                                      }}
                                      className="bg-pink-50 hover:bg-[#FF2E93] text-[#FF2E93] hover:text-white border border-pink-200 hover:border-[#FF2E93] px-3 py-1.5 rounded-xl font-bold text-[11px] transition flex items-center gap-1.5 shrink-0 shadow-2xs"
                                      title="Calificar este producto"
                                    >
                                      <Icon.Star className="w-3.5 h-3.5 text-amber-500" filled={true} />
                                      <span>Calificar</span>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              MODAL: CALIFICAR PRODUCTO VERIFICADO (Social Proof Auténtico sin selector masivo)
              ========================================================================= */}
          {isReviewModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setIsReviewModalOpen(false)}>
              <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl relative text-xs" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b pb-3">
                  <div>
                    <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                      <Icon.Star className="w-4 h-4 text-amber-500" filled={true} /> Calificar Producto
                    </h3>
                    <p className="text-[11px] text-zinc-500">Tu opinión real ayuda a otras clientas a elegir su compra ideal.</p>
                  </div>
                  <button onClick={() => setIsReviewModalOpen(false)} className="font-bold text-zinc-400 hover:text-zinc-700 text-base">✕</button>
                </div>

                <form onSubmit={handleCreateReview} className="space-y-3.5">
                  {/* TARJETA DEL PRODUCTO COMPRADO */}
                  <div className="bg-pink-50/60 border border-pink-200 rounded-2xl p-3 flex items-center gap-3">
                    <img
                      src={newReview.product_image || 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600'}
                      alt={newReview.product_name}
                      className="w-12 h-12 rounded-xl object-cover border border-pink-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                          ✓ Compra Verificada
                        </span>
                        {newReview.order_code && (
                          <span className="text-[9px] text-zinc-500 font-mono">#{newReview.order_code}</span>
                        )}
                      </div>
                      <p className="font-bold text-zinc-900 text-xs truncate mt-0.5">{newReview.product_name || 'Boutique Kaoj'}</p>
                      {newReview.product_variant && (
                        <p className="text-[11px] text-zinc-500">{newReview.product_variant}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Tu Nombre *</label>
                    <input
                      required
                      value={newReview.customer_name}
                      onChange={e => setNewReview({ ...newReview, customer_name: e.target.value })}
                      placeholder="Ej. Valeria Zambrano"
                      className="w-full border rounded-xl p-2.5 outline-none font-bold bg-zinc-50 focus:bg-white focus:border-[#FF2E93]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Calificación en Estrellas *</label>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map(st => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setNewReview({ ...newReview, rating: st })}
                            className="p-1 hover:scale-125 transition-transform"
                          >
                            <Icon.Star className="w-7 h-7" filled={st <= newReview.rating} />
                          </button>
                        ))}
                      </div>
                      <span className="text-xs font-bold text-amber-700">
                        {newReview.rating === 5 ? '¡Excelente! Me encantó ✨' :
                         newReview.rating === 4 ? 'Muy bueno' :
                         newReview.rating === 3 ? 'Bueno' :
                         newReview.rating === 2 ? 'Regular' : 'No me gustó'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Tu Experiencia con el Producto *</label>
                    <textarea
                      required
                      rows="3"
                      value={newReview.comment}
                      onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                      placeholder="Cuéntanos qué tal la fijación, textura, tono o cómo te quedó la prenda..."
                      className="w-full border rounded-xl p-2.5 outline-none resize-none bg-zinc-50 focus:bg-white focus:border-[#FF2E93]"
                    ></textarea>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Foto luciendo tu producto / unboxing (Opcional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async e => {
                        if (e.target.files[0]) {
                          const url = await uploadFileToSupabase(e.target.files[0], 'reviews');
                          if (url) setNewReview({ ...newReview, photo_url: url });
                        }
                      }}
                      className="w-full text-xs"
                    />
                    {newReview.photo_url && (
                      <div className="mt-2 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-2">
                        <img src={newReview.photo_url} alt="Review" className="w-10 h-10 rounded-lg object-cover border" />
                        <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                          <Icon.Check className="w-3.5 h-3.5" /> Foto lista para publicar
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full bg-[#FF2E93] hover:bg-[#e0157a] text-white py-3 rounded-xl font-bold shadow-md transition flex items-center justify-center gap-2"
                  >
                    <Icon.Star className="w-4 h-4 text-amber-300" filled={true} />
                    <span>{uploading ? 'Publicando...' : 'Publicar mi Reseña Verificada'}</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODAL: GUÍA DE ENVÍO OFICIAL SERVIENTREGA (Con Cédula y Print CSS Limpio)
              ========================================================================= */}
          {servientregaOrder && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setServientregaOrder(null)}>
              <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center no-print">
                  <h3 className="font-bold text-base text-zinc-900">Guía de Envío Servientrega</h3>
                  <button onClick={() => setServientregaOrder(null)} className="text-zinc-500 hover:text-zinc-800 p-1 rounded-lg"><Icon.Close className="w-4 h-4" /></button>
                </div>

                <div id="servientrega-print-area" className="border-2 border-emerald-700 rounded-2xl p-5 bg-white text-zinc-900 space-y-4">
                  <div className="flex justify-between items-center border-b-2 border-emerald-700 pb-3">
                    <div>
                      <span className="bg-emerald-700 text-white font-black text-base px-3 py-1 rounded-md tracking-wider">SERVIENTREGA</span>
                      <p className="text-[10px] text-zinc-500 font-semibold mt-1">GUÍA DE ENVÍO NACIONAL</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-sm">{servientregaOrder.order_code}</span>
                    </div>
                  </div>

                  <div className="text-center py-1 bg-zinc-50 rounded-lg border border-dashed border-zinc-300">
                    <p className="font-barcode text-4xl leading-none">*{servientregaOrder.order_code}*</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="border rounded-xl p-3 bg-zinc-50 space-y-1">
                      <p className="font-bold text-emerald-800 text-[11px] uppercase border-b pb-1">REMITENTE:</p>
                      <p className="font-bold">KAOJ STORE BOUTIQUE</p>
                      <p className="text-zinc-600">Portoviejo / Manta - Manabí</p>
                      <p className="text-zinc-600">Tel: {formatDisplayPhone(settings.whatsapp_number)}</p>
                    </div>

                    <div className="border-2 border-emerald-700 rounded-xl p-3 bg-emerald-50/30 space-y-1">
                      <p className="font-bold text-emerald-900 text-[11px] uppercase border-b border-emerald-200 pb-1">DESTINATARIO:</p>
                      <p className="font-bold text-sm">{servientregaOrder.customer_name}</p>
                      <p className="text-zinc-700">Cédula/RUC: <b>{servientregaOrder.customer_id_card || 'Consumidor Final'}</b></p>
                      <p className="text-zinc-700">Celular: <b>{servientregaOrder.customer_phone}</b></p>
                      <p className="text-zinc-700">Dirección: <b>{servientregaOrder.delivery_address || 'Retiro Agencia'}</b></p>
                      <p className="text-emerald-800 font-bold text-[10px]">CÓDIGO VIP: {servientregaOrder.customer_code}</p>
                    </div>
                  </div>

                  <div className="border rounded-xl p-3 text-xs space-y-1">
                    <div className="flex justify-between font-bold border-b pb-1">
                      <span>Contenido Declarado:</span><span>Total: ${Number(servientregaOrder.total).toFixed(2)}</span>
                    </div>
                    <div className="text-[11px] text-zinc-600 pt-1">
                      {(servientregaOrder.items || []).map((it, i) => (
                        <p key={i}>• {it.qty}x {it.name} ({it.variant})</p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 no-print">
                  <button onClick={() => window.print()} className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-xl font-bold text-xs shadow-md">
                    Imprimir Guía (Térmica 10x15 o A4)
                  </button>
                  <button onClick={() => setServientregaOrder(null)} className="bg-zinc-100 text-zinc-700 px-4 py-3 rounded-xl font-bold text-xs">Cerrar</button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODAL: CONFIRMACIÓN DE PEDIDO Y WHATSAPP (Resistente a bloqueadores móviles)
              ========================================================================= */}
          {orderSuccessModal && (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setOrderSuccessModal(null)}>
              <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-zinc-200 relative text-center" onClick={e => e.stopPropagation()}>
                
                {/* ÍCONO DE ÉXITO */}
                <div className="w-16 h-16 mx-auto bg-emerald-50 border-2 border-emerald-400 text-emerald-600 rounded-full flex items-center justify-center shadow-sm">
                  <Icon.Check className="w-8 h-8" />
                </div>

                <div>
                  <span className="text-[10px] font-black tracking-widest text-[#FF2E93] uppercase bg-pink-50 border border-pink-200 px-3 py-1 rounded-full">
                    ¡Orden Guardada con Éxito!
                  </span>
                  <h3 className="font-serif-kaoj text-2xl sm:text-3xl font-extrabold text-zinc-900 mt-2.5">
                    ¡Gracias, {orderSuccessModal.customerName.split(' ')[0]}! ✨
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                    Tu pedido ya está registrado en nuestra boutique. Presiona el botón verde para enviar los datos a nuestro WhatsApp oficial y comenzar a preparar tu paquete:
                  </p>
                </div>

                {/* DETALLES DE LA ORDEN GENERADA */}
                <div className="bg-zinc-50/80 border border-zinc-200 rounded-2xl p-4 text-left space-y-2.5">
                  <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase block">Código de Orden:</span>
                      <span className="text-xl font-black text-[#FF2E93] font-mono tracking-wider">{orderSuccessModal.orderCode}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(orderSuccessModal.orderCode, 'Código de orden')}
                      className="flex items-center gap-1 text-[11px] font-bold text-zinc-600 hover:text-[#FF2E93] bg-white border border-zinc-200 px-2.5 py-1.5 rounded-xl transition shadow-xs"
                    >
                      <Icon.Copy className="w-3.5 h-3.5" /> Copiar
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Código VIP:</span>
                      <span className="font-bold text-zinc-800">{orderSuccessModal.customerCode}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Total a Pagar:</span>
                      <span className="font-extrabold text-zinc-900 text-sm">${orderSuccessModal.total}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Entrega:</span>
                      <span className="font-semibold text-zinc-800 truncate block">{orderSuccessModal.deliveryMethod}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Puntos Ganados:</span>
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <Icon.Diamond className="w-3 h-3 text-[#FF2E93]" /> +{orderSuccessModal.pointsEarned} pts
                      </span>
                    </div>
                  </div>
                </div>

                {/* BOTÓN WHATSAPP DESTACADO (CLIC DIRECTO) */}
                <div className="space-y-2.5 pt-1">
                  <a
                    href={orderSuccessModal.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white py-3.5 px-4 rounded-2xl font-black text-sm shadow-md transition flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95"
                  >
                    <Icon.WhatsApp className="w-5 h-5 text-white" />
                    <span>Enviar Pedido a WhatsApp</span>
                  </a>

                  <div className="flex gap-2 text-xs">
                    <button
                      onClick={() => {
                        const code = orderSuccessModal.orderCode;
                        setOrderSuccessModal(null);
                        setTrackingCode(code);
                        setIsTrackingOpen(true);
                        window.location.hash = '#/pedidos';
                      }}
                      className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 py-2.5 rounded-xl font-bold transition"
                    >
                      📦 Rastrear Pedido
                    </button>
                    <button
                      onClick={() => {
                        setOrderSuccessModal(null);
                        if (window.location.hash === '#/pedidos') window.location.hash = '#/';
                      }}
                      className="px-4 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl font-bold transition"
                    >
                      Seguir Comprando
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* BOTÓN FLOTANTE WHATSAPP OFICIAL DINÁMICO (+593) */}
          <a
            href={`https://wa.me/${formatWhatsAppPhone(settings.whatsapp_number)}?text=${encodeURIComponent('Hola Kaoj Store, quisiera consultar sobre sus productos y catálogo.')}`}
            target="_blank"
            rel="noreferrer"
            className="fixed bottom-6 right-6 z-40 bg-zinc-900 hover:bg-black text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition duration-200"
            title="WhatsApp Kaoj Store"
          >
            <Icon.WhatsApp className="w-6 h-6 text-emerald-400" />
          </a>

          {/* NOTIFICACIÓN TOAST DINÁMICO */}
          {toast && (
            <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 text-xs px-4 py-3 rounded-2xl shadow-2xl border transition-all max-w-sm ${
              toast.type === 'error'
                ? 'bg-zinc-950 text-red-300 border-red-500'
                : toast.type === 'info'
                ? 'bg-zinc-900 text-zinc-100 border-pink-500/50'
                : 'bg-zinc-900 text-white border-zinc-800'
            }`}>
              {toast.type === 'error' ? (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-xs shrink-0">!</span>
              ) : (
                <Icon.Check className="w-4 h-4 text-[#FF2E93] shrink-0" />
              )}
              <p className="font-semibold leading-tight">{toast.message}</p>
            </div>
          )}

          {/* BANNER FLOTANTE DE INSTALACIÓN PWA (1-CLIC ANDROID & GUÍA IOS) */}
          {showInstallBanner && (
            <div className="fixed bottom-4 left-4 right-4 sm:right-auto sm:left-4 sm:max-w-md z-40">
              <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 text-white p-3.5 rounded-3xl border border-pink-500/30 shadow-2xl flex items-center justify-between gap-3">
                <img
                  src="icons/icon-192.png"
                  alt="Kaoj Store"
                  className="w-11 h-11 rounded-2xl shadow-md border border-white/10 shrink-0 object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs text-white">Kaoj Store App</span>
                    <span className="text-[9px] bg-[#FF2E93] text-white px-1.5 py-0.2 rounded-full font-black">PWA</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 truncate">
                    {isIosDevice ? 'Agrega la app a tu pantalla de inicio' : 'Instala la app para comprar más rápido'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleInstallApp}
                    className="bg-[#FF2E93] hover:bg-[#e0157a] text-white text-xs font-black px-3.5 py-2 rounded-xl shadow-md transition active:scale-95"
                  >
                    Instalar
                  </button>
                  <button
                    type="button"
                    onClick={handleDismissInstall}
                    className="text-zinc-400 hover:text-white p-1 rounded-lg text-sm"
                    title="Cerrar"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Guía modal desplegable para iPhone / iOS Safari */}
              {showIosGuide && (
                <div className="mt-2 bg-white text-zinc-900 p-4 rounded-2xl border border-pink-200 shadow-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center font-bold text-zinc-800">
                    <span className="flex items-center gap-1 text-[#FF2E93]">
                      📲 Cómo instalar en iPhone / Safari:
                    </span>
                    <button type="button" onClick={() => setShowIosGuide(false)} className="text-zinc-400 hover:text-zinc-600 font-bold">✕</button>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-zinc-600 text-[11px] leading-relaxed">
                    <li className="flex items-center gap-1.5 flex-wrap">Toca el botón <b>Compartir</b> <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-pink-50 border border-pink-200 text-[#FF007F] rounded-md font-bold text-[10px]"><Icon.Share className="w-3 h-3" /> Compartir</span> en Safari.</li>
                    <li className="flex items-center gap-1.5 flex-wrap">Desliza hacia abajo y pulsa <b>"Agregar a inicio"</b> <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-pink-50 border border-pink-200 text-[#FF007F] rounded-md font-bold text-[10px]"><Icon.Plus className="w-3 h-3" /> Agregar</span>.</li>
                    <li>Toca <b>"Agregar"</b> arriba a la derecha. ¡Listo!</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* FOOTER BOUTIQUE */}
          <footer className="bg-white border-t border-zinc-200/80 mt-16 text-xs text-zinc-500 py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <h4 className="font-serif-kaoj text-2xl font-black text-[#FF2E93]">KAOJ STORE</h4>
                <p>Maquillaje de alta gama, accesorios chic y moda boutique. Entregas en Portoviejo, ULEAM Manta, San Jacinto y envíos por Cooperativa o Servientrega a todo el Ecuador.</p>
              </div>

              <div>
                <h5 className="font-bold text-zinc-900 mb-2">Boutique & Departamentos</h5>
                <ul className="space-y-1">
                  <li>Maquillajes (Labiales, Gloss, Rubores, Delineadores...)</li>
                  <li>Accesorios (Vinchas, Cintillos acolchados)</li>
                  <li>Ropa Chic (Blusas satinadas, Vestidos, Conjuntos)</li>
                  <li className="pt-1.5">
                    <button
                      onClick={() => {
                        window.location.hash = '#/quienes-somos';
                        document.getElementById('quienes-somos')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-[#FF2E93] hover:underline font-bold text-xs flex items-center gap-1"
                    >
                      ✨ Conoce Quiénes Somos
                    </button>
                  </li>
                </ul>
              </div>

              <div className="space-y-1">
                <h5 className="font-bold text-zinc-900 mb-2">Contacto Oficial</h5>
                <p>WhatsApp: <b>{formatDisplayPhone(settings.whatsapp_number)}</b></p>
                <p>Email: <b>{settings.email_contact || 'kaoj.store.ecu@gmail.com'}</b></p>
                <p className="text-[11px] text-zinc-400">Atención personalizada y asesoría de compra</p>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 mt-8 border-t border-zinc-100 flex flex-col sm:flex-row justify-between items-center gap-2 text-zinc-400 text-[11px]">
              <p>© 2026 KAOJ STORE. Todos los derechos reservados.</p>

              {/* ACCESO DISCRETO ADMINISTRADOR */}
              <button
                onClick={() => {
                  if (sessionStorage.getItem('kaoj_admin_authenticated') === 'true') {
                    setIsAdmin(true);
                    window.location.hash = '#/admin';
                  } else {
                    setShowPinModal(true);
                  }
                }}
                className="text-zinc-400 hover:text-zinc-600 transition flex items-center gap-1 opacity-40 hover:opacity-100"
                title="Gestión interna"
              >
                <Icon.Lock className="w-3 h-3" />
                <span>Gestión interna</span>
              </button>
            </div>
          </footer>

        </div>
      );
    }

    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  