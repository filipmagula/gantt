import { app as n, BrowserWindow as s } from "electron";
import { fileURLToPath as a } from "node:url";
import e from "node:path";
const t = e.dirname(a(import.meta.url));
process.env.DIST = e.join(t, "../dist");
process.env.VITE_PUBLIC = n.isPackaged ? process.env.DIST : e.join(process.env.DIST, "../public");
let o;
const i = process.env.VITE_DEV_SERVER_URL;
function r() {
  o = new s({
    icon: e.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    width: 1280,
    height: 800,
    webPreferences: {
      preload: e.join(t, "preload.js")
    }
  }), o.webContents.on("did-finish-load", () => {
    o?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), i ? o.loadURL(i) : o.loadFile(e.join(process.env.DIST, "index.html"));
}
n.on("window-all-closed", () => {
  process.platform !== "darwin" && n.quit();
});
n.on("activate", () => {
  s.getAllWindows().length === 0 && r();
});
n.whenReady().then(r);
