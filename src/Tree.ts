import { TreeNode } from './TreeNode';
import type { TreeNodeOptions, TraverseCallback, FindCallback } from './TreeNode';

export type FlattenOptions<T> = { expandedOnly: boolean } | ((node: TreeNode<T>) => boolean);

/**
 *
 */
export class Tree<T> {
  private static defaultFlattenOptions = { expandedOnly: true };

  public root?: TreeNode<T>;

  //
  // operations
  //

  public add(data: T, parentNode?: TreeNode<T>, options: TreeNodeOptions = {}): TreeNode<T> {
    if (!parentNode && this.root) {
      throw new Error('Root node is already assigned');
    }
    const node = new TreeNode(data, parentNode, options);
    if (!parentNode) {
      this.root = node;
    } else {
      this._calculateMaxChildLevel(node);
    }
    return node;
  }

  public addAll(
    dataArray: Array<T>,
    parentNode: TreeNode<T>,
    options: TreeNodeOptions & { prepend?: boolean; position?: number },
  ): void {
    let position = 0;
    for (const data of dataArray) {
      const addOptions = { ...options };
      if (options.prepend) addOptions.position = position;
      this.add(data, parentNode, addOptions);
      position += 1;
    }
  }

  public remove(node: TreeNode<T>): TreeNode<T> {
    if (!node.parent) {
      this.root = undefined;
      return node;
    }
    const children = node.parent.children;
    children.splice(children.indexOf(node), 1);

    // calculate maxChildrenLevel
    node.parent &&
      this.traverseToRoot(node.parent, (n: TreeNode<T>) => {
        n.maxChildLevel = n.children.reduce(
          (accumulator: number, n2: TreeNode<T>) =>
            n2.maxChildLevel + 1 > accumulator ? n2.maxChildLevel + 1 : accumulator,
          0,
        );
      });

    return node;
  }

  public move(sourceNode: TreeNode<T>, targetNode: TreeNode<T>): void {
    this.print();
    if (sourceNode === targetNode || !sourceNode.parent) return;

    this.remove(sourceNode);
    sourceNode.parent = targetNode;
    targetNode.children.splice(0, 0, sourceNode); // add as child on first position

    // update sourceNode's subtree level
    this.traverseDFS((node: TreeNode<T>) => {
      node.level = node.parent ? node.parent.level + 1 : 0;
    }, sourceNode);

    this._calculateMaxChildLevel(sourceNode);
    this.print();
  }

  public clear(): void {
    this.root = undefined;
  }

  //
  // queries
  //

  public contains(data: T): boolean {
    return !!this.findBFS(data);
  }

  public findInPath(path: Array<number>): TreeNode<T> {
    let node = this.root;
    for (const pathElement of path) {
      if (node) {
        node = node.children[pathElement];
      } else {
        console.warn('invalid path', path);
        break;
      }
    }
    if (!node) throw new Error('invalid path');
    return node;
  }

  // TODO: findByProperties

  public findBFS(data: T | FindCallback<T>): TreeNode<T> | undefined {
    if (!this.root) return;
    return this.root.findBFS(data);
  }

  public isAllExpanded = () => (this.root ? this.root.isAllExpanded() : false);

  //
  // traversal
  //

  public traverseDFS(fn: TraverseCallback<T>, startNode = this.root, postOrder = false) {
    if (!startNode) return;
    startNode.traverseDFS(fn, postOrder);
  }

  public traverseToRoot(node: TreeNode<T>, fn: TraverseCallback<T>) {
    node && node.traverseToRoot(fn);
  }

  //
  // transformations
  //

  public flatten(options: FlattenOptions<T>) {
    const flattened: Array<TreeNode<T>> = [];

    this.traverseDFS((node) => {
      if (typeof options === 'function') {
        if (options(node)) {
          const ancestors = [];
          for (let n: TreeNode<T> | undefined = node; n !== null && n !== undefined; n = n.parent) {
            if (!flattened.includes(n)) {
              ancestors.unshift(n);
            }
          }
          flattened.push(...ancestors);
        }
      } else {
        const flattenOptions = { ...Tree.defaultFlattenOptions, ...options };
        let shouldInclude = true;
        if (flattenOptions.expandedOnly) {
          for (let n = node.parent; n !== null && n !== undefined; n = n.parent) {
            if (!n.expanded) {
              shouldInclude = false;
              break;
            }
          }
        }
        if (shouldInclude) {
          flattened.push(node);
        }
      }
    });

    return flattened;
  }

  public expandAll(): void {
    if (this.root) {
      this.root.expandAll();
    }
  }

  public collapseAll(minLevelToCollapse?: number) {
    if (this.root) {
      this.root.collapseAll(minLevelToCollapse);
    }
  }

  //
  // output
  //

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public print(output: (...args: any) => void = console.log, indent = '  ') {
    if (!this.root) {
      return output.call(output, 'No root node found');
    }
    let treeAsString = '\n';
    this.traverseDFS((node) => {
      const padding = indent.repeat(node.level);
      const data = String(node.data); // requires toString() on data object for proper display
      const numberOfSubLevels = node.maxChildLevel;
      const path = node.path().join('-');
      treeAsString += `${padding}${data}:${numberOfSubLevels}:${path}!\n`;
    });
    return output.call(output, treeAsString);
  }

  // calculate max child level for node addition (only!)
  private _calculateMaxChildLevel(node: TreeNode<T>) {
    this.traverseToRoot(node, (n: TreeNode<T>) => {
      if (n.parent && n.maxChildLevel + 1 > n.parent.maxChildLevel) {
        n.parent.maxChildLevel = n.maxChildLevel + 1;
      }
    });
  }
}
