import { useState } from "react";
import { CATEGORIES } from "../constants";
import { S } from "../styles";

export function SearchInput({ products, onSelect }) {
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
