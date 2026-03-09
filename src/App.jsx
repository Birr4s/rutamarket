import { useState, useRef } from "react";
import { S } from "./styles";
import { CATEGORIES } from "./constants";
import { useAppStore } from "./hooks/useAppStore";
import { TabLista } from "./components/tabs/TabLista";
import { TabMapa } from "./components/tabs/TabMapa";
import { TabComprar } from "./components/tabs/TabComprar";

export default function App() {
  const store = useAppStore();

  // Modals / UI State not saved to local storage
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

  // Helper actions
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

    store.setStores(prev => prev.map(s =>
      s.id === store.currentStoreId
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
    store.setStores(prev => prev.map(s =>
      s.id === store.currentStoreId
        ? { ...s, products: s.products.filter(p => p.id !== productId) }
        : s
    ));
    store.setShoppingList(prev => prev.filter(i => i.productId !== productId));
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

    store.setStores(prev => prev.map(s =>
      s.id === store.currentStoreId
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

    store.setStores(prev => prev.map(s =>
      s.id === store.currentStoreId
        ? { ...s, entrances: [...(s.entrances || []), entrance] }
        : s
    ));

    setNewEntranceName("");
    setPendingEntrancePosition(null);
    setShowEntranceModal(false);
  };

  const addStore = () => {
    const name = newStoreName.trim();
    if (!name) return;
    const id = `store${Date.now()}`;
    store.setStores(prev => [...prev, {
      id,
      name,
      mapImage: null,
      entrances: [],
      products: [],
    }]);
    setNewStoreName("");
    setShowStoreModal(false);
    store.setCurrentStoreId(id);
  };

  const openEditStore = () => {
    setEditStoreName(store.currentStore?.name || "");
    setShowEditStoreModal(true);
  };

  const saveEditStore = () => {
    const name = editStoreName.trim();
    if (!name) return;

    store.setStores(prev => prev.map(s =>
      s.id === store.currentStoreId ? { ...s, name } : s
    ));
    setEditStoreName("");
    setShowEditStoreModal(false);
  };

  const handleEditStoreMapUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      store.setStores(prev => prev.map(s =>
        s.id === store.currentStoreId
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
      store.setStores(prev => prev.map(s =>
        s.id === store.currentStoreId
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
        {store.shoppingStarted && <span style={S.tag("#4caf50")}>● EN COMPRA</span>}
        {store.shoppingList.filter(i => !i.done).length > 0 && !store.shoppingStarted && (
          <div style={S.badge}>{store.shoppingList.filter(i => !i.done).length}</div>
        )}
      </div>

      <div style={S.nav}>
        {tabs.map(t => (
          <button key={t.id} style={S.navBtn(store.tab === t.id)} onClick={() => store.setTab(t.id)}>
            <span style={S.navIcon}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {store.tab === "lista" && (
        <TabLista
          {...store}
          setShowStoreModal={setShowStoreModal}
        />
      )}

      {store.tab === "mapa" && (
        <TabMapa
          {...store}
          fileInputRef={fileInputRef}
          handleMapUpload={handleMapUpload}
          addingEntrance={addingEntrance}
          setAddingEntrance={setAddingEntrance}
          openEditStore={openEditStore}
          handleMapClick={handleMapClick}
          startEditProduct={startEditProduct}
          deleteProduct={deleteProduct}
        />
      )}

      {store.tab === "ruta" && <TabComprar {...store} />}

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
              {store.currentStore?.mapImage && (
                <img
                  src={store.currentStore.mapImage}
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
                📷 {store.currentStore?.mapImage ? "Cambiar mapa" : "Subir mapa"}
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
