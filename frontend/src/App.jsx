import { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap
} from "react-leaflet";
import L from "leaflet";

// 🔥 Fix iconos Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// 🚗 Icono carro
const carIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/744/744465.png",
  iconSize: [35, 35],
});

// 🗺️ Componente para ajustar zoom automático
function AjustarZoomMapa({ estaciones }) {
  const mapa = useMap();

  useEffect(() => {
    if (Object.keys(estaciones).length === 0) return;

    const coords = Object.values(estaciones).map(e => e.coords);
    if (coords.length === 0) return;

    const bounds = L.latLngBounds(coords);
    mapa.fitBounds(bounds, { padding: [80, 80] });
  }, [estaciones, mapa]);

  return null;
}

export default function App() {
  const [estaciones, setEstaciones] = useState({});
  const [inicio, setInicio] = useState("");
  const [destino, setDestino] = useState("");
  const [ruta, setRuta] = useState([]);
  const [tramos, setTramos] = useState([]);
  const [rutaReal, setRutaReal] = useState([]);
  const [posCarro, setPosCarro] = useState(null);
  const [costoTotal, setCostoTotal] = useState(0);
  const [costoActual, setCostoActual] = useState(0);
  const [porcentajeRecorrido, setPorcentajeRecorrido] = useState(0);
  const [duracionEstimada, setDuracionEstimada] = useState(0);
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [grafo, setGrafo] = useState({});
  const [mostrarGrafo, setMostrarGrafo] = useState(false);

  const animando = useRef(false);

  // 🔥 Cargar estaciones desde backend
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/estaciones");
        const data = await res.json();

        setEstaciones(data);

        const keys = Object.keys(data);
        if (keys.length > 0) {
          setInicio(keys[0]);
          setDestino(keys[keys.length - 1]);
        }
      } catch (err) {
        console.error("Error cargando estaciones", err);
      }

      // Cargar grafo
      try {
        const resGrafo = await fetch("http://127.0.0.1:8000/grafo");
        const dataGrafo = await resGrafo.json();
        setGrafo(dataGrafo);
      } catch (err) {
        console.error("Error cargando grafo", err);
      }
    };

    cargarDatos();
  }, []);

  // 🌐 Obtener ruta real más corta entre dos estaciones (OSRM)
  const obtenerRutaReal = async (origen, destino) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origen[1]},${origen[0]};${destino[1]},${destino[0]}?overview=full&geometries=geojson`;

      const res = await fetch(url);
      const data = await res.json();

      if (!data.routes || data.routes.length === 0) {
        return [origen, destino];
      }

      return data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
    } catch {
      return [origen, destino];
    }
  };

  // 🚗 Animación
  const moverCarro = async (tramos) => {
    if (animando.current) return;
    animando.current = true;

    setRutaReal([]);
    setCostoActual(0);
    setPorcentajeRecorrido(0);

    const costoTotal = tramos.reduce((sum, t) => sum + t.cost, 0);
    const tiempoInicio = Date.now();

    for (let i = 0; i < tramos.length; i++) {
      const tramo = tramos[i];
      const origen = estaciones[tramo.from].coords;
      const destino = estaciones[tramo.to].coords;

      const segmento = await obtenerRutaReal(origen, destino);

      setRutaReal(prev => [...prev, ...segmento]);

      // Costo acumulado de tramos anteriores
      const costoTramosPrevios = tramos.slice(0, i).reduce((sum, t) => sum + t.cost, 0);

      for (let j = 0; j < segmento.length; j++) {
        const punto = segmento[j];
        setPosCarro(punto);
        
        // Progreso dentro del segmento actual (0 a 1)
        const progresoEnSegmento = j / segmento.length;
        
        // Costo acumulado real = tramos anteriores + progreso del tramo actual
        const costoAcumuladoReal = costoTramosPrevios + (tramo.cost * progresoEnSegmento);
        
        // Calcular porcentaje
        const porcentaje = Math.round((costoAcumuladoReal / costoTotal) * 100);
        setPorcentajeRecorrido(Math.min(porcentaje, 100));
        setCostoActual(parseFloat(costoAcumuladoReal.toFixed(2)));
        
        // Calcular tiempo restante
        const tiempoTranscurrido = (Date.now() - tiempoInicio) / 1000;
        const velocidad = costoAcumuladoReal / Math.max(tiempoTranscurrido, 1);
        const costoRestante = costoTotal - costoAcumuladoReal;
        const tiempoEst = Math.ceil((costoRestante / velocidad));
        setTiempoRestante(Math.max(tiempoEst, 0));
        
        await new Promise(r => setTimeout(r, 30));
      }
    }

    // Finalizar
    setCostoActual(costoTotal);
    setPorcentajeRecorrido(100);
    setTiempoRestante(0);

    animando.current = false;
  };

  // 🔗 Calcular ruta con backend
  const calcularRuta = async () => {
    try {
      if (!inicio || !destino) {
        alert("Selecciona estaciones");
        return;
      }

      // limpiar estado
      setRuta([]);
      setTramos([]);
      setRutaReal([]);
      setPosCarro(null);
      setCostoActual(0);
      setPorcentajeRecorrido(0);
      setTiempoRestante(0);

      const res = await fetch(
        `http://127.0.0.1:8000/ruta?inicio=${inicio}&destino=${destino}`
      );

      const data = await res.json();
      console.log("Respuesta backend:", data);

      if (data.error) {
        alert(data.error);
        return;
      }

      setRuta(data.ruta);
      setTramos(data.tramos);
      setCostoTotal(data.costo_total);
      console.log("Costo total establecido:", data.costo_total);

      moverCarro(data.tramos);

    } catch (err) {
      console.error(err);
      alert("Error conectando con backend");
    }
  };

  return (
    <div style={{ height: "100vh", width: "100%" }}>

      {/* PANEL */}
      <div style={{
        position: "absolute",
        top: 20,
        left: 20,
        right: "auto",
        zIndex: 1000,
        background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)",
        color: "white",
        padding: "clamp(15px, 5vw, 25px)",
        borderRadius: 16,
        width: "clamp(280px, 90vw, 350px)",
        maxHeight: "85vh",
        overflowY: "auto",
        boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255, 255, 255, 0.1) inset",
        border: "1px solid rgba(148, 163, 184, 0.2)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}>
        <h2 style={{ margin: "0 0 clamp(15px, 3vh, 25px) 0", fontSize: "clamp(18px, 5vw, 24px)", fontWeight: 700, textAlign: "center", background: "linear-gradient(135deg, #3b82f6, #60a5fa)", backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent" }}>🚍 Rutas Inteligentes</h2>

        {/* SELECT INICIO */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontSize: "clamp(10px, 2vw, 12px)", fontWeight: 600, marginBottom: 8, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: 0.5 }}>Punto de Inicio</label>
          <select value={inicio} onChange={e => setInicio(e.target.value)} style={{
            width: "100%",
            padding: "clamp(10px, 2vw, 12px) clamp(10px, 2vw, 14px)",
            background: "rgba(30, 41, 59, 0.5)",
            border: "2px solid rgba(148, 163, 184, 0.3)",
            borderRadius: 10,
            color: "white",
            fontSize: "clamp(11px, 2vw, 13px)",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.3s ease",
            outline: "none",
            boxSizing: "border-box"
          }} 
          onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
          onBlur={(e) => e.target.style.borderColor = "rgba(148, 163, 184, 0.3)"}
          >
            {Object.keys(estaciones).map(n => (
              <option key={n} value={n}>
                {n} - {estaciones[n].name}
              </option>
            ))}
          </select>
        </div>

        {/* SELECT DESTINO */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontSize: "clamp(10px, 2vw, 12px)", fontWeight: 600, marginBottom: 8, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: 0.5 }}>Punto de Destino</label>
          <select value={destino} onChange={e => setDestino(e.target.value)} style={{
            width: "100%",
            padding: "clamp(10px, 2vw, 12px) clamp(10px, 2vw, 14px)",
            background: "rgba(30, 41, 59, 0.5)",
            border: "2px solid rgba(148, 163, 184, 0.3)",
            borderRadius: 10,
            color: "white",
            fontSize: "clamp(11px, 2vw, 13px)",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.3s ease",
            outline: "none",
            boxSizing: "border-box"
          }}
          onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
          onBlur={(e) => e.target.style.borderColor = "rgba(148, 163, 184, 0.3)"}
          >
            {Object.keys(estaciones).map(n => (
              <option key={n} value={n}>
                {n} - {estaciones[n].name}
              </option>
            ))}
          </select>
        </div>

        {/* BOTÓN CALCULAR */}
        <button
          onClick={calcularRuta}
          style={{
            width: "100%",
            marginTop: 22,
            marginBottom: 22,
            padding: "clamp(12px, 2vw, 14px) clamp(15px, 3vw, 20px)",
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            color: "white",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            fontWeight: 700,
            fontSize: "clamp(12px, 2vw, 14px)",
            letterSpacing: 0.5,
            transition: "all 0.3s ease",
            boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)",
            textTransform: "uppercase",
            boxSizing: "border-box"
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 15px 35px rgba(59, 130, 246, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 10px 25px rgba(59, 130, 246, 0.3)";
          }}
        >
          Calcular Ruta
        </button>

        {/* RESULTADOS */}
        <div style={{ marginTop: 20, padding: "clamp(12px, 2vw, 16px)", background: "rgba(15, 23, 42, 0.6)", borderRadius: 12, border: "1px solid rgba(59, 130, 246, 0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, gap: 10 }}>
            <span style={{ fontSize: "clamp(10px, 1.5vw, 11px)", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Total:</span>
            <span style={{ fontSize: "clamp(14px, 4vw, 18px)", fontWeight: 800, color: "#10b981" }}>{costoTotal}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, gap: 10 }}>
            <span style={{ fontSize: "clamp(10px, 1.5vw, 11px)", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Recorrido:</span>
            <span style={{ fontSize: "clamp(14px, 4vw, 18px)", fontWeight: 800, color: "#f59e0b" }}>{costoActual}</span>
          </div>

          {/* Barra de Progreso */}
          {porcentajeRecorrido > 0 && (
            <div style={{ marginTop: 12, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: "clamp(9px, 1.5vw, 10px)", fontWeight: 600, color: "#cbd5e1" }}>Progreso</span>
                <span style={{ fontSize: "clamp(10px, 1.5vw, 11px)", fontWeight: 700, color: "#60a5fa" }}>{porcentajeRecorrido}%</span>
              </div>
              <div style={{ width: "100%", height: 8, background: "rgba(30, 41, 59, 0.8)", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(96, 165, 250, 0.3)" }}>
                <div style={{ height: "100%", background: "linear-gradient(90deg, #3b82f6, #60a5fa)", width: `${porcentajeRecorrido}%`, transition: "width 0.1s ease" }} />
              </div>
            </div>
          )}

          {/* Tiempo Restante */}
          {tiempoRestante > 0 && (
            <div style={{ marginTop: 12, padding: 10, background: "rgba(59, 130, 246, 0.15)", borderRadius: 8, border: "1px solid rgba(96, 165, 250, 0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "clamp(9px, 1.5vw, 10px)", fontWeight: 600, color: "#cbd5e1" }}>⏱️ Tiempo restante:</span>
                <span style={{ fontSize: "clamp(11px, 2vw, 13px)", fontWeight: 700, color: "#38bdf8" }}>{tiempoRestante}s</span>
              </div>
            </div>
          )}
        </div>

        {/* TRAMOS */}
        {tramos.length > 0 && (
          <div style={{ marginTop: 18, padding: "clamp(10px, 2vw, 14px)", background: "rgba(15, 23, 42, 0.6)", borderRadius: 12, border: "1px solid rgba(148, 163, 184, 0.2)", maxHeight: "clamp(120px, 30vh, 180px)", overflowY: "auto" }}>
            <strong style={{ fontSize: "clamp(10px, 1.5vw, 12px)", fontWeight: 700, color: "#cbd5e1", display: "block", marginBottom: 12, textTransform: "uppercase" }}>📍 Tramos del Recorrido:</strong>
            {tramos.map((t, i) => (
              <div key={i} style={{ fontSize: "clamp(10px, 1.5vw, 12px)", margin: "8px 0", padding: "8px 10px", background: "rgba(59, 130, 246, 0.1)", borderLeft: "3px solid #3b82f6", borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#e2e8f0" }}>{t.from} <span style={{ color: "#64748b" }}>→</span> {t.to}</span>
                <span style={{ color: "#10b981", fontWeight: 700, fontSize: "clamp(11px, 1.5vw, 13px)", whiteSpace: "nowrap" }}>+{t.cost}</span>
              </div>
            ))}
          </div>
        )}

        {/* MAPA DEL GRAFO */}
        <div style={{ marginTop: 18 }}>
          <button
            onClick={() => setMostrarGrafo(!mostrarGrafo)}
            style={{
              width: "100%",
              padding: "clamp(10px, 2vw, 12px)",
              background: "rgba(34, 197, 94, 0.2)",
              border: "1px solid rgba(34, 197, 94, 0.4)",
              borderRadius: 10,
              color: "#22c55e",
              fontWeight: 700,
              fontSize: "clamp(10px, 1.5vw, 12px)",
              cursor: "pointer",
              transition: "all 0.3s ease",
              textTransform: "uppercase"
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(34, 197, 94, 0.3)";
              e.target.style.borderColor = "rgba(34, 197, 94, 0.6)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(34, 197, 94, 0.2)";
              e.target.style.borderColor = "rgba(34, 197, 94, 0.4)";
            }}
          >
            {mostrarGrafo ? "🔽 Ocultar" : "▶️ Ver"} Mapa del Grafo
          </button>

          {mostrarGrafo && (
            <div style={{ marginTop: 12, padding: "clamp(10px, 2vw, 14px)", background: "rgba(34, 197, 94, 0.05)", borderRadius: 12, border: "1px solid rgba(34, 197, 94, 0.3)", maxHeight: "clamp(150px, 35vh, 250px)", overflowY: "auto" }}>
              {Object.entries(grafo).map(([estacion, datos]) => (
                <div key={estacion} style={{ marginBottom: 12, padding: 10, background: "rgba(15, 23, 42, 0.8)", borderRadius: 8, borderLeft: "3px solid #22c55e" }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: "clamp(10px, 1.5vw, 12px)", fontWeight: 700, color: "#22c55e" }}>📍 {estacion}</span>
                    <span style={{ fontSize: "clamp(8px, 1.2vw, 10px)", color: "#64748b", marginLeft: 8 }}>({datos.nombre})</span>
                  </div>
                  <div style={{ paddingLeft: 10, borderLeft: "2px solid rgba(34, 197, 94, 0.3)" }}>
                    {datos.conexiones.map((conexion, idx) => (
                      <div key={idx} style={{ fontSize: "clamp(9px, 1.3vw, 11px)", color: "#cbd5e1", marginBottom: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>→ {conexion.destino} <span style={{ color: "#94a3b8", fontSize: "clamp(8px, 1vw, 9px)" }}>({conexion.nombre_destino})</span></span>
                        <span style={{ color: "#60a5fa", fontWeight: 700 }}>+{conexion.costo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MAPA */}
      <MapContainer
        center={[6.232, -73.567]}
        zoom={16}
        style={{ height: "100%", width: "100%" }}
      >
        {/* 🌙 Modo noche */}
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

        {/* 🔄 Ajuste automático de zoom */}
        <AjustarZoomMapa estaciones={estaciones} />

        {/* 📍 Estaciones dinámicas */}
        {Object.entries(estaciones).map(([k, v]) => (
          <Marker key={k} position={v.coords}>
            <Popup>
              <strong>{v.name}</strong><br />
              Nodo: {k}
            </Popup>
          </Marker>
        ))}

        {/* 🗺️ Ruta */}
        {rutaReal.length > 0 && (
          <Polyline positions={rutaReal} color="cyan" />
        )}

        {/* 🚗 Carro */}
        {posCarro && (
          <Marker position={posCarro} icon={carIcon} />
        )}
      </MapContainer>
    </div>
  );
}