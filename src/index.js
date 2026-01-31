// if (typeof File === "undefined") { global.File = class {}; }

import express from "express";
import morgan from "morgan";
import path from "path";
import flash from "connect-flash";
import session from "express-session";
import MariaDBStoreFactory from "express-mysql-session";
import passport from "passport";
import cors from "cors";


import { fileURLToPath } from "url";

// ==============================
// __dirname en ESM
// ==============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==============================
// Config / DB / Keys
// ==============================

// ==============================
// Passport config
// ==============================
import "./lib/passport.js";

// ==============================
// App init
// ==============================
const app = express();
const PUERTO = 4000;

//app.set("key", keys.key);
app.set("port", PUERTO);
app.set("view engine", ".hbs");

// ==============================
// Middlewares
// ==============================
app.use(
  session({
    secret: "faztmysqlnodesession",
    resave: false,
    saveUninitialized: false
  })
);

app.use("/imagenesvendedoras", express.static("imagenesvendedoras"));

app.use(flash());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(passport.initialize());

// ==============================
// CORS
// ==============================
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// ==============================
// Routes
// ==============================
import indexRoutes from "./routes/index.js";
import authRoutes from "./routes/authentication.js";
import dtcRoutes from "./routes/dtc.js";
import personasRoutes from "./routes/personas.js";
import cursosRoutes from "./routes/cursos.js";
import novedadesRoutes from "./routes/novedades.js";
import inscripcionesRoutes from "./routes/inscripciones.js";
import tareasRoutes from "./routes/tareas.js";
import administracionRoutes from "./routes/administracion.js";
import encargadosRoutes from "./routes/encargados.js";
import turnosRoutes from "./routes/turnos.js";
import coordinadoresRoutes from "./routes/coordinadores.js";
import fiscalizacionRoutes from "./routes/fiscalizacion.js";
import carnavalesRoutes from "./routes/carnavales.js";
import vendedorasRoutes from "./routes/vendedoras.js";
import doneuRoutes from "./routes/doneu.js";
import f1Routes from "./routes/f1.js";
import clinicaRoutes from "./routes/clinica.js";
import quilmesRoutes from "./routes/quilmes.js";

app.use(indexRoutes);
app.use(authRoutes);
app.use("/dtc", dtcRoutes);
app.use("/personas", personasRoutes);
app.use("/cursos", cursosRoutes);
app.use("/novedades", novedadesRoutes);
app.use("/inscripciones", inscripcionesRoutes);
app.use("/tareas", tareasRoutes);
app.use("/administracion", administracionRoutes);
app.use("/encargados", encargadosRoutes);
app.use("/turnos", turnosRoutes);
app.use("/coordinadores", coordinadoresRoutes);
app.use("/fiscalizacion", fiscalizacionRoutes);
app.use("/carnavales", carnavalesRoutes);
app.use("/vendedoras", vendedorasRoutes);
app.use("/doneu", doneuRoutes);
app.use("/f1", f1Routes);
app.use("/clinica", clinicaRoutes);
app.use("/quilmes", quilmesRoutes);



// ==============================
// Public
// ==============================
app.use(express.static(path.join(__dirname, "public")));

// ==============================
// Start server
// ==============================
app.listen(app.get("port"), () => {
  console.log("✅ Server on port", app.get("port"));
});
