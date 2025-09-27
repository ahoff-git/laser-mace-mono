/** Represents a single queued command entry */
export interface CommandEntry<T = any> {
  command: T;
  timestamp: number;
  processed: boolean;
}

export interface CommandQueueOptions {
      retentionMs?: number;
  }
  
/**
 * CommandQueueManager maintains a timestamped command queue
 * with automatic expiration and processed flags.
 *
 * Example:
 * const queue = new CommandQueueManager({ retentionMs: 1000 });
 * queue.enqueue({ type: 'move' });
 * const cmds = queue.flush(); // returns unprocessed, valid commands
 */
export class CommandQueueManager<T = any> {
  private queue: CommandEntry<T>[] = [];

  private retentionMs: number;

  constructor(commandQueueOptions:CommandQueueOptions) {
    const {retentionMs = 1000} = commandQueueOptions;
    this.retentionMs = retentionMs;
  }

  /** Adds a command to the queue */
  enqueue(command: T): void {
    this.queue.push({
      command,
      timestamp: Date.now(),
      processed: false,
    });
  }

  /**
   * Returns all unprocessed, non-expired commands,
   * marks them as processed.
   */
  flush(): T[] {
    const now = Date.now();
    const validCommands: T[] = [];

    for (const entry of this.queue) {
      if (!entry.processed && now - entry.timestamp <= this.retentionMs) {
        validCommands.push(entry.command);
        entry.processed = true;
      }
    }

    this.purgeExpired(now);
    return validCommands;
  }

  /** Returns a copy of the entire queue (processed or not, unfiltered) */
  getAll(): Array<{ command: T; timestamp: number; processed: boolean }> {
    return [...this.queue];
  }

  /** Removes expired commands from queue */
  private purgeExpired(now: number = Date.now()): void {
    this.queue = this.queue.filter(
      (entry) => now - entry.timestamp <= this.retentionMs
    );
  }

  /** Returns total number of unexpired commands (processed or not) */
  size(): number {
    return this.queue.length;
  }

  /** Manually clear the entire queue */
  clear(): void {
    this.queue = [];
  }

  /** Mark a command as processed manually (if needed) */
  markProcessed(target: T): void {
    for (const entry of this.queue) {
      if (entry.command === target) {
        entry.processed = true;
      }
    }
  }
}
