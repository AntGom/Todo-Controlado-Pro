const allowedOrigins = [
  "https://todo-controlado-pro.vercel.app",
  "https://todo-controlado-pro-git-main-antonios-projects-99da8543.vercel.app",
  "https://todo-controlado-nio9tpp2j-antonios-projects-99da8543.vercel.app",
  "http://localhost:5173",
];

function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next();
  } else {
    res.status(403).send("Not allowed by CORS");
  }
}

module.exports = corsMiddleware;
