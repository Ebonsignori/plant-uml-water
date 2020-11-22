#!/usr/bin/env node
const yargs = require('yargs/yargs');
const { terminalWidth } = require('yargs');
const {
  OUTPUT_FILES,
} = require('./src/constants');

process.env.SCRIPT_PATH = process.cwd();

yargs(process.argv.slice(2))
  .usage('Usage: $0 <command> <filename.puml> [options]')
  .command('live', 'Start live reload server on <reload-port> for filename.puml', () => {}, (args) => {
    overwriteEnvs({
      FILE_NAME: args._[1],
      LIVE_RELOAD_PORT: args.livePort,
      USE_LOCAL_SERVER: args.local,
      LOCAL_SERVER_PORT: args.localPort,
    });
    require('./src/server');
  })
  .command('export', 'Export filename.puml to filename.<file-type>', () => {}, async (args) => {
    overwriteEnvs({
      FILE_NAME: args._[1],
      OUTPUT_FILE_TYPE: args.fileType,
      USE_LOCAL_SERVER: args.local,
      LOCAL_SERVER_PORT: args.localPort,
      REMOTE_PUML_SERVER: args.remoteServer,
      OUTPUT_OVERRIDE: args.output,
    });
    return require('./src/export');
  })
  .example('$0 live example.puml -p 8085', 'Run live reload server on localhost:8085')
  .example('$0 export example.puml', 'Exports example.puml to example.svg')
  .example('$0 export example.puml -t md', 'Exports example.puml as an embeded image in example.md')
  .options({
    p: {
      alias: 'live-port',
      type: 'string',
      describe: 'Port live reload server should run on',
      nargs: 1,
      default: 8088,
    },
    l: {
      alias: 'local',
      type: 'boolean',
      describe: 'Use local PlantUML server running on localhost:<live-port>',
      nargs: 1,
      default: false,
    },
    'd': {
      alias: 'local-port',
      type: 'string',
      describe: 'Port local PlantUML server is running on',
      nargs: 1,
      default: 8792,
    },
    f: {
      alias: 'file-type',
      type: 'string',
      describe: 'Output filetype of PlantUML diagram export',
      nargs: 1,
      default: 'svg',
      choices: OUTPUT_FILES,
    },
    'r': {
      alias: 'remote-server',
      type: 'string',
      describe: 'Server used for rendering embeded markdown images',
      nargs: 1,
      default: 'http://www.plantuml.com/plantuml',
    },
    o: {
      alias: 'output',
      type: 'string',
      describe: 'Output path of export. Defaults to diagrams-out/filename.<file-type>',
      nargs: 1,
    },
  })
  .wrap(Math.min(120, terminalWidth()))
  .help('h')
  .alias('h', 'help')
  .version()
  // Check that command and .puml filename are passed
  .check((argv) => {
    const filePaths = argv._;
    if (filePaths.length < 1) {
      throw new Error('Please specify command. "live" or "export"');
    } else if (filePaths.length < 2) {
      throw new Error('Must pass PlantUML (.puml) file path.');
    } else {
      return true;
    }
  })
  .argv;

function overwriteEnvs(optMap) {
  Object.entries(optMap).forEach(entry => {
    process.env[entry[0]] = entry[1];
  });
}
