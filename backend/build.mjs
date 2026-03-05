import esbuild from "esbuild";
import { readdirSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const entryPoints = readdirSync("src/handlers")
  .filter((file) => file.endsWith(".ts"))
  .map((file) => join("src/handlers", file));

if (!existsSync("dist")) {
  mkdirSync("dist");
}

esbuild
  .build({
    entryPoints,
    bundle: true,
    outdir: "dist",
    platform: "node",
    target: "node20",
    minify: true,
  })
  .catch(() => process.exit(1));
