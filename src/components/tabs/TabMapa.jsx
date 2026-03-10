import { MapCanvas } from "../MapCanvas";
import { CATEGORIES, DEFAULT_CONSUM_LAYOUT } from "../../constants";
import { S } from "../../styles";

export function TabMapa({
    currentStore,
    currentStoreId,
    setStores,
    fileInputRef,
    handleMapUpload,
    addingEntrance,
    setAddingEntrance,
    movingEntranceId,
    setMovingEntranceId,
    movingProductId,
    setMovingProductId,
    openEditStore,
    shoppingList,
    handleMapClick,
    startEditProduct,
    deleteProduct
}) {
    const sortedProducts = [...(currentStore?.products || [])].sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div style={S.page}>
            {!currentStore?.mapImage && !currentStore?.mapLayout && (
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

                    <button
                        style={{ ...S.btn("#00A651"), width: "100%" }}
                        onClick={() => {
                            setStores(prev => prev.map(s =>
                                s.id === currentStoreId
                                    ? { ...s, mapLayout: DEFAULT_CONSUM_LAYOUT }
                                    : s
                            ));
                        }}
                    >
                        🧩 Usar plantilla de almacén (Consum)
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
                    <div style={{ display: "flex", gap: 8 }}>
                        {(currentStore?.mapImage || currentStore?.mapLayout) && (
                            <>
                                <button
                                    style={{
                                        ...S.btnOutline,
                                        fontSize: 10,
                                        padding: "6px 10px",
                                    }}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    Cambiar mapa
                                </button>
                                <button
                                    style={{
                                        ...S.btnOutline,
                                        fontSize: 10,
                                        padding: "6px 10px",
                                        borderColor: "#ff6b6b",
                                        color: "#ff6b6b",
                                    }}
                                    onClick={() => {
                                        setStores(prev => prev.map(s =>
                                            s.id === currentStoreId
                                                ? {
                                                    ...s,
                                                    mapImage: null,
                                                    mapLayout: null,
                                                    entrances: [],
                                                    products: [],
                                                }
                                                : s
                                        ));
                                    }}
                                >
                                    Eliminar mapa
                                </button>
                            </>
                        )}
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
                            <div style={{ display: "flex", gap: 6 }}>
                                <button
                                    style={{
                                        background: "#4fc3f722",
                                        border: "1px solid #4fc3f744",
                                        borderRadius: 6,
                                        padding: "4px 8px",
                                        fontSize: 10,
                                        cursor: "pointer",
                                        color: "#4fc3f7",
                                    }}
                                    onClick={() => {
                                        setMovingEntranceId(entrance.id);
                                        setAddingEntrance(false);
                                    }}
                                >
                                    Mover
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
                                        <button
                                            style={{
                                                background: "#4caf5022",
                                                border: "1px solid #4caf5044",
                                                borderRadius: 6,
                                                padding: "4px 8px",
                                                fontSize: 10,
                                                cursor: "pointer",
                                                color: "#4caf50",
                                                fontWeight: 600,
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setMovingProductId(product.id);
                                                setAddingEntrance(false);
                                            }}
                                        >
                                            Reubicar
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
}
