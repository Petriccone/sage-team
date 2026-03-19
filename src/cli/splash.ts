import { PERSONAS } from '../agents/personas';

export function showSplash(): void {
  const art = `
  ____                    _____
 / ___|  __ _  __ _  ___|_   _|__  __ _ _ __ ___
 \\___ \\ / _\` |/ _\` |/ _ \\ | |/ _ \\/ _\` | '_ \` _ \\
  ___) | (_| | (_| |  __/ | |  __/ (_| | | | | | |
 |____/ \\__,_|\\__, |\\___| |_|\\___|\\__,_|_| |_| |_|
              |___/                          v3.0
`;
  console.log(art);
  console.log('  AI-Powered Autonomous Software Company\n');

  const roster = PERSONAS.map(p => `  ${p.emoji} ${p.name.padEnd(8)} ${p.role}`).join('\n');
  console.log(roster);
  console.log('');
}
