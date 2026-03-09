# RutaMarket

RutaMarket es una aplicación web innovadora diseñada para optimizar tu experiencia de compra. Permite a los usuarios mapear sus supermercados favoritos (añadiendo la ubicación de los pasillos, entradas y productos) para, posteriormente, generar la **mejor ruta de compra** posible. Al introducir una lista de la compra, la aplicación calcula el recorrido más eficiente dentro del supermercado, ahorrando tiempo y evitando dar vueltas innecesarias.

## 🏗️ Arquitectura del Proyecto

El proyecto está construido como una Single-Page Application (SPA) modular, dividida en distintas responsabilidades para facilitar su escalabilidad y mantenimiento:

- **Componentes de UI (`src/components/`)**: Elementos visuales reutilizables. Destaca el `MapCanvas.jsx`, encargado de renderizar y gestionar el mapa interactivo del supermercado.
- **Pestañas (`src/components/tabs/`)**: La interfaz principal se divide en tres vistas principales:
  - `TabLista`: Para gestionar la lista de la compra.
  - `TabMapa`: Para crear, editar y visualizar el plano del supermercado (pasillos, entrada, ubicaciones).
  - `TabComprar`: La vista activa de compra, donde se muestra la ruta optimizada paso a paso.
- **Gestión de Estado (`src/hooks/useAppStore.js`)**: Manejo centralizado del estado global de la aplicación (probablemente usando Zustand o Context API), gestionando tiendas, productos y la lista actual.
- **Lógica de Optimización (`src/utils/routeOptimization.js`)**: El núcleo inteligente de la app. Contiene los algoritmos encargados de calcular la ruta más corta entre la entrada del supermercado y todos los productos de la lista.

## 🛠️ Tecnologías Usadas

- **React 18**: Librería principal para la construcción de interfaces de usuario interactivas basadas en componentes.
- **Vite**: Herramienta de construcción (build tool) y servidor de desarrollo. Proporciona un entorno local extremadamente rápido, con Hot Module Replacement (HMR) instantáneo, mejorando significativamente la experiencia del desarrollador en comparación con alternativas más antiguas como Create React App.
- **JavaScript (ES6+)**: Lenguaje principal de desarrollo.
- **CSS-in-JS / Styled Components (via `styles/`)**: Sistema de estilos encapsulado para evitar colisiones y mantener el diseño limpio.

Las propuestas futuras y posibles mejoras de la aplicación se encuentran documentadas en el archivo `propuestas.md`.

## 💻 Guía para el Desarrollo en Local

Sigue estos pasos para arrancar el proyecto en tu máquina local:

### Prerrequisitos
Asegúrate de tener instalado en tu sistema:
- [Node.js](https://nodejs.org/) (se recomienda la versión LTS actual).
- Un gestor de paquetes como `npm` (viene incluido con Node.js).

### Instalación y Ejecución

1. **Clona el repositorio** (o posiciónate en la carpeta del proyecto si ya lo tienes):
   ```
   cd rutamarket-main
   ```

2. **Instala las dependencias**:
   Ejecuta el siguiente comando para descargar e instalar todas las librerías necesarias definidas en el `package.json`.
   ```
   npm install
   ```

3. **Inicia el servidor de desarrollo**:
   Una vez instaladas las dependencias, arranca la aplicación en modo desarrollo.
   ```
   npm run dev
   ```

4. **Accede a la aplicación**:
   Abre tu navegador web y dirígete a la dirección que te proporcione la terminal, típicamente:
   `http://localhost:5173/`

### Otros comandos útiles
- `npm run build`: Genera una versión optimizada de la aplicación lista para producción en la carpeta `dist`.
- `npm run preview`: Permite previsualizar localmente la versión de producción generada por el comando build.
