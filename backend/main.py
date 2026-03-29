from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Grafo de ejemplo con costos y heurísticas
grafo = {
    'A': {'B': 2, 'D': 4},
    'B': {'A': 2, 'C': 3, 'E': 2},
    'C': {'B': 3, 'F': 5},
    'D': {'A': 4, 'E': 1},
    'E': {'D': 1, 'B': 2, 'F': 3},
    'F': {'C': 5, 'E': 3}
}

heuristica = {
    'A': 7, 'B': 6, 'C': 2,
    'D': 6, 'E': 3, 'F': 0
}

estaciones = {
    "A": {"name": "Mi Casa", "coords": [6.010232, -73.665795]},
    "B": {"name": "Sena", "coords": [6.010050, -73.668118]},
    "C": {"name": "Villa del Bosque", "coords": [6.011820, -73.666054]},
    "D": {"name": "Barrio la Ronda", "coords": [6.013573, -73.670645]},
    "E": {"name": "Martín Galeano", "coords": [6.011797, -73.674945]},
    "F": {"name": "Santa Teresita", "coords": [6.006432, -73.675888]}
}

def a_estrella(inicio, destino):
    if inicio not in grafo or destino not in grafo:
        return None

    abiertos = [(inicio, 0)]
    costos = {inicio: 0}
    padres = {inicio: None}

    while abiertos:
        abiertos.sort(key=lambda x: x[1])
        actual = abiertos.pop(0)[0]

        if actual == destino:
            break

        for vecino in grafo[actual]:
            nuevo = costos[actual] + grafo[actual][vecino]

            if vecino not in costos or nuevo < costos[vecino]:
                costos[vecino] = nuevo
                prioridad = nuevo + heuristica[vecino]
                abiertos.append((vecino, prioridad))
                padres[vecino] = actual

    # 🔥 si no llegó al destino
    if destino not in padres:
        return None

    # reconstruir ruta
    ruta = []
    nodo = destino

    while nodo is not None:
        ruta.append(nodo)
        nodo = padres.get(nodo)

    ruta.reverse()

    # tramos
    tramos = []
    for i in range(len(ruta) - 1):
        tramos.append({
            "from": ruta[i],
            "to": ruta[i + 1],
            "cost": grafo[ruta[i]][ruta[i + 1]]
        })

    return {
        "ruta": ruta,
        "costo_total": costos[destino],
        "tramos": tramos
    }

@app.get("/ruta")
def obtener_ruta(inicio: str, destino: str):
    resultado = a_estrella(inicio, destino)

    if resultado is None:
        return {
            "error": "No se encontró ruta Api",
            "ruta": [],
            "tramos": [],
            "costo_total": 0
        }

    return resultado

@app.get("/")
def home():
    return {"mensaje": "API funcionando 🚀"}

@app.get("/estaciones")
def obtener_estaciones():
    return estaciones