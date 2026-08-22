export const defaultWeddingImages = {
  hero: [
    {
      label: "Editorial clássico",
      value: "/images/defaults/wedding-hero-default.png"
    },
    {
      label: "Capela elegante",
      value: "/images/defaults/ceremony-chapel-default.png"
    },
    {
      label: "Recepção iluminada",
      value: "/images/defaults/reception-hall-default.png"
    }
  ],
  ceremony: [
    {
      label: "Capela elegante",
      value: "/images/defaults/ceremony-chapel-default.png"
    },
    {
      label: "Editorial clássico",
      value: "/images/defaults/wedding-hero-default.png"
    },
    {
      label: "Salão iluminado",
      value: "/images/defaults/reception-hall-default.png"
    }
  ],
  reception: [
    {
      label: "Salão iluminado",
      value: "/images/defaults/reception-hall-default.png"
    },
    {
      label: "Editorial clássico",
      value: "/images/defaults/wedding-hero-default.png"
    },
    {
      label: "Capela elegante",
      value: "/images/defaults/ceremony-chapel-default.png"
    }
  ],
  gift: [
    {
      label: "Presentes simbólicos",
      value: "/images/defaults/gift-symbolic-default.png"
    },
    {
      label: "Lua de mel",
      value: "/images/defaults/gift-honeymoon-travel.png"
    },
    {
      label: "Jantar romântico",
      value: "/images/defaults/gift-romantic-dinner.png"
    },
    {
      label: "Casa nova",
      value: "/images/defaults/gift-new-home.png"
    },
    {
      label: "Eletrodomésticos",
      value: "/images/defaults/gift-kitchen-appliance.png"
    },
    {
      label: "Mesa posta",
      value: "/images/defaults/gift-tableware.png"
    },
    {
      label: "Café da manhã",
      value: "/images/defaults/gift-breakfast.png"
    },
    {
      label: "Spa",
      value: "/images/defaults/gift-spa-day.png"
    }
  ]
};

export const giftPresets = [
  {
    id: "honeymoon-quota",
    title: "Cota para a lua de mel",
    description: "Ajude o casal a viver dias inesquecíveis na primeira viagem depois do casamento.",
    amount: "300,00",
    category: "travel",
    imageUrl: "/images/defaults/gift-honeymoon-travel.png"
  },
  {
    id: "romantic-dinner",
    title: "Jantar romântico",
    description: "Uma noite especial para o casal celebrar a nova fase com calma e carinho.",
    amount: "250,00",
    category: "experience",
    imageUrl: "/images/defaults/gift-romantic-dinner.png"
  },
  {
    id: "new-home-quota",
    title: "Ajuda para a casa nova",
    description: "Uma contribuição para montar o novo lar com itens essenciais.",
    amount: "200,00",
    category: "home",
    imageUrl: "/images/defaults/gift-new-home.png"
  },
  {
    id: "kitchen-appliance",
    title: "Eletrodoméstico para a cozinha",
    description: "Ajude o casal a equipar a cozinha para a rotina do novo lar.",
    amount: "350,00",
    category: "home",
    imageUrl: "/images/defaults/gift-kitchen-appliance.png"
  },
  {
    id: "bedding-set",
    title: "Jogo de cama especial",
    description: "Um presente clássico para deixar a casa nova mais aconchegante.",
    amount: "180,00",
    category: "home",
    imageUrl: "/images/defaults/gift-new-home.png"
  },
  {
    id: "tableware-set",
    title: "Jogo de jantar",
    description: "Uma contribuição para receber família e amigos em momentos especiais.",
    amount: "280,00",
    category: "home",
    imageUrl: "/images/defaults/gift-tableware.png"
  },
  {
    id: "breakfast-experience",
    title: "Café da manhã especial",
    description: "Um mimo para o casal aproveitar depois da festa ou durante a viagem.",
    amount: "120,00",
    category: "experience",
    imageUrl: "/images/defaults/gift-breakfast.png"
  },
  {
    id: "spa-day",
    title: "Dia de spa para o casal",
    description: "Uma experiência relaxante para recuperar as energias depois da celebração.",
    amount: "400,00",
    category: "experience",
    imageUrl: "/images/defaults/gift-spa-day.png"
  },
  {
    id: "airfare-quota",
    title: "Cota de passagem aérea",
    description: "Ajude o casal com deslocamentos da lua de mel.",
    amount: "500,00",
    category: "travel",
    imageUrl: "/images/defaults/gift-honeymoon-travel.png"
  },
  {
    id: "free-contribution",
    title: "Contribuição livre",
    description: "Uma contribuição simbólica para os planos do casal.",
    amount: "100,00",
    category: "cash",
    imageUrl: "/images/defaults/gift-symbolic-default.png"
  }
] as const;

export function getDefaultGiftImage(category: string, title = "") {
  const normalizedTitle = title.trim().toLowerCase();

  if (normalizedTitle.includes("eletro") || normalizedTitle.includes("cozinha")) {
    return "/images/defaults/gift-kitchen-appliance.png";
  }

  if (normalizedTitle.includes("passagem") || normalizedTitle.includes("lua de mel") || category === "travel") {
    return "/images/defaults/gift-honeymoon-travel.png";
  }

  if (normalizedTitle.includes("café") || normalizedTitle.includes("cafe")) {
    return "/images/defaults/gift-breakfast.png";
  }

  if (normalizedTitle.includes("spa")) {
    return "/images/defaults/gift-spa-day.png";
  }

  if (normalizedTitle.includes("jogo de jantar") || normalizedTitle.includes("mesa")) {
    return "/images/defaults/gift-tableware.png";
  }

  if (normalizedTitle.includes("jantar")) {
    return "/images/defaults/gift-romantic-dinner.png";
  }

  if (category === "home") {
    return "/images/defaults/gift-new-home.png";
  }

  return defaultWeddingImages.gift[0].value;
}
