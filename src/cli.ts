import { run } from './dt';

const code = process.argv.slice(2);

console.debug({code});

const result = run(code);

console.debug({result});
