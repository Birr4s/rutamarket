import { useRef, useState, useEffect } from "react";
import { CATEGORIES } from "../constants";

export function MapCanvas({ store, shoppingItems, addingEntrance, onMapClick, routeMode, route, currentStep, entrance, exit }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0, scale: 1 });

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
