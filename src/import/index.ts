import { ChordProImportProvider } from "./chordpro";
import { SongImportRegistry } from "./registry";

export const songImportRegistry = new SongImportRegistry();

songImportRegistry.register(new ChordProImportProvider());
