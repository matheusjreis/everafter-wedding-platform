export const ptBR = {
  common: {
    brandName: "EverAfter"
  },
  marketing: {
    nav: {
      examples: "Exemplos",
      features: "Funcionalidades",
      pricing: "Preços",
      security: "Segurança",
      signIn: "Entrar",
      cta: "Criar site"
    },
    hero: {
      eyebrow: "Plataforma de casamento EverAfter",
      title: "Sua história de amor merece um lugar bonito.",
      description:
        "Crie um site de casamento personalizado, gerencie confirmações de presença, organize presentes simbólicos e ofereça uma experiência elegante do celular ao pagamento.",
      primaryCta: "Criar meu site de casamento",
      secondaryCta: "Ver demonstração",
      imageAlt: "Papelaria de casamento ao lado de um laptop e tablet exibindo um site elegante de casamento.",
      proof: "Pensado para convidados no celular, painéis privados do casal e fluxos de presentes com segurança financeira."
    },
    foundationCards: [
      {
        title: "Multi-tenant desde a base",
        description: "Site, convidados, presentes, arquivos e pagamentos de cada casal ficam isolados desde o início."
      },
      {
        title: "Fundação segura para pagamentos",
        description: "Preços, taxas, status de pagamento e webhooks são tratados somente no servidor."
      },
      {
        title: "Fluxos mobile-first para convidados",
        description: "Site público, RSVP, lista de presentes e checkout Pix são planejados primeiro para telas pequenas."
      }
    ],
    demo: {
      eyebrow: "Prévia do produto",
      title: "Do link do convite ao painel do casal, tudo segue um sistema calmo e consistente.",
      description:
        "O EverAfter conecta a narrativa pública do casamento às ferramentas operacionais que o casal precisa nos bastidores.",
      metrics: [
        { label: "Respostas de RSVP", value: "128" },
        { label: "Presentes pagos", value: "42" },
        { label: "Dias para o casamento", value: "86" }
      ],
      panels: [
        "Site público narrativo",
        "RSVP e presentes no celular",
        "Visão geral do painel do casal"
      ]
    },
    howItWorks: {
      eyebrow: "Como funciona",
      title: "Um caminho simples da configuração à celebração.",
      steps: [
        {
          title: "Crie sua conta",
          description: "Comece com um espaço seguro para o casal e um onboarding guiado."
        },
        {
          title: "Personalize o site do casamento",
          description: "Edite história, agenda, galeria, presentes, RSVP e aparência."
        },
        {
          title: "Compartilhe com os convidados",
          description: "Publique um link amigável que funciona muito bem no celular."
        },
        {
          title: "Gerencie tudo em um só lugar",
          description: "Acompanhe RSVPs, mensagens, pagamentos e status de publicação pelo painel."
        }
      ]
    },
    features: {
      eyebrow: "Funcionalidades",
      title: "Tudo que o primeiro MVP precisa, desenhado como um único produto.",
      items: [
        "Site de casamento personalizado",
        "Lista de presentes",
        "Pagamentos online",
        "RSVP",
        "Galeria de fotos",
        "Detalhes dos eventos",
        "Painel do casal",
        "Experiência mobile-first"
      ]
    },
    templates: {
      eyebrow: "Modelos",
      title: "Um tema bem acabado primeiro, com sistema pronto para crescer.",
      description:
        "O MVP começa com um tema editorial completo e tokens seguros de personalização para cores, tipografia, espaçamento e ordem das seções.",
      styles: ["Jardim Editorial", "Clássico Moderno", "Cerimônia Minimalista"]
    },
    trust: {
      eyebrow: "Segurança e confiança",
      title: "Privacidade e integridade financeira fazem parte da fundação.",
      points: [
        "Os dados de cada casal são isolados com Supabase Auth, PostgreSQL RLS e autorização no servidor.",
        "Preços de presentes e status de pagamento são resolvidos pelo backend, não por entradas do navegador.",
        "Dados de cartão não são armazenados pelo EverAfter; o provedor de pagamento trata os dados sensíveis."
      ]
    },
    testimonials: {
      eyebrow: "Feedback de demonstração",
      title: "Estrutura pronta para depoimentos reais após o lançamento.",
      note: "Conteúdo demonstrativo",
      items: [
        {
          quote: "A prévia do site de casamento parece pessoal sem tornar a configuração complicada.",
          name: "Revisão de portfólio"
        },
        {
          quote: "A direção do painel é clara: RSVPs, presentes e publicação ficam fáceis de acompanhar.",
          name: "Nota de demonstração do produto"
        }
      ]
    },
    faq: {
      eyebrow: "FAQ",
      title: "As primeiras dúvidas dos casais.",
      items: [
        {
          question: "Cada casal terá um painel privado?",
          answer: "Sim. A plataforma é planejada com espaços isolados por casal e controle de acesso por perfil."
        },
        {
          question: "Convidados conseguem confirmar presença sem conta?",
          answer: "Sim. Os fluxos de convidados são públicos, escopados, validados e separados dos dados do painel."
        },
        {
          question: "Pix e cartão serão suportados?",
          answer: "A arquitetura suporta ambos, mas o provedor final será aprovado antes da integração de produção."
        },
        {
          question: "O site poderá ter outros idiomas no futuro?",
          answer: "Sim. Os textos ficam centralizados desde o início para permitir novos idiomas sem reescrever componentes."
        }
      ]
    },
    finalCta: {
      title: "Comece com um site bonito. Mantenha a gestão tranquila.",
      description: "O EverAfter está sendo construído como um SaaS de portfólio com privacidade, qualidade mobile e segurança de pagamentos.",
      cta: "Criar meu site de casamento"
    },
    footer: {
      rights: "Projeto de portfólio EverAfter. Todos os direitos reservados.",
      links: ["Termos", "Privacidade", "Contato"]
    }
  }
} as const;
