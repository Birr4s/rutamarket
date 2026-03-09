import { useState, useEffect } from "react";
import { DEFAULT_STORES } from "../constants";
import { computeOptimalRoute } from "../utils/routeOptimization";

export function useAppStore() {
    const [tab, setTab] = useState("lista");

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
        setShoppingList(prev => {
            const newList = prev.map(i => i.id === itemId ? { ...i, done: !i.done } : i);

            if (shoppingStarted && route[routeStep]) {
                const currentStop = route[routeStep];
                const toggledItem = newList.find(si => si.id === itemId);

                if (toggledItem && toggledItem.done) {
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

    const markAllStopDone = () => {
        setShoppingList(prev => {
            const itemsToComplete = route[routeStep].items.map(ri => ri.id);
            const newList = prev.map(i =>
                itemsToComplete.includes(i.id) ? { ...i, done: true } : i
            );

            if (routeStep < route.length - 1) {
                setTimeout(() => setRouteStep(r => r + 1), 300);
            }

            return newList;
        });
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
        startShopping,
        stopShopping
    };
}
