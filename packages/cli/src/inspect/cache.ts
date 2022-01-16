import { Cache } from '../types';

class Node<TKey, TValue> {
  constructor(
    public key: TKey,
    public value: TValue,
    public next?: Node<TKey, TValue>,
    public prev?: Node<TKey, TValue>,
  ) {}
}

/**
 * A very simple Least Recently Used cache,
 * Inspired by https://medium.com/dsinjs/implementing-lru-cache-in-javascript-94ba6755cda9
 */
export class LRUCache<TKey, TValue> implements Cache<TKey, TValue> {
  private size = 0;
  private head?: Node<TKey, TValue>;
  private tail?: Node<TKey, TValue>;
  private map = new Map<TKey, Node<TKey, TValue>>();

  constructor(public limit = 10000) {}

  private detach(node: Node<TKey, TValue>) {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  set(key: TKey, value: TValue): TValue {
    const existingNode = this.map.get(key);
    if (existingNode) {
      this.detach(existingNode);
      this.size--;
    } else if (this.size === this.limit && this.tail) {
      this.map.delete(this.tail.key);
      this.detach(this.tail);
      this.size--;
    }

    if (!this.head) {
      this.head = this.tail = new Node(key, value);
    } else {
      const node = new Node(key, value, this.head);
      this.head.prev = node;
      this.head = node;
    }

    this.map.set(key, this.head);
    this.size++;

    return value;
  }

  get(key: TKey): TValue | undefined {
    const existingNode = this.map.get(key);
    if (existingNode) {
      const value = existingNode.value;
      if (this.head !== existingNode) {
        this.set(key, value);
      }
      return value;
    }
    return undefined;
  }

  clear() {
    this.head = undefined;
    this.tail = undefined;
    this.size = 0;
    this.map = new Map();
  }
}
