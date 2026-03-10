import { SearchInput } from "../SearchInput";
import { CATEGORIES } from "../../constants";
import { S } from "../../styles";

export function TabLista({
    shoppingList,
    stores,
    currentStoreId,
    setCurrentStoreId,
    setShowStoreModal,
    currentStore,
    addToList,
    toggleDone,
    changeQty,
    removeFromList,
    setTab,
    openNoteForItem,
    lastPurchases
}) {
    const pendingItems = shoppingList.filter(i => !i.done);
    const lastPurchaseForStore = (lastPurchases && lastPurchases[currentStoreId]) || [];
    const favoriteStores = stores.filter(s => s.favorite);
    const visibleStores = favoriteStores.length > 0 ? favoriteStores : stores;

    return (
        <div style={S.page}>
            <div style={S.card}>
                <div style={S.cardTitle}>🏪 Supermercado</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {visibleStores.map(store => {
                        const storePending = shoppingList.filter(i => {
                            if (i.done) return false;
                            const prods = store.products || [];
                            return prods.some(p => p.id === i.productId);
                        }).length;

                        return (
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
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 6,
                                }}
                                onClick={() => setCurrentStoreId(store.id)}
                            >
                                <span>{store.name}</span>
                                {storePending > 0 && (
                                    <span style={{
                                        background: "#ff6b6b",
                                        color: "#fff",
                                        borderRadius: "999px",
                                        minWidth: 20,
                                        height: 20,
                                        padding: "0 6px",
                                        fontSize: 11,
                                        fontWeight: 700,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}>
                                        {storePending}
                                    </span>
                                )}
                            </button>
                        );
                    })}
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
                                    {item.note && (
                                        <div style={{ marginTop: 4, fontSize: 11, color: "#ffeb3b" }}>
                                            🔖 Nota guardada
                                        </div>
                                    )}
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
                                            background: "rgba(79,195,247,0.1)",
                                            border: "1px solid rgba(79,195,247,0.5)",
                                            borderRadius: 6,
                                            width: 26,
                                            height: 26,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            cursor: "pointer",
                                            color: "#4fc3f7",
                                            fontSize: 14,
                                        }}
                                        onClick={() => openNoteForItem(item.id, false)}
                                    >
                                        📝
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

            {lastPurchaseForStore.length > 0 && (
                <div style={{ ...S.card, opacity: 0.6 }}>
                    <div style={S.cardTitle}>✅ Última compra</div>
                    {lastPurchaseForStore.map(item => {
                        const product = currentStore?.products?.find(p => p.id === item.productId);
                        if (!product) return null;
                        return (
                            <div key={item.id || item.productId} style={{ ...S.itemRow, opacity: 0.7 }}>
                                <div style={{ ...S.check(true), background: "#4fc3f7" }}>
                                    <span style={{ color: "#0f1923", fontSize: 12 }}>✓</span>
                                </div>
                                <div style={{ flex: 1, fontSize: 13, color: "#6b8a9e" }}>
                                    {product.name} (×{item.qty})
                                </div>
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
}
