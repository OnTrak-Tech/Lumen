import OBSWebSocket from 'obs-websocket-js';

export class OBSConnector {
  private obs = new OBSWebSocket();
  private isConnected = false;

  public async connect(host = 'localhost', port = 4455, password = ''): Promise<boolean> {
    try {
      await this.obs.connect(`ws://${host}:${port}`, password);
      this.isConnected = true;
      console.log('[OBS] Connected successfully');
      return true;
    } catch (err) {
      this.isConnected = false;
      console.warn('[OBS] Connection failed:', err);
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.obs.disconnect();
      this.isConnected = false;
    }
  }

  public getStatus(): boolean {
    return this.isConnected;
  }

  public async setSourceVisible(sourceName = 'Lumen Verse Overlay', visible: boolean): Promise<boolean> {
    if (!this.isConnected) return false;

    try {
      const { currentProgramSceneName } = await this.obs.call('GetCurrentProgramScene');
      const { sceneItems } = await this.obs.call('GetSceneItemList', {
        sceneName: currentProgramSceneName
      });

      const item = sceneItems.find((s: any) => s.sourceName === sourceName);
      if (item) {
        await this.obs.call('SetSceneItemEnabled', {
          sceneName: currentProgramSceneName,
          sceneItemId: (item as any).sceneItemId,
          sceneItemEnabled: visible
        });
        return true;
      }
    } catch (err) {
      console.warn(`[OBS] Failed to toggle source "${sourceName}":`, err);
    }
    return false;
  }
}

export const obsConnector = new OBSConnector();
