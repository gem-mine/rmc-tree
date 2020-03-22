/**
 * Webpack has bug for import loop, which is not the same behavior as ES module.
 * When util.js imports the TreeNode for tree generate will cause treeContextTypes be empty.
 */
import * as React from 'react';
import { IconType, Key, DataEntity, EventDataNode } from './interface';

type NodeMouseEventHandler = (e: React.MouseEvent<HTMLDivElement>, node: EventDataNode) => void;

export interface TreeContextProps {
  prefixCls: string;
  selectable: boolean;
  showIcon: boolean;
  icon: IconType;
  switcherIcon: IconType;
  checkable: boolean | React.ReactNode;
  checkStrictly: boolean;
  disabled: boolean;
  keyEntities: Record<Key, DataEntity>;

  loadData: (treeNode: EventDataNode) => Promise<void>;
  filterTreeNode: (treeNode: EventDataNode) => boolean;

  onNodeClick: NodeMouseEventHandler;
  onNodeDoubleClick: NodeMouseEventHandler;
  onNodeExpand: NodeMouseEventHandler;
  onNodeSelect: NodeMouseEventHandler;
  onNodeCheck: (
    e: React.MouseEvent<HTMLDivElement>,
    treeNode: EventDataNode,
    checked: boolean,
  ) => void;
  onNodeLoad: (treeNode: EventDataNode) => void;
  onNodeContextMenu: NodeMouseEventHandler;
}

export const TreeContext: React.Context<TreeContextProps | null> = React.createContext(null);
