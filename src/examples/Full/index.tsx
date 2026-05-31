import { useEffect, useMemo } from "react";
import {
  EmailEditorProvider,
  EmailTemplate,
  TextFormat,
} from "easy-email-pro-editor";
import {
  EditorContextProps,
  Retro,
  SharedComponents,
  ThemeConfigProps,
} from "easy-email-pro-theme";
import "easy-email-pro-theme/lib/style.css";

import retroStyle from "@arco-themes/react-easy-email-pro/css/arco.css?inline";
import colorPurpleStyle from "@arco-themes/react-easy-email-pro-purple/css/arco.css?inline";
import colorRedStyle from "@arco-themes/react-easy-email-pro-red/css/arco.css?inline";
import colorBlueStyle from "@arco-themes/react-easy-email-pro-sky/css/arco.css?inline";
import colorGreenStyle from "@arco-themes/react-easy-email-pro-green/css/arco.css?inline";
import colorLocalStyle from "../ColorTheme/theme.css?inline";

import data from "./template.json";
import { EditorHeader } from "../../components/EditorHeader";
import { useUpload } from "../../hooks/useUpload";
import {
  Layout,
  Modal,
  Button,
  Space,
  Typography,
} from "@arco-design/web-react";
import React from "react";
import {
  Shopwindow,
  QRCode,
  Video,
  ImageWithText,
  CountdownV2,
  Countdown,
  AmpAccordionPlugin,
  AmpCarouselPlugin,
  AmpFormPlugin,
  AmpProductPlugin,
  AmpReviewsPlugin,
  AmpLuckyWheelPlugin,
} from "easy-email-pro-kit";
import { EditorCore, PluginManager } from "easy-email-pro-core";
import { useState } from "react";
import { useRef } from "react";

import localsData from "easy-email-pro-localization/locales/locales.json";
import { get } from "lodash";
import { AssetManagerModal } from "./AssetManagerModal";
import { useUniversalElement } from "@/hooks/useUniversalElement";
import customizeCss from "./customize.scss?inline";
import customizeCss2 from "../Customize/customize.scss?inline";
import FullScreenLoading from "@/components/FullScreenLoading";
import axios from "axios";
import { useEditorConfigStore } from "../../store/editorConfigStore";

import { footerElement } from "../FrozenBlock";
import { headerElement } from "../FrozenBlock";

PluginManager.registerPlugins([
  CountdownV2,
  Countdown,
  Shopwindow,
  QRCode,
  Video,
  ImageWithText,
  AmpAccordionPlugin,
  AmpCarouselPlugin,
  AmpFormPlugin,
  AmpProductPlugin,
  AmpReviewsPlugin,
  AmpLuckyWheelPlugin,
]);

// register elements styles
import "./ElementStyleGallery";
import { TranslationSelect } from "@/components/TranslationSelect";
import { Sparkles, Layout as LayoutIcon, Palette, Zap } from "lucide-react";
import { prebuiltBlocks } from "./prebuiltBlocks";
import { categories } from "./categories";
import { DemoAiAgent } from "../AIAgent/DemoAiAgent";
import { fetchWebsiteTemplateInitialValues } from "./websiteTemplateLoader";
import { useCompactMode } from "@/hooks/useCompactMode";

const EmailSize = React.lazy(() => import("@/components/EmailSize"));

const fonts = [
  {
    value: "Tangerine",
    label: "Tangerine",
    href: "https://fonts.googleapis.com/css?family=Tangerine",
  },
  {
    value: "Arial",
    label: "Arial",
  },
  {
    value: "Tahoma",
    label: "Tahoma",
  },
  {
    value: "Verdana",
    label: "Verdana",
  },
  {
    value: "Times New Roman",
    label: "Times New Roman",
  },
  {
    value: "Courier New",
    label: "Courier New",
  },
  {
    value: "Georgia",
    label: "Georgia",
  },
  {
    value: "Lato",
    label: "Lato",
  },
  {
    value: "Montserrat",
    label: "Montserrat",
  },
  {
    value: "黑体",
    label: "黑体",
  },
  {
    value: "仿宋",
    label: "仿宋",
  },
  {
    value: "楷体",
    label: "楷体",
  },
  {
    value: "标楷体",
    label: "标楷体",
  },
  {
    value: "华文仿宋",
    label: "华文仿宋",
  },
  {
    value: "华文楷体",
    label: "华文楷体",
  },
  {
    value: "宋体",
    label: "宋体",
  },
  {
    value: "微软雅黑",
    label: "微软雅黑",
  },
];

const MODERN_THEME_PROMO_KEY = "modern-theme-promo-shown";

SharedComponents.AiAgent = DemoAiAgent;

function getDefaultInitialValues(): EmailTemplate {
  return {
    subject: data.subject,
    content: data.content as EmailTemplate["content"],
  };
}

export default function EditorApp() {
  const templateId = useMemo(
    () => new URLSearchParams(window.location.search).get("id")?.trim() ?? "",
    [],
  );
  const [templateLoading, setTemplateLoading] = useState(Boolean(templateId));
  const [initialValues, setInitialValues] = useState<EmailTemplate | null>(
    () => (templateId ? null : getDefaultInitialValues()),
  );

  useEffect(() => {
    if (!templateId) return;

    let cancelled = false;
    setTemplateLoading(true);

    fetchWebsiteTemplateInitialValues(templateId)
      .then((template) => {
        if (cancelled) return;
        setInitialValues(template);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error(`Failed to load website template "${templateId}"`, error);
        setInitialValues(getDefaultInitialValues());
      })
      .finally(() => {
        if (cancelled) return;
        setTemplateLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [templateId]);

  if (templateLoading || !initialValues) {
    return <FullScreenLoading isFullScreen />;
  }

  return <MyEditor initialValues={initialValues} />;
}

function MyEditor({ initialValues }: { initialValues: EmailTemplate; }) {
  const editorConfig = useEditorConfigStore();
  const { upload } = useUpload();
  const [accept, setAccept] = useState<string | undefined>(undefined);
  const [visible, setVisible] = useState(false);
  const { universalElementSetting } = useUniversalElement();
  const [hoveringToolbarPosition, setHoveringToolbarPosition] =
    useState<NonNullable<ThemeConfigProps["hoveringToolbar"]>["follow"]>(
      "container",
    );

  // Modern Theme promo modal state
  const [showPromoModal, setShowPromoModal] = useState(() => {
    return !localStorage.getItem(MODERN_THEME_PROMO_KEY);
  });

  const handleTryModern = () => {
    localStorage.setItem(MODERN_THEME_PROMO_KEY, "true");
    window.location.href = "/modern";
  };

  const handleDismissPromo = () => {
    localStorage.setItem(MODERN_THEME_PROMO_KEY, "true");
    setShowPromoModal(false);
  };

  const editorInstance = useRef<EditorContextProps | null>(null);

  const hoveringToolbar: ThemeConfigProps["hoveringToolbar"] = useMemo(() => {
    return {
      list({ isCollapsed, selection, isFocus }) {
        // if (!isFocus) return [];
        return [
          TextFormat.AI_ASSISTANT,
          TextFormat.FONT_FAMILY,
          TextFormat.FONT_SIZE,
          TextFormat.BOLD,
          TextFormat.ITALIC,
          TextFormat.UNDERLINE,
          TextFormat.STRIKETHROUGH,
          TextFormat.TEXT_COLOR,
          TextFormat.BACKGROUND_COLOR,
          TextFormat.ALIGN,
          TextFormat.LIST,
          TextFormat.LINK,
          TextFormat.IMAGE,
          TextFormat.MERGETAG,
          TextFormat.REMOVE_FORMAT,
        ];
      },
      follow: hoveringToolbarPosition,
      iconSize: 14,
    };
  }, [hoveringToolbarPosition]);

  const changeRef = useRef<(url: string) => void>(() => {
    //
  });

  const [authState, setAuthState] = useState<"pending" | "success" | "fail">(
    "pending",
  );
  const theme = editorConfig.theme;
  const matchThemeStyle = useMemo(() => {
    if (theme === "retro") {
      return retroStyle;
    }
    if (theme === "purple") {
      return colorPurpleStyle;
    }
    if (theme === "green") {
      return colorGreenStyle;
    }
    if (theme === "blue") {
      return colorBlueStyle;
    }
    if (theme === "red") {
      return colorRedStyle;
    }
    if (theme === "local") {
      return colorLocalStyle;
    }
    return "";
  }, [theme]);

  const handleUploadClick: ThemeConfigProps["handleUploadClick"] = ({
    onChange,
    accept,
  }) => {
    changeRef.current = onChange;
    setAccept(accept);
    setVisible(true);
  };

  const onUpload = (file: Blob): Promise<string> => {
    return upload(file);
  };

  const onSubmit: ThemeConfigProps["onSubmit"] = async (values, editor) => {
    console.log(values, editor);
    console.log("editorInstance", editorInstance.current);
  };

  const onChange: ThemeConfigProps["onChange"] = async (values, editor) => {
    console.log("onChange", values);
  };

  const AIAssistant: ThemeConfigProps["AIAssistant"] = useMemo(() => {
    return {
      async onGenerate(messages) {
        const { data } = await axios.post<{ content: string; role: string; }>(
          `https://admin.easyemail.pro/api/ai`,
          {
            data: {
              messages: messages,
              model: "gpt-3.5-turbo",
            },
          },
        );
        return { content: data.content, role: data.role };
      },
      // options: optionsList,
    };
  }, []);

  useEffect(() => {
    EditorCore.auth(process.env.CLIENT_ID!)
      .then(() => {
        setAuthState("success");
      })
      .catch(() => {
        setAuthState("fail");
      });
  }, []);

  const compact = useCompactMode();
  const config = Retro.useCreateConfig({
    instanceRef: editorInstance,
    clientId: process.env.CLIENT_ID!,
    height: "calc(100vh - 66px)",
    onUpload,
    initialValues: initialValues,
    onChange,
    onSubmit: onSubmit,
    mergetagsData: editorConfig.mergetagsData,
    mergetags: editorConfig.mergetags,
    categories: categories,
    unsplash: {
      clientId: process.env.UNSPLASH_CLIENT_ID!,
    },
    hoveringToolbar: hoveringToolbar,
    AIAssistant: editorConfig.showAIIntegration ? AIAssistant : undefined,
    showSourceCode: editorConfig.showSourceCode,
    showLayer: editorConfig.showLayer,
    showPreview: editorConfig.showPreview,
    showSidebar: true,
    showPreviousLevelIcon: true,
    showBlockPaths: editorConfig.showBlockPaths,
    showTextHTMLMode: true,
    showSelectFileButton: true,
    showGenerateBlockImage: true,
    compact: compact,
    handleUploadClick,
    universalElementSetting,
    localeData: get(localsData, editorConfig.language),
    showDragMoveIcon: true,
    showInsertTips: true,
    controller: editorConfig.controller,
    // sourceCodeEditable: false,
    fontList: fonts,
    // emptyPageElement: data2.content,
    dragoverType: editorConfig.dragoverType ? "line" : "placeholder",
    headerElement: editorConfig.showFrozenBlocks ? headerElement : undefined,
    footerElement: editorConfig.showFrozenBlocks ? footerElement : undefined,
    autoScroll: true,
    attributesVariables: {
      "background-color": "red",
      "font-size": "18px",
    },
    enabledButtonIcon: true,
    enabledHtmlBlockNodeAlign: true,
    enabledGradientImage: true,
    enabledAutoComplete: true,
    prebuiltBlocks: prebuiltBlocks,
    colorPicker: {
      initialColors: [
        "#000000",
        "#FFFFFF",
        "#9b9b9b",
        "#d0021b",
        "#4a90e2",
        "#7ed321",
        "#bd10e0",
        "#f8e71c",
      ],
      autoExtractColors: true,
    },
  });

  if (authState === "pending") {
    return <FullScreenLoading isFullScreen />;
  }
  if (authState === "fail") {
    return <div>Fail to load editor</div>;
  }

  return (
    <EmailEditorProvider {...config}>
      <EditorHeader
        showConfiguration
        prefix={<TranslationSelect lang={editorConfig.language} />}
        extra={
          <Button
            type="primary"
            onClick={handleTryModern}
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
            }}
          >
            <strong>Try Modern Theme</strong>
          </Button>
        }
      />

      <Layout.Content>
        <Retro.Layout tabRight={<EmailSize />}>
          <style id="customize-css">{customizeCss}</style>
          {editorConfig.showCustomStyles && (
            <style id="customize-css2">{customizeCss2}</style>
          )}
        </Retro.Layout>
      </Layout.Content>
      <AssetManagerModal
        key={editorConfig.language}
        accept={accept}
        visible={visible}
        setVisible={setVisible}
        onSelect={changeRef.current}
      />
      <style>{matchThemeStyle}</style>

      {/* Modern Theme Promo Modal */}
      <Modal
        visible={showPromoModal}
        onCancel={handleDismissPromo}
        footer={null}
        style={{ width: 520 }}
        closable={true}
        maskClosable={false}
      >
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <Sparkles size={40} color="#fff" />
          </div>

          <Typography.Title heading={4} style={{ marginBottom: 8 }}>
            Try Modern Theme
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 14 }}>
            A simplified editor designed for beginners with smart presets
          </Typography.Text>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              margin: "32px 0",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: "rgba(102, 126, 234, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Sparkles size={18} color="#667eea" />
              </div>
              <div>
                <Typography.Text style={{ fontWeight: 600, display: "block" }}>
                  Simplified
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Less options, less confusion
                </Typography.Text>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: "rgba(102, 126, 234, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Zap size={18} color="#667eea" />
              </div>
              <div>
                <Typography.Text style={{ fontWeight: 600, display: "block" }}>
                  Smart Presets
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Pre-configured for quick start
                </Typography.Text>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: "rgba(102, 126, 234, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Palette size={18} color="#667eea" />
              </div>
              <div>
                <Typography.Text style={{ fontWeight: 600, display: "block" }}>
                  Beginner Friendly
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Easy to learn, easy to use
                </Typography.Text>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: "rgba(102, 126, 234, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <LayoutIcon size={18} color="#667eea" />
              </div>
              <div>
                <Typography.Text style={{ fontWeight: 600, display: "block" }}>
                  Clean Interface
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Focus on what matters
                </Typography.Text>
              </div>
            </div>
          </div>

          <Space size={16}>
            <Button size="large" onClick={handleDismissPromo}>
              Maybe Later
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={handleTryModern}
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
              }}
            >
              Try Modern Theme
            </Button>
          </Space>
        </div>
      </Modal>
    </EmailEditorProvider>
  );
}
