import { Context } from "hono";

export const errorHandler = async (c: Context, next: () => Promise<void>) => {
  try {
    await next();
  } catch (err) {
    console.error(err);

    // Check if err is an instance of Error
    if (err instanceof Error) {
      c.status(500);
      c.json({ error: "Internal Server Error", message: err.message });
    } else {
      // Handle cases where err is not an Error
      c.status(500);
      c.json({ error: "Internal Server Error", message: "An unexpected error occurred." });
    }
  }
};
