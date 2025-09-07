import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { connectDb } from "./database/connection";

// import ingredientsRouter from "./routes/ingredients/index";
// import recipeRouter from "./routes/recipe/index";

const APP_PORT = process.env.APP_PORT || 5001;

const app = express();

app.use(cors());
app.use(bodyParser.json());

// app.use("/ingredients", ingredientsRouter);
// app.use("/recipes", recipeRouter);

const startServer = async () => {
  const db = await connectDb();
  app.set("db", db);
  app.listen(APP_PORT, () => {
    console.log(`Server started on http://localhost:${APP_PORT}`);
  });
};

startServer().catch((error) => console.error(error));
