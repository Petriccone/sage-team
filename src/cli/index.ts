#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init';
import { startCommand } from './commands/start';
import { resumeCommand } from './commands/resume';
import { configCommand } from './commands/config';
import { teamCommand } from './commands/team';
import { statusCommand } from './commands/status';
import { doctorCommand } from './commands/doctor';
import { logsCommand } from './commands/logs';

export function buildProgram(): Command {
  const program = new Command();

  program
    .name('sage-team')
    .description('AI-powered autonomous software company')
    .version('3.4.5');

  program.addCommand(initCommand());
  program.addCommand(startCommand());
  program.addCommand(resumeCommand());
  program.addCommand(configCommand());
  program.addCommand(teamCommand());
  program.addCommand(statusCommand());
  program.addCommand(doctorCommand());
  program.addCommand(logsCommand());

  return program;
}

// Only run if executed directly
if (require.main === module) {
  const program = buildProgram();
  program.parse(process.argv);
}
