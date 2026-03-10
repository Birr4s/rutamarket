import { useState, useEffect } from "react";
import { DEFAULT_STORES } from "../constants";
import { computeOptimalRoute } from "../utils/routeOptimization";

export function useAppStore() {
    const [tab, setTab] = useState("lista");

    const [stores, setStores] = useState(() => {
        try {
            const saved = localStorage.getItem("rutamarket_stores");
            const parsed = saved ? JSON.parse(saved) : DEFAULT_STORES;
            return parsed.map(s => ({ favorite: false, ...s }));
        } catch {
            return DEFAULT_STORES.map(s => ({ favorite: false, ...s }));
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

    const [lastPurchases, setLastPurchases] = useState(() => {
        try {
            const saved = localStorage.getItem("rutamarket_lastPurchases");
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    const [routeStep, setRouteStep] = useState(0);
    const [route, setRoute] = useState([]);
    const [shoppingStarted, setShoppingStarted] = useState(false);
    const [selectedEntrance, setSelectedEntrance] = useState(null);
    const [selectedExit, setSelectedExit] = useState(null);

    // Auto-save to localStorage
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

    useEffect(() => {
        try {
            localStorage.setItem("rutamarket_lastPurchases", JSON.stringify(lastPurchases));
        } catch (e) {
            console.error("Error saving last purchases:", e);
        }
    }, [lastPurchases]);

    const currentStore = stores.find(s => s.id === currentStoreId);

    const addToList = (productId) => {
        setShoppingList(prev => {
            const existingItem = prev.find(i => i.productId === productId && !i.done);
            if (existingItem) {
                return prev.map(i =>
                    i.id === existingItem.id ? { ...i, qty: i.qty + 1 } : i
                );
            } else {
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
        setShoppingList(prev =>
            prev.map(i => i.id === itemId ? { ...i, done: !i.done } : i)
        );
    };

    const markAllStopDone = () => {
        // Marcar todos los productos de la parada actual como cogidos
        setShoppingList(prev => {
            if (!route[routeStep]) return prev;
            const itemsToComplete = route[routeStep].items.map(ri => ri.id);
            return prev.map(i =>
                itemsToComplete.includes(i.id) ? { ...i, done: true } : i
            );
        });

        // Avanzar una parada; si estamos en la última, saltar al estado "salida"
        setRouteStep(prev => {
            if (!route.length) return prev;
            if (prev >= route.length - 1) {
                return route.length;
            }
            return prev + 1;
        });
    };

    const nextStop = () => {
        setRouteStep(prev => {
            if (prev >= route.length - 1) return prev;
            return prev + 1;
        });
    };

    const setItemNote = (itemId, note, noteImage) => {
        setShoppingList(prev =>
            prev.map(i =>
                i.id === itemId
                    ? { ...i, note: note || null, noteImage: noteImage || null }
                    : i
            )
        );
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
        // Guardar última compra para el supermercado actual
        setLastPurchases(prev => {
            const completedNow = shoppingList.filter(i => {
                if (!i.done) return false;
                const product = currentStore?.products?.find(p => p.id === i.productId);
                return !!product;
            });
            return {
                ...prev,
                [currentStoreId]: completedNow.map(i => ({
                    id: i.id,
                    productId: i.productId,
                    qty: i.qty,
                })),
            };
        });

        // Al terminar la compra limpiamos notas sólo de los productos del supermercado actual
        setShoppingList(prev => prev.map(i => {
            const product = currentStore?.products?.find(p => p.id === i.productId);
            if (!product) return i;
            return { ...i, note: null, noteImage: null };
        }));
        setShoppingStarted(false);
        setRoute([]);
        setRouteStep(0);
        setTab("lista");
    };

    return {
        tab, setTab,
        stores, setStores,
        currentStoreId, setCurrentStoreId, currentStore,
        shoppingList, setShoppingList,
        routeStep, setRouteStep,
        route, setRoute,
        shoppingStarted, setShoppingStarted,
        selectedEntrance, setSelectedEntrance,
        selectedExit, setSelectedExit,

        addToList,
        changeQty,
        removeFromList,
        toggleDone,
        markAllStopDone,
        nextStop,
        setItemNote,
        lastPurchases, setLastPurchases,
        startShopping,
        stopShopping
    };
}
