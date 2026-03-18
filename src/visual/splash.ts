import chalk from 'chalk';
import figlet from 'figlet';

export function renderSplash(): string {
  const banner = figlet.textSync('SAGE TEAM', {
    font: 'ANSI Shadow',
    horizontalLayout: 'default',
  });

  const colored = banner
    .split('\n')
    .map((line, i) => {
      const colors = [
        chalk.hex('#6366f1'),
        chalk.hex('#818cf8'),
        chalk.hex('#a5b4fc'),
        chalk.hex('#818cf8'),
        chalk.hex('#6366f1'),
        chalk.hex('#4f46e5'),
      ];
      return colors[i % colors.length](line);
    })
    .join('\n');

  const version = chalk.gray('v1.0.0');
  const subtitle = chalk.hex('#a5b4fc')('AI-Powered Autonomous Software Company');
  const line = chalk.gray('─'.repeat(56));

  return `
${colored}
${line}
  ${subtitle}  ${version}
${line}

  ${chalk.white('11 Autonomous AI Agents')}  ${chalk.gray('·')}  ${chalk.white('Real-time 2D Office')}
  ${chalk.white('Powered by Claude')}  ${chalk.gray('·')}  ${chalk.white('Agile Workflow')}

  ${chalk.yellow('Agents:')}
  ${chalk.hex('#fbbf24')('👑 Sage')} CEO  ${chalk.hex('#22d3ee')('🔬 Nova')} CTO  ${chalk.hex('#4ade80')('⚡ Dex')} Sr.Dev
  ${chalk.hex('#60a5fa')('🌊 Flux')} FullStack  ${chalk.hex('#f87171')('🔍 Quinn')} QA  ${chalk.hex('#e879f9')('🚀 Gage')} DevOps
  ${chalk.white('📋 Morgan')} PM  ${chalk.hex('#fbbf24')('🎨 Uma')} UX  ${chalk.hex('#22d3ee')('🏛️ Aria')} Architect
  ${chalk.hex('#4ade80')('🌀 River')} Scrum  ${chalk.hex('#60a5fa')('📊 Atlas')} Data

${line}
`;
}

export function renderLoading(step: string, current: number, total: number): string {
  const progress = Math.floor((current / total) * 30);
  const bar =
    chalk.hex('#6366f1')('█'.repeat(progress)) +
    chalk.gray('░'.repeat(30 - progress));

  return `  ${bar} ${chalk.white(`${current}/${total}`)} ${chalk.gray(step)}`;
}

export function renderSuccess(message: string): string {
  return `  ${chalk.green('✓')} ${chalk.white(message)}`;
}

export function renderError(message: string): string {
  return `  ${chalk.red('✗')} ${chalk.red(message)}`;
}

export function renderInfo(message: string): string {
  return `  ${chalk.blue('ℹ')} ${chalk.gray(message)}`;
}
