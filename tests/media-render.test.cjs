/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test harness. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { ImageConfigContext } = require("next/dist/shared/lib/image-config-context.shared-runtime");
const { imageConfigDefault } = require("next/dist/shared/lib/image-config");

const root = path.resolve(__dirname, "..");

// Load the client components with an empty environment, independently of the
// machine's configured Cloudinary settings. Keep the real Next.js Image renderer.
function load(file, mocks = {}) {
  const compiledModule = { exports: {} };
  const { outputText } = ts.transpileModule(
    fs.readFileSync(path.join(root, file), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    },
  );
  vm.runInNewContext(outputText, {
    module: compiledModule,
    exports: compiledModule.exports,
    process: { env: {}, cwd: () => root },
    require(id) {
      assert.notEqual(id, "next-cloudinary", "Photo rendering must not require the Cloudinary browser SDK");
      return mocks[id] ?? require(id);
    },
  }, { filename: file });
  return compiledModule.exports;
}

const components = load("components/scrapbook/media.tsx", {
  "@/lib/media": load("lib/media.ts"),
  "@/lib/utils": { cn: (...values) => values.filter(Boolean).join(" ") },
});
const imageConfig = {
  ...imageConfigDefault,
  ...load("next.config.ts").default.images,
};
const media = {
  kind: "image",
  source: "cloudinary",
  publicId: "scrapbook/photo",
  src: "https://res.cloudinary.com/demo/image/upload/scrapbook/photo.jpg",
};

function render(name, asset) {
  return renderToStaticMarkup(
    React.createElement(ImageConfigContext.Provider, { value: imageConfig },
      React.createElement(components[name], { media: asset })),
  );
}

test("Cloudinary photo renders without public Cloudinary configuration", () => {
  assert.match(render("MediaImage", media), /scrapbook%2Fphoto.jpg/);
});

test("local photo still renders", () => {
  assert.match(render("MediaImage", { ...media, source: "local", src: "/photo.jpg" }), /<img/);
});

test("an asset without a URL or configured cloud renders a placeholder", () => {
  const html = render("MediaImage", { ...media, src: "" });
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /aria-hidden="true"/);
});

test("video poster derives its cloud from the saved delivery URL", () => {
  assert.match(render("MediaPosterImage", { ...media, kind: "video" }), /video%2Fupload/);
});
