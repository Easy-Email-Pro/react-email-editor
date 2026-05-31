/* eslint-disable no-async-promise-executor */
import {
  Button,
  Dropdown,
  Input,
  Menu,
  Message,
  Modal,
  PageHeader,
  Space,
  Tooltip,
  Typography,
} from "@arco-design/web-react";
import React from "react";
import {
  ActiveTabKeys,
  EmailTemplate,
  useEditorProps,
  useEditorState,
} from "easy-email-pro-editor";
import { mjmlToJson, useEditorContext } from "easy-email-pro-theme";
import {
  EditorCore,
  PageElement,
  PluginManager,
  easyEmailToEasyEmailPro,
} from "easy-email-pro-core";
import mjml from "mjml-browser";
import { saveAs } from "file-saver";
import { Uploader } from "@/utils/Uploader";
import { pick } from "lodash";
import { ReactEditor, useSlate } from "slate-react";
import { SendEmailModal } from "./SendEmailModal";
import { base64ToBlob, dom2Svg } from "@/utils/base64ToBlob";
import {
  Menu as LucideMenu,
  Rocket,
  Download,
  Settings,
  Shield,
} from "lucide-react";
import { EditorConfigModal } from "./EditorConfigModal";
import { EmailList } from "./EmailList";
import { Node } from "slate";
import { useNavigate } from "react-router-dom";
import { mjml2amp, getImageUrlsForAmp } from "mjml2amp";
import { importUnlayerDesign } from "@/utils/importUnlayerTemplate";

/**
 * Load each image URL and resolve with its natural width and height.
 * Failed or cross-origin images are skipped (no entry in result).
 */
async function getImageDimensions(
  urls: string[]
): Promise<Record<string, { width: number; height: number; }>> {
  const result: Record<string, { width: number; height: number; }> = {};
  const list = Array.isArray(urls) ? urls : [];
  await Promise.all(
    list.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            result[url] = {
              width: img.naturalWidth,
              height: img.naturalHeight,
            };
            resolve();
          };
          img.onerror = () => resolve();
          img.src = url;
        })
    )
  );
  return result;
}

export const EditorHeader = (props: {
  prefix?: React.ReactNode;
  extra?: React.ReactNode;
  hideImport?: boolean;
  hideExport?: boolean;
  showConfiguration?: boolean;
  onSpamScoreClick?: () => void;
}) => {
  const editor = useSlate();
  const [collapsed, setCollapsed] = React.useState(true);
  const [text, setText] = React.useState("");
  const [visible, setVisible] = React.useState(false);
  const { values, submit, setFieldValue, mergetagsData, reset, dirty } =
    useEditorContext();
  const { setActiveTab, activeTab } = useEditorState();
  const navigate = useNavigate();
  const activetabRef = React.useRef(ActiveTabKeys.DESKTOP);
  const onChange = (text: string) => {
    setFieldValue(null, "subject", text);
  };


  const { universalElementSetting } = useEditorProps();

  const isDev = location.search.includes("dev=true");

  const onExportImage = async () => {
    Message.loading("Loading...");
    activetabRef.current = activeTab;

    setActiveTab(ActiveTabKeys.DESKTOP);
    const container = ReactEditor.toDOMNode(editor, Node.get(editor, [0]));

    const blob1 = await new Promise<any>(async (resolve) => {
      const png = await base64ToBlob(
        await dom2Svg(container, {
          width: 600,
        })
      );
      resolve(png);
    });
    setActiveTab(ActiveTabKeys.MOBILE);
    const container2 = ReactEditor.toDOMNode(editor, Node.get(editor, [0]));
    const mobileContainer = document.createElement("div");
    mobileContainer.style.width = "375px";
    mobileContainer.appendChild(container2.cloneNode(true));
    document.body.appendChild(mobileContainer);
    const blob2 = await new Promise<any>(async (resolve) => {
      const png = await base64ToBlob(await dom2Svg(mobileContainer));
      resolve(png);
    });
    mobileContainer.parentElement?.removeChild(mobileContainer);
    setActiveTab(activetabRef.current);

    saveAs(blob1, "desktop.png");
    saveAs(blob2, "mobile.png");
    Message.clear();
  };
  const onExportPDF = async () => {
    const printCSS = document.createElement("style");
    printCSS.innerHTML = `
    @media print {
      body {
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
      }
    }
  `;

    const contentWindow = ReactEditor.getWindow(editor);
    if (contentWindow) {
      contentWindow.document.body.appendChild(printCSS);
      contentWindow.print();
      printCSS.parentElement?.removeChild(printCSS);
    }
  };

  const onExportJSON = () => {
    navigator.clipboard.writeText(
      JSON.stringify(pick(values, ["subject", "content"]), null, 2)
    );
    saveAs(
      new Blob(
        [JSON.stringify(pick(values, ["content", "subject"]), null, 2)],
        { type: "application/json" }
      ),
      values.subject
    );
  };

  const onExportAmpMJML = async () => {

    const mjmlStr = EditorCore.toMJML({
      element: values.content,
      mode: "production",
      universalElements: universalElementSetting,
      beautify: true,
      outputFormat: "amp-mjml",
    });


    navigator.clipboard.writeText(mjmlStr);
    saveAs(new Blob([mjmlStr], { type: "text/html" }), "easy-email-pro.html");
  };

  const onExportAmpEmail = async () => {

    const mjmlStr = EditorCore.toMJML({
      element: values.content,
      mode: "production",
      universalElements: universalElementSetting,
      beautify: true,
      outputFormat: "amp-mjml",
    });

    const imageUrls = await getImageUrlsForAmp(mjmlStr);

    const imageDimensions = await getImageDimensions(imageUrls);

    const ampHtml = mjml2amp(mjmlStr, {
      imageDimensions: imageDimensions,
      imageDimensionsStrict: false
    });

    const finalHtml = PluginManager.renderWithData(ampHtml.html, mergetagsData);

    navigator.clipboard.writeText(finalHtml);
    saveAs(new Blob([finalHtml], { type: "text/html" }), "easy-email-pro.html");
  };

  const onExportMJML = () => {
    const mjmlStr = EditorCore.toMJML({
      element: values.content,
      mode: "production",
      universalElements: universalElementSetting,
      beautify: true,
    });

    navigator.clipboard.writeText(mjmlStr);
    saveAs(new Blob([mjmlStr], { type: "text/mjml" }), "easy-email-pro.mjml");
  };

  const onExportHTML = () => {
    const mjmlStr = EditorCore.toMJML({
      element: values.content,
      mode: "production",
      universalElements: universalElementSetting,
      beautify: true,
    });

    const html = mjml(mjmlStr).html;
    const finalHtml = PluginManager.renderWithData(html, mergetagsData);
    navigator.clipboard.writeText(finalHtml);
    saveAs(
      new Blob([finalHtml], { type: "text/html" }),
      "easy-email-pro.html"
    );
  };

  const onImportMJML = async () => {
    const uploader = new Uploader(() => Promise.resolve(""), {
      accept: "text/mjml",
      limit: 1,
    });

    const [file] = await uploader.chooseFile();
    const reader = new FileReader();
    const pageData = await new Promise<[string, EmailTemplate["content"]]>(
      (resolve, reject) => {
        reader.onload = function (evt) {
          if (!evt.target) {
            reject();
            return;
          }
          try {
            const pageData = mjmlToJson(evt.target.result as any);
            resolve([file.name, pageData]);
          } catch (error) {
            reject();
          }
        };
        reader.readAsText(file);
      }
    );

    reset({
      subject: pageData[0],
      content: pageData[1],
    });
  };

  const onImportMJMLJSON = async () => {
    const uploader = new Uploader(() => Promise.resolve(""), {
      accept: "application/json",
      limit: 1,
    });

    const [file] = await uploader.chooseFile();
    const reader = new FileReader();
    const pageData = await new Promise<[string, EmailTemplate["content"]]>(
      (resolve, reject) => {
        reader.onload = function (evt) {
          if (!evt.target) {
            reject();
            return;
          }
          try {
            const pageData = mjmlToJson(
              JSON.parse(evt.target.result as any) as any
            );
            resolve([file.name, pageData]);
          } catch (error) {
            reject();
          }
        };
        reader.readAsText(file);
      }
    );

    reset({
      subject: pageData[0],
      content: pageData[1],
    });
  };

  const onImportJSON = async () => {
    const uploader = new Uploader(() => Promise.resolve(""), {
      accept: "application/json",
      limit: 1,
    });

    const [file] = await uploader.chooseFile();
    const reader = new FileReader();
    const emailTemplate = await new Promise<EmailTemplate>(
      (resolve, reject) => {
        reader.onload = function (evt) {
          if (!evt.target) {
            reject();
            return;
          }
          try {
            const parsed = JSON.parse(evt.target.result as any);
            if (parsed.type === "page") {
              resolve({ subject: file.name, content: parsed });
            } else {
              resolve(parsed as EmailTemplate);
            }
          } catch (error) {
            reject();
          }
        };
        reader.readAsText(file);
      }
    );

    reset({
      subject: emailTemplate.subject,
      content: emailTemplate.content,
    });
  };

  const onImportEasyEmailJSON = async () => {
    const uploader = new Uploader(() => Promise.resolve(""), {
      accept: "application/json",
      limit: 1,
    });

    const [file] = await uploader.chooseFile();
    const reader = new FileReader();
    const emailTemplate = await new Promise<EmailTemplate>(
      (resolve, reject) => {
        reader.onload = function (evt) {
          if (!evt.target) {
            reject();
            return;
          }
          try {
            const template = JSON.parse(evt.target.result as any);
            const content = easyEmailToEasyEmailPro(template.content);
            if (!template.content) {
              Message.error(`Invalid template, need content params`);
              reject();
              return;
            }

            resolve({
              subject: template.subject,
              content: content,
            });
          } catch (error) {
            console.log(error);
            reject();
          }
        };
        reader.readAsText(file);
      }
    );

    reset({
      subject: emailTemplate.subject,
      content: emailTemplate.content,
    });
  };

  const onImportUnlayerJSON = async () => {
    const uploader = new Uploader(() => Promise.resolve(""), {
      accept: "application/json",
      limit: 1,
    });

    try {
      const [file] = await uploader.chooseFile();
      const reader = new FileReader();
      const { template, warnings } = await new Promise<ReturnType<
        typeof importUnlayerDesign
      >>((resolve, reject) => {
        reader.onload = function (evt) {
          if (!evt.target) {
            reject();
            return;
          }
          try {
            const design = JSON.parse(evt.target.result as any);
            resolve(importUnlayerDesign(design, file.name));
          } catch (error) {
            console.log(error);
            reject(error);
          }
        };
        reader.readAsText(file);
      });

      reset({
        subject: template.subject,
        content: template.content,
      });

      if (warnings.length > 0) {
        Message.warning(
          `Imported with ${warnings.length} migration warning${
            warnings.length > 1 ? "s" : ""
          }.`
        );
      } else {
        Message.success("Unlayer JSON imported");
      }
    } catch (error) {
      Message.error("Invalid Unlayer JSON template");
    }
  };

  const onSwitchTemplate = (item: {
    id: string;
    subject: string;
    thumbnail: string;
    content: PageElement;
    url?: string | undefined;
  }) => {
    reset({
      content: item.content,
      subject: item.subject,
    });
    setCollapsed(true);
  };

  return (
    <>
      <div style={{ position: "relative" }}>
        <PageHeader
          backIcon
          onBack={() => navigate('/')}
          className="editor-header"
          style={{
            backgroundColor: "rgb(var(--primary-6))",
            color: "#fff !important",
            height: 66,
          }}
          subTitle={
            <div
              style={{
                height: 40,
                position: "absolute",
                minWidth: 300,
                top: 18,
              }}
            >
              <Typography.Title
                heading={5}
                style={{
                  margin: 0,
                  color: "var(--color-white)",
                }}
                editable={{
                  onChange: onChange,
                }}
              >
                {values.subject}
              </Typography.Title>
            </div>
          }
          extra={
            <div style={{ marginRight: 0 }}>
              <Space>
                {props.prefix}
                {props.showConfiguration && (
                  <Tooltip content="Editor Configuration">
                    <EditorConfigModal>
                      <Button icon={<Settings size={16} />}>
                        <strong>&nbsp;Configuration</strong>
                      </Button>
                    </EditorConfigModal>
                  </Tooltip>
                )}

                <Tooltip content="Examples">
                  <Button
                    icon={<LucideMenu size={16} />}
                    onClick={() => setCollapsed((v) => !v)}
                  >
                    <strong>&nbsp;Features & templates</strong>
                  </Button>
                </Tooltip>

                {!props.hideImport && isDev && (
                  <Dropdown
                    droplist={
                      <Menu>
                        <Menu.Item
                          key="HTML"
                          onClick={() => navigate("/html-to-mjml")}
                        >
                          Import from HTML
                        </Menu.Item>
                        {isDev && (
                          <>
                            <Menu.Item key="MJML" onClick={onImportMJML}>
                              Import from MJML
                            </Menu.Item>
                            <Menu.Item
                              key="MJML-JSON"
                              onClick={onImportMJMLJSON}
                            >
                              Import from MJML JSON
                            </Menu.Item>
                            <Menu.Item key="JSON" onClick={onImportJSON}>
                              Import from JSON
                            </Menu.Item>
                            <Menu.Item
                              key="Easy Email JSON"
                              onClick={onImportEasyEmailJSON}
                            >
                              Import from Easy Email JSON
                            </Menu.Item>
                            <Menu.Item
                              key="Unlayer JSON"
                              onClick={onImportUnlayerJSON}
                            >
                              Import from Unlayer JSON
                            </Menu.Item>
                          </>
                        )}
                      </Menu>
                    }
                  >
                    <Button>
                      <strong>Import</strong>
                    </Button>
                  </Dropdown>
                )}

                {!props.hideExport && (
                  <Dropdown
                    droplist={
                      <Menu>
                        <Menu.Item key="Export MJML" onClick={onExportMJML}>
                          Export MJML
                        </Menu.Item>
                        <Menu.Item key="Export HTML" onClick={onExportHTML}>
                          Export HTML
                        </Menu.Item>
                        <Menu.Item key="Export AMP Email" onClick={onExportAmpMJML}>
                          Export AMP MJML
                        </Menu.Item>
                        <Menu.Item key="Export AMP Email" onClick={onExportAmpEmail}>
                          Export AMP Email
                        </Menu.Item>
                        <Menu.Item key="Export JSON" onClick={onExportJSON}>
                          Export JSON
                        </Menu.Item>
                        <Menu.Item key="Export Image" onClick={onExportImage}>
                          Export Image
                        </Menu.Item>
                        <Menu.Item key="Export PDF" onClick={onExportPDF}>
                          Export PDF
                        </Menu.Item>
                      </Menu>
                    }
                  >
                    <Button icon={<Download size={16} />}>
                      <strong>&nbsp;Export</strong>
                    </Button>
                  </Dropdown>
                )}
                {props.onSpamScoreClick && (
                  <Tooltip content="Spam Score">
                    <Button
                      icon={<Shield size={16} />}
                      onClick={props.onSpamScoreClick}
                    >
                      <strong>&nbsp;Spam Score</strong>
                    </Button>
                  </Tooltip>
                )}
                {/* <Button disabled={!dirty} onClick={() => submit()}>
                  <strong>Submit</strong>
                </Button> */}
                {isDev && <SendEmailModal />}
                {/* <Button
                  icon={<HelpCircle size={20} />}
                  target="_blank"
                  href="https://docs.easyemail.pro/docs/intro?utm_source=demo"
                >
                  <strong>&nbsp;Documentation</strong>
                </Button> */}
                <Button target="_blank" href="/components">
                  <strong>&nbsp;Blocks</strong>
                </Button>
                <Button
                  icon={<Rocket size={20} />}
                  target="_blank"
                  href="https://www.easyemail.pro/?#trial?utm_source=demo"
                >
                  <strong>&nbsp;Start Trial</strong>
                </Button>

                {props?.extra}
                <div />
              </Space>
            </div>
          }
        />
        <Modal
          visible={!collapsed}
          onCancel={() => setCollapsed(true)}
          style={{ width: "90vw", height: "90vh", overflow: "auto" }}
          footer={null}
        >
          <div style={{ backgroundColor: "#fff", padding: 16, height: "100%" }}>
            <EmailList onClick={onSwitchTemplate} />
          </div>
        </Modal>
      </div>

      <style>{`
      .editor-header .arco-page-header-back { color: var(--color-white); }
      .editor-header .arco-page-header-back:hover:before { background-color: transparent !important; }
      .editor-header .arco-typography-operation-edit { color: var(--color-white); }
      .editor-header .arco-typography-operation-edit { color: var(--color-white);background-color: transparent; }
      .editor-header .arco-typography-operation-edit:hover { color: var(--color-white);background-color: transparent; }
      `}</style>

      <Modal
        visible={visible}
        title="Import"
        onCancel={() => setVisible(false)}
      >
        <Input.TextArea value={text} onChange={setText} rows={10} />
      </Modal>
      {/* <AutoSaveAndRestore name="temp" /> */}
    </>
  );
};
