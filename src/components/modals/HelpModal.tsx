import { Keyboard, Lightbulb, X } from "lucide-react";
import React, { useEffect } from "react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SNIPPETS: [string, string][] = [
  ["!", "Molde completo de novo cântico"],
  ["t ou title", "{title: ...}"],
  ["sb ou subtitle", "{subtitle: ...}"],
  ["a ou artist", "{artist: ...}"],
  ["k ou key", "{key: C}"],
  ["tempo", "{tempo: 120}"],
  ["duration", "{duration: 4:00}"],
  ["capo", "{capo: ...}"],
  ["youtube", "{youtube: url}"],
  ["c ou comment", "{comment: ...}"],
  ["cb ou column", "{column_break}"],
  ["cc", "{chorus} (Repete o último refrão)"],
  ["chorus", "Bloco de Refrão {start_of_chorus...}"],
  ["verse", "Bloco de Verso {start_of_verse...}"],
  ["bridge", "Bloco de Ponte {start_of_bridge...}"],
  ["tab", "Bloco de Tablatura {start_of_tab...}"],
  ["soc / eoc", "Inicia / Termina Refrão"],
  ["sov / eov", "Inicia / Termina Verso"],
  ["sob / eob", "Inicia / Termina Ponte"],
  ["sot / eot", "Inicia / Termina Tablatura"],
  ["d ou define", "{define: ...}"],
  ["album", "{album: ...}"],
  ["arranger", "{arranger: ...}"],
  ["composer", "{composer: ...}"],
  ["copyright", "{copyright: ...}"],
  ["lyricist", "{lyricist: ...}"],
  ["year", "{year: 2024}"],
  ["meta", "{meta: etiqueta valor}"],
];

const SHORTCUTS: [string, string][] = [
  ["CTRL + S", "Guardar o cântico"],
  ["ALT + V", "Envolver seleção num Verso"],
  ["ALT + R", "Envolver seleção num Refrão"],
  ["ALT + B", "Envolver seleção numa Ponte"],
  ["CTRL + ESPAÇO", "Sugerir acordes já usados (↓/↑ e ENTER)"],
  ["CTRL + F", "Pesquisar no texto"],
  ["CTRL + H", "Pesquisar e Substituir"],
  ["CTRL + D", "Remover linha atual"],
  ["CTRL + SHIFT + D", "Duplicar linha ou seleção"],
  ["ALT + SHIFT + ↑", "Copiar linha para cima"],
  ["ALT + SHIFT + ↓", "Copiar linha para baixo"],
  ["ALT + 0", "Colapsar todas as secções"],
  ["ALT + SHIFT + 0", "Expandir todas as secções"],
  ["ESC", "Fechar pesquisa, sugestões ou esta janela"],
];

// Componente visual para as teclas
const Key = ({ children }: { children: React.ReactNode }) => (
  <kbd className="inline-flex items-center justify-center min-w-6 px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 shadow-[0_2px_0_0_rgba(15,23,42,0.1)] dark:shadow-[0_2px_0_0_rgba(0,0,0,0.5)] text-[10px] sm:text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
    {children}
  </kbd>
);

// Função auxiliar para renderizar combinações de teclas bonitas
const renderShortcut = (shortcut: string) => {
  return shortcut.split(" + ").map((key, index, array) => (
    <React.Fragment key={key}>
      <Key>{key}</Key>
      {index < array.length - 1 && (
        <span className="text-slate-400 text-xs">+</span>
      )}
    </React.Fragment>
  ));
};

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  // Fechar no ESCape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-100 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Fixo */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <h2 className="text-sm font-black uppercase tracking-widest text-primary dark:text-sky-400 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Guia Rápido do Editor
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="overflow-y-auto p-6 grid md:grid-cols-2 gap-8 md:gap-12">
          {/* Coluna 1: Snippets */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-primary dark:text-sky-400">
              <h3 className="text-lg font-bold">Snippets Inteligentes</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              Escreva uma das siglas abaixo numa linha vazia e prima{" "}
              <Key>TAB</Key> para o editor preencher automaticamente.
            </p>

            <div className="space-y-1.5">
              {SNIPPETS.map(([trigger, result]) => (
                <div
                  key={trigger}
                  className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/60 group hover:bg-slate-50 dark:hover:bg-slate-800/30 px-2 -mx-2 rounded-lg transition-colors"
                >
                  <code className="text-[11px] sm:text-xs font-mono font-bold text-primary dark:text-sky-400 bg-blue-50 dark:bg-sky-900/30 px-2 py-1 rounded">
                    {trigger}
                  </code>
                  <span className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 text-right">
                    {result}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50/50 dark:bg-sky-900/10 rounded-xl border border-blue-100 dark:border-sky-900/30 flex gap-3">
              <Lightbulb className="w-5 h-5 text-primary dark:text-sky-400 shrink-0 mt-0.5" />
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <strong className="text-primary dark:text-sky-400">
                  Dica de preenchimento:
                </strong>{" "}
                Ao inserir um snippet, o texto temporário fica selecionado.
                Basta escrever por cima. Prima <Key>TAB</Key> novamente para
                saltar para o campo seguinte!
              </p>
            </div>
          </div>

          {/* Coluna 2: Atalhos */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-primary dark:text-sky-400">
              <Keyboard className="w-5 h-5" />
              <h3 className="text-lg font-bold">Atalhos de Teclado</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              Acelere a edição e navegação sem precisar de tirar as mãos do
              teclado.
            </p>

            <div className="space-y-1.5">
              {SHORTCUTS.map(([key, action]) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800/60 group hover:bg-slate-50 dark:hover:bg-slate-800/30 px-2 -mx-2 rounded-lg transition-colors gap-4"
                >
                  <div className="flex items-center gap-1.5 shrink-0">
                    {renderShortcut(key)}
                  </div>
                  <span className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 text-right leading-snug">
                    {action}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
