import mongoose from "mongoose";
import app from "./app";
import { config } from "./config/env";

mongoose
  .connect(config.MONGODB_URI)
  .then(() => {
    app.listen(config.PORT, () => {
      console.log(`🚀 Server running on http://localhost:${config.PORT}`);
    });
  })
  .catch(err => {
    console.error("❌ Failed to connect to MongoDB", err);
  });
