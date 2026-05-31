// Need to be introduced directly at the top of the entry file

import '@arco-design/web-react/es/_util/react-19-adapter';

import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Home } from "./Home";
import { Templates } from "./Templates";
import "./global.css";
import { nanoid } from "nanoid";

const getClientId = () => {
  let userId = window.localStorage.getItem("userId");

  if (!userId) {
    userId = nanoid();

    window.localStorage.setItem("userId", userId);
  }

  return userId;
};

const Full = React.lazy(() => import("./examples/Full/index"));
const AIAgent = React.lazy(() => import("./examples/AIAgent/index"));
const AMP = React.lazy(() => import("./examples/AMP/index"));
const Simple = React.lazy(() => import("./examples/Simple/index"));
const Customize = React.lazy(() => import("./examples/Customize/index"));
const SideBar = React.lazy(() => import("./examples/SideBar/index"));
const UniversalElement = React.lazy(
  () => import("./examples/UniversalElement/index")
);
const UniversalElement2 = React.lazy(
  () => import("./examples/UniversalElement2/index")
);
const ColorTheme = React.lazy(() => import("./examples/ColorTheme/index"));
const Localization = React.lazy(() => import("./examples/Localization/index"));
const DynamicData = React.lazy(() => import("./examples/DynamicData/index"));
const CustomTemplateEngine = React.lazy(
  () => import("./examples/CustomTemplateEngine/index")
);
const ResponsiveView = React.lazy(
  () => import("./examples/ResponsiveView/index")
);
const SimpleCustomBlock = React.lazy(
  () => import("./examples/SimpleCustomBlock/index")
);
const CustomElementComponent = React.lazy(
  () => import("./examples/CustomElementComponent/index")
);
const DynamicCustomBlock = React.lazy(
  () => import("./examples/DynamicCustomBlock/index")
);
const FrozenBlock = React.lazy(() => import("./examples/FrozenBlock/index"));
const PageHeaderFooter = React.lazy(
  () => import("./examples/PageHeaderFooter/index")
);
const ReadOnly = React.lazy(() => import("./examples/ReadOnly/index"));

const Modern = React.lazy(() => import("./examples/Modern/index"));
const HtmlToMjml = React.lazy(() => import("./examples/HtmlToMjml/index"));
const Markdown = React.lazy(() => import("./examples/Markdown/index"));
const GlobalVariables = React.lazy(
  () => import("./examples/GlobalVariables/index")
);
const TemplateEditor = React.lazy(
  () => import("./examples/TemplateEditor/index")
);
const Studio = React.lazy(() => import("./examples/Studio/index"));

const StudioCustomField = React.lazy(
  () => import("./examples/StudioCustomField/index")
);
const StudioCustomFieldEditor = React.lazy(
  () => import("./examples/StudioCustomField/editor")
);

import ComponentsPage from "./ComponentsPage/index";

export const navigation = [
  {
    name: "Full",
    path: "/full",
    element: <Full />,
  },
  {
    name: "AMP",
    path: "/amp-email",
    element: <AMP />,
  },

  {
    name: "Customize",
    path: "/customize",
    element: <Customize />,
  },

  {
    name: "UniversalElement",
    path: "/universal-element",
    element: <UniversalElement />,
  },
  {
    name: "UniversalElement2",
    path: "/universal-element2",
    element: <UniversalElement2 />,
  },
  {
    name: "ColorTheme",
    path: "/color-theme",
    element: <ColorTheme />,
  },
  {
    name: "Localization",
    path: "/localization",
    element: <Localization />,
  },
  {
    name: "Dynamic data",
    path: "/dynamic-data",
    element: <DynamicData />,
  },
  {
    name: "AI Agent",
    path: "/ai-agent",
    element: <AIAgent />,
  },
  {
    name: "Studio",
    path: "/studio",
    element: <Studio />,
  },
  {
    name: "StudioCustomField",
    path: "/studio-custom-field",
    element: <StudioCustomField />,
  },
  {
    name: "StudioCustomFieldEditor",
    path: "/studio-custom-field-editor",
    element: <StudioCustomFieldEditor />,
  },
  {
    name: "Responsive view",
    path: "/responsive-view",
    element: <ResponsiveView />,
  },
  {
    name: "SideBar",
    path: "/side-bar",
    element: <SideBar />,
  },
  {
    name: "Simple",
    path: "/simple",
    element: <Simple />,
  },
  {
    name: "Simple custom block",
    path: "/simple-custom-block",
    element: <SimpleCustomBlock />,
  },
  {
    name: "Custom element component",
    path: "/custom-element-component",
    element: <CustomElementComponent />,
  },
  {
    name: "Dynamic custom block",
    path: "/dynamic-custom-block",
    element: <DynamicCustomBlock />,
  },

  {
    name: "Frozen block",
    path: "/frozen-block",
    element: <FrozenBlock />,
  },
  {
    name: "Page Header & Footer",
    path: "/page-header-footer",
    element: <PageHeaderFooter />,
  },
  {
    name: "Read only",
    path: "/read-only",
    element: <ReadOnly />,
  },
  {
    name: "GlobalVariables",
    path: "/global-variables",
    element: <GlobalVariables />,
  },
  {
    name: "Modern",
    path: "/modern",
    element: <Modern />,
  },
  {
    name: "HTML to MJML",
    path: "/html-to-mjml",
    element: <HtmlToMjml />,
  },
];

const router = createBrowserRouter([
  ...navigation,
  {
    name: "Home",
    path: "/",
    element: <Home />,
  },
  {
    name: "Templates",
    path: "/templates",
    element: <Templates />,
  },
  // {
  //   name: "Template Engine",
  //   path: "/template-engine",
  //   element: <CustomTemplateEngine />,
  // },

  {
    name: "Template",
    path: "/template",
    element: <TemplateEditor />,
  },
  {
    name: "Components",
    path: "/components",
    element: <ComponentsPage />,
  },
  {
    name: "Share",
    path: "/share",
    element: <TemplateEditor />,
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <RouterProvider router={router} />
);
