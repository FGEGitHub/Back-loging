import mariadb from "mariadb";
import { database6 } from "./keys.js";

const pool = mariadb.createPool(database6);

// Verificar conexión
pool.getConnection()
  .then(conn => {
    conn.release();
    console.log("DB is Connected");
  })
  .catch(err => {
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      console.error("DATABASE CONNECTION WAS CLOSED");
    }
    if (err.code === "ER_CON_COUNT_ERROR") {
      console.error("DATABASE HAS TOO MANY CONNECTIONS");
    }
    if (err.code === "ECONNREFUSED") {
      console.error("DATABASE CONNECTION WAS REFUSED");
    }
    console.error(err);
  });

export default pool;
