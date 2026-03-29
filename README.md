# 🚍 Rutas Inteligentes

Sistema de búsqueda y cálculo de rutas óptimas utilizando el algoritmo A* con una interfaz interactiva en mapa.

## 🎯 Características

- ✨ Visualización en tiempo real en mapas interactivos (Leaflet)
- 🚗 Animación de recorrido del vehículo
- 🔍 Algoritmo A* para búsqueda óptima de rutas
- 🌐 Backend con FastAPI
- 📱 Interfaz responsive y moderna
- 🗺️ Zoom automático en coordenadas
- 🌙 Tema oscuro profesional

## 📋 Requisitos

- Python 3.8+
- Node.js 14+
- npm

## 🚀 Instalación

### Backend

```bash
cd backend
pip install fastapi uvicorn
```

### Frontend

```bash
cd frontend
npm install
```

## 🏃 Ejecución

### Backend (Terminal 1)

```bash
cd backend
python -m uvicorn main:app --reload
```

El servidor estará disponible en `http://127.0.0.1:8000`

### Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

La aplicación se abrirá en `http://localhost:5173`

## 📁 Estructura del Proyecto

```
rutas-inteligentes/
├── backend/
│   ├── main.py              # API FastAPI con algoritmo A*
│   └── __pycache__/
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Componente principal
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── eslint.config.js
└── .gitignore
```

## 🔌 API Endpoints

### GET /estaciones
Retorna todas las estaciones disponibles con sus coordenadas.

**Respuesta:**
```json
{
  "A": {"name": "Mi Casa", "coords": [6.010232, -73.665795]},
  "B": {"name": "Sena", "coords": [6.010050, -73.668118]}
  ...
}
```

### GET /ruta?inicio=A&destino=F
Calcula la ruta óptima entre dos estaciones usando A*.

**Parámetros:**
- `inicio`: Nodo de inicio (A-F)
- `destino`: Nodo de destino (A-F)

**Respuesta:**
```json
{
  "ruta": ["A", "B", "E", "F"],
  "costo_total": 8,
  "tramos": [
    {"from": "A", "to": "B", "cost": 2},
    {"from": "B", "to": "E", "cost": 2},
    {"from": "E", "to": "F", "cost": 3}
  ]
}
```

## 🧠 Algoritmo A*

El algoritmo A* utiliza una heurística para encontrar la ruta más corta de forma eficiente:

- **Costo real**: Distancia desde el inicio hasta el nodo actual
- **Heurística**: Estimación del costo desde el nodo actual al destino
- **Prioridad**: Suma de ambos valores

Esto permite explorar primero los caminos más prometedores.

## 🛠️ Tecnologías Utilizadas

- **Backend**: FastAPI, Python
- **Frontend**: React, Vite, Leaflet, React-Leaflet
- **Mapas**: OpenStreetMap, OSRM
- **Styling**: Tailwind CSS concepts con Inline Styles

## 📝 Notas

- Las estaciones están mapeadas a coordenadas reales en Villavicencio, Colombia
- La ruta en el mapa usa OSRM para calcular caminos más precisos
- El zoom del mapa se ajusta automáticamente a todas las estaciones

## 📧 Contacto

Para preguntas o sugerencias, contáctame.

---

**Hecho con ❤️ usando A* para búsqueda inteligente**
