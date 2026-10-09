import { readFileSync } from "node:fs";
import { DOMParser } from "linkedom";

export function loadFixture(name) {
  const html = readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
  return new DOMParser().parseFromString(html, "text/html");
}

export function docFrom(html) {
  return new DOMParser().parseFromString(`<!doctype html><html><body>${html}</body></html>`, "text/html");
}
