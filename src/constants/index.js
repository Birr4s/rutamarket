export const CATEGORIES = [
    { id: "frutas", name: "🍎 Frutas & Verduras", color: "#4caf50" },
    { id: "lacteos", name: "🥛 Lácteos", color: "#4fc3f7" },
    { id: "carnes", name: "🥩 Carnes & Pescados", color: "#ff6b6b" },
    { id: "panaderia", name: "🍞 Panadería", color: "#ff9800" },
    { id: "congelados", name: "🧊 Congelados", color: "#81d4fa" },
    { id: "limpieza", name: "🧹 Limpieza", color: "#ce93d8" },
    { id: "bebidas", name: "🥤 Bebidas", color: "#fff176" },
    { id: "conservas", name: "🥫 Conservas", color: "#a1887f" },
    { id: "higiene", name: "🧴 Higiene Personal", color: "#f48fb1" },
    { id: "otros", name: "📦 Otros", color: "#90a4ae" },
];

// Paleta "Consum-like" para el plano (ajústala a los hex finales que decidimos).
export const CONSUM_THEME = {
    brandGreen: "#00A651",
    brandYellow: "#F6C900",
    brandRed: "#E53935",
    ink: "#0f1923",
    bg: "#F7FAFC",
    floor: "#EEF3F7",
    wall: "#2B3A45",
    aisle: "#D6DEE6",
    aisleStroke: "#B7C3CC",
    service: "#00A65122",
    checkout: "#F6C90033",
};

// Layout de ejemplo (coordenadas en "unidades" propias del mapa).
// La idea es que aquí representes tu diseño del almacén (pasillos, zonas, paredes, cajas...)
export const DEFAULT_CONSUM_LAYOUT = {
    width: 1000,
    height: 650,
    shapes: [
        // Pared exterior
        { id: "wall_border_top", kind: "wall", x: 0, y: 0, w: 1000, h: 18 },
        { id: "wall_border_bottom", kind: "wall", x: 0, y: 632, w: 1000, h: 18 },
        { id: "wall_border_left", kind: "wall", x: 0, y: 0, w: 18, h: 650 },
        { id: "wall_border_right", kind: "wall", x: 982, y: 0, w: 18, h: 650 },

        // Cajas / salida (franja inferior)
        { id: "checkout_zone", kind: "checkout", x: 60, y: 560, w: 880, h: 55 },

        // Zona frescos (izquierda)
        { id: "fresh_zone", kind: "service", x: 60, y: 60, w: 260, h: 160, label: "Frescos" },

        // Pasillos centrales
        { id: "aisle_1", kind: "aisle", x: 380, y: 70, w: 90, h: 430 },
        { id: "aisle_2", kind: "aisle", x: 520, y: 70, w: 90, h: 430 },
        { id: "aisle_3", kind: "aisle", x: 660, y: 70, w: 90, h: 430 },
        { id: "aisle_4", kind: "aisle", x: 800, y: 70, w: 90, h: 430 },

        // Lineal perímetro (derecha)
        { id: "perimeter_right", kind: "aisle", x: 930, y: 60, w: 25, h: 470 },
    ],
};

export const DEFAULT_STORES = [
    {
        id: "store1",
        name: "Mercadona Pérez Galdós",
        mapImage: null,
        mapLayout: null,
        favorite: true,
        entrances: [],
        products: [],
    },
];
