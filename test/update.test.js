import { test } from "node:test";
import assert from "node:assert/strict";
import { isNewer, pickLatest, updateToShow } from "../lib/update.js";
import { docFrom } from "./helpers.js";
import { renderUpdateBanner } from "../content/update-banner.js";

test("isNewer compara semver y tolera la 'v'", () => {
  assert.equal(isNewer("v0.2.0", "0.1.0"), true);
  assert.equal(isNewer("0.1.10", "0.1.9"), true);
  assert.equal(isNewer("1.0.0", "0.9.9"), true);
  assert.equal(isNewer("0.1.0", "0.1.0"), false);
  assert.equal(isNewer("0.0.9", "0.1.0"), false);
  assert.equal(isNewer("basura", "0.1.0"), false);
});

test("pickLatest toma el tag del release publicado", () => {
  assert.deepEqual(pickLatest({ tag_name: "v0.2.0", html_url: "https://github.com/x/r/releases/tag/v0.2.0", draft: false, prerelease: false }),
    { version: "0.2.0", url: "https://github.com/x/r/releases/tag/v0.2.0" });
  assert.equal(pickLatest({ tag_name: "v0.3.0", prerelease: true }), null);
  assert.equal(pickLatest({ message: "Not Found" }), null);
});

test("updateToShow: solo si es más nueva y no se ocultó esa versión", () => {
  const latest = { version: "0.2.0", url: "u" };
  assert.deepEqual(updateToShow(latest, "0.1.0", undefined), latest);
  assert.equal(updateToShow(latest, "0.1.0", "0.2.0"), null);
  assert.deepEqual(updateToShow({ version: "0.3.0", url: "u" }, "0.1.0", "0.2.0"), { version: "0.3.0", url: "u" });
  assert.equal(updateToShow(latest, "0.2.0", undefined), null);
  assert.equal(updateToShow(null, "0.1.0", undefined), null);
});

test("banner: versión, descarga, cómo actualizar y cerrar", () => {
  const doc = docFrom("");
  let dismissed = null;
  const b = renderUpdateBanner(doc, { version: "0.2.0", url: "https://github.com/x/r/releases/tag/v0.2.0" }, (v) => { dismissed = v; });
  assert.match(b.textContent, /Hay una versión nueva de Amazoncito \(0\.2\.0\)/);
  const links = [...b.querySelectorAll("a")].map((a) => a.getAttribute("href"));
  assert.ok(links.includes("https://github.com/Gremiger/amazoncito/releases/latest/download/amazoncito.zip"));
  assert.ok(links.includes("https://github.com/Gremiger/amazoncito#actualizar"));
  doc.body.append(b);
  assert.equal(b.isConnected, true);
  b.querySelector("button").dispatchEvent(new doc.defaultView.Event("click"));
  assert.equal(dismissed, "0.2.0");
  assert.equal(b.isConnected, false);
});
