# 🗺️ Roadmap y Propuestas Futuras para RutaMarket

Este documento refleja las principales propuestas y vías de evolución para elevar el proyecto **RutaMarket** a su siguiente fase, presentadas en orden de prioridad y complejidad.

## 1️⃣ Corto Plazo: Mejoras de Interfaz (UI/UX)
El objetivo de esta fase es modernizar el aspecto visual y la retroalimentación sin alterar el núcleo de la aplicación.
- **Migración a Sistema de Estilos Moderno:** Reemplazar el objeto actual de estilos de JavaScript en bruto (`const S`) por **Tailwind CSS**. Esto facilitará el mantenimiento, añadirá _Responsive Web Design_ estricto (fundamental dado que la app está pensada para usarse físicamente en supermercados con un teléfono móvil) y mejorará los flujos de trabajo de UI.
- **Feedback Visual (Toast Notifications):** Implementar una librería ligera como `react-hot-toast` para avisar al usuario de acciones críticas: "Producto ubicado con éxito", "No se puede trazar ruta sin especificar una salida", etc.

## 2️⃣ Medio Plazo: Funciones Core Extensibles
El objetivo de esta fase es hacer la aplicación más cómoda para el operario/usuario recurrente.
- **Drag & Drop (Arrastrar y Soltar) en el Canvas:** Actualmente, si el usuario ubica un producto en el mapa y erra los pocos píxeles, debe borrarlo y volver a crearlo con la interfaz. Permitir arrastrar los nodos de los productos ya creados directamente sobre el `<canvas>` mejorará la velocidad de mapeo masivo.
- **Estimación de Precios:** Añadir un campo "precio" numérico al objeto de producto. Posteriormente, la vista del Carrito (`TabLista`) podrá calcular en tiempo real sub-totales antes de ir a pagar, sumando valor predictivo.
- **Catálogo Global / Importación Masiva:** Permitir subir un archivo JSON o CSV para poblar automáticamente los cientos de productos típicos en vez de crearlos manualmente de uno en uno, para luego tan solo _posicionarlos_ en el mapa en modo edición.

## 3️⃣ Largo Plazo: Sistema Colaborativo en la Nube
El objetivo de esta fase es mutar de una aplicación puramente individual (estado guardado en el `localStorage` del dispositivo) a una plataforma comunitaria.
- **Integración con Backend as a Service (BaaS):** Conectar la capa de _storage_ del hook (`useAppStore.js`) a **Firebase** o **Supabase**.
- **Marketplace de Supermercados (Comunidad):** Si un usuario maquea exhaustivamente el "Mercadona de la calle X", debería poder _publicar_ ese mapa virtual a la base de datos global. De este modo, si otro usuario entra al mismo supermercado, puede "descargar" el plano ya pre-etiquetado en lugar de tener que mapearlo él desde cero, favoreciendo el uso masivo de la plataforma.
