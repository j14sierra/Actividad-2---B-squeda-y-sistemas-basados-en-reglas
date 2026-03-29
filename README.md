# 🚍 Rutas Inteligentes

Sistema de búsqueda y cálculo de rutas óptimas utilizando el algoritmo A* con una interfaz interactiva en mapa.

## 🎯 Características

- ✨ Visualización en tiempo real en mapas interactivos (Leaflet)
- 🚗 Animación de recorrido del vehículo en tiempo real
- 📊 Barra de progreso dinámica con porcentaje
- ⏱️ Contador de tiempo estimado restante
- 🔍 Algoritmo A* para búsqueda óptima de rutas
- 📈 Visualización completa del grafo de estaciones
- 🌐 Backend con FastAPI
- 📱 Interfaz responsive y moderna
- 🗺️ Zoom automático en coordenadas
- 🌙 Tema oscuro profesional

## 📋 Requisitos

Antes de instalar, asegúrate de tener:
- **Python 3.8 o superior** - [Descargar](https://www.python.org/downloads/)
- **Node.js 14 o superior** - [Descargar](https://nodejs.org/)
- **npm** (incluido con Node.js)
- **Git** (opcional, pero recomendado)

## 🚀 Instalación

### Paso 0: Clonar el repositorio (Opcional)

Si aún no tienes el proyecto, clónalo:

```bash
git clone https://github.com/j14sierra/Actividad-2---B-squeda-y-sistemas-basados-en-reglas.git
cd rutas-inteligentes
```

### Paso 1: Instalar dependencias del Backend

Abre una **terminal en la carpeta `backend`**:

```bash
cd backend
```

Instala las dependencias de Python:

```bash
pip install fastapi uvicorn
```

Si tienes problemas, intenta con:
```bash
python -m pip install fastapi uvicorn
```

### Paso 2: Instalar dependencias del Frontend

Abre una **nueva terminal en la carpeta `frontend`**:

```bash
cd frontend
```

Instala las dependencias de Node.js:

```bash
npm install
```

Esto descargará todas las librerías necesarias (React, Vite, Leaflet, etc.).

## 🏃 Ejecución

> ⚠️ **Importante**: Ejecuta primero el backend, luego el frontend en dos terminales diferentes.

### Paso 1: Iniciar el Backend (Terminal 1)

Abre una terminal y navega a la carpeta backend:

```bash
cd backend
```

Inicia el servidor FastAPI:

```bash
python -m uvicorn main:app --reload
```

**Deberías ver un mensaje como:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

✅ El backend está listo en `http://127.0.0.1:8000`

### Paso 2: Iniciar el Frontend (Terminal 2)

Abre una **nueva terminal** y navega a la carpeta frontend:

```bash
cd frontend
```

Inicia el servidor de desarrollo:

```bash
npm run dev
```

**Deberías ver un mensaje como:**
```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

✅ La aplicación se abrirá automáticamente en `http://localhost:5173`

### ¿No se abre automáticamente?

Manual: Abre tu navegador y ve a `http://localhost:5173`

### Verificación

- ✅ Backend corriendo en `http://127.0.0.1:8000`
- ✅ Frontend corriendo en `http://localhost:5173`
- ✅ El mapa debe mostrarse con las estaciones
- ✅ Los selects de inicio y destino deben estar llenos

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

## 🐛 Solución de Problemas (Troubleshooting)

### ❌ Error: "No se puede conectar con el backend"

**Solución:**
1. Verifica que el backend esté corriendo: `http://127.0.0.1:8000`
2. Abre la consola del navegador (F12) y busca errores CORS
3. Reinicia ambos servidores

### ❌ Error: "Puerto 8000 ya está en uso"

**Solución:**
```bash
# En Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# En Mac/Linux
lsof -i :8000
kill -9 <PID>
```

### ❌ Error: "Node modules no encontrado"

**Solución:**
```bash
cd frontend
rm -r node_modules
npm install
```

### ❌ El mapa no muestra estaciones

**Solución:**
1. Abre F12 (Consola del navegador)
2. Verifica que no haya errores rojos
3. Busca el log "Grafo cargado:" 
4. Si no aparece, reinicia ambos servidores

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

### GET /grafo
Retorna el grafo completo con todas las conexiones entre estaciones.

**Respuesta:**
```json
{
  "A": {
    "nombre": "Mi Casa",
    "conexiones": [
      {"destino": "B", "nombre_destino": "Sena", "costo": 2},
      {"destino": "D", "nombre_destino": "Barrio la Ronda", "costo": 4}
    ]
  },
  "B": {
    "nombre": "Sena",
    "conexiones": [
      {"destino": "A", "nombre_destino": "Mi Casa", "costo": 2},
      {"destino": "C", "nombre_destino": "Villa del Bosque", "costo": 3},
      {"destino": "E", "nombre_destino": "Martín Galeano", "costo": 2}
    ]
  }
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
- La barra de progreso muestra el avance en tiempo real mientras se ejecuta el recorrido
- Puedes ver el mapa completo del grafo expandiendo la sección "Ver Mapa del Grafo"
- El tiempo restante se calcula dinámicamente según la velocidad de recorrido actual

## 📧 Integrante

Johan Camilo Sierra

---

**Hecho con ❤️ usando AI para búsqueda inteligente**
