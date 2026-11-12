import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  { settings: { next: { rootDir: "client/" } } },
  { ignores: ["**/.next/**", "**/node_modules/**", "**/public/vision/**", "**/next-env.d.ts"] },
];
export default config;
