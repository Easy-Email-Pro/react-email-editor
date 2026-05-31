import { importUnlayerDesign } from "../src/utils/importUnlayerTemplate";
import { PluginManager } from "easy-email-pro-core";

const design = {
  body: {
    values: {
      contentWidth: "700px",
      backgroundColor: "#ffffff",
      preheaderText: "Preview text",
    },
    rows: [
      {
        cells: [1],
        columns: [
          {
            contents: [
              {
                type: "image",
                values: {
                  src: {
                    url: "%%logo%%",
                    width: 300,
                    height: 78,
                    autoWidth: false,
                    maxWidth: "80%",
                  },
                  action: {
                    values: {
                      href: "https://example.com/%%shop_url%%",
                      target: "_blank",
                    },
                  },
                  containerPadding: "10px",
                  textAlign: "center",
                },
              },
              {
                type: "text",
                values: {
                  text: "<p>Hello Unlayer</p>",
                  containerPadding: "10px",
                  fontSize: "14px",
                  textAlign: "left",
                  lineHeight: "140%",
                },
              },
            ],
            values: {
              padding: "0px",
            },
          },
        ],
        values: {
          padding: "0px",
        },
      },
    ],
  },
};

const { template, warnings } = importUnlayerDesign(design, "unlayer.json");

if (template.subject !== "unlayer.json") {
  throw new Error(`Expected subject to use file name, got ${template.subject}`);
}

if (template.content.type !== "page") {
  throw new Error(`Expected page content, got ${template.content.type}`);
}

if (template.content.attributes.width !== "700px") {
  throw new Error(`Expected imported width 700px`);
}

const section = template.content.children[0] as any;
const column = section.children[0];
const image = column.children[0];
const expectedLogo = PluginManager.generateVariable("logo");
const expectedShopUrl = PluginManager.generateVariable("shop_url");

if (image.attributes.src !== expectedLogo) {
  throw new Error(`Expected image src ${expectedLogo}, got ${image.attributes.src}`);
}

if (image.attributes.href !== `https://example.com/${expectedShopUrl}`) {
  throw new Error(`Expected converted href variable, got ${image.attributes.href}`);
}

if (warnings.length !== 0) {
  throw new Error(`Expected no warnings, got ${warnings.length}`);
}

console.log("unlayer import smoke test passed");
