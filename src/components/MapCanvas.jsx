import { useRef, useState, useEffect } from "react";
import { CATEGORIES, CONSUM_THEME } from "../constants";

export function MapCanvas({ store, shoppingItems, addingEntrance, onMapClick, routeMode, route, currentStep, entrance, exit, orientationEntrance }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0, scale: 1 });

    useEffect(() => {
        const containerWidth = containerRef.current?.offsetWidth || 380;

        if (store?.mapImage) {
            const img = new Image();
            img.onload = () => {
                const scale = containerWidth / img.width;
                setDimensions({
                    width: containerWidth,
                    height: img.height * scale,
                    scale,
                });
            };
            img.src = store.mapImage;
            return;
        }

        if (store?.mapLayout?.width && store?.mapLayout?.height) {
            const scale = containerWidth / store.mapLayout.width;
            setDimensions({
                width: containerWidth,
                height: store.mapLayout.height * scale,
                scale,
            });
        }
    }, [store?.mapImage, store?.mapLayout?.width, store?.mapLayout?.height]);

    useEffect(() => {
        if (!canvasRef.current || !dimensions.width) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        const renderBase = async () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (store?.mapImage) {
                await new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
                        resolve();
                    };
                    img.src = store.mapImage;
                });
                return;
            }

            if (store?.mapLayout) {
                // Fondo
                ctx.fillStyle = CONSUM_THEME.floor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Rejilla suave (ayuda para ubicar productos)
                ctx.save();
                ctx.globalAlpha = 0.35;
                ctx.strokeStyle = "rgba(0,0,0,0.08)";
                ctx.lineWidth = 1;
                const grid = 50 * dimensions.scale;
                for (let x = 0; x <= canvas.width; x += grid) {
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, canvas.height);
                    ctx.stroke();
                }
                for (let y = 0; y <= canvas.height; y += grid) {
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(canvas.width, y);
                    ctx.stroke();
                }
                ctx.restore();

                // Shapes
                const shapes = store.mapLayout.shapes || [];
                shapes.forEach((s) => {
                    const x = s.x * dimensions.scale;
                    const y = s.y * dimensions.scale;
                    const w = s.w * dimensions.scale;
                    const h = s.h * dimensions.scale;

                    if (s.kind === "wall") {
                        ctx.fillStyle = CONSUM_THEME.wall;
                        ctx.fillRect(x, y, w, h);
                        return;
                    }

                    if (s.kind === "aisle") {
                        ctx.fillStyle = CONSUM_THEME.aisle;
                        ctx.fillRect(x, y, w, h);
                        ctx.strokeStyle = CONSUM_THEME.aisleStroke;
                        ctx.lineWidth = 2;
                        ctx.strokeRect(x, y, w, h);
                        return;
                    }

                    if (s.kind === "service") {
                        ctx.fillStyle = CONSUM_THEME.service;
                        ctx.fillRect(x, y, w, h);
                        ctx.strokeStyle = CONSUM_THEME.brandGreen;
                        ctx.lineWidth = 2;
                        ctx.strokeRect(x, y, w, h);

                        if (s.label) {
                            ctx.fillStyle = CONSUM_THEME.brandGreen;
                            ctx.font = "bold 12px sans-serif";
                            ctx.textAlign = "left";
                            ctx.textBaseline = "top";
                            ctx.fillText(s.label, x + 8, y + 8);
                        }
                        return;
                    }

                    if (s.kind === "checkout") {
                        ctx.fillStyle = CONSUM_THEME.checkout;
                        ctx.fillRect(x, y, w, h);
                        ctx.strokeStyle = CONSUM_THEME.brandYellow;
                        ctx.lineWidth = 2;
                        ctx.strokeRect(x, y, w, h);

                        ctx.fillStyle = CONSUM_THEME.brandYellow;
                        ctx.font = "bold 12px sans-serif";
                        ctx.textAlign = "left";
                        ctx.textBaseline = "top";
                        ctx.fillText("Cajas", x + 8, y + 8);
                        return;
                    }
                });
            } else {
                // Sin imagen ni layout: placeholder de fondo (no debería ocurrir si TabMapa muestra el estado “No hay mapa”)
                ctx.fillStyle = "rgba(255,255,255,0.02)";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        };

        const render = async () => {
            if (!store?.mapImage && !store?.mapLayout) return;
            ctx.save();

            // En modo ruta, rotamos 180º el mapa completo para orientar la entrada abajo
            if (routeMode && orientationEntrance && store?.mapLayout) {
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate(Math.PI);
                ctx.translate(-canvas.width / 2, -canvas.height / 2);
            }

            await renderBase();

            if (routeMode && route && route.length > 0 && entrance) {
                ctx.strokeStyle = "rgba(255,80,80,0.35)";
                ctx.lineWidth = 2;
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

                const drawDot = (x, y, color, size = 3) => {
                    ctx.beginPath();
                    ctx.arc(x * dimensions.scale, y * dimensions.scale, size, 0, 2 * Math.PI);
                    ctx.fillStyle = color;
                    ctx.fill();
                };

                drawDot(entrance.x, entrance.y, "#4caf50", 6);

                route.forEach((stop, idx) => {
                    if (idx < currentStep) {
                        drawDot(stop.x, stop.y, "rgba(76,175,80,0.9)", 5);
                    } else if (idx === currentStep) {
                        drawDot(stop.x, stop.y, "rgba(79,195,247,0.95)", 7);
                    } else {
                        drawDot(stop.x, stop.y, "rgba(255,107,107,0.9)", 5);
                    }
                });

                if (exit) {
                    drawDot(exit.x, exit.y, "rgba(255,152,0,0.9)", 6);
                }

                if (currentStep >= 0 && currentStep < route.length && route[currentStep]) {
                    const current = route[currentStep];
                    const x = current.x * dimensions.scale;
                    const y = current.y * dimensions.scale;

                    ctx.beginPath();
                    ctx.arc(x, y, 20, 0, 2 * Math.PI);
                    ctx.strokeStyle = "#4fc3f7";
                    ctx.lineWidth = 3;
                    ctx.stroke();
                } else if (exit) {
                    const x = exit.x * dimensions.scale;
                    const y = exit.y * dimensions.scale;

                    ctx.beginPath();
                    ctx.arc(x, y, 22, 0, 2 * Math.PI);
                    ctx.strokeStyle = "#ff9800";
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }
            } else {
                if (store.products) {
                    store.products.forEach(product => {
                        const cat = CATEGORIES.find(c => c.id === product.category);
                        const x = product.position.x * dimensions.scale;
                        const y = product.position.y * dimensions.scale;

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
            ctx.restore();
        };

        void render();
    }, [store, shoppingItems, dimensions, routeMode, route, currentStep, entrance, exit, addingEntrance, orientationEntrance]);

    const handleClick = (e) => {
        if (!dimensions.scale || routeMode) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / dimensions.scale;
        const y = (e.clientY - rect.top) / dimensions.scale;
        onMapClick({ x, y });
    };

    if (!store?.mapImage && !store?.mapLayout) {
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
