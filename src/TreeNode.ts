// TODO: unit tests
// TODO: comparator, sorting, matcher, encapsulating methods (addChild...)

export type TreeNodeOptions = {
  expanded?: boolean;
  highlighted?: boolean;
  collapsable?: boolean;
  position?: number;
};

export type TraverseCallback<T> = (node: TreeNode<T>) => void;

export type FindCallback<T> = (nodeData: T) => boolean;

/**
 * Tree node
 */

export class TreeNode<T> {
  public static nextId = 0;

  public type = 'node';

  public id: number;
  public data: T;
  public parent?: TreeNode<T>;
  public children: Array<TreeNode<T>>;

  public expanded: boolean;
  public highlighted: boolean;
  public collapsable: boolean;
  public level: number;
  public maxChildLevel: number;

  public constructor(data: T, parent?: TreeNode<T>, options: TreeNodeOptions = {}) {
    this.id = TreeNode.nextId;
    TreeNode.nextId += 1;

    this.data = data;
    this.children = [];
    this.expanded = options.expanded || true;
    this.highlighted = options.highlighted || false;
    this.collapsable = options.collapsable || true;
    this.maxChildLevel = 0;

    if (parent) {
      this.parent = parent;
      this.level = parent.level + 1;

      if (options.position !== undefined) {
        parent.children.splice(options.position, 0, this);
      } else {
        parent.children.push(this);
      }
    } else {
      this.parent = undefined;
      this.level = 0;
    }
  }

  public toString(): string {
    return `${this.id}:${this.expanded.toString()}`;
  }

  public haveChildren = (): boolean => this.children.length > 0;

  public path(): Array<number> {
    if (this.parent) {
      const parentChildren = this.parent.children;
      const parentPath = this.parent.path();
      const myIndex = parentChildren.indexOf(this);
      return [...parentPath, myIndex];
    }
    return [];
  }

  // traversal

  public _preOrder(node: TreeNode<T>, fn: TraverseCallback<T>) {
    fn(node);
    for (const childNode of node.children) {
      this._preOrder(childNode, fn);
    }
  }

  public _postOrder(node: TreeNode<T>, fn: TraverseCallback<T>) {
    for (const childNode of node.children) {
      this._postOrder(childNode, fn);
    }
    fn(node);
  }

  public traverseDFS(fn: TraverseCallback<T>, postOrder = false) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias,unicorn/no-this-assignment
    const current = this;
    if (postOrder) {
      this._postOrder(current, fn);
    } else {
      this._preOrder(current, fn);
    }
  }

  public traverseBFS(fn: TraverseCallback<T>) {
    const queue: TreeNode<T>[] = [this];

    while (queue.length > 0) {
      const node = queue.shift();
      if (node) {
        fn(node);
        queue.push(...node.children);
      }
    }
  }

  public traverseToRoot(fn: TraverseCallback<T>) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias,unicorn/no-this-assignment
    let current: TreeNode<T> | undefined = this;
    while (current) {
      fn(current);
      current = current.parent;
    }
  }

  // queries

  public findBFS(data: T | FindCallback<T>): TreeNode<T> | undefined {
    const queue: TreeNode<T>[] = [this];

    while (queue.length > 0) {
      const node = queue.shift() as TreeNode<T>;
      if (typeof data === 'function') {
        if ((data as FindCallback<T>)(node.data)) return node;
      } else if (data === node.data) {
        return node;
      }
      queue.push(...node.children);
    }
    return;
  }

  public isAllExpanded(): boolean {
    const queue: TreeNode<T>[] = [this];

    while (queue.length > 0) {
      const node = queue.shift();
      if (node) {
        if (!node.expanded) {
          return false;
        }
        queue.push(...node.children);
      }
    }
    return true;
  }

  // transformations

  public expandAll() {
    this.traverseBFS((node: TreeNode<T>) => {
      node.expanded = true;
    });
  }

  public collapseAll(minLevelToCollapse = 0) {
    this.traverseBFS((node: TreeNode<T>) => {
      if (node.collapsable) {
        node.expanded = node.level < minLevelToCollapse;
      }
    });
  }
}
