export function computeOptimalRoute(items, entrance, exit, store) {
    if (!items.length || !entrance || !store) return [];

    const positionGroups = {};
    items.forEach(item => {
        const product = store.products?.find(p => p.id === item.productId);
        if (!product) return;
        const key = `${product.position.x}-${product.position.y}`;
        if (!positionGroups[key]) {
            positionGroups[key] = {
                x: product.position.x,
                y: product.position.y,
                items: [],
            };
        }
        positionGroups[key].items.push(item);
    });

    const positions = Object.values(positionGroups);
    if (!positions.length) return [];

    const getDist = (a, b) => {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const weightY = 1.2;
        return Math.sqrt(dx * dx + (dy * weightY) * (dy * weightY));
    };

    const unvisited = new Set(positions.map((_, i) => i));
    const tour = [];
    let currentX = entrance.x;
    let currentY = entrance.y;

    while (unvisited.size > 0) {
        let nearestIdx = -1;
        let minDist = Infinity;

        for (const idx of unvisited) {
            const pos = positions[idx];
            const dist = getDist({ x: currentX, y: currentY }, pos);
            if (dist < minDist) {
                minDist = dist;
                nearestIdx = idx;
            }
        }

        if (nearestIdx === -1) break;

        const selected = positions[nearestIdx];
        tour.push(selected);
        unvisited.delete(nearestIdx);
        currentX = selected.x;
        currentY = selected.y;
    }

    if (tour.length > 2 && tour.length <= 20) {
        let improved = true;
        let iterations = 0;
        const maxIterations = 50;

        while (improved && iterations < maxIterations) {
            improved = false;
            iterations++;

            for (let i = 0; i < tour.length - 1; i++) {
                for (let j = i + 2; j < tour.length; j++) {
                    const a = i === 0 ? { x: entrance.x, y: entrance.y } : tour[i - 1];
                    const b = tour[i];
                    const c = tour[j];
                    const d = j === tour.length - 1 ? (exit || entrance) : tour[j + 1];

                    const currentDist = getDist(a, b) + getDist(c, d);
                    const newDist = getDist(a, c) + getDist(b, d);

                    if (newDist < currentDist - 0.01) {
                        const segment = tour.slice(i, j + 1).reverse();
                        tour.splice(i, j - i + 1, ...segment);
                        improved = true;
                        break;
                    }
                }
                if (improved) break;
            }
        }
    }

    if (exit && tour.length > 1) {
        let closestToExitIdx = -1;
        let minDistToExit = Infinity;

        for (let i = 0; i < tour.length; i++) {
            const dist = getDist(tour[i], exit);
            if (dist < minDistToExit) {
                minDistToExit = dist;
                closestToExitIdx = i;
            }
        }

        if (closestToExitIdx !== -1 && closestToExitIdx !== tour.length - 1) {
            let currentTotal = getDist({ x: entrance.x, y: entrance.y }, tour[0]);
            for (let i = 0; i < tour.length - 1; i++) {
                currentTotal += getDist(tour[i], tour[i + 1]);
            }
            currentTotal += getDist(tour[tour.length - 1], exit);

            const newTour = [...tour];
            const closestPoint = newTour.splice(closestToExitIdx, 1)[0];
            newTour.push(closestPoint);

            let newTotal = getDist({ x: entrance.x, y: entrance.y }, newTour[0]);
            for (let i = 0; i < newTour.length - 1; i++) {
                newTotal += getDist(newTour[i], newTour[i + 1]);
            }
            newTotal += getDist(newTour[newTour.length - 1], exit);

            if (newTotal <= currentTotal * 1.05) {
                return newTour;
            }
        }
    }

    return tour;
}
