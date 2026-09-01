import jwt from "jsonwebtoken";

// =======================
// Helper para verificar token
// =======================
function verifyToken(req, secret) {
  const authorization = req.get("authorization");
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.substring(7);

  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}



function verifyTokenclin(req) {
    const authorization = req.get("authorization");

    // Verificar que exista el header Authorization
    // y que utilice el formato Bearer
    if (!authorization || !authorization.startsWith("Bearer ")) {
        console.log("No autorizado: Header Authorization no presente o formato incorrecto");
        return null;
    }

    // Obtener solamente el token
    const token = authorization.substring(7);

    try {
        // Verificar el token utilizando la clave del .env
        console.log(jwt.verify(token, process.env.JWT_SECRET));
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        console.log("Error al verificar el token:", error);
        return null;
    }
}



// =======================
// Middlewares
// =======================
export function isLoggedInncli(req, res, next) {

    const decodedToken = verifyTokenclin(req);
    console.log('decodedToken')
console.log(decodedToken)
    if (!decodedToken?.id) {
        return res.status(401).json({
            message: "No autorizado"
        });
    }
console.log(decodedToken)
    next();
}


export function isLoggedInn2(req, res, next) {
  const decodedToken = verifyToken(req, "fideicomisocs121");

  if (!decodedToken?.id || decodedToken.nivel !== 2) {
    return res.status(401).send("error login");
  }

  next();
}

export function isLoggedInn4(req, res, next) {
  const decodedToken = verifyToken(req, "fideicomisocs121");

  if (
    !decodedToken?.id ||
    ![2, 3, 4].includes(decodedToken.nivel)
  ) {
    return res.status(401).send("error login");
  }

  next();
}

export function isLoggedInn5(req, res, next) {
  const decodedToken = verifyToken(req, "fideicomisocs121");

  if (!decodedToken?.id || decodedToken.nivel !== 5) {
    return res.status(401).send("error login");
  }

  next();
}

export function isLoggedInn(req, res, next) {
  const decodedToken = verifyToken(req, "fideicomisocs121");

  if (!decodedToken?.id) {
    return res.status(401).send("error login");
  }

  next();
}


// =======================
// Passport
// =======================
export function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.redirect("/signin");
}

export function isNotLoggedIn(req, res, next) {
  if (!req.isAuthenticated()) {
    return next();
  }
  return res.redirect("/profile");
}
