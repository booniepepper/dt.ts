import { printlns, run } from './dt';

const endState = run(process.argv.slice(2));

if (endState.stack.length > 0) {
    printlns(endState.stack.pop());
}
