/** Vercel serverless entry: import the bundled production Express server. */
// The Vercel builder executes npm run build before packaging functions.
// The raw TS source is not deployed at /var/task/server.ts.
import app from "../dist/server.cjs";
export default app;
