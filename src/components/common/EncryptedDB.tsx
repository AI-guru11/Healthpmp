import { CryptoEngine } from '../../lib/crypto/aes-encryption';
import localForage from 'localforage';

export class EncryptedDB {
  private store: LocalForage;
  private encryptionKey: CryptoKey | null = null;

  constructor(storeName: string) {
    this.store = localForage.createInstance({
      name: 'HealthCoachDB',
      storeName
    });
  }

  async init(password: string) {
    this.encryptionKey = await CryptoEngine.deriveKey(password);
  }

  async save(key: string, data: any) {
    if (!this.encryptionKey) throw new Error('DB not initialized');
    const encrypted = await CryptoEngine.encrypt(JSON.stringify(data), this.encryptionKey);
    await this.store.setItem(key, encrypted);
  }

  async getItem(key: string) {
    if (!this.encryptionKey) throw new Error('DB not initialized');
    const encrypted = await this.store.getItem<string>(key);
    if (!encrypted) return null;
    return JSON.parse(await CryptoEngine.decrypt(encrypted, this.encryptionKey));
  }

  async getItemsSince(timestamp: number) {
    const items: any[] = [];
    await this.store.iterate((value: string) => {
      if (!this.encryptionKey) return;
      CryptoEngine.decrypt(value, this.encryptionKey).then(decrypted => {
        const item = JSON.parse(decrypted);
        if (item.timestamp > timestamp) items.push(item);
      });
    });
    return items;
  }

  async removeItem(key: string) {
    await this.store.removeItem(key);
  }
}
