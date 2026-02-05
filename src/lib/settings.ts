
import { store } from './store';

// This file is deprecated. Settings are now managed directly in the store.
// Access settings via `store.settings`.
export const inMemorySettings: { [key: string]: any } = store.settings;
