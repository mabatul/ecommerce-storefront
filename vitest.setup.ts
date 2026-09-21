import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Component tests opt into jsdom with a `@vitest-environment jsdom` docblock; the rest stay in node.
afterEach(() => {
  if (typeof document !== "undefined") cleanup();
});
