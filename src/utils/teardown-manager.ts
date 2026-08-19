export type CleanupTask = () => Promise<void>;

export class TeardownManager {
  private static tasks: CleanupTask[] = [];

  /**
   * Registers a cleanup task to be executed during teardown
   */
  static register(task: CleanupTask): void {
    this.tasks.push(task);
  }

  /**
   * Executes all registered teardown tasks in LIFO order
   */
  static async executeAll(): Promise<void> {
    while (this.tasks.length > 0) {
      const task = this.tasks.pop();
      if (task) {
        try {
          await task();
        } catch {
          // Silent swallow during emergency teardown execution
        }
      }
    }
  }

  /**
   * Clears the registered tasks without executing
   */
  static clear(): void {
    this.tasks = [];
  }
}
