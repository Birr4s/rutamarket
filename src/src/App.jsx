import { useState, useRef, useEffect } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CATEGORIES = [
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

const DEFAULT_STORES = [
  {
    id: "store1",
    name: "Mercadona Pérez Galdós",
    mapImage: null,
    entrances: [],
    products: [],
  },
];

// ─── ROUTE ALGORITHM (Improved with exit optimization) ───────────────────────
function computeOptimalRoute(items, entrance, exit, store) {
  if (!items.length || !entrance || !store) return [];
  
  const positionGroups = {};
  items.forEach(item => {
    const product = store.products?.find(p => p.id === item.productId);
    if (!product) return;
    const key = `${product.position.x}-${product.position.y}`;
    if (!positionGroups[key]) {
      positionGroups[key] = {
        x: product.position.x,
        y: product.position.y,
        items: [],
      };
    }
    positionGroups[key].items.push(item);
  });
  
  const positions = Object.values(positionGroups);
  if (!positions.length) return [];
  
  const getDist = (a, b) => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy); // Use sqrt for accurate distances
  };
  
  // Nearest Neighbor starting from entrance
  const unvisited = new Set(positions.map((_, i) => i));
  const tour = [];
  let currentX = entrance.x;
  let currentY = entrance.y;
  
  while (unvisited.size > 0) {
    let nearestIdx = -1;
    let minDist = Infinity;
    
    for (const idx of unvisited) {
      const pos = positions[idx];
      const dist = getDist({ x: currentX, y: currentY }, pos);
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = idx;
      }
    }
    
    if (nearestIdx === -1) break;
    
    const selected = positions[nearestIdx];
    tour.push(selected);
    unvisited.delete(nearestIdx);
    currentX = selected.x;
    currentY = selected.y;
  }
  
  // 2-opt optimization (limited iterations for performance)
  if (tour.length > 2 && tour.length <= 20) {
    let improved = true;
    let iterations = 0;
    const maxIterations = 50;
    
    while (improved && iterations < maxIterations) {
      improved = false;
      iterations++;
      
      for (let i = 0; i < tour.length - 1; i++) {
        for (let j = i + 2; j < tour.length; j++) {
          const a = i === 0 ? { x: entrance.x, y: entrance.y } : tour[i - 1];
          const b = tour[i];
          const c = tour[j];
          const d = j === tour.length - 1 ? (exit || entrance) : tour[j + 1];
          
          const currentDist = getDist(a, b) + getDist(c, d);
          const newDist = getDist(a, c) + getDist(b, d);
          
          if (newDist < currentDist - 0.01) { // Small epsilon to avoid floating point issues
            // Reverse segment [i...j]
            const segment = tour.slice(i, j + 1).reverse();
            tour.splice(i, j - i + 1, ...segment);
            improved = true;
            break;
          }
        }
        if (improved) break;
      }
    }
  }
  
  // CRITICAL: Optimize ending position to be closest to exit
  if (exit && tour.length > 1) {
    // Find which position in tour is closest to exit
    let closestToExitIdx = -1;
    let minDistToExit = Infinity;
    
    for (let i = 0; i < tour.length; i++) {
      const dist = getDist(tour[i], exit);
      if (dist < minDistToExit) {
        minDistToExit = dist;
        closestToExitIdx = i;
      }
    }
    
    // If the closest point is not at the end, rotate the tour
    if (closestToExitIdx !== -1 && closestToExitIdx !== tour.length - 1) {
      // We want to end at closestToExitIdx, so we need to reorder
      // Check if moving it to the end improves total distance
      
      // Calculate current total distance
      let currentTotal = getDist({ x: entrance.x, y: entrance.y }, tour[0]);
      for (let i = 0; i < tour.length - 1; i++) {
        currentTotal += getDist(tour[i], tour[i + 1]);
      }
      currentTotal += getDist(tour[tour.length - 1], exit);
      
      // Try moving closest-to-exit to the end
      const newTour = [...tour];
      const closestPoint = newTour.splice(closestToExitIdx, 1)[0];
      newTour.push(closestPoint);
      
      // Calculate new total distance
      let newTotal = getDist({ x: entrance.x, y: entrance.y }, newTour[0]);
      for (let i = 0; i < newTour.length - 1; i++) {
        newTotal += getDist(newTour[i], newTour[i + 1]);
      }
      newTotal += getDist(newTour[newTour.length - 1], exit);
      
      // Use new tour if it's better or similar (within 5%)
      if (newTotal <= currentTotal * 1.05) {
        return newTour;
      }
    }
  }
  
  return tour;
}

// ─── SEARCH INPUT COMPONENT (Isolated to prevent re-renders) ─────────────────
function SearchInput({ products, onSelect }) {
  const [query, setQuery] = useState("");

  const filteredByCategory = query.trim() ? CATEGORIES.map(cat => ({
    ...cat,
    products: products.filter(p =>
      p.category === cat.id &&
      p.name.toLowerCase().includes(query.toLowerCase())
    )
  })).filter(cat => cat.products.length > 0) : [];

  return (
    <>
      <div style={S.card}>
        <div style={S.cardTitle}>🔍 Buscar producto</div>
        <input
          style={S.input}
          type="text"
          placeholder="Busca por nombre..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoComplete="off"
        />
      </div>

      {filteredByCategory.length > 0 && (
        <div style={{
          ...S.card,
          maxHeight: 400,
          overflowY: "auto",
        }}>
          {filteredByCategory.map(cat => (
            <div key={cat.id} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: cat.color, marginBottom: 6 }}>
                {cat.name}
              </div>
              {cat.products.map(product => (
                <div
                  key={product.id}
                  onClick={() => {
                    onSelect(product.id);
                    setQuery("");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px",
                    borderRadius: 8,
                    cursor: "pointer",
                    background: "rgba(255,255,255,0.02)",
                    marginBottom: 4,
                  }}
                >
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{
                        width: 32,
                        height: 32,
                        objectFit: "cover",
                        borderRadius: 6,
                        border: `2px solid ${cat.color}`,
                      }}
                    />
                  )}
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>
                    {product.name}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ─── MAP CANVAS ───────────────────────────────────────────────────────────────
function MapCanvas({ store, shoppingItems, addingEntrance, onMapClick, routeMode, route, currentStep, entrance, exit }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!store?.mapImage) return;
    const img = new Image();
    img.onload = () => {
      const containerWidth = containerRef.current?.offsetWidth || 380;
      const scale = containerWidth / img.width;
      setDimensions({
        width: containerWidth,
        height: img.height * scale,
        scale,
      });
    };
    img.src = store.mapImage;
  }, [store?.mapImage]);

  useEffect(() => {
    if (!canvasRef.current || !store?.mapImage || !dimensions.width) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);

      if (routeMode && route && route.length > 0 && entrance) {
        ctx.strokeStyle = "rgba(255,107,107,0.4)";
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        
        ctx.moveTo(entrance.x * dimensions.scale, entrance.y * dimensions.scale);
        route.forEach(stop => {
          ctx.lineTo(stop.x * dimensions.scale, stop.y * dimensions.scale);
        });
        if (exit && exit.id !== entrance.id) {
          ctx.lineTo(exit.x * dimensions.scale, exit.y * dimensions.scale);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        const drawDot = (x, y, color, size = 4) => {
          ctx.beginPath();
          ctx.arc(x * dimensions.scale, y * dimensions.scale, size, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        };

        drawDot(entrance.x, entrance.y, "#4caf50", 8);

        route.forEach((stop, idx) => {
          if (idx < currentStep) {
            drawDot(stop.x, stop.y, "#4caf50", 6);
          } else if (idx === currentStep) {
            drawDot(stop.x, stop.y, "#4fc3f7", 10);
          } else {
            drawDot(stop.x, stop.y, "#ff6b6b", 6);
          }
        });

        if (exit) {
          drawDot(exit.x, exit.y, "#ff9800", 8);
        }

        if (route[currentStep]) {
          const current = route[currentStep];
          const x = current.x * dimensions.scale;
          const y = current.y * dimensions.scale;
          
          ctx.beginPath();
          ctx.arc(x, y, 20, 0, 2 * Math.PI);
          ctx.strokeStyle = "#4fc3f7";
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      } else {
        if (store.products) {
          store.products.forEach(product => {
            const cat = CATEGORIES.find(c => c.id === product.category);
            const x = product.position.x * dimensions.scale;
            const y = product.position.y * dimensions.scale;
            
            // Just draw a dot (no image)
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI);
            ctx.fillStyle = cat?.color || "#4fc3f7";
            ctx.fill();
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 2;
            ctx.stroke();
          });
        }

        shoppingItems.forEach(item => {
          const product = store.products?.find(p => p.id === item.productId);
          if (!product) return;
          
          const x = product.position.x * dimensions.scale;
          const y = product.position.y * dimensions.scale;

          ctx.beginPath();
          ctx.arc(x + 10, y - 10, 10, 0, 2 * Math.PI);
          ctx.fillStyle = item.done ? "#4caf50" : "#ff6b6b";
          ctx.fill();
          
          ctx.fillStyle = "#fff";
          ctx.font = "bold 10px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(item.done ? "✓" : item.qty, x + 10, y - 10);
        });

        if (store.entrances) {
          store.entrances.forEach(entrance => {
            const x = entrance.x * dimensions.scale;
            const y = entrance.y * dimensions.scale;

            ctx.beginPath();
            ctx.arc(x, y, 20, 0, 2 * Math.PI);
            ctx.fillStyle = "#4caf5044";
            ctx.fill();
            ctx.strokeStyle = "#4caf50";
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.fillStyle = "#fff";
            ctx.font = "bold 16px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("🚪", x, y);

            ctx.fillStyle = "#4caf50";
            ctx.font = "bold 9px sans-serif";
            ctx.fillText(entrance.name, x, y + 28);
          });
        }
      }
    };
    img.src = store.mapImage;
  }, [store, shoppingItems, dimensions, routeMode, route, currentStep, entrance, exit, addingEntrance]);

  const handleClick = (e) => {
    if (!dimensions.scale || routeMode) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / dimensions.scale;
    const y = (e.clientY - rect.top) / dimensions.scale;
    onMapClick({ x, y });
  };

  if (!store?.mapImage) {
    return (
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "2px dashed rgba(255,255,255,0.1)",
        borderRadius: 12,
        padding: "60px 20px",
        textAlign: "center",
        color: "#4a6a7e",
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🗺️</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No hay mapa</div>
        <div style={{ fontSize: 13 }}>Sube la imagen del plano del supermercado</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: "100%", position: "relative" }}>
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onClick={handleClick}
        style={{
          width: "100%",
          borderRadius: 12,
          cursor: routeMode ? "default" : (addingEntrance ? "crosshair" : "pointer"),
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      />
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  app: {
    minHeight: "100vh",
    background: "linear-gradient(160deg, #0f1923 0%, #1a2a3a 60%, #0d1f2d 100%)",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    color: "#e8edf2",
    maxWidth: 430,
    margin: "0 auto",
    position: "relative",
    overflow: "hidden",
  },
  header: {
    background: "rgba(255,255,255,0.03)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    padding: "16px 20px 12px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    backdropFilter: "blur(10px)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  logo: { fontSize: 26, lineHeight: 1 },
  headerText: { flex: 1 },
  headerTitle: {
    fontSize: 17,
    fontWeight: 700,
    letterSpacing: "-0.3px",
    color: "#fff",
  },
  headerSub: {
    fontSize: 11,
    color: "#6b8a9e",
    marginTop: 1,
  },
  nav: {
    display: "flex",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(0,0,0,0.2)",
    position: "sticky",
    top: 65,
    zIndex: 99,
  },
  navBtn: (active) => ({
    flex: 1,
    padding: "11px 4px",
    fontSize: 10,
    fontWeight: active ? 700 : 500,
    color: active ? "#4fc3f7" : "#6b8a9e",
    background: "none",
    border: "none",
    borderBottom: active ? "2px solid #4fc3f7" : "2px solid transparent",
    cursor: "pointer",
    letterSpacing: "0.3px",
    textTransform: "uppercase",
    transition: "all 0.2s",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
  }),
  navIcon: { fontSize: 16 },
  page: {
    padding: "16px 16px 100px",
    minHeight: "calc(100vh - 130px)",
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#4fc3f7",
    letterSpacing: "0.8px",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  input: {
    width: "100%",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    padding: "11px 14px",
    color: "#e8edf2",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  btn: (color = "#4fc3f7") => ({
    background: color,
    color: "#0f1923",
    border: "none",
    borderRadius: 10,
    padding: "11px 18px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.2px",
  }),
  btnOutline: {
    background: "transparent",
    color: "#4fc3f7",
    border: "1px solid #4fc3f7",
    borderRadius: 10,
    padding: "9px 16px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  tag: (color = "#4fc3f7") => ({
    display: "inline-block",
    background: `${color}22`,
    color: color,
    borderRadius: 6,
    padding: "3px 8px",
    fontSize: 11,
    fontWeight: 600,
  }),
  itemRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  check: (done) => ({
    width: 22,
    height: 22,
    borderRadius: 6,
    border: done ? "none" : "2px solid rgba(255,255,255,0.2)",
    background: done ? "#4fc3f7" : "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    fontSize: 13,
  }),
  badge: {
    background: "#ff6b6b",
    color: "#fff",
    borderRadius: "50%",
    width: 18,
    height: 18,
    fontSize: 10,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  modal: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 20,
  },
  modalContent: {
    background: "#1a2a3a",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: 24,
    maxWidth: 380,
    width: "100%",
    maxHeight: "80vh",
    overflowY: "auto",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 16,
    color: "#fff",
  },
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("lista");
  
  // Load from localStorage or use defaults
  const [stores, setStores] = useState(() => {
    try {
      const saved = localStorage.getItem("rutamarket_stores");
      return saved ? JSON.parse(saved) : DEFAULT_STORES;
    } catch {
      return DEFAULT_STORES;
    }
  });
  
  const [currentStoreId, setCurrentStoreId] = useState(() => {
    try {
      const saved = localStorage.getItem("rutamarket_currentStoreId");
      return saved || "store1";
    } catch {
      return "store1";
    }
  });
  
  const [shoppingList, setShoppingList] = useState(() => {
    try {
      const saved = localStorage.getItem("rutamarket_shoppingList");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [routeStep, setRouteStep] = useState(0);
  const [route, setRoute] = useState([]);
  const [shoppingStarted, setShoppingStarted] = useState(false);
  const [selectedEntrance, setSelectedEntrance] = useState(null);
  const [selectedExit, setSelectedExit] = useState(null);
  
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showEntranceModal, setShowEntranceModal] = useState(false);
  const [showEditStoreModal, setShowEditStoreModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const [addingEntrance, setAddingEntrance] = useState(false);
  const [pendingProductPosition, setPendingProductPosition] = useState(null);
  const [pendingEntrancePosition, setPendingEntrancePosition] = useState(null);
  const [newProductName, setNewProductName] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("otros");
  const [newProductImage, setNewProductImage] = useState(null);
  const [newEntranceName, setNewEntranceName] = useState("");
  const [newStoreName, setNewStoreName] = useState("");
  const [editStoreName, setEditStoreName] = useState("");
  
  const fileInputRef = useRef(null);
  const productImageInputRef = useRef(null);
  const editStoreMapInputRef = useRef(null);

  // Auto-save to localStorage whenever stores, shoppingList, or currentStoreId change
  useEffect(() => {
    try {
      localStorage.setItem("rutamarket_stores", JSON.stringify(stores));
    } catch (e) {
      console.error("Error saving stores:", e);
    }
  }, [stores]);

  useEffect(() => {
    try {
      localStorage.setItem("rutamarket_shoppingList", JSON.stringify(shoppingList));
    } catch (e) {
      console.error("Error saving shopping list:", e);
    }
  }, [shoppingList]);

  useEffect(() => {
    try {
      localStorage.setItem("rutamarket_currentStoreId", currentStoreId);
    } catch (e) {
      console.error("Error saving current store ID:", e);
    }
  }, [currentStoreId]);

  const currentStore = stores.find(s => s.id === currentStoreId);

  const addToList = (productId) => {
    setShoppingList(prev => {
      // Check if product already exists in list (not done)
      const existingItem = prev.find(i => i.productId === productId && !i.done);
      
      if (existingItem) {
        // Increment quantity of existing item
        return prev.map(i => 
          i.id === existingItem.id 
            ? { ...i, qty: i.qty + 1 }
            : i
        );
      } else {
        // Create new item
        const newId = Date.now().toString();
        return [...prev, {
          id: newId,
          productId,
          qty: 1,
          done: false,
        }];
      }
    });
  };

  const changeQty = (itemId, delta) => {
    setShoppingList(prev => prev.map(i => {
      if (i.id !== itemId) return i;
      const newQty = Math.max(1, i.qty + delta);
      return { ...i, qty: newQty };
    }));
  };

  const removeFromList = (itemId) => {
    setShoppingList(prev => prev.filter(i => i.id !== itemId));
  };

  const toggleDone = (itemId) => {
    setShoppingList(prev => {
      const newList = prev.map(i => i.id === itemId ? { ...i, done: !i.done } : i);
      
      // Only auto-advance if in shopping mode
      if (shoppingStarted && route[routeStep]) {
        const currentStop = route[routeStep];
        const toggledItem = newList.find(si => si.id === itemId);
        
        // Only advance if we just COMPLETED an item (not un-completed)
        if (toggledItem && toggledItem.done) {
          // Check if ALL items at this stop are now done
          const allDone = currentStop.items.every(stopItem => {
            const liveItem = newList.find(si => si.id === stopItem.id);
            return liveItem?.done === true;
          });

          if (allDone && routeStep < route.length - 1) {
            setTimeout(() => setRouteStep(r => r + 1), 300);
          }
        }
      }
      
      return newList;
    });
  };

  const handleMapClick = (position) => {
    if (addingEntrance) {
      setPendingEntrancePosition(position);
      setShowEntranceModal(true);
      setAddingEntrance(false);
    } else {
      setPendingProductPosition(position);
      setShowProductModal(true);
    }
  };

  const createProduct = () => {
    const name = newProductName.trim();
    if (!name || !pendingProductPosition) return;
    
    const product = {
      id: Date.now().toString(),
      name,
      category: newProductCategory,
      image: newProductImage,
      position: pendingProductPosition,
    };

    setStores(prev => prev.map(s =>
      s.id === currentStoreId
        ? { ...s, products: [...(s.products || []), product] }
        : s
    ));

    setNewProductName("");
    setNewProductCategory("otros");
    setNewProductImage(null);
    setPendingProductPosition(null);
    setShowProductModal(false);
  };

  const deleteProduct = (productId) => {
    setStores(prev => prev.map(s =>
      s.id === currentStoreId
        ? { ...s, products: s.products.filter(p => p.id !== productId) }
        : s
    ));
    // Also remove from shopping list
    setShoppingList(prev => prev.filter(i => i.productId !== productId));
  };

  const startEditProduct = (product) => {
    setEditingProduct(product);
    setNewProductName(product.name);
    setNewProductCategory(product.category);
    setNewProductImage(product.image);
    setPendingProductPosition(product.position);
    setShowProductModal(true);
  };

  const saveEditProduct = () => {
    const name = newProductName.trim();
    if (!name || !editingProduct) return;

    setStores(prev => prev.map(s =>
      s.id === currentStoreId
        ? {
            ...s,
            products: s.products.map(p =>
              p.id === editingProduct.id
                ? {
                    ...p,
                    name,
                    category: newProductCategory,
                    image: newProductImage,
                    position: pendingProductPosition,
                  }
                : p
            ),
          }
        : s
    ));

    setEditingProduct(null);
    setNewProductName("");
    setNewProductCategory("otros");
    setNewProductImage(null);
    setPendingProductPosition(null);
    setShowProductModal(false);
  };

  const createEntrance = () => {
    const name = newEntranceName.trim();
    if (!name || !pendingEntrancePosition) return;

    const entrance = {
      id: Date.now().toString(),
      name,
      x: pendingEntrancePosition.x,
      y: pendingEntrancePosition.y,
    };

    setStores(prev => prev.map(s =>
      s.id === currentStoreId
        ? { ...s, entrances: [...(s.entrances || []), entrance] }
        : s
    ));

    setNewEntranceName("");
    setPendingEntrancePosition(null);
    setShowEntranceModal(false);
  };

  const startShopping = () => {
    if (!selectedEntrance || !selectedExit) return;
    
    const itemsWithLocation = shoppingList.filter(si => {
      const product = currentStore?.products?.find(p => p.id === si.productId);
      return product && !si.done;
    });

    if (!itemsWithLocation.length) return;

    const entrance = currentStore.entrances.find(e => e.id === selectedEntrance);
    const exit = currentStore.entrances.find(e => e.id === selectedExit);

    const computed = computeOptimalRoute(
      itemsWithLocation.map(si => {
        const product = currentStore.products.find(p => p.id === si.productId);
        return { ...si, position: product.position };
      }),
      entrance,
      exit,
      currentStore
    );

    setRoute(computed);
    setRouteStep(0);
    setShoppingStarted(true);
    setTab("ruta");
  };

  const stopShopping = () => {
    setShoppingStarted(false);
    setRoute([]);
    setRouteStep(0);
    setTab("lista");
  };

  const addStore = () => {
    const name = newStoreName.trim();
    if (!name) return;
    const id = `store${Date.now()}`;
    setStores(prev => [...prev, {
      id,
      name,
      mapImage: null,
      entrances: [],
      products: [],
    }]);
    setNewStoreName("");
    setShowStoreModal(false);
    setCurrentStoreId(id);
  };

  const openEditStore = () => {
    setEditStoreName(currentStore?.name || "");
    setShowEditStoreModal(true);
  };

  const saveEditStore = () => {
    const name = editStoreName.trim();
    if (!name) return;
    
    setStores(prev => prev.map(s =>
      s.id === currentStoreId ? { ...s, name } : s
    ));
    setEditStoreName("");
    setShowEditStoreModal(false);
  };

  const handleEditStoreMapUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setStores(prev => prev.map(s =>
        s.id === currentStoreId
          ? { ...s, mapImage: event.target.result }
          : s
      ));
      setShowEditStoreModal(false);
    };
    reader.readAsDataURL(file);
  };

  const handleMapUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setStores(prev => prev.map(s =>
        s.id === currentStoreId
          ? { ...s, mapImage: event.target.result }
          : s
      ));
    };
    reader.readAsDataURL(file);
  };

  const handleProductImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setNewProductImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // ── LIST TAB ──────────────────────────────────────────────────────────────
  const TabLista = () => {
    const pendingItems = shoppingList.filter(i => !i.done);
    const doneItems = shoppingList.filter(i => i.done);

    return (
      <div style={S.page}>
        <div style={S.card}>
          <div style={S.cardTitle}>🏪 Supermercado</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {stores.map(store => (
              <button
                key={store.id}
                style={{
                  flex: "1 1 calc(50% - 4px)",
                  padding: "12px 10px",
                  borderRadius: 10,
                  border: currentStoreId === store.id ? "2px solid #4fc3f7" : "1px solid rgba(255,255,255,0.12)",
                  background: currentStoreId === store.id ? "#4fc3f722" : "rgba(255,255,255,0.04)",
                  color: currentStoreId === store.id ? "#4fc3f7" : "#8a9aaa",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
                onClick={() => setCurrentStoreId(store.id)}
              >
                {store.name}
              </button>
            ))}
            <button
              style={{
                flex: "1 1 calc(50% - 4px)",
                padding: "12px 10px",
                borderRadius: 10,
                border: "1px dashed rgba(79,195,247,0.5)",
                background: "rgba(79,195,247,0.05)",
                color: "#4fc3f7",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
              onClick={() => setShowStoreModal(true)}
            >
              + Añadir
            </button>
          </div>
        </div>

        {currentStore?.products && currentStore.products.length > 0 && (
          <SearchInput 
            products={currentStore.products} 
            onSelect={addToList}
          />
        )}

        {pendingItems.length > 0 && (
          <div style={S.card}>
            <div style={S.cardTitle}>🛒 Mi lista ({pendingItems.length})</div>
            {pendingItems.map(item => {
              const product = currentStore?.products?.find(p => p.id === item.productId);
              if (!product) return null;
              const cat = CATEGORIES.find(c => c.id === product.category);
              return (
                <div key={item.id} style={S.itemRow}>
                  <div style={S.check(false)} onClick={() => toggleDone(item.id)}>
                    <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 12 }}>✓</span>
                  </div>
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{
                        width: 40,
                        height: 40,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: `2px solid ${cat?.color}`,
                      }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#e8edf2" }}>
                      {product.name}
                    </div>
                    <span style={S.tag(cat?.color)}>{cat?.name.split(" ")[0]}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 6,
                        width: 24,
                        height: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "#e8edf2",
                        fontSize: 16,
                      }}
                      onClick={() => changeQty(item.id, -1)}
                    >
                      −
                    </button>
                    <span style={{ fontSize: 15, fontWeight: 700, minWidth: 20, textAlign: "center" }}>
                      {item.qty}
                    </span>
                    <button
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 6,
                        width: 24,
                        height: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "#e8edf2",
                        fontSize: 16,
                      }}
                      onClick={() => changeQty(item.id, 1)}
                    >
                      +
                    </button>
                    <button
                      style={{
                        background: "#ff6b6b22",
                        border: "1px solid #ff6b6b44",
                        borderRadius: 6,
                        width: 24,
                        height: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "#ff6b6b",
                        fontSize: 14,
                      }}
                      onClick={() => removeFromList(item.id)}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {doneItems.length > 0 && (
          <div style={{ ...S.card, opacity: 0.6 }}>
            <div style={S.cardTitle}>✅ Ya tengo ({doneItems.length})</div>
            {doneItems.map(item => {
              const product = currentStore?.products?.find(p => p.id === item.productId);
              if (!product) return null;
              return (
                <div key={item.id} style={{ ...S.itemRow, opacity: 0.7 }}>
                  <div style={{ ...S.check(true), background: "#4fc3f7" }} onClick={() => toggleDone(item.id)}>
                    <span style={{ color: "#0f1923", fontSize: 12 }}>✓</span>
                  </div>
                  <div style={{ flex: 1, textDecoration: "line-through", fontSize: 13, color: "#6b8a9e" }}>
                    {product.name} (×{item.qty})
                  </div>
                  <button
                    style={{ ...S.btnOutline, fontSize: 10, padding: "4px 8px" }}
                    onClick={() => addToList(product.id)}
                  >
                    + Añadir más
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {(!currentStore?.products || currentStore.products.length === 0) && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#4a6a7e" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No hay productos</div>
            <div style={{ fontSize: 13, marginBottom: 16 }}>Ve al mapa y añade productos</div>
            <button style={S.btn("#4fc3f7")} onClick={() => setTab("mapa")}>
              Ir al mapa
            </button>
          </div>
        )}
      </div>
    );
  };

  // ── MAP TAB ───────────────────────────────────────────────────────────────
  const TabMapa = () => {
    // Sort products alphabetically
    const sortedProducts = [...(currentStore?.products || [])].sort((a, b) => a.name.localeCompare(b.name));

    return (
      <div style={S.page}>
        {!currentStore?.mapImage && (
          <div style={S.card}>
            <div style={S.cardTitle}>📷 Sube el mapa del supermercado</div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleMapUpload}
            />
            <button
              style={{ ...S.btn("#4fc3f7"), width: "100%", marginBottom: 8 }}
              onClick={() => fileInputRef.current?.click()}
            >
              📁 Seleccionar imagen del plano
            </button>
          </div>
        )}

        {addingEntrance && (
          <div style={{
            background: "#4caf5022",
            border: "1px solid #4caf50",
            borderRadius: 12,
            padding: "10px 14px",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
            <span style={{ fontSize: 20 }}>🚪</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#4caf50" }}>
                Añadiendo entrada
              </div>
              <div style={{ fontSize: 11, color: "#6a9a6a" }}>
                Toca en el mapa donde está la entrada
              </div>
            </div>
            <button
              style={{ background: "transparent", border: "none", color: "#4caf50", fontSize: 18, cursor: "pointer" }}
              onClick={() => setAddingEntrance(false)}
            >✕</button>
          </div>
        )}

        {!addingEntrance && currentStore?.mapImage && (
          <div style={{
            background: "#ff980022",
            border: "1px solid #ff9800",
            borderRadius: 12,
            padding: "10px 14px",
            marginBottom: 12,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#ff9800", marginBottom: 4 }}>
              📍 Modo añadir productos
            </div>
            <div style={{ fontSize: 11, color: "#a87a4a" }}>
              Toca directamente en el mapa donde está cada producto
            </div>
          </div>
        )}

        <div style={S.card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={S.cardTitle}>🗺️ {currentStore?.name}</div>
            {currentStore?.mapImage && (
              <button
                style={{
                  background: "#4fc3f722",
                  border: "1px solid #4fc3f7",
                  borderRadius: 8,
                  padding: "6px 12px",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#4fc3f7",
                  cursor: "pointer",
                }}
                onClick={openEditStore}
              >
                ⚙️ Editar
              </button>
            )}
          </div>
          <MapCanvas
            store={currentStore}
            shoppingItems={shoppingList}
            addingEntrance={addingEntrance}
            onMapClick={handleMapClick}
            routeMode={false}
          />
        </div>

        {currentStore?.mapImage && (
          <div style={S.card}>
            <button
              style={{ ...S.btn("#4caf50"), width: "100%" }}
              onClick={() => setAddingEntrance(true)}
            >
              🚪 Añadir entrada
            </button>
          </div>
        )}

        {currentStore?.entrances && currentStore.entrances.length > 0 && (
          <div style={S.card}>
            <div style={S.cardTitle}>🚪 Entradas ({currentStore.entrances.length})</div>
            {currentStore.entrances.map(entrance => (
              <div key={entrance.id} style={S.itemRow}>
                <span style={{ fontSize: 20 }}>🚪</span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{entrance.name}</span>
                <button
                  style={{
                    background: "#ff6b6b22",
                    border: "1px solid #ff6b6b44",
                    borderRadius: 6,
                    padding: "4px 8px",
                    fontSize: 10,
                    cursor: "pointer",
                    color: "#ff6b6b",
                  }}
                  onClick={() => {
                    setStores(prev => prev.map(s =>
                      s.id === currentStoreId
                        ? { ...s, entrances: s.entrances.filter(e => e.id !== entrance.id) }
                        : s
                    ));
                  }}
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}

        {sortedProducts.length > 0 && (
          <div style={S.card}>
            <div style={S.cardTitle}>📦 Productos colocados ({sortedProducts.length})</div>
            <div style={{ 
              maxHeight: 300, 
              overflowY: "auto",
              display: "grid",
              gap: 6,
            }}>
              {sortedProducts.map(product => {
                const cat = CATEGORIES.find(c => c.id === product.category);
                return (
                  <div 
                    key={product.id} 
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 8px",
                      background: "rgba(255,255,255,0.02)",
                      borderRadius: 8,
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        style={{
                          width: 28,
                          height: 28,
                          objectFit: "cover",
                          borderRadius: 6,
                          border: `2px solid ${cat?.color}`,
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#e8edf2" }}>
                        {product.name}
                      </div>
                      <span style={{ ...S.tag(cat?.color), fontSize: 9, padding: "2px 6px" }}>
                        {cat?.name.split(" ")[0]}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        style={{
                          background: "#4fc3f722",
                          border: "1px solid #4fc3f744",
                          borderRadius: 6,
                          padding: "4px 8px",
                          fontSize: 10,
                          cursor: "pointer",
                          color: "#4fc3f7",
                          fontWeight: 600,
                        }}
                        onClick={() => startEditProduct(product)}
                      >
                        ✏️
                      </button>
                      <button
                        style={{
                          background: "#ff6b6b22",
                          border: "1px solid #ff6b6b44",
                          borderRadius: 6,
                          padding: "4px 8px",
                          fontSize: 10,
                          cursor: "pointer",
                          color: "#ff6b6b",
                          fontWeight: 600,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProduct(product.id);
                        }}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── SHOP TAB ──────────────────────────────────────────────────────────────
  const TabComprar = () => {
    const itemsWithLocation = shoppingList.filter(si => {
      const product = currentStore?.products?.find(p => p.id === si.productId);
      return product && !si.done;
    });

    const entrance = currentStore?.entrances?.find(e => e.id === selectedEntrance);
    const exit = currentStore?.entrances?.find(e => e.id === selectedExit);

    return (
      <div style={S.page}>
        {!shoppingStarted ? (
          <>
            <div style={S.card}>
              <div style={S.cardTitle}>🏪 {currentStore?.name}</div>
            </div>

            {currentStore?.entrances && currentStore.entrances.length > 0 && (
              <div style={S.card}>
                <div style={S.cardTitle}>🚪 Entro por:</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                  {currentStore.entrances.map(entrance => (
                    <button
                      key={entrance.id}
                      style={{
                        flex: "1 1 calc(50% - 4px)",
                        padding: "12px 10px",
                        borderRadius: 10,
                        border: selectedEntrance === entrance.id ? "2px solid #4caf50" : "1px solid rgba(255,255,255,0.12)",
                        background: selectedEntrance === entrance.id ? "#4caf5022" : "rgba(255,255,255,0.04)",
                        color: selectedEntrance === entrance.id ? "#4caf50" : "#6b8a9e",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                      onClick={() => setSelectedEntrance(entrance.id)}
                    >
                      🚪 {entrance.name}
                    </button>
                  ))}
                </div>

                <div style={S.cardTitle}>🚪 Salgo por:</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {currentStore.entrances.map(entrance => (
                    <button
                      key={entrance.id}
                      style={{
                        flex: "1 1 calc(50% - 4px)",
                        padding: "12px 10px",
                        borderRadius: 10,
                        border: selectedExit === entrance.id ? "2px solid #ff9800" : "1px solid rgba(255,255,255,0.12)",
                        background: selectedExit === entrance.id ? "#ff980022" : "rgba(255,255,255,0.04)",
                        color: selectedExit === entrance.id ? "#ff9800" : "#6b8a9e",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                      onClick={() => setSelectedExit(entrance.id)}
                    >
                      🚪 {entrance.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={S.card}>
              <div style={S.cardTitle}>📋 Resumen</div>
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1, background: "rgba(79,195,247,0.1)", borderRadius: 10, padding: "10px", textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#4fc3f7" }}>
                    {shoppingList.filter(i => !i.done).length}
                  </div>
                  <div style={{ fontSize: 10, color: "#6b8a9e" }}>Productos</div>
                </div>
                <div style={{ flex: 1, background: "rgba(165,214,90,0.1)", borderRadius: 10, padding: "10px", textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#a5d65a" }}>{itemsWithLocation.length}</div>
                  <div style={{ fontSize: 10, color: "#6b8a9e" }}>Ubicados</div>
                </div>
              </div>

              {(!selectedEntrance || !selectedExit) && (
                <div style={{ background: "#ff980011", border: "1px solid #ff980033", borderRadius: 10, padding: 12, fontSize: 12, color: "#ff9800", marginBottom: 12 }}>
                  ⚠️ Selecciona entrada y salida arriba
                </div>
              )}

              {itemsWithLocation.length === 0 && (
                <div style={{ background: "#ff6b6b11", border: "1px solid #ff6b6b33", borderRadius: 10, padding: 12, fontSize: 12, color: "#ff6b6b", marginBottom: 12 }}>
                  ⚠️ No hay productos ubicados
                </div>
              )}

              <button
                style={{
                  ...S.btn(selectedEntrance && selectedExit && itemsWithLocation.length > 0 ? "#4fc3f7" : "#4a5a6a"),
                  width: "100%",
                  padding: 16,
                  fontSize: 15,
                  cursor: selectedEntrance && selectedExit && itemsWithLocation.length > 0 ? "pointer" : "not-allowed",
                }}
                onClick={selectedEntrance && selectedExit && itemsWithLocation.length > 0 ? startShopping : undefined}
              >
                🛒 Iniciar ruta óptima
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 13, color: "#6b8a9e" }}>Paso {routeStep + 1} de {route.length}</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>🛒 Ruta activa</div>
              </div>
              <button style={{ ...S.btnOutline, color: "#ff6b6b", borderColor: "#ff6b6b" }} onClick={stopShopping}>
                Terminar
              </button>
            </div>

            <div style={S.card}>
              <div style={S.cardTitle}>🗺️ Recorrido</div>
              <MapCanvas
                store={currentStore}
                shoppingItems={shoppingList}
                routeMode={true}
                route={route}
                currentStep={routeStep}
                entrance={entrance}
                exit={exit}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 10, fontSize: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4caf50" }} />
                  <span style={{ color: "#6b8a9e" }}>Completado</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4fc3f7" }} />
                  <span style={{ color: "#6b8a9e" }}>Actual</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff6b6b" }} />
                  <span style={{ color: "#6b8a9e" }}>Pendiente</span>
                </div>
              </div>
            </div>

            {route[routeStep] && (
              <div style={{
                ...S.card,
                border: "2px solid #4fc3f7",
                background: "rgba(79,195,247,0.08)",
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#4fc3f7", marginBottom: 10 }}>
                  📍 Productos en esta zona:
                </div>
                {route[routeStep].items.map(routeItem => {
                  const liveItem = shoppingList.find(si => si.id === routeItem.id);
                  if (!liveItem) return null;
                  const product = currentStore?.products?.find(p => p.id === liveItem.productId);
                  if (!product) return null;
                  const cat = CATEGORIES.find(c => c.id === product.category);

                  return (
                    <div key={liveItem.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          style={{
                            width: 50,
                            height: 50,
                            objectFit: "cover",
                            borderRadius: 10,
                            border: `3px solid ${cat?.color}`,
                            opacity: liveItem.done ? 0.5 : 1,
                          }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: liveItem.done ? "#4caf50" : "#e8edf2", textDecoration: liveItem.done ? "line-through" : "none" }}>
                          {product.name}
                          <span style={{ ...S.tag("#4fc3f7"), marginLeft: 6 }}>×{liveItem.qty}</span>
                        </div>
                        <span style={S.tag(cat?.color)}>{cat?.name.split(" ")[0]}</span>
                      </div>
                      <div
                        style={liveItem.done ? { ...S.check(true), background: "#4fc3f7", width: 32, height: 32 } : { ...S.check(false), width: 32, height: 32 }}
                        onClick={() => toggleDone(liveItem.id)}
                      >
                        {liveItem.done ? (
                          <span style={{ color: "#0f1923", fontSize: 16 }}>✓</span>
                        ) : (
                          <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 16 }}>✓</span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* BIG BUTTON */}
                {route[routeStep].items.some(routeItem => {
                  const liveItem = shoppingList.find(si => si.id === routeItem.id);
                  return liveItem && !liveItem.done;
                }) && (
                  <button
                    style={{ ...S.btn("#4caf50"), width: "100%", fontSize: 14, padding: "14px", marginTop: 10 }}
                    onClick={() => {
                      // Mark ALL uncompleted items at once
                      setShoppingList(prev => {
                        const itemsToComplete = route[routeStep].items.map(ri => ri.id);
                        const newList = prev.map(i => 
                          itemsToComplete.includes(i.id) ? { ...i, done: true } : i
                        );
                        
                        // Auto-advance after marking all
                        if (routeStep < route.length - 1) {
                          setTimeout(() => setRouteStep(r => r + 1), 300);
                        }
                        
                        return newList;
                      });
                    }}
                  >
                    ✓ Marcar todos como cogidos
                  </button>
                )}
              </div>
            )}

            {/* COMPLETE ROUTE LIST */}
            <div style={S.card}>
              <div style={S.cardTitle}>📋 Lista completa del recorrido</div>
              <div style={{ maxHeight: 400, overflowY: "auto" }}>
                {route.map((stop, stopIdx) => (
                  <div key={stopIdx} style={{ marginBottom: 12 }}>
                    <div style={{ 
                      fontSize: 11, 
                      fontWeight: 700, 
                      color: stopIdx < routeStep ? "#4caf50" : stopIdx === routeStep ? "#4fc3f7" : "#6b8a9e",
                      marginBottom: 6,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}>
                      <div style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: stopIdx < routeStep ? "#4caf50" : stopIdx === routeStep ? "#4fc3f7" : "rgba(255,255,255,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 700,
                        color: stopIdx <= routeStep ? "#fff" : "#6b8a9e",
                      }}>
                        {stopIdx < routeStep ? "✓" : stopIdx + 1}
                      </div>
                      Parada {stopIdx + 1}
                      {stopIdx === routeStep && " ← Estás aquí"}
                    </div>
                    {stop.items.map(routeItem => {
                      const liveItem = shoppingList.find(si => si.id === routeItem.id);
                      if (!liveItem) return null;
                      const product = currentStore?.products?.find(p => p.id === liveItem.productId);
                      if (!product) return null;
                      const cat = CATEGORIES.find(c => c.id === product.category);

                      return (
                        <div 
                          key={liveItem.id} 
                          style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: 8, 
                            padding: "6px 8px",
                            background: "rgba(255,255,255,0.02)",
                            borderRadius: 8,
                            marginBottom: 4,
                            opacity: liveItem.done ? 0.6 : 1,
                          }}
                        >
                          {product.image && (
                            <img
                              src={product.image}
                              alt={product.name}
                              style={{
                                width: 32,
                                height: 32,
                                objectFit: "cover",
                                borderRadius: 6,
                                border: `2px solid ${cat?.color}`,
                              }}
                            />
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontSize: 13, 
                              fontWeight: 600, 
                              color: liveItem.done ? "#4caf50" : "#e8edf2",
                              textDecoration: liveItem.done ? "line-through" : "none",
                            }}>
                              {product.name}
                              <span style={{ ...S.tag(cat?.color), marginLeft: 6, fontSize: 9 }}>
                                ×{liveItem.qty}
                              </span>
                            </div>
                          </div>
                          {liveItem.done && (
                            <div style={{ color: "#4caf50", fontSize: 14 }}>✓</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, height: 8, marginBottom: 16 }}>
              <div style={{
                background: "#4fc3f7",
                height: "100%",
                borderRadius: 10,
                width: `${((routeStep + 1) / route.length) * 100}%`,
                transition: "width 0.4s ease",
              }} />
            </div>

            {routeStep >= route.length && (
              <div style={{
                ...S.card,
                textAlign: "center",
                background: "rgba(76,175,80,0.1)",
                border: "1px solid #4caf50",
              }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🎉</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#4caf50", marginBottom: 6 }}>¡Compra completada!</div>
                <div style={{ fontSize: 13, color: "#6b8a9e", marginBottom: 16 }}>
                  Dirígete a la salida: {exit?.name}
                </div>
                <button style={{ ...S.btn("#4fc3f7"), padding: "12px 24px" }} onClick={stopShopping}>
                  Volver al inicio
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const tabs = [
    { id: "lista", label: "Lista", icon: "📝" },
    { id: "mapa", label: "Mapa", icon: "🗺️" },
    { id: "ruta", label: "Comprar", icon: "🛒" },
  ];

  return (
    <div style={S.app}>
      <div style={S.header}>
        <span style={S.logo}>🛒</span>
        <div style={S.headerText}>
          <div style={S.headerTitle}>RutaMarket</div>
          <div style={S.headerSub}>Optimizador de compra</div>
        </div>
        {shoppingStarted && <span style={S.tag("#4caf50")}>● EN COMPRA</span>}
        {shoppingList.filter(i => !i.done).length > 0 && !shoppingStarted && (
          <div style={S.badge}>{shoppingList.filter(i => !i.done).length}</div>
        )}
      </div>

      <div style={S.nav}>
        {tabs.map(t => (
          <button key={t.id} style={S.navBtn(tab === t.id)} onClick={() => setTab(t.id)}>
            <span style={S.navIcon}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "lista" && <TabLista />}
      {tab === "mapa" && <TabMapa />}
      {tab === "ruta" && <TabComprar />}

      {/* MODALS */}
      {showStoreModal && (
        <div style={S.modal} onClick={() => setShowStoreModal(false)}>
          <div style={S.modalContent} onClick={e => e.stopPropagation()}>
            <div style={S.modalTitle}>➕ Añadir supermercado</div>
            <input
              style={S.input}
              placeholder="Nombre..."
              value={newStoreName}
              onChange={e => setNewStoreName(e.target.value)}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button style={{ ...S.btnOutline, flex: 1 }} onClick={() => setShowStoreModal(false)}>Cancelar</button>
              <button style={{ ...S.btn(), flex: 1 }} onClick={addStore}>Crear</button>
            </div>
          </div>
        </div>
      )}

      {showProductModal && (
        <div style={S.modal} onClick={() => setShowProductModal(false)}>
          <div style={S.modalContent} onClick={e => e.stopPropagation()}>
            <div style={S.modalTitle}>{editingProduct ? "✏️ Editar producto" : "📦 Nuevo producto"}</div>
            <input
              style={{ ...S.input, marginBottom: 12 }}
              placeholder="Nombre del producto..."
              value={newProductName}
              onChange={e => setNewProductName(e.target.value)}
              autoFocus
            />
            <select
              style={{ ...S.input, marginBottom: 12 }}
              value={newProductCategory}
              onChange={e => setNewProductCategory(e.target.value)}
            >
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <input
              ref={productImageInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleProductImageUpload}
            />
            {newProductImage ? (
              <div style={{ marginBottom: 12 }}>
                <img src={newProductImage} alt="Preview" style={{ width: "100%", borderRadius: 10, marginBottom: 8 }} />
                <button style={{ ...S.btnOutline, width: "100%" }} onClick={() => productImageInputRef.current?.click()}>
                  📷 Cambiar imagen
                </button>
              </div>
            ) : (
              <button style={{ ...S.btn("#ff9800"), width: "100%", marginBottom: 12 }} onClick={() => productImageInputRef.current?.click()}>
                📷 Añadir imagen (opcional)
              </button>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button 
                style={{ ...S.btnOutline, flex: 1 }} 
                onClick={() => { 
                  setShowProductModal(false); 
                  setPendingProductPosition(null);
                  setEditingProduct(null);
                  setNewProductName("");
                  setNewProductCategory("otros");
                  setNewProductImage(null);
                }}
              >
                Cancelar
              </button>
              <button 
                style={{ ...S.btn(), flex: 1 }} 
                onClick={editingProduct ? saveEditProduct : createProduct}
              >
                {editingProduct ? "Guardar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEntranceModal && (
        <div style={S.modal} onClick={() => setShowEntranceModal(false)}>
          <div style={S.modalContent} onClick={e => e.stopPropagation()}>
            <div style={S.modalTitle}>🚪 Nueva entrada</div>
            <input
              style={S.input}
              placeholder="Nombre (ej: Entrada A, Entrada Principal...)"
              value={newEntranceName}
              onChange={e => setNewEntranceName(e.target.value)}
              autoFocus
            />
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button style={{ ...S.btnOutline, flex: 1 }} onClick={() => { setShowEntranceModal(false); setPendingEntrancePosition(null); }}>
                Cancelar
              </button>
              <button style={{ ...S.btn(), flex: 1 }} onClick={createEntrance}>Crear</button>
            </div>
          </div>
        </div>
      )}

      {showEditStoreModal && (
        <div style={S.modal} onClick={() => setShowEditStoreModal(false)}>
          <div style={S.modalContent} onClick={e => e.stopPropagation()}>
            <div style={S.modalTitle}>⚙️ Editar supermercado</div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#4fc3f7", marginBottom: 8 }}>
                Nombre del supermercado
              </div>
              <input
                style={S.input}
                placeholder="Nombre..."
                value={editStoreName}
                onChange={e => setEditStoreName(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#4fc3f7", marginBottom: 8 }}>
                Mapa del supermercado
              </div>
              {currentStore?.mapImage && (
                <img 
                  src={currentStore.mapImage} 
                  alt="Mapa actual" 
                  style={{ 
                    width: "100%", 
                    borderRadius: 10, 
                    marginBottom: 8,
                    border: "1px solid rgba(255,255,255,0.1)"
                  }} 
                />
              )}
              <input
                ref={editStoreMapInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleEditStoreMapUpload}
              />
              <button 
                style={{ ...S.btn("#ff9800"), width: "100%" }} 
                onClick={() => editStoreMapInputRef.current?.click()}
              >
                📷 {currentStore?.mapImage ? "Cambiar mapa" : "Subir mapa"}
              </button>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button 
                style={{ ...S.btnOutline, flex: 1 }} 
                onClick={() => {
                  setShowEditStoreModal(false);
                  setEditStoreName("");
                }}
              >
                Cancelar
              </button>
              <button 
                style={{ ...S.btn(), flex: 1 }} 
                onClick={saveEditStore}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
