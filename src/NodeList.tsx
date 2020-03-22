/**
 * Handle virtual list of the TreeNodes.
 */

import * as React from 'react';
import VirtualList from 'rc-virtual-list';
import { FlattenNode, Key, DataEntity, DataNode, ScrollTo } from './interface';
import TreeNode from './TreeNode';
import { findExpandedKeys } from './utils/diffUtil';
import { getTreeNodeProps, getKey } from './utils/treeUtil';

const HIDDEN_STYLE = {
  width: 0,
  height: 0,
  display: 'flex',
  overflow: 'hidden',
  opacity: 0,
  border: 0,
  padding: 0,
  margin: 0,
};

const noop = () => {};

export const MOTION_KEY = `RC_TREE_MOTION_${Math.random()}`;

const MotionNode: DataNode = {
  key: MOTION_KEY,
};

export const MotionEntity: DataEntity = {
  key: MOTION_KEY,
  level: 0,
  index: 0,
  pos: '0',
  node: MotionNode,
};

const MotionFlattenData: FlattenNode = {
  parent: null,
  children: [],
  pos: MotionEntity.pos,
  data: MotionNode,
  /** Hold empty list here since we do not use it */
  isStart: [],
  isEnd: [],
};

export interface NodeListRef {
  scrollTo: ScrollTo;
}

interface NodeListProps {
  prefixCls: string;
  style: React.CSSProperties;
  data: FlattenNode[];
  motion: any;
  focusable?: boolean;
  activeItem: FlattenNode;
  focused?: boolean;
  tabIndex: number;
  checkable?: boolean;
  selectable?: boolean;
  disabled?: boolean;

  treeExpandedKeys: Key[];
  selectedKeys: Key[];
  checkedKeys: Key[];
  loadedKeys: Key[];
  loadingKeys: Key[];
  halfCheckedKeys: Key[];
  keyEntities: Record<Key, DataEntity>;

  dropPosition: number;

  // Virtual list
  height: number;
  itemHeight: number;
  virtual?: boolean;

  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
  onFocus?: React.FocusEventHandler<HTMLDivElement>;
  onActiveChange: (key: Key) => void;
}

/**
 * We only need get visible content items to play the animation.
 */
export function getMinimumRangeTransitionRange(
  list: FlattenNode[],
  height: number,
  itemHeight: number,
) {
  if (!height) {
    return list;
  }

  return list.slice(0, Math.ceil(height / itemHeight) + 1);
}

function itemKey(item: FlattenNode) {
  const {
    data: { key },
    pos,
  } = item;
  return getKey(key, pos);
}

function getAccessibilityPath(item: FlattenNode): string {
  let path = String(item.data.key);
  let current = item;

  while (current.parent) {
    current = current.parent;
    path = `${current.data.key} > ${path}`;
  }

  return path;
}

const RefNodeList: React.RefForwardingComponent<NodeListRef, NodeListProps> = (props, ref) => {
  const {
    prefixCls,
    data,
    selectable,
    checkable,
    treeExpandedKeys,
    selectedKeys,
    checkedKeys,
    loadedKeys,
    loadingKeys,
    halfCheckedKeys,
    keyEntities,
    disabled,
    dropPosition,
    motion,

    height,
    itemHeight,
    virtual,

    focusable,
    activeItem,
    focused,
    tabIndex,

    onKeyDown,
    onFocus,
    onActiveChange,

    ...domProps
  } = props;

  // =============================== Ref ================================
  const listRef = React.useRef<VirtualList<FlattenNode>>(null);
  React.useImperativeHandle(ref, () => ({
    scrollTo: scroll => {
      listRef.current.scrollTo(scroll);
    },
  }));

  // ============================== Motion ==============================
  const [disableVirtual, setDisableVirtual] = React.useState(false);
  const [prevExpandedKeys, setPrevExpandedKeys] = React.useState(treeExpandedKeys);
  const [prevData, setPrevData] = React.useState(data);
  const [transitionData, setTransitionData] = React.useState(data);

  // Do animation if expanded keys changed
  React.useEffect(() => {
    setPrevExpandedKeys(treeExpandedKeys);

    const diffExpanded = findExpandedKeys(prevExpandedKeys, treeExpandedKeys);

    if (diffExpanded.key !== null) {
      if (diffExpanded.add) {
        const keyIndex = prevData.findIndex(({ data: { key } }) => key === diffExpanded.key);

        if (motion) setDisableVirtual(true);

        const newTransitionData: FlattenNode[] = prevData.slice();
        newTransitionData.splice(keyIndex + 1, 0, MotionFlattenData);

        setTransitionData(newTransitionData);
        // setTransitionRange(rangeNodes);
        // setMotionType('show');
      } else {
        const keyIndex = data.findIndex(({ data: { key } }) => key === diffExpanded.key);

        if (motion) setDisableVirtual(true);

        const newTransitionData: FlattenNode[] = data.slice();
        newTransitionData.splice(keyIndex + 1, 0, MotionFlattenData);

        setTransitionData(newTransitionData);
        // setTransitionRange(rangeNodes);
        // setMotionType('hide');
      }
    } else if (prevData !== data) {
      // If whole data changed, we just refresh the list
      setPrevData(data);
      setTransitionData(data);
    }
  }, [treeExpandedKeys, data]);

  const mergedData = motion ? transitionData : data;

  const treeNodeRequiredProps = {
    treeExpandedKeys,
    selectedKeys,
    loadedKeys,
    loadingKeys,
    checkedKeys,
    halfCheckedKeys,
    dropPosition,
    keyEntities,
  };
  return (
    <React.Fragment>
      {focused && activeItem && (
        <span id="test" style={HIDDEN_STYLE} aria-live="assertive">
          {getAccessibilityPath(activeItem)}
        </span>
      )}

      <div role="tree">
        <input
          style={HIDDEN_STYLE}
          disabled={focusable === false || disabled}
          tabIndex={focusable !== false ? tabIndex : null}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          value=""
          onChange={noop}
        />
      </div>

      <VirtualList<FlattenNode>
        {...domProps}
        disabled={disableVirtual}
        data={mergedData}
        itemKey={itemKey}
        height={height}
        fullHeight={false}
        virtual={virtual}
        itemHeight={itemHeight}
        prefixCls={`${prefixCls}-list`}
        ref={listRef}
      >
        {(treeNode: FlattenNode) => {
          const {
            pos,
            data: { key, ...restProps },
            isStart,
            isEnd,
          } = treeNode;
          const mergedKey = getKey(key, pos);
          delete restProps.children;

          const treeNodeProps = getTreeNodeProps(mergedKey, treeNodeRequiredProps);

          return (
            <TreeNode
              {...restProps}
              {...treeNodeProps}
              active={activeItem && key === activeItem.data.key}
              pos={pos}
              data={treeNode.data}
              isStart={isStart}
              isEnd={isEnd}
              treeNodeRequiredProps={treeNodeRequiredProps}
            />
          );
        }}
      </VirtualList>
    </React.Fragment>
  );
};

const NodeList = React.forwardRef(RefNodeList);
NodeList.displayName = 'NodeList';

export default NodeList;
