import React from 'react';
import { X } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SNIPPETS: [string, string][] = [
  ['!', 'Modelo de novo cântico'],
  ['artist ou a', '{artist: value}'],
  ['album', '{album: value}'],
  ['arranger', '{arranger: value}'],
  ['capo', '{capo: value}'],
  ['composer', '{composer: value}'],
  ['copyright', '{copyright: value}'],
  ['duration', '{duration: 4:00}'],
  ['key ou k', '{key: C}'],
  ['lyricist', '{lyricist: value}'],
  ['tempo', '{tempo: 120}'],
  ['title ou t', '{title: value}'],
  ['subtitle ou sb', '{subtitle: value}'],
  ['year', '{year: 2020}'],
  ['meta', '{meta: label value}'],
  ['comment ou c', '{comment: value}'],
  ['cb ou column', '{column_break}'],
  ['chorus', 'Bloco de refrão: {start_of_chorus: Chorus} ... {end_of_chorus}'],
  ['verse', 'Bloco de estrofe: {start_of_verse: Verse} ... {end_of_verse}'],
  ['bridge', 'Bloco de ponte: {start_of_bridge: Bridge} ... {end_of_bridge}'],
  ['tab', 'Bloco de tablatura: {start_of_tab} ... {end_of_tab}'],
  ['soc', '{start_of_chorus}'],
  ['eoc', '{end_of_chorus}'],
  ['sov', '{start_of_verse}'],
  ['eov', '{end_of_verse}'],
  ['sob', '{start_of_bridge}'],
  ['eob', '{end_of_bridge}'],
  ['sot', '{start_of_tab}'],
  ['eot', '{end_of_tab}'],
  ['define ou d', '{define:...}'],
  ['yt ou youtube', '{youtube: url}'],
];

const SHORTCUTS: [string, string][] = [
  ['CTRL + F', 'Procurar'],
  ['CTRL + H', 'Procurar & Substituir'],
  ['CTRL + A', 'Selecionar tudo'],
  ['CTRL + D', 'Remover linha'],
  ['CTRL + SHIFT + D', 'Duplicar linha (ou seleção)'],
  ['ALT + SHIFT + ↑', 'Copiar linha para cima'],
  ['ALT + SHIFT + ↓', 'Copiar linha para baixo'],
  ['ALT + 0', 'Colapsar tudo'],
  ['ALT + SHIFT + 0', 'Expandir tudo'],
  ['CTRL + BACKSPACE', 'Remover palavra à esquerda'],
  ['CTRL + SPACEBAR', 'Lista os acordes do cântico — use ↓/↑ para escolher e ENTER para inserir'],
  ['ESCAPE', 'Fecha a janela de Procurar ou de Acordes'],
  ['CTRL + S', 'Guardar cântico'],
];

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-m3-primary">Ajuda do Editor</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Os snippets são pedaços de marcação ChordPro que podes adicionar escrevendo algumas letras e
          pressionando <span className="font-bold">TAB</span>.
        </p>

        <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Snippets</h3>
        <table className="w-full text-xs mb-4">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <th className="py-1.5 pr-3 font-semibold">Snippet</th>
              <th className="py-1.5 font-semibold">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {SNIPPETS.map(([trigger, result]) => (
              <tr key={trigger} className="border-b border-slate-100 dark:border-slate-800/50">
                <td className="py-1.5 pr-3 font-mono text-m3-primary whitespace-nowrap">{trigger}</td>
                <td className="py-1.5 font-mono text-slate-600 dark:text-slate-300">{result}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          <span className="font-bold">Dica:</span> quando um snippet é inserido, o texto "placeholder" fica
          selecionado — basta escrever por cima. Se houver mais do que um placeholder, pressiona TAB de novo
          para passar ao seguinte.
        </p>

        <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Atalhos</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <th className="py-1.5 pr-3 font-semibold">Atalho</th>
              <th className="py-1.5 font-semibold">Ação</th>
            </tr>
          </thead>
          <tbody>
            {SHORTCUTS.map(([key, action]) => (
              <tr key={key} className="border-b border-slate-100 dark:border-slate-800/50">
                <td className="py-1.5 pr-3 font-mono text-m3-primary whitespace-nowrap">{key}</td>
                <td className="py-1.5 text-slate-600 dark:text-slate-300">{action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};