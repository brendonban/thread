/* Background removal for team photos (runs in the admin's browser).
   Model: ISNet (quantized) from @imgly/background-removal-data, runtime: onnxruntime-web.
   Both load from the jsDelivr CDN. To self-host, copy the files into public/ and change the two bases. */
const ORT_BASE = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.3/dist/";
const MODEL_BASE = "https://cdn.jsdelivr.net/npm/@imgly/background-removal-data@1.4.5/dist/";
const CHUNKS = ["b34a3e9350ad77140964b6a2e1e32cd9738acd9d01e5899b96be71901a22ef47", "8a85c22e472bed10198298a3d57480a5a90946dba88bddecf8b0bf0eafc06e70", "5faec25d2338ae8ca2c7bff72e954cebd40a04c5f34c4b6bb8ca6720fae40996", "b9861d932a549be455fc8ebd8ce5d413049515bfdd3edd55e136dbe05dd34ef5", "f070b4c4f512cfe8dd6936c3cb9a616f132894867d3d33304d83599eb6b55636", "10d02652d10fbc47bf93732ff9e8ad53eefbd3bd89ab3c1fbc15ddd740bea672", "014c9e0229363137e92b85ed3c6f56b1386c279cdd9af2d7f1960ed8428b5e94", "34dd3ad760f7e31b5e9144b8c387b8ecd6dc43116248c93c56dd7051ab525e3b", "e7ca5cc3e0afd65581642a05ac91eb8ea4d0deb868df94b8981c910212526476", "0ad4ebb86cfdd847901427181b7a7804dba93d868c3cd5f11a294acf36c9413f", "9582c0375aed822c5577a814766c4afc6c096f4ccd3b0d08af6a1794987206a1"];
importScripts(ORT_BASE + "ort.wasm.min.js");
ort.env.wasm.numThreads = 1;
ort.env.wasm.wasmPaths = ORT_BASE;

let sessionP = null;
async function load() {
  const parts = [];
  for (let i = 0; i < CHUNKS.length; i++) {
    postMessage({ type: "progress", text: `Loading background remover (${i + 1} of ${CHUNKS.length})…` });
    const r = await fetch(MODEL_BASE + CHUNKS[i]);
    if (!r.ok) throw new Error("Model file missing (" + r.status + ")");
    parts.push(new Uint8Array(await r.arrayBuffer()));
  }
  const buf = new Uint8Array(parts.reduce((a, p) => a + p.length, 0));
  let o = 0;
  for (const p of parts) { buf.set(p, o); o += p.length; }
  postMessage({ type: "progress", text: "Starting background remover…" });
  return ort.InferenceSession.create(buf, { executionProviders: ["wasm"], graphOptimizationLevel: "all" });
}

onmessage = async (e) => {
  const { id, input } = e.data;
  try {
    sessionP = sessionP || load();
    const s = await sessionP;
    postMessage({ type: "progress", text: "Removing background…" });
    const out = await s.run({ [s.inputNames[0]]: new ort.Tensor("float32", input, [1, 3, 1024, 1024]) });
    const mask = new Float32Array(out[s.outputNames[0]].data);
    postMessage({ id, mask }, [mask.buffer]);
  } catch (err) {
    sessionP = null;
    postMessage({ id, error: String((err && err.message) || err) });
  }
};
