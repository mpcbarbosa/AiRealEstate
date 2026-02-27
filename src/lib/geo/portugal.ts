export interface Freguesia {
  nome: string
  codigo?: string
}

export interface Concelho {
  nome: string
  codigo?: string
  freguesias: Freguesia[]
}

export interface Regiao {
  nome: string
  codigo: string
  concelhos: Concelho[]
}

export const PORTUGAL_GEO: Regiao[] = [
  {
    nome: "Lisboa",
    codigo: "PT17",
    concelhos: [
      { nome: "Lisboa", freguesias: [
        { nome: "Ajuda" }, { nome: "Alcântara" }, { nome: "Arroios" }, { nome: "Avenidas Novas" },
        { nome: "Beato" }, { nome: "Belém" }, { nome: "Benfica" }, { nome: "Campo de Ourique" },
        { nome: "Campolide" }, { nome: "Carnide" }, { nome: "Estrela" }, { nome: "Lumiar" },
        { nome: "Marvila" }, { nome: "Misericórdia" }, { nome: "Olivais" }, { nome: "Parque das Nações" },
        { nome: "Penha de França" }, { nome: "Santa Clara" }, { nome: "Santa Maria Maior" },
        { nome: "Santo António" }, { nome: "São Domingos de Benfica" }, { nome: "São Vicente" }
      ]},
      { nome: "Cascais", freguesias: [
        { nome: "Alcabideche" }, { nome: "Cascais e Estoril" }, { nome: "Parede" },
        { nome: "São Domingos de Rana" }
      ]},
      { nome: "Sintra", freguesias: [
        { nome: "Agualva e Mira-Sintra" }, { nome: "Algueirão-Mem Martins" }, { nome: "Casal de Cambra" },
        { nome: "Colares" }, { nome: "Massamá e Monte Abraão" }, { nome: "Mira-Sintra" },
        { nome: "Queluz e Belas" }, { nome: "Rio de Mouro" }, { nome: "Santa Maria e São Miguel" },
        { nome: "São João das Lampas e Terrugem" }, { nome: "São Martinho" }, { nome: "Sintra" }
      ]},
      { nome: "Oeiras", freguesias: [
        { nome: "Algés, Linda-a-Velha e Cruz Quebrada-Dafundo" }, { nome: "Barcarena" },
        { nome: "Carnaxide e Queijas" }, { nome: "Oeiras e São Julião da Barra, Paço de Arcos e Caxias" },
        { nome: "Porto Salvo" }, { nome: "Porto Salvo" }
      ]},
      { nome: "Loures", freguesias: [
        { nome: "Camarate, Unhos e Apelação" }, { nome: "Loures" }, { nome: "Moscavide e Portela" },
        { nome: "Odivelas" }, { nome: "Prior Velho" }, { nome: "Sacavém e Prior Velho" },
        { nome: "Santa Iria de Azoia, São João da Talha e Bobadela" }
      ]},
      { nome: "Almada", freguesias: [
        { nome: "Almada, Cova da Piedade, Pragal e Cacilhas" }, { nome: "Charneca de Caparica e Sobreda" },
        { nome: "Costa da Caparica" }, { nome: "Feijó e Laranjeiro" }, { nome: "Trafaria" }
      ]},
      { nome: "Amadora", freguesias: [
        { nome: "Alfragide" }, { nome: "Brandoa" }, { nome: "Buraca" }, { nome: "Damaia" },
        { nome: "Falagueira-Venda Nova" }, { nome: "Mina de Água" }, { nome: "Reboleira" }, { nome: "Venteira" }
      ]},
      { nome: "Setúbal", freguesias: [
        { nome: "Azeitão" }, { nome: "Gâmbia-Pontes-Alto da Guerra" }, { nome: "Setúbal" }
      ]},
      { nome: "Sesimbra", freguesias: [{ nome: "Quinta do Conde" }, { nome: "Sesimbra" }]},
      { nome: "Seixal", freguesias: [
        { nome: "Amora" }, { nome: "Arrentela e Aldeia de Paio Pires" }, { nome: "Corroios" },
        { nome: "Fernão Ferro" }, { nome: "Seixal, Arrentela e Aldeia de Paio Pires" }
      ]},
      { nome: "Vila Franca de Xira", freguesias: [
        { nome: "Alhandra, São João dos Montes e Calhandriz" }, { nome: "Alverca do Ribatejo e Sobralinho" },
        { nome: "Castanheira do Ribatejo e Cachoeiras" }, { nome: "Póvoa de Santa Iria e Forte da Casa" },
        { nome: "Vialonga" }, { nome: "Vila Franca de Xira" }
      ]},
      { nome: "Mafra", freguesias: [
        { nome: "Mafra" }, { nome: "Malveira e São Miguel de Alcainça" }, { nome: "Venda do Pinheiro e Santo Estêvão das Galés" }
      ]},
      { nome: "Torres Vedras", freguesias: [
        { nome: "A dos Cunhados e Maceira" }, { nome: "Campelos e Outeiro da Cabeça" },
        { nome: "Torres Vedras" }
      ]},
    ]
  },
  {
    nome: "Porto",
    codigo: "PT11",
    concelhos: [
      { nome: "Porto", freguesias: [
        { nome: "Bonfim" }, { nome: "Campanhã" }, { nome: "Cedofeita, Santo Ildefonso, Sé, Miragaia, São Nicolau e Vitória" },
        { nome: "Lordelo do Ouro e Massarelos" }, { nome: "Paranhos" }, { nome: "Ramalde" }
      ]},
      { nome: "Vila Nova de Gaia", freguesias: [
        { nome: "Arcozelo" }, { nome: "Avintes" }, { nome: "Canelas" }, { nome: "Canidelo" },
        { nome: "Grijó e Sermonde" }, { nome: "Gulpilhares e Valadares" }, { nome: "Mafamude e Vilar do Paraíso" },
        { nome: "Oliveira do Douro" }, { nome: "Pedroso e Seixezelo" }, { nome: "Sandim, Olival, Lever e Crestuma" },
        { nome: "Santa Marinha e São Pedro da Afurada" }, { nome: "Vilar de Andorinho" }
      ]},
      { nome: "Matosinhos", freguesias: [
        { nome: "Custóias, Leça do Balio e Guifões" }, { nome: "Lavra, Santa Cruz do Bispo e Mindelo" },
        { nome: "Matosinhos e Leça da Palmeira" }, { nome: "São Mamede de Infesta e Senhora da Hora" }
      ]},
      { nome: "Maia", freguesias: [
        { nome: "Águas Santas" }, { nome: "Castêlo da Maia" }, { nome: "Maia" },
        { nome: "Moreira" }, { nome: "Nogueira e Silva Escura" }, { nome: "Pedrouços" }
      ]},
      { nome: "Gondomar", freguesias: [
        { nome: "Baguim do Monte" }, { nome: "Fânzeres e São Pedro da Cova" }, { nome: "Gondomar" },
        { nome: "Lomba" }, { nome: "Rio Tinto" }, { nome: "Valbom" }
      ]},
      { nome: "Valongo", freguesias: [
        { nome: "Alfena" }, { nome: "Ermesinde" }, { nome: "Valongo" }
      ]},
      { nome: "Póvoa de Varzim", freguesias: [
        { nome: "Amorim" }, { nome: "Balazar" }, { nome: "Póvoa de Varzim" }
      ]},
      { nome: "Vila do Conde", freguesias: [
        { nome: "Mindelo" }, { nome: "Vila do Conde" }, { nome: "Vila Chã" }
      ]},
      { nome: "Espinho", freguesias: [{ nome: "Espinho" }, { nome: "Anta e Guetim" }]},
    ]
  },
  {
    nome: "Braga",
    codigo: "PT11",
    concelhos: [
      { nome: "Braga", freguesias: [
        { nome: "Braga" }, { nome: "Gualtar" }, { nome: "Maximinos, Sé e Joane" },
        { nome: "Nogueiró e Tenões" }, { nome: "Real, Dume e Semelhe" }, { nome: "São Vítor" }
      ]},
      { nome: "Guimarães", freguesias: [
        { nome: "Azurém" }, { nome: "Creixomil" }, { nome: "Guimarães" },
        { nome: "Lordelo" }, { nome: "Mesão Frio" }
      ]},
      { nome: "Barcelos", freguesias: [{ nome: "Barcelos" }, { nome: "Vila Boa" }]},
      { nome: "Vila Nova de Famalicão", freguesias: [
        { nome: "Calendário" }, { nome: "Joane" }, { nome: "Vila Nova de Famalicão" }
      ]},
    ]
  },
  {
    nome: "Algarve",
    codigo: "PT15",
    concelhos: [
      { nome: "Faro", freguesias: [{ nome: "Faro" }, { nome: "Montenegro" }, { nome: "São Pedro" }]},
      { nome: "Albufeira", freguesias: [
        { nome: "Albufeira e Olhos de Água" }, { nome: "Guia" }, { nome: "Paderne" }
      ]},
      { nome: "Portimão", freguesias: [{ nome: "Alvor" }, { nome: "Mexilhoeira Grande" }, { nome: "Portimão" }]},
      { nome: "Lagos", freguesias: [{ nome: "Lagos" }, { nome: "Odiáxere" }]},
      { nome: "Loulé", freguesias: [
        { nome: "Almancil" }, { nome: "Alte" }, { nome: "Loulé" }, { nome: "Quarteira" }, { nome: "Salir" }
      ]},
      { nome: "Tavira", freguesias: [{ nome: "Santa Maria e Santiago" }, { nome: "Tavira" }]},
      { nome: "Silves", freguesias: [{ nome: "Armação de Pêra" }, { nome: "Silves" }]},
      { nome: "Olhão", freguesias: [{ nome: "Olhão" }, { nome: "Quelfes" }]},
      { nome: "Vila Real de Santo António", freguesias: [
        { nome: "Monte Gordo" }, { nome: "Vila Real de Santo António" }
      ]},
    ]
  },
  {
    nome: "Centro",
    codigo: "PT16",
    concelhos: [
      { nome: "Coimbra", freguesias: [
        { nome: "Coimbra" }, { nome: "Santa Clara" }, { nome: "São Martinho do Bispo e Ribeira de Frades" },
        { nome: "Souselas e Botão" }
      ]},
      { nome: "Aveiro", freguesias: [
        { nome: "Aveiro" }, { nome: "Esgueira" }, { nome: "Glória e Vera Cruz" }
      ]},
      { nome: "Leiria", freguesias: [{ nome: "Leiria" }, { nome: "Marrazes e Barosa" }]},
      { nome: "Viseu", freguesias: [{ nome: "Viseu" }]},
      { nome: "Caldas da Rainha", freguesias: [{ nome: "Caldas da Rainha" }]},
    ]
  },
  {
    nome: "Alentejo",
    codigo: "PT18",
    concelhos: [
      { nome: "Évora", freguesias: [{ nome: "Évora" }]},
      { nome: "Beja", freguesias: [{ nome: "Beja" }]},
      { nome: "Santiago do Cacém", freguesias: [{ nome: "Santiago do Cacém" }]},
    ]
  },
  {
    nome: "Norte",
    codigo: "PT11",
    concelhos: [
      { nome: "Viana do Castelo", freguesias: [{ nome: "Viana do Castelo" }, { nome: "Meadela" }]},
      { nome: "Chaves", freguesias: [{ nome: "Chaves" }]},
      { nome: "Bragança", freguesias: [{ nome: "Bragança" }]},
      { nome: "Vila Real", freguesias: [{ nome: "Vila Real" }]},
    ]
  },
]

// Helpers
export function getAllConcelhos(): { regiao: string; nome: string }[] {
  return PORTUGAL_GEO.flatMap(r => r.concelhos.map(c => ({ regiao: r.nome, nome: c.nome })))
}

export function getConcelhosByRegiao(regiao: string): Concelho[] {
  return PORTUGAL_GEO.find(r => r.nome === regiao)?.concelhos || []
}

export function getFreguesias(regiao: string, concelho: string): Freguesia[] {
  return PORTUGAL_GEO.find(r => r.nome === regiao)
    ?.concelhos.find(c => c.nome === concelho)
    ?.freguesias || []
}
