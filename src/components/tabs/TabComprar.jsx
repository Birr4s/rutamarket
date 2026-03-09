import { MapCanvas } from "../MapCanvas";
import { CATEGORIES } from "../../constants";
import { S } from "../../styles";

export function TabComprar({
    shoppingList,
    currentStore,
    selectedEntrance,
    setSelectedEntrance,
    selectedExit,
    setSelectedExit,
    shoppingStarted,
    startShopping,
    routeStep,
    route,
    stopShopping,
    toggleDone,
    markAllStopDone
}) {
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
                                {currentStore.entrances.map(entranceItem => (
                                    <button
                                        key={entranceItem.id}
                                        style={{
                                            flex: "1 1 calc(50% - 4px)",
                                            padding: "12px 10px",
                                            borderRadius: 10,
                                            border: selectedEntrance === entranceItem.id ? "2px solid #4caf50" : "1px solid rgba(255,255,255,0.12)",
                                            background: selectedEntrance === entranceItem.id ? "#4caf5022" : "rgba(255,255,255,0.04)",
                                            color: selectedEntrance === entranceItem.id ? "#4caf50" : "#6b8a9e",
                                            cursor: "pointer",
                                            fontSize: 13,
                                            fontWeight: 700,
                                        }}
                                        onClick={() => setSelectedEntrance(entranceItem.id)}
                                    >
                                        🚪 {entranceItem.name}
                                    </button>
                                ))}
                            </div>

                            <div style={S.cardTitle}>🚪 Salgo por:</div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {currentStore.entrances.map(entranceItem => (
                                    <button
                                        key={entranceItem.id}
                                        style={{
                                            flex: "1 1 calc(50% - 4px)",
                                            padding: "12px 10px",
                                            borderRadius: 10,
                                            border: selectedExit === entranceItem.id ? "2px solid #ff9800" : "1px solid rgba(255,255,255,0.12)",
                                            background: selectedExit === entranceItem.id ? "#ff980022" : "rgba(255,255,255,0.04)",
                                            color: selectedExit === entranceItem.id ? "#ff9800" : "#6b8a9e",
                                            cursor: "pointer",
                                            fontSize: 13,
                                            fontWeight: 700,
                                        }}
                                        onClick={() => setSelectedExit(entranceItem.id)}
                                    >
                                        🚪 {entranceItem.name}
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

                            {route[routeStep].items.some(routeItem => {
                                const liveItem = shoppingList.find(si => si.id === routeItem.id);
                                return liveItem && !liveItem.done;
                            }) && (
                                    <button
                                        style={{ ...S.btn("#4caf50"), width: "100%", fontSize: 14, padding: "14px", marginTop: 10 }}
                                        onClick={markAllStopDone}
                                    >
                                        ✓ Marcar todos como cogidos
                                    </button>
                                )}
                        </div>
                    )}

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
}
