import { useUpload } from "@/hooks/useUpload";
import { useCallback } from "react";
import { random, uniqueId } from "lodash";
import React from "react";
import { Node } from "slate";
import { ReactEditor, useSlate } from "slate-react";
import { useEditorState } from "easy-email-pro-editor";
import {
  AssetManager,
  AssetManagerProps,
  FileItem,
  FolderItem,
} from "easy-email-pro-asset-manager";
import "easy-email-pro-asset-manager/lib/style.css";
import { Element, NodeUtils } from "easy-email-pro-core";

export const AssetManagerModal = ({
  visible,
  setVisible,
  onSelect,
  accept,
}: {
  visible: AssetManagerProps["visible"];
  setVisible: AssetManagerProps["setVisible"];
  onSelect: (url: string) => void;
  accept?: string;
}) => {
  const { upload } = useUpload();

  const editor = useSlate();
  const { selectedNodePath } = useEditorState();

  const onCreateFile: AssetManagerProps["onCreateFile"] = useCallback(
    async (item) => {
      return {
        id: "new" + uniqueId(),
        type: "FILE",
        ...item,
        thumbnail: item.url + `?w=200`, // as thumbnail
      };
    },
    []
  );

  const onUpdateFile: AssetManagerProps["onUpdateFile"] = useCallback(
    async (item) => {
      return {
        ...item,
        thumbnail: item.url + `?w=200`, // as thumbnail
      };
    },
    []
  );

  const onUpdateFolder: AssetManagerProps["onUpdateFolder"] = useCallback(
    async (item) => {
      return {
        ...item,
      };
    },
    []
  );

  const onCreateFolder: AssetManagerProps["onCreateFolder"] = useCallback(
    async (item) => {
      return {
        id: "new-folder" + uniqueId(),
        type: "FOLDER",
        parentFolderId: item.parentFolderId,
        name: item.name,
      };
    },
    []
  );

  const onDeleteFile: AssetManagerProps["onDeleteFile"] =
    useCallback(async () => {
      return true;
    }, []);

  const onDeleteFolder: AssetManagerProps["onDeleteFolder"] =
    useCallback(async () => {
      // throw new Error("Folder is not empty");
      return true;
    }, []);

  const fetchData = useCallback(
    async (folderId?: string): Promise<Array<FileItem | FolderItem>> => {
      await new Promise((resolve) =>
        setTimeout(() => {
          resolve(true);
        }, 1000)
      );

      const count = random(2, 5, false);
      return [
        {
          id: uniqueId(),
          name: `Folder${folderId ? `-${folderId}` : ""} `,
          type: "FOLDER",
          parentFolderId: null,
        },
        {
          id: uniqueId(),
          url: "https://cdn.shopify.com/test.pdf",
          thumbnail: "",
          type: "FILE" as const,
          name: `test`,
          parentFolderId: null,
        },
        ...new Array(count).fill(true).map((item, index) => {
          return {
            id: uniqueId(),
            url: "https://cdn.shopify.com/s/files/1/0656/7346/1987/products/WX20230906-184909_2x_865d6583-a975-4997-95d3-bcbd8661bf2c_430x.png",
            thumbnail:
              "https://cdn.shopify.com/s/files/1/0656/7346/1987/products/WX20230906-184909_2x_865d6583-a975-4997-95d3-bcbd8661bf2c_430x.png?v=1694138521",
            type: "FILE" as const,
            name: `image${folderId ? `-${index + 1}` : `-${index + 1}`} `,
            parentFolderId: null,
          };
        }),
      ];
    },
    []
  );

  const onSelectFile = useCallback(
    (url: string) => {
      if (
        ["png", "jpg", "jpeg", "gif"].some((item) =>
          url.replace(/\?.*/, "").endsWith(item)
        )
      ) {
        const node = Node.get(editor, selectedNodePath!) as Element;
        const domeNode = ReactEditor.toDOMNode(editor, node);
        if (NodeUtils.isImageElement(node)) {
          const width = domeNode.getBoundingClientRect().width;
          onSelect(url + `?w=${width}`);
        } else {
          onSelect(url);
        }
      } else {
        onSelect(url);
      }
    },
    [editor, onSelect, selectedNodePath]
  );

  return (
    <div>
      <AssetManager
        accept={accept}
        showUnacceptedFile
        setVisible={setVisible}
        visible={visible}
        request={fetchData}
        onSelect={onSelectFile}
        upload={upload}
        onCreateFile={onCreateFile}
        onCreateFolder={onCreateFolder}
        onUpdateFile={onUpdateFile}
        onUpdateFolder={onUpdateFolder}
        onDeleteFile={onDeleteFile}
        onDeleteFolder={onDeleteFolder}
      />
    </div>
  );
};
