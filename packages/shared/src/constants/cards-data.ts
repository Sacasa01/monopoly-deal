import {
  ActionType,
  Card,
  CardType,
  MoneyCard,
  PropertyColor,
  RentCard,
  StandardPropertyCard,
  WildPropertyCard,
  ActionCard
} from '../types/card.js';

export interface CardTemplate {
  templateId: string;
  name: string;
  type: CardType;
  value: number;
  imagePath: string;
  count: number;
  // Specific attributes:
  color?: PropertyColor;
  colors?: PropertyColor[] | 'ALL';
  rentTarget?: 'ALL_PLAYERS' | 'SINGLE_PLAYER';
  actionType?: ActionType;
}

export const CARD_TEMPLATES: CardTemplate[] = [
  // --- 1. MONEY (20 CARDS, $57M TOTAL) ---
  {
    templateId: 'money-1m',
    name: 'Dinero $1M',
    type: CardType.MONEY,
    value: 1,
    imagePath: 'dinero/Dinero_1M.jpg',
    count: 6
  },
  {
    templateId: 'money-2m',
    name: 'Dinero $2M',
    type: CardType.MONEY,
    value: 2,
    imagePath: 'dinero/Dinero_2M.jpg',
    count: 5
  },
  {
    templateId: 'money-3m',
    name: 'Dinero $3M',
    type: CardType.MONEY,
    value: 3,
    imagePath: 'dinero/Dinero_3M.jpg',
    count: 3
  },
  {
    templateId: 'money-4m',
    name: 'Dinero $4M',
    type: CardType.MONEY,
    value: 4,
    imagePath: 'dinero/Dinero_4M.jpg',
    count: 3
  },
  {
    templateId: 'money-5m',
    name: 'Dinero $5M',
    type: CardType.MONEY,
    value: 5,
    imagePath: 'dinero/Dinero_5M.jpg',
    count: 2
  },
  {
    templateId: 'money-10m',
    name: 'Dinero $10M',
    type: CardType.MONEY,
    value: 10,
    imagePath: 'dinero/Dinero_10M.jpg',
    count: 1
  },

  // --- 2. STANDARD PROPERTIES (28 CARDS) ---
  // Brown (2)
  {
    templateId: 'prop-lavapies',
    name: 'Plaza de Lavapiés',
    type: CardType.PROPERTY,
    value: 1,
    color: PropertyColor.BROWN,
    imagePath: 'propiedades/Propiedad_Lavapies.jpg',
    count: 1
  },
  {
    templateId: 'prop-ronda-valencia',
    name: 'Ronda de Valencia',
    type: CardType.PROPERTY,
    value: 1,
    color: PropertyColor.BROWN,
    imagePath: 'propiedades/Propiedad_Ronda_de_Valencia.jpg',
    count: 1
  },
  // Light Blue (3)
  {
    templateId: 'prop-cuatro-caminos',
    name: 'Glorieta de Cuatro Caminos',
    type: CardType.PROPERTY,
    value: 1,
    color: PropertyColor.LIGHT_BLUE,
    imagePath: 'propiedades/Propiedad_Glorieta_Cuatro_Caminos.jpg',
    count: 1
  },
  {
    templateId: 'prop-reina-victoria',
    name: 'Avenida Reina Victoria',
    type: CardType.PROPERTY,
    value: 1,
    color: PropertyColor.LIGHT_BLUE,
    imagePath: 'propiedades/Propiedad_Avenida_Reina_Victoria.jpg',
    count: 1
  },
  {
    templateId: 'prop-bravo-murillo',
    name: 'Calle Bravo Murillo',
    type: CardType.PROPERTY,
    value: 1,
    color: PropertyColor.LIGHT_BLUE,
    imagePath: 'propiedades/Propiedad_Calle_Bravo_Murillo.jpg',
    count: 1
  },
  // Pink (3)
  {
    templateId: 'prop-bilbao',
    name: 'Glorieta de Bilbao',
    type: CardType.PROPERTY,
    value: 2,
    color: PropertyColor.PINK,
    imagePath: 'propiedades/Propiedad_Glorieta_Bilbao.jpg',
    count: 1
  },
  {
    templateId: 'prop-alberto-aguilera',
    name: 'Calle Alberto Aguilera',
    type: CardType.PROPERTY,
    value: 2,
    color: PropertyColor.PINK,
    imagePath: 'propiedades/Propiedad_Calle_Alberto_Aguilera.jpg',
    count: 1
  },
  {
    templateId: 'prop-fuencarral',
    name: 'Calle Fuencarral',
    type: CardType.PROPERTY,
    value: 2,
    color: PropertyColor.PINK,
    imagePath: 'propiedades/Propiedad_Calle_Fuencarral.jpg',
    count: 1
  },
  // Orange (3)
  {
    templateId: 'prop-felipe-ii',
    name: 'Avenida de Felipe II',
    type: CardType.PROPERTY,
    value: 2,
    color: PropertyColor.ORANGE,
    imagePath: 'propiedades/Propiedad_Calle_Felipe_II.jpg',
    count: 1
  },
  {
    templateId: 'prop-velazquez',
    name: 'Calle Velázquez',
    type: CardType.PROPERTY,
    value: 2,
    color: PropertyColor.ORANGE,
    imagePath: 'propiedades/Propiedad_Calle_Velazquez.jpg',
    count: 1
  },
  {
    templateId: 'prop-serrano',
    name: 'Calle Serrano',
    type: CardType.PROPERTY,
    value: 2,
    color: PropertyColor.ORANGE,
    imagePath: 'propiedades/Propiedad_Calle_Serrano.jpg',
    count: 1
  },
  // Red (3)
  {
    templateId: 'prop-gran-via',
    name: 'Gran Vía',
    type: CardType.PROPERTY,
    value: 3,
    color: PropertyColor.RED,
    imagePath: 'propiedades/Propiedad_Gran_Via.jpg',
    count: 1
  },
  {
    templateId: 'prop-alcala',
    name: 'Calle Alcalá',
    type: CardType.PROPERTY,
    value: 3,
    color: PropertyColor.RED,
    imagePath: 'propiedades/Propiedad_Calle_Alcala.jpg',
    count: 1
  },
  {
    templateId: 'prop-plaza-espana',
    name: 'Plaza de España',
    type: CardType.PROPERTY,
    value: 3,
    color: PropertyColor.RED,
    imagePath: 'propiedades/Propiedad_Plaza_Espana.jpg',
    count: 1
  },
  // Yellow (3)
  {
    templateId: 'prop-montera',
    name: 'Calle Montera',
    type: CardType.PROPERTY,
    value: 3,
    color: PropertyColor.YELLOW,
    imagePath: 'propiedades/Propiedad_Calle_Montera.jpg',
    count: 1
  },
  {
    templateId: 'prop-puerta-sol',
    name: 'Puerta del Sol',
    type: CardType.PROPERTY,
    value: 3,
    color: PropertyColor.YELLOW,
    imagePath: 'propiedades/Propiedad_Puerta_del_Sol.jpg',
    count: 1
  },
  {
    templateId: 'prop-plaza-mayor',
    name: 'Plaza Mayor',
    type: CardType.PROPERTY,
    value: 3,
    color: PropertyColor.YELLOW,
    imagePath: 'propiedades/Propiedad_Plaza_Mayor.jpg',
    count: 1
  },
  // Green (3)
  {
    templateId: 'prop-arguelles',
    name: 'Calle Argüelles',
    type: CardType.PROPERTY,
    value: 4,
    color: PropertyColor.GREEN,
    imagePath: 'propiedades/Propiedad_Calle_Arguelles.jpg',
    count: 1
  },
  {
    templateId: 'prop-san-bernardo',
    name: 'Calle San Bernardo',
    type: CardType.PROPERTY,
    value: 4,
    color: PropertyColor.GREEN,
    imagePath: 'propiedades/Propiedad_Calle_San_Bernardo.jpg',
    count: 1
  },
  {
    templateId: 'prop-goya',
    name: 'Calle Goya',
    type: CardType.PROPERTY,
    value: 4,
    color: PropertyColor.GREEN,
    imagePath: 'propiedades/Propiedad_Calle_Goya.jpg',
    count: 1
  },
  // Dark Blue (2)
  {
    templateId: 'prop-castellana',
    name: 'Paseo de la Castellana',
    type: CardType.PROPERTY,
    value: 4,
    color: PropertyColor.DARK_BLUE,
    imagePath: 'propiedades/Propiedad_Paseo_Castellana.jpg',
    count: 1
  },
  {
    templateId: 'prop-prado',
    name: 'Paseo del Prado',
    type: CardType.PROPERTY,
    value: 4,
    color: PropertyColor.DARK_BLUE,
    imagePath: 'propiedades/Propiedad_Paseo_del_Prado.jpg',
    count: 1
  },
  // Railroads (4)
  {
    templateId: 'prop-atocha',
    name: 'Estación de Atocha',
    type: CardType.PROPERTY,
    value: 2,
    color: PropertyColor.RAILROAD,
    imagePath: 'propiedades/Propiedad_Estacion_Atocha.jpg',
    count: 1
  },
  {
    templateId: 'prop-chamartin',
    name: 'Estación de Chamartín',
    type: CardType.PROPERTY,
    value: 2,
    color: PropertyColor.RAILROAD,
    imagePath: 'propiedades/Propiedad_Estacion_Chamartin.jpg',
    count: 1
  },
  {
    templateId: 'prop-delicias',
    name: 'Estación de Delicias',
    type: CardType.PROPERTY,
    value: 2,
    color: PropertyColor.RAILROAD,
    imagePath: 'propiedades/Propiedad_Estacion_Delicias.jpg',
    count: 1
  },
  {
    templateId: 'prop-principe-pio',
    name: 'Estación de Príncipe Pío',
    type: CardType.PROPERTY,
    value: 2,
    color: PropertyColor.RAILROAD,
    imagePath: 'propiedades/Propiedad_Estacion_Principe_Pio.jpg',
    count: 1
  },
  // Utilities (2)
  {
    templateId: 'prop-aguas',
    name: 'Compañía de Aguas',
    type: CardType.PROPERTY,
    value: 2,
    color: PropertyColor.UTILITY,
    imagePath: 'propiedades/Propiedad_Compania_de_Aguas.jpg',
    count: 1
  },
  {
    templateId: 'prop-electricidad',
    name: 'Compañía de Electricidad',
    type: CardType.PROPERTY,
    value: 2,
    color: PropertyColor.UTILITY,
    imagePath: 'propiedades/Propiedad_Compania_de_Electricidad.jpg',
    count: 1
  },

  // --- 3. PROPERTY WILDCARDS (11 CARDS) ---
  {
    templateId: 'wild-brown-lightblue',
    name: 'Comodín Marrón / Azul Claro',
    type: CardType.PROPERTY_WILD,
    value: 1,
    colors: [PropertyColor.BROWN, PropertyColor.LIGHT_BLUE],
    imagePath: 'comodines/Comodin_Marron_Azul_Claro.jpg',
    count: 1
  },
  {
    templateId: 'wild-lightblue-railroad',
    name: 'Comodín Azul Claro / Ferrocarril',
    type: CardType.PROPERTY_WILD,
    value: 4,
    colors: [PropertyColor.LIGHT_BLUE, PropertyColor.RAILROAD],
    imagePath: 'comodines/Comodin_Azul_Claro_Ferrocarril.jpg',
    count: 1
  },
  {
    templateId: 'wild-pink-orange',
    name: 'Comodín Rosa / Naranja',
    type: CardType.PROPERTY_WILD,
    value: 2,
    colors: [PropertyColor.PINK, PropertyColor.ORANGE],
    imagePath: 'comodines/Comodin_Rosa_Naranja.jpg',
    count: 2
  },
  {
    templateId: 'wild-red-yellow',
    name: 'Comodín Rojo / Amarillo',
    type: CardType.PROPERTY_WILD,
    value: 3,
    colors: [PropertyColor.RED, PropertyColor.YELLOW],
    imagePath: 'comodines/Comodin_Rojo_Amarillo.jpg',
    count: 2
  },
  {
    templateId: 'wild-green-darkblue',
    name: 'Comodín Verde / Azul Oscuro',
    type: CardType.PROPERTY_WILD,
    value: 4,
    colors: [PropertyColor.GREEN, PropertyColor.DARK_BLUE],
    imagePath: 'comodines/Comodin_Verde_Azul_Oscuro.jpg',
    count: 1
  },
  {
    templateId: 'wild-green-railroad',
    name: 'Comodín Verde / Ferrocarril',
    type: CardType.PROPERTY_WILD,
    value: 4,
    colors: [PropertyColor.GREEN, PropertyColor.RAILROAD],
    imagePath: 'comodines/Comodin_Verde_Ferrocarril.jpg',
    count: 1
  },
  {
    templateId: 'wild-utility-railroad',
    name: 'Comodín Servicios / Ferrocarril',
    type: CardType.PROPERTY_WILD,
    value: 2,
    colors: [PropertyColor.UTILITY, PropertyColor.RAILROAD],
    imagePath: 'comodines/Comodin_Servicios_Ferrocarril.jpg',
    count: 1
  },
  {
    templateId: 'wild-multicolor',
    name: 'Comodín Multicolor 10 Colores',
    type: CardType.PROPERTY_WILD,
    value: 0,
    colors: 'ALL',
    imagePath: 'comodines/Comodin_Multicolor_10_Colores.jpg',
    count: 2
  },

  // --- 4. RENT CARDS (13 CARDS) ---
  {
    templateId: 'rent-brown-lightblue',
    name: 'Renta Marrón / Azul Claro',
    type: CardType.RENT,
    value: 1,
    colors: [PropertyColor.BROWN, PropertyColor.LIGHT_BLUE],
    rentTarget: 'ALL_PLAYERS',
    imagePath: 'rentas/Renta_Marron_Azul_Claro.jpg',
    count: 2
  },
  {
    templateId: 'rent-pink-orange',
    name: 'Renta Rosa / Naranja',
    type: CardType.RENT,
    value: 1,
    colors: [PropertyColor.PINK, PropertyColor.ORANGE],
    rentTarget: 'ALL_PLAYERS',
    imagePath: 'rentas/Renta_Rosa_Naranja.jpg',
    count: 2
  },
  {
    templateId: 'rent-red-yellow',
    name: 'Renta Rojo / Amarillo',
    type: CardType.RENT,
    value: 1,
    colors: [PropertyColor.RED, PropertyColor.YELLOW],
    rentTarget: 'ALL_PLAYERS',
    imagePath: 'rentas/Renta_Rojo_Amarillo.jpg',
    count: 2
  },
  {
    templateId: 'rent-green-darkblue',
    name: 'Renta Verde / Azul Oscuro',
    type: CardType.RENT,
    value: 1,
    colors: [PropertyColor.GREEN, PropertyColor.DARK_BLUE],
    rentTarget: 'ALL_PLAYERS',
    imagePath: 'rentas/Renta_Verde_Azul_Oscuro.jpg',
    count: 2
  },
  {
    templateId: 'rent-railroad-utility',
    name: 'Renta Ferrocarril / Servicios',
    type: CardType.RENT,
    value: 1,
    colors: [PropertyColor.RAILROAD, PropertyColor.UTILITY],
    rentTarget: 'ALL_PLAYERS',
    imagePath: 'rentas/Renta_Ferrocarril_Servicios.jpg',
    count: 2
  },
  {
    templateId: 'rent-wild',
    name: 'Renta Multicolor',
    type: CardType.RENT,
    value: 3,
    colors: 'ALL',
    rentTarget: 'SINGLE_PLAYER',
    imagePath: 'rentas/Renta_Multicolor.jpg',
    count: 3
  },

  // --- 5. ACTION CARDS (34 CARDS) ---
  {
    templateId: 'action-pass-go',
    name: 'Pasa por la Salida',
    type: CardType.ACTION,
    actionType: ActionType.PASS_GO,
    value: 1,
    imagePath: 'acciones/Accion_Pass_Go.jpg',
    count: 10
  },
  {
    templateId: 'action-sly-deal',
    name: 'Robo Astuto',
    type: CardType.ACTION,
    actionType: ActionType.SLY_DEAL,
    value: 3,
    imagePath: 'acciones/Accion_Sly_Deal.jpg',
    count: 3
  },
  {
    templateId: 'action-forced-deal',
    name: 'Trato Forzoso',
    type: CardType.ACTION,
    actionType: ActionType.FORCED_DEAL,
    value: 3,
    imagePath: 'acciones/Accion_Forced_Deal.jpg',
    count: 3
  },
  {
    templateId: 'action-deal-breaker',
    name: 'Robanegocios',
    type: CardType.ACTION,
    actionType: ActionType.DEAL_BREAKER,
    value: 5,
    imagePath: 'acciones/Accion_Deal_Breaker.jpg',
    count: 2
  },
  {
    templateId: 'action-just-say-no',
    name: '¡Di que No!',
    type: CardType.ACTION,
    actionType: ActionType.JUST_SAY_NO,
    value: 4,
    imagePath: 'acciones/Accion_Just_Say_No.jpg',
    count: 3
  },
  {
    templateId: 'action-debt-collector',
    name: 'Cobrador de Deudas',
    type: CardType.ACTION,
    actionType: ActionType.DEBT_COLLECTOR,
    value: 3,
    imagePath: 'acciones/Accion_Debt_Collector.jpg',
    count: 3
  },
  {
    templateId: 'action-birthday',
    name: 'Es mi Cumpleaños',
    type: CardType.ACTION,
    actionType: ActionType.ITS_MY_BIRTHDAY,
    value: 2,
    imagePath: 'acciones/Accion_Its_My_Birthday.jpg',
    count: 3
  },
  {
    templateId: 'action-house',
    name: 'Casa',
    type: CardType.ACTION,
    actionType: ActionType.HOUSE,
    value: 3,
    imagePath: 'acciones/Accion_House.jpg',
    count: 3
  },
  {
    templateId: 'action-hotel',
    name: 'Hotel',
    type: CardType.ACTION,
    actionType: ActionType.HOTEL,
    value: 4,
    imagePath: 'acciones/Accion_Hotel.jpg',
    count: 2
  },
  {
    templateId: 'action-double-rent',
    name: 'Doble Renta',
    type: CardType.ACTION,
    actionType: ActionType.DOUBLE_THE_RENT,
    value: 1,
    imagePath: 'acciones/Accion_Double_The_Rent.jpg',
    count: 2
  }
];

export const CARD_BACK_IMAGE = 'reverso/card-back.jpg';

/**
 * Generates the full 106-card deck with unique IDs.
 */
export function generateFullDeck(): Card[] {
  const deck: Card[] = [];
  let cardCounter = 1;

  for (const template of CARD_TEMPLATES) {
    for (let i = 0; i < template.count; i++) {
      const id = `card-${String(cardCounter).padStart(3, '0')}`;
      cardCounter++;

      switch (template.type) {
        case CardType.MONEY: {
          const moneyCard: MoneyCard = {
            id,
            templateId: template.templateId,
            name: template.name,
            type: CardType.MONEY,
            value: template.value,
            imagePath: template.imagePath
          };
          deck.push(moneyCard);
          break;
        }

        case CardType.PROPERTY: {
          const propCard: StandardPropertyCard = {
            id,
            templateId: template.templateId,
            name: template.name,
            type: CardType.PROPERTY,
            value: template.value,
            color: template.color!,
            imagePath: template.imagePath
          };
          deck.push(propCard);
          break;
        }

        case CardType.PROPERTY_WILD: {
          const colors = template.colors!;
          const initialActiveColor =
            colors === 'ALL' ? PropertyColor.BROWN : colors[0];

          const wildCard: WildPropertyCard = {
            id,
            templateId: template.templateId,
            name: template.name,
            type: CardType.PROPERTY_WILD,
            value: template.value,
            colors,
            activeColor: initialActiveColor,
            imagePath: template.imagePath
          };
          deck.push(wildCard);
          break;
        }

        case CardType.RENT: {
          const rentCard: RentCard = {
            id,
            templateId: template.templateId,
            name: template.name,
            type: CardType.RENT,
            value: template.value,
            colors: template.colors as [PropertyColor, PropertyColor] | 'ALL',
            target: template.rentTarget!,
            imagePath: template.imagePath
          };
          deck.push(rentCard);
          break;
        }

        case CardType.ACTION: {
          const actionCard: ActionCard = {
            id,
            templateId: template.templateId,
            name: template.name,
            type: CardType.ACTION,
            actionType: template.actionType!,
            value: template.value,
            imagePath: template.imagePath
          };
          deck.push(actionCard);
          break;
        }
      }
    }
  }

  return deck;
}
