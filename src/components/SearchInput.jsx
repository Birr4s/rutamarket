import { useState } from "react";
import { CATEGORIES } from "../constants";
import { S } from "../styles";

export function SearchInput({ products, onSelect }) {
    const [query, setQuery] = useState("");

    const normalize = (str) =>
        str
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

    const levenshtein = (a, b) => {
        const m = a.length;
        const n = b.length;
        if (m === 0) return n;
        if (n === 0) return m;
        const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,
                    dp[i][j - 1] + 1,
                    dp[i - 1][j - 1] + cost
                );
            }
        }
        return dp[m][n];
    };

    const trimmed = query.trim();

    let filteredByCategory = [];

    if (trimmed) {
        const q = normalize(trimmed);

        // Calculamos similitud y aplicamos umbral estricto
        const scored = products
            .map(p => {
                const name = normalize(p.name);
                if (!q) return null;

                let score = Infinity;

                if (name.includes(q)) {
                    score = 0;
                } else if (q.length >= 3) {
                    score = levenshtein(name, q);
                }

                // Sólo aceptamos productos realmente cercanos:
                // - coincidencia directa (score 0)
                // - o distancia <= 2 cuando la consulta tiene al menos 3 letras
                if (score === 0 || (q.length >= 3 && score <= 2)) {
                    return { product: p, score };
                }
                return null;
            })
            .filter(Boolean)
            .sort((a, b) => a.score - b.score || a.product.name.localeCompare(b.product.name));

        // Reconstruimos por categoría respetando el orden global de similitud
        const byCat = new Map();
        scored.forEach(({ product }) => {
            const arr = byCat.get(product.category) || [];
            arr.push(product);
            byCat.set(product.category, arr);
        });

        filteredByCategory = CATEGORIES
            .map(cat => ({
                ...cat,
                products: byCat.get(cat.id) || [],
            }))
            .filter(cat => cat.products.length > 0);
    }

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
