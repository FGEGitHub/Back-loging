import mariadb from "mariadb";
import { database } from "./keys.js";

const pool = mariadb.createPool(database);

// Test de conexión
pool.getConnection()
  .then((connection) => {
    console.log("DB is Connected");
    connection.release();
  })
  .catch((err) => {
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
