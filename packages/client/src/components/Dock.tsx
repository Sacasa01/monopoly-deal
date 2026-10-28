import React, { useState } from 'react';
import { BookOpen, History, Volume2, VolumeX, LogOut, X } from 'lucide-react';

interface DockProps {
  playsRemaining?: number;
  actionLog?: { timestamp: number; text: string }[];
  onLeaveRoom?: () => void;
}

export const Dock: React.FC<DockProps> = ({
  playsRemaining = 3,
  actionLog = [],
  onLeaveRoom
}) => {
  const [showRules, setShowRules] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  return (
    <>
      {/* 70px Vertical Dock */}
      <aside className="w-[70px] h-full glass-dock flex flex-col items-center justify-between py-4 z-30 shrink-0">
        {/* Top: macOS Traffic Lights */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-1.5 pt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] shadow-sm" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] shadow-sm" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] shadow-sm" />
          </div>

          {/* Turn Plays Remaining Badge */}
          <div
            className="flex flex-col items-center justify-center w-11 h-11 rounded-xl bg-gamehub-cyan/15 border border-gamehub-cyan/30 text-gamehub-cyan shadow-cyan-glow"
            title="Jugadas restantes en este turno"
          >
            <span className="text-[9px] font-black uppercase">Jugadas</span>
            <span className="text-sm font-black font-mono leading-none">{playsRemaining}/3</span>
          </div>
        </div>

        {/* Center: Navigation Buttons */}
        <nav className="flex flex-col items-center gap-3">
          {/* Rules Reference Sheet Button */}
          <button
            type="button"
            onClick={() => setShowRules(true)}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
              showRules
                ? 'bg-white/15 text-white shadow-halo ring-1 ring-white/30'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
            title="Cartas de Referencia de Reglas"
          >
            <BookOpen className="w-5 h-5" />
          </button>

          {/* Match Log Button */}
          <button
            type="button"
            onClick={() => setShowLog(true)}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
              showLog
                ? 'bg-white/15 text-white shadow-halo ring-1 ring-white/30'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
            title="Historial de Jugadas"
          >
            <History className="w-5 h-5" />
          </button>

          {/* Audio Toggle Button */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
            title={soundEnabled ? 'Silenciar Efectos' : 'Activar Sonido'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </nav>

        {/* Bottom: Leave Game Button */}
        <div>
          {onLeaveRoom && (
            <button
              type="button"
              onClick={onLeaveRoom}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/15 transition-all"
              title="Salir de la partida"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>

      {/* Rules Reference Modal */}
      {showRules && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setShowRules(false)}
        >
          <div
            className="glass-modal max-w-3xl w-full max-h-[85vh] rounded-2xl p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-2 text-gamehub-cyan">
                <BookOpen className="w-6 h-6" />
                <h3 className="text-xl font-bold text-white">Reglas Oficiales Monopoly Deal</h3>
              </div>
              <button
                onClick={() => setShowRules(false)}
                className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 text-sm text-white/80 leading-relaxed">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <h4 className="font-bold text-gamehub-gold mb-1">🎯 Objetivo del Juego</h4>
                <p>
                  Sé el primer jugador en reunir <strong>3 conjuntos completos de propiedades</strong> de colores diferentes en tu mesa durante tu propio turno.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <h4 className="font-bold text-gamehub-cyan mb-1">🔄 Turno de Juego</h4>
                <ol className="list-decimal list-inside space-y-1 text-white/70">
                  <li><strong>Robar 2 cartas</strong> al iniciar tu turno (o 5 si tu mano está vacía).</li>
                  <li><strong>Jugar hasta 3 cartas</strong>: poner dinero o acciones en tu banco, bajar propiedades, o usar cartas de acción.</li>
                  <li><strong>Fin de turno</strong>: si te quedan más de 7 cartas en mano, descarta el exceso al mazo de descarte.</li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <h4 className="font-bold text-gamehub-orange mb-1">💰 Pagos y Deudas</h4>
                <p>
                  Las deudas solo se pagan con cartas que ya están sobre tu mesa (Banco o Propiedades). Tu mano es inmune y nunca se toca. Si no tienes dinero suficiente, debes entregar todo lo que tengas en mesa (quedando insolvente pero sin arrastrar deuda). <strong>¡Nunca se da cambio!</strong>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <h4 className="font-bold text-emerald-400 mb-1">🏠 Casas y Hoteles</h4>
                <p>
                  Solo pueden colocarse sobre conjuntos completos (excepto Estaciones y Servicios). Una Casa añade +$3M a la renta; un Hotel requiere previamente una Casa y añade +$4M.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Match Log Drawer Modal */}
      {showLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setShowLog(false)}
        >
          <div
            className="glass-modal max-w-xl w-full max-h-[80vh] rounded-2xl p-6 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2 text-gamehub-cyan">
                <History className="w-5 h-5" />
                <h3 className="text-lg font-bold text-white">Historial de Partida</h3>
              </div>
              <button
                onClick={() => setShowLog(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {actionLog.length === 0 ? (
                <div className="text-center text-xs text-white/40 py-8">No hay acciones registradas.</div>
              ) : (
                actionLog
                  .slice()
                  .reverse()
                  .map((entry, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-xs text-white/80 flex items-start justify-between gap-3"
                    >
                      <span>{entry.text}</span>
                      <span className="text-[10px] text-white/40 shrink-0 font-mono">
                        {new Date(entry.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
