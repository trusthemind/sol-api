import mongoose from "mongoose";
import app from "./app";
import { config } from "./config/env";
import Logger from "./utils/logger";

class Server {
  private readonly logger = new Logger(Server.name);

  private async connectToDatabase() {
    try {
      await mongoose.connect(config.MONGODB_URL, {} as mongoose.ConnectOptions);
      this.logger.info("✅ Connected to MongoDB");
    } catch (err) {
      this.logger.error("❌ Failed to connect to MongoDB", err);
      process.exit(1);
    }
  }

  public async start() {
    app.listen(config.PORT, () => {
      this.logger.info(`🚀 Server running on http://localhost:${config.PORT}`);
    });
    await this.connectToDatabase();
  }
}

new Server().start();
