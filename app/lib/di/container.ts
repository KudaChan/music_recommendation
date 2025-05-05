// Simple dependency injection container
type Constructor<T = any> = new (...args: any[]) => T;
type Factory<T = any> = () => T;

class Container {
  private instances: Map<string, any> = new Map();
  private factories: Map<string, Factory> = new Map();
  
  // Register a singleton instance
  register<T>(key: string, instance: T): void {
    this.instances.set(key, instance);
  }
  
  // Register a factory function
  registerFactory<T>(key: string, factory: Factory<T>): void {
    this.factories.set(key, factory);
  }
  
  // Register a class to be instantiated when requested
  registerClass<T>(key: string, Class: Constructor<T>, ...args: any[]): void {
    this.factories.set(key, () => new Class(...args));
  }
  
  // Get an instance
  get<T>(key: string): T {
    // Return existing instance if available
    if (this.instances.has(key)) {
      return this.instances.get(key) as T;
    }
    
    // Create instance from factory if available
    if (this.factories.has(key)) {
      const factory = this.factories.get(key)!;
      const instance = factory();
      this.instances.set(key, instance);
      return instance as T;
    }
    
    throw new Error(`No provider registered for key: ${key}`);
  }
  
  // Clear all registrations
  clear(): void {
    this.instances.clear();
    this.factories.clear();
  }
}

// Export singleton instance
export const container = new Container();