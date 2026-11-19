// =====================================================
// LOCK DE ESCRITA
// Toda escrita que gera ID (último ID + 1) roda dentro de executarComLock
// pra dois usuários salvando ao mesmo tempo não pegarem o mesmo ID.
// Reentrante: se uma função com lock chama outra que também pede lock
// (ex.: salvarChamadoBackend -> adicionarHistoricoSistema), a de dentro
// só executa, sem tentar travar de novo.
// =====================================================
let lockScriptAtivo_ = false;

function executarComLock(fn, timeoutMs) {
  if (lockScriptAtivo_) return fn();
  const lock = LockService.getScriptLock();
  lock.waitLock(timeoutMs || 30000);
  lockScriptAtivo_ = true;
  try {
    return fn();
  } finally {
    lockScriptAtivo_ = false;
    SpreadsheetApp.flush(); // grava pendências antes de liberar pro próximo
    lock.releaseLock();
  }
}
