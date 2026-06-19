import { createApp } from './app';
import { config } from './config/env';
import { sequelize } from './models'; // index.ts wires associations on import

async function start(): Promise<void> {
  try {
    await sequelize.authenticate(); // fail fast if DB unreachable (503-class)
    const app = createApp();
    app.listen(config.PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`ServiceHub API listening on :${config.PORT} (${config.NODE_ENV})`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Fatal: failed to start backend', err);
    process.exit(1);
  }
}

void start();
